import type { APIContext } from 'astro';
import { ZodError } from 'zod';
import { StudyService } from '../../../../lib/services/study.service';
import { studyStatisticsQuerySchema } from '../../../../lib/validators/study.validators';
import {
  validationErrorResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from '../../../../lib/utils/error-responses';

export const prerender = false;

export async function GET(context: APIContext) {
  try {
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return unauthorizedResponse('Authentication required');
    }

    const url = new URL(context.request.url);
    const queryParams = {
      period: url.searchParams.get('period') || undefined,
    };

    const validatedQuery = studyStatisticsQuerySchema.parse(queryParams);

    const studyService = new StudyService(context.locals.supabase);
    const statistics = await studyService.getStudyStatistics(user.id, validatedQuery.period);

    return new Response(JSON.stringify(statistics), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error('Error getting study statistics:', error);
    return internalErrorResponse('An unexpected error occurred');
  }
}
