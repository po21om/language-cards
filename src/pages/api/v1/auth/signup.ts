import type { APIRoute } from 'astro';
import { SignUpSchema } from '../../../../lib/validators/auth.validators';
import { AuthService } from '../../../../lib/services/auth.service';
import { createErrorResponse, handleSupabaseAuthError } from '../../../../lib/utils/error-handler';
import type { AuthSignUpRequest } from '../../../../types';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const body: AuthSignUpRequest = await request.json();

    const validationResult = SignUpSchema.safeParse(body);
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
    const result = await authService.signUp(validationResult.data.email, validationResult.data.password);

    cookies.set('sb-access-token', result.session.access_token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    cookies.set('sb-refresh-token', result.session.refresh_token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return handleSupabaseAuthError(error);
  }
};
