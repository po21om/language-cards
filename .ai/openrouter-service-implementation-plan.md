# OpenRouter Service Implementation Plan

## 1. Service Description

The `OpenRouterService` is a TypeScript class designed to act as a client for the OpenRouter API. It will provide a streamlined interface for sending chat completion requests to various Large Language Models (LLMs) supported by OpenRouter. The service will handle request construction, API communication, and response parsing, incorporating robust error handling and security best practices. It will be located in `src/lib/services/openrouter-service.ts`.

## 2. Constructor Description

The constructor will initialize the `OpenRouterService` instance. It will retrieve the OpenRouter API key from environment variables and set up the `axios` instance with the necessary authorization headers.

```typescript
import axios, { AxiosInstance } from 'axios';

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly httpClient: AxiosInstance;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set in environment variables.');
    }

    this.httpClient = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // ... methods
}
```

## 3. Public Methods and Fields

### `chatCompletion(params: ChatCompletionParams): Promise<any>`

This is the primary public method for interacting with the OpenRouter API.

- **`params`**: An object containing the parameters for the chat completion request.

#### `ChatCompletionParams` Interface:

```typescript
interface ChatCompletionParams {
  userMessage: string;
  systemMessage?: string;
  model: string; // e.g., 'openai/gpt-4o'
  response_format?: { 
    type: 'json_schema'; 
    json_schema: { 
      name: string; 
      strict?: boolean; 
      schema: object; 
    }; 
  };
  temperature?: number;
  max_tokens?: number;
}
```

## 4. Private Methods and Fields

### `private buildRequestPayload(params: ChatCompletionParams): object`

This method will construct the JSON payload for the OpenRouter API request based on the provided parameters.

### `private parseResponse(response: any): any`

This method will parse the response from the OpenRouter API, extracting the relevant data and handling different response formats (e.g., standard vs. structured JSON).

## 5. Error Handling

Errors will be handled using `try...catch` blocks within the `chatCompletion` method. The service will catch and re-throw errors from `axios` (e.g., network errors, HTTP status code errors) and internal validation errors.

Potential error scenarios:
1.  **Missing API Key**: The constructor will throw an error if `OPENROUTER_API_KEY` is not set.
2.  **Invalid Model Name**: The API will return a 4xx error.
3.  **Authentication Failure**: The API will return a 401 Unauthorized error.
4.  **Rate Limiting**: The API will return a 429 Too Many Requests error.
5.  **Server-Side Errors**: The API may return 5xx errors.
6.  **Request Timeout**: `axios` can be configured to time out, which will result in a catchable error.

## 6. Security Considerations

1.  **API Key Management**: The OpenRouter API key must be stored securely in an `.env` file and loaded as an environment variable. It should never be hardcoded or exposed on the client-side.
2.  **Input Validation**: Although this is a server-side service, inputs from other parts of the application should be validated to prevent malformed requests.
3.  **Dependency Security**: Regularly update `axios` and other dependencies to patch any security vulnerabilities.

## 7. Step-by-Step Implementation Plan

1.  **Create the Service File**:
    - Create a new file at `src/lib/services/openrouter-service.ts`.

2.  **Set up Environment Variables**:
    - Add `OPENROUTER_API_KEY=your_api_key_here` to your `.env` file.

3.  **Implement the Constructor**:
    - Implement the constructor as described in section 2 to initialize the `axios` client and handle the API key.

4.  **Define Parameter and Response Types**:
    - Define the `ChatCompletionParams` interface and any necessary response types to ensure type safety.

5.  **Implement the `chatCompletion` Method**:
    - This method will call the private helper methods to build the request, send it, and parse the response.
    - Wrap the logic in a `try...catch` block for error handling.

    ```typescript
    public async chatCompletion(params: ChatCompletionParams): Promise<any> {
      try {
        const payload = this.buildRequestPayload(params);
        const response = await this.httpClient.post('/chat/completions', payload);
        return this.parseResponse(response.data);
      } catch (error) {
        // Log the error and re-throw or handle as needed
        console.error('Error in OpenRouterService:', error);
        throw error;
      }
    }
    ```

6.  **Implement the `buildRequestPayload` Method**:
    - This method will assemble the request body. It should handle optional parameters gracefully.

    ```typescript
    private buildRequestPayload(params: ChatCompletionParams): object {
      const messages = [];
      if (params.systemMessage) {
        messages.push({ role: 'system', content: params.systemMessage });
      }
      messages.push({ role: 'user', content: params.userMessage });

      const payload: any = {
        model: params.model,
        messages: messages,
      };

      if (params.response_format) {
        payload.response_format = params.response_format;
      }
      if (params.temperature) {
        payload.temperature = params.temperature;
      }
      if (params.max_tokens) {
        payload.max_tokens = params.max_tokens;
      }

      return payload;
    }
    ```

7.  **Implement the `parseResponse` Method**:
    - This method will extract the message content from the API response.

    ```typescript
    private parseResponse(responseData: any): any {
      // Basic parsing, can be extended for streaming or more complex responses
      const content = responseData.choices[0]?.message?.content;
      if (typeof content === 'string' && responseData.choices[0]?.message?.tool_calls?.[0].function.name) {
          try {
              return JSON.parse(content);
          } catch (e) {
              // Not a JSON string, return as is
          }
      }
      return content;
    }
    ```

8.  **Add Examples for Key Elements**:

    - **System & User Message**:
      ```typescript
      // Handled by buildRequestPayload
      const params = {
        model: 'openai/gpt-4o',
        systemMessage: 'You are a helpful assistant.',
        userMessage: 'What is the capital of France?',
      };
      ```

    - **`response_format` (JSON Schema)**:
      ```typescript
      const schema = {
        type: 'object',
        properties: {
          city: { type: 'string' },
          country: { type: 'string' },
        },
        required: ['city', 'country'],
      };

      const params = {
        model: 'openai/gpt-4o',
        userMessage: 'Provide details for Paris, France.',
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'location_details',
            strict: true,
            schema: schema,
          },
        },
      };
      ```

9.  **Integrate and Test**:
    - Import and use the `OpenRouterService` in an API endpoint (e.g., in `src/pages/api`) to test its functionality.
