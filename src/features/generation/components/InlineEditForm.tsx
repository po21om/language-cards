import { useState, useId } from 'react';
import { Button } from '@/components/ui/button';

interface InlineEditFormProps {
  initialFront: string;
  initialBack: string;
  onSave: (front: string, back: string) => void;
  onCancel: () => void;
}

export function InlineEditForm({
  initialFront,
  initialBack,
  onSave,
  onCancel,
}: InlineEditFormProps) {
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);
  const frontId = useId();
  const backId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (front.trim() && back.trim()) {
      onSave(front, back);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor={frontId} className="block text-xs font-medium text-muted-foreground mb-1">
            Front
          </label>
          <textarea
            id={frontId}
            value={front}
            onChange={(e) => setFront(e.target.value)}
            className="w-full min-h-[80px] p-2 text-sm border rounded-md resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          />
        </div>
        <div>
          <label htmlFor={backId} className="block text-xs font-medium text-muted-foreground mb-1">
            Back
          </label>
          <textarea
            id={backId}
            value={back}
            onChange={(e) => setBack(e.target.value)}
            className="w-full min-h-[80px] p-2 text-sm border rounded-md resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Save
        </Button>
        <Button type="button" onClick={onCancel} size="sm" variant="outline">
          Cancel
        </Button>
      </div>
    </form>
  );
}
