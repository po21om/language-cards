# API Endpoint Implementation Plan: AI Generation Endpoints

## 1. Endpoint Overview

This implementation plan covers four AI-powered flashcard generation endpoints that enable users to:

1. **Generate flashcard suggestions** from input text using AI (OpenRouter.ai)
2. **Refine individual suggestions** with specific instructions
3. **Accept or reject suggestions** and persist them as flashcards
4. **View generation history** with acceptance metrics and analytics

These endpoints form a complete workflow for AI-assisted flashcard creation, tracking user interactions from initial generation through acceptance/rejection, and providing insights into generation effectiveness.

**Key Features:**
- AI-powered content generation via OpenRouter.ai
- Temporary suggestion storage (client-side) before persistence
- Batch acceptance/rejection of suggestions
- Comprehensive metrics and analytics
- Rate limiting to prevent API abuse
- Input sanitization to prevent prompt injection

---

## 2. Request Details

### 2.1 Generate Flashcards from Text

- **HTTP Method:** `POST`
- **URL Path:** `/api/v1/ai/generate`
- **Authentication:** Required (Bearer token)
- **Content-Type:** `application/json`

**Parameters:**
- **Required:**
  - `text` (string): Input text to generate flashcards from
    - Min length: 1 character
    - Max length: 1800 characters
    - Must contain meaningful content
- **Optional:**
  - `target_count` (number): Desired number of flashcards
    - Min: 1
    - Max: 20
    - Default: 5

**Request Body Example:**
```json
{
  "text": "Spaced repetition is a learning technique that involves reviewing information at increasing intervals...",
  "target_count": 5
}
```

### 2.2 Refine AI Suggestion

- **HTTP Method:** `POST`
- **URL Path:** `/api/v1/ai/refine`
- **Authentication:** Required (Bearer token)
- **Content-Type:** `application/json`

**Parameters:**
- **Required:**
  - `suggestion_id` (string): UUID of the suggestion to refine
  - `front` (string): Current front side content (1-2000 chars)
  - `back` (string): Current back side content (1-2000 chars)
  - `refinement_instruction` (string): User's refinement request (1-500 chars)

**Request Body Example:**
```json
{
  "suggestion_id": "temp_uuid_1",
  "front": "What is spaced repetition?",
  "back": "A learning technique that involves reviewing information at increasing intervals",
  "refinement_instruction": "Make the answer more concise"
}
```

### 2.3 Accept AI Suggestions

- **HTTP Method:** `POST`
- **URL Path:** `/api/v1/ai/accept`
- **Authentication:** Required (Bearer token)
- **Content-Type:** `application/json`

**Parameters:**
- **Required:**
  - `generation_id` (string): UUID of the generation log
  - `accepted_suggestions` (array): Suggestions to persist as flashcards
    - Each item contains: `suggestion_id`, `front`, `back`, `tags`, `status`
  - `rejected_suggestions` (array): Array of suggestion IDs to reject
  - `refined_count` (number): Number of suggestions that were refined

**Request Body Example:**
```json
{
  "generation_id": "uuid",
  "accepted_suggestions": [
    {
      "suggestion_id": "temp_uuid_1",
      "front": "What is spaced repetition?",
      "back": "A learning technique...",
      "tags": ["📚", "learning"],
      "status": "active"
    }
  ],
  "rejected_suggestions": ["temp_uuid_2"],
  "refined_count": 1
}
```

### 2.4 Get AI Generation History

- **HTTP Method:** `GET`
- **URL Path:** `/api/v1/ai/generations`
- **Authentication:** Required (Bearer token)

**Query Parameters:**
- **Optional:**
  - `limit` (number): Results per page (1-100, default: 20)
  - `offset` (number): Results to skip (min: 0, default: 0)

**URL Example:**
```
/api/v1/ai/generations?limit=20&offset=0
```

---

## 3. Used Types

### 3.1 Request DTOs

```typescript
// Already defined in src/types.ts
AIGenerateRequest
AIRefineRequest
AIAcceptRequest
AcceptedSuggestion
```

