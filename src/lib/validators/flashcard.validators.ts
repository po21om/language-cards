import { z } from 'zod';

export const ListFlashcardsQuerySchema = z.object({
  status: z.enum(['review', 'active', 'archived']).optional(),
  source: z.enum(['manual', 'ai']).optional(),
  tags: z.string().optional(),
  include_deleted: z.coerce.boolean().optional().default(false),
  sort: z.enum(['created_at', 'updated_at']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const CreateFlashcardSchema = z.object({
  front: z.string().min(1).max(2000),
  back: z.string().min(1).max(2000),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(['review', 'active', 'archived']).optional().default('active'),
});

export const UpdateFlashcardSchema = z.object({
  front: z.string().min(1).max(2000).optional(),
  back: z.string().min(1).max(2000).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['review', 'active', 'archived']).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export const BulkDeleteSchema = z.object({
  flashcard_ids: z.array(z.string().uuid()).min(1),
});

export const ExportFlashcardsQuerySchema = z.object({
  format: z.enum(['csv', 'json']),
  status: z.enum(['review', 'active', 'archived']).optional().default('active'),
});

export const FlashcardIdParamSchema = z.object({
  id: z.string().uuid(),
});
