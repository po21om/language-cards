# API Endpoint Implementation Plan: Study Sessions

## 1. Endpoint Overview

This implementation plan covers four study-related REST API endpoints that enable users to conduct spaced repetition study sessions with their flashcards. The endpoints support:

- **Starting study sessions** with weighted card selection based on study performance
- **Submitting review outcomes** that update card weights using a spaced repetition algorithm
- **Retrieving study statistics** with time-based filtering and analytics
- **Viewing card-specific study history** with performance metrics

All endpoints require authentication and enforce user-level data isolation. The system uses a weight-based algorithm to prioritize cards that need more practice while gradually reducing the frequency of well-known cards.

---

## 2. Request Details

### 2.5.1 Start Study Session

- **HTTP Method:** `POST`
- **URL Structure:** `/api/v1/study/session`
- **Authentication:** Required (Bearer token in Authorization header)
- **Query Parameters:**
  - `card_count` (optional): Number of cards to include (integer, 1-50, default: 20)
  - `tags` (optional): Comma-separated list of tags to filter cards (string)
  - `status` (optional): Filter by card status (enum: 'review' | 'active' | 'archived', default: 'active')
- **Request Body:** None

### 2.5.2 Submit Study Review

- **HTTP Method:** `POST`
- **URL Structure:** `/api/v1/study/review`
- **Authentication:** Required (Bearer token in Authorization header)
- **Query Parameters:** None
- **Request Body:**
```typescript
{
  card_id: string;      // UUID format
  outcome: StudyOutcome; // 'correct' | 'incorrect' | 'skipped'
}
```

### 2.5.3 Get Study Statistics

- **HTTP Method:** `GET`
- **URL Structure:** `/api/v1/study/statistics`
- **Authentication:** Required (Bearer token in Authorization header)
- **Query Parameters:**
  - `period` (optional): Time period for statistics (enum: 'day' | 'week' | 'month' | 'all', default: 'all')
- **Request Body:** None

### 2.5.4 Get Card Study History

- **HTTP Method:** `GET`
- **URL Structure:** `/api/v1/study/cards/{card_id}/history`
- **Authentication:** Required (Bearer token in Authorization header)
- **Path Parameters:**
  - `card_id` (required): UUID of the card
- **Query Parameters:**
  - `limit` (optional): Number of review records to return (integer, 1-100, default: 20)
- **Request Body:** None

---

## 3. Used Types

All types are already defined in `src/types.ts`. The following types will be used:

### Request Types
- `StartStudySessionQuery` - Query parameters for starting a session
- `SubmitStudyReviewRequest` - Request body for submitting a review
- `StudyStatisticsQuery` - Query parameters for statistics
- `CardStudyHistoryQuery` - Query parameters for card history

### Response Types
- `StartStudySessionResponse` - Response for starting a session
- `StudyCardDTO` - Card data in study session (limited fields)
- `SubmitStudyReviewResponse` - Response for submitting a review
- `StudyStatisticsResponse` - Response for statistics
- `CardStudyHistoryResponse` - Response for card history
- `StudyReviewDTO` - Full review entity data (includes user_id)
- `StudyReviewResponseDTO` - Review data for API responses (excludes user_id)
- `ErrorResponse` - Standard error response format

### Utility Types
- `StudyOutcome` - 'correct' | 'incorrect' | 'skipped'
- `StatisticsPeriod` - 'day' | 'week' | 'month' | 'all'
- `FlashcardStatus` - 'review' | 'active' | 'archived'

### Database Entity Types
- `FlashcardEntity` - Full flashcard entity from database
- `StudyReviewEntity` - Full study review entity from database

---

## 4. Response Details

### 2.5.1 Start Study Session

