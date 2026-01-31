import { TextInputArea } from './TextInputArea';
import { GenerationControls } from './GenerationControls';
import { LoadingIndicator } from './LoadingIndicator';
import { BulkActionToolbar } from './BulkActionToolbar';
import { ReviewList } from './ReviewList';
import { Button } from '@/components/ui/button';
import { useGenerationState } from '../hooks/useGenerationState';

const MAX_CHARACTER_LIMIT = 1800;

export default function GenerationView() {
  const {
    sourceText,
    suggestions,
    characterCount,
    isGenerationDisabled,
    viewStatus,
    error,
    handleTextChange,
    handleGenerate,
    handleUpdateSuggestion,
    handleRefineSuggestion,
    handleAcceptSuggestion,
    handleRejectSuggestion,
    handleAcceptAll,
    handleRejectAll,
    handleSubmitAccepted,
    clearError,
  } = useGenerationState();

  const isReviewing = viewStatus === 'reviewing';
  const isSubmitting = viewStatus === 'submitting';
  const acceptedCount = suggestions.filter((s) => s.ui_status === 'accepted').length;
  const hasAcceptedCards = acceptedCount > 0;

  return (
    <div className="space-y-6">
      {error && (
        <div
          className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md flex items-start justify-between"
          role="alert"
        >
          <p className="text-sm">{error}</p>
          <button
            onClick={clearError}
            className="text-destructive hover:text-destructive/80"
            aria-label="Dismiss error"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {!isReviewing && (
        <>
          <TextInputArea
            text={sourceText}
            onTextChange={handleTextChange}
            characterCount={characterCount}
            maxLength={MAX_CHARACTER_LIMIT}
            disabled={viewStatus === 'loading' || viewStatus === 'submitting'}
          />

          <GenerationControls
            onGenerate={handleGenerate}
            isGenerationDisabled={isGenerationDisabled}
          />
        </>
      )}

      <LoadingIndicator isLoading={viewStatus === 'loading'} />

      {isReviewing && (
        <div className="space-y-6">
          <BulkActionToolbar
            onAcceptAll={handleAcceptAll}
            onRejectAll={handleRejectAll}
            isVisible={true}
          />

          <ReviewList
            suggestions={suggestions}
            onUpdateSuggestion={handleUpdateSuggestion}
            onRefineSuggestion={handleRefineSuggestion}
            onAcceptSuggestion={handleAcceptSuggestion}
            onRejectSuggestion={handleRejectSuggestion}
          />

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border sticky bottom-4">
            <div className="text-sm">
              <span className="font-medium">{acceptedCount}</span> flashcard
              {acceptedCount !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                disabled={isSubmitting}
              >
                Start Over
              </Button>
              <Button
                onClick={handleSubmitAccepted}
                disabled={!hasAcceptedCards || isSubmitting}
                size="lg"
              >
                {isSubmitting ? 'Adding...' : 'Add to Deck'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
