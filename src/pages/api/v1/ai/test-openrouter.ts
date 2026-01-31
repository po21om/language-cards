import type { APIContext } from 'astro';
import { z } from 'zod';
import { OpenRouterService } from '../../../../lib/services/openrouter.service';
import {
  validationErrorResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from '../../../../lib/utils/error-responses';

export const prerender = false;

const TestOpenRouterSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message cannot exceed 500 characters')
    .trim(),
  model: z
    .string()
    .optional()
    .default('openai/gpt-4o'),
  useJsonSchema: z
    .boolean()
    .optional()
    .default(false),
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
    const validationResult = TestOpenRouterSchema.safeParse(body);

    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const { message, model, useJsonSchema } = validationResult.data;

    const openRouterService = new OpenRouterService();

    let result;

    if (useJsonSchema) {
      const schema = {
        type: 'object',
        properties: {
          response: { type: 'string' },
          sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
        required: ['response', 'sentiment', 'confidence'],
        additionalProperties: false,
      };

      result = await openRouterService.chatCompletion({
        model,
        systemMessage: 'You are a helpful assistant that analyzes text sentiment.',
        userMessage: message,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'sentiment_analysis',
            strict: true,
            schema,
          },
        },
        temperature: 0.7,
        max_tokens: 500,
      });
    } else {
      result = await openRouterService.chatCompletion({
        model,
        systemMessage: 'You are a helpful assistant.',
        userMessage: message,
        temperature: 0.7,
        max_tokens: 500,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result,
      model,
      useJsonSchema,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in /api/v1/ai/test-openrouter:', error);

    if (error instanceof Error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return internalErrorResponse();
  }
};
