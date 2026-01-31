import { useState, useCallback, useEffect } from 'react';
import type {
  FlashcardResponseDTO,
  FlashcardListResponse,
  DeleteFlashcardResponse,
} from '@/types';
import type { FlashcardViewModel } from '../types';

interface UseTrashViewReturn {
  cards: FlashcardViewModel[];
  isLoading: boolean;
  error: Error | null;
  handleRestore: (cardId: string) => Promise<void>;
  handleDelete: (cardId: string) => Promise<void>;
}

function calculateTimeRemaining(deletedAt: string | null): string {
  if (!deletedAt) return 'Unknown';

  const deletedDate = new Date(deletedAt);
  const expiryDate = new Date(deletedDate);
  expiryDate.setDate(expiryDate.getDate() + 30);

  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return '0 days';
  if (diffDays === 1) return '1 day';
  return `${diffDays} days`;
}

function transformToViewModel(dto: FlashcardResponseDTO): FlashcardViewModel {
  return {
    ...dto,
    timeRemaining: calculateTimeRemaining(dto.deleted_at),
    isProcessing: false,
  };
}

async function fetchDeletedCards(): Promise<FlashcardListResponse> {
  const params = new URLSearchParams({
    include_deleted: 'true',
    limit: '100',
    offset: '0',
  });

  const response = await fetch(`/api/v1/flashcards?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch deleted cards: ${response.statusText}`);
  }

  return response.json();
}

async function restoreFlashcard(cardId: string): Promise<FlashcardResponseDTO> {
  const response = await fetch(`/api/v1/flashcards/${cardId}/restore`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 410) {
      throw new Error('CARD_EXPIRED');
    }
    throw new Error(`Failed to restore flashcard: ${response.statusText}`);
  }

  return response.json();
}

async function deleteFlashcardPermanently(cardId: string): Promise<DeleteFlashcardResponse> {
  const response = await fetch(`/api/v1/flashcards/${cardId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete flashcard: ${response.statusText}`);
  }

  return response.json();
}

export function useTrashView(): UseTrashViewReturn {
  const [cards, setCards] = useState<FlashcardViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchDeletedCards();
      const deletedCards = response.data.filter((card) => card.deleted_at !== null);
      const viewModels = deletedCards.map(transformToViewModel);
      setCards(viewModels);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleRestore = useCallback(async (cardId: string) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, isProcessing: true } : card
      )
    );

    try {
      await restoreFlashcard(cardId);
      setCards((prev) => prev.filter((card) => card.id !== cardId));
    } catch (err) {
      if (err instanceof Error && err.message === 'CARD_EXPIRED') {
        setCards((prev) => prev.filter((card) => card.id !== cardId));
        throw new Error('This card can no longer be restored as it is past the 30-day window.');
      }

      setCards((prev) =>
        prev.map((card) =>
          card.id === cardId ? { ...card, isProcessing: false } : card
        )
      );
      throw err instanceof Error ? err : new Error('Failed to restore card');
    }
  }, []);

  const handleDelete = useCallback(async (cardId: string) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, isProcessing: true } : card
      )
    );

    try {
      await deleteFlashcardPermanently(cardId);
      setCards((prev) => prev.filter((card) => card.id !== cardId));
    } catch (err) {
      setCards((prev) =>
        prev.map((card) =>
          card.id === cardId ? { ...card, isProcessing: false } : card
        )
      );
      throw err instanceof Error ? err : new Error('Failed to delete card permanently');
    }
  }, []);

  return {
    cards,
    isLoading,
    error,
    handleRestore,
    handleDelete,
  };
}
