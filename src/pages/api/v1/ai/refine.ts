import type { APIContext } from 'astro';
import { z } from 'zod';
import { AIGenerationService, ServiceUnavailableError } from '../../../../lib/services/ai-generation.service';
import { MockAIGenerationService } from '../../../../lib/services/ai-generation-mock.service';
import { checkRateLimit } from '../../../../lib/utils/rate-limiter';
import {
  validationErrorResponse,
  unauthorizedResponse,
  rateLimitResponse,
  serviceUnavailableResponse,
  internalErrorResponse,
} from '../../../../lib/utils/error-responses';

export const prerender = false;

const RefineSchema = z.object({
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
  refinement_instruction: z
    .string()
    .min(1, 'Refinement instruction cannot be empty')
    .max(500, 'Refinement instruction cannot exceed 500 characters')
    .trim(),
});

export const POST = async (context: APIContext) => {
  try {
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse('Invalid or expired authentication token');
    }

    const body = await context.request.json();
    const validationResult = RefineSchema.safeParse(body);

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const rateLimitResult = await checkRateLimit(user.id, 'ai:refine');
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
        return serviceUnavailableResponse('AI service is not configured');
      }
      aiService = new AIGenerationService(
        {
          apiKey,
          model: import.meta.env.OPENROUTER_MODEL || 'openai/gpt-4',
        },
        context.locals.supabase
      );
    }

    const result = await aiService.refineSuggestion(validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in /api/v1/ai/refine:', error);

    if (error instanceof ServiceUnavailableError) {
      return serviceUnavailableResponse(error.message);
    }

    return internalErrorResponse();
  }
};
