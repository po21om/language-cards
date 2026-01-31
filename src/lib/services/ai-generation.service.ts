import type { SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
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
  AIGenerationLogEntity,
} from "../../types";
import type { AIServiceConfig, ParsedFlashcardSuggestion } from "./types/ai-service.types";
import { OpenRouterService } from "./openrouter.service";

type SupabaseClient = BaseSupabaseClient<Database>;

export class ServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

export class AIGenerationService {
  private readonly openRouterService: OpenRouterService;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly supabase: SupabaseClient;

  constructor(config: AIServiceConfig, supabase: SupabaseClient) {
    this.openRouterService = new OpenRouterService();
    this.model = config.model || "openai/gpt-4";
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 2000;
    this.supabase = supabase;
  }

  async generateFlashcards(text: string, targetCount: number, userId: string): Promise<AIGenerateResponse> {
    const sanitizedText = this.sanitizeTextInput(text);
    const systemPrompt = `You are a flashcard generation assistant. Generate high-quality flashcards from the provided text. Each flashcard should have a clear question (front) and a concise answer (back). Include relevant tags for categorization. Return your response as a JSON array of objects with "front", "back", and "tags" fields.`;
    const userPrompt = `Generate ${targetCount} flashcards from the following text:\n\n${sanitizedText}\n\nReturn a JSON array of flashcard objects.`;

    const aiResponse = await this.openRouterService.chatCompletion({
      model: this.model,
      systemMessage: systemPrompt,
      userMessage: userPrompt,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    });
    const suggestions = this.parseGenerationResponse(aiResponse);

    const { data: generationLog, error: logError } = await this.supabase
      .from("ai_generation_logs")
      .insert({
        user_id: userId,
        input_length: sanitizedText.length,
        cards_generated: suggestions.length,
        cards_accepted: 0,
        cards_rejected: 0,
        cards_refined: 0,
      })
      .select()
      .single();

    if (logError || !generationLog) {
      throw new Error("Failed to create generation log");
    }

    const suggestionsWithIds: AICardSuggestion[] = suggestions.map((s) => ({
      suggestion_id: crypto.randomUUID(),
      front: s.front,
      back: s.back,
      suggested_tags: s.tags || [],
    }));

    return {
      generation_id: generationLog.id,
      suggestions: suggestionsWithIds,
      input_length: sanitizedText.length,
      cards_generated: suggestions.length,
      timestamp: generationLog.timestamp,
    };
  }

  async refineSuggestion(request: AIRefineRequest): Promise<AIRefineResponse> {
    const sanitizedInstruction = this.sanitizeTextInput(request.refinement_instruction);
    const systemPrompt = `You are a flashcard refinement assistant. Refine the provided flashcard according to the user's instructions. Return your response as a JSON object with "front", "back", and "tags" fields.`;
    const userPrompt = `Refine this flashcard:\n\nFront: ${request.front}\nBack: ${request.back}\n\nInstruction: ${sanitizedInstruction}\n\nReturn a JSON object with the refined flashcard.`;

    const aiResponse = await this.openRouterService.chatCompletion({
      model: this.model,
      systemMessage: systemPrompt,
      userMessage: userPrompt,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    });
    const refined = this.parseRefinementResponse(aiResponse);

    return {
      suggestion_id: request.suggestion_id,
      front: refined.front,
      back: refined.back,
      suggested_tags: refined.tags || [],
    };
  }

  async acceptSuggestions(request: AIAcceptRequest, userId: string): Promise<AIAcceptResponse> {
    const { data: log, error: logError } = await this.supabase
      .from("ai_generation_logs")
      .select("id, user_id")
      .eq("id", request.generation_id)
      .single();

    if (logError || !log || log.user_id !== userId) {
      throw new Error("Generation log not found");
    }

    const flashcardsToInsert = request.accepted_suggestions.map((s) => ({
      user_id: userId,
      front: s.front,
      back: s.back,
      tags: s.tags,
      status: s.status,
      source: "ai" as const,
      generation_id: request.generation_id,
    }));

    const { data: createdCards, error: insertError } = await this.supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select();

    if (insertError || !createdCards) {
      throw new Error("Failed to create flashcards");
    }

    const { data: updatedLog, error: updateError } = await this.supabase
      .from("ai_generation_logs")
      .update({
        cards_accepted: request.accepted_suggestions.length,
        cards_rejected: request.rejected_suggestions.length,
        cards_refined: request.refined_count,
      })
      .eq("id", request.generation_id)
      .select()
      .single();

    if (updateError || !updatedLog) {
      throw new Error("Failed to update generation log");
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

  async getGenerationHistory(userId: string, limit: number, offset: number): Promise<AIGenerationHistoryResponse> {
    const {
      data: logs,
      error: logsError,
      count,
    } = await this.supabase
      .from("ai_generation_logs")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      throw new Error("Failed to retrieve generation history");
    }

    const total = count || 0;
    const hasMore = offset + limit < total;

    const { data: allLogs, error: metricsError } = await this.supabase
      .from("ai_generation_logs")
      .select("cards_generated, cards_accepted")
      .eq("user_id", userId);

    if (metricsError) {
      throw new Error("Failed to calculate metrics");
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

  private sanitizeTextInput(text: string): string {
    return text
      .trim()
      .replace(/[\x00-\x1F\x7F]/g, "")
      .replace(/\s+/g, " ")
      .substring(0, 1800);
  }

  private parseGenerationResponse(response: string | object): ParsedFlashcardSuggestion[] {
    try {
      const parsed = typeof response === "string" ? JSON.parse(response) : response;

      if (parsed.flashcards && Array.isArray(parsed.flashcards)) {
        return parsed.flashcards;
      }

      if (Array.isArray(parsed)) {
        return parsed;
      }

      throw new Error("Invalid response format");
    } catch (error) {
      throw new ServiceUnavailableError("Failed to parse AI response");
    }
  }

  private parseRefinementResponse(response: string | object): ParsedFlashcardSuggestion {
    try {
      const parsed = typeof response === "string" ? JSON.parse(response) : response;

      if (parsed.front && parsed.back) {
        return parsed;
      }

      throw new Error("Invalid response format");
    } catch (error) {
      throw new ServiceUnavailableError("Failed to parse AI response");
    }
  }
}
