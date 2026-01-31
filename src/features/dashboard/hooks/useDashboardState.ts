import { useState, useCallback, useEffect } from 'react';
import type {
  FlashcardResponseDTO,
  FlashcardListResponse,
  CreateFlashcardRequest,
  UpdateFlashcardRequest,
  DeleteFlashcardResponse,
  PaginationMeta,
  FlashcardStatus,
} from '@/types';
import type { FlashcardViewModel, FlashcardFormValues } from '../types';

interface DashboardFilters {
  status: FlashcardStatus;
  tags: string[];
}

interface UseDashboardStateReturn {
  cards: FlashcardViewModel[];
  pagination: PaginationMeta | null;
  filters: DashboardFilters;
  isLoading: boolean;
  error: Error | null;
  isModalOpen: boolean;
  editingCard: FlashcardViewModel | null;
  loadMore: () => Promise<void>;
  setFilters: (filters: DashboardFilters) => void;
  handleCreate: (data: FlashcardFormValues) => Promise<void>;
  handleUpdate: (cardId: string, data: FlashcardFormValues) => Promise<void>;
  handleDelete: (cardId: string) => Promise<void>;
  handleRestore: (cardId: string) => Promise<void>;
  openModal: (card?: FlashcardViewModel) => void;
  closeModal: () => void;
}

const CARDS_PER_PAGE = 20;

function transformToViewModel(dto: FlashcardResponseDTO): FlashcardViewModel {
  return {
    id: dto.id,
    front: dto.front,
    back: dto.back,
    tags: dto.tags || [],
    status: dto.status,
    isDeleted: dto.deleted_at !== null,
    createdAt: new Date(dto.created_at).toLocaleDateString(),
    updatedAt: new Date(dto.updated_at).toLocaleDateString(),
  };
}

async function fetchFlashcards(
  limit: number,
  offset: number,
  filters: DashboardFilters
): Promise<FlashcardListResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  params.append('status', filters.status);

  if (filters.tags.length > 0) {
    params.append('tags', filters.tags.join(','));
  }

  if (filters.status === 'archived') {
    params.append('include_deleted', 'true');
  }

  const response = await fetch(`/api/v1/flashcards?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch flashcards: ${response.statusText}`);
  }

  return response.json();
}

async function createFlashcard(data: FlashcardFormValues): Promise<FlashcardResponseDTO> {
  const payload: CreateFlashcardRequest = {
    front: data.front,
    back: data.back,
    tags: data.tags,
  };

  const response = await fetch('/api/v1/flashcards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create flashcard: ${response.statusText}`);
  }

  return response.json();
}

async function updateFlashcard(
  cardId: string,
  data: FlashcardFormValues
): Promise<FlashcardResponseDTO> {
  const payload: UpdateFlashcardRequest = {
    front: data.front,
    back: data.back,
    tags: data.tags,
  };

  const response = await fetch(`/api/v1/flashcards/${cardId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to update flashcard: ${response.statusText}`);
  }

  return response.json();
}

async function deleteFlashcard(cardId: string): Promise<DeleteFlashcardResponse> {
  const response = await fetch(`/api/v1/flashcards/${cardId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete flashcard: ${response.statusText}`);
  }

  return response.json();
}

async function restoreFlashcard(cardId: string): Promise<FlashcardResponseDTO> {
  const response = await fetch(`/api/v1/flashcards/${cardId}/restore`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to restore flashcard: ${response.statusText}`);
  }

  return response.json();
}

export function useDashboardState(): UseDashboardStateReturn {
  const [cards, setCards] = useState<FlashcardViewModel[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [filters, setFiltersState] = useState<DashboardFilters>({
    status: 'active',
    tags: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashcardViewModel | null>(null);

  const loadCards = useCallback(
    async (append = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const offset = append && pagination ? pagination.offset + pagination.limit : 0;
        const response = await fetchFlashcards(CARDS_PER_PAGE, offset, filters);

        const viewModels = response.data.map(transformToViewModel);

        setCards((prev) => (append ? [...prev, ...viewModels] : viewModels));
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination]
  );

  useEffect(() => {
    loadCards(false);
  }, [filters]);

  const loadMore = useCallback(async () => {
    if (pagination?.has_more && !isLoading) {
      await loadCards(true);
    }
  }, [pagination, isLoading, loadCards]);

  const setFilters = useCallback((newFilters: DashboardFilters) => {
    setFiltersState(newFilters);
  }, []);

  const handleCreate = useCallback(
    async (data: FlashcardFormValues) => {
      try {
        const newCard = await createFlashcard(data);
        const viewModel = transformToViewModel(newCard);

        if (viewModel.status === filters.status) {
          setCards((prev) => [viewModel, ...prev]);
        }

        closeModal();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to create card'));
        throw err;
      }
    },
    [filters.status]
  );

  const handleUpdate = useCallback(async (cardId: string, data: FlashcardFormValues) => {
    try {
      const updatedCard = await updateFlashcard(cardId, data);
      const viewModel = transformToViewModel(updatedCard);

      setCards((prev) =>
        prev.map((card) => (card.id === cardId ? viewModel : card))
      );

      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update card'));
      throw err;
    }
  }, []);

  const handleDelete = useCallback(async (cardId: string) => {
    try {
      await deleteFlashcard(cardId);
      setCards((prev) => prev.filter((card) => card.id !== cardId));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete card'));
      throw err;
    }
  }, []);

  const handleRestore = useCallback(async (cardId: string) => {
    try {
      const restoredCard = await restoreFlashcard(cardId);
      const viewModel = transformToViewModel(restoredCard);

      setCards((prev) => prev.filter((card) => card.id !== cardId));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to restore card'));
      throw err;
    }
  }, []);

  const openModal = useCallback((card?: FlashcardViewModel) => {
    setEditingCard(card || null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCard(null);
  }, []);

  return {
    cards,
    pagination,
    filters,
    isLoading,
    error,
    isModalOpen,
    editingCard,
    loadMore,
    setFilters,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleRestore,
    openModal,
    closeModal,
  };
}
