import type { ErrorResponse } from '../../types';

export function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): Response {
  const errorResponse: ErrorResponse = {
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function handleSupabaseAuthError(error: unknown): Response {
  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = String(error.message).toLowerCase();

    if (errorMessage.includes('user already registered') || errorMessage.includes('already exists')) {
      return createErrorResponse('CONFLICT', 'Email already registered', 409);
    }

    if (errorMessage.includes('invalid login credentials') || errorMessage.includes('invalid credentials')) {
      return createErrorResponse('UNAUTHORIZED', 'Invalid credentials', 401);
    }

    if (errorMessage.includes('invalid') && errorMessage.includes('token')) {
      return createErrorResponse('UNAUTHORIZED', 'Invalid or expired token', 401);
    }

    if (errorMessage.includes('invalid') && errorMessage.includes('refresh')) {
      return createErrorResponse('UNAUTHORIZED', 'Invalid or expired refresh token', 401);
    }

    if (errorMessage.includes('expired')) {
      return createErrorResponse('UNAUTHORIZED', 'Token expired', 401);
    }

    if (errorMessage.includes('session') && errorMessage.includes('not')) {
      return createErrorResponse('UNAUTHORIZED', 'Invalid or expired token', 401);
    }
  }

  console.error('Supabase error:', error);
  return createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
}
