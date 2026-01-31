import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudyService } from './study.service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FlashcardEntity, StudyOutcome } from '../../types';

// Mock SupabaseClient
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  is: vi.fn(() => mockSupabase),
  overlaps: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  limit: vi.fn(() => mockSupabase),
  gte: vi.fn(() => mockSupabase),
  // Add any other methods you need to mock
} as unknown as SupabaseClient;

describe('StudyService', () => {
  let studyService: StudyService;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    studyService = new StudyService(mockSupabase);
  });

  describe('calculateNewWeight', () => {
    it.each([
      // Correct outcomes
      { previous: 2.5, outcome: 'correct', expected: 2.0 },
      { previous: 0.6, outcome: 'correct', expected: 0.5 }, // Should hit the floor
      { previous: 0.5, outcome: 'correct', expected: 0.5 }, // Already at the floor

      // Incorrect outcomes
      { previous: 2.0, outcome: 'incorrect', expected: 3.0 },
      { previous: 3.4, outcome: 'incorrect', expected: 5.0 }, // Should hit the ceiling
      { previous: 5.0, outcome: 'incorrect', expected: 5.0 }, // Already at the ceiling

      // Skipped outcomes
      { previous: 2.0, outcome: 'skipped', expected: 2.2 },
      { previous: 4.6, outcome: 'skipped', expected: 5.0 }, // Should hit the ceiling
      { previous: 5.0, outcome: 'skipped', expected: 5.0 }, // Already at the ceiling
    ])('calculates new weight of $expected for previous weight $previous and outcome $outcome', ({ previous, outcome, expected }) => {
      expect(studyService.calculateNewWeight(previous, outcome as StudyOutcome)).toBe(expected);
    });
  });

  describe('selectStudyCards', () => {
    const mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      overlaps: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    };

    const generateMockCards = (count: number): FlashcardEntity[] => {
      return Array.from({ length: count }, (_, i) => ({
        id: `card-${i}`,
        user_id: 'user-1',
        front: `Front ${i}`,
        back: `Back ${i}`,
        tags: ['tag1'],
        status: 'active',
        source: 'manual',
        study_weight: 1.0 + i * 0.1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        generation_id: null,
      }));
    };

    beforeEach(() => {
      vi.spyOn(mockSupabase, 'from').mockReturnValue(mockQueryBuilder as any);
    });

    it('should return an empty array if no cards are found', async () => {
      (mockQueryBuilder as any).limit.mockResolvedValue({ data: [], error: null });
      const cards = await studyService.selectStudyCards('user-1', {});
      expect(cards).toEqual([]);
    });

    it('should return all cards if the number of candidates is less than or equal to the requested count', async () => {
      const mockCards = generateMockCards(5);
      (mockQueryBuilder as any).limit.mockResolvedValue({ data: mockCards, error: null });
      const cards = await studyService.selectStudyCards('user-1', { card_count: 10 });
      expect(cards).toHaveLength(5);
      expect(cards).toEqual(mockCards);
    });

    it('should apply default filters when none are provided', async () => {
      (mockQueryBuilder as any).limit.mockResolvedValue({ data: [], error: null });
      await studyService.selectStudyCards('user-1', {});
      expect(mockSupabase.from).toHaveBeenCalledWith('flashcards');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockQueryBuilder.is).toHaveBeenCalledWith('deleted_at', null);
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('study_weight', { ascending: false });
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(40); // Default card_count is 20, so candidateCount is 40
    });

    it('should apply tag filters when provided', async () => {
      (mockQueryBuilder as any).limit.mockResolvedValue({ data: [], error: null });
      await studyService.selectStudyCards('user-1', { tags: 'tag1, tag2' });
      expect(mockQueryBuilder.overlaps).toHaveBeenCalledWith('tags', ['tag1', 'tag2']);
    });

    it('should call weightedRandomSample when more cards are available than requested', async () => {
      const mockCards = generateMockCards(15);
      (mockQueryBuilder as any).limit.mockResolvedValue({ data: mockCards, error: null });
      
      // Spy on the private method
      const privateSamplerSpy = vi.spyOn(studyService as any, 'weightedRandomSample');

      await studyService.selectStudyCards('user-1', { card_count: 10 });

      expect(privateSamplerSpy).toHaveBeenCalled();
      expect(privateSamplerSpy).toHaveBeenCalledWith(mockCards, 10);
    });

    it('should throw an error if the database call fails', async () => {
      const dbError = new Error('Database query failed');
      (mockQueryBuilder as any).limit.mockResolvedValue({ data: null, error: dbError });
      await expect(studyService.selectStudyCards('user-1', {})).rejects.toThrow(dbError);
    });
  });

  describe('calculateStudyStreak', () => {
    const mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    };

    beforeEach(() => {
      // Ensure the mock chain is reset for each test in this suite
      vi.spyOn(mockSupabase, 'from').mockReturnValue(mockQueryBuilder as any);
    });

    it('should return 0 for a user with no reviews', async () => {
      (mockQueryBuilder as any).order.mockResolvedValue({ data: [], error: null });
      const streak = await studyService.calculateStudyStreak('user-1');
      expect(streak).toBe(0);
    });

    it('should return 1 for a single review today', async () => {
      const today = new Date();
      (mockQueryBuilder as any).order.mockResolvedValue({ data: [{ reviewed_at: today.toISOString() }], error: null });
      const streak = await studyService.calculateStudyStreak('user-1');
      expect(streak).toBe(1);
    });

    it('should return 1 for a single review yesterday', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      (mockQueryBuilder as any).order.mockResolvedValue({ data: [{ reviewed_at: yesterday.toISOString() }], error: null });
      const streak = await studyService.calculateStudyStreak('user-1');
      expect(streak).toBe(1);
    });

    it('should return 0 for a single review two days ago', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      (mockQueryBuilder as any).order.mockResolvedValue({ data: [{ reviewed_at: twoDaysAgo.toISOString() }], error: null });
      const streak = await studyService.calculateStudyStreak('user-1');
      expect(streak).toBe(0);
    });

    it('should return a 3-day streak for reviews on today, yesterday, and the day before', async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
      const reviews = [
        { reviewed_at: today.toISOString() },
        { reviewed_at: yesterday.toISOString() },
        { reviewed_at: twoDaysAgo.toISOString() },
      ];
      (mockQueryBuilder as any).order.mockResolvedValue({ data: reviews, error: null });
      const streak = await studyService.calculateStudyStreak('user-1');
      expect(streak).toBe(3);
    });

    it('should ignore multiple reviews on the same day', async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const reviews = [
        { reviewed_at: today.toISOString() },
        { reviewed_at: new Date(today.getTime() - 1000 * 60).toISOString() }, // A minute ago
        { reviewed_at: yesterday.toISOString() },
      ];
      (mockQueryBuilder as any).order.mockResolvedValue({ data: reviews, error: null });
      const streak = await studyService.calculateStudyStreak('user-1');
      expect(streak).toBe(2);
    });

    it('should break the streak if a day is missed', async () => {
      const today = new Date();
      const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
      const reviews = [
        { reviewed_at: today.toISOString() },
        { reviewed_at: twoDaysAgo.toISOString() },
      ];
      (mockQueryBuilder as any).order.mockResolvedValue({ data: reviews, error: null });
      const streak = await studyService.calculateStudyStreak('user-1');
      expect(streak).toBe(1);
    });

    it('should handle streak starting from yesterday', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const reviews = [
        { reviewed_at: yesterday.toISOString() },
        { reviewed_at: twoDaysAgo.toISOString() },
      ];
      (mockQueryBuilder as any).order.mockResolvedValue({ data: reviews, error: null });
      const streak = await studyService.calculateStudyStreak('user-1');
      expect(streak).toBe(2);
    });

    it('should throw an error if the database call fails', async () => {
      const dbError = new Error('Database connection failed');
      (mockQueryBuilder as any).order.mockResolvedValue({ data: null, error: dbError });
      await expect(studyService.calculateStudyStreak('user-1')).rejects.toThrow(dbError);
    });
  });

  describe('getStudyStatistics', () => {
    beforeEach(() => {
      // Mock the streak calculation to isolate statistics logic
      vi.spyOn(studyService, 'calculateStudyStreak').mockResolvedValue(5);
    });

    it('should return zero/default stats when no reviews are found', async () => {
      const reviewsMock = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: [], error: null }) };
      const cardsMock = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockResolvedValue({ data: [], error: null }) };
      vi.spyOn(mockSupabase, 'from').mockImplementation((tableName: string) => {
        if (tableName === 'study_reviews') return reviewsMock as any;
        if (tableName === 'flashcards') return cardsMock as any;
        return {} as any;
      });

      const stats = await studyService.getStudyStatistics('user-1', 'all');

      expect(stats).toMatchInlineSnapshot(`
        {
          "accuracy_rate": 0,
          "average_weight": 1,
          "cards_studied": 0,
          "correct_reviews": 0,
          "incorrect_reviews": 0,
          "last_study_session": null,
          "period": "all",
          "skipped_reviews": 0,
          "study_streak_days": 5,
          "total_reviews": 0,
        }
      `);
    });

    it('should calculate statistics correctly for the "all" period', async () => {
      const reviews = [
        { card_id: 'c1', outcome: 'correct', reviewed_at: new Date().toISOString() },
        { card_id: 'c2', outcome: 'correct', reviewed_at: new Date().toISOString() },
        { card_id: 'c1', outcome: 'incorrect', reviewed_at: new Date().toISOString() },
        { card_id: 'c3', outcome: 'skipped', reviewed_at: new Date().toISOString() },
      ];
      const flashcards = [
        { study_weight: 1.5 },
        { study_weight: 2.5 },
      ];

      const reviewsMock = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: reviews, error: null }) };
      const cardsMock = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockResolvedValue({ data: flashcards, error: null }) };
      vi.spyOn(mockSupabase, 'from').mockImplementation((tableName: string) => {
        if (tableName === 'study_reviews') return reviewsMock as any;
        if (tableName === 'flashcards') return cardsMock as any;
        return {} as any;
      });

      const stats = await studyService.getStudyStatistics('user-1', 'all');

      expect(stats.total_reviews).toBe(4);
      expect(stats.correct_reviews).toBe(2);
      expect(stats.incorrect_reviews).toBe(1);
      expect(stats.skipped_reviews).toBe(1);
      expect(stats.cards_studied).toBe(3);
      expect(stats.accuracy_rate).toBe(66.67);
      expect(stats.average_weight).toBe(2.0);
    });

    it('should throw an error if fetching reviews fails', async () => {
      const dbError = new Error('Failed to fetch reviews');
      const reviewsMock = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: null, error: dbError }) };
      const cardsMock = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockResolvedValue({ data: [], error: null }) };
      vi.spyOn(mockSupabase, 'from').mockImplementation((tableName: string) => {
        if (tableName === 'study_reviews') return reviewsMock as any;
        if (tableName === 'flashcards') return cardsMock as any;
        return {} as any;
      });

      await expect(studyService.getStudyStatistics('user-1', 'all')).rejects.toThrow(dbError);
    });

    it('should throw an error if fetching flashcards for average weight fails', async () => {
      const dbError = new Error('Failed to fetch flashcards');
      const reviewsMock = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: [], error: null }) };
      const cardsMock = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockResolvedValue({ data: null, error: dbError }) };
      vi.spyOn(mockSupabase, 'from').mockImplementation((tableName: string) => {
        if (tableName === 'study_reviews') return reviewsMock as any;
        if (tableName === 'flashcards') return cardsMock as any;
        return {} as any;
      });

      await expect(studyService.getStudyStatistics('user-1', 'all')).rejects.toThrow(dbError);
    });
  });

  describe('getCardHistory', () => {
    it('should return correct history and statistics', async () => {
      const cardId = 'card-abc';
      const recentReviews = [
        { id: 'r1', user_id: 'user-1', outcome: 'correct', reviewed_at: new Date().toISOString() },
        { id: 'r2', user_id: 'user-1', outcome: 'incorrect', reviewed_at: new Date().toISOString() },
      ];
      const allReviews = [
        { outcome: 'correct' },
        { outcome: 'incorrect' },
        { outcome: 'correct' },
        { outcome: 'skipped' },
      ];

      const recentReviewsMock = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: recentReviews, error: null }) };
      const allReviewsMock = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: allReviews, error: null }) };

      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce(recentReviewsMock as any)
        .mockReturnValueOnce(allReviewsMock as any);

      const history = await studyService.getCardHistory('user-1', cardId, 2);

      expect(history.card_id).toBe(cardId);
      expect(history.reviews).toHaveLength(2);
      expect(history.reviews[0]).not.toHaveProperty('user_id');
      expect(history.total_reviews).toBe(4);
      expect(history.correct_count).toBe(2);
      expect(history.incorrect_count).toBe(1);
      expect(history.accuracy_rate).toBe(66.67);
    });

    it('should return zero stats for a card with no history', async () => {
      const emptyMock = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [], error: null }) };
      const emptyAllMock = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: [], error: null }) };

      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce(emptyMock as any)
        .mockReturnValueOnce(emptyAllMock as any);

      const history = await studyService.getCardHistory('user-1', 'card-new', 10);

      expect(history).toMatchInlineSnapshot(`
        {
          "accuracy_rate": 0,
          "card_id": "card-new",
          "correct_count": 0,
          "incorrect_count": 0,
          "reviews": [],
          "total_reviews": 0,
        }
      `);
    });

    it('should throw an error if the first database call fails', async () => {
      const dbError = new Error('Failed to fetch recent reviews');
      const errorMock = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: null, error: dbError }) };
      vi.spyOn(mockSupabase, 'from').mockReturnValue(errorMock as any);

      await expect(studyService.getCardHistory('user-1', 'card-err', 10)).rejects.toThrow(dbError);
    });

    it('should throw an error if the second database call fails', async () => {
      const dbError = new Error('Failed to fetch all reviews');
      const recentReviewsMock = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [{ id: 'r1' }], error: null }) };
      const errorMock = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: null, error: dbError }) };

      vi.spyOn(mockSupabase, 'from')
        .mockReturnValueOnce(recentReviewsMock as any)
        .mockReturnValueOnce(errorMock as any);

      await expect(studyService.getCardHistory('user-1', 'card-err', 10)).rejects.toThrow(dbError);
    });
  });
});
