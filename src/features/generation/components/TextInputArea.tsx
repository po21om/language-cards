import { useId } from 'react';

interface TextInputAreaProps {
  text: string;
  onTextChange: (text: string) => void;
  characterCount: number;
  maxLength: number;
  disabled?: boolean;
}

export function TextInputArea({
  text,
  onTextChange,
  characterCount,
  maxLength,
  disabled = false,
}: TextInputAreaProps) {
  const textareaId = useId();
  const counterId = useId();
  const isOverLimit = characterCount > maxLength;

  return (
    <div className="space-y-2">
      <label htmlFor={textareaId} className="block text-sm font-medium">
        Source Text
      </label>
      <textarea
        id={textareaId}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        disabled={disabled}
        aria-describedby={counterId}
        aria-invalid={isOverLimit}
        className="w-full min-h-[200px] p-3 border rounded-md resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Paste your text here to generate flashcards..."
      />
      <p
        id={counterId}
        className={`text-sm ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}
        aria-live="polite"
      >
        {characterCount} / {maxLength} characters
        {isOverLimit && ' (exceeds limit)'}
      </p>
    </div>
  );
}
