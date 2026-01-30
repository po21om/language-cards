# API Endpoint Implementation Plan: User Profile Management

## 1. Endpoint Overview

This implementation plan covers two REST API endpoints for managing user profiles in the Language Cards application. The endpoints allow authenticated users to retrieve and update their profile preferences, specifically the UI language preference setting.

**Endpoints:**
- `GET /api/v1/profile` - Retrieve current user's profile
- `PATCH /api/v1/profile` - Update user's language preference

**Purpose:**
- Provide users access to their profile data and preferences
- Enable users to customize their language preference (English or Polish)
- Track profile metadata (creation and update timestamps)
- Maintain demo deck initialization status

## 2. Request Details

### 2.1 GET /api/v1/profile

**HTTP Method:** `GET`

**URL Structure:** `/api/v1/profile`

**Authentication:** Required - Bearer token in Authorization header

**Headers:**
- `Authorization: Bearer {access_token}` (Required)
- `Content-Type: application/json` (Standard)

**Parameters:**
- Required: None
- Optional: None
- Query Parameters: None
- Request Body: None

**Example Request:**
```http
GET /api/v1/profile HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.2 PATCH /api/v1/profile

**HTTP Method:** `PATCH`

**URL Structure:** `/api/v1/profile`

**Authentication:** Required - Bearer token in Authorization header

**Headers:**
- `Authorization: Bearer {access_token}` (Required)
- `Content-Type: application/json` (Required)

**Parameters:**
- Required: None (but at least one field should be provided in body)
- Optional: `language_preference` in request body

**Request Body:**
```typescript
{
  language_preference?: "en" | "pl"
}
```

**Validation Rules:**
- Body must be valid JSON
- Only `language_preference` field is allowed (strict validation)
- `language_preference` must be exactly "en" or "pl" if provided
- Empty object `{}` should be rejected with 400 error
- Unknown fields should be rejected with 400 error

**Example Request:**
```http
PATCH /api/v1/profile HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "language_preference": "pl"
}
```

## 3. Used Types

### 3.1 Existing Types (from `src/types.ts`)

**ProfileDTO:**
```typescript
export type ProfileDTO = ProfileEntity;
// Includes: id, language_preference, is_demo_deck_loaded, created_at, updated_at
```

**UpdateProfileRequest:**
```typescript
export interface UpdateProfileRequest {
  language_preference?: LanguagePreference;
}
```

**LanguagePreference:**
```typescript
export type LanguagePreference = 'en' | 'pl';
```

**ErrorResponse:**
```typescript
export interface ErrorResponse {
  error: ErrorObject;
  timestamp: string;
}

export interface ErrorObject {
  code: string;
  message: string;
  details?: ErrorDetails;
}
```

### 3.2 New Validation Schemas (Zod)

**UpdateProfileSchema:**
```typescript
import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  language_preference: z.enum(['en', 'pl'], {
    errorMap: () => ({ message: "Language preference must be 'en' or 'pl'" })
  }).optional()
}).strict({
  message: "Only 'language_preference' field is allowed"
});
```

**Note:** The schema uses `.strict()` to reject unknown fields and provides custom error messages for better user experience.

## 4. Response Details

### 4.1 GET /api/v1/profile

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "language_preference": "en",
  "is_demo_deck_loaded": true,
  "created_at": "2026-01-30T19:14:00Z",
  "updated_at": "2026-01-30T19:14:00Z"
}
```

**Response Type:** `ProfileDTO`

**Status Codes:**
- `200 OK` - Profile successfully retrieved
- `401 Unauthorized` - Invalid, missing, or expired token
- `404 Not Found` - Profile not found (should be rare)
- `500 Internal Server Error` - Database or server error

### 4.2 PATCH /api/v1/profile

