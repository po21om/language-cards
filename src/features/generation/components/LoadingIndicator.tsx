interface LoadingIndicatorProps {
  isLoading: boolean;
}

export function LoadingIndicator({ isLoading }: LoadingIndicatorProps) {
  if (!isLoading) {
    return null;
  }

  return (
    <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Generating flashcards...</p>
      </div>
    </div>
  );
}
