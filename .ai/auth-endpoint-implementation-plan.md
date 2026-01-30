# API Endpoint Implementation Plan: Authentication Endpoints

## 1. Endpoint Overview

This plan covers the implementation of five authentication endpoints that handle the complete user lifecycle:

- **Sign Up**: Create new user accounts with email/password authentication
- **Sign In**: Authenticate existing users and issue session tokens
- **Sign Out**: Invalidate active user sessions
- **Refresh Token**: Obtain new access tokens using refresh tokens
- **Delete Account**: Permanently delete user accounts and all associated data (GDPR compliance)

All endpoints use Supabase Auth for authentication management, with automatic profile creation on signup and cascade deletion on account removal.

---

## 2. Request Details

### 2.1 Sign Up

- **HTTP Method**: `POST`
- **URL Path**: `/api/v1/auth/signup`
- **Authentication**: None (public endpoint)
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
```typescript
{
  email: string;      // Valid email format
  password: string;   // Min 8 chars, must include letters and numbers
}
```

### 2.2 Sign In

- **HTTP Method**: `POST`
- **URL Path**: `/api/v1/auth/signin`
- **Authentication**: None (public endpoint)
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
```typescript
{
  email: string;
  password: string;
}
```

### 2.3 Sign Out

- **HTTP Method**: `POST`
- **URL Path**: `/api/v1/auth/signout`
- **Authentication**: Required
- **Request Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer {access_token}`
- **Request Body**: None

### 2.4 Refresh Token

- **HTTP Method**: `POST`
- **URL Path**: `/api/v1/auth/refresh`
- **Authentication**: None (uses refresh token)
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
```typescript
{
  refresh_token: string;
}
```

### 2.5 Delete Account

- **HTTP Method**: `DELETE`
- **URL Path**: `/api/v1/auth/account`
- **Authentication**: Required
- **Request Headers**: `Authorization: Bearer {access_token}`
- **Request Body**: None

---

## 3. Used Types

All types are defined in `src/types.ts`:

### Request DTOs
- `AuthSignUpRequest` - Sign up payload
- `AuthSignInRequest` - Sign in payload
- `AuthRefreshRequest` - Refresh token payload

### Response DTOs
- `AuthSignUpResponse` - Sign up response with user and session
- `AuthSignInResponse` - Sign in response with user and session
- `AuthSignOutResponse` - Sign out confirmation
- `AuthRefreshResponse` - New access token
- `DeleteAccountResponse` - Account deletion confirmation

### Supporting Types
- `AuthUser` - User information in auth responses
- `SessionInfo` - Session token details (access_token, refresh_token, expires_at)
- `ErrorResponse` - Standard error format
- `ErrorObject` - Error details structure

### Validation Schemas (to be created)
Zod schemas for input validation:
- `SignUpSchema` - Validates email format and password requirements
- `SignInSchema` - Validates required fields
- `RefreshTokenSchema` - Validates refresh token presence

---

## 4. Response Details

### 4.1 Sign Up

**Success (201 Created)**:
```typescript
{
  user: {
    id: string;           // UUID
    email: string;
    created_at: string;   // ISO 8601 timestamp
  },
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: string;   // ISO 8601 timestamp
  }
}
```

**Errors**:
- `400 Bad Request`: Invalid email format or password requirements not met
- `409 Conflict`: Email already registered
- `500 Internal Server Error`: Database or Supabase error

### 4.2 Sign In

**Success (200 OK)**:
```typescript
{
  user: {
    id: string;
    email: string;
  },
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: string;
  }
}
```

**Errors**:
- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: Invalid credentials
- `500 Internal Server Error`: Database or Supabase error

### 4.3 Sign Out

**Success (200 OK)**:
```typescript
{
  message: "Successfully signed out"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or expired token
- `500 Internal Server Error`: Supabase error

### 4.4 Refresh Token

**Success (200 OK)**:
```typescript
{
  access_token: string;
  expires_at: string;
}
```

**Errors**:
- `401 Unauthorized`: Invalid or expired refresh token
- `500 Internal Server Error`: Supabase error

### 4.5 Delete Account

**Success (200 OK)**:
```typescript
{
  message: "Account and all associated data permanently deleted"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or expired token
- `500 Internal Server Error`: Database error, cascade delete failure

---

## 5. Data Flow

### 5.1 Sign Up Flow

1. **Request Reception**: API endpoint receives email and password
2. **Input Validation**: Zod schema validates email format and password requirements
3. **Service Call**: `authService.signUp()` is invoked
4. **Supabase Auth**: Create user in `auth.users` table
5. **Profile Creation**: Automatically create profile in `public.profiles` via database trigger or service logic
6. **Session Generation**: Supabase returns access and refresh tokens
7. **Response**: Return user info and session tokens

### 5.2 Sign In Flow

1. **Request Reception**: API endpoint receives email and password
2. **Input Validation**: Zod schema validates required fields
3. **Service Call**: `authService.signIn()` is invoked
4. **Supabase Auth**: Verify credentials against `auth.users`
5. **Session Generation**: Supabase creates new session and returns tokens
6. **Response**: Return user info and session tokens

### 5.3 Sign Out Flow

1. **Request Reception**: API endpoint receives Authorization header
2. **Token Extraction**: Extract Bearer token from header
3. **Service Call**: `authService.signOut()` is invoked
4. **Supabase Auth**: Invalidate session in Supabase
5. **Response**: Return success message

### 5.4 Refresh Token Flow

1. **Request Reception**: API endpoint receives refresh token
2. **Input Validation**: Zod schema validates refresh token presence
3. **Service Call**: `authService.refreshToken()` is invoked
4. **Supabase Auth**: Validate refresh token and generate new access token
5. **Response**: Return new access token and expiration

### 5.5 Delete Account Flow

1. **Request Reception**: API endpoint receives Authorization header
2. **Token Extraction**: Extract Bearer token and get user ID
3. **Service Call**: `authService.deleteAccount()` is invoked
4. **Database Cascade**: Delete user from `auth.users`
   - Automatically deletes `public.profiles` (CASCADE)
   - Automatically deletes `public.flashcards` (CASCADE)
   - Automatically deletes `public.ai_generation_logs` (CASCADE)
   - Automatically deletes `public.study_reviews` (CASCADE)
5. **Response**: Return success message

---

## 6. Security Considerations

### 6.1 Password Security

- **Hashing**: Supabase Auth automatically handles password hashing with bcrypt
- **Requirements**: Enforce minimum 8 characters with letters and numbers
- **Storage**: Passwords never stored in plain text or logged
- **Transmission**: Always use HTTPS in production

### 6.2 Token Security

- **JWT Tokens**: Access tokens are signed JWTs with expiration
- **Refresh Tokens**: Long-lived tokens for obtaining new access tokens
- **Token Rotation**: Consider implementing refresh token rotation for enhanced security
- **Expiration**: Access tokens expire after 1 hour (configurable in Supabase)
- **Storage**: Tokens should be stored securely on client (httpOnly cookies recommended)

### 6.3 Authentication Flow

- **Bearer Token**: Use Authorization header with Bearer scheme
- **Token Validation**: Supabase middleware validates tokens on protected routes
- **Session Management**: Supabase handles session state and invalidation

### 6.4 Account Enumeration Prevention

- **Sign Up**: Return 409 Conflict for existing emails (acceptable for UX)
- **Sign In**: Return generic 401 for invalid credentials (don't reveal if email exists)
- **Rate Limiting**: Implement rate limiting to prevent brute force attacks (future consideration)

### 6.5 GDPR Compliance

- **Right to Deletion**: Delete account endpoint permanently removes all user data
- **Cascade Deletes**: Database foreign keys ensure complete data removal
- **Audit Trail**: Consider logging deletion requests for compliance (optional)

### 6.6 Input Validation

- **Email Validation**: Use Zod email validator to prevent injection
- **Password Validation**: Regex pattern to enforce complexity
- **SQL Injection**: Supabase client uses parameterized queries
- **XSS Prevention**: Not applicable for JSON API responses

---

## 7. Error Handling

### 7.1 Validation Errors (400 Bad Request)

**Scenarios**:
- Invalid email format
- Password too short (< 8 characters)
- Password missing letters or numbers
- Missing required fields

**Response Format**:
```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input data",
    details: {
      field: "password",
      constraint: "min_length",
      min: 8
    }
  },
  timestamp: "2026-01-30T19:14:00Z"
}
```

### 7.2 Authentication Errors (401 Unauthorized)

**Scenarios**:
- Invalid credentials (sign in)
- Invalid or expired access token (sign out, delete account)
- Invalid or expired refresh token (refresh)

**Response Format**:
```typescript
{
  error: {
    code: "UNAUTHORIZED",
    message: "Invalid or expired token"
  },
  timestamp: "2026-01-30T19:14:00Z"
}
```

### 7.3 Conflict Errors (409 Conflict)

**Scenarios**:
- Email already registered (sign up)

**Response Format**:
```typescript
{
  error: {
    code: "CONFLICT",
    message: "Email already registered"
  },
  timestamp: "2026-01-30T19:14:00Z"
}
```

### 7.4 Server Errors (500 Internal Server Error)

**Scenarios**:
- Database connection failure
- Supabase service unavailable
- Cascade delete failure
- Unexpected errors

**Response Format**:
```typescript
{
  error: {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred"
  },
  timestamp: "2026-01-30T19:14:00Z"
}
```

**Error Logging**:
- Log full error details to console/monitoring system
- Never expose internal error details to client
- Include request ID for tracing (if available)

---

## 8. Performance Considerations

### 8.1 Database Operations

- **Profile Creation**: Use database trigger for automatic profile creation on user signup (reduces round trips)
- **Cascade Deletes**: Database handles cascade deletes efficiently with foreign key constraints
- **Indexes**: Ensure `auth.users` has index on email for fast lookups (Supabase default)

### 8.2 Token Operations

- **Token Validation**: Supabase handles JWT validation efficiently
- **Session Storage**: Supabase manages session state in database
- **Caching**: Consider caching user sessions for frequently accessed data (future optimization)

### 8.3 Rate Limiting

- **Brute Force Protection**: Implement rate limiting on sign in endpoint (future consideration)
- **API Abuse Prevention**: Rate limit all auth endpoints to prevent abuse
- **Implementation**: Use Astro middleware or Supabase Edge Functions

### 8.4 Response Times

- **Target**: < 200ms for sign in/sign up under normal load
- **Monitoring**: Track response times and error rates
- **Optimization**: Use connection pooling for database (Supabase default)

---

## 9. Implementation Steps

### Step 1: Create Validation Schemas

**File**: `src/lib/validation/auth.validation.ts`

Create Zod schemas for input validation:

```typescript
import { z } from 'zod';