### 3.2 Response DTOs

```typescript
// Already defined in src/types.ts
AIGenerateResponse
AICardSuggestion
AIRefineResponse
AIAcceptResponse
AIGenerationLogSummary
AIGenerationHistoryResponse
AIGenerationLogDTO
AIGenerationMetrics
FlashcardDTO
PaginationMeta
ErrorResponse
```

### 3.3 Validation Schemas (Zod)

**New schemas to create in endpoint files:**

```typescript
// For /api/v1/ai/generate
const GenerateSchema = z.object({
  text: z.string()
    .min(1, 'Text cannot be empty')
    .max(1800, 'Text cannot exceed 1800 characters')
    .trim(),
  target_count: z.number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .default(5)
});

// For /api/v1/ai/refine
const RefineSchema = z.object({
  suggestion_id: z.string().uuid('Invalid suggestion ID format'),
  front: z.string()
    .min(1, 'Front side cannot be empty')
    .max(2000, 'Front side cannot exceed 2000 characters')
    .trim(),
  back: z.string()
    .min(1, 'Back side cannot be empty')
    .max(2000, 'Back side cannot exceed 2000 characters')
    .trim(),
  refinement_instruction: z.string()
    .min(1, 'Refinement instruction cannot be empty')
    .max(500, 'Refinement instruction cannot exceed 500 characters')
    .trim()
});

// For /api/v1/ai/accept
const AcceptSchema = z.object({
  generation_id: z.string().uuid('Invalid generation ID format'),
  accepted_suggestions: z.array(z.object({
    suggestion_id: z.string().uuid(),
    front: z.string().min(1).max(2000).trim(),
    back: z.string().min(1).max(2000).trim(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['review', 'active', 'archived']).default('active')
  })),
  rejected_suggestions: z.array(z.string().uuid()),
  refined_count: z.number().int().min(0)
});

// For /api/v1/ai/generations
const GenerationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});
```

### 3.4 Service Layer Types

**New types for AI service:**

