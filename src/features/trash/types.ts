import type { FlashcardResponseDTO } from '@/types';

export interface FlashcardViewModel extends FlashcardResponseDTO {
  /** Time remaining until permanent deletion, as a human-readable string (e.g., "29 days"). */
  timeRemaining: string;

  /** Indicates if an action (restore/delete) is currently being processed for this card. */
  isProcessing: boolean;
}
