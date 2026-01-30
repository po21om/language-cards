import type { Tables, TablesInsert, TablesUpdate } from './db/database.types';

// ============================================================================
// Database Entity Aliases
// ============================================================================

/**
 * User profile entity from database
 */
export type ProfileEntity = Tables<'profiles'>;

/**
 * Flashcard entity from database
 */
export type FlashcardEntity = Tables<'flashcards'>;

/**
 * AI generation log entity from database
 */
export type AIGenerationLogEntity = Tables<'ai_generation_logs'>;

/**
 * Study review entity from database
 */
export type StudyReviewEntity = Tables<'study_reviews'>;

/**
 * Flashcard export view entity from database
 */
export type FlashcardExportEntity = Tables<'view_flashcards_export'>;

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/**
 * Session token information
 */
export interface SessionInfo {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

/**
 * Outcome of a study review
 */
export type StudyOutcome = 'correct' | 'incorrect' | 'skipped';

/**
 * Flashcard status
 */
export type FlashcardStatus = 'review' | 'active' | 'archived';

/**
 * Flashcard source
 */
export type FlashcardSource = 'manual' | 'ai';

/**
 * Language preference
 */
export type LanguagePreference = 'en' | 'pl';

/**
 * Export format
 */
export type ExportFormat = 'csv' | 'json';

/**
 * Statistics period
 */
export type StatisticsPeriod = 'day' | 'week' | 'month' | 'all';

/**
 * Sort field for flashcards
 */
export type FlashcardSortField = 'created_at' | 'updated_at';

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc';

// ============================================================================
// Authentication DTOs and Command Models
// ============================================================================

/**
 * Sign up request payload
 */
export interface AuthSignUpRequest {
  email: string;
  password: string;
}

/**
 * User information in auth responses
 */
export interface AuthUser {
  id: string;
  email: string;
  created_at?: string;
}

/**
 * Sign up response with user and session
 */
export interface AuthSignUpResponse {
  user: AuthUser;
  session: SessionInfo;
}

/**
 * Sign in request payload
 */
export interface AuthSignInRequest {
  email: string;
  password: string;
}

/**
 * Sign in response with user and session
 */
export interface AuthSignInResponse {
  user: AuthUser;
  session: SessionInfo;
}

/**
 * Sign out response
 */
export interface AuthSignOutResponse {
  message: string;
}

/**
 * Refresh token request payload
 */
export interface AuthRefreshRequest {
  refresh_token: string;
}

/**
 * Refresh token response with new access token
 */
export interface AuthRefreshResponse {
  access_token: string;
  expires_at: string;
}

/**
 * Delete account response
 */
export interface DeleteAccountResponse {
  message: string;
}

// ============================================================================
// Profile DTOs and Command Models
// ============================================================================

/**
 * User profile DTO - direct mapping to database entity
 */
export type ProfileDTO = ProfileEntity;

/**
 * Update profile request - only updatable fields
 */
export interface UpdateProfileRequest {
  language_preference?: LanguagePreference;
}

// ============================================================================
// Flashcard DTOs and Command Models
// ============================================================================

/**
 * Flashcard DTO - direct mapping to database entity
 */
export type FlashcardDTO = FlashcardEntity;

/**
 * Paginated list of flashcards response
 */
export interface FlashcardListResponse {
  data: FlashcardDTO[];
  pagination: PaginationMeta;
}

/**
 * Create flashcard request (manual creation)
 */
export interface CreateFlashcardRequest {
  front: string;
  back: string;
  tags?: string[];
  status?: FlashcardStatus;
}

/**
 * Update flashcard request - partial update of fields
 */
export interface UpdateFlashcardRequest {
  front?: string;
  back?: string;
  tags?: string[];
  status?: FlashcardStatus;
}

/**
 * Soft delete flashcard response
 */
export interface DeleteFlashcardResponse {
  id: string;
  message: string;
  deleted_at: string;
}

/**
 * Bulk delete flashcards request
 */
export interface BulkDeleteRequest {
  flashcard_ids: string[];
}

/**
 * Bulk delete flashcards response
 */
export interface BulkDeleteResponse {
  deleted_count: number;
  deleted_ids: string[];
  message: string;
}

/**
 * Export flashcard data item - based on export view
 */
export type ExportFlashcardDTO = Required<FlashcardExportEntity>;

/**
 * Export flashcards response (JSON format)
 */
export interface ExportFlashcardsResponse {
  data: ExportFlashcardDTO[];
  exported_at: string;
  total_cards: number;
}

/**
 * List flashcards query parameters
 */
export interface ListFlashcardsQuery {
  status?: FlashcardStatus;
  source?: FlashcardSource;
  tags?: string;
  include_deleted?: boolean;
  sort?: FlashcardSortField;
  order?: SortOrder;
  limit?: number;
  offset?: number;
}

// ============================================================================
// AI Generation DTOs and Command Models
// ============================================================================

/**
 * AI generation request payload
 */
export interface AIGenerateRequest {
  text: string;
  target_count?: number;
}

/**
 * Single AI-generated card suggestion (not yet persisted to database)
 */
export interface AICardSuggestion {
  suggestion_id: string;
  front: string;
  back: string;
  suggested_tags: string[];
}

/**
 * AI generation response with suggestions
 */
export interface AIGenerateResponse {
  generation_id: string;
  suggestions: AICardSuggestion[];
  input_length: number;
  cards_generated: number;
  timestamp: string;
}

/**
 * AI refine request payload
 */
export interface AIRefineRequest {
  suggestion_id: string;
  front: string;
  back: string;
  refinement_instruction: string;
}

/**
 * AI refine response - refined suggestion
 */
export type AIRefineResponse = AICardSuggestion;

/**
 * Accepted AI suggestion with user modifications
 */
export interface AcceptedSuggestion {
  suggestion_id: string;
  front: string;
  back: string;
  tags: string[];
  status: FlashcardStatus;
}

/**
 * Accept AI suggestions request payload
 */
export interface AIAcceptRequest {
  generation_id: string;
  accepted_suggestions: AcceptedSuggestion[];
  rejected_suggestions: string[];
  refined_count: number;
}

/**
 * AI generation log summary in accept response
 */
export interface AIGenerationLogSummary {
  id: string;
  cards_accepted: number;
  cards_rejected: number;
  cards_refined: number;
  cards_generated: number;
}

/**
 * Accept AI suggestions response
 */
export interface AIAcceptResponse {
  created_cards: FlashcardDTO[];
  generation_log: AIGenerationLogSummary;
}

/**
 * AI generation log DTO - direct mapping to database entity
 */
export type AIGenerationLogDTO = AIGenerationLogEntity;

/**
 * AI generation metrics summary
 */
export interface AIGenerationMetrics {
  total_generations: number;
  total_cards_generated: number;
  total_cards_accepted: number;
  acceptance_rate: number;
}

/**
 * AI generation history response with pagination and metrics
 */
export interface AIGenerationHistoryResponse {
  data: AIGenerationLogDTO[];
  pagination: PaginationMeta;
  metrics: AIGenerationMetrics;
}

// ============================================================================
// Study Session DTOs and Command Models
// ============================================================================

/**
 * Card in study session - limited fields for study interface
 */
export interface StudyCardDTO {
  id: string;
  front: string;
  tags: string[];
  current_weight: number;
}

/**
 * Start study session response
 */
export interface StartStudySessionResponse {
  session_id: string;
  cards: StudyCardDTO[];
  total_cards: number;
  started_at: string;
}

/**
 * Start study session query parameters
 */
export interface StartStudySessionQuery {
  card_count?: number;
  tags?: string;
  status?: FlashcardStatus;
}

/**
 * Submit study review request payload
 */
export interface SubmitStudyReviewRequest {
  card_id: string;
  outcome: StudyOutcome;
}

/**
 * Study review DTO - direct mapping to database entity
 */
export type StudyReviewDTO = StudyReviewEntity;

/**
 * Study statistics response
 */
export interface StudyStatisticsResponse {
  period: StatisticsPeriod;
  total_reviews: number;
  correct_reviews: number;
  incorrect_reviews: number;
  skipped_reviews: number;
  accuracy_rate: number;
  cards_studied: number;
  average_weight: number;
  study_streak_days: number;
  last_study_session: string | null;
}

/**
 * Study statistics query parameters
 */
export interface StudyStatisticsQuery {
  period?: StatisticsPeriod;
}

/**
 * Card study history response
 */
export interface CardStudyHistoryResponse {
  card_id: string;
  reviews: StudyReviewDTO[];
  total_reviews: number;
  correct_count: number;
  incorrect_count: number;
  accuracy_rate: number;
}

/**
 * Card study history query parameters
 */
export interface CardStudyHistoryQuery {
  limit?: number;
}

// ============================================================================
// Error Response Types
// ============================================================================

/**
 * Error detail information
 */
export interface ErrorDetails {
  field?: string;
  constraint?: string;
  min?: number;
  max?: number;
  [key: string]: unknown;
}

/**
 * Error object structure
 */
export interface ErrorObject {
  code: string;
  message: string;
  details?: ErrorDetails;
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: ErrorObject;
  timestamp: string;
}

/**
 * Common error codes
 */
export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';
