import { useState, useCallback } from 'react';
import type {
  AIGenerateRequest,
  AIGenerateResponse,
  AIRefineRequest,
  AIRefineResponse,
  AIAcceptRequest,
  AIAcceptResponse,
  FlashcardStatus,
} from '@/types';
import type { SuggestionViewModel, ViewStatus } from '../types';

const MAX_CHARACTER_LIMIT = 1800;

export function useGenerationState() {
  const [sourceText, setSourceText] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionViewModel[]>([]);
  const [viewStatus, setViewStatus] = useState<ViewStatus>('idle');
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTextChange = useCallback((text: string) => {
    setSourceText(text);
    setError(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!sourceText.trim() || sourceText.length > MAX_CHARACTER_LIMIT) {
      return;
    }

    setViewStatus('loading');
    setError(null);

    try {
      const requestBody: AIGenerateRequest = {
        text: sourceText,
      };

      const response = await fetch('/api/v1/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate flashcards');
      }

      const data: AIGenerateResponse = await response.json();

      const viewModels: SuggestionViewModel[] = data.suggestions.map((suggestion) => ({
        ...suggestion,
        ui_status: 'reviewing',
        is_edited: false,
      }));

      setSuggestions(viewModels);
      setGenerationId(data.generation_id);
      setViewStatus('reviewing');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setViewStatus('idle');
    }
  }, [sourceText]);

  const handleUpdateSuggestion = useCallback((id: string, front: string, back: string) => {
    setSuggestions((prev) =>
      prev.map((suggestion) =>
        suggestion.suggestion_id === id
          ? { ...suggestion, front, back, is_edited: true, ui_status: 'reviewing' }
          : suggestion
      )
    );
  }, []);

  const handleRefineSuggestion = useCallback(async (id: string, instruction: string) => {
    const suggestion = suggestions.find((s) => s.suggestion_id === id);
    if (!suggestion) {
      return;
    }

    setSuggestions((prev) =>
      prev.map((s) => (s.suggestion_id === id ? { ...s, ui_status: 'refining' } : s))
    );
    setError(null);

    try {
      const requestBody: AIRefineRequest = {
        suggestion_id: id,
        front: suggestion.front,
        back: suggestion.back,
        refinement_instruction: instruction,
      };

      const response = await fetch('/api/v1/ai/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to refine flashcard');
      }

      const data: AIRefineResponse = await response.json();

      setSuggestions((prev) =>
        prev.map((s) =>
          s.suggestion_id === id
            ? {
                ...s,
                front: data.front,
                back: data.back,
                suggested_tags: data.suggested_tags,
                ui_status: 'reviewing',
                is_edited: false,
              }
            : s
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refine flashcard';
      setError(errorMessage);
      setSuggestions((prev) =>
        prev.map((s) => (s.suggestion_id === id ? { ...s, ui_status: 'reviewing' } : s))
      );
    }
  }, [suggestions]);

  const handleAcceptSuggestion = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((suggestion) =>
        suggestion.suggestion_id === id ? { ...suggestion, ui_status: 'accepted' } : suggestion
      )
    );
  }, []);

  const handleRejectSuggestion = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((suggestion) =>
        suggestion.suggestion_id === id ? { ...suggestion, ui_status: 'rejected' } : suggestion
      )
    );
  }, []);

  const handleAcceptAll = useCallback(() => {
    setSuggestions((prev) =>
      prev.map((suggestion) => ({ ...suggestion, ui_status: 'accepted' }))
    );
  }, []);

  const handleRejectAll = useCallback(() => {
    setSuggestions((prev) =>
      prev.map((suggestion) => ({ ...suggestion, ui_status: 'rejected' }))
    );
  }, []);

  const handleSubmitAccepted = useCallback(async () => {
    if (!generationId) {
      setError('No generation ID available');
      return;
    }

    const acceptedSuggestions = suggestions
      .filter((s) => s.ui_status === 'accepted')
      .map((s) => ({
        suggestion_id: s.suggestion_id,
        front: s.front,
        back: s.back,
        tags: s.suggested_tags,
        status: (s.is_edited ? 'active' : 'review') as FlashcardStatus,
      }));

    const rejectedSuggestions = suggestions
      .filter((s) => s.ui_status === 'rejected')
      .map((s) => s.suggestion_id);

    const refinedCount = suggestions.filter((s) => s.is_edited).length;

    if (acceptedSuggestions.length === 0) {
      setError('No flashcards selected to add');
      return;
    }

    setViewStatus('submitting');
    setError(null);

    try {
      const requestBody: AIAcceptRequest = {
        generation_id: generationId,
        accepted_suggestions: acceptedSuggestions,
        rejected_suggestions: rejectedSuggestions,
        refined_count: refinedCount,
      };

      const response = await fetch('/api/v1/ai/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to save flashcards');
      }

      const data: AIAcceptResponse = await response.json();

      setSourceText('');
      setSuggestions([]);
      setGenerationId(null);
      setViewStatus('idle');

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save flashcards';
      setError(errorMessage);
      setViewStatus('reviewing');
    }
  }, [generationId, suggestions]);

  const isGenerationDisabled =
    !sourceText.trim() ||
    sourceText.length > MAX_CHARACTER_LIMIT ||
    viewStatus === 'loading' ||
    viewStatus === 'submitting';

  const characterCount = sourceText.length;

  return {
    sourceText,
    suggestions,
    viewStatus,
    generationId,
    error,
    characterCount,
    isGenerationDisabled,
    handleTextChange,
    handleGenerate,
    handleUpdateSuggestion,
    handleRefineSuggestion,
    handleAcceptSuggestion,
    handleRejectSuggestion,
    handleAcceptAll,
    handleRejectAll,
    handleSubmitAccepted,
    clearError: () => setError(null),
  };
}
