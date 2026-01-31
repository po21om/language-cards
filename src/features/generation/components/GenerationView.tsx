import { toast } from 'sonner';
import { TextInputArea } from './TextInputArea';
import { GenerationControls } from './GenerationControls';
import { LoadingIndicator } from './LoadingIndicator';
import { BulkActionToolbar } from './BulkActionToolbar';
import { ReviewList } from './ReviewList';
import { Button } from '@/components/ui/button';
import { UserHeader } from '@/components/UserHeader';
import { ArrowLeft } from 'lucide-react';
import { useGenerationState } from '../hooks/useGenerationState';

const MAX_CHARACTER_LIMIT = 1800;

interface GenerationViewProps {
  userEmail: string;
}

export default function GenerationView({ userEmail }: GenerationViewProps) {
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

  const handleGenerateWithToast = async () => {
    await handleGenerate();
  };

  const handleSubmitWithToast = async () => {
    const result = await handleSubmitAccepted();
    if (result) {
      toast.success(`Successfully added ${acceptedCount} flashcard${acceptedCount !== 1 ? 's' : ''} to your deck`);
    }
  };

  return (
    <div className="container mx-auto space-y-8 py-8">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/dashboard'}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <UserHeader userEmail={userEmail} />
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">AI Flashcard Generation</h1>
          <p className="text-muted-foreground">
            Generate flashcards from your text using AI
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
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
              onGenerate={handleGenerateWithToast}
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

            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4 sticky bottom-4">
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
                  onClick={handleSubmitWithToast}
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
    </div>
  );
}
