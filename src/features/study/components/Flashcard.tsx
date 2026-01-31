import { useEffect } from 'react';
import type { StudyCardViewModel } from '../types';

interface FlashcardProps {
  card: StudyCardViewModel;
  isFlipped: boolean;
  onFlip: () => void;
}

export function Flashcard({ card, isFlipped, onFlip }: FlashcardProps) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        onFlip();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onFlip]);

  return (
    <div className="perspective-1000 w-full">
      <button
        onClick={onFlip}
        className="relative h-[400px] w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={isFlipped ? 'Show front of card' : 'Show back of card'}
        type="button"
      >
        <div
          className={`preserve-3d relative h-full w-full transition-transform duration-500 ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-lg border-2 border-border bg-card p-8 shadow-lg">
            <div className="mb-4 text-sm font-medium text-muted-foreground">
              Front
            </div>
            <div className="text-center text-2xl font-semibold">{card.front}</div>
            {card.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-8 text-sm text-muted-foreground">
              Press Space or click to flip
            </div>
          </div>

          <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-center rounded-lg border-2 border-border bg-card p-8 shadow-lg">
            <div className="mb-4 text-sm font-medium text-muted-foreground">
              Back
            </div>
            {card.back ? (
              <>
                <div className="text-center text-2xl font-semibold">{card.back}</div>
                <div className="mt-8 text-sm text-muted-foreground">
                  Press Space or click to flip back
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <div className="text-sm text-muted-foreground">Loading...</div>
              </div>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
