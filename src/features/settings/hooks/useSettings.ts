import { useState, useCallback, useEffect } from 'react';
import type {
  ProfileDTO,
  UpdateProfileRequest,
  LanguagePreference,
  DeleteAccountResponse,
} from '@/types';
import type { SettingsViewModel } from '../types';

interface UseSettingsReturn {
  viewModel: SettingsViewModel;
  updateLanguage: (language: LanguagePreference) => Promise<void>;
  exportData: (format: 'json' | 'csv') => Promise<void>;
  deleteAccount: () => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
}

async function fetchProfile(): Promise<ProfileDTO> {
  const response = await fetch('/api/v1/profile', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.statusText}`);
  }

  return response.json();
}

async function updateProfile(data: UpdateProfileRequest): Promise<ProfileDTO> {
  const response = await fetch('/api/v1/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update profile: ${response.statusText}`);
  }

  return response.json();
}

async function fetchFlashcardsForExport(format: 'json' | 'csv'): Promise<any> {
  const response = await fetch(`/api/v1/flashcards/export?format=${format}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch flashcards: ${response.statusText}`);
  }

  if (format === 'json') {
    return response.json();
  }
  
  return response.text();
}

async function callDeleteAccount(): Promise<DeleteAccountResponse> {
  const response = await fetch('/api/v1/auth/account', {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete account: ${response.statusText}`);
  }

  return response.json();
}

async function callSignOut(): Promise<void> {
  const response = await fetch('/api/v1/auth/signout', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to sign out: ${response.statusText}`);
  }
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function useSettings(): UseSettingsReturn {
  const [viewModel, setViewModel] = useState<SettingsViewModel>({
    language: 'en',
    isLoading: false,
    error: null,
    isModalOpen: false,
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await fetchProfile();
        setViewModel((prev) => ({
          ...prev,
          language: profile.language_preference as LanguagePreference,
        }));
      } catch (err) {
        setViewModel((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to load profile',
        }));
      }
    };

    loadProfile();
  }, []);

  const updateLanguage = useCallback(async (language: LanguagePreference) => {
    setViewModel((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const updatedProfile = await updateProfile({ language_preference: language });
      setViewModel((prev) => ({
        ...prev,
        language: updatedProfile.language_preference as LanguagePreference,
        isLoading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update language';
      setViewModel((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      throw err;
    }
  }, []);

  const exportData = useCallback(async (format: 'json' | 'csv') => {
    setViewModel((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await fetchFlashcardsForExport(format);
      const timestamp = new Date().toISOString().split('T')[0];

      if (format === 'json') {
        const jsonContent = JSON.stringify(data, null, 2);
        downloadFile(jsonContent, `flashcards-${timestamp}.json`, 'application/json');
      } else {
        downloadFile(data, `flashcards-${timestamp}.csv`, 'text/csv');
      }

      setViewModel((prev) => ({ ...prev, isLoading: false }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      setViewModel((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      throw err;
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    setViewModel((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await callDeleteAccount();
      await callSignOut();
      window.location.href = '/';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account';
      setViewModel((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        isModalOpen: false,
      }));
      throw err;
    }
  }, []);

  const openModal = useCallback(() => {
    setViewModel((prev) => ({ ...prev, isModalOpen: true }));
  }, []);

  const closeModal = useCallback(() => {
    setViewModel((prev) => ({ ...prev, isModalOpen: false }));
  }, []);

  return {
    viewModel,
    updateLanguage,
    exportData,
    deleteAccount,
    openModal,
    closeModal,
  };
}
