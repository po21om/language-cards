import { useEffect, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { FlashcardViewModel } from '../types';

interface FlashcardDataTableProps {
  cards: FlashcardViewModel[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  onEdit: (card: FlashcardViewModel) => void;
  onDelete: (card: FlashcardViewModel) => void;
  onRestore: (cardId: string) => void;
}

export function FlashcardDataTable({
  cards,
  hasMore,
  isLoading,
  onLoadMore,
  onEdit,
  onDelete,
  onRestore,
}: FlashcardDataTableProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!observerTarget.current || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (cards.length === 0 && !isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <p className="text-lg font-medium">No flashcards found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or create a new card!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%]">Front</TableHead>
            <TableHead className="w-[35%]">Back</TableHead>
            <TableHead className="w-[20%]">Tags</TableHead>
            <TableHead className="w-[10%]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cards.map((card) => (
            <TableRow key={card.id}>
              <TableCell className="font-medium">{card.front}</TableCell>
              <TableCell>{card.back}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {card.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {!card.isDeleted ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(card)}
                        aria-label="Edit card"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(card)}
                        aria-label="Delete card"
                      >
                        Delete
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRestore(card.id)}
                      aria-label="Restore card"
                    >
                      Restore
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-4">
          {isLoading && <p className="text-sm text-muted-foreground">Loading more...</p>}
        </div>
      )}
    </div>
  );
}
