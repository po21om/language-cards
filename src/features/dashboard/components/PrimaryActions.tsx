import { Button } from '@/components/ui/button';

interface PrimaryActionsProps {
  onStartStudy: () => void;
  onGenerateWithAI: () => void;
  onAddCard: () => void;
}

export function PrimaryActions({
  onStartStudy,
  onGenerateWithAI,
  onAddCard,
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
    </div>
  );
}
