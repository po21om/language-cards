import type { APIRoute } from 'astro';
import { AuthService } from '../../../../lib/services/auth.service';
import { createErrorResponse, handleSupabaseAuthError } from '../../../../lib/utils/error-handler';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse(
        'UNAUTHORIZED',
        'Missing or invalid authorization header',
        401
      );
    }

    const authService = new AuthService(locals.supabase);
    await authService.signOut();

    return new Response(
      JSON.stringify({ message: 'Successfully signed out' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleSupabaseAuthError(error);
  }
};