```typescript
// Internal types for AI service communication
interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

---

## 4. Response Details

### 4.1 Generate Flashcards Response

**Success (200 OK):**
```json
{
  "generation_id": "uuid",
  "suggestions": [
    {
      "suggestion_id": "temp_uuid_1",
      "front": "What is spaced repetition?",
      "back": "A learning technique that involves reviewing information at increasing intervals",
      "suggested_tags": ["📚", "learning"]
    }
  ],
  "input_length": 150,
  "cards_generated": 2,
  "timestamp": "2026-01-30T19:45:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input (empty text, exceeds 1800 chars)
- `401 Unauthorized`: Missing or invalid token
- `429 Too Many Requests`: Rate limit exceeded
- `503 Service Unavailable`: AI service unavailable

### 4.2 Refine AI Suggestion Response

**Success (200 OK):**
```json
{
  "suggestion_id": "temp_uuid_1",
  "front": "What is spaced repetition?",
  "back": "A technique for reviewing information at increasing intervals to improve retention",
  "suggested_tags": ["📚", "learning"]
}
```

**Error Responses:**
- `400 Bad Request`: Invalid suggestion data
- `401 Unauthorized`: Missing or invalid token
- `503 Service Unavailable`: AI service unavailable

### 4.3 Accept AI Suggestions Response

**Success (201 Created):**
```json
{
  "created_cards": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "front": "What is spaced repetition?",
      "back": "A learning technique...",
      "tags": ["📚", "learning"],
      "status": "active",
      "source": "ai",
      "study_weight": 1.0,
      "generation_id": "uuid",
      "created_at": "2026-01-30T19:50:00Z",
      "updated_at": "2026-01-30T19:50:00Z",
      "deleted_at": null
    }
  ],
  "generation_log": {
    "id": "uuid",
    "cards_accepted": 1,
    "cards_rejected": 1,
    "cards_refined": 1,
    "cards_generated": 2
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid generation_id or suggestion data
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Generation log not found

### 4.4 Get AI Generation History Response

**Success (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "input_length": 150,
      "cards_generated": 5,
      "cards_accepted": 4,
      "cards_rejected": 1,
      "cards_refined": 2,
      "timestamp": "2026-01-30T19:45:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "has_more": true
  },
  "metrics": {
    "total_generations": 25,
    "total_cards_generated": 125,
    "total_cards_accepted": 95,
    "acceptance_rate": 76.0
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token

---

## 5. Data Flow

### 5.1 Generate Flashcards Flow

```
1. Client sends POST /api/v1/ai/generate with text
   ↓
2. Endpoint validates request (Zod schema)
   ↓
3. Extract user_id from JWT token
   ↓
4. Check rate limit (Redis/in-memory cache)
   ↓
5. Call AIGenerationService.generateFlashcards()
   ↓
6. Service sanitizes input text (prevent prompt injection)
   ↓
7. Service constructs prompt for OpenRouter.ai
   ↓
8. Service calls OpenRouter.ai API
   ↓
9. Service parses AI response into suggestions
   ↓
10. Service creates generation log in database
    ↓
11. Service generates temporary UUIDs for suggestions
    ↓
12. Return response with generation_id and suggestions
```

### 5.2 Refine AI Suggestion Flow

```
1. Client sends POST /api/v1/ai/refine with suggestion data
   ↓
2. Endpoint validates request (Zod schema)
   ↓
3. Extract user_id from JWT token
   ↓
4. Call AIGenerationService.refineSuggestion()
   ↓
5. Service sanitizes refinement instruction
   ↓
6. Service constructs refinement prompt
   ↓
7. Service calls OpenRouter.ai API
   ↓
8. Service parses refined suggestion
   ↓
9. Return refined suggestion (no DB persistence)
```

### 5.3 Accept AI Suggestions Flow

```
1. Client sends POST /api/v1/ai/accept with accepted/rejected suggestions
   ↓
2. Endpoint validates request (Zod schema)
   ↓
3. Extract user_id from JWT token
   ↓
4. Call AIGenerationService.acceptSuggestions()
   ↓
5. Service verifies generation_id belongs to user
   ↓
6. Service starts database transaction
   ↓
7. Service creates flashcards from accepted suggestions
   ↓
8. Service updates generation log with metrics
   ↓
9. Service commits transaction
   ↓
10. Return created flashcards and updated log
```

### 5.4 Get Generation History Flow

```
1. Client sends GET /api/v1/ai/generations with pagination params
   ↓
2. Endpoint validates query params (Zod schema)
   ↓
3. Extract user_id from JWT token
   ↓
4. Call AIGenerationService.getGenerationHistory()
   ↓
5. Service queries generation logs for user
   ↓
6. Service calculates aggregate metrics
   ↓
7. Service constructs pagination metadata
   ↓
8. Return paginated history with metrics
```

### 5.5 Database Interactions

**Tables Involved:**
- `ai_generation_logs`: Store generation metadata
- `flashcards`: Store accepted suggestions as flashcards
- `auth.users`: Verify user ownership

**Key Operations:**
1. **Create generation log** (after AI generation)
2. **Update generation log** (after acceptance/rejection)
3. **Bulk insert flashcards** (from accepted suggestions)
4. **Query generation logs** (for history endpoint)
5. **Calculate metrics** (aggregate queries)

---

## 6. Security Considerations

### 6.1 Authentication & Authorization

**Implementation:**
- All endpoints require valid JWT token in `Authorization: Bearer {token}` header
- Extract `user_id` from token claims using Supabase auth
- Verify token validity and expiration
- Ensure users can only access their own generation logs

**Code Pattern:**
```typescript
const authHeader = context.request.headers.get('authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return new Response(JSON.stringify({
    error: {
      code: 'UNAUTHORIZED',
      message: 'Missing or invalid authorization header'
    },
    timestamp: new Date().toISOString()
  }), { status: 401 });
}

const token = authHeader.substring(7);
const { data: { user }, error } = await context.locals.supabase.auth.getUser(token);

