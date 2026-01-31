interface ProgressBarProps {
  currentCardIndex: number;
  totalCards: number;
}

export function ProgressBar({ currentCardIndex, totalCards }: ProgressBarProps) {
  const progress = totalCards > 0 ? (currentCardIndex / totalCards) * 100 : 0;
  const displayIndex = Math.min(currentCardIndex + 1, totalCards);

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Progress</span>
        <span>
          Card {displayIndex} of {totalCards}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={displayIndex}
          aria-valuemin={0}
          aria-valuemax={totalCards}
          aria-label={`Study progress: ${displayIndex} of ${totalCards} cards completed`}
        />
      </div>
    </div>
  );
}
