import { useState } from "react";
import { AuthForm } from "./AuthForm";
import { LanguageToggle } from "./LanguageToggle";
import { useAuth } from "../hooks/useAuth";
import { Logo } from "@/components/Logo";
import type { AuthFormViewModel } from "@/types";

export function AuthView() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const { isLoading, error, signIn, signUp } = useAuth();

  const handleSubmit = async (data: AuthFormViewModel) => {
    if (mode === "signIn") {
      await signIn(data);
    } else {
      await signUp(data);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "signIn" ? "signUp" : "signIn"));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <LanguageToggle />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100/80 dark:border-gray-700/60">
          <div className="flex flex-col items-center gap-3 text-center">
            <Logo size="md" theme="light" />
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Learn faster. retain longer.
            </p>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-center mb-2">
              {mode === "signIn" ? "Sign In" : "Sign Up"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {mode === "signIn"
                ? "Welcome back! Please sign in to continue."
                : "Create a new account to get started."}
            </p>
          </div>

          {error && (
            <div
              className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
              role="alert"
            >
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <AuthForm mode={mode} onSubmit={handleSubmit} isLoading={isLoading} />

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              disabled={isLoading}
            >
              {mode === "signIn"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
