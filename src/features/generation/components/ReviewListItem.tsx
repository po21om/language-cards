import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InlineEditForm } from './InlineEditForm';
import { RefineModal } from './RefineModal';
import type { SuggestionViewModel } from '../types';

interface ReviewListItemProps {
  suggestion: SuggestionViewModel;
  onUpdate: (id: string, front: string, back: string) => void;
  onRefine: (id: string, instruction: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function ReviewListItem({
  suggestion,
  onUpdate,
  onRefine,
  onAccept,
  onReject,
}: ReviewListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);

  const handleSaveEdit = (front: string, back: string) => {
    onUpdate(suggestion.suggestion_id, front, back);
    setIsEditing(false);
  };

  const handleRefine = (instruction: string) => {
    onRefine(suggestion.suggestion_id, instruction);
    setIsRefineModalOpen(false);
  };

  const isAccepted = suggestion.ui_status === 'accepted';
  const isRejected = suggestion.ui_status === 'rejected';
  const isRefining = suggestion.ui_status === 'refining';
  const isDisabled = isRefining;

  return (
    <li
      className={`border rounded-lg p-4 transition-all ${
        isAccepted
          ? 'bg-green-50 border-green-300 dark:bg-green-950/20 dark:border-green-800'
          : isRejected
            ? 'bg-muted/50 border-muted opacity-60'
            : 'bg-card'
      }`}
    >
      {isEditing ? (
        <InlineEditForm
          initialFront={suggestion.front}
          initialBack={suggestion.back}
          onSave={handleSaveEdit}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Front</p>
              <p className="text-sm">{suggestion.front}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Back</p>
              <p className="text-sm">{suggestion.back}</p>
            </div>
          </div>

          {suggestion.suggested_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {suggestion.suggested_tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {isRefining && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              <span>Refining...</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!isAccepted && !isRejected && (
              <>
                <Button
                  onClick={() => onAccept(suggestion.suggestion_id)}
                  disabled={isDisabled}
                  size="sm"
                  variant="default"
                >
                  Accept
                </Button>
                <Button
                  onClick={() => setIsEditing(true)}
                  disabled={isDisabled}
                  size="sm"
                  variant="outline"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => setIsRefineModalOpen(true)}
                  disabled={isDisabled}
                  size="sm"
                  variant="outline"
                >
                  Refine
                </Button>
                <Button
                  onClick={() => onReject(suggestion.suggestion_id)}
                  disabled={isDisabled}
                  size="sm"
                  variant="destructive"
                >
                  Reject
                </Button>
              </>
            )}
            {isAccepted && (
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="font-medium">Accepted</span>
                <Button
                  onClick={() => onReject(suggestion.suggestion_id)}
                  size="sm"
                  variant="ghost"
                  className="ml-2"
                >
                  Undo
                </Button>
              </div>
            )}
            {isRejected && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span className="font-medium">Rejected</span>
                <Button
                  onClick={() => onAccept(suggestion.suggestion_id)}
                  size="sm"
                  variant="ghost"
                  className="ml-2"
                >
                  Undo
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <RefineModal
        isOpen={isRefineModalOpen}
        onClose={() => setIsRefineModalOpen(false)}
        onRefine={handleRefine}
      />
    </li>
  );
}
