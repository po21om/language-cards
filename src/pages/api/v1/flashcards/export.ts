import type { APIContext } from 'astro';
import { ZodError } from 'zod';
import { FlashcardService } from '../../../../lib/services/flashcard.service';
import { ExportFlashcardsQuerySchema } from '../../../../lib/validators/flashcard.validators';
import {
  validationErrorResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from '../../../../lib/utils/error-responses';
import type { ExportFlashcardsResponse } from '../../../../types';

export const prerender = false;

export async function GET(context: APIContext) {
  try {
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse('Invalid or expired authentication token');
    }

    const url = new URL(context.request.url);
    const queryParams = {
      format: url.searchParams.get('format'),
      status: url.searchParams.get('status') || undefined,
    };

    const validatedQuery = ExportFlashcardsQuerySchema.parse(queryParams);

    const flashcardService = new FlashcardService(context.locals.supabase);
    const result = await flashcardService.exportFlashcards(
      user.id,
      validatedQuery.format,
      validatedQuery.status
    );

    if (validatedQuery.format === 'json') {
      const response = result as ExportFlashcardsResponse;
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const csvContent = result as string;
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `flashcards-export-${timestamp}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Error exporting flashcards:', error);
    return internalErrorResponse('An unexpected error occurred');
  }
}
