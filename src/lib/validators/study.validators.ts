import { z } from 'zod';
import type { StudyOutcome, StatisticsPeriod, FlashcardStatus } from '../../types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function isValidStudyOutcome(value: string): value is StudyOutcome {
  return value === 'correct' || value === 'incorrect' || value === 'skipped';
}

export function isValidStatisticsPeriod(value: string): value is StatisticsPeriod {
  return value === 'day' || value === 'week' || value === 'month' || value === 'all';
}

export function isValidFlashcardStatus(value: string): value is FlashcardStatus {
  return value === 'review' || value === 'active' || value === 'archived';
}

export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function parseTags(tagsString: string): string[] {
  if (!tagsString || tagsString.trim() === '') {
    return [];
  }
  
  return tagsString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

export const startStudySessionQuerySchema = z.object({
  card_count: z.coerce.number().int().min(1).max(50).optional().default(20),
  tags: z.string().optional(),
  status: z.enum(['review', 'active', 'archived']).optional().default('active'),
});

export const submitStudyReviewSchema = z.object({
  card_id: z.string().uuid(),
  outcome: z.enum(['correct', 'incorrect', 'skipped']),
});

export const studyStatisticsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'all']).optional().default('all'),
});

export const cardStudyHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
