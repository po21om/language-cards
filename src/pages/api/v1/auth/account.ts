import type { APIRoute } from 'astro';
import { AuthService } from '../../../../lib/services/auth.service';
import { createErrorResponse, handleSupabaseAuthError } from '../../../../lib/utils/error-handler';

export const prerender = false;

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    
    if (error || !user) {
      return createErrorResponse(
        'UNAUTHORIZED',
        'Invalid or expired token',
        401
      );
    }

    const authService = new AuthService(locals.supabase);
    await authService.deleteAccount(user.id);

    return new Response(
      JSON.stringify({ message: 'Account and all associated data permanently deleted' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleSupabaseAuthError(error);
  }
};