**Success Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "language_preference": "pl",
  "is_demo_deck_loaded": true,
  "created_at": "2026-01-30T19:14:00Z",
  "updated_at": "2026-01-30T19:20:00Z"
}
```

**Response Type:** `ProfileDTO`

**Status Codes:**
- `200 OK` - Profile successfully updated
- `400 Bad Request` - Invalid request body or validation error
- `401 Unauthorized` - Invalid, missing, or expired token
- `404 Not Found` - Profile not found
- `500 Internal Server Error` - Database or server error

### 4.3 Error Response Format

All error responses follow the standard `ErrorResponse` format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Language preference must be 'en' or 'pl'",
    "details": {
      "field": "language_preference"
    }
  },
  "timestamp": "2026-01-30T19:20:00Z"
}
```

**Common Error Codes:**
- `UNAUTHORIZED` - Authentication failure
- `NOT_FOUND` - Profile not found
- `VALIDATION_ERROR` - Input validation failure
- `INTERNAL_ERROR` - Unexpected server error

## 5. Data Flow

### 5.1 GET /api/v1/profile Flow

```
1. Client Request
   ↓
2. Astro Middleware (Authentication)
   - Validate Bearer token
   - Extract user_id from token
   - Attach user to context.locals
   ↓
3. GET Handler (/src/pages/api/v1/profile.ts)
   - Extract user_id from context.locals.user
   - Call ProfileService.getProfile(user_id)
   ↓
4. ProfileService.getProfile()
   - Query: SELECT * FROM profiles WHERE id = user_id
   - Return ProfileEntity or null
   ↓
5. Response Processing
   - If profile found: Return 200 with ProfileDTO
   - If profile not found: Return 404 with error
   - If database error: Return 500 with error
   ↓
6. Client receives response
```

### 5.2 PATCH /api/v1/profile Flow

```
1. Client Request with JSON body
   ↓
2. Astro Middleware (Authentication)
   - Validate Bearer token
   - Extract user_id from token
   - Attach user to context.locals
   ↓
3. PATCH Handler (/src/pages/api/v1/profile.ts)
   - Parse request body
   - Validate with UpdateProfileSchema (Zod)
   - Extract user_id from context.locals.user
   - Call ProfileService.updateProfile(user_id, updates)
   ↓
4. ProfileService.updateProfile()
   - Query: UPDATE profiles SET language_preference = ?, updated_at = NOW() WHERE id = user_id
   - Return updated ProfileEntity or null
   ↓
5. Response Processing
   - If profile updated: Return 200 with updated ProfileDTO
   - If profile not found: Return 404 with error
   - If validation error: Return 400 with error details
   - If database error: Return 500 with error
   ↓
6. Client receives response
```

### 5.3 Database Interactions

**Table:** `public.profiles`

**GET Operation:**
```sql
SELECT id, language_preference, is_demo_deck_loaded, created_at, updated_at
FROM public.profiles
WHERE id = $1;
```

**PATCH Operation:**
```sql
UPDATE public.profiles
SET 
  language_preference = $2,
  updated_at = NOW()
WHERE id = $1
RETURNING id, language_preference, is_demo_deck_loaded, created_at, updated_at;
```

**Row Level Security (RLS):**
- Supabase RLS policies ensure users can only access their own profile
- Policy: `auth.uid() = id` for SELECT and UPDATE operations

## 6. Security Considerations

### 6.1 Authentication

**Token Validation:**
- All requests must include valid Bearer token in Authorization header
- Token validation handled by Astro middleware before reaching endpoint handlers
- Middleware extracts user_id from validated token and attaches to `context.locals.user`
- Expired or invalid tokens result in 401 Unauthorized response

**Implementation:**
- Use Supabase client from `context.locals.supabase`
- Token automatically validated by Supabase SDK
- No manual token parsing or validation in endpoint handlers

### 6.2 Authorization

**Access Control:**
- Users can only access and modify their own profile
- User_id from authenticated token determines which profile is accessed
- No admin or role-based access control needed for these endpoints
- Database RLS policies provide additional security layer

**Enforcement:**
- User_id extracted from token (not from request body or query params)
- All database queries filtered by authenticated user_id
- RLS policies prevent unauthorized access even if application logic fails

### 6.3 Input Validation

