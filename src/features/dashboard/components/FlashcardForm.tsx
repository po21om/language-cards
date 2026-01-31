import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { FlashcardFormValues, FlashcardViewModel } from '../types';

const flashcardSchema = z.object({
  front: z.string().min(1, 'Front is required').max(2000, 'Front must be less than 2000 characters'),
  back: z.string().min(1, 'Back is required').max(2000, 'Back must be less than 2000 characters'),
  tags: z.array(z.string()),
}) satisfies z.ZodType<FlashcardFormValues>;

interface FlashcardFormProps {
  onSubmit: (data: FlashcardFormValues) => Promise<void>;
  initialData?: FlashcardViewModel;
  onCancel: () => void;
}

export function FlashcardForm({ onSubmit, initialData, onCancel }: FlashcardFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FlashcardFormValues>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: {
      front: initialData?.front || '',
      back: initialData?.back || '',
      tags: initialData?.tags || [],
    },
  });

  const tags = watch('tags');

  const handleTagsChange = (value: string) => {
    const tagArray = value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    setValue('tags', tagArray);
  };

  const onSubmitForm = async (data: FlashcardFormValues) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="front">Front</Label>
        <Textarea
          id="front"
          {...register('front')}
          placeholder="Enter the question or prompt"
          rows={3}
          aria-invalid={errors.front ? 'true' : 'false'}
        />
        {errors.front && (
          <p className="text-sm text-destructive">{errors.front.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="back">Back</Label>
        <Textarea
          id="back"
          {...register('back')}
          placeholder="Enter the answer"
          rows={3}
          aria-invalid={errors.back ? 'true' : 'false'}
        />
        {errors.back && (
          <p className="text-sm text-destructive">{errors.back.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          type="text"
          defaultValue={tags.join(', ')}
          onChange={(e) => handleTagsChange(e.target.value)}
          placeholder="e.g., vocabulary, grammar, verbs"
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
