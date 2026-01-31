import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FlashcardForm } from './FlashcardForm';
import type { FlashcardFormValues, FlashcardViewModel } from '../types';

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FlashcardFormValues) => Promise<void>;
  initialData?: FlashcardViewModel;
}

export function CreateCardModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: CreateCardModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Flashcard' : 'Create New Flashcard'}
          </DialogTitle>
        </DialogHeader>
        <FlashcardForm
          onSubmit={onSubmit}
          initialData={initialData}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