if (error || !user) {
  return new Response(JSON.stringify({
    error: {
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token'
    },
    timestamp: new Date().toISOString()
  }), { status: 401 });
}
```

### 6.2 Input Validation & Sanitization

**Threats:**
- Prompt injection attacks
- XSS via AI-generated content
- SQL injection (mitigated by Supabase client)

**Mitigations:**
1. **Strict Zod validation** on all inputs
2. **Text sanitization** before sending to AI:
   - Remove control characters
   - Limit special character sequences
   - Trim whitespace
3. **Output sanitization** from AI responses:
   - Validate JSON structure
   - Escape HTML entities
   - Limit response length
4. **Content Security Policy** headers

**Sanitization Function:**
```typescript
function sanitizeTextInput(text: string): string {
  return text
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 1800); // Enforce max length
}
```

### 6.3 Rate Limiting

**Strategy:**
- Implement per-user rate limiting for expensive AI operations
- Limits:
  - Generate: 10 requests per hour per user
  - Refine: 20 requests per hour per user
  - Accept: 30 requests per hour per user
  - History: 100 requests per hour per user

**Implementation Options:**
1. **In-memory cache** (simple, single-server)
2. **Redis** (distributed, production-ready)
3. **Supabase Edge Functions rate limiting**

**Pseudocode:**
```typescript
async function checkRateLimit(userId: string, endpoint: string): Promise<boolean> {
  const key = `ratelimit:${endpoint}:${userId}`;
  const count = await cache.get(key) || 0;
  const limit = RATE_LIMITS[endpoint];
  
  if (count >= limit) {
    return false;
  }
  
  await cache.set(key, count + 1, { ttl: 3600 }); // 1 hour
  return true;
}
```

### 6.4 API Key Protection

**OpenRouter.ai API Key:**
- Store in environment variable (`OPENROUTER_API_KEY`)
- Never expose in client-side code
- Use server-side only (Astro API routes)
- Implement key rotation strategy
- Set spending limits in OpenRouter.ai dashboard

### 6.5 Data Ownership Verification

**Critical Checks:**
- Verify `generation_id` belongs to authenticated user before accepting suggestions
- Prevent users from accepting other users' generations
- Use RLS (Row Level Security) policies in Supabase if available

**Verification Pattern:**
```typescript
const { data: log, error } = await supabase
  .from('ai_generation_logs')
  .select('id, user_id')
  .eq('id', generation_id)
  .single();

