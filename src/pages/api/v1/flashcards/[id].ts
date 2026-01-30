import type { APIContext } from 'astro';
import { ZodError } from 'zod';
import { FlashcardService } from '../../../../lib/services/flashcard.service';
import {
  FlashcardIdParamSchema,
  UpdateFlashcardSchema,
} from '../../../../lib/validators/flashcard.validators';
import {
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
} from '../../../../lib/utils/error-responses';
import type { FlashcardResponseDTO } from '../../../../types';

export const prerender = false;

export async function GET(context: APIContext) {
  try {
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse('Invalid or expired authentication token');
    }

    const { id } = FlashcardIdParamSchema.parse({ id: context.params.id });

    const flashcardService = new FlashcardService(context.locals.supabase);
    const flashcard = await flashcardService.getFlashcardById(user.id, id);

    if (!flashcard) {
      return notFoundResponse('Flashcard not found');
    }

    const { user_id, ...flashcardResponse } = flashcard;
    const response: FlashcardResponseDTO = flashcardResponse;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Error getting flashcard:', error);
    return internalErrorResponse('An unexpected error occurred');
  }
}

export async function PATCH(context: APIContext) {
  try {
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse('Invalid or expired authentication token');
    }

    const { id } = FlashcardIdParamSchema.parse({ id: context.params.id });

    const body = await context.request.json();
    const validatedData = UpdateFlashcardSchema.parse(body);

    const flashcardService = new FlashcardService(context.locals.supabase);
    const flashcard = await flashcardService.updateFlashcard(user.id, id, validatedData);

    if (!flashcard) {
      return notFoundResponse('Flashcard not found');
    }

    const { user_id, ...flashcardResponse } = flashcard;
    const response: FlashcardResponseDTO = flashcardResponse;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Error updating flashcard:', error);
    return internalErrorResponse('An unexpected error occurred');
  }
}

export async function DELETE(context: APIContext) {
  try {
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse('Invalid or expired authentication token');
    }

    const { id } = FlashcardIdParamSchema.parse({ id: context.params.id });

    const flashcardService = new FlashcardService(context.locals.supabase);
    const result = await flashcardService.softDeleteFlashcard(user.id, id);

    if (!result) {
      return notFoundResponse('Flashcard not found');
    }

    const response = {
      id: result.id,
      message: 'Flashcard soft deleted. Will be permanently removed after 30 days.',
      deleted_at: result.deleted_at,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Error deleting flashcard:', error);
    return internalErrorResponse('An unexpected error occurred');
  }
}
