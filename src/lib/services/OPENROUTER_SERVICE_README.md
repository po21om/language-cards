# OpenRouter Service Documentation

## Overview

The `OpenRouterService` provides a clean, type-safe interface for interacting with the OpenRouter API to access various Large Language Models (LLMs) such as GPT-4, Claude, and others.

## Setup

### Environment Variables

Add your OpenRouter API key to your `.env` file:

```bash
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=openai/gpt-4o  # Optional: default model
```

### Installation

The service requires `axios` which is already installed in the project.

## Usage

### Basic Chat Completion

```typescript
import { OpenRouterService } from './lib/services/openrouter.service';

const service = new OpenRouterService();

const response = await service.chatCompletion({
  model: 'openai/gpt-4o',
  systemMessage: 'You are a helpful assistant.',
  userMessage: 'What is the capital of France?',
  temperature: 0.7,
  max_tokens: 500,
});

console.log(response); // "The capital of France is Paris."
```

### Structured JSON Output with JSON Schema

```typescript
import { OpenRouterService } from './lib/services/openrouter.service';

const service = new OpenRouterService();

// Define your JSON schema
const schema = {
  type: 'object',
  properties: {
    city: { type: 'string' },
    country: { type: 'string' },
    population: { type: 'number' },
    landmarks: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: ['city', 'country'],
  additionalProperties: false,
};

const response = await service.chatCompletion({
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
  temperature: 0.7,
});

console.log(response);
// {
//   city: "Paris",
//   country: "France",
//   population: 2161000,
//   landmarks: ["Eiffel Tower", "Louvre Museum", "Notre-Dame"]
// }
```

### Using in API Endpoints

```typescript
import type { APIContext } from 'astro';
import { OpenRouterService } from '../../../../lib/services/openrouter.service';

export const POST = async (context: APIContext) => {
  try {
    // Authenticate user
    const authHeader = context.request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse request body
    const body = await context.request.json();
    
    // Initialize service
    const openRouterService = new OpenRouterService();
    
    // Make API call
    const result = await openRouterService.chatCompletion({
      model: 'openai/gpt-4o',
      systemMessage: 'You are a helpful assistant.',
      userMessage: body.message,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
```

## API Reference

### `ChatCompletionParams`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userMessage` | `string` | Yes | The user's message content |
| `model` | `string` | Yes | Model identifier (e.g., `openai/gpt-4o`, `anthropic/claude-3-opus`) |
| `systemMessage` | `string` | No | System message to set context/behavior |
| `response_format` | `object` | No | JSON schema for structured outputs |
| `temperature` | `number` | No | Response randomness (0.0-2.0), default varies by model |
| `max_tokens` | `number` | No | Maximum tokens to generate |

### Supported Models

Common models available through OpenRouter:

- `openai/gpt-4o` - GPT-4 Optimized
- `openai/gpt-4-turbo` - GPT-4 Turbo
- `openai/gpt-3.5-turbo` - GPT-3.5 Turbo
- `anthropic/claude-3-opus` - Claude 3 Opus
- `anthropic/claude-3-sonnet` - Claude 3 Sonnet
- `anthropic/claude-3-haiku` - Claude 3 Haiku
- `google/gemini-pro` - Gemini Pro
- `meta-llama/llama-3-70b-instruct` - Llama 3 70B

See [OpenRouter Models](https://openrouter.ai/models) for the complete list.

## Error Handling

The service provides specific error messages for common scenarios:

```typescript
try {
  const response = await service.chatCompletion({
    model: 'openai/gpt-4o',
    userMessage: 'Hello!',
  });
} catch (error) {
  if (error instanceof Error) {
    // Authentication error (401)
    if (error.message.includes('authentication failed')) {
      console.error('Invalid API key');
    }
    
    // Rate limit error (429)
    else if (error.message.includes('rate limit')) {
      console.error('Too many requests, try again later');
    }
    
    // Server error (5xx)
    else if (error.message.includes('server error')) {
      console.error('OpenRouter service is down');
    }
    
    // Other errors
    else {
      console.error('Request failed:', error.message);
    }
  }
}
```

### Common Error Scenarios

| Error | Status Code | Description | Solution |
|-------|-------------|-------------|----------|
| Missing API Key | Constructor throws | `OPENROUTER_API_KEY` not set | Add API key to `.env` file |
| Authentication Failed | 401 | Invalid API key | Check your API key is correct |
| Rate Limit Exceeded | 429 | Too many requests | Implement rate limiting or wait |
| Invalid Model | 400 | Model name incorrect | Check model identifier |
| Server Error | 5xx | OpenRouter service issue | Retry with exponential backoff |

## Best Practices

### 1. Error Handling

Always wrap API calls in try-catch blocks and handle specific error types:

```typescript
try {
  const result = await service.chatCompletion(params);
  return result;
} catch (error) {
  if (error instanceof Error) {
    // Log and handle appropriately
    console.error('OpenRouter error:', error.message);
    throw error;
  }
}
```

### 2. Rate Limiting

Implement rate limiting in your API endpoints to avoid hitting OpenRouter's limits:

```typescript
import { checkRateLimit } from '../../../../lib/utils/rate-limiter';

const rateLimitResult = await checkRateLimit(user.id, 'ai:generate');
if (!rateLimitResult.allowed) {
  return rateLimitResponse(rateLimitResult.retryAfter);
}
```

### 3. Temperature Settings

- **Low (0.0-0.3)**: Deterministic, factual responses
- **Medium (0.4-0.7)**: Balanced creativity and consistency
- **High (0.8-2.0)**: Creative, varied responses

### 4. Token Management

Set appropriate `max_tokens` based on your use case:

```typescript
// Short responses (summaries, classifications)
max_tokens: 100-500

// Medium responses (explanations, analysis)
max_tokens: 500-1500

// Long responses (articles, detailed content)
max_tokens: 1500-4000
```

### 5. JSON Schema Validation

When using structured outputs, always set `strict: true` for reliable parsing:

```typescript
response_format: {
  type: 'json_schema',
  json_schema: {
    name: 'my_schema',
    strict: true,  // Ensures strict adherence to schema
    schema: mySchema,
  },
}
```

## Testing

A test endpoint is available at `/api/v1/ai/test-openrouter` for testing the service:

```bash
curl -X POST http://localhost:4321/api/v1/ai/test-openrouter \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is TypeScript?",
    "model": "openai/gpt-4o",
    "useJsonSchema": false
  }'
```

## Security Considerations

1. **API Key Management**: Never expose your API key in client-side code or commit it to version control
2. **Input Validation**: Always validate user inputs before passing to the service
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Authentication**: Require user authentication for API endpoints
5. **Error Messages**: Don't expose sensitive information in error messages

## Troubleshooting

### Service throws "OPENROUTER_API_KEY is not set"

**Solution**: Add your API key to the `.env` file:
```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

### Getting 401 Authentication Failed

**Solution**: Verify your API key is correct and has not expired

### Getting 429 Rate Limit Exceeded

**Solution**: Implement rate limiting or reduce request frequency

### Response is empty or null

**Solution**: Check the model supports your request format and parameters

## Additional Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Pricing](https://openrouter.ai/pricing)
- [JSON Schema Documentation](https://json-schema.org/)
