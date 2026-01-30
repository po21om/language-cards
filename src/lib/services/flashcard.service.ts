import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  FlashcardDTO,
  FlashcardListResponse,
  CreateFlashcardRequest,
  UpdateFlashcardRequest,
  ListFlashcardsQuery,
  FlashcardStatus,
  ExportFormat,
  ExportFlashcardDTO,
  ExportFlashcardsResponse,
} from '../../types';

interface RestoreResult {
  status: 'restored' | 'not_found' | 'not_deleted' | 'permanently_deleted';
  flashcard?: FlashcardDTO;
}

interface BulkDeleteResult {
  deleted_count: number;
  deleted_ids: string[];
}

export class FlashcardService {
  constructor(private supabase: SupabaseClient) {}

  async listFlashcards(
    userId: string,
    query: ListFlashcardsQuery
  ): Promise<FlashcardListResponse> {
    let queryBuilder = this.supabase
      .from('flashcards')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    if (query.source) {
      queryBuilder = queryBuilder.eq('source', query.source);
    }

    if (query.tags) {
      const tagsArray = query.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      if (tagsArray.length > 0) {
        queryBuilder = queryBuilder.overlaps('tags', tagsArray);
      }
    }

    if (!query.include_deleted) {
      queryBuilder = queryBuilder.is('deleted_at', null);
    }

    const sortField = query.sort || 'created_at';
    const sortOrder = query.order || 'desc';
    queryBuilder = queryBuilder.order(sortField, { ascending: sortOrder === 'asc' });

    const limit = query.limit || 20;
    const offset = query.offset || 0;

    const { data, error, count } = await queryBuilder.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    const total = count || 0;
    const flashcards = (data || []) as FlashcardDTO[];

    const flashcardsWithoutUserId = flashcards.map(({ user_id, ...rest }) => rest);

    return {
      data: flashcardsWithoutUserId,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
      },
    };
  }

  async getFlashcardById(userId: string, cardId: string): Promise<FlashcardDTO | null> {
    const { data, error } = await this.supabase
      .from('flashcards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as FlashcardDTO;
  }

  async createFlashcard(
    userId: string,
    data: CreateFlashcardRequest
  ): Promise<FlashcardDTO> {
    const insertData = {
      user_id: userId,
      front: data.front,
      back: data.back,
      tags: data.tags || [],
      status: data.status || 'active',
      source: 'manual' as const,
      study_weight: 1.0,
    };

    const { data: flashcard, error } = await this.supabase
      .from('flashcards')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return flashcard as FlashcardDTO;
  }

  async updateFlashcard(
    userId: string,
    cardId: string,
    data: UpdateFlashcardRequest
  ): Promise<FlashcardDTO | null> {
    const existing = await this.getFlashcardById(userId, cardId);
    if (!existing) {
      return null;
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.front !== undefined) {
      updateData.front = data.front;
    }
    if (data.back !== undefined) {
      updateData.back = data.back;
    }
    if (data.tags !== undefined) {
      updateData.tags = data.tags;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    const { data: updated, error } = await this.supabase
      .from('flashcards')
      .update(updateData)
      .eq('id', cardId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return updated as FlashcardDTO;
  }

  async softDeleteFlashcard(
    userId: string,
    cardId: string
  ): Promise<{ id: string; deleted_at: string } | null> {
    const existing = await this.getFlashcardById(userId, cardId);
    if (!existing) {
      return null;
    }

    const deletedAt = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('flashcards')
      .update({ deleted_at: deletedAt })
      .eq('id', cardId)
      .eq('user_id', userId)
      .select('id, deleted_at')
      .single();

    if (error) {
      throw error;
    }

    return data as { id: string; deleted_at: string };
  }

  async restoreFlashcard(userId: string, cardId: string): Promise<RestoreResult> {
    const { data: flashcard, error } = await this.supabase
      .from('flashcards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { status: 'not_found' };
      }
      throw error;
    }

    const card = flashcard as FlashcardDTO;

    if (!card.deleted_at) {
      return { status: 'not_deleted' };
    }

    const deletedDate = new Date(card.deleted_at);
    const now = new Date();
    const daysDiff = (now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > 30) {
      return { status: 'permanently_deleted' };
    }

    const { data: restored, error: restoreError } = await this.supabase
      .from('flashcards')
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .eq('user_id', userId)
      .select()
      .single();

    if (restoreError) {
      throw restoreError;
    }

    return {
      status: 'restored',
      flashcard: restored as FlashcardDTO,
    };
  }

  async bulkDeleteFlashcards(userId: string, cardIds: string[]): Promise<BulkDeleteResult> {
    const deletedAt = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('flashcards')
      .update({ deleted_at: deletedAt })
      .in('id', cardIds)
      .eq('user_id', userId)
      .select('id');

    if (error) {
      throw error;
    }

    const deletedIds = (data || []).map((item: { id: string }) => item.id);

    return {
      deleted_count: deletedIds.length,
      deleted_ids: deletedIds,
    };
  }

  async exportFlashcards(
    userId: string,
    format: ExportFormat,
    status?: FlashcardStatus
  ): Promise<ExportFlashcardsResponse | string> {
    let queryBuilder = this.supabase
      .from('flashcards')
      .select('id, front, back, tags, source, created_at, updated_at')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    queryBuilder = queryBuilder.order('created_at', { ascending: false });

    const { data, error } = await queryBuilder;

    if (error) {
      throw error;
    }

    const flashcards = (data || []) as ExportFlashcardDTO[];

    if (format === 'json') {
      return {
        data: flashcards,
        exported_at: new Date().toISOString(),
        total_cards: flashcards.length,
      };
    }

    const csvHeaders = 'id,front,back,tags,source,created_at,updated_at';
    const csvRows = flashcards.map(card => {
      const tags = Array.isArray(card.tags) ? card.tags.join(';') : '';
      const front = card.front || '';
      const back = card.back || '';
      return [
        card.id,
        `"${front.replace(/"/g, '""')}"`,
        `"${back.replace(/"/g, '""')}"`,
        `"${tags}"`,
        card.source,
        card.created_at,
        card.updated_at,
      ].join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  }
}
