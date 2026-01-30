# API Endpoint Implementation Plan: Flashcards API

## 1. Endpoint Overview

The Flashcards API provides comprehensive CRUD operations for managing user flashcards with support for filtering, sorting, pagination, soft deletion, restoration, bulk operations, and data export. The API consists of 8 endpoints that enable users to:

- List flashcards with advanced filtering and pagination
- Retrieve individual flashcard details
- Create manual flashcards
- Update existing flashcards
- Soft delete flashcards with 30-day retention
- Restore soft-deleted flashcards within the retention window
- Bulk delete multiple flashcards
- Export flashcards in CSV or JSON format

All endpoints require authentication and enforce user-level data isolation through Row Level Security (RLS) policies.

---

## 2. Request Details

### 2.1 List Flashcards

- **HTTP Method:** `GET`
- **URL Structure:** `/api/v1/flashcards`
- **Authentication:** Required (Bearer token)
- **Query Parameters:**
  - `status` (optional): Filter by status ('review', 'active', 'archived'). Default: all statuses
  - `source` (optional): Filter by source ('manual', 'ai'). Default: all sources
  - `tags` (optional): Comma-separated list of tags (e.g., '📚,learning')
  - `include_deleted` (optional): Include soft-deleted cards. Default: false
  - `sort` (optional): Sort field ('created_at', 'updated_at'). Default: 'created_at'
  - `order` (optional): Sort order ('asc', 'desc'). Default: 'desc'
  - `limit` (optional): Results per page (1-100). Default: 20
  - `offset` (optional): Results to skip. Default: 0

### 2.2 Get Single Flashcard

- **HTTP Method:** `GET`
- **URL Structure:** `/api/v1/flashcards/{id}`
- **Authentication:** Required (Bearer token)
- **Path Parameters:**
  - `id` (required): UUID of the flashcard

### 2.3 Create Flashcard

- **HTTP Method:** `POST`
- **URL Structure:** `/api/v1/flashcards`
- **Authentication:** Required (Bearer token)
- **Request Body:**
```json
{
  "front": "string (1-2000 chars, required)",
  "back": "string (1-2000 chars, required)",
  "tags": ["string[]", "optional"],
  "status": "FlashcardStatus (optional, default: 'active')"
}
```

### 2.4 Update Flashcard

- **HTTP Method:** `PATCH`
- **URL Structure:** `/api/v1/flashcards/{id}`
- **Authentication:** Required (Bearer token)
- **Path Parameters:**
  - `id` (required): UUID of the flashcard
- **Request Body:** (all fields optional)
```json
{
  "front": "string (1-2000 chars, optional)",
  "back": "string (1-2000 chars, optional)",
  "tags": ["string[]", "optional"],
  "status": "FlashcardStatus (optional)"
}
```

### 2.5 Soft Delete Flashcard

- **HTTP Method:** `DELETE`
- **URL Structure:** `/api/v1/flashcards/{id}`
- **Authentication:** Required (Bearer token)
- **Path Parameters:**
  - `id` (required): UUID of the flashcard

### 2.6 Restore Flashcard

- **HTTP Method:** `POST`
- **URL Structure:** `/api/v1/flashcards/{id}/restore`
- **Authentication:** Required (Bearer token)
- **Path Parameters:**
  - `id` (required): UUID of the flashcard

### 2.7 Bulk Delete Flashcards

- **HTTP Method:** `POST`
- **URL Structure:** `/api/v1/flashcards/bulk-delete`
- **Authentication:** Required (Bearer token)
- **Request Body:**
```json
{
  "flashcard_ids": ["uuid1", "uuid2", "uuid3"]
}
```

### 2.8 Export Flashcards

- **HTTP Method:** `GET`
- **URL Structure:** `/api/v1/flashcards/export`
- **Authentication:** Required (Bearer token)
- **Query Parameters:**
  - `format` (required): Export format ('csv' or 'json')
  - `status` (optional): Filter by status. Default: 'active'

---

## 3. Used Types

### 3.1 Existing DTOs (from `src/types.ts`)

