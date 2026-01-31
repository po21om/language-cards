interface PasswordStrengthIndicatorProps {
  password: string;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    letter: boolean;
    number: boolean;
    special: boolean;
  };
}

function calculatePasswordStrength(password: string): StrengthResult {
  const requirements = {
    length: password.length >= 8,
    letter: /[a-zA-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  const strengthMap = {
    0: { label: "Very Weak", color: "bg-red-500" },
    1: { label: "Weak", color: "bg-orange-500" },
    2: { label: "Fair", color: "bg-yellow-500" },
    3: { label: "Good", color: "bg-blue-500" },
    4: { label: "Strong", color: "bg-green-500" },
  };

  return {
    score,
    label: strengthMap[score as keyof typeof strengthMap].label,
    color: strengthMap[score as keyof typeof strengthMap].color,
    requirements,
  };
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const strength = calculatePasswordStrength(password);
  const percentage = (strength.score / 4) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Password Strength
        </span>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {strength.label}
        </span>
      </div>

      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${strength.color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <ul className="space-y-1 text-xs">
        <li
          className={
            strength.requirements.length
              ? "text-green-600 dark:text-green-400"
              : "text-gray-500 dark:text-gray-400"
          }
        >
          {strength.requirements.length ? "✓" : "○"} At least 8 characters
        </li>
        <li
          className={
            strength.requirements.letter
              ? "text-green-600 dark:text-green-400"
              : "text-gray-500 dark:text-gray-400"
          }
        >
          {strength.requirements.letter ? "✓" : "○"} Contains a letter
        </li>
        <li
          className={
            strength.requirements.number
              ? "text-green-600 dark:text-green-400"
              : "text-gray-500 dark:text-gray-400"
          }
        >
          {strength.requirements.number ? "✓" : "○"} Contains a number
        </li>
        <li
          className={
            strength.requirements.special
              ? "text-green-600 dark:text-green-400"
              : "text-gray-500 dark:text-gray-400"
          }
        >
          {strength.requirements.special ? "✓" : "○"} Contains special character
          (optional)
        </li>
      </ul>
    </div>
  );
}
