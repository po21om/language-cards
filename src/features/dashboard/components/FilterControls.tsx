import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FlashcardStatus } from '@/types';

interface FilterControlsProps {
  currentStatus: FlashcardStatus;
  onStatusChange: (status: FlashcardStatus) => void;
}

export function FilterControls({
  currentStatus,
  onStatusChange,
}: FilterControlsProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Tabs
        value={currentStatus}
        onValueChange={(value: string) => onStatusChange(value as FlashcardStatus)}
      >
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