```typescript
// Entity and DTO types
FlashcardDTO = FlashcardEntity  // Internal use only (includes user_id)
FlashcardResponseDTO  // API responses (excludes user_id)
FlashcardListResponse
CreateFlashcardRequest
UpdateFlashcardRequest
DeleteFlashcardResponse
BulkDeleteRequest
BulkDeleteResponse
ExportFlashcardDTO
ExportFlashcardsResponse
ListFlashcardsQuery
PaginationMeta

// Utility types
FlashcardStatus = 'review' | 'active' | 'archived'
FlashcardSource = 'manual' | 'ai'
FlashcardSortField = 'created_at' | 'updated_at'
SortOrder = 'asc' | 'desc'
ExportFormat = 'csv' | 'json'
ErrorResponse
```

### 3.2 New Validation Schemas (Zod)

Create in `src/lib/validators/flashcard.validators.ts`:

```typescript
import { z } from 'zod';

// Query parameter validation
export const ListFlashcardsQuerySchema = z.object({
  status: z.enum(['review', 'active', 'archived']).optional(),
  source: z.enum(['manual', 'ai']).optional(),
  tags: z.string().optional(), // comma-separated
  include_deleted: z.coerce.boolean().optional().default(false),
  sort: z.enum(['created_at', 'updated_at']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// Create flashcard validation
export const CreateFlashcardSchema = z.object({
  front: z.string().min(1).max(2000),
  back: z.string().min(1).max(2000),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(['review', 'active', 'archived']).optional().default('active'),
});

// Update flashcard validation
export const UpdateFlashcardSchema = z.object({
  front: z.string().min(1).max(2000).optional(),
  back: z.string().min(1).max(2000).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['review', 'active', 'archived']).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// Bulk delete validation
export const BulkDeleteSchema = z.object({
  flashcard_ids: z.array(z.string().uuid()).min(1),
});

// Export query validation
export const ExportFlashcardsQuerySchema = z.object({
  format: z.enum(['csv', 'json']),
  status: z.enum(['review', 'active', 'archived']).optional().default('active'),
});

// Path parameter validation
export const FlashcardIdParamSchema = z.object({
  id: z.string().uuid(),
});
```

---

## 4. Response Details

### 4.1 Success Responses

#### List Flashcards (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "tags": ["string"],
      "status": "active",
      "source": "manual",
      "study_weight": 1.0,
      "generation_id": null,
      "created_at": "2026-01-30T19:14:00Z",
      "updated_at": "2026-01-30T19:14:00Z",
      "deleted_at": null
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```
**Note:** `user_id` is excluded from all API responses for security.

#### Get Single Flashcard (200 OK)
```json
{
  "id": "uuid",
  "front": "string",
  "back": "string",
  "tags": ["string"],
  "status": "active",
  "source": "manual",
  "study_weight": 1.0,
  "generation_id": null,
  "created_at": "2026-01-30T19:14:00Z",
  "updated_at": "2026-01-30T19:14:00Z",
  "deleted_at": null
}
```
**Note:** `user_id` is excluded from all API responses for security.

#### Create Flashcard (201 Created)
Same structure as Get Single Flashcard response.

#### Update Flashcard (200 OK)
Same structure as Get Single Flashcard response.

#### Soft Delete Flashcard (200 OK)
```json
{
  "id": "uuid",
  "message": "Flashcard soft deleted. Will be permanently removed after 30 days.",
  "deleted_at": "2026-01-30T19:30:00Z"
}
```

#### Restore Flashcard (200 OK)
Same structure as Get Single Flashcard response.

#### Bulk Delete Flashcards (200 OK)
```json
{
  "deleted_count": 3,
  "deleted_ids": ["uuid1", "uuid2", "uuid3"],
  "message": "3 flashcards soft deleted"
}
```

#### Export Flashcards - JSON (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "front": "string",
      "back": "string",
      "tags": ["string"],
      "source": "manual",
      "created_at": "2026-01-30T19:14:00Z",
      "updated_at": "2026-01-30T19:14:00Z"
    }
  ],
  "exported_at": "2026-01-30T19:40:00Z",
  "total_cards": 150
}
```

#### Export Flashcards - CSV (200 OK)
Returns CSV file with headers: `id,front,back,tags,source,created_at,updated_at`

### 4.2 Error Responses