if (error || !log || log.user_id !== user.id) {
  return new Response(JSON.stringify({
    error: {
      code: 'NOT_FOUND',
      message: 'Generation log not found'
    },
    timestamp: new Date().toISOString()
  }), { status: 404 });
}
```

---

## 7. Error Handling

### 7.1 Error Response Format

All errors follow the standardized `ErrorResponse` type:

```typescript
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "field_name",
      "constraint": "validation_rule"
    }
  },
  "timestamp": "2026-01-30T19:45:00Z"
}
```

### 7.2 Error Scenarios by Endpoint

#### Generate Flashcards Errors

| Status | Code | Scenario | Message |
|--------|------|----------|---------|
| 400 | VALIDATION_ERROR | Empty text | "Text cannot be empty" |
| 400 | VALIDATION_ERROR | Text too long | "Text cannot exceed 1800 characters" |
| 400 | VALIDATION_ERROR | Invalid target_count | "Target count must be between 1 and 20" |
| 401 | UNAUTHORIZED | Missing token | "Missing or invalid authorization header" |
| 401 | UNAUTHORIZED | Invalid token | "Invalid or expired token" |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests | "Rate limit exceeded. Try again in X minutes" |
| 503 | SERVICE_UNAVAILABLE | AI service down | "AI service temporarily unavailable" |
| 503 | SERVICE_UNAVAILABLE | Network timeout | "Request to AI service timed out" |
| 500 | INTERNAL_ERROR | Database error | "Failed to create generation log" |

#### Refine Suggestion Errors

| Status | Code | Scenario | Message |
|--------|------|----------|---------|
| 400 | VALIDATION_ERROR | Invalid UUID | "Invalid suggestion ID format" |
| 400 | VALIDATION_ERROR | Empty front/back | "Front/back side cannot be empty" |
| 400 | VALIDATION_ERROR | Content too long | "Front/back side cannot exceed 2000 characters" |
| 400 | VALIDATION_ERROR | Empty instruction | "Refinement instruction cannot be empty" |
| 401 | UNAUTHORIZED | Missing token | "Missing or invalid authorization header" |
| 503 | SERVICE_UNAVAILABLE | AI service down | "AI service temporarily unavailable" |

#### Accept Suggestions Errors

| Status | Code | Scenario | Message |
|--------|------|----------|---------|
| 400 | VALIDATION_ERROR | Invalid generation_id | "Invalid generation ID format" |
| 400 | VALIDATION_ERROR | Empty suggestions | "At least one suggestion must be provided" |
| 400 | VALIDATION_ERROR | Invalid suggestion data | "Invalid suggestion format" |
| 401 | UNAUTHORIZED | Missing token | "Missing or invalid authorization header" |
| 404 | NOT_FOUND | Generation not found | "Generation log not found" |
| 404 | NOT_FOUND | Wrong user | "Generation log not found" (security) |
| 500 | INTERNAL_ERROR | Transaction failed | "Failed to create flashcards" |

#### Generation History Errors

| Status | Code | Scenario | Message |
|--------|------|----------|---------|
| 400 | VALIDATION_ERROR | Invalid limit | "Limit must be between 1 and 100" |
| 400 | VALIDATION_ERROR | Invalid offset | "Offset must be non-negative" |
| 401 | UNAUTHORIZED | Missing token | "Missing or invalid authorization header" |
| 500 | INTERNAL_ERROR | Database error | "Failed to retrieve generation history" |

### 7.3 Error Handling Pattern

**Endpoint Structure:**
```typescript
export const POST = async (context: APIContext) => {
  try {
    // 1. Authentication check
    const user = await authenticateUser(context);
    if (!user) {
      return unauthorizedResponse();
    }

    // 2. Input validation
    const body = await context.request.json();
    const validationResult = schema.safeParse(body);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    // 3. Rate limiting
    const rateLimitOk = await checkRateLimit(user.id, 'generate');
    if (!rateLimitOk) {
      return rateLimitResponse();
    }

    // 4. Business logic
    const result = await service.method(validationResult.data, user.id);
    
    // 5. Success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // 6. Error handling
    console.error('Error in endpoint:', error);
    
    if (error instanceof ServiceUnavailableError) {
      return serviceUnavailableResponse(error.message);
    }
    
    return internalErrorResponse();
  }
};
```

### 7.4 Logging Strategy

**What to Log:**
- All authentication failures
- Rate limit violations
- AI service errors and response times
- Database transaction failures
- Unexpected errors with stack traces

**Log Format:**
```typescript
{
  timestamp: new Date().toISOString(),
  level: 'error' | 'warn' | 'info',
  endpoint: '/api/v1/ai/generate',
  user_id: 'uuid',
  error_code: 'SERVICE_UNAVAILABLE',
  message: 'OpenRouter API timeout',
  details: { /* additional context */ }
}
```

---

## 8. Performance Considerations

### 8.1 Potential Bottlenecks

1. **AI API Latency**
   - OpenRouter.ai response time: 2-10 seconds
   - Network latency
   - Token generation time

2. **Database Operations**
   - Bulk insert of accepted flashcards
   - Aggregate queries for metrics calculation
   - Concurrent user requests

3. **Rate Limiting Overhead**
   - Cache lookups for every request
   - Distributed cache synchronization

### 8.2 Optimization Strategies

#### 8.2.1 AI Service Optimization

**Caching Strategy:**
- Cache common generation patterns (not implemented in MVP)
- Use streaming responses for real-time feedback (future enhancement)

**Timeout Configuration:**
```typescript
const AI_REQUEST_TIMEOUT = 30000; // 30 seconds
const AI_RETRY_ATTEMPTS = 2;
```

**Prompt Optimization:**
- Keep system prompts concise
- Use structured output format (JSON)
- Limit max_tokens to prevent excessive costs

#### 8.2.2 Database Optimization

**Bulk Operations:**
```typescript
// Use bulk insert instead of individual inserts
const { data, error } = await supabase
  .from('flashcards')
  .insert(acceptedSuggestions.map(s => ({
    user_id: userId,
    front: s.front,
    back: s.back,
    tags: s.tags,
    status: s.status,
    source: 'ai',
    generation_id: generationId
  })));