export const SignUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain letters')
    .regex(/[0-9]/, 'Password must contain numbers'),
});

export const SignInSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});
```

### Step 2: Create Auth Service

**File**: `src/lib/services/auth.service.ts`

Implement authentication service with methods:

```typescript
import type { SupabaseClient } from '../db/supabase.client';
import type {
  AuthSignUpResponse,
  AuthSignInResponse,
  AuthRefreshResponse,
} from '../../types';

export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  async signUp(email: string, password: string): Promise<AuthSignUpResponse> {
    // 1. Create user with Supabase Auth
    // 2. Handle profile creation (trigger or manual)
    // 3. Return user and session data
  }

  async signIn(email: string, password: string): Promise<AuthSignInResponse> {
    // 1. Authenticate with Supabase Auth
    // 2. Return user and session data
  }

  async signOut(accessToken: string): Promise<void> {
    // 1. Invalidate session in Supabase
  }

  async refreshToken(refreshToken: string): Promise<AuthRefreshResponse> {
    // 1. Validate refresh token
    // 2. Generate new access token
    // 3. Return new token and expiration
  }

  async deleteAccount(userId: string): Promise<void> {
    // 1. Delete user from auth.users
    // 2. Cascade deletes handle related data
  }
}
```

**Key Implementation Details**:
- Use `supabase.auth.signUp()` for user creation
- Use `supabase.auth.signInWithPassword()` for authentication
- Use `supabase.auth.signOut()` for session invalidation
- Use `supabase.auth.refreshSession()` for token refresh
- Use `supabase.auth.admin.deleteUser()` for account deletion
- Handle Supabase errors and map to appropriate HTTP status codes
- Ensure profile creation on signup (check if trigger exists or create manually)

### Step 3: Create API Route - Sign Up

**File**: `src/pages/api/v1/auth/signup.ts`

```typescript
import type { APIRoute } from 'astro';
import { SignUpSchema } from '../../../../lib/validation/auth.validation';
import { AuthService } from '../../../../lib/services/auth.service';
import type { AuthSignUpRequest, AuthSignUpResponse, ErrorResponse } from '../../../../types';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse request body
    const body: AuthSignUpRequest = await request.json();

    // 2. Validate input
    const validationResult = SignUpSchema.safeParse(body);
    if (!validationResult.success) {
      // Return 400 with validation errors
    }

    // 3. Call service
    const authService = new AuthService(locals.supabase);
    const result = await authService.signUp(body.email, body.password);

    // 4. Return 201 with user and session
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Handle errors: 409 for existing email, 500 for others
  }
};
```

### Step 4: Create API Route - Sign In

**File**: `src/pages/api/v1/auth/signin.ts`

Similar structure to Sign Up:
- Validate with `SignInSchema`
- Call `authService.signIn()`
- Return 200 with user and session
- Handle 400 and 401 errors

### Step 5: Create API Route - Sign Out

**File**: `src/pages/api/v1/auth/signout.ts`

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Extract Bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Return 401
    }

    // 2. Call service
    const authService = new AuthService(locals.supabase);
    await authService.signOut(authHeader.substring(7));

    // 3. Return 200 with success message
    return new Response(
      JSON.stringify({ message: 'Successfully signed out' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Handle 401 and 500 errors
  }
};
```

