import { Button } from '@/components/ui/button';

interface BulkActionToolbarProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  isVisible: boolean;
}

export function BulkActionToolbar({
  onAcceptAll,
  onRejectAll,
  isVisible,
}: BulkActionToolbarProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
      <p className="text-sm font-medium">Bulk Actions</p>
      <div className="flex gap-2">
        <Button onClick={onRejectAll} variant="outline" size="sm">
          Reject All
        </Button>
        <Button onClick={onAcceptAll} size="sm">
          Accept All
        </Button>
      </div>
    </div>
  );
}
