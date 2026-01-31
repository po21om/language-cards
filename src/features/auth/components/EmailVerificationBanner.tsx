import { AlertCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface EmailVerificationBannerProps {
  email: string;
  onResendVerification?: () => Promise<void>;
}

export function EmailVerificationBanner({
  email,
  onResendVerification,
}: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    if (!onResendVerification) return;

    setIsResending(true);
    setResendSuccess(false);

    try {
      await onResendVerification();
      setResendSuccess(true);
    } catch (error) {
      console.error("Failed to resend verification email:", error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
            Email Verification Required
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
            We've sent a verification email to <strong>{email}</strong>. Please
            check your inbox and click the verification link to activate your
            account.
          </p>

          {resendSuccess && (
            <p className="text-sm text-green-700 dark:text-green-400 mb-2">
              ✓ Verification email sent successfully!
            </p>
          )}

          <div className="flex items-center gap-3">
            {onResendVerification && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResend}
                disabled={isResending || resendSuccess}
                className="bg-white dark:bg-gray-800"
              >
                <Mail className="h-4 w-4 mr-2" />
                {isResending
                  ? "Sending..."
                  : resendSuccess
                    ? "Email Sent"
                    : "Resend Email"}
              </Button>
            )}
            <span className="text-xs text-yellow-600 dark:text-yellow-500">
              Didn't receive it? Check your spam folder.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
