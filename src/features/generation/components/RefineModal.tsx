import { useState, useId } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface RefineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefine: (instruction: string) => void;
}

export function RefineModal({ isOpen, onClose, onRefine }: RefineModalProps) {
  const [instruction, setInstruction] = useState('');
  const instructionId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instruction.trim()) {
      onRefine(instruction);
      setInstruction('');
    }
  };

  const handleClose = () => {
    setInstruction('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refine Flashcard</DialogTitle>
          <DialogDescription>
            Provide instructions on how you'd like the AI to improve this flashcard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor={instructionId} className="block text-sm font-medium mb-2">
              Refinement Instructions
            </label>
            <textarea
              id={instructionId}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g., Make the front side more concise, or add more detail to the back..."
              className="w-full min-h-[120px] p-3 border rounded-md resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleClose} variant="outline">
              Cancel
            </Button>
            <Button type="submit" disabled={!instruction.trim()}>
              Refine
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