**Request Body Validation:**
- Use Zod schema with strict mode to reject unknown fields
- Validate language_preference against enum values ('en' | 'pl')
- Reject empty objects or requests with no valid updates
- Provide clear error messages for validation failures

**SQL Injection Prevention:**
- Use Supabase parameterized queries (automatic protection)
- Never concatenate user input into SQL strings
- Supabase SDK handles all query parameterization

**XSS Prevention:**
- No HTML rendering in API responses (JSON only)
- Language preference values are constrained to enum
- No user-generated content in profile fields that could contain scripts

### 6.4 Rate Limiting

**Considerations:**
- Profile updates are infrequent operations
- Consider implementing rate limiting at API gateway or middleware level
- Suggested limit: 10 requests per minute per user for PATCH endpoint
- GET endpoint can have higher limits (e.g., 60 requests per minute)

### 6.5 Data Privacy

**Sensitive Data:**
- Profile contains minimal sensitive information
- User_id (UUID) is not considered sensitive but should not be exposed unnecessarily
- Email is not included in profile response (stored in auth.users table)

**GDPR Compliance:**
- Profile data is deleted when user account is deleted (CASCADE constraint)
- Users can view and update their own data
- No third-party data sharing

## 7. Error Handling

### 7.1 Error Scenarios and Responses

#### GET /api/v1/profile

**1. Missing Authorization Header**
- Status: `401 Unauthorized`
- Error Code: `UNAUTHORIZED`
- Message: "Authentication required"
- Handling: Middleware intercepts before reaching handler

**2. Invalid or Expired Token**
- Status: `401 Unauthorized`
- Error Code: `UNAUTHORIZED`
- Message: "Invalid or expired authentication token"
- Handling: Middleware validates token and returns error

**3. Profile Not Found**
- Status: `404 Not Found`
- Error Code: `NOT_FOUND`
- Message: "Profile not found"
- Handling: Service returns null, handler returns 404
- Note: This should be rare as profiles are created during signup

**4. Database Connection Error**
- Status: `500 Internal Server Error`
- Error Code: `INTERNAL_ERROR`
- Message: "An unexpected error occurred"
- Handling: Catch database exceptions, log error, return generic message
- Logging: Log full error details for debugging

**5. Unexpected Server Error**
- Status: `500 Internal Server Error`
- Error Code: `INTERNAL_ERROR`
- Message: "An unexpected error occurred"
- Handling: Global error handler catches unhandled exceptions

#### PATCH /api/v1/profile

**1. Missing Authorization Header**
- Status: `401 Unauthorized`
- Error Code: `UNAUTHORIZED`
- Message: "Authentication required"
- Handling: Middleware intercepts before reaching handler

**2. Invalid or Expired Token**
- Status: `401 Unauthorized`
- Error Code: `UNAUTHORIZED`
- Message: "Invalid or expired authentication token"
- Handling: Middleware validates token and returns error

**3. Invalid JSON Body**
- Status: `400 Bad Request`
- Error Code: `VALIDATION_ERROR`
- Message: "Invalid JSON in request body"
- Handling: Try-catch around JSON parsing, return 400

**4. Empty Request Body**
- Status: `400 Bad Request`
- Error Code: `VALIDATION_ERROR`
- Message: "Request body must contain at least one field to update"
- Handling: Check if parsed body is empty object

**5. Invalid Language Preference**
- Status: `400 Bad Request`
- Error Code: `VALIDATION_ERROR`
- Message: "Language preference must be 'en' or 'pl'"
- Details: `{ field: "language_preference" }`
- Handling: Zod validation catches invalid values

**6. Unknown Fields in Request**
- Status: `400 Bad Request`
- Error Code: `VALIDATION_ERROR`
- Message: "Only 'language_preference' field is allowed"
- Handling: Zod strict mode rejects unknown fields

**7. Profile Not Found**
- Status: `404 Not Found`
- Error Code: `NOT_FOUND`
- Message: "Profile not found"
- Handling: Service returns null, handler returns 404

