import { useId } from "react";

interface CheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Checkbox({
  id: providedId,
  checked,
  onChange,
  label,
  disabled = false,
}: CheckboxProps) {
  const generatedId = useId();
  const id = providedId || generatedId;

  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
      />
      <label
        htmlFor={id}
        className="ml-2 text-sm text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
    </div>
  );
}
