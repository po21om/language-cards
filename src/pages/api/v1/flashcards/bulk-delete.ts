import type { APIContext } from 'astro';
import { ZodError } from 'zod';
import { FlashcardService } from '../../../../lib/services/flashcard.service';
import { BulkDeleteSchema } from '../../../../lib/validators/flashcard.validators';
import {
  validationErrorResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from '../../../../lib/utils/error-responses';
import type { BulkDeleteResponse } from '../../../../types';

export const prerender = false;

export async function POST(context: APIContext) {
  try {
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse('Invalid or expired authentication token');
    }

    const body = await context.request.json();
    const validatedData = BulkDeleteSchema.parse(body);

    const flashcardService = new FlashcardService(context.locals.supabase);
    const result = await flashcardService.bulkDeleteFlashcards(
      user.id,
      validatedData.flashcard_ids
    );

    const response: BulkDeleteResponse = {
      deleted_count: result.deleted_count,
      deleted_ids: result.deleted_ids,
      message: `${result.deleted_count} flashcard${result.deleted_count !== 1 ? 's' : ''} soft deleted`,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Error bulk deleting flashcards:', error);
    return internalErrorResponse('An unexpected error occurred');
  }
}
