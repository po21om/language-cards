import { useState, useCallback, useEffect } from 'react';
import type {
  StartStudySessionResponse,
  StartStudySessionQuery,
  SubmitStudyReviewRequest,
  SubmitStudyReviewResponse,
  StudyOutcome,
} from '@/types';
import type { StudySessionViewModel, StudyCardViewModel } from '../types';

interface UseStudySessionReturn {
  session: StudySessionViewModel | null;
  flipCard: () => Promise<void>;
  submitReview: (outcome: StudyOutcome) => Promise<void>;
  retryFetch: () => Promise<void>;
}

async function startStudySession(
  filters?: StartStudySessionQuery
): Promise<StartStudySessionResponse> {
  const params = new URLSearchParams();

  if (filters?.card_count) {
    params.append('card_count', filters.card_count.toString());
  }
  if (filters?.tags) {
    params.append('tags', filters.tags);
  }
  if (filters?.status) {
    params.append('status', filters.status);
  }

  const response = await fetch(`/api/v1/study/session?${params.toString()}`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to start study session: ${response.statusText}`);
  }

  return response.json();
}

async function fetchCardDetails(cardId: string): Promise<{ back: string }> {
  const response = await fetch(`/api/v1/flashcards/${cardId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch card details');
  }

  return response.json();
}

async function submitStudyReview(
  cardId: string,
  outcome: StudyOutcome
): Promise<SubmitStudyReviewResponse> {
  const payload: SubmitStudyReviewRequest = {
    card_id: cardId,
    outcome,
  };

  const response = await fetch('/api/v1/study/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to submit review: ${response.statusText}`);
  }

  return response.json();
}

function transformToViewModel(
  sessionData: StartStudySessionResponse
): StudySessionViewModel {
  const cards: StudyCardViewModel[] = sessionData.cards.map((card) => ({
    id: card.id,
    front: card.front,
    back: '',
    tags: card.tags,
    outcome: null,
  }));

  return {
    sessionId: sessionData.session_id,
    cards,
    totalCards: sessionData.total_cards,
    currentCardIndex: 0,
    isFlipped: false,
    correctCount: 0,
    incorrectCount: 0,
    skippedCount: 0,
    status: 'studying',
    error: null,
  };
}

export function useStudySession(
  filters?: StartStudySessionQuery
): UseStudySessionReturn {
  const [session, setSession] = useState<StudySessionViewModel | null>(null);

  const fetchStudySession = useCallback(async () => {
    setSession((prev) => ({
      ...(prev || {
        sessionId: '',
        cards: [],
        totalCards: 0,
        currentCardIndex: 0,
        isFlipped: false,
        correctCount: 0,
        incorrectCount: 0,
        skippedCount: 0,
        error: null,
      }),
      status: 'loading',
    }));

    try {
      const data = await startStudySession(filters);

      if (!data.cards || data.cards.length === 0) {
        setSession({
          sessionId: '',
          cards: [],
          totalCards: 0,
          currentCardIndex: 0,
          isFlipped: false,
          correctCount: 0,
          incorrectCount: 0,
          skippedCount: 0,
          status: 'error',
          error: 'No cards available for study. Please add some cards first.',
        });
        return;
      }

      const viewModel = transformToViewModel(data);
      setSession(viewModel);
    } catch (err) {
      setSession((prev) => ({
        ...(prev || {
          sessionId: '',
          cards: [],
          totalCards: 0,
          currentCardIndex: 0,
          isFlipped: false,
          correctCount: 0,
          incorrectCount: 0,
          skippedCount: 0,
        }),
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load study session',
      }));
    }
  }, [filters]);

  useEffect(() => {
    fetchStudySession();
  }, [fetchStudySession]);

  const flipCard = useCallback(async () => {
    if (!session || session.status !== 'studying') return;

    const currentCard = session.cards[session.currentCardIndex];
    if (!currentCard) return;

    if (!session.isFlipped && !currentCard.back) {
      try {
        const cardDetails = await fetchCardDetails(currentCard.id);
        
        setSession((prev) => {
          if (!prev) return prev;
          
          const updatedCards = [...prev.cards];
          updatedCards[prev.currentCardIndex] = {
            ...updatedCards[prev.currentCardIndex],
            back: cardDetails.back,
          };

          return {
            ...prev,
            cards: updatedCards,
            isFlipped: true,
          };
        });
      } catch (err) {
        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            error: 'Failed to load card content',
          };
        });
      }
    } else {
      setSession((prev) => {
        if (!prev || prev.status !== 'studying') return prev;

        return {
          ...prev,
          isFlipped: !prev.isFlipped,
        };
      });
    }
  }, [session]);

  const submitReview = useCallback(async (outcome: StudyOutcome) => {
    if (!session || session.status !== 'studying') return;

    const currentCard = session.cards[session.currentCardIndex];
    if (!currentCard) return;

    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, status: 'submitting' };
    });

    try {
      await submitStudyReview(currentCard.id, outcome);

      setSession((prev) => {
        if (!prev) return prev;

        const updatedCards = [...prev.cards];
        updatedCards[prev.currentCardIndex] = {
          ...updatedCards[prev.currentCardIndex],
          outcome,
        };

        const newCorrectCount = prev.correctCount + (outcome === 'correct' ? 1 : 0);
        const newIncorrectCount = prev.incorrectCount + (outcome === 'incorrect' ? 1 : 0);
        const newSkippedCount = prev.skippedCount + (outcome === 'skipped' ? 1 : 0);

        const nextIndex = prev.currentCardIndex + 1;
        const isFinished = nextIndex >= prev.totalCards;

        return {
          ...prev,
          cards: updatedCards,
          currentCardIndex: nextIndex,
          isFlipped: false,
          correctCount: newCorrectCount,
          incorrectCount: newIncorrectCount,
          skippedCount: newSkippedCount,
          status: isFinished ? 'finished' : 'studying',
        };
      });
    } catch (err) {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'studying',
          error: err instanceof Error ? err.message : 'Failed to submit review',
        };
      });
    }
  }, [session]);

  const retryFetch = useCallback(async () => {
    await fetchStudySession();
  }, [fetchStudySession]);

  return {
    session,
    flipCard,
    submitReview,
    retryFetch,
  };
}
