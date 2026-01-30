# REST API Plan

## 1. Resources

The API is organized around the following main resources, each corresponding to database entities:

| Resource | Database Table | Description |
|----------|---------------|-------------|
| **Profiles** | `public.profiles` | User preferences and settings |
| **Flashcards** | `public.flashcards` | Core flashcard entities (manual and AI-generated) |
| **AI Generations** | `public.ai_generation_logs` | AI generation request tracking and metrics |
| **Study Reviews** | `public.study_reviews` | Historical study session interactions |
| **Study Sessions** | N/A (computed) | Active study session management (virtual resource) |

---

## 2. Endpoints

### 2.1 Authentication & Authorization

#### 2.1.1 Sign Up
- **HTTP Method:** `POST`
- **URL Path:** `/api/v1/auth/signup`
- **Description:** Create a new user account with email and password
- **Request Payload:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```
- **Response Payload (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2026-01-30T19:14:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": "2026-01-30T20:14:00Z"
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: Invalid email format or password requirements not met (min 8 chars, must include letters and numbers)
  - `409 Conflict`: Email already registered

#### 2.1.2 Sign In
- **HTTP Method:** `POST`
- **URL Path:** `/api/v1/auth/signin`
- **Description:** Authenticate user and obtain session tokens
- **Request Payload:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```
- **Response Payload (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": "2026-01-30T20:14:00Z"
  }
}
```
- **Error Responses:**
  - `401 Unauthorized`: Invalid credentials
  - `400 Bad Request`: Missing required fields

#### 2.1.3 Sign Out
- **HTTP Method:** `POST`
- **URL Path:** `/api/v1/auth/signout`
- **Description:** Invalidate current session
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Response Payload (200 OK):**
```json
{
  "message": "Successfully signed out"
}
```
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token

#### 2.1.4 Refresh Token
- **HTTP Method:** `POST`
- **URL Path:** `/api/v1/auth/refresh`
- **Description:** Obtain new access token using refresh token
- **Request Payload:**
```json
{
  "refresh_token": "refresh_token"
}
```
- **Response Payload (200 OK):**
```json
{
  "access_token": "new_jwt_token",
  "expires_at": "2026-01-30T21:14:00Z"
}
```
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired refresh token

#### 2.1.5 Delete Account
- **HTTP Method:** `DELETE`
- **URL Path:** `/api/v1/auth/account`
- **Description:** Permanently delete user account and all associated data (GDPR compliance)
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Response Payload (200 OK):**
```json
{
  "message": "Account and all associated data permanently deleted"
}
```
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token

---

### 2.2 User Profiles

#### 2.2.1 Get Current User Profile
- **HTTP Method:** `GET`
- **URL Path:** `/api/v1/profile`
- **Description:** Retrieve authenticated user's profile and preferences
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Response Payload (200 OK):**
```json
{
  "id": "uuid",
  "language_preference": "en",
  "is_demo_deck_loaded": true,
  "created_at": "2026-01-30T19:14:00Z",
  "updated_at": "2026-01-30T19:14:00Z"
}
```
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token
  - `404 Not Found`: Profile not found

#### 2.2.2 Update User Profile
- **HTTP Method:** `PATCH`
- **URL Path:** `/api/v1/profile`
- **Description:** Update user preferences
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Request Payload:**
```json
{
  "language_preference": "pl"
}
```
- **Response Payload (200 OK):**
```json
{
  "id": "uuid",
  "language_preference": "pl",
  "is_demo_deck_loaded": true,
  "created_at": "2026-01-30T19:14:00Z",
  "updated_at": "2026-01-30T19:20:00Z"
}
```
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token
  - `400 Bad Request`: Invalid language preference (must be 'en' or 'pl')

---

### 2.3 Flashcards

#### 2.3.1 List Flashcards
- **HTTP Method:** `GET`
- **URL Path:** `/api/v1/flashcards`
- **Description:** Retrieve paginated list of user's flashcards with filtering and sorting
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Query Parameters:**
  - `status` (optional): Filter by status ('review', 'active', 'archived'). Default: all statuses
  - `source` (optional): Filter by source ('manual', 'ai'). Default: all sources
  - `tags` (optional): Comma-separated list of tags to filter by (e.g., '📚,learning')
  - `include_deleted` (optional): Include soft-deleted cards. Default: false
  - `sort` (optional): Sort field ('created_at', 'updated_at'). Default: 'created_at'
  - `order` (optional): Sort order ('asc', 'desc'). Default: 'desc'
  - `limit` (optional): Number of results per page (1-100). Default: 20
  - `offset` (optional): Number of results to skip. Default: 0
- **Response Payload (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "front": "What is spaced repetition?",
      "back": "A learning technique...",
      "tags": ["📚", "learning"],
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
**Note:** `user_id` is not included in responses for security reasons.
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token
  - `400 Bad Request`: Invalid query parameters

#### 2.3.2 Get Single Flashcard
- **HTTP Method:** `GET`
- **URL Path:** `/api/v1/flashcards/{id}`
- **Description:** Retrieve a specific flashcard by ID
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Response Payload (200 OK):**
```json
{
  "id": "uuid",
  "front": "What is spaced repetition?",
  "back": "A learning technique...",
  "tags": ["📚", "learning"],
  "status": "active",
  "source": "manual",
  "study_weight": 1.0,
  "generation_id": null,
  "created_at": "2026-01-30T19:14:00Z",
  "updated_at": "2026-01-30T19:14:00Z",
  "deleted_at": null
}
```
**Note:** `user_id` is not included in responses for security reasons.
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token
  - `404 Not Found`: Flashcard not found or doesn't belong to user

#### 2.3.3 Create Flashcard (Manual)
- **HTTP Method:** `POST`
- **URL Path:** `/api/v1/flashcards`
- **Description:** Manually create a new flashcard
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Request Payload:**
```json
{
  "front": "What is the capital of Poland?",
  "back": "Warsaw",
  "tags": ["🌍", "geography"],
  "status": "active"
}
```
- **Response Payload (201 Created):**
```json
{
  "id": "uuid",
  "front": "What is the capital of Poland?",
  "back": "Warsaw",
  "tags": ["🌍", "geography"],
  "status": "active",
  "source": "manual",
  "study_weight": 1.0,
  "generation_id": null,
  "created_at": "2026-01-30T19:20:00Z",
  "updated_at": "2026-01-30T19:20:00Z",
  "deleted_at": null
}
```
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token
  - `400 Bad Request`: Validation errors (front/back length 1-2000 chars, invalid status)

#### 2.3.4 Update Flashcard
- **HTTP Method:** `PATCH`
- **URL Path:** `/api/v1/flashcards/{id}`
- **Description:** Update an existing flashcard
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Request Payload:**
```json
{
  "front": "Updated question?",
  "back": "Updated answer",
  "tags": ["📚", "updated"],
  "status": "active"
}
```
- **Response Payload (200 OK):**
```json
{
  "id": "uuid",
  "front": "Updated question?",
  "back": "Updated answer",
  "tags": ["📚", "updated"],
  "status": "active",
  "source": "manual",
  "study_weight": 1.0,
  "generation_id": null,
  "created_at": "2026-01-30T19:14:00Z",
  "updated_at": "2026-01-30T19:25:00Z",
  "deleted_at": null
}
```
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token
  - `404 Not Found`: Flashcard not found or doesn't belong to user
  - `400 Bad Request`: Validation errors

#### 2.3.5 Soft Delete Flashcard
- **HTTP Method:** `DELETE`
- **URL Path:** `/api/v1/flashcards/{id}`
- **Description:** Soft delete a flashcard (30-day retention before permanent purge)
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Response Payload (200 OK):**
```json
{
  "id": "uuid",
  "message": "Flashcard soft deleted. Will be permanently removed after 30 days.",
  "deleted_at": "2026-01-30T19:30:00Z"
}
```
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token
  - `404 Not Found`: Flashcard not found or doesn't belong to user

#### 2.3.6 Restore Flashcard
- **HTTP Method:** `POST`
- **URL Path:** `/api/v1/flashcards/{id}/restore`
- **Description:** Restore a soft-deleted flashcard within 30-day window
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Response Payload (200 OK):**
```json
{
  "id": "uuid",
  "front": "Restored question?",
  "back": "Restored answer",
  "tags": ["📚"],
  "status": "active",
  "source": "manual",
  "study_weight": 1.0,
  "generation_id": null,
  "created_at": "2026-01-30T19:14:00Z",
  "updated_at": "2026-01-30T19:35:00Z",
  "deleted_at": null
}
```
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token
  - `404 Not Found`: Flashcard not found, doesn't belong to user, or not soft-deleted
  - `410 Gone`: Flashcard permanently deleted (past 30-day window)

#### 2.3.7 Bulk Delete Flashcards
- **HTTP Method:** `POST`
- **URL Path:** `/api/v1/flashcards/bulk-delete`
- **Description:** Soft delete multiple flashcards at once
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Request Payload:**
```json
{
  "flashcard_ids": ["uuid1", "uuid2", "uuid3"]
}
```
- **Response Payload (200 OK):**
```json
{
  "deleted_count": 3,
  "deleted_ids": ["uuid1", "uuid2", "uuid3"],
  "message": "3 flashcards soft deleted"
}
```
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token
  - `400 Bad Request`: Invalid or empty flashcard_ids array

#### 2.3.8 Export Flashcards
- **HTTP Method:** `GET`
- **URL Path:** `/api/v1/flashcards/export`
- **Description:** Export user's active flashcards in CSV or JSON format
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Query Parameters:**
  - `format` (required): Export format ('csv' or 'json')
  - `status` (optional): Filter by status. Default: 'active'
- **Response Payload (200 OK):**
  - **For JSON format:**
```json
{
  "data": [
    {
      "id": "uuid",
      "front": "Question",
      "back": "Answer",
      "tags": ["📚"],
      "source": "manual",
      "created_at": "2026-01-30T19:14:00Z",
      "updated_at": "2026-01-30T19:14:00Z"
    }
  ],
  "exported_at": "2026-01-30T19:40:00Z",
  "total_cards": 150
}
```
  - **For CSV format:** Returns CSV file with headers: id, front, back, tags, source, created_at, updated_at
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token
  - `400 Bad Request`: Invalid format parameter

---

### 2.4 AI Generation

#### 2.4.1 Generate Flashcards from Text
- **HTTP Method:** `POST`
- **URL Path:** `/api/v1/ai/generate`
- **Description:** Generate flashcard suggestions from input text using AI
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Request Payload:**
```json
{
  "text": "Spaced repetition is a learning technique that involves reviewing information at increasing intervals...",
  "target_count": 5
}
```
- **Response Payload (200 OK):**
```json
{
  "generation_id": "uuid",
  "suggestions": [
    {
      "suggestion_id": "temp_uuid_1",
      "front": "What is spaced repetition?",
      "back": "A learning technique that involves reviewing information at increasing intervals",
      "suggested_tags": ["📚", "learning"]
    },
    {
      "suggestion_id": "temp_uuid_2",
      "front": "Why is spaced repetition effective?",
      "back": "It improves long-term retention by strengthening memory connections",
      "suggested_tags": ["📚", "memory"]
    }
  ],
  "input_length": 150,
  "cards_generated": 2,
  "timestamp": "2026-01-30T19:45:00Z"
}
```
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token
  - `400 Bad Request`: Text exceeds 1800 characters or is empty
  - `503 Service Unavailable`: AI service temporarily unavailable
  - `429 Too Many Requests`: Rate limit exceeded

#### 2.4.2 Refine AI Suggestion
- **HTTP Method:** `POST`
- **URL Path:** `/api/v1/ai/refine`
- **Description:** Request AI to refine a specific card suggestion
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Request Payload:**
```json
{
  "suggestion_id": "temp_uuid_1",
  "front": "What is spaced repetition?",
  "back": "A learning technique that involves reviewing information at increasing intervals",
  "refinement_instruction": "Make the answer more concise"
}
```
- **Response Payload (200 OK):**
```json
{
  "suggestion_id": "temp_uuid_1",
  "front": "What is spaced repetition?",
  "back": "A technique for reviewing information at increasing intervals to improve retention",
  "suggested_tags": ["📚", "learning"]
}
```
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token
  - `400 Bad Request`: Invalid suggestion data
  - `503 Service Unavailable`: AI service temporarily unavailable

#### 2.4.3 Accept AI Suggestions
- **HTTP Method:** `POST`
- **URL Path:** `/api/v1/ai/accept`
- **Description:** Accept AI-generated suggestions and create flashcards
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Request Payload:**
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
- **Response Payload (201 Created):**
```json
{
  "created_cards": [
    {
      "id": "uuid",
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
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token
  - `400 Bad Request`: Invalid generation_id or suggestion data
  - `404 Not Found`: Generation log not found

#### 2.4.4 Get AI Generation History
- **HTTP Method:** `GET`
- **URL Path:** `/api/v1/ai/generations`
- **Description:** Retrieve user's AI generation history with metrics
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Query Parameters:**
  - `limit` (optional): Number of results per page (1-100). Default: 20
  - `offset` (optional): Number of results to skip. Default: 0
- **Response Payload (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
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
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token

---

### 2.5 Study Sessions

#### 2.5.1 Start Study Session
- **HTTP Method:** `POST`
- **URL Path:** `/api/v1/study/session`
- **Description:** Initialize a new study session with weighted card selection
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Query Parameters:**
  - `card_count` (optional): Number of cards to include in session (1-50). Default: 20
  - `tags` (optional): Comma-separated list of tags to filter cards
  - `status` (optional): Filter by status. Default: 'active'
- **Response Payload (200 OK):**
```json
{
  "session_id": "uuid",
  "cards": [
    {
      "id": "uuid",
      "front": "What is spaced repetition?",
      "tags": ["📚", "learning"],
      "current_weight": 1.5
    }
  ],
  "total_cards": 20,
  "started_at": "2026-01-30T20:00:00Z"
}
```
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token
  - `400 Bad Request`: Invalid parameters
  - `404 Not Found`: No cards available for study

#### 2.5.2 Submit Study Review
- **HTTP Method:** `POST`
- **URL Path:** `/api/v1/study/review`
- **Description:** Submit review outcome for a card and update its weight
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Request Payload:**
```json
{
  "card_id": "uuid",
  "outcome": "correct"
}
```
- **Response Payload (200 OK):**
```json
{
  "id": "uuid",
  "card_id": "uuid",
  "outcome": "correct",
  "previous_weight": 1.5,
  "new_weight": 1.2,
  "reviewed_at": "2026-01-30T20:05:00Z"
}
```
**Note:** Uses `id` (not `review_id`) for consistency with other entities. `user_id` is not included in response.
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token
  - `400 Bad Request`: Invalid outcome (must be 'correct', 'incorrect', or 'skipped')
  - `404 Not Found`: Card not found or doesn't belong to user

#### 2.5.3 Get Study Statistics
- **HTTP Method:** `GET`
- **URL Path:** `/api/v1/study/statistics`
- **Description:** Retrieve user's study statistics and analytics
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Query Parameters:**
  - `period` (optional): Time period for statistics ('day', 'week', 'month', 'all'). Default: 'all'
- **Response Payload (200 OK):**
```json
{
  "period": "all",
  "total_reviews": 500,
  "correct_reviews": 375,
  "incorrect_reviews": 100,
  "skipped_reviews": 25,
  "accuracy_rate": 75.0,
  "cards_studied": 150,
  "average_weight": 1.2,
  "study_streak_days": 7,
  "last_study_session": "2026-01-30T20:00:00Z"
}
```
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token
  - `400 Bad Request`: Invalid period parameter

#### 2.5.4 Get Card Study History
- **HTTP Method:** `GET`
- **URL Path:** `/api/v1/study/cards/{card_id}/history`
- **Description:** Retrieve study history for a specific card
- **Request Headers:** `Authorization: Bearer {access_token}`
- **Query Parameters:**
  - `limit` (optional): Number of results (1-100). Default: 20
- **Response Payload (200 OK):**
```json
{
  "card_id": "uuid",
  "reviews": [
    {
      "id": "uuid",
      "card_id": "uuid",
      "outcome": "correct",
      "previous_weight": 1.5,
      "new_weight": 1.2,
      "reviewed_at": "2026-01-30T20:05:00Z"
    }
  ],
  "total_reviews": 15,
  "correct_count": 12,
  "incorrect_count": 3,
  "accuracy_rate": 80.0
}
```
**Note:** `user_id` is not included in review objects for security reasons.
- **Error Responses:**
  - `401 Unauthorized`: Invalid or expired token
  - `404 Not Found`: Card not found or doesn't belong to user

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

The API uses **Supabase Authentication** with JWT (JSON Web Tokens) for session management.

#### Implementation Details:

1. **Token-Based Authentication:**
   - Access tokens (JWT) are issued upon successful login/signup
   - Access tokens are short-lived (1 hour expiration)
   - Refresh tokens are long-lived (30 days) and used to obtain new access tokens
   - Tokens are transmitted via `Authorization: Bearer {token}` header

2. **Password Requirements:**
   - Minimum 8 characters
   - Must contain both letters and numbers
   - Validated on both client and server side

3. **Session Management:**
   - Sessions are managed by Supabase Auth
   - Automatic session refresh using refresh tokens
   - Session invalidation on logout
   - Concurrent session support (multiple devices)

4. **Security Features:**
   - HTTPS required for all API endpoints
   - Tokens stored securely (httpOnly cookies or secure storage)
   - CSRF protection for state-changing operations
   - Rate limiting on authentication endpoints

### 3.2 Authorization Mechanism

The API implements **Row-Level Security (RLS)** through Supabase PostgreSQL policies.

#### Implementation Details:

1. **User Isolation:**
   - All data access is scoped to authenticated user via `auth.uid()`
   - RLS policies automatically filter queries by user_id
   - No cross-user data access possible

2. **Resource Ownership:**
   - Users can only access their own resources (profiles, flashcards, reviews, generations)
   - Enforced at database level through RLS policies
   - API endpoints inherit RLS constraints automatically

3. **Operation Permissions:**
   - **Profiles:** Full CRUD for own profile
   - **Flashcards:** Full CRUD for own flashcards
   - **AI Generations:** Create and read own generation logs, update acceptance metrics
   - **Study Reviews:** Create and read own reviews

4. **Special Cases:**
   - Demo deck creation uses `SECURITY DEFINER` function to bypass RLS during initialization
   - Soft-deleted flashcards remain accessible for 30 days for restoration
   - Export functionality respects RLS and only exports user's own data

### 3.3 Rate Limiting

To ensure fair usage and prevent abuse:

1. **Authentication Endpoints:**
   - 5 requests per minute per IP address
   - 10 failed login attempts trigger temporary account lock (15 minutes)

2. **AI Generation Endpoints:**
   - 10 requests per hour per user (MVP phase, no strict quota)
   - 429 Too Many Requests response when limit exceeded

3. **General API Endpoints:**
   - 100 requests per minute per user
   - Burst allowance of 200 requests

4. **Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706644800
```

---

## 4. Validation and Business Logic

### 4.1 Validation Rules by Resource

#### 4.1.1 Profiles
- **language_preference:**
  - Must be one of: 'en', 'pl'
  - Default: 'en'
  - Validated via database CHECK constraint

#### 4.1.2 Flashcards
- **front:**
  - Required, non-empty
  - Length: 1-2000 characters
  - Validated via database CHECK constraint: `length(front) > 0 AND length(front) <= 2000`

- **back:**
  - Required, non-empty
  - Length: 1-2000 characters
  - Validated via database CHECK constraint: `length(back) > 0 AND length(back) <= 2000`

- **tags:**
  - Array of strings
  - Unicode emoji support
  - Default: empty array `[]`
  - No maximum count enforced (reasonable usage expected)

- **status:**
  - Must be one of: 'review', 'active', 'archived'
  - Default: 'review' for AI-generated, 'active' for manual
  - Validated via database CHECK constraint

- **source:**
  - Must be one of: 'manual', 'ai'
  - Set automatically based on creation method
  - Immutable after creation

- **study_weight:**
  - Must be between 0.5 and 5.0
  - Default: 1.0
  - Validated via database CHECK constraint: `study_weight >= 0.5 AND study_weight <= 5.0`
  - Updated by study algorithm based on review outcomes

#### 4.1.3 AI Generation Logs
- **input_length:**
  - Must be greater than 0 and less than or equal to 1800
  - Validated via database CHECK constraint: `input_length > 0 AND input_length <= 1800`
  - Enforced at API level before AI processing

- **cards_generated:**
  - Must be greater than or equal to 0
  - Validated via database CHECK constraint

- **cards_accepted:**
  - Must be greater than or equal to 0
  - Must be less than or equal to cards_generated
  - Validated via database CHECK constraint: `cards_accepted >= 0 AND cards_accepted <= cards_generated`

- **cards_rejected:**
  - Must be greater than or equal to 0
  - Validated via database CHECK constraint

- **cards_refined:**
  - Must be greater than or equal to 0
  - Validated via database CHECK constraint

#### 4.1.4 Study Reviews
- **outcome:**
  - Must be one of: 'correct', 'incorrect', 'skipped'
  - Validated via database CHECK constraint

- **previous_weight:**
  - Must be between 0.5 and 5.0
  - Validated via database CHECK constraint: `previous_weight >= 0.5 AND previous_weight <= 5.0`

- **new_weight:**
  - Must be between 0.5 and 5.0
  - Validated via database CHECK constraint: `new_weight >= 0.5 AND new_weight <= 5.0`
  - Calculated by study algorithm

### 4.2 Business Logic Implementation

#### 4.2.1 AI Flashcard Generation Workflow
1. **Input Validation:**
   - Validate text length (1-1800 characters)
   - Sanitize input to prevent injection attacks
   - Check user rate limits

2. **AI Processing:**
   - Send text to OpenRouter.ai API
   - Request structured output (question/answer pairs)
   - Handle AI service errors gracefully

3. **Suggestion Creation:**
   - Generate temporary suggestion IDs
   - Store suggestions in memory/cache (not database)
   - Create AI generation log entry with initial metrics

4. **Review Phase:**
   - User reviews each suggestion (Accept/Refine/Reject)
   - Refinement triggers new AI request for specific card
   - Track user actions for metrics

5. **Acceptance Phase:**
   - Create flashcards in database with source='ai'
   - Link cards to generation_id
   - Update generation log with acceptance metrics
   - Set card status based on user preference ('review' or 'active')

#### 4.2.2 Study Algorithm (Weighted Random Selection)
1. **Card Selection:**
   - Query active cards with `status='active'` and `deleted_at IS NULL`
   - Apply tag filters if specified
   - Use weighted random selection: `ORDER BY random() * study_weight DESC`
   - Limit to requested card_count

2. **Weight Adjustment Logic:**
   - **Correct outcome:** Decrease weight (card mastered)
     - `new_weight = max(0.5, previous_weight * 0.8)` (minimum: 0.5)
   - **Incorrect outcome:** Increase weight (needs more practice)
     - `new_weight = min(5.0, previous_weight * 1.5)` (maximum: 5.0)
   - **Skipped outcome:** Slight weight increase (needs attention)
     - `new_weight = min(5.0, previous_weight * 1.1)` (maximum: 5.0)

3. **Review Recording:**
   - Create study_reviews record with outcome and weights
   - Update flashcard.study_weight with new_weight
   - Update flashcard.updated_at timestamp

#### 4.2.3 Soft Delete and Purge
1. **Soft Delete:**
   - Set `deleted_at = NOW()` on flashcard
   - Card immediately excluded from study sessions and listings (unless `include_deleted=true`)
   - Card remains in database for 30 days

2. **Restoration:**
   - Only possible if `deleted_at` is within 30 days
   - Set `deleted_at = NULL`
   - Card returns to active deck

3. **Permanent Purge:**
   - Scheduled job runs daily via pg_cron or Edge Function
   - Deletes flashcards where `deleted_at < NOW() - INTERVAL '30 days'`
   - Cascade deletes associated study_reviews
   - No restoration possible after purge

#### 4.2.4 Demo Deck Initialization
1. **Trigger:** Executed automatically on new user signup via database trigger
2. **Process:**
   - Create profile with `is_demo_deck_loaded = true`
   - Insert 3 pre-defined demo flashcards
   - Cards have `source='manual'`, `status='active'`
   - Demo cards include example tags with emojis

3. **Demo Cards:**
   - Card 1: Explains spaced repetition concept
   - Card 2: Explains flashcard benefits
   - Card 3: Explains AI generation feature

#### 4.2.5 Data Export
1. **CSV Export:**
   - Query active flashcards via `view_flashcards_export`
   - Format as CSV with headers: id, front, back, tags, source, created_at, updated_at
   - Tags array converted to comma-separated string
   - Return as downloadable file

2. **JSON Export:**
   - Query active flashcards via `view_flashcards_export`
   - Return as JSON array with metadata
   - Include export timestamp and total count

#### 4.2.6 Analytics and Metrics
1. **AI Acceptance Rate:**
   - Calculated as: `(cards_accepted / cards_generated) * 100`
   - Aggregated across all user's generation logs
   - Used to measure AI quality (target: 75%)

2. **AI Usage Adoption:**
   - Calculated as: `(AI cards / Total active cards) * 100`
   - Used to measure feature adoption (target: 75%)

3. **Study Statistics:**
   - Accuracy rate: `(correct_reviews / (correct_reviews + incorrect_reviews)) * 100`
   - Study streak: Consecutive days with at least one review
   - Average weight: Mean study_weight across active cards

#### 4.2.7 GDPR Compliance
1. **Account Deletion:**
   - Immediate cascade delete of all user data:
     - Profile
     - Flashcards (including soft-deleted)
     - AI generation logs
     - Study reviews
   - Enforced via `ON DELETE CASCADE` foreign key constraints
   - No data retention after account deletion

2. **Data Minimization:**
   - User input text not stored (only generated cards)
   - No email verification required (MVP)
   - Minimal cookie usage

3. **Right to Export:**
   - Users can export all flashcard data via export endpoints
   - Includes all metadata and timestamps

---

## 5. API Versioning

The API uses URL path versioning with the format `/api/v1/...`

- Current version: **v1**
- Version changes will be communicated via API documentation
- Deprecated endpoints will be supported for minimum 6 months
- Breaking changes will result in new version (v2, v3, etc.)

---

## 6. Error Response Format

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Front text must be between 1 and 2000 characters",
    "details": {
      "field": "front",
      "constraint": "length",
      "min": 1,
      "max": 2000
    }
  },
  "timestamp": "2026-01-30T20:30:00Z"
}
```

### Common Error Codes:
- `UNAUTHORIZED`: Authentication required or invalid token
- `FORBIDDEN`: User lacks permission for resource
- `NOT_FOUND`: Resource does not exist
- `VALIDATION_ERROR`: Request data validation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVICE_UNAVAILABLE`: External service (AI) temporarily unavailable
- `INTERNAL_ERROR`: Unexpected server error

---

## 7. Performance Considerations

### 7.1 Caching Strategy
- User profiles cached for 5 minutes
- Study session card lists cached for session duration
- AI generation suggestions cached for 1 hour

### 7.2 Database Optimization
- All queries leverage existing indexes (see db-plan.md)
- Pagination required for large result sets
- Soft-deleted cards filtered at query level
- RLS policies optimized with composite indexes

### 7.3 Response Times (Target SLAs)
- Authentication endpoints: < 200ms
- CRUD operations: < 300ms
- AI generation: < 5 seconds (depends on AI service)
- Export operations: < 2 seconds for up to 1000 cards
- Study session initialization: < 500ms

---

## 8. Technology Integration

### 8.1 Frontend Integration (Astro + React)
- API client using fetch or axios
- TypeScript interfaces generated from API schemas
- React Query for data fetching and caching
- Optimistic updates for better UX

### 8.2 Backend Integration (Supabase)
- Supabase JavaScript client for authentication
- Direct PostgreSQL queries via Supabase client
- RLS policies enforce authorization automatically
- Real-time subscriptions for live updates (optional)

### 8.3 AI Integration (OpenRouter.ai)
- RESTful API calls to OpenRouter.ai
- Structured prompts for consistent output
- Error handling and retry logic
- Cost tracking via API key limits

### 8.4 Deployment (DigitalOcean + Docker)
- API served via Docker container
- Environment variables for configuration
- Health check endpoint: `GET /api/v1/health`
- Logging and monitoring integration

---

## 9. Future Enhancements (Post-MVP)

The following features are out of scope for MVP but considered for future versions:

1. **Advanced Study Algorithms:**
   - Implement SM-2 or Anki-style algorithms
   - Configurable algorithm parameters per user

2. **Collaborative Features:**
   - Share decks between users
   - Public deck marketplace

3. **File Import:**
   - PDF, DOCX, and image upload
   - OCR for image-based text extraction

4. **Mobile API Endpoints:**
   - Optimized payloads for mobile bandwidth
   - Offline sync capabilities

5. **Advanced Analytics:**
   - Detailed learning curves
   - Predictive retention modeling
   - A/B testing for algorithm optimization

6. **Webhooks:**
   - Study milestone notifications
   - Integration with external systems

7. **GraphQL API:**
   - Alternative to REST for flexible queries
   - Reduced over-fetching for mobile clients
