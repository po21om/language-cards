import { useState, useCallback } from "react";
import type {
  AuthFormViewModel,
  AuthSignInRequest,
  AuthSignInResponse,
  AuthSignUpRequest,
  AuthSignUpResponse,
} from "@/types";

interface UseAuthReturn {
  isLoading: boolean;
  error: string | null;
  signIn: (credentials: AuthFormViewModel) => Promise<void>;
  signUp: (credentials: AuthFormViewModel) => Promise<void>;
}

async function callSignIn(
  credentials: AuthSignInRequest
): Promise<AuthSignInResponse> {
  const response = await fetch("/api/v1/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.error?.message || `Sign in failed: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return response.json();
}

async function callSignUp(
  credentials: AuthSignUpRequest
): Promise<AuthSignUpResponse> {
  const response = await fetch("/api/v1/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.error?.message || `Sign up failed: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return response.json();
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async (credentials: AuthFormViewModel) => {
    setIsLoading(true);
    setError(null);

    try {
      await callSignIn(credentials);
      window.location.href = "/dashboard";
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (credentials: AuthFormViewModel) => {
    setIsLoading(true);
    setError(null);

    try {
      await callSignUp(credentials);
      window.location.href = "/dashboard";
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    signIn,
    signUp,
  };
}