### Step 6: Create API Route - Refresh Token

**File**: `src/pages/api/v1/auth/refresh.ts`

- Validate with `RefreshTokenSchema`
- Call `authService.refreshToken()`
- Return 200 with new access token
- Handle 401 and 500 errors

### Step 7: Create API Route - Delete Account

**File**: `src/pages/api/v1/auth/account.ts`

```typescript
export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Get authenticated user from locals (set by middleware)
    const { data: { user }, error } = await locals.supabase.auth.getUser();
    if (error || !user) {
      // Return 401
    }

    // 2. Call service
    const authService = new AuthService(locals.supabase);
    await authService.deleteAccount(user.id);

    // 3. Return 200 with success message
    return new Response(
      JSON.stringify({ message: 'Account and all associated data permanently deleted' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Handle 401 and 500 errors
  }
};
```

### Step 8: Implement Error Handling Utility

**File**: `src/lib/utils/error-handler.ts`

Create utility functions for consistent error responses:

```typescript
import type { ErrorResponse } from '../../types';

export function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): Response {
  const errorResponse: ErrorResponse = {
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function handleSupabaseError(error: unknown): Response {
  // Map Supabase errors to appropriate HTTP responses
  // Log error details for monitoring
}
```

### Step 9: Update Middleware (if needed)

