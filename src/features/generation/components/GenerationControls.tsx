import { Button } from '@/components/ui/button';

interface GenerationControlsProps {
  onGenerate: () => void;
  isGenerationDisabled: boolean;
}

export function GenerationControls({
  onGenerate,
  isGenerationDisabled,
}: GenerationControlsProps) {
  return (
    <div className="flex justify-end">
      <Button onClick={onGenerate} disabled={isGenerationDisabled} size="lg">
        Generate Flashcards
      </Button>
    </div>
  );
}