All error responses follow the standardized format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "field_name",
      "constraint": "validation_rule"
    }
  },
  "timestamp": "2026-01-30T19:40:00Z"
}
```

**Status Codes:**
- `400 Bad Request`: Validation errors, invalid parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Resource not found or doesn't belong to user
- `410 Gone`: Flashcard permanently deleted (restore endpoint only)
- `500 Internal Server Error`: Unexpected server errors

---

## 5. Data Flow

### 5.1 List Flashcards Flow

```
1. Client sends GET request with query parameters
2. Middleware validates authentication token → extracts user_id
3. API endpoint validates query parameters with Zod schema
4. Parse tags (comma-separated string → array)
5. FlashcardService.listFlashcards(user_id, validated_query)
   a. Build Supabase query with filters:
      - Filter by user_id (RLS enforcement)
      - Filter by status (if provided)
      - Filter by source (if provided)
      - Filter by tags using array overlap operator (if provided)
      - Filter deleted_at IS NULL (unless include_deleted=true)
   b. Apply sorting (sort field + order)
   c. Get total count for pagination
   d. Apply limit and offset
   e. Execute query
6. Transform database entities to FlashcardResponseDTO (excludes user_id)
7. Build pagination metadata (total, limit, offset, has_more)
8. Return FlashcardListResponse (200 OK)
```

### 5.2 Get Single Flashcard Flow

```
1. Client sends GET request with flashcard ID in path
2. Middleware validates authentication token → extracts user_id
3. API endpoint validates ID parameter (UUID format)
4. FlashcardService.getFlashcardById(user_id, card_id)
   a. Query flashcard by ID and user_id
   b. Check if flashcard exists and belongs to user
   c. Return flashcard or null
5. If not found → return 404 error
6. Transform entity to FlashcardResponseDTO (excludes user_id)
7. Return FlashcardResponseDTO (200 OK)
```

### 5.3 Create Flashcard Flow

```
1. Client sends POST request with flashcard data
2. Middleware validates authentication token → extracts user_id
3. API endpoint parses and validates request body with Zod schema
4. FlashcardService.createFlashcard(user_id, validated_data)
   a. Prepare insert data:
      - Set user_id from auth context
      - Set source = 'manual'
      - Set study_weight = 1.0
      - Set status (from request or default 'active')
      - Set front, back, tags from request
      - Set created_at, updated_at = NOW()
   b. Insert into flashcards table
   c. Return created flashcard
5. Transform entity to FlashcardResponseDTO (excludes user_id)
6. Return FlashcardResponseDTO (201 Created)
```

### 5.4 Update Flashcard Flow

```
1. Client sends PATCH request with flashcard ID and update data
2. Middleware validates authentication token → extracts user_id
3. API endpoint validates ID parameter and request body
4. FlashcardService.updateFlashcard(user_id, card_id, validated_data)
   a. Check if flashcard exists and belongs to user
   b. If not found → return null
   c. Prepare update data (only provided fields)
   d. Set updated_at = NOW()
   e. Update flashcard
   f. Return updated flashcard
5. If not found → return 404 error
6. Transform entity to FlashcardResponseDTO (excludes user_id)
7. Return FlashcardResponseDTO (200 OK)
```

### 5.5 Soft Delete Flashcard Flow

```
1. Client sends DELETE request with flashcard ID
2. Middleware validates authentication token → extracts user_id
3. API endpoint validates ID parameter
4. FlashcardService.softDeleteFlashcard(user_id, card_id)
   a. Check if flashcard exists and belongs to user
   b. If not found → return null
   c. Set deleted_at = NOW()
   d. Update flashcard
   e. Return deleted flashcard with deleted_at timestamp
5. If not found → return 404 error
6. Build DeleteFlashcardResponse
7. Return response (200 OK)
```

### 5.6 Restore Flashcard Flow

```
1. Client sends POST request to restore endpoint
2. Middleware validates authentication token → extracts user_id
3. API endpoint validates ID parameter
4. FlashcardService.restoreFlashcard(user_id, card_id)
   a. Query flashcard by ID and user_id
   b. Check if flashcard exists and belongs to user
   c. If not found → return { status: 'not_found' }
   d. Check if flashcard is soft-deleted (deleted_at IS NOT NULL)
   e. If not deleted → return { status: 'not_deleted' }
   f. Check if within 30-day window (NOW() - deleted_at <= 30 days)
   g. If past window → return { status: 'permanently_deleted' }
   h. Set deleted_at = NULL, updated_at = NOW()
   i. Update flashcard
   j. Return { status: 'restored', flashcard }