```

**Index Usage:**
- Ensure `idx_ai_logs_user_time` is used for history queries
- Use `idx_flashcards_list` for flashcard creation

**Query Optimization:**
```typescript
// Efficient metrics calculation
const metrics = await supabase
  .from('ai_generation_logs')
  .select('cards_generated, cards_accepted')
  .eq('user_id', userId);

// Calculate in application layer instead of multiple DB queries
const totalGenerated = metrics.reduce((sum, m) => sum + m.cards_generated, 0);
const totalAccepted = metrics.reduce((sum, m) => sum + m.cards_accepted, 0);
```

#### 8.2.3 Response Time Targets

| Endpoint | Target | Acceptable |
|----------|--------|------------|
| Generate | 5s | 10s |
| Refine | 4s | 8s |
| Accept | 500ms | 1s |
| History | 200ms | 500ms |

#### 8.2.4 Caching Strategy

**Client-Side:**
- Cache generation history for 5 minutes
- Cache suggestions until acceptance/rejection

**Server-Side:**
- Cache user rate limit counters (1 hour TTL)
- Cache aggregate metrics (5 minutes TTL)

### 8.3 Monitoring & Metrics

**Key Metrics to Track:**
- AI API response time (p50, p95, p99)
- AI API error rate
- Endpoint response times
- Rate limit hit rate
- Database query performance
- Acceptance rate trends

---

## 9. Implementation Steps

### Step 1: Create AI Generation Service

**File:** `src/lib/services/ai-generation.service.ts`

**Tasks:**
1. Create service class with methods:
   - `generateFlashcards(text: string, targetCount: number, userId: string)`
   - `refineSuggestion(suggestion: AIRefineRequest)`
   - `acceptSuggestions(request: AIAcceptRequest, userId: string)`
   - `getGenerationHistory(userId: string, limit: number, offset: number)`
2. Implement OpenRouter.ai API client
3. Create prompt templates for generation and refinement
4. Implement input sanitization functions
5. Implement output parsing and validation
6. Add error handling for AI service failures
7. Add timeout and retry logic

**Key Functions:**
```typescript
class AIGenerationService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://openrouter.ai/api/v1';
  
  async generateFlashcards(
    text: string, 
    targetCount: number, 
    userId: string
  ): Promise<AIGenerateResponse> {
    // Implementation
  }
  
  async refineSuggestion(
    request: AIRefineRequest
  ): Promise<AIRefineResponse> {
    // Implementation
  }
  
  async acceptSuggestions(
    request: AIAcceptRequest,
    userId: string
  ): Promise<AIAcceptResponse> {
    // Implementation
  }
  
  async getGenerationHistory(
    userId: string,
    limit: number,
    offset: number
  ): Promise<AIGenerationHistoryResponse> {
    // Implementation
  }
}
```

### Step 2: Create Rate Limiting Utility

**File:** `src/lib/utils/rate-limiter.ts`

**Tasks:**
1. Implement in-memory rate limiter (Map-based)
2. Create rate limit configuration
3. Implement cleanup for expired entries
4. Add rate limit check function
5. Add rate limit reset function (for testing)

**Interface:**
```typescript
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'ai:generate': { maxRequests: 10, windowMs: 3600000 },
  'ai:refine': { maxRequests: 20, windowMs: 3600000 },
  'ai:accept': { maxRequests: 30, windowMs: 3600000 },
  'ai:history': { maxRequests: 100, windowMs: 3600000 }
};

