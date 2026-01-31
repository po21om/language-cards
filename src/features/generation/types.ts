import type { AICardSuggestion } from '@/types';

export type SuggestionStatus = 'reviewing' | 'accepted' | 'rejected' | 'editing' | 'refining';

export type ViewStatus = 'idle' | 'loading' | 'reviewing' | 'submitting';

export interface SuggestionViewModel extends AICardSuggestion {
  ui_status: SuggestionStatus;
  is_edited: boolean;
}
