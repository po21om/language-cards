import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Trash2 } from 'lucide-react';

interface DeleteAccountProps {
  isModalOpen: boolean;
  isLoading: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onConfirmDelete: () => Promise<void>;
}

export function DeleteAccount({
  isModalOpen,
  isLoading,
  onOpenModal,
  onCloseModal,
  onConfirmDelete,
}: DeleteAccountProps) {
  const [confirmText, setConfirmText] = useState('');
  const isDeleteEnabled = confirmText === 'DELETE';

  const handleConfirm = async () => {
    if (!isDeleteEnabled) return;

    try {
      await onConfirmDelete();
    } catch (err) {
      toast.error('Failed to delete account. Please try again.');
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onCloseModal();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all associated data
        </p>
      </div>
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-destructive">Delete Account</h3>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. All your flashcards and data will be permanently
              deleted.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={onOpenModal}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </div>
      </div>

      <AlertDialog open={isModalOpen} onOpenChange={handleClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove
              all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="confirm-delete">
              Type <span className="font-bold">DELETE</span> to confirm
            </Label>
            <Input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              disabled={isLoading}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleClose} disabled={isLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={!isDeleteEnabled || isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
