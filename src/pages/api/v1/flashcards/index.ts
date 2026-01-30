import type { APIContext } from 'astro';
import { ZodError } from 'zod';
import { FlashcardService } from '../../../../lib/services/flashcard.service';
import {
  ListFlashcardsQuerySchema,
  CreateFlashcardSchema,
} from '../../../../lib/validators/flashcard.validators';
import {
  validationErrorResponse,
  unauthorizedResponse,
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

    const url = new URL(context.request.url);
    const queryParams = {
      status: url.searchParams.get('status') || undefined,
      source: url.searchParams.get('source') || undefined,
      tags: url.searchParams.get('tags') || undefined,
      include_deleted: url.searchParams.get('include_deleted') || undefined,
      sort: url.searchParams.get('sort') || undefined,
      order: url.searchParams.get('order') || undefined,
      limit: url.searchParams.get('limit') || undefined,
      offset: url.searchParams.get('offset') || undefined,
    };

    const validatedQuery = ListFlashcardsQuerySchema.parse(queryParams);

    const flashcardService = new FlashcardService(context.locals.supabase);
    const result = await flashcardService.listFlashcards(user.id, validatedQuery);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Error listing flashcards:', error);
    return internalErrorResponse('An unexpected error occurred');
  }
}

export async function POST(context: APIContext) {
  try {
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse('Invalid or expired authentication token');
    }

    const body = await context.request.json();
    const validatedData = CreateFlashcardSchema.parse(body);

    const flashcardService = new FlashcardService(context.locals.supabase);
    const flashcard = await flashcardService.createFlashcard(user.id, validatedData);

    const { user_id, ...flashcardResponse } = flashcard;
    const response: FlashcardResponseDTO = flashcardResponse;

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Error creating flashcard:', error);
    return internalErrorResponse('An unexpected error occurred');
  }
}
