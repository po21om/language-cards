import type { APIRoute } from 'astro';
import { RefreshTokenSchema } from '../../../../lib/validators/auth.validators';
import { AuthService } from '../../../../lib/services/auth.service';
import { createErrorResponse, handleSupabaseAuthError } from '../../../../lib/utils/error-handler';
import type { AuthRefreshRequest } from '../../../../types';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body: AuthRefreshRequest = await request.json();

    const validationResult = RefreshTokenSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid input data',
        400,
        {
          field: firstError.path[0] as string,
          message: firstError.message,
        }
      );
    }

    const authService = new AuthService(locals.supabase);
    const result = await authService.refreshToken(validationResult.data.refresh_token);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleSupabaseAuthError(error);
  }
};
