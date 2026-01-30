import type { SupabaseClient as BaseSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type {
  AIGenerateResponse,
  AICardSuggestion,
  AIRefineRequest,
  AIRefineResponse,
  AIAcceptRequest,
  AIAcceptResponse,
  AIGenerationHistoryResponse,
  FlashcardResponseDTO,
  FlashcardEntity,
} from '../../types';
import type { AIServiceConfig } from './types/ai-service.types';

type SupabaseClient = BaseSupabaseClient<Database>;

export class MockAIGenerationService {
  private readonly supabase: SupabaseClient;

  constructor(config: AIServiceConfig, supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async generateFlashcards(
    text: string,
    targetCount: number,
    userId: string
  ): Promise<AIGenerateResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const suggestions: AICardSuggestion[] = [];
    for (let i = 0; i < targetCount; i++) {
      suggestions.push({
        suggestion_id: crypto.randomUUID(),
        front: `Mock Question ${i + 1} from: "${text.substring(0, 30)}..."`,
        back: `Mock Answer ${i + 1}: This is a generated response based on the input text.`,
        suggested_tags: ['mock', 'test', 'ai-generated'],
      });
    }

    const { data: generationLog, error: logError } = await this.supabase
      .from('ai_generation_logs')
      .insert({
        user_id: userId,
        input_length: text.length,
        cards_generated: suggestions.length,
        cards_accepted: 0,
        cards_rejected: 0,
        cards_refined: 0,
      })
      .select()
      .single();

    if (logError || !generationLog) {
      console.error('Database error creating generation log:', logError);
      throw new Error('Failed to create generation log');
    }

    return {
      generation_id: generationLog.id,
      suggestions,
      input_length: text.length,
      cards_generated: suggestions.length,
      timestamp: generationLog.timestamp,
    };
  }

  async refineSuggestion(request: AIRefineRequest): Promise<AIRefineResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      suggestion_id: request.suggestion_id,
      front: `${request.front} (refined)`,
      back: `${request.back} - Refined based on: "${request.refinement_instruction}"`,
      suggested_tags: ['refined', 'mock', 'test'],
    };
  }

  async acceptSuggestions(
    request: AIAcceptRequest,
    userId: string
  ): Promise<AIAcceptResponse> {
    const { data: log, error: logError } = await this.supabase
      .from('ai_generation_logs')
      .select('id, user_id')
      .eq('id', request.generation_id)
      .single();

    if (logError || !log || log.user_id !== userId) {
      throw new Error('Generation log not found');
    }

    const flashcardsToInsert = request.accepted_suggestions.map((s) => ({
      user_id: userId,
      front: s.front,
      back: s.back,
      tags: s.tags,
      status: s.status,
      source: 'ai' as const,
      generation_id: request.generation_id,
    }));

    const { data: createdCards, error: insertError } = await this.supabase
      .from('flashcards')
      .insert(flashcardsToInsert)
      .select();

    if (insertError || !createdCards) {
      throw new Error('Failed to create flashcards');
    }

    const { data: updatedLog, error: updateError } = await this.supabase
      .from('ai_generation_logs')
      .update({
        cards_accepted: request.accepted_suggestions.length,
        cards_rejected: request.rejected_suggestions.length,
        cards_refined: request.refined_count,
      })
      .eq('id', request.generation_id)
      .select()
      .single();

    if (updateError || !updatedLog) {
      throw new Error('Failed to update generation log');
    }

    const responseCards: FlashcardResponseDTO[] = createdCards.map((card: FlashcardEntity) => {
      const { user_id, ...rest } = card;
      return rest;
    });

    return {
      created_cards: responseCards,
      generation_log: {
        id: updatedLog.id,
        cards_accepted: updatedLog.cards_accepted,
        cards_rejected: updatedLog.cards_rejected,
        cards_refined: updatedLog.cards_refined,
        cards_generated: updatedLog.cards_generated,
      },
    };
  }

  async getGenerationHistory(
    userId: string,
    limit: number,
    offset: number
  ): Promise<AIGenerationHistoryResponse> {
    const { data: logs, error: logsError, count } = await this.supabase
      .from('ai_generation_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      throw new Error('Failed to retrieve generation history');
    }

    const total = count || 0;
    const hasMore = offset + limit < total;

    const { data: allLogs, error: metricsError } = await this.supabase
      .from('ai_generation_logs')
      .select('cards_generated, cards_accepted')
      .eq('user_id', userId);

    if (metricsError) {
      throw new Error('Failed to calculate metrics');
    }

    const totalGenerated = allLogs?.reduce((sum: number, log) => sum + log.cards_generated, 0) || 0;
    const totalAccepted = allLogs?.reduce((sum: number, log) => sum + log.cards_accepted, 0) || 0;
    const acceptanceRate = totalGenerated > 0 ? (totalAccepted / totalGenerated) * 100 : 0;

    return {
      data: logs || [],
      pagination: {
        total,
        limit,
        offset,
        has_more: hasMore,
      },
      metrics: {
        total_generations: total,
        total_cards_generated: totalGenerated,
        total_cards_accepted: totalAccepted,
        acceptance_rate: Math.round(acceptanceRate * 10) / 10,
      },
    };
  }
}
