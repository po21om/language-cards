import type { APIContext } from 'astro';
import { ZodError } from 'zod';
import { FlashcardService } from '../../../../../lib/services/flashcard.service';
import { FlashcardIdParamSchema } from '../../../../../lib/validators/flashcard.validators';
import {
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
} from '../../../../../lib/utils/error-responses';
import type { FlashcardResponseDTO, ErrorResponse } from '../../../../../types';

export const prerender = false;

export async function POST(context: APIContext) {
  try {
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse('Invalid or expired authentication token');
    }

    const { id } = FlashcardIdParamSchema.parse({ id: context.params.id });

    const flashcardService = new FlashcardService(context.locals.supabase);
    const result = await flashcardService.restoreFlashcard(user.id, id);

    if (result.status === 'not_found') {
      return notFoundResponse('Flashcard not found');
    }

    if (result.status === 'not_deleted') {
      return notFoundResponse('Flashcard is not deleted');
    }

    if (result.status === 'permanently_deleted') {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'GONE',
          message: 'Flashcard permanently deleted (past 30-day retention window)',
        },
        timestamp: new Date().toISOString(),
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 410,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (result.status === 'restored' && result.flashcard) {
      const { user_id, ...flashcardResponse } = result.flashcard;
      const response: FlashcardResponseDTO = flashcardResponse;

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return internalErrorResponse('An unexpected error occurred');
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Error restoring flashcard:', error);
    return internalErrorResponse('An unexpected error occurred');
  }
}