async function checkRateLimit(
  userId: string, 
  endpoint: string
): Promise<boolean>;
```

### Step 3: Create Authentication Helper

**File:** `src/lib/utils/auth-helper.ts`

**Tasks:**
1. Create user authentication function
2. Extract user from JWT token
3. Handle token validation errors
4. Return standardized error responses

**Interface:**
```typescript
async function authenticateUser(
  context: APIContext
): Promise<{ id: string; email: string } | null>;

function unauthorizedResponse(message?: string): Response;
```

### Step 4: Create Error Response Helpers

**File:** `src/lib/utils/error-responses.ts`

**Tasks:**
1. Create helper functions for each error type
2. Implement consistent error response format
3. Add timestamp to all error responses

**Functions:**
```typescript
function validationErrorResponse(zodError: ZodError): Response;
function unauthorizedResponse(message?: string): Response;
function notFoundResponse(message?: string): Response;
function rateLimitResponse(retryAfter?: number): Response;
function serviceUnavailableResponse(message?: string): Response;
function internalErrorResponse(message?: string): Response;
```

### Step 5: Implement Generate Endpoint

**File:** `src/pages/api/v1/ai/generate.ts`

**Tasks:**
1. Create POST handler
2. Add `export const prerender = false`
3. Implement authentication check
4. Implement Zod validation schema
5. Implement rate limiting check
6. Call AI generation service
7. Handle errors and return appropriate responses
8. Add proper TypeScript types

**Structure:**
```typescript
export const prerender = false;

const GenerateSchema = z.object({
  text: z.string().min(1).max(1800).trim(),
  target_count: z.number().int().min(1).max(20).optional().default(5)
});

