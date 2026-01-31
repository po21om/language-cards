import { useStudySession } from '../hooks/useStudySession';
import { ProgressBar } from './ProgressBar';
import { Flashcard } from './Flashcard';
import { FeedbackControls } from './FeedbackControls';
import { SessionSummaryModal } from './SessionSummaryModal';
import { Button } from '@/components/ui/button';

export function StudyView() {
  const { session, flipCard, submitReview, retryFetch } = useStudySession();

  if (!session || session.status === 'loading') {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-lg text-muted-foreground">Loading your study session...</p>
        </div>
      </div>
    );
  }

  if (session.status === 'error') {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <div className="text-6xl">😔</div>
          <h2 className="text-2xl font-bold">Unable to Load Study Session</h2>
          <p className="text-muted-foreground">{session.error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={retryFetch}>Try Again</Button>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (session.status === 'finished') {
    return (
      <SessionSummaryModal
        session={session}
        onClose={() => window.location.href = '/dashboard'}
      />
    );
  }

  const currentCard = session.cards[session.currentCardIndex];

  if (!currentCard) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">No card available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <ProgressBar
        currentCardIndex={session.currentCardIndex}
        totalCards={session.totalCards}
      />

      <div className="flex min-h-[400px] items-center justify-center">
        <Flashcard
          card={currentCard}
          isFlipped={session.isFlipped}
          onFlip={flipCard}
        />
      </div>

      <FeedbackControls
        isFlipped={session.isFlipped}
        isSubmitting={session.status === 'submitting'}
        onFeedback={submitReview}
      />

      {session.error && session.status === 'studying' && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive">{session.error}</p>
        </div>
      )}
    </div>
  );
}