**8. Database Constraint Violation**
- Status: `400 Bad Request`
- Error Code: `VALIDATION_ERROR`
- Message: "Invalid language preference value"
- Handling: Catch database constraint errors, return 400

**9. Database Connection Error**
- Status: `500 Internal Server Error`
- Error Code: `INTERNAL_ERROR`
- Message: "An unexpected error occurred"
- Handling: Catch database exceptions, log error, return generic message

**10. Unexpected Server Error**
- Status: `500 Internal Server Error`
- Error Code: `INTERNAL_ERROR`
- Message: "An unexpected error occurred"
- Handling: Global error handler catches unhandled exceptions

### 7.2 Error Response Helper

Create a utility function for consistent error responses:

```typescript
function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: ErrorDetails
): ErrorResponse {
  return {
    error: {
      code,
      message,
      details
    },
    timestamp: new Date().toISOString()
  };
}
```

### 7.3 Logging Strategy

**Error Logging:**
- Log all 500 errors with full stack traces
- Log 400 errors with validation details (for monitoring abuse)
- Do not log 401 errors (too noisy, expected for invalid tokens)
- Log 404 errors (may indicate data inconsistency issues)

**Log Format:**
```typescript
console.error('[PROFILE_API]', {
  endpoint: 'GET /api/v1/profile',
  userId: user.id,
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});
```

## 8. Performance Considerations

### 8.1 Database Query Optimization

**Indexes:**
- Primary key index on `profiles.id` (automatic) - ensures fast lookups
- No additional indexes needed for these simple queries

**Query Performance:**
- GET: Single-row lookup by primary key - O(1) complexity
- PATCH: Single-row update by primary key - O(1) complexity
- Both operations are extremely fast (< 1ms typically)

### 8.2 Caching Strategy

**Profile Data Caching:**
- Consider caching profile data in client-side storage (localStorage/sessionStorage)
- Cache invalidation on PATCH success
- Server-side caching not necessary due to fast database queries
- If implementing server-side cache, use Redis with TTL of 5-10 minutes

**Cache Key Format:**
```
profile:{user_id}
```

### 8.3 Response Size

**Payload Size:**
- Profile response is small (~200 bytes)
- No pagination needed
- No compression necessary for such small payloads

### 8.4 Connection Pooling

**Database Connections:**
- Supabase handles connection pooling automatically
- No manual connection management needed
- Default pool size is sufficient for profile operations

### 8.5 Potential Bottlenecks

**Identified Bottlenecks:**
- None expected for these simple CRUD operations
- Database is the only external dependency
- Single-row operations are inherently fast

**Mitigation Strategies:**
- Monitor database response times
- Set up alerts for slow queries (> 100ms)
- Implement request timeout (5 seconds)

## 9. Implementation Steps

### Step 1: Create Profile Service

**File:** `src/lib/services/profile.service.ts`

**Tasks:**
1. Create `ProfileService` class or module
2. Implement `getProfile(userId: string): Promise<ProfileDTO | null>`
   - Query profiles table by id
   - Return profile or null if not found
   - Handle database errors
3. Implement `updateProfile(userId: string, updates: UpdateProfileRequest): Promise<ProfileDTO | null>`
   - Update profiles table with new values
   - Set updated_at to current timestamp
   - Return updated profile or null if not found
   - Handle database errors and constraint violations

**Dependencies:**
- Import `SupabaseClient` type from `src/db/supabase.client.ts`
- Import types from `src/types.ts`

**Example Structure:**
```typescript
export class ProfileService {
  constructor(private supabase: SupabaseClient) {}

  async getProfile(userId: string): Promise<ProfileDTO | null> {
    // Implementation
  }

  async updateProfile(
    userId: string, 
    updates: UpdateProfileRequest
  ): Promise<ProfileDTO | null> {
    // Implementation
  }
}
```

### Step 2: Create Validation Schema

**File:** `src/lib/validation/profile.validation.ts` (or similar)

