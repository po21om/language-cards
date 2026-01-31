import type { StudyOutcome } from '@/types';

export interface StudyCardViewModel {
  id: string;
  front: string;
  back: string;
  tags: string[];
  outcome: StudyOutcome | null;
}

export interface StudySessionViewModel {
  sessionId: string;
  cards: StudyCardViewModel[];
  totalCards: number;
  currentCardIndex: number;
  isFlipped: boolean;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  status: 'loading' | 'studying' | 'submitting' | 'finished' | 'error';
  error: string | null;
}
