import { toast } from 'sonner';
import { useTrashView } from '../hooks/useTrashView';
import { TrashDataTable } from './TrashDataTable';
import { UserHeader } from '@/components/UserHeader';
import { NavigationBar } from '@/components/NavigationBar';

interface TrashViewProps {
  userEmail: string;
}

export function TrashView({ userEmail }: TrashViewProps) {
  const { cards, isLoading, error, handleRestore, handleDelete } = useTrashView();

  const handleRestoreClick = async (cardId: string) => {
    try {
      await handleRestore(cardId);
      toast.success('Flashcard restored successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to restore flashcard. Please try again.';
      toast.error(message);
    }
  };

  const handleDeleteClick = async (cardId: string) => {
    try {
      await handleDelete(cardId);
      toast.success('Flashcard deleted permanently');
    } catch (err) {
      toast.error('Failed to delete flashcard. Please try again.');
    }
  };

  return (
    <>
      <NavigationBar currentPath="/trash" />
      <div className="container mx-auto space-y-8 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trash</h1>
            <p className="text-muted-foreground">
              Deleted cards are kept for 30 days before permanent removal
            </p>
          </div>
          <UserHeader userEmail={userEmail} />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              {error.message || 'An error occurred. Please try again.'}
            </p>
          </div>
        )}

        {isLoading && cards.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Loading deleted cards...</p>
          </div>
        ) : (
          <TrashDataTable
            data={cards}
            isLoading={isLoading}
            onRestore={handleRestoreClick}
            onDelete={handleDeleteClick}
          />
        )}
      </div>
    </div>
    </>
  );
}