**Tasks:**
1. Import Zod
2. Create `UpdateProfileSchema` with strict validation
3. Export schema for use in endpoint handler

**Schema Requirements:**
- Optional `language_preference` field
- Enum validation for 'en' | 'pl'
- Strict mode to reject unknown fields
- Custom error messages

### Step 3: Implement GET Endpoint Handler

**File:** `src/pages/api/v1/profile.ts`

**Tasks:**
1. Export `prerender = false` for SSR
2. Implement `GET` handler function
3. Extract user from `context.locals.user` (set by auth middleware)
4. Handle unauthenticated requests (return 401)
5. Create ProfileService instance with Supabase client
6. Call `service.getProfile(user.id)`
7. Handle success case (return 200 with profile)
8. Handle not found case (return 404)
9. Handle errors (return 500 with error details)
10. Use proper TypeScript types for request/response

**Error Handling:**
- Try-catch block around service call
- Log errors appropriately
- Return standardized error responses

### Step 4: Implement PATCH Endpoint Handler

**File:** `src/pages/api/v1/profile.ts` (same file as GET)

**Tasks:**
1. Implement `PATCH` handler function
2. Extract user from `context.locals.user`
3. Handle unauthenticated requests (return 401)
4. Parse request body JSON
5. Handle JSON parsing errors (return 400)
6. Validate request body with Zod schema
7. Handle validation errors (return 400 with details)
8. Check for empty updates (return 400)
9. Create ProfileService instance
10. Call `service.updateProfile(user.id, validatedData)`
11. Handle success case (return 200 with updated profile)
12. Handle not found case (return 404)
13. Handle database constraint errors (return 400)
14. Handle other errors (return 500)

**Validation Flow:**
```typescript
try {
  const body = await request.json();
  const validatedData = UpdateProfileSchema.parse(body);
  // Continue with update
} catch (error) {
  if (error instanceof z.ZodError) {
    // Return 400 with validation errors
  }
  // Handle other errors
}
```

### Step 5: Create Error Response Utilities

**File:** `src/lib/utils/error.utils.ts` (or similar)

**Tasks:**
1. Create `createErrorResponse` helper function
2. Create specific error factory functions:
   - `createValidationError(message, details)`
   - `createNotFoundError(message)`
   - `createUnauthorizedError(message)`
   - `createInternalError()`
3. Export utilities for use in handlers

### Step 6: Add Type Safety

**Tasks:**
1. Ensure all functions have proper TypeScript types
2. Use `APIContext` type from Astro for handler parameters
3. Use `Response` type for return values
4. Verify all DTOs match database schema
5. Add JSDoc comments for public functions

### Step 7: Write Unit Tests

**File:** `src/lib/services/__tests__/profile.service.test.ts`

**Test Cases for ProfileService:**
1. `getProfile` returns profile when found
2. `getProfile` returns null when not found
3. `getProfile` throws error on database failure
4. `updateProfile` returns updated profile
5. `updateProfile` returns null when profile not found
6. `updateProfile` handles constraint violations
7. `updateProfile` updates timestamp correctly

**File:** `src/pages/api/v1/__tests__/profile.test.ts`

**Test Cases for Endpoints:**
1. GET returns 401 without authentication
2. GET returns 200 with valid profile
3. GET returns 404 when profile not found
4. PATCH returns 401 without authentication
5. PATCH returns 400 with invalid language preference
6. PATCH returns 400 with unknown fields
7. PATCH returns 400 with empty body
8. PATCH returns 200 with valid update
9. PATCH returns 404 when profile not found
10. Both endpoints return 500 on database errors

### Step 8: Write Integration Tests

**File:** `tests/integration/profile.test.ts`

**Test Scenarios:**
1. End-to-end profile retrieval flow
2. End-to-end profile update flow
3. Authentication failure scenarios
4. Concurrent update handling
5. Language preference persistence

### Step 9: Update API Documentation

**Tasks:**
1. Update OpenAPI/Swagger documentation if exists
2. Update README with endpoint examples
3. Document error codes and responses
4. Add example curl commands

