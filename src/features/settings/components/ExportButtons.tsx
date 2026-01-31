import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ExportButtonsProps {
  isLoading: boolean;
  onExport: (format: 'json' | 'csv') => Promise<void>;
}

export function ExportButtons({ isLoading, onExport }: ExportButtonsProps) {
  const [exportingFormat, setExportingFormat] = useState<'json' | 'csv' | null>(null);

  const handleExport = async (format: 'json' | 'csv') => {
    setExportingFormat(format);
    try {
      await onExport(format);
      toast.success(`Data exported successfully as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to export data. Please try again.');
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Export Data</h2>
        <p className="text-sm text-muted-foreground">
          Download your flashcard data in JSON or CSV format
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => handleExport('json')}
          disabled={isLoading || exportingFormat !== null}
        >
          <Download className="mr-2 h-4 w-4" />
          {exportingFormat === 'json' ? 'Exporting...' : 'Export to JSON'}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleExport('csv')}
          disabled={isLoading || exportingFormat !== null}
        >
          <Download className="mr-2 h-4 w-4" />
          {exportingFormat === 'csv' ? 'Exporting...' : 'Export to CSV'}
        </Button>
      </div>
    </div>
  );
}
