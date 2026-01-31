import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { StudyOutcome } from '@/types';

interface FeedbackControlsProps {
  isFlipped: boolean;
  isSubmitting: boolean;
  onFeedback: (outcome: StudyOutcome) => void;
}

export function FeedbackControls({
  isFlipped,
  isSubmitting,
  onFeedback,
}: FeedbackControlsProps) {
  useEffect(() => {
    if (!isFlipped || isSubmitting) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === '1') {
        event.preventDefault();
        onFeedback('incorrect');
      } else if (event.key === '2') {
        event.preventDefault();
        onFeedback('correct');
      } else if (event.key === '3') {
        event.preventDefault();
        onFeedback('skipped');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFlipped, isSubmitting, onFeedback]);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex gap-4">
        <Button
          onClick={() => onFeedback('incorrect')}
          disabled={!isFlipped || isSubmitting}
          variant="destructive"
          size="lg"
          className="min-w-[140px]"
          aria-label="Mark as incorrect (press 1)"
        >
          Incorrect
          <span className="ml-2 text-xs opacity-70">(1)</span>
        </Button>
        <Button
          onClick={() => onFeedback('correct')}
          disabled={!isFlipped || isSubmitting}
          variant="default"
          size="lg"
          className="min-w-[140px]"
          aria-label="Mark as correct (press 2)"
        >
          Correct
          <span className="ml-2 text-xs opacity-70">(2)</span>
        </Button>
        <Button
          onClick={() => onFeedback('skipped')}
          disabled={!isFlipped || isSubmitting}
          variant="outline"
          size="lg"
          className="min-w-[140px]"
          aria-label="Skip this card (press 3)"
        >
          Skip
          <span className="ml-2 text-xs opacity-70">(3)</span>
        </Button>
      </div>
      {!isFlipped && (
        <p className="text-sm text-muted-foreground">
          Flip the card to see the answer before providing feedback
        </p>
      )}
    </div>
  );
}
