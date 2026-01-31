# Authentication Module - Technical Specification

## 1. Overview

This document outlines the technical architecture for implementing user authentication (registration, login, logout, and password recovery) in the Flashcards AI application. The solution is based on the requirements from `prd.md` (US-001, US-002) and the defined technology stack, utilizing Supabase for backend services and Astro with React for the frontend.

## 2. User Interface Architecture

The frontend will be extended with new pages and components to handle authentication flows. The UI will adapt based on the user's authentication state.

### 2.1. New Pages

-   **/login**: Public page containing the login form. It will be the default redirect target for unauthenticated users trying to access protected areas.
-   **/register**: Public page containing the user registration form.
-   **/dashboard**: Protected page, accessible only to authenticated users. This will be the main application view after login.

### 2.2. New React Components

These components will be built using `shadcn/ui` and will manage form state, validation, and interaction with the backend.

-   **LoginForm (`src/components/auth/LoginForm.tsx`)**: 
    -   **Responsibility**: Handles user login.
    -   **Fields**: Email, Password.
    -   **Actions**: Submits credentials to the backend API.
    -   **Validation**: 
        -   Email: Must be a valid format.
        -   Password: Min. 8 characters, including letters and numbers.
    -   **Error Handling**: Displays messages for invalid credentials, server errors, or validation failures.

-   **RegisterForm (`src/components/auth/RegisterForm.tsx`)**:
    -   **Responsibility**: Handles new user registration.
    -   **Fields**: Email, Password, Confirm Password.
    -   **Actions**: Submits data to the backend API.
    -   **Validation**:
        -   Password and Confirm Password must match.
        -   Follows the same password policy as the login form.
    -   **Error Handling**: Displays messages for already existing users, password mismatch, or server errors.


### 2.3. Layouts and State Management

-   **MainLayout (`src/layouts/Layout.astro`)**: 
    -   This layout will be updated to conditionally render UI elements based on authentication status.
    -   **Authenticated State**: Displays user-specific navigation (e.g., "Dashboard", "Logout" button, user avatar/email).
    -   **Unauthenticated State**: Shows "Login" and "Register" buttons.
    -   The user's session will be checked on the server-side within the layout to determine the state.

## 3. Backend Logic

The backend will consist of API endpoints created as Astro API routes. These endpoints will encapsulate the logic for interacting with Supabase Auth.

### 3.1. API Endpoints (Astro API Routes)

-   **`POST /api/auth/login`**:
    -   **Responsibility**: Authenticates a user.
    -   **Input**: `{ email, password }`.
    -   **Logic**: Calls `supabase.auth.signInWithPassword()`. If successful, it sets the session cookie.
    -   **Response (Success)**: `200 OK` with user data.
    -   **Response (Error)**: `401 Unauthorized` for invalid credentials, `500` for server errors.

-   **`POST /api/auth/register`**:
    -   **Responsibility**: Creates a new user account.
    -   **Input**: `{ email, password }`.
    -   **Logic**: Calls `supabase.auth.signUp()`. As per `prd.md`, email verification is not required for the MVP.
    -   **Response (Success)**: `201 Created`.
    -   **Response (Error)**: `409 Conflict` if the user already exists, `400` for invalid input.

-   **`POST /api/auth/logout`**:
    -   **Responsibility**: Logs the user out.
    -   **Logic**: Calls `supabase.auth.signOut()` and clears the session cookie.
    -   **Response (Success)**: `200 OK`.


### 3.2. Data Models & Validation

-   Input validation will be handled within each API route before processing. Libraries like `zod` can be used for schema validation to ensure data integrity.
-   Passwords will be handled securely by Supabase and will not be stored in plain text.

## 4. Authentication System

Supabase Auth will be the core of the authentication system, integrated with Astro's server-side capabilities.

### 4.1. Supabase Integration

-   A Supabase client will be initialized in a server-side module (`src/lib/supabase/server.ts`) using environment variables for the Supabase URL and `service_role` key.
-   This server-side client will be used in API routes and middleware to perform authentication actions.
-   A separate client for the browser (`src/lib/supabase/client.ts`) will be created using the `anon` key for any client-side interactions needed.

### 4.2. Session Management & Route Protection

-   **Middleware (`src/middleware.ts`)**: An Astro middleware will be created to manage sessions and protect routes.
    -   On every request, the middleware will inspect the request cookies for a Supabase session token.
    -   It will use the token to fetch the user's session from Supabase (`supabase.auth.getUser()`).
    -   The user object will be stored in `Astro.locals` to be accessible in all server-side rendered Astro pages and layouts.
    -   **Route Protection**: If a user tries to access a protected route (e.g., `/dashboard`) without a valid session, the middleware will redirect them to `/login`.

### 4.3. Account Deletion (US-002)

-   An API endpoint, e.g., **`DELETE /api/user/account`**, will be created.
-   This endpoint will be protected and can only be called by an authenticated user.
-   **Logic**: It will use the Supabase Admin SDK (or a client with the `service_role` key) to call `supabase.auth.admin.deleteUser(userId)`.
-   This action will permanently delete the user from the `auth.users` table. 
-   **Note**: Per `prd.md` (US-002), all user data must be purged immediately. The database schema must be configured with cascading deletes to ensure that all associated records (e.g., flashcards) are irretrievably removed at the same time the user is deleted from the `auth.users` table.
