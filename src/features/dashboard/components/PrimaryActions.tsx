import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface PrimaryActionsProps {
  onStartStudy: () => void;
  onGenerateWithAI: () => void;
  onAddCard: () => void;
  onViewTrash: () => void;
}

export function PrimaryActions({
  onStartStudy,
  onGenerateWithAI,
  onAddCard,
  onViewTrash,
}: PrimaryActionsProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <Button onClick={onStartStudy} size="lg">
        Start Study Session
      </Button>
      <Button onClick={onGenerateWithAI} variant="outline" size="lg">
        Generate with AI
      </Button>
      <Button onClick={onAddCard} variant="secondary" size="lg">
        Add Card
      </Button>
      <Button onClick={onViewTrash} variant="ghost" size="lg">
        <Trash2 className="mr-2 h-4 w-4" />
        Trash
      </Button>
    </div>
  );
}