**File**: `src/middleware/index.ts`

Ensure middleware:
- Initializes Supabase client in `locals.supabase`
- Handles token validation for protected routes
- Sets user context in `locals.user` for authenticated requests

### Step 10: Create Database Trigger for Profile Creation

**File**: `supabase/migrations/YYYYMMDDHHMMSS_create_profile_trigger.sql`

If not already exists, create trigger to automatically create profile on user signup:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, language_preference, is_demo_deck_loaded)
  VALUES (NEW.id, 'en', false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Step 11: Testing

Create test cases for each endpoint:

1. **Sign Up Tests**:
   - Valid email and password → 201
   - Invalid email format → 400
   - Weak password → 400
   - Existing email → 409
   - Profile created automatically

2. **Sign In Tests**:
   - Valid credentials → 200
   - Invalid credentials → 401
   - Missing fields → 400

3. **Sign Out Tests**:
   - Valid token → 200
   - Invalid token → 401
   - Missing token → 401

4. **Refresh Token Tests**:
   - Valid refresh token → 200
   - Invalid refresh token → 401
   - Expired refresh token → 401

5. **Delete Account Tests**:
   - Valid token → 200
   - All related data deleted (verify cascade)
   - Invalid token → 401

### Step 12: Documentation

Update API documentation with:
- Endpoint URLs and methods
- Request/response examples
- Error codes and messages
- Authentication requirements
- Rate limiting information (when implemented)

---

## 10. Additional Considerations

### 10.1 Profile Creation Strategy

**Option A: Database Trigger** (Recommended)
- Automatic profile creation on user signup
- No additional service logic needed
- Ensures consistency

**Option B: Service Logic**
- Create profile in `signUp()` method
- More control over profile initialization
- Can set custom default values

### 10.2 Future Enhancements

- **Rate Limiting**: Implement rate limiting on all auth endpoints
- **Email Verification**: Add email verification flow
- **Password Reset**: Implement password reset functionality
- **Multi-Factor Authentication**: Add MFA support
- **OAuth Providers**: Support social login (Google, GitHub, etc.)
- **Session Management**: Add endpoint to list/revoke active sessions
- **Audit Logging**: Log authentication events for security monitoring

### 10.3 Monitoring and Observability

- Track authentication success/failure rates
- Monitor token refresh patterns
- Alert on unusual account deletion spikes
- Log failed authentication attempts for security analysis

---

## 11. Checklist

- [ ] Create validation schemas (`auth.validation.ts`)
- [ ] Implement auth service (`auth.service.ts`)
- [ ] Create sign up endpoint (`/api/v1/auth/signup.ts`)
- [ ] Create sign in endpoint (`/api/v1/auth/signin.ts`)
- [ ] Create sign out endpoint (`/api/v1/auth/signout.ts`)
- [ ] Create refresh token endpoint (`/api/v1/auth/refresh.ts`)
- [ ] Create delete account endpoint (`/api/v1/auth/account.ts`)
- [ ] Implement error handling utility (`error-handler.ts`)
- [ ] Create/verify profile creation trigger
- [ ] Update middleware for auth context
- [ ] Write unit tests for service methods
- [ ] Write integration tests for endpoints
- [ ] Update API documentation
- [ ] Test GDPR compliance (cascade deletes)
- [ ] Verify security measures (token validation, etc.)
