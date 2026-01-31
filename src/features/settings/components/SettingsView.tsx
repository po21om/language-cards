import { useSettings } from '../hooks/useSettings';
import { LanguageSelector } from './LanguageSelector';
import { ExportButtons } from './ExportButtons';
import { DeleteAccount } from './DeleteAccount';
import { UserHeader } from '@/components/UserHeader';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';

interface SettingsViewProps {
  userEmail: string;
}

export function SettingsView({ userEmail }: SettingsViewProps) {
  const {
    viewModel,
    updateLanguage,
    exportData,
    deleteAccount,
    openModal,
    closeModal,
  } = useSettings();

  return (
    <div className="container mx-auto space-y-8 py-8">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/dashboard'}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <UserHeader userEmail={userEmail} isOnSettingsPage={true} />
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and data
          </p>
        </div>

        {viewModel.error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              {viewModel.error}
            </p>
          </div>
        )}

        <div className="space-y-8">
          <LanguageSelector
            currentLanguage={viewModel.language}
            isLoading={viewModel.isLoading}
            onLanguageChange={updateLanguage}
          />

          <Separator />

          <ExportButtons
            isLoading={viewModel.isLoading}
            onExport={exportData}
          />

          <Separator />

          <DeleteAccount
            isModalOpen={viewModel.isModalOpen}
            isLoading={viewModel.isLoading}
            onOpenModal={openModal}
            onCloseModal={closeModal}
            onConfirmDelete={deleteAccount}
          />
        </div>
      </div>
    </div>
  );
}
