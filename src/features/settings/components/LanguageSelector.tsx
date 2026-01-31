import { toast } from 'sonner';
import type { LanguagePreference } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface LanguageSelectorProps {
  currentLanguage: LanguagePreference;
  isLoading: boolean;
  onLanguageChange: (language: LanguagePreference) => Promise<void>;
}

export function LanguageSelector({
  currentLanguage,
  isLoading,
  onLanguageChange,
}: LanguageSelectorProps) {
  const handleChange = async (value: string) => {
    try {
      await onLanguageChange(value as LanguagePreference);
      toast.success('Language preference updated successfully');
    } catch (err) {
      toast.error('Failed to update language preference. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Language Preference</h2>
        <p className="text-sm text-muted-foreground">
          Choose your preferred interface language. Your preference will be saved to your profile.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="language-select">Interface Language</Label>
        <Select
          value={currentLanguage}
          onValueChange={handleChange}
          disabled={isLoading}
        >
          <SelectTrigger id="language-select" className="w-full max-w-xs">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="pl">Polish</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
