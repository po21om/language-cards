/**
 * Internal types for AI service communication with OpenRouter.ai
 * These types are not exposed in the public API and are used only within the service layer.
 */

/**
 * OpenRouter.ai API request structure
 * Used for both generation and refinement requests
 */
export interface OpenRouterRequest {
  /**
   * Model identifier (e.g., "openai/gpt-4", "anthropic/claude-3-opus")
   */
  model: string;

  /**
   * Array of messages forming the conversation context
   */
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;

  /**
   * Temperature for response randomness (0.0 - 2.0)
   * Lower values = more deterministic, Higher values = more creative
   * Default: 0.7
   */
  temperature?: number;

  /**
   * Maximum number of tokens to generate
   * Default: varies by model
   */
  max_tokens?: number;

  /**
   * Optional response format specification
   * Can be used to request JSON output
   */
  response_format?: {
    type: 'json_object' | 'text';
  };
}

/**
 * OpenRouter.ai API response structure
 */
export interface OpenRouterResponse {
  /**
   * Unique identifier for this completion
   */
  id: string;

  /**
   * Object type (always "chat.completion")
   */
  object: string;

  /**
   * Unix timestamp of when the completion was created
   */
  created: number;

  /**
   * Model used for the completion
   */
  model: string;

  /**
   * Array of completion choices (typically only one)
   */
  choices: Array<{
    /**
     * Index of this choice
     */
    index: number;

    /**
     * The generated message
     */
    message: {
      role: 'assistant';
      content: string;
    };

    /**
     * Reason why the model stopped generating
     * - "stop": Natural completion
     * - "length": Max tokens reached
     * - "content_filter": Content policy violation
     */
    finish_reason: 'stop' | 'length' | 'content_filter' | null;
  }>;

  /**
   * Token usage statistics
   */
  usage: {
    /**
     * Number of tokens in the prompt
     */
    prompt_tokens: number;

    /**
     * Number of tokens in the completion
     */
    completion_tokens: number;

    /**
     * Total tokens used (prompt + completion)
     */
    total_tokens: number;
  };
}

/**
 * OpenRouter.ai error response structure
 */
export interface OpenRouterErrorResponse {
  error: {
    /**
     * Error code (e.g., "invalid_request_error", "rate_limit_exceeded")
     */
    code: string;

    /**
     * Human-readable error message
     */
    message: string;

    /**
     * Optional error type
     */
    type?: string;

    /**
     * Optional parameter that caused the error
     */
    param?: string;
  };
}

/**
 * Parsed flashcard suggestion from AI response
 * Internal format before converting to AICardSuggestion
 */
export interface ParsedFlashcardSuggestion {
  front: string;
  back: string;
  tags?: string[];
}

/**
 * AI service configuration
 */
export interface AIServiceConfig {
  /**
   * OpenRouter.ai API key
   */
  apiKey: string;

  /**
   * Model to use for generation
   * Default: "openai/gpt-4"
   */
  model?: string;

  /**
   * Base URL for OpenRouter.ai API
   * Default: "https://openrouter.ai/api/v1"
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds
   * Default: 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Number of retry attempts on failure
   * Default: 2
   */
  retryAttempts?: number;

  /**
   * Temperature for generation requests
   * Default: 0.7
   */
  temperature?: number;

  /**
   * Maximum tokens for generation
   * Default: 2000
   */
  maxTokens?: number;
}

/**
 * AI generation prompt templates
 */
export interface PromptTemplates {
  /**
   * System prompt for flashcard generation
   */
  systemPrompt: string;

  /**
   * User prompt template for generation
   * Variables: {text}, {targetCount}
   */
  generatePrompt: string;

  /**
   * User prompt template for refinement
   * Variables: {front}, {back}, {instruction}
   */
  refinePrompt: string;
}