5. Handle service response:
   - not_found → 404 error
   - not_deleted → 404 error (not a soft-deleted card)
   - permanently_deleted → 410 Gone error
   - restored → transform entity to FlashcardResponseDTO (excludes user_id)
6. Return FlashcardResponseDTO (200 OK)
```

### 5.7 Bulk Delete Flashcards Flow

```
1. Client sends POST request with array of flashcard IDs
2. Middleware validates authentication token → extracts user_id
3. API endpoint validates request body (non-empty array of UUIDs)
4. FlashcardService.bulkDeleteFlashcards(user_id, card_ids)
   a. Query flashcards WHERE id IN (card_ids) AND user_id = user_id
   b. Get list of existing flashcard IDs
   c. Set deleted_at = NOW() for all matching flashcards
   d. Update flashcards in batch
   e. Return count and list of deleted IDs
5. Build BulkDeleteResponse
6. Return response (200 OK)
```

### 5.8 Export Flashcards Flow

```
1. Client sends GET request with format and optional status filter
2. Middleware validates authentication token → extracts user_id
3. API endpoint validates query parameters
4. FlashcardService.exportFlashcards(user_id, format, status)
   a. Query flashcards:
      - Filter by user_id
      - Filter by status (if provided)
      - Filter deleted_at IS NULL
      - Order by created_at DESC
   b. Use view_flashcards_export for optimized export data
   c. Get total count
   d. If format = 'json':
      - Build ExportFlashcardsResponse
      - Return JSON response
   e. If format = 'csv':
      - Generate CSV content with headers
      - Convert flashcard data to CSV rows
      - Set Content-Type: text/csv
      - Set Content-Disposition: attachment; filename="flashcards-export-{timestamp}.csv"
      - Return CSV content
