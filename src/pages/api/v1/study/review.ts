import type { APIContext } from 'astro';
import { ZodError } from 'zod';
import { StudyService } from '../../../../lib/services/study.service';
import { FlashcardService } from '../../../../lib/services/flashcard.service';
import { submitStudyReviewSchema } from '../../../../lib/validators/study.validators';
import {
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
} from '../../../../lib/utils/error-responses';
import type { SubmitStudyReviewResponse } from '../../../../types';
import { randomUUID } from 'crypto';

export const prerender = false;

export async function POST(context: APIContext) {
  try {
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse('Authentication required');
    }

    const body = await context.request.json();
    const validatedData = submitStudyReviewSchema.parse(body);

    const flashcardService = new FlashcardService(context.locals.supabase);
    const card = await flashcardService.getFlashcardById(user.id, validatedData.card_id);

    if (!card) {
      return notFoundResponse('Card not found');
    }

    const studyService = new StudyService(context.locals.supabase);
    const previousWeight = card.study_weight;
    const newWeight = studyService.calculateNewWeight(previousWeight, validatedData.outcome);

    const reviewedAt = new Date().toISOString();
    const reviewId = randomUUID();

    const { error: insertError } = await context.locals.supabase
      .from('study_reviews')
      .insert({
        id: reviewId,
        user_id: user.id,
        card_id: validatedData.card_id,
        outcome: validatedData.outcome,
        previous_weight: previousWeight,
        new_weight: newWeight,
        reviewed_at: reviewedAt,
      });

    if (insertError) {
      console.error('Error inserting study review:', insertError);
      throw insertError;
    }

    const { error: updateError } = await context.locals.supabase
      .from('flashcards')
      .update({
        study_weight: newWeight,
        updated_at: reviewedAt,
      })
      .eq('id', validatedData.card_id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating flashcard weight:', updateError);
      throw updateError;
    }

    const response: SubmitStudyReviewResponse = {
      id: reviewId,
      card_id: validatedData.card_id,
      outcome: validatedData.outcome,
      previous_weight: previousWeight,
      new_weight: newWeight,
      reviewed_at: reviewedAt,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Error submitting study review:', error);
    return internalErrorResponse('An unexpected error occurred');
  }
}