**Success Response (200 OK):**
```typescript
{
  session_id: string;        // UUID generated for this session
  cards: StudyCardDTO[];     // Array of cards with limited fields
  total_cards: number;       // Number of cards in session
  started_at: string;        // ISO 8601 timestamp
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired authentication token
- `400 Bad Request`: Invalid query parameters (card_count out of range, invalid status value)
- `404 Not Found`: No cards available matching the specified filters

### 2.5.2 Submit Study Review

**Success Response (200 OK):**
```typescript
{
  id: string;                // UUID of the created review record
  card_id: string;           // UUID of the reviewed card
  outcome: StudyOutcome;     // Review outcome
  previous_weight: number;   // Weight before review
  new_weight: number;        // Updated weight after review
  reviewed_at: string;       // ISO 8601 timestamp
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired authentication token
- `400 Bad Request`: Invalid outcome value or malformed card_id
- `404 Not Found`: Card not found or doesn't belong to authenticated user

### 2.5.3 Get Study Statistics

**Success Response (200 OK):**
```typescript
{
  period: StatisticsPeriod;      // Requested time period
  total_reviews: number;         // Total number of reviews
  correct_reviews: number;       // Number of correct reviews
  incorrect_reviews: number;     // Number of incorrect reviews
  skipped_reviews: number;       // Number of skipped reviews
  accuracy_rate: number;         // Percentage (0-100)
  cards_studied: number;         // Unique cards reviewed
  average_weight: number;        // Average weight of all user's cards
  study_streak_days: number;     // Consecutive days with reviews
  last_study_session: string | null; // ISO 8601 timestamp or null
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired authentication token
- `400 Bad Request`: Invalid period parameter

### 2.5.4 Get Card Study History

**Success Response (200 OK):**
```typescript
{
  card_id: string;                    // UUID of the card
  reviews: StudyReviewResponseDTO[];  // Array of review records (most recent first, excludes user_id)
  total_reviews: number;              // Total number of reviews for this card
  correct_count: number;              // Number of correct reviews
  incorrect_count: number;            // Number of incorrect reviews
  accuracy_rate: number;              // Percentage (0-100)
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired authentication token
- `400 Bad Request`: Invalid limit parameter
- `404 Not Found`: Card not found or doesn't belong to authenticated user

---

## 5. Data Flow

### 2.5.1 Start Study Session Flow

1. **Authentication**: Extract and verify user ID from Bearer token
2. **Input Validation**: Validate query parameters (card_count, tags, status)
3. **Card Selection**:
   - Query `flashcards` table filtered by:
     - `user_id` = authenticated user
     - `status` = specified status (default: 'active')
     - `deleted_at IS NULL`
     - `tags` contains any of the specified tags (if provided)
   - Order by `study_weight DESC` (higher weight = higher priority)
   - Apply weighted random selection to avoid always showing the same cards
   - Limit to `card_count` cards
4. **Session Creation**:
   - Generate unique `session_id` (UUID)
   - Store session metadata (can be in-memory or cached for validation)
5. **Response Mapping**: Transform `FlashcardEntity` to `StudyCardDTO` (only id, front, tags, current_weight)
6. **Return Response**: 200 OK with session data

**Database Interactions:**
- SELECT from `flashcards` with filters and ordering

### 2.5.2 Submit Study Review Flow

1. **Authentication**: Extract and verify user ID from Bearer token
2. **Input Validation**: 
   - Validate `card_id` is valid UUID
   - Validate `outcome` is one of: 'correct', 'incorrect', 'skipped'
3. **Card Verification**:
   - Query `flashcards` table for card with matching `id` and `user_id`
   - Return 404 if not found or doesn't belong to user
4. **Weight Calculation**:
   - Retrieve current `study_weight` from card
   - Calculate new weight based on outcome:
     - **Correct**: `new_weight = max(0.5, previous_weight * 0.8)`
     - **Incorrect**: `new_weight = min(5.0, previous_weight * 1.5)`
     - **Skipped**: `new_weight = min(5.0, previous_weight * 1.1)`
5. **Database Transaction**:
   - INSERT into `study_reviews` table with review data
   - UPDATE `flashcards` table to set new `study_weight`
   - UPDATE `flashcards.updated_at` to current timestamp
6. **Response Mapping**: Return review data excluding `user_id`
7. **Return Response**: 200 OK with review result

**Database Interactions:**
- SELECT from `flashcards` (verification)
- INSERT into `study_reviews`
- UPDATE `flashcards` (weight and timestamp)
- Use database transaction to ensure atomicity

### 2.5.3 Get Study Statistics Flow

1. **Authentication**: Extract and verify user ID from Bearer token
2. **Input Validation**: Validate `period` parameter
3. **Time Range Calculation**:
   - **day**: Last 24 hours from now
   - **week**: Last 7 days from now
   - **month**: Last 30 days from now
   - **all**: No time filter
4. **Statistics Aggregation**:
   - Query `study_reviews` table filtered by `user_id` and time range
   - Aggregate counts by outcome
   - Calculate accuracy rate: `(correct_reviews / (total_reviews - skipped_reviews)) * 100`
   - Count distinct `card_id` for `cards_studied`
5. **Additional Metrics**:
   - Query `flashcards` table for average `study_weight` of user's active cards
   - Calculate study streak by querying reviews grouped by date
   - Get most recent `reviewed_at` timestamp for `last_study_session`
6. **Return Response**: 200 OK with statistics

**Database Interactions:**
- SELECT with aggregations from `study_reviews`
- SELECT AVG(study_weight) from `flashcards`
- SELECT for streak calculation (grouped by date)

### 2.5.4 Get Card Study History Flow

1. **Authentication**: Extract and verify user ID from Bearer token
2. **Input Validation**: 
   - Validate `card_id` from path parameter is valid UUID
   - Validate `limit` parameter (1-100, default: 20)
3. **Card Verification**:
   - Query `flashcards` table to verify card exists and belongs to user
   - Return 404 if not found or doesn't belong to user
4. **History Retrieval**:
   - Query `study_reviews` table filtered by `card_id`
   - Order by `reviewed_at DESC`
   - Limit to specified `limit`
5. **Aggregations**:
   - Count total reviews for this card
   - Count reviews by outcome (correct, incorrect)
   - Calculate accuracy rate: `(correct_count / (total_reviews - skipped_count)) * 100`
6. **Return Response**: 200 OK with history and metrics

**Database Interactions:**
- SELECT from `flashcards` (verification)
- SELECT from `study_reviews` with ordering and limit
- SELECT with aggregations from `study_reviews` for metrics

---

## 6. Security Considerations

### Authentication & Authorization

1. **Token Verification**:
   - All endpoints require valid Bearer token in Authorization header
   - Use Supabase SDK's `getUser()` to verify token and extract user ID
   - Return 401 if token is invalid, expired, or missing

2. **User Data Isolation**:
   - Always filter database queries by `user_id` from authenticated token
   - Never trust `user_id` from request body or query parameters
   - Verify card ownership before allowing reviews or history access

3. **Resource Ownership**:
   - For Submit Review: Verify card belongs to user before creating review
   - For Card History: Verify card belongs to user before returning data
   - Return 404 (not 403) to avoid leaking information about resource existence

### Input Validation

1. **Type Validation**:
   - Validate all UUIDs using regex or UUID library
   - Validate enums against allowed values
   - Validate numeric ranges (card_count: 1-50, limit: 1-100)

2. **SQL Injection Prevention**:
   - Use Supabase SDK's parameterized queries (built-in protection)
   - Never concatenate user input into SQL strings

3. **Tag Filtering**:
   - Sanitize comma-separated tag input
   - Trim whitespace from individual tags
   - Handle empty strings and invalid formats gracefully

### Data Exposure

1. **Response Sanitization**:
   - Never include `user_id` in API responses
   - Use `StudyCardDTO` (limited fields) for session cards, not full `FlashcardEntity`
   - Use `SubmitStudyReviewResponse` (excludes user_id) for review responses

2. **Error Messages**:
   - Use generic error messages that don't leak system information
   - Don't expose database schema or internal IDs in errors
   - Log detailed errors server-side but return sanitized messages to client

### Rate Limiting

1. **Consider implementing rate limits**:
   - Start Session: 60 requests per hour per user
   - Submit Review: 300 requests per hour per user (5 reviews per minute)
   - Statistics: 120 requests per hour per user
   - Card History: 120 requests per hour per user

---

## 7. Error Handling

### Common Errors (All Endpoints)

| Error Code | HTTP Status | Scenario | Response |
|------------|-------------|----------|----------|
| UNAUTHORIZED | 401 | Missing, invalid, or expired token | `{ error: { code: "UNAUTHORIZED", message: "Authentication required" }, timestamp: "..." }` |
| INTERNAL_ERROR | 500 | Unexpected server error | `{ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" }, timestamp: "..." }` |

### 2.5.1 Start Study Session Errors

| Error Code | HTTP Status | Scenario | Response |
|------------|-------------|----------|----------|
| VALIDATION_ERROR | 400 | `card_count` out of range (1-50) | `{ error: { code: "VALIDATION_ERROR", message: "card_count must be between 1 and 50", details: { field: "card_count", min: 1, max: 50 } }, timestamp: "..." }` |
| VALIDATION_ERROR | 400 | Invalid `status` value | `{ error: { code: "VALIDATION_ERROR", message: "status must be one of: review, active, archived", details: { field: "status" } }, timestamp: "..." }` |
| NOT_FOUND | 404 | No cards available for study | `{ error: { code: "NOT_FOUND", message: "No cards available for study with the specified filters" }, timestamp: "..." }` |

### 2.5.2 Submit Study Review Errors

| Error Code | HTTP Status | Scenario | Response |
|------------|-------------|----------|----------|
| VALIDATION_ERROR | 400 | Invalid `card_id` format | `{ error: { code: "VALIDATION_ERROR", message: "card_id must be a valid UUID", details: { field: "card_id" } }, timestamp: "..." }` |
| VALIDATION_ERROR | 400 | Invalid `outcome` value | `{ error: { code: "VALIDATION_ERROR", message: "outcome must be one of: correct, incorrect, skipped", details: { field: "outcome" } }, timestamp: "..." }` |
| NOT_FOUND | 404 | Card not found or doesn't belong to user | `{ error: { code: "NOT_FOUND", message: "Card not found" }, timestamp: "..." }` |

### 2.5.3 Get Study Statistics Errors

| Error Code | HTTP Status | Scenario | Response |
|------------|-------------|----------|----------|
| VALIDATION_ERROR | 400 | Invalid `period` value | `{ error: { code: "VALIDATION_ERROR", message: "period must be one of: day, week, month, all", details: { field: "period" } }, timestamp: "..." }` |

### 2.5.4 Get Card Study History Errors

| Error Code | HTTP Status | Scenario | Response |
|------------|-------------|----------|----------|
| VALIDATION_ERROR | 400 | Invalid `card_id` format | `{ error: { code: "VALIDATION_ERROR", message: "card_id must be a valid UUID", details: { field: "card_id" } }, timestamp: "..." }` |
| VALIDATION_ERROR | 400 | `limit` out of range (1-100) | `{ error: { code: "VALIDATION_ERROR", message: "limit must be between 1 and 100", details: { field: "limit", min: 1, max: 100 } }, timestamp: "..." }` |
| NOT_FOUND | 404 | Card not found or doesn't belong to user | `{ error: { code: "NOT_FOUND", message: "Card not found" }, timestamp: "..." }` |

### Error Handling Best Practices

1. **Consistent Error Format**: All errors follow the `ErrorResponse` type structure
2. **Appropriate Status Codes**: Use correct HTTP status codes for each error type
3. **Detailed Logging**: Log full error details server-side including stack traces
4. **Sanitized Responses**: Return user-friendly messages without exposing internals
5. **Timestamp**: Include ISO 8601 timestamp in all error responses

---

## 8. Performance Considerations

### Database Query Optimization

1. **Indexes** (already defined in schema):
   - `idx_flashcards_study` on `(user_id, status, study_weight)` - Optimizes card selection for study sessions
   - `idx_study_reviews_card` on `(card_id, reviewed_at DESC)` - Optimizes card history queries
   - `idx_study_reviews_user` on `(user_id, reviewed_at DESC)` - Optimizes user statistics queries

2. **Query Optimization**:
   - Use `SELECT` with specific columns instead of `SELECT *`
   - Leverage database indexes by filtering on indexed columns first
   - Use `LIMIT` clauses to prevent returning excessive data
   - Consider using database views for complex statistics queries

### Weighted Card Selection Algorithm

1. **Challenge**: Pure weight-based ordering always returns the same cards
2. **Solution**: Implement weighted random selection:
   - Fetch top N cards (e.g., 2x card_count) ordered by weight DESC
   - Apply weighted random sampling to select final card_count
   - This provides variety while still prioritizing high-weight cards

3. **Implementation**:
```typescript
// Pseudo-code for weighted random selection
const candidateCards = await fetchTopCards(user_id, card_count * 2);
const selectedCards = weightedRandomSample(candidateCards, card_count);
```

### Caching Strategies

1. **Session Metadata**:
   - Cache session data (session_id, card_ids, started_at) in Redis or in-memory
   - TTL: 24 hours (sessions expire after 1 day)
   - Reduces database load for session validation

2. **User Statistics**:
   - Consider caching statistics for 'all' period (changes infrequently)
   - Invalidate cache on new review submission
   - TTL: 5 minutes for time-based periods (day, week, month)

3. **Average Weight**:
   - Cache average weight per user
   - Invalidate on weight updates
   - Reduces need for AVG() aggregation on every statistics request

### Study Streak Calculation

1. **Challenge**: Calculating consecutive days requires date grouping
2. **Optimization**:
   - Pre-calculate and cache streak value
   - Update streak on each review submission
   - Store `last_review_date` in user profile or cache
   - Compare with current date to determine if streak continues or resets

3. **Algorithm**:
```typescript
// Pseudo-code for streak calculation
if (lastReviewDate === today) {
  // Already reviewed today, streak unchanged
} else if (lastReviewDate === yesterday) {
  // Consecutive day, increment streak
  streak += 1;
} else {
  // Gap in reviews, reset streak
  streak = 1;
}
```

### Transaction Management

1. **Submit Review Endpoint**:
   - Use database transaction for review creation + weight update
   - Ensures atomicity (both operations succeed or both fail)
   - Prevents inconsistent state

2. **Connection Pooling**:
   - Leverage Supabase SDK's built-in connection pooling
   - Configure appropriate pool size based on expected load

### Pagination Considerations

1. **Card History**:
   - Default limit of 20 reviews prevents excessive data transfer
   - Consider implementing cursor-based pagination for large histories
   - Return `has_more` flag to indicate additional data availability

2. **Study Session**:
   - Card count limited to 50 to prevent memory issues
   - Consider streaming cards for very large sessions (future enhancement)

---

## 9. Implementation Steps

### Step 1: Create Study Service

**File**: `src/lib/services/study.service.ts`

1. Create `StudyService` class with Supabase client dependency
2. Implement weight calculation logic:
   - `calculateNewWeight(previousWeight: number, outcome: StudyOutcome): number`
   - Apply formulas: correct (×0.8, min 0.5), incorrect (×1.5, max 5.0), skipped (×1.1, max 5.0)
3. Implement weighted card selection:
   - `selectStudyCards(userId: string, filters: StartStudySessionQuery): Promise<FlashcardEntity[]>`
   - Query with filters, apply weighted random sampling
4. Implement study streak calculation:
   - `calculateStudyStreak(userId: string): Promise<number>`
   - Query reviews grouped by date, find consecutive days
5. Implement statistics aggregation:
   - `getStudyStatistics(userId: string, period: StatisticsPeriod): Promise<StudyStatisticsResponse>`
   - Aggregate reviews, calculate metrics
6. Implement card history retrieval:
   - `getCardHistory(userId: string, cardId: string, limit: number): Promise<CardStudyHistoryResponse>`
   - Query reviews, calculate card-specific metrics

### Step 2: Create Validation Utilities

**File**: `src/lib/utils/validation.ts` (or add to existing validation file)

1. Create UUID validation function:
   - `isValidUUID(value: string): boolean`
2. Create enum validation functions:
   - `isValidStudyOutcome(value: string): value is StudyOutcome`
   - `isValidStatisticsPeriod(value: string): value is StatisticsPeriod`
   - `isValidFlashcardStatus(value: string): value is FlashcardStatus`
3. Create range validation function:
   - `isInRange(value: number, min: number, max: number): boolean`
4. Create tag parsing function:
   - `parseTags(tagsString: string): string[]`

### Step 3: Implement Start Study Session Endpoint

**File**: `src/pages/api/v1/study/session.ts`

1. Set up POST handler with Astro API route
2. Extract and verify authentication token:
   - Use Supabase `getUser()` to get user ID
   - Return 401 if authentication fails
3. Parse and validate query parameters:
   - Extract `card_count`, `tags`, `status` from URL
   - Apply defaults: card_count=20, status='active'
   - Validate ranges and enum values
   - Return 400 for validation errors
4. Call `StudyService.selectStudyCards()`:
   - Pass user ID and validated filters
   - Handle empty result with 404 error
5. Generate session metadata:
   - Create unique `session_id` using `crypto.randomUUID()`
   - Record `started_at` timestamp
6. Transform response:
   - Map `FlashcardEntity[]` to `StudyCardDTO[]`
   - Include only: id, front, tags, current_weight (study_weight)
7. Return 200 OK with `StartStudySessionResponse`

### Step 4: Implement Submit Study Review Endpoint

**File**: `src/pages/api/v1/study/review.ts`

1. Set up POST handler with Astro API route
2. Extract and verify authentication token:
   - Use Supabase `getUser()` to get user ID
   - Return 401 if authentication fails
3. Parse and validate request body:
   - Extract `card_id` and `outcome`
   - Validate UUID format for card_id
   - Validate outcome enum value
   - Return 400 for validation errors
4. Verify card ownership:
   - Query `flashcards` table for card with user_id match
   - Return 404 if not found or doesn't belong to user
5. Calculate new weight:
   - Call `StudyService.calculateNewWeight()`
   - Pass current weight and outcome
6. Execute database transaction:
   - INSERT into `study_reviews` table
   - UPDATE `flashcards` table with new weight
   - Ensure atomicity with transaction
7. Transform response:
   - Map to `SubmitStudyReviewResponse` (exclude user_id)
8. Return 200 OK with review result

### Step 5: Implement Get Study Statistics Endpoint

**File**: `src/pages/api/v1/study/statistics.ts`

1. Set up GET handler with Astro API route
2. Extract and verify authentication token:
   - Use Supabase `getUser()` to get user ID
   - Return 401 if authentication fails
3. Parse and validate query parameters:
   - Extract `period` from URL
   - Apply default: 'all'
   - Validate enum value
   - Return 400 for validation errors
4. Call `StudyService.getStudyStatistics()`:
   - Pass user ID and period
   - Service handles all aggregations and calculations
5. Return 200 OK with `StudyStatisticsResponse`

### Step 6: Implement Get Card Study History Endpoint

**File**: `src/pages/api/v1/study/cards/[card_id]/history.ts`

1. Set up GET handler with Astro API route (dynamic route)
2. Extract and verify authentication token:
   - Use Supabase `getUser()` to get user ID
   - Return 401 if authentication fails
3. Parse and validate parameters:
   - Extract `card_id` from path parameter
   - Extract `limit` from query (default: 20)
   - Validate UUID format and range
   - Return 400 for validation errors
4. Verify card ownership:
   - Query `flashcards` table for card with user_id match
   - Return 404 if not found or doesn't belong to user
5. Call `StudyService.getCardHistory()`:
   - Pass user ID, card ID, and limit
   - Service handles query and aggregations
6. Return 200 OK with `CardStudyHistoryResponse`

### Step 7: Add Error Handling Middleware

**File**: `src/lib/middleware/error-handler.ts` (or add to existing middleware)

1. Create error formatting function:
   - `formatErrorResponse(error: Error, statusCode: number): ErrorResponse`
   - Include error code, message, optional details, and timestamp
2. Create validation error helper:
   - `createValidationError(field: string, message: string, details?: ErrorDetails): ErrorResponse`
3. Wrap all endpoint handlers with try-catch:
   - Catch and format errors consistently
   - Log errors server-side with full details
   - Return sanitized errors to client

### Step 8: Write Unit Tests

**Files**: `src/lib/services/__tests__/study.service.test.ts`, etc.

1. Test weight calculation logic:
   - Test correct outcome (weight decrease)
   - Test incorrect outcome (weight increase)
   - Test skipped outcome (slight increase)
   - Test min/max bounds (0.5 and 5.0)
2. Test validation functions:
   - Test UUID validation with valid/invalid inputs
   - Test enum validation with valid/invalid values
   - Test range validation with boundary cases
3. Test card selection algorithm:
   - Test filtering by status and tags
   - Test weighted random selection
   - Test limit enforcement
4. Test statistics calculations:
   - Test accuracy rate calculation
   - Test time period filtering
   - Test study streak calculation

### Step 9: Write Integration Tests

**Files**: `src/pages/api/v1/study/__tests__/`

1. Test Start Study Session endpoint:
   - Test successful session creation
   - Test with various filters (status, tags, card_count)
   - Test 404 when no cards available
   - Test 401 without authentication
   - Test 400 with invalid parameters
2. Test Submit Study Review endpoint:
   - Test successful review submission
   - Test weight update in database
   - Test 404 for non-existent card
   - Test 404 for card belonging to different user
   - Test 400 with invalid outcome
3. Test Get Study Statistics endpoint:
   - Test statistics for different periods
   - Test accuracy calculations
   - Test with no reviews (empty state)
4. Test Get Card Study History endpoint:
   - Test history retrieval with limit
   - Test aggregations (accuracy, counts)
   - Test 404 for non-existent card

### Step 10: Update API Documentation

**File**: Update existing API documentation

1. Add code examples for each endpoint
2. Document weight calculation algorithm
3. Document weighted selection behavior
4. Add troubleshooting section for common errors
5. Document rate limits (if implemented)

### Step 11: Performance Testing

1. Test card selection with large datasets:
   - Measure query performance with 1000+ cards
   - Verify index usage with EXPLAIN ANALYZE
2. Test statistics calculation with large review history:
   - Measure aggregation performance
   - Consider materialized views if needed
3. Load test endpoints:
   - Simulate concurrent users
   - Identify bottlenecks
   - Optimize as needed

### Step 12: Deploy and Monitor

1. Deploy to staging environment
2. Run smoke tests on all endpoints
3. Monitor error rates and response times
4. Set up alerts for high error rates
5. Deploy to production
6. Monitor initial usage patterns
7. Gather user feedback for future improvements

---

## 10. Additional Considerations

### Future Enhancements

1. **Advanced Spaced Repetition**:
   - Implement SM-2 or Anki algorithm for more sophisticated weight calculations
   - Add interval tracking (next review date)
   - Support custom weight adjustment factors per user

2. **Session Management**:
   - Persist session state to allow resuming interrupted sessions
   - Track session completion rate
   - Add session history endpoint

3. **Analytics**:
   - Add time-of-day analysis (when user studies most)
   - Add difficulty analysis per tag
   - Add learning velocity metrics

4. **Gamification**:
   - Add achievements for study streaks
   - Add daily/weekly goals
   - Add leaderboards (opt-in)

### Monitoring Metrics

1. **Business Metrics**:
   - Average session length (cards reviewed per session)
   - Study frequency (sessions per user per week)
   - Accuracy trends over time
   - Card weight distribution

2. **Technical Metrics**:
   - Endpoint response times (p50, p95, p99)
   - Error rates by endpoint and error type
   - Database query performance
   - Cache hit rates (if caching implemented)

3. **User Engagement**:
   - Daily/weekly active users
   - Study streak distribution
   - Cards reviewed per user
   - Feature adoption rates
