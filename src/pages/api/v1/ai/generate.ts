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

const GenerateSchema = z.object({
  text: z
    .string()
    .min(1, 'Text cannot be empty')
    .max(1800, 'Text cannot exceed 1800 characters')
    .trim(),
  target_count: z
    .number()
    .int()
    .min(1, 'Target count must be at least 1')
    .max(20, 'Target count cannot exceed 20')
    .optional()
    .default(5),
});

export const POST = async (context: APIContext) => {
  try {
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse('Invalid or expired authentication token');
    }

    const body = await context.request.json();
    const validationResult = GenerateSchema.safeParse(body);

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const rateLimitResult = await checkRateLimit(user.id, 'ai:generate');
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

    const result = await aiService.generateFlashcards(
      validationResult.data.text,
      validationResult.data.target_count,
      user.id
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in /api/v1/ai/generate:', error);

    if (error instanceof ServiceUnavailableError) {
      return serviceUnavailableResponse(error.message);
    }

    return internalErrorResponse();
  }
};
