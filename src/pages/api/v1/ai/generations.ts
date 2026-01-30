import type { APIContext } from 'astro';
import { z } from 'zod';
import { AIGenerationService } from '../../../../lib/services/ai-generation.service';
import { MockAIGenerationService } from '../../../../lib/services/ai-generation-mock.service';
import { checkRateLimit } from '../../../../lib/utils/rate-limiter';
import {
  validationErrorResponse,
  unauthorizedResponse,
  rateLimitResponse,
  internalErrorResponse,
} from '../../../../lib/utils/error-responses';

export const prerender = false;

const GenerationsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  offset: z.coerce
    .number()
    .int()
    .min(0, 'Offset must be non-negative')
    .default(0),
});

export const GET = async (context: APIContext) => {
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

    const url = new URL(context.request.url);
    const queryParams = {
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
    };

    const validationResult = GenerationsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const rateLimitResult = await checkRateLimit(user.id, 'ai:history');
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

    const result = await aiService.getGenerationHistory(
      user.id,
      validationResult.data.limit,
      validationResult.data.offset
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in /api/v1/ai/generations:', error);

    if (error instanceof Error && error.message.includes('Failed to retrieve')) {
      return internalErrorResponse('Failed to retrieve generation history');
    }

    return internalErrorResponse();
  }
};
