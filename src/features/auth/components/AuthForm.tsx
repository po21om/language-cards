import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthFormViewModel } from "@/types";
import { useId, useState } from "react";
import { z } from "zod";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { Checkbox } from "./Checkbox";

interface AuthFormProps {
  mode: "signIn" | "signUp";
  onSubmit: (data: AuthFormViewModel) => void;
  isLoading: boolean;
}

const signInSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password cannot be empty"),
});

const signUpSchema = z
  .object({
    email: z.string().email("Invalid email format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function AuthForm({ mode, onSubmit, isLoading }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const emailErrorId = useId();
  const passwordErrorId = useId();
  const confirmPasswordErrorId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const schema = mode === "signIn" ? signInSchema : signUpSchema;
    const formData =
      mode === "signIn"
        ? { email, password }
        : { email, password, confirmPassword };
    const result = schema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: {
        email?: string;
        password?: string;
        confirmPassword?: string;
      } = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as
          | "email"
          | "password"
          | "confirmPassword";
        if (!fieldErrors[field]) {
          fieldErrors[field] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit({ email, password, rememberMe });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? emailErrorId : undefined}
          autoFocus
        />
        {errors.email && (
          <p id={emailErrorId} className="text-sm text-red-600">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={passwordId}>Password</Label>
        <Input
          id={passwordId}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? passwordErrorId : undefined}
        />
        {errors.password && (
          <p id={passwordErrorId} className="text-sm text-red-600">
            {errors.password}
          </p>
        )}
        {mode === "signUp" && (
          <PasswordStrengthIndicator password={password} />
        )}
      </div>

      {mode === "signUp" && (
        <div className="space-y-2">
          <Label htmlFor={confirmPasswordId}>Confirm Password</Label>
          <Input
            id={confirmPasswordId}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword ? confirmPasswordErrorId : undefined
            }
          />
          {errors.confirmPassword && (
            <p id={confirmPasswordErrorId} className="text-sm text-red-600">
              {errors.confirmPassword}
            </p>
          )}
        </div>
      )}

      {mode === "signIn" && (
        <Checkbox
          checked={rememberMe}
          onChange={setRememberMe}
          label="Remember me"
          disabled={isLoading}
        />
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading
          ? "Loading..."
          : mode === "signIn"
            ? "Sign In"
            : "Sign Up"}
      </Button>
    </form>
  );
}