export const POST = async (context: APIContext) => {
  // Implementation following error handling pattern
};
```

### Step 6: Implement Refine Endpoint

**File:** `src/pages/api/v1/ai/refine.ts`

**Tasks:**
1. Create POST handler
2. Add `export const prerender = false`
3. Implement authentication check
4. Implement Zod validation schema
5. Implement rate limiting check
6. Call AI refinement service
7. Handle errors and return appropriate responses

### Step 7: Implement Accept Endpoint

**File:** `src/pages/api/v1/ai/accept.ts`

**Tasks:**
1. Create POST handler
2. Add `export const prerender = false`
3. Implement authentication check
4. Implement Zod validation schema
5. Implement rate limiting check
6. Verify generation_id ownership
7. Call acceptance service
8. Handle transaction errors
9. Return created flashcards and updated log

### Step 8: Implement History Endpoint

**File:** `src/pages/api/v1/ai/generations.ts`

**Tasks:**
1. Create GET handler
2. Add `export const prerender = false`
3. Implement authentication check
4. Implement query parameter validation
5. Implement rate limiting check
6. Call history service
7. Return paginated results with metrics

### Step 9: Add Environment Variables

**File:** `.env` (local) and deployment config

**Tasks:**
1. Add `OPENROUTER_API_KEY`
2. Add `OPENROUTER_MODEL` (e.g., "openai/gpt-4")
3. Document environment variables in README
4. Add validation for required env vars on startup

### Step 10: Create Custom Error Classes

**File:** `src/lib/errors/service-errors.ts`

**Tasks:**
1. Create `ServiceUnavailableError` class
2. Create `RateLimitError` class
3. Create `ValidationError` class
4. Export all error classes

**Example:**
```typescript
export class ServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}
```

### Step 11: Add Input Sanitization

**File:** `src/lib/utils/sanitization.ts`

**Tasks:**
1. Create text sanitization function
2. Create HTML escape function
3. Create prompt injection prevention
4. Add tests for edge cases

### Step 12: Write Unit Tests

**Files:** `src/lib/services/__tests__/ai-generation.service.test.ts`

**Tasks:**
1. Test AI service methods with mocked API
2. Test rate limiter functionality
3. Test validation schemas
4. Test error handling
5. Test sanitization functions

### Step 13: Write Integration Tests

**Files:** `src/pages/api/v1/ai/__tests__/`

**Tasks:**
1. Test complete endpoint flows
2. Test authentication failures
3. Test rate limiting
4. Test error scenarios
5. Test database interactions

### Step 14: Add API Documentation

**File:** `docs/api/ai-generation.md`

**Tasks:**
1. Document all endpoints
2. Add request/response examples
3. Document error codes
4. Add usage examples
5. Document rate limits

### Step 15: Performance Testing

**Tasks:**
1. Load test generate endpoint
2. Measure AI API response times
3. Test concurrent requests
4. Verify rate limiting effectiveness
5. Optimize slow queries

### Step 16: Security Audit

**Tasks:**
1. Review authentication implementation
2. Test prompt injection scenarios
3. Verify rate limiting
4. Check for data leakage
5. Review error messages for information disclosure

---

## 10. Testing Checklist

### 10.1 Functional Testing

- [ ] Generate flashcards with valid input
- [ ] Generate with different target counts
- [ ] Refine suggestion successfully
- [ ] Accept suggestions and create flashcards
- [ ] Reject suggestions without creating flashcards
- [ ] Retrieve generation history with pagination
- [ ] Calculate metrics correctly

### 10.2 Validation Testing

- [ ] Reject empty text
- [ ] Reject text over 1800 characters
- [ ] Reject invalid UUIDs
- [ ] Reject invalid status values
- [ ] Reject invalid pagination parameters
- [ ] Validate all required fields

### 10.3 Security Testing

- [ ] Reject requests without auth token
- [ ] Reject requests with invalid token
- [ ] Reject requests with expired token
- [ ] Prevent access to other users' generations
- [ ] Test prompt injection attempts
- [ ] Verify rate limiting works
- [ ] Test XSS prevention in AI output

### 10.4 Error Handling Testing

- [ ] Handle AI service timeout
- [ ] Handle AI service unavailable
- [ ] Handle database connection failure
- [ ] Handle invalid JSON in request
- [ ] Handle malformed AI responses
- [ ] Return proper error codes and messages

### 10.5 Performance Testing

- [ ] Measure response times under load
- [ ] Test concurrent requests
- [ ] Verify database query performance
- [ ] Test rate limiter performance
- [ ] Monitor AI API costs

---

## 11. Deployment Considerations

### 11.1 Environment Variables

Required in production:
```
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=openai/gpt-4-turbo
PUBLIC_SUPABASE_URL=https://...
PUBLIC_SUPABASE_ANON_KEY=...
```

### 11.2 Monitoring Setup

**Metrics to Monitor:**
- AI API success/failure rate
- Average response times per endpoint
- Rate limit hit rate
- Database query performance
- Error rates by type

**Alerting Thresholds:**
- AI API error rate > 5%
- Response time p95 > 10s
- Rate limit hit rate > 20%
- Database errors > 1%

### 11.3 Cost Management

**OpenRouter.ai:**
- Set monthly spending limit
- Monitor token usage
- Optimize prompts for efficiency
- Consider cheaper models for refinement

### 11.4 Scaling Considerations

**Horizontal Scaling:**
- Stateless endpoints (easy to scale)
- Rate limiter needs distributed cache (Redis)
- Database connection pooling

**Vertical Scaling:**
- Increase AI API timeout for complex generations
- Optimize database queries
- Add caching layer

---

## 12. Future Enhancements

1. **Streaming Responses:** Real-time card generation feedback
2. **Batch Processing:** Generate multiple sets in parallel
3. **Smart Caching:** Cache similar generation requests
4. **Advanced Prompts:** Context-aware generation based on user's existing cards
5. **Multi-language Support:** Generate cards in different languages
6. **Quality Scoring:** AI-powered quality assessment of suggestions
7. **A/B Testing:** Test different AI models and prompts
8. **Usage Analytics:** Detailed analytics dashboard for generations
