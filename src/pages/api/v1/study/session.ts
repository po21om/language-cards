import type { APIContext } from 'astro';
import { ZodError } from 'zod';
import { StudyService } from '../../../../lib/services/study.service';
import { startStudySessionQuerySchema } from '../../../../lib/validators/study.validators';
import {
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
} from '../../../../lib/utils/error-responses';
import type { StartStudySessionResponse, StudyCardDTO } from '../../../../types';
import { randomUUID } from 'crypto';

export const prerender = false;

export async function POST(context: APIContext) {
  try {
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse('Authentication required');
    }

    const url = new URL(context.request.url);
    const queryParams = {
      card_count: url.searchParams.get('card_count') || undefined,
      tags: url.searchParams.get('tags') || undefined,
      status: url.searchParams.get('status') || undefined,
    };

    const validatedQuery = startStudySessionQuerySchema.parse(queryParams);

    const studyService = new StudyService(context.locals.supabase);
    const cards = await studyService.selectStudyCards(user.id, validatedQuery);

    if (cards.length === 0) {
      return notFoundResponse('No cards available for study with the specified filters');
    }

    const sessionId = randomUUID();
    const startedAt = new Date().toISOString();

    const studyCards: StudyCardDTO[] = cards.map(card => ({
      id: card.id,
      front: card.front,
      tags: card.tags,
      current_weight: card.study_weight,
    }));

    const response: StartStudySessionResponse = {
      session_id: sessionId,
      cards: studyCards,
      total_cards: studyCards.length,
      started_at: startedAt,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Error starting study session:', error);
    return internalErrorResponse('An unexpected error occurred');
  }
}
