import type { FlashcardStatus } from '@/types';

export interface FlashcardViewModel {
  id: string;
  front: string;
  back: string;
  tags: string[];
  status: FlashcardStatus;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardFormValues {
  front: string;
  back: string;
  tags: string[];
}
