import axios, { type AxiosInstance } from "axios";

/**
 * OpenRouter Service
 *
 * A TypeScript service for interacting with the OpenRouter API to access various Large Language Models.
 *
 * @example Basic Usage
 * ```typescript
 * const service = new OpenRouterService();
 *
 * const response = await service.chatCompletion({
 *   model: 'openai/gpt-4o',
 *   systemMessage: 'You are a helpful assistant.',
 *   userMessage: 'What is the capital of France?',
 *   temperature: 0.7,
 *   max_tokens: 500,
 * });
 *
 * console.log(response); // "The capital of France is Paris."
 * ```
 *
 * @example JSON Schema Response
 * ```typescript
 * const service = new OpenRouterService();
 *
 * const schema = {
 *   type: 'object',
 *   properties: {
 *     city: { type: 'string' },
 *     country: { type: 'string' },
 *     population: { type: 'number' },
 *   },
 *   required: ['city', 'country'],
 * };
 *
 * const response = await service.chatCompletion({
 *   model: 'openai/gpt-4o',
 *   userMessage: 'Provide details for Paris, France.',
 *   response_format: {
 *     type: 'json_schema',
 *     json_schema: {
 *       name: 'location_details',
 *       strict: true,
 *       schema: schema,
 *     },
 *   },
 * });
 *
 * console.log(response); // { city: "Paris", country: "France", population: 2161000 }
 * ```
 *
 * @example Error Handling
 * ```typescript
 * const service = new OpenRouterService();
 *
 * try {
 *   const response = await service.chatCompletion({
 *     model: 'openai/gpt-4o',
 *     userMessage: 'Hello!',
 *   });
 * } catch (error) {
 *   if (error instanceof Error) {
 *     if (error.message.includes('authentication failed')) {
 *       // Handle authentication error
 *     } else if (error.message.includes('rate limit')) {
 *       // Handle rate limit error
 *     } else {
 *       // Handle other errors
 *     }
 *   }
 * }
 * ```
 *
 * @remarks
 * - Requires OPENROUTER_API_KEY environment variable
 * - Supports all OpenRouter-compatible models (e.g., openai/gpt-4o, anthropic/claude-3-opus)
 * - Handles authentication, rate limiting, and server errors automatically
 * - Supports structured JSON outputs via JSON Schema
 *
 * @see https://openrouter.ai/docs for API documentation
 */

/**
 * Parameters for chat completion requests
 */
export interface ChatCompletionParams {
  /**
   * The user's message content
   */
  userMessage: string;

  /**
   * Optional system message to set context/behavior
   */
  systemMessage?: string;

  /**
   * Model identifier (e.g., 'openai/gpt-4o', 'anthropic/claude-3-opus')
   */
  model: string;

  /**
   * Optional response format specification for structured outputs
   */
  response_format?:
    | {
        type: "json_object";
      }
    | {
        type: "json_schema";
        json_schema: {
          name: string;
          strict?: boolean;
          schema: object;
        };
      };

  /**
   * Temperature for response randomness (0.0 - 2.0)
   * Lower values = more deterministic, Higher values = more creative
   */
  temperature?: number;

  /**
   * Maximum number of tokens to generate
   */
  max_tokens?: number;
}

/**
 * OpenRouter API service for chat completions
 * Provides a streamlined interface for interacting with various LLMs through OpenRouter
 */
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly httpClient: AxiosInstance;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is required.");
    }

    this.apiKey = apiKey;

    this.httpClient = axios.create({
      baseURL: "https://openrouter.ai/api/v1",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Builds the request payload for OpenRouter API
   * @param params - Chat completion parameters
   * @returns Formatted request payload
   */
  private buildRequestPayload(params: ChatCompletionParams): Record<string, unknown> {
    const messages = [];

    if (params.systemMessage) {
      messages.push({ role: "system", content: params.systemMessage });
    }

    messages.push({ role: "user", content: params.userMessage });

    const payload: Record<string, unknown> = {
      model: params.model,
      messages: messages,
    };

    if (params.response_format) {
      payload.response_format = params.response_format;
    }

    if (params.temperature !== undefined) {
      payload.temperature = params.temperature;
    }

    if (params.max_tokens !== undefined) {
      payload.max_tokens = params.max_tokens;
    }

    return payload;
  }

  /**
   * Parses the response from OpenRouter API
   * @param responseData - Raw API response data
   * @returns Parsed content (string or JSON object)
   */
  private parseResponse(responseData: {
    choices?: { message?: { content?: string; tool_calls?: { function?: { name?: string } }[] } }[];
  }): unknown {
    if (!responseData.choices || responseData.choices.length === 0) {
      throw new Error("No choices in API response");
    }

    const content = responseData.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in API response");
    }

    if (typeof content === "string" && responseData.choices[0]?.message?.tool_calls?.[0]?.function?.name) {
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    }

    return content;
  }

  /**
   * Sends a chat completion request to OpenRouter API
   * @param params - Chat completion parameters
   * @returns Parsed response content
   * @throws Error if API request fails or response is invalid
   */
  public async chatCompletion(params: ChatCompletionParams): Promise<unknown> {
    try {
      const payload = this.buildRequestPayload(params);
      const response = await this.httpClient.post("/chat/completions", payload);
      return this.parseResponse(response.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorData = error.response?.data;

        if (status === 401) {
          throw new Error("OpenRouter API authentication failed. Check your API key.");
        }

        if (status === 429) {
          throw new Error("OpenRouter API rate limit exceeded. Please try again later.");
        }

        if (status && status >= 500) {
          throw new Error(`OpenRouter API server error: ${status}`);
        }

        if (errorData?.error?.message) {
          throw new Error(`OpenRouter API error: ${errorData.error.message}`);
        }

        throw new Error(`OpenRouter API request failed: ${error.message}`);
      }

      throw error;
    }
  }
}
