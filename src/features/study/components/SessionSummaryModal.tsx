import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { StudySessionViewModel } from '../types';

interface SessionSummaryModalProps {
  session: StudySessionViewModel;
  onClose: () => void;
}

export function SessionSummaryModal({ session, onClose }: SessionSummaryModalProps) {
  const totalReviewed = session.correctCount + session.incorrectCount + session.skippedCount;
  const nonSkippedReviews = session.correctCount + session.incorrectCount;
  const accuracyRate = nonSkippedReviews > 0 
    ? Math.round((session.correctCount / nonSkippedReviews) * 100) 
    : 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Study Session Complete!</DialogTitle>
          <DialogDescription>
            Great work! Here's a summary of your study session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {session.correctCount}
              </div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>

            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {session.incorrectCount}
              </div>
              <div className="text-sm text-muted-foreground">Incorrect</div>
            </div>
          </div>

          {session.skippedCount > 0 && (
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {session.skippedCount}
              </div>
              <div className="text-sm text-muted-foreground">Skipped</div>
            </div>
          )}

          <div className="rounded-lg border bg-primary/10 p-4 text-center">
            <div className="text-3xl font-bold">{accuracyRate}%</div>
            <div className="text-sm text-muted-foreground">Accuracy Rate</div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            You reviewed {totalReviewed} card{totalReviewed !== 1 ? 's' : ''} in this session
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Back to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
