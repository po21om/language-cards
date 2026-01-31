import { ReviewListItem } from './ReviewListItem';
import type { SuggestionViewModel } from '../types';

interface ReviewListProps {
  suggestions: SuggestionViewModel[];
  onUpdateSuggestion: (id: string, front: string, back: string) => void;
  onRefineSuggestion: (id: string, instruction: string) => void;
  onAcceptSuggestion: (id: string) => void;
  onRejectSuggestion: (id: string) => void;
}

export function ReviewList({
  suggestions,
  onUpdateSuggestion,
  onRefineSuggestion,
  onAcceptSuggestion,
  onRejectSuggestion,
}: ReviewListProps) {
  if (suggestions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No flashcards could be generated from this text.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Review Generated Flashcards</h2>
      <ul className="space-y-3" role="list">
        {suggestions.map((suggestion) => (
          <ReviewListItem
            key={suggestion.suggestion_id}
            suggestion={suggestion}
            onUpdate={onUpdateSuggestion}
            onRefine={onRefineSuggestion}
            onAccept={onAcceptSuggestion}
            onReject={onRejectSuggestion}
          />
        ))}
      </ul>
    </div>
  );
}
