import { useState } from 'react';
import { toast } from 'sonner';
import { useDashboardState } from '../hooks/useDashboardState';
import {
  PrimaryActions,
  FilterControls,
  FlashcardDataTable,
  CreateCardModal,
} from './index';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { UserHeader } from '@/components/UserHeader';
import type { FlashcardViewModel } from '../types';

interface DashboardViewProps {
  userEmail: string;
}

export function DashboardView({ userEmail }: DashboardViewProps) {
  const {
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
  } = useDashboardState();

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    card: FlashcardViewModel | null;
  }>({ isOpen: false, card: null });

  const handleNavigateToStudy = () => {
    window.location.href = '/study';
  };

  const handleNavigateToGenerate = () => {
    window.location.href = '/generate';
  };

  const handleModalSubmit = async (data: any) => {
    try {
      if (editingCard) {
        await handleUpdate(editingCard.id, data);
        toast.success('Flashcard updated successfully');
      } else {
        await handleCreate(data);
        toast.success('Flashcard created successfully');
      }
    } catch (err) {
      toast.error('Failed to save flashcard. Please try again.');
    }
  };

  const handleDeleteClick = (card: FlashcardViewModel) => {
    setDeleteConfirm({ isOpen: true, card });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.card) return;

    try {
      await handleDelete(deleteConfirm.card.id);
      toast.success('Flashcard deleted successfully');
      setDeleteConfirm({ isOpen: false, card: null });
    } catch (err) {
      toast.error('Failed to delete flashcard. Please try again.');
    }
  };

  const handleRestoreClick = async (cardId: string) => {
    try {
      await handleRestore(cardId);
      toast.success('Flashcard restored successfully');
    } catch (err) {
      toast.error('Failed to restore flashcard. Please try again.');
    }
  };

  return (
    <div className="container mx-auto space-y-8 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your flashcards and start studying
            </p>
          </div>
          <UserHeader userEmail={userEmail} />
        </div>

        <PrimaryActions
          onStartStudy={handleNavigateToStudy}
          onGenerateWithAI={handleNavigateToGenerate}
          onAddCard={() => openModal()}
        />

        <FilterControls
          currentStatus={filters.status}
          onStatusChange={(status) => setFilters({ ...filters, status })}
        />

        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              {error.message || 'An error occurred. Please try again.'}
            </p>
          </div>
        )}

        {isLoading && cards.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Loading flashcards...</p>
          </div>
        ) : (
          <FlashcardDataTable
            cards={cards}
            hasMore={pagination?.has_more || false}
            isLoading={isLoading}
            onLoadMore={loadMore}
            onEdit={openModal}
            onDelete={handleDeleteClick}
            onRestore={handleRestoreClick}
          />
        )}
      </div>

      <CreateCardModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        initialData={editingCard || undefined}
      />

      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, card: null })}
        onConfirm={handleDeleteConfirm}
        cardFront={deleteConfirm.card?.front || ''}
      />
    </div>
  );
}
