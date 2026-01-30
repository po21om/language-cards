import type { ErrorResponse } from '../../types';
import { ZodError } from 'zod';

export function validationErrorResponse(zodError: ZodError): Response {
  const firstError = zodError.errors[0];
  
  const errorResponse: ErrorResponse = {
    error: {
      code: 'VALIDATION_ERROR',
      message: firstError.message,
      details: {
        field: firstError.path.join('.'),
        constraint: firstError.code,
      },
    },
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function unauthorizedResponse(message?: string): Response {
  const errorResponse: ErrorResponse = {
    error: {
      code: 'UNAUTHORIZED',
      message: message || 'Missing or invalid authorization header',
    },
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function notFoundResponse(message?: string): Response {
  const errorResponse: ErrorResponse = {
    error: {
      code: 'NOT_FOUND',
      message: message || 'Resource not found',
    },
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function rateLimitResponse(retryAfter?: number): Response {
  const errorResponse: ErrorResponse = {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: retryAfter
        ? `Rate limit exceeded. Try again in ${retryAfter} seconds`
        : 'Rate limit exceeded',
      details: retryAfter ? { retry_after: retryAfter } : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (retryAfter) {
    headers['Retry-After'] = retryAfter.toString();
  }

  return new Response(JSON.stringify(errorResponse), {
    status: 429,
    headers,
  });
}

export function serviceUnavailableResponse(message?: string): Response {
  const errorResponse: ErrorResponse = {
    error: {
      code: 'SERVICE_UNAVAILABLE',
      message: message || 'Service temporarily unavailable',
    },
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function internalErrorResponse(message?: string): Response {
  const errorResponse: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: message || 'An internal error occurred',
    },
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
