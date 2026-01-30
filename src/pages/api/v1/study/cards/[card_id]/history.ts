import type { APIContext } from 'astro';
import { ZodError } from 'zod';
import { StudyService } from '../../../../../../lib/services/study.service';
import { FlashcardService } from '../../../../../../lib/services/flashcard.service';
import { cardStudyHistoryQuerySchema } from '../../../../../../lib/validators/study.validators';
import { isValidUUID } from '../../../../../../lib/validators/study.validators';
import {
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
} from '../../../../../../lib/utils/error-responses';
import type { ErrorResponse } from '../../../../../../types';

export const prerender = false;

export async function GET(context: APIContext) {
  try {
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse('Authentication required');
    }

    const cardId = context.params.card_id;

    if (!cardId || !isValidUUID(cardId)) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'card_id must be a valid UUID',
          details: { field: 'card_id' },
        },
        timestamp: new Date().toISOString(),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(context.request.url);
    const queryParams = {
      limit: url.searchParams.get('limit') || undefined,
    };

    const validatedQuery = cardStudyHistoryQuerySchema.parse(queryParams);

    const flashcardService = new FlashcardService(context.locals.supabase);
    const card = await flashcardService.getFlashcardById(user.id, cardId);

    if (!card) {
      return notFoundResponse('Card not found');
    }

    const studyService = new StudyService(context.locals.supabase);
    const history = await studyService.getCardHistory(user.id, cardId, validatedQuery.limit);

    return new Response(JSON.stringify(history), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Error getting card study history:', error);
    return internalErrorResponse('An unexpected error occurred');
  }
}
