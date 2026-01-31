import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { FlashcardViewModel } from '../types';

interface TrashDataTableProps {
  data: FlashcardViewModel[];
  isLoading: boolean;
  onRestore: (cardId: string) => void;
  onDelete: (cardId: string) => void;
}

export function TrashDataTable({
  data,
  isLoading,
  onRestore,
  onDelete,
}: TrashDataTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    cardId: string | null;
    cardFront: string;
  }>({ isOpen: false, cardId: null, cardFront: '' });

  const handleDeleteClick = (card: FlashcardViewModel) => {
    setDeleteConfirm({
      isOpen: true,
      cardId: card.id,
      cardFront: card.front,
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.cardId) {
      onDelete(deleteConfirm.cardId);
      setDeleteConfirm({ isOpen: false, cardId: null, cardFront: '' });
    }
  };

  if (data.length === 0 && !isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <p className="text-lg font-medium">Trash is empty</p>
          <p className="text-sm text-muted-foreground">
            Deleted cards will appear here for 30 days before being permanently removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Front</TableHead>
              <TableHead className="w-[30%]">Back</TableHead>
              <TableHead className="w-[15%]">Time Remaining</TableHead>
              <TableHead className="w-[25%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((card) => (
              <TableRow key={card.id}>
                <TableCell className="font-medium">{card.front}</TableCell>
                <TableCell>{card.back}</TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {card.timeRemaining}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRestore(card.id)}
                      disabled={card.isProcessing}
                      aria-label="Restore card"
                    >
                      {card.isProcessing ? 'Restoring...' : 'Restore'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(card)}
                      disabled={card.isProcessing}
                      aria-label="Delete card permanently"
                    >
                      {card.isProcessing ? 'Deleting...' : 'Delete Permanently'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={deleteConfirm.isOpen}
        onOpenChange={(open) =>
          !open && setDeleteConfirm({ isOpen: false, cardId: null, cardFront: '' })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the card "{deleteConfirm.cardFront}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
