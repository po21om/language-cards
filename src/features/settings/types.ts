import type { LanguagePreference } from '@/types';

export interface SettingsViewModel {
  language: LanguagePreference;
  isLoading: boolean;
  error: string | null;
  isModalOpen: boolean;
}
