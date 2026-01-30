import type { APIContext } from 'astro';
import { z } from 'zod';
import { AIGenerationService } from '../../../../lib/services/ai-generation.service';
import { MockAIGenerationService } from '../../../../lib/services/ai-generation-mock.service';
import { checkRateLimit } from '../../../../lib/utils/rate-limiter';
import {
  validationErrorResponse,
  unauthorizedResponse,
  rateLimitResponse,
  notFoundResponse,
  internalErrorResponse,
} from '../../../../lib/utils/error-responses';

export const prerender = false;

const AcceptSchema = z.object({
  generation_id: z.string().uuid('Invalid generation ID format'),
  accepted_suggestions: z.array(
    z.object({
      suggestion_id: z.string().uuid('Invalid suggestion ID format'),
      front: z
        .string()
        .min(1, 'Front side cannot be empty')
        .max(2000, 'Front side cannot exceed 2000 characters')
        .trim(),
      back: z
        .string()
        .min(1, 'Back side cannot be empty')
        .max(2000, 'Back side cannot exceed 2000 characters')
        .trim(),
      tags: z.array(z.string()).default([]),
      status: z.enum(['review', 'active', 'archived']).default('active'),
    })
  ),
  rejected_suggestions: z.array(z.string().uuid('Invalid suggestion ID format')),
  refined_count: z.number().int().min(0, 'Refined count cannot be negative'),
});

export const POST = async (context: APIContext) => {
  try {
    const authHeader = context.request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return unauthorizedResponse();
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser(token);

    if (authError || !user) {
      return unauthorizedResponse('Invalid or expired token');
    }

    const body = await context.request.json();
    const validationResult = AcceptSchema.safeParse(body);

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const rateLimitResult = await checkRateLimit(user.id, 'ai:accept');
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult.retryAfter);
    }

    const useMock = import.meta.env.USE_MOCK_AI === 'true';
    
    let aiService;
    if (useMock) {
      aiService = new MockAIGenerationService({} as any, context.locals.supabase);
    } else {
      const apiKey = import.meta.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        console.error('OPENROUTER_API_KEY is not configured');
        return internalErrorResponse('AI service is not configured');
      }
      aiService = new AIGenerationService(
        {
          apiKey,
          model: import.meta.env.OPENROUTER_MODEL || 'openai/gpt-4',
        },
        context.locals.supabase
      );
    }

    const result = await aiService.acceptSuggestions(validationResult.data, user.id);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in /api/v1/ai/accept:', error);

    if (error instanceof Error && error.message === 'Generation log not found') {
      return notFoundResponse('Generation log not found');
    }

    if (error instanceof Error && error.message.includes('Failed to create flashcards')) {
      return internalErrorResponse('Failed to create flashcards');
    }

    return internalErrorResponse();
  }
};