5. Return appropriate response (200 OK)
```

---

## 6. Security Considerations

### 6.1 Authentication

- **Token Validation:** All endpoints require valid Bearer token in Authorization header
- **User Context:** Extract user_id from `context.locals.supabase.auth.getUser()`
- **Middleware Integration:** Use Astro middleware to validate authentication before reaching endpoint handlers
- **Token Expiration:** Return 401 Unauthorized for expired or invalid tokens

### 6.2 Authorization

- **User Isolation:** All database queries MUST filter by user_id to enforce data isolation
- **Ownership Verification:** For single-resource operations (get, update, delete, restore), verify flashcard belongs to authenticated user
- **RLS Policies:** Leverage Supabase Row Level Security policies as defense-in-depth
- **Bulk Operations:** Only allow bulk delete on flashcards owned by authenticated user

### 6.3 Input Validation

- **Zod Schemas:** Validate all query parameters and request bodies using Zod schemas
- **Length Constraints:** Enforce 1-2000 character limit for front/back fields
- **Enum Validation:** Validate status, source, sort, order, format against allowed values
- **UUID Validation:** Validate all ID parameters are valid UUIDs
- **Array Validation:** Ensure flashcard_ids array is non-empty and contains valid UUIDs
- **Numeric Constraints:** Enforce limit (1-100) and offset (≥0) constraints
- **Tags Parsing:** Safely parse comma-separated tags string, handle empty values

### 6.4 Data Protection

- **Soft Delete Privacy:** Never expose soft-deleted cards unless explicitly requested via include_deleted=true
- **30-Day Window:** Enforce 30-day retention window for restore operations
- **User ID Protection:** Never expose user_id in API responses - use FlashcardResponseDTO (excludes user_id) instead of FlashcardDTO (includes user_id)
- **Error Messages:** Avoid exposing database structure or sensitive details in error messages

### 6.5 Rate Limiting Considerations

- **Export Endpoint:** Consider implementing rate limiting to prevent abuse
- **Bulk Operations:** Limit maximum number of flashcard_ids in bulk delete (e.g., 100)
- **Pagination:** Enforce maximum limit of 100 to prevent large result sets

### 6.6 SQL Injection Prevention

- **Parameterized Queries:** Use Supabase client's parameterized query methods
- **No Raw SQL:** Avoid raw SQL queries with user input
- **ORM Safety:** Leverage Supabase's query builder for safe query construction

---

## 7. Error Handling

### 7.1 Error Response Format

All errors follow the standardized ErrorResponse format:

```typescript
{
  error: {
    code: string,
    message: string,
    details?: ErrorDetails
  },
  timestamp: string (ISO 8601)
}
```

### 7.2 Error Scenarios by Endpoint

#### List Flashcards

| Scenario | Status Code | Error Code | Message |
|----------|-------------|------------|---------|
| Missing/invalid token | 401 | UNAUTHORIZED | Invalid or expired authentication token |
| Invalid query parameters | 400 | VALIDATION_ERROR | Invalid query parameters |
| Invalid status enum | 400 | VALIDATION_ERROR | Status must be one of: review, active, archived |
| Invalid limit range | 400 | VALIDATION_ERROR | Limit must be between 1 and 100 |
| Invalid offset | 400 | VALIDATION_ERROR | Offset must be greater than or equal to 0 |
| Database error | 500 | INTERNAL_ERROR | An unexpected error occurred |

#### Get Single Flashcard

| Scenario | Status Code | Error Code | Message |
|----------|-------------|------------|---------|
| Missing/invalid token | 401 | UNAUTHORIZED | Invalid or expired authentication token |
| Invalid UUID format | 400 | VALIDATION_ERROR | Invalid flashcard ID format |
| Flashcard not found | 404 | NOT_FOUND | Flashcard not found |
| Flashcard belongs to other user | 404 | NOT_FOUND | Flashcard not found |
| Database error | 500 | INTERNAL_ERROR | An unexpected error occurred |

#### Create Flashcard

| Scenario | Status Code | Error Code | Message |
|----------|-------------|------------|---------|
| Missing/invalid token | 401 | UNAUTHORIZED | Invalid or expired authentication token |
| Missing front field | 400 | VALIDATION_ERROR | Front field is required |
| Missing back field | 400 | VALIDATION_ERROR | Back field is required |
| Front too short/long | 400 | VALIDATION_ERROR | Front must be between 1 and 2000 characters |
| Back too short/long | 400 | VALIDATION_ERROR | Back must be between 1 and 2000 characters |
| Invalid status enum | 400 | VALIDATION_ERROR | Status must be one of: review, active, archived |
| Invalid tags format | 400 | VALIDATION_ERROR | Tags must be an array of strings |
| Database error | 500 | INTERNAL_ERROR | An unexpected error occurred |

#### Update Flashcard

| Scenario | Status Code | Error Code | Message |
|----------|-------------|------------|---------|
| Missing/invalid token | 401 | UNAUTHORIZED | Invalid or expired authentication token |
| Invalid UUID format | 400 | VALIDATION_ERROR | Invalid flashcard ID format |
| No fields provided | 400 | VALIDATION_ERROR | At least one field must be provided for update |
| Front too short/long | 400 | VALIDATION_ERROR | Front must be between 1 and 2000 characters |
| Back too short/long | 400 | VALIDATION_ERROR | Back must be between 1 and 2000 characters |
| Invalid status enum | 400 | VALIDATION_ERROR | Status must be one of: review, active, archived |
| Flashcard not found | 404 | NOT_FOUND | Flashcard not found |
| Flashcard belongs to other user | 404 | NOT_FOUND | Flashcard not found |
| Database error | 500 | INTERNAL_ERROR | An unexpected error occurred |

#### Soft Delete Flashcard

| Scenario | Status Code | Error Code | Message |
|----------|-------------|------------|---------|
| Missing/invalid token | 401 | UNAUTHORIZED | Invalid or expired authentication token |
| Invalid UUID format | 400 | VALIDATION_ERROR | Invalid flashcard ID format |
| Flashcard not found | 404 | NOT_FOUND | Flashcard not found |
| Flashcard belongs to other user | 404 | NOT_FOUND | Flashcard not found |
| Database error | 500 | INTERNAL_ERROR | An unexpected error occurred |

#### Restore Flashcard

| Scenario | Status Code | Error Code | Message |
|----------|-------------|------------|---------|
| Missing/invalid token | 401 | UNAUTHORIZED | Invalid or expired authentication token |
| Invalid UUID format | 400 | VALIDATION_ERROR | Invalid flashcard ID format |
| Flashcard not found | 404 | NOT_FOUND | Flashcard not found |
| Flashcard not soft-deleted | 404 | NOT_FOUND | Flashcard is not deleted |
| Past 30-day window | 410 | GONE | Flashcard permanently deleted (past 30-day retention window) |
| Database error | 500 | INTERNAL_ERROR | An unexpected error occurred |

#### Bulk Delete Flashcards

| Scenario | Status Code | Error Code | Message |
|----------|-------------|------------|---------|
| Missing/invalid token | 401 | UNAUTHORIZED | Invalid or expired authentication token |
| Empty flashcard_ids array | 400 | VALIDATION_ERROR | flashcard_ids array cannot be empty |
| Invalid UUID in array | 400 | VALIDATION_ERROR | All flashcard_ids must be valid UUIDs |
| Database error | 500 | INTERNAL_ERROR | An unexpected error occurred |

**Note:** Bulk delete succeeds even if some IDs don't exist or belong to other users. Only matching flashcards are deleted.

#### Export Flashcards

| Scenario | Status Code | Error Code | Message |
|----------|-------------|------------|---------|
| Missing/invalid token | 401 | UNAUTHORIZED | Invalid or expired authentication token |
| Missing format parameter | 400 | VALIDATION_ERROR | Format parameter is required |
| Invalid format value | 400 | VALIDATION_ERROR | Format must be either 'csv' or 'json' |
| Invalid status enum | 400 | VALIDATION_ERROR | Status must be one of: review, active, archived |
| CSV generation error | 500 | INTERNAL_ERROR | Failed to generate CSV export |
| Database error | 500 | INTERNAL_ERROR | An unexpected error occurred |

### 7.3 Error Handling Implementation

```typescript
// Helper function to create error responses
function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: ErrorDetails
): ErrorResponse {
  return {
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

// Example error handling in endpoint
try {
  // Validation
  const validatedData = CreateFlashcardSchema.parse(requestBody);
  
  // Service call
  const flashcard = await flashcardService.createFlashcard(userId, validatedData);
  
  return new Response(JSON.stringify(flashcard), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    const errorResponse = createErrorResponse(
      'VALIDATION_ERROR',
      error.errors[0].message,
      { field: error.errors[0].path.join('.') }
    );
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  console.error('Unexpected error in create flashcard:', error);
  const errorResponse = createErrorResponse(
    'INTERNAL_ERROR',
    'An unexpected error occurred'
  );
  return new Response(JSON.stringify(errorResponse), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

## 8. Performance Considerations

### 8.1 Database Optimization

**Indexes:**
- `idx_flashcards_list` on `(user_id, created_at DESC)` - Optimizes list queries with default sorting
- `idx_flashcards_study` on `(user_id, status, study_weight)` - Optimizes filtered queries
- `idx_flashcards_tags` GIN index on `tags` - Fast tag-based filtering
- `idx_flashcards_deleted` on `(deleted_at)` WHERE `deleted_at IS NOT NULL` - Optimizes soft delete queries

**Query Optimization:**
- Use `select()` to fetch only required columns
- Use `count()` with `head: true` for efficient pagination counts
- Leverage database view `view_flashcards_export` for export operations
- Use batch operations for bulk delete

### 8.2 Pagination Strategy

- Default limit of 20 items balances performance and UX
- Maximum limit of 100 prevents excessive memory usage
- Offset-based pagination is simple but may have performance issues with large offsets
- Consider cursor-based pagination for future optimization if needed

### 8.3 Caching Opportunities

- Consider caching user flashcard counts for pagination
- Cache export results for repeated requests (with TTL)
- Use ETags for conditional requests on list endpoint

### 8.4 Export Performance

**CSV Generation:**
- Stream CSV generation for large datasets
- Consider background job for exports > 1000 cards
- Set reasonable timeout for export operations

**JSON Export:**
- Use database view for optimized queries
- Consider pagination for very large exports
- Implement compression (gzip) for large responses

### 8.5 Bulk Operations

- Batch database operations to reduce round trips
- Use Supabase's batch update capabilities
- Limit bulk delete to reasonable number of IDs (e.g., 100)

### 8.6 Connection Pooling

- Leverage Supabase's built-in connection pooling
- Reuse Supabase client from context.locals
- Avoid creating new clients per request

---

## 9. Implementation Steps

### Step 1: Create Validation Schemas

**File:** `src/lib/validators/flashcard.validators.ts`

1. Create Zod schemas for all request/query validations:
   - `ListFlashcardsQuerySchema`
   - `CreateFlashcardSchema`
   - `UpdateFlashcardSchema`
   - `BulkDeleteSchema`
   - `ExportFlashcardsQuerySchema`
   - `FlashcardIdParamSchema`

2. Export all schemas for use in API endpoints

### Step 2: Create Flashcard Service

**File:** `src/lib/services/flashcard.service.ts`

1. Create `FlashcardService` class with the following methods:

   ```typescript
   class FlashcardService {
     constructor(private supabase: SupabaseClient) {}
     
     async listFlashcards(userId: string, query: ListFlashcardsQuery): Promise<FlashcardListResponse>
     async getFlashcardById(userId: string, cardId: string): Promise<FlashcardDTO | null>
     async createFlashcard(userId: string, data: CreateFlashcardRequest): Promise<FlashcardDTO>
     async updateFlashcard(userId: string, cardId: string, data: UpdateFlashcardRequest): Promise<FlashcardDTO | null>
     async softDeleteFlashcard(userId: string, cardId: string): Promise<{ id: string; deleted_at: string } | null>
     async restoreFlashcard(userId: string, cardId: string): Promise<RestoreResult>
     async bulkDeleteFlashcards(userId: string, cardIds: string[]): Promise<BulkDeleteResult>
     async exportFlashcards(userId: string, format: ExportFormat, status?: FlashcardStatus): Promise<ExportResult>
   }
   ```

2. Implement each method with proper error handling and database queries

3. Add helper methods for:
   - Tag parsing (comma-separated string to array)
   - CSV generation
   - Pagination calculation

### Step 3: Create API Endpoints

Create the following endpoint files in `src/pages/api/v1/flashcards/`:

#### 3.1 List and Create Flashcards
**File:** `src/pages/api/v1/flashcards/index.ts`

```typescript
export const prerender = false;

export async function GET(context: APIContext) {
  // 1. Extract user from context.locals.supabase
  // 2. Validate query parameters with ListFlashcardsQuerySchema
  // 3. Call flashcardService.listFlashcards()
  // 4. Return FlashcardListResponse (200 OK)
  // 5. Handle errors appropriately
}

export async function POST(context: APIContext) {
  // 1. Extract user from context.locals.supabase
  // 2. Parse and validate request body with CreateFlashcardSchema
  // 3. Call flashcardService.createFlashcard()
  // 4. Return FlashcardResponseDTO (201 Created)
  // 5. Handle errors appropriately
}
```

#### 3.2 Single Flashcard Operations
**File:** `src/pages/api/v1/flashcards/[id].ts`

```typescript
export const prerender = false;

export async function GET(context: APIContext) {
  // 1. Extract user and validate ID parameter
  // 2. Call flashcardService.getFlashcardById()
  // 3. Return FlashcardResponseDTO (200 OK) or 404
}

export async function PATCH(context: APIContext) {
  // 1. Extract user and validate ID parameter
  // 2. Parse and validate request body with UpdateFlashcardSchema
  // 3. Call flashcardService.updateFlashcard()
  // 4. Return FlashcardResponseDTO (200 OK) or 404
}

export async function DELETE(context: APIContext) {
  // 1. Extract user and validate ID parameter
  // 2. Call flashcardService.softDeleteFlashcard()
  // 3. Return DeleteFlashcardResponse (200 OK) or 404
}
```

#### 3.3 Restore Flashcard
**File:** `src/pages/api/v1/flashcards/[id]/restore.ts`

```typescript
export const prerender = false;

export async function POST(context: APIContext) {
  // 1. Extract user and validate ID parameter
  // 2. Call flashcardService.restoreFlashcard()
  // 3. Handle restore result:
  //    - restored: Return FlashcardResponseDTO (200 OK)
  //    - not_found/not_deleted: Return 404
  //    - permanently_deleted: Return 410 Gone
}
```

#### 3.4 Bulk Delete
**File:** `src/pages/api/v1/flashcards/bulk-delete.ts`

```typescript
export const prerender = false;

export async function POST(context: APIContext) {
  // 1. Extract user from context.locals.supabase
  // 2. Parse and validate request body with BulkDeleteSchema
  // 3. Call flashcardService.bulkDeleteFlashcards()
  // 4. Return BulkDeleteResponse (200 OK)
}
```

#### 3.5 Export Flashcards
**File:** `src/pages/api/v1/flashcards/export.ts`

```typescript
export const prerender = false;

export async function GET(context: APIContext) {
  // 1. Extract user from context.locals.supabase
  // 2. Validate query parameters with ExportFlashcardsQuerySchema
  // 3. Call flashcardService.exportFlashcards()
  // 4. If format = 'json': Return ExportFlashcardsResponse (200 OK)
  // 5. If format = 'csv': Return CSV with appropriate headers
}
```

### Step 4: Create Error Handling Utilities

**File:** `src/lib/utils/error.utils.ts`

1. Create `createErrorResponse()` helper function
2. Create error code constants
3. Create error message templates
4. Export utility functions for consistent error handling

### Step 5: Update Middleware (if needed)

**File:** `src/middleware/index.ts`

1. Ensure authentication middleware validates tokens
2. Attach user context to `context.locals`
3. Handle authentication errors consistently

### Step 6: Testing

1. **Unit Tests** (if applicable):
   - Test validation schemas with valid/invalid inputs
   - Test service methods with mocked Supabase client
   - Test error handling utilities

2. **Integration Tests**:
   - Test each endpoint with valid requests
   - Test authentication failures
   - Test validation errors
   - Test authorization (user isolation)
   - Test edge cases (empty results, large datasets)
   - Test soft delete and restore flows
   - Test bulk operations
   - Test export in both formats

3. **Manual Testing**:
   - Use Postman/Insomnia to test all endpoints
   - Verify response formats match specification
   - Test pagination with various limits/offsets
   - Test filtering and sorting combinations
   - Test CSV export downloads correctly
   - Verify 30-day restore window enforcement

### Step 7: Documentation

1. Update API documentation with endpoint details
2. Document error codes and messages
3. Add usage examples for each endpoint
4. Document rate limiting policies (if implemented)

### Step 8: Performance Testing

1. Test list endpoint with large datasets
2. Measure export performance with various data sizes
3. Test bulk delete with maximum allowed IDs
4. Verify database query performance with EXPLAIN ANALYZE
5. Monitor response times and optimize as needed

### Step 9: Security Audit

1. Verify all endpoints require authentication
2. Test user isolation (attempt to access other users' data)
3. Verify input validation prevents injection attacks
4. Test rate limiting (if implemented)
5. Review error messages for information leakage

### Step 10: Deployment

1. Deploy to staging environment
2. Run smoke tests on staging
3. Monitor logs for errors
4. Deploy to production
5. Monitor production metrics and errors

---

## 10. Additional Considerations

### 10.1 Future Enhancements

- **Cursor-based pagination** for better performance with large datasets
- **Full-text search** on front/back fields
- **Advanced filtering** (date ranges, study_weight ranges)
- **Batch update** endpoint for updating multiple flashcards
- **Import flashcards** from CSV/JSON
- **Duplicate detection** when creating flashcards
- **Flashcard templates** for common patterns

### 10.2 Monitoring and Observability

- Log all API requests with user_id, endpoint, and response time
- Track error rates by endpoint and error code
- Monitor export endpoint usage and performance
- Set up alerts for high error rates or slow responses
- Track authentication failures

### 10.3 API Versioning

- Current version: `/api/v1/flashcards`
- Plan for future versions if breaking changes needed
- Consider deprecation strategy for old versions

### 10.4 Backward Compatibility

- Maintain existing response formats
- Add new fields as optional
- Use feature flags for experimental features
- Document breaking changes clearly

---

## 11. Summary

This implementation plan provides comprehensive guidance for building the Flashcards API with 8 endpoints covering full CRUD operations, soft deletion with restoration, bulk operations, and data export. The plan emphasizes:

- **Security**: Authentication, authorization, input validation, and user isolation
- **Performance**: Optimized queries, pagination, and efficient bulk operations
- **Error Handling**: Standardized error responses with appropriate status codes
- **Maintainability**: Service layer separation, validation schemas, and clean code practices
- **User Experience**: Flexible filtering, sorting, and export options

Follow the implementation steps sequentially, ensuring each component is tested before moving to the next. The modular design allows for incremental development and testing while maintaining code quality and security standards.