### Step 10: Manual Testing

**Test Checklist:**
1. ✓ GET profile with valid token
2. ✓ GET profile with invalid token
3. ✓ GET profile with expired token
4. ✓ PATCH profile with valid language change
5. ✓ PATCH profile with invalid language
6. ✓ PATCH profile with unknown fields
7. ✓ PATCH profile with empty body
8. ✓ PATCH profile with malformed JSON
9. ✓ Verify updated_at changes on update
10. ✓ Verify RLS policies work correctly

**Tools:**
- Postman or similar API testing tool
- Browser DevTools for frontend integration
- Database client to verify data changes

### Step 11: Performance Testing

**Tasks:**
1. Measure endpoint response times
2. Test with concurrent requests
3. Verify database query performance
4. Check for N+1 query issues (not applicable here)
5. Monitor memory usage

**Acceptance Criteria:**
- GET endpoint responds in < 50ms (p95)
- PATCH endpoint responds in < 100ms (p95)
- No memory leaks under load

### Step 12: Security Review

**Checklist:**
1. ✓ Authentication required for all operations
2. ✓ Authorization enforced (user can only access own profile)
3. ✓ Input validation comprehensive
4. ✓ SQL injection prevention verified
5. ✓ XSS prevention verified
6. ✓ Error messages don't leak sensitive information
7. ✓ Rate limiting considered
8. ✓ CORS configuration appropriate

### Step 13: Code Review and Refinement

**Review Points:**
1. Code follows project style guidelines
2. Error handling is comprehensive
3. Logging is appropriate
4. Types are correct and complete
5. Tests provide adequate coverage
6. Documentation is clear and complete
7. No code duplication
8. Performance is acceptable

### Step 14: Deployment Preparation

**Tasks:**
1. Ensure environment variables are configured
2. Verify database migrations are applied
3. Test in staging environment
4. Prepare rollback plan
5. Update deployment documentation

### Step 15: Monitoring and Observability

**Setup:**
1. Add logging for key operations
2. Set up error tracking (e.g., Sentry)
3. Configure performance monitoring
4. Create dashboards for key metrics:
   - Request count by endpoint
   - Response time percentiles
   - Error rate by type
   - Profile update frequency

**Alerts:**
- Error rate > 1% for 5 minutes
- Response time p95 > 200ms
- Database connection failures

---

## Implementation Checklist

- [ ] Step 1: Create Profile Service
- [ ] Step 2: Create Validation Schema
- [ ] Step 3: Implement GET Endpoint Handler
- [ ] Step 4: Implement PATCH Endpoint Handler
- [ ] Step 5: Create Error Response Utilities
- [ ] Step 6: Add Type Safety
- [ ] Step 7: Write Unit Tests
- [ ] Step 8: Write Integration Tests
- [ ] Step 9: Update API Documentation
- [ ] Step 10: Manual Testing
- [ ] Step 11: Performance Testing
- [ ] Step 12: Security Review
- [ ] Step 13: Code Review and Refinement
- [ ] Step 14: Deployment Preparation
- [ ] Step 15: Monitoring and Observability

---

## Additional Notes

### Dependencies

**Required Packages:**
- `zod` - Input validation (should already be installed)
- `@supabase/supabase-js` - Database client (already installed)

### Environment Variables

No additional environment variables needed. Use existing Supabase configuration.

### Database Migrations

No migrations needed. The `profiles` table already exists with correct schema.

### Future Enhancements

**Potential Improvements:**
1. Add more profile fields (theme preference, timezone, etc.)
2. Implement profile picture upload
3. Add profile completion percentage
4. Support for more languages
5. Profile activity history
6. Email notification preferences

### Related Endpoints

This profile management functionality integrates with:
- Authentication endpoints (signup creates profile)
- All other endpoints (use language preference for localization)

### Maintenance Considerations

**Regular Tasks:**
- Monitor error rates and response times
- Review and update validation rules as needed
- Keep dependencies updated
- Review and optimize database queries periodically
