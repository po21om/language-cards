import type { APIRoute } from 'astro';
import { ProfileService } from '../../../lib/services/profile.service';
import { UpdateProfileSchema } from '../../../lib/validators/profile.validators';
import { createErrorResponse } from '../../../lib/utils/error-handler';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return createErrorResponse('UNAUTHORIZED', 'Invalid or expired authentication token', 401);
    }

    const profileService = new ProfileService(locals.supabase);
    const profile = await profileService.getProfile(user.id);

    if (!profile) {
      return createErrorResponse('NOT_FOUND', 'Profile not found', 404);
    }

    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[PROFILE_API] GET error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return createErrorResponse('UNAUTHORIZED', 'Invalid or expired authentication token', 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse('VALIDATION_ERROR', 'Invalid JSON in request body', 400);
    }

    if (Object.keys(body).length === 0) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Request body must contain at least one field to update',
        400
      );
    }

    const validationResult = UpdateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return createErrorResponse('VALIDATION_ERROR', firstError.message, 400, {
        field: firstError.path[0] as string,
      });
    }

    const profileService = new ProfileService(locals.supabase);
    const updatedProfile = await profileService.updateProfile(user.id, validationResult.data);

    if (!updatedProfile) {
      return createErrorResponse('NOT_FOUND', 'Profile not found', 404);
    }

    return new Response(JSON.stringify(updatedProfile), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[PROFILE_API] PATCH error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
};
