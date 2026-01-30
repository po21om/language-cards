import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  FlashcardEntity,
  StudyOutcome,
  StatisticsPeriod,
  StartStudySessionQuery,
  StudyStatisticsResponse,
  CardStudyHistoryResponse,
  StudyReviewResponseDTO,
} from '../../types';

export class StudyService {
  constructor(private supabase: SupabaseClient) {}

  calculateNewWeight(previousWeight: number, outcome: StudyOutcome): number {
    let newWeight: number;

    switch (outcome) {
      case 'correct':
        newWeight = Math.max(0.5, previousWeight * 0.8);
        break;
      case 'incorrect':
        newWeight = Math.min(5.0, previousWeight * 1.5);
        break;
      case 'skipped':
        newWeight = Math.min(5.0, previousWeight * 1.1);
        break;
    }

    return newWeight;
  }

  async selectStudyCards(
    userId: string,
    filters: StartStudySessionQuery
  ): Promise<FlashcardEntity[]> {
    const cardCount = filters.card_count || 20;
    const status = filters.status || 'active';
    
    let queryBuilder = this.supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .is('deleted_at', null);

    if (filters.tags) {
      const tagsArray = filters.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      if (tagsArray.length > 0) {
        queryBuilder = queryBuilder.overlaps('tags', tagsArray);
      }
    }

    queryBuilder = queryBuilder.order('study_weight', { ascending: false });

    const candidateCount = Math.min(cardCount * 2, 100);
    queryBuilder = queryBuilder.limit(candidateCount);

    const { data, error } = await queryBuilder;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    const cards = data as FlashcardEntity[];

    if (cards.length <= cardCount) {
      return cards;
    }

    return this.weightedRandomSample(cards, cardCount);
  }

  private weightedRandomSample(cards: FlashcardEntity[], count: number): FlashcardEntity[] {
    const totalWeight = cards.reduce((sum, card) => sum + card.study_weight, 0);
    const selected: FlashcardEntity[] = [];
    const remaining = [...cards];

    for (let i = 0; i < count && remaining.length > 0; i++) {
      const currentTotalWeight = remaining.reduce((sum, card) => sum + card.study_weight, 0);
      let random = Math.random() * currentTotalWeight;
      
      for (let j = 0; j < remaining.length; j++) {
        random -= remaining[j].study_weight;
        if (random <= 0) {
          selected.push(remaining[j]);
          remaining.splice(j, 1);
          break;
        }
      }
    }

    return selected;
  }

  async calculateStudyStreak(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('study_reviews')
      .select('reviewed_at')
      .eq('user_id', userId)
      .order('reviewed_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return 0;
    }

    const dates = data.map(review => {
      const date = new Date(review.reviewed_at);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    });

    const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);

    if (uniqueDates.length === 0) {
      return 0;
    }

    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let streak = 0;
    let expectedDate = todayMidnight;

    for (const dateMs of uniqueDates) {
      if (dateMs === expectedDate) {
        streak++;
        expectedDate -= oneDayMs;
      } else if (dateMs === expectedDate + oneDayMs && streak === 0) {
        continue;
      } else {
        break;
      }
    }

    return streak;
  }

  async getStudyStatistics(
    userId: string,
    period: StatisticsPeriod
  ): Promise<StudyStatisticsResponse> {
    let timeFilter: Date | null = null;

    if (period !== 'all') {
      const now = new Date();
      switch (period) {
        case 'day':
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    let reviewsQuery = this.supabase
      .from('study_reviews')
      .select('*')
      .eq('user_id', userId);

    if (timeFilter) {
      reviewsQuery = reviewsQuery.gte('reviewed_at', timeFilter.toISOString());
    }

    const { data: reviews, error: reviewsError } = await reviewsQuery;

    if (reviewsError) {
      throw reviewsError;
    }

    const totalReviews = reviews?.length || 0;
    const correctReviews = reviews?.filter(r => r.outcome === 'correct').length || 0;
    const incorrectReviews = reviews?.filter(r => r.outcome === 'incorrect').length || 0;
    const skippedReviews = reviews?.filter(r => r.outcome === 'skipped').length || 0;

    const nonSkippedReviews = totalReviews - skippedReviews;
    const accuracyRate = nonSkippedReviews > 0 
      ? (correctReviews / nonSkippedReviews) * 100 
      : 0;

    const cardsStudied = reviews 
      ? new Set(reviews.map(r => r.card_id)).size 
      : 0;

    const { data: avgWeightData, error: avgWeightError } = await this.supabase
      .from('flashcards')
      .select('study_weight')
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('deleted_at', null);

    if (avgWeightError) {
      throw avgWeightError;
    }

    const averageWeight = avgWeightData && avgWeightData.length > 0
      ? avgWeightData.reduce((sum, card) => sum + card.study_weight, 0) / avgWeightData.length
      : 1.0;

    const studyStreakDays = await this.calculateStudyStreak(userId);

    const lastStudySession = reviews && reviews.length > 0
      ? reviews.reduce((latest, review) => {
          const reviewDate = new Date(review.reviewed_at);
          return reviewDate > latest ? reviewDate : latest;
        }, new Date(0)).toISOString()
      : null;

    return {
      period,
      total_reviews: totalReviews,
      correct_reviews: correctReviews,
      incorrect_reviews: incorrectReviews,
      skipped_reviews: skippedReviews,
      accuracy_rate: Math.round(accuracyRate * 100) / 100,
      cards_studied: cardsStudied,
      average_weight: Math.round(averageWeight * 100) / 100,
      study_streak_days: studyStreakDays,
      last_study_session: lastStudySession,
    };
  }

  async getCardHistory(
    userId: string,
    cardId: string,
    limit: number
  ): Promise<CardStudyHistoryResponse> {
    const { data: reviews, error: reviewsError } = await this.supabase
      .from('study_reviews')
      .select('*')
      .eq('card_id', cardId)
      .order('reviewed_at', { ascending: false })
      .limit(limit);

    if (reviewsError) {
      throw reviewsError;
    }

    const { data: allReviews, error: allReviewsError } = await this.supabase
      .from('study_reviews')
      .select('outcome')
      .eq('card_id', cardId);

    if (allReviewsError) {
      throw allReviewsError;
    }

    const totalReviews = allReviews?.length || 0;
    const correctCount = allReviews?.filter(r => r.outcome === 'correct').length || 0;
    const incorrectCount = allReviews?.filter(r => r.outcome === 'incorrect').length || 0;
    const skippedCount = allReviews?.filter(r => r.outcome === 'skipped').length || 0;

    const nonSkippedReviews = totalReviews - skippedCount;
    const accuracyRate = nonSkippedReviews > 0 
      ? (correctCount / nonSkippedReviews) * 100 
      : 0;

    const reviewsWithoutUserId: StudyReviewResponseDTO[] = (reviews || []).map(
      ({ user_id, ...rest }) => rest
    );

    return {
      card_id: cardId,
      reviews: reviewsWithoutUserId,
      total_reviews: totalReviews,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      accuracy_rate: Math.round(accuracyRate * 100) / 100,
    };
  }
}
