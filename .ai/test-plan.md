# Test Plan: Language Cards

**1. Key Project Components**
*   **Frontend (Astro + React):**
    *   **Pages:** Hybrid routing with SSG (Welcome) and SSR (Dashboard, Study, Generate).
    *   **Features:** Modularized feature-based architecture (`features/auth`, `dashboard`, `generation`, `study`, `trash`).
    *   **UI Library:** Shadcn/ui (Radix Primitives + Tailwind) ensuring accessibility and consistent design.
    *   **State Management:** React hooks (`useDashboardState`, `useStudySession`) managing local component state and API interactions.
*   **Backend (Astro API Routes):**
    *   **API Layer:** `pages/api/v1/` acts as a Backend-for-Frontend (BFF), securing keys and handling logic before hitting Supabase.
    *   **Middleware:** `src/middleware/index.ts` manages Supabase session/cookie hydration.
*   **Data & Services:**
    *   **Service Layer:** `lib/services/` encapsulates business logic (Study algorithms, AI integration, Auth wrapper).
    *   **Supabase:** Handles Auth, DB (Postgres), and RLS.
    *   **AI Integration:** `OpenRouterService` abstracts LLM calls; `RateLimiter` prevents abuse.

**2. Technology Stack & Testing Strategy**
*   **Astro (SSR/SSG):** Requires testing hydration boundaries. E2E tests are crucial to verify that React islands load correctly within Astro static markup.
*   **React 19:** Allows for robust Component Testing (Vitest/React Testing Library) focusing on interactions (forms, flip cards).
*   **Supabase:** Integration tests need to mock the Supabase client or use a local Dockerized Supabase instance to verify RLS policies and DB triggers without polluting production.
*   **OpenRouter AI:** Test strategy must heavily rely on mocking (`MockAIGenerationService`) to avoid costs and non-deterministic results during CI, with limited "live" smoke tests.
*   **Tailwind v4:** Visual regression testing is recommended to ensure class-based styling doesn't break across viewports.

**3. Testing Priorities**
1.  **Core Study Loop (High):** The `StudyService` weight calculation and session logic. If this fails, the app loses its value.
2.  **AI Generation (High):** The primary differentiator. Focus on the integration with OpenRouter, parsing logic, and rate limiting.
3.  **Data Integrity (Medium):** CRUD operations, specifically Soft Delete vs. Restore vs. Hard Delete flows (`features/trash`).
4.  **Authentication (Medium):** Standard flows are handled by Supabase, but the Astro Middleware cookie syncing is a critical custom implementation.

**4. Risk Areas**
*   **AI Rate Limiting & Cost:** The `rate-limiter.ts` uses in-memory storage (`Map`). If the app scales to multiple serverless instances/containers, this state won't be shared, leading to rate limit bypass.
*   **Cookie/Session Management:** Astro Middleware bridging Supabase auth tokens can be flaky if not tested against token expiration and refresh scenarios.
*   **Study Algorithm:** The `calculateNewWeight` logic is hardcoded. Ensure "Easy/Hard" logic actually affects sorting order in `selectStudyCards`.
*   **Database Constraints:** Dependency on Supabase types. Any schema change requires regeneration of `database.types.ts` to prevent TS build errors.
</project_analysis>

# Test Plan: Language Cards (Astro/React/Supabase)

## 1. Introduction
This document outlines the test strategy for the **Language Cards** application. This project is a modern flashcard learning platform leveraging AI for content generation and spaced repetition for study sessions. The goal of this plan is to ensure the reliability of the core learning loop, the stability of the AI integration, and data integrity across the Astro/React frontend and Supabase backend.

## 2. Scope of Testing

### 2.1 In Scope
*   **Functional Testing:** All user flows (Auth, Dashboard, Generation, Study, Settings).
*   **API Testing:** Validation of all V1 endpoints (`pages/api/v1/*`).
*   **Integration Testing:** Interaction between Astro BFF and Supabase/OpenRouter.
*   **Unit Testing:** Business logic services (`study.service.ts`, `rate-limiter.ts`).
*   **UI/UX Testing:** Responsiveness and hydration of React islands within Astro.

### 2.2 Out of Scope
*   **Supabase Internal Stability:** We assume Supabase services (Auth, DB uptime) are functioning; we verify our *integration* with them.
*   **LLM Quality:** We verify that the AI returns *valid JSON* and respects prompts, but we do not qualitatively grade the "creativity" of the GPT-4 response.

## 3. Test Strategy & Types

### 3.1 Unit Testing (Frontend & Logic)
*   **Focus:** Pure functions, Service classes, and utility helpers.
*   **Tools:** Vitest.
*   **Key Targets:**
    *   `src/lib/services/study.service.ts`: Verify `calculateNewWeight` logic (e.g., "incorrect" should increase weight).
    *   `src/lib/utils/rate-limiter.ts`: Verify window reset and limit enforcement.
    *   `src/lib/validators/*.ts`: Verify Zod schemas reject invalid payloads.

### 3.2 Component Testing
*   **Focus:** React components in isolation.
*   **Tools:** Vitest + React Testing Library.
*   **Key Targets:**
    *   `Flashcard.tsx`: Verify flip animation and content rendering.
    *   `AuthForm.tsx`: Verify form validation logic (password strength, email format).
    *   `ReviewList.tsx`: Verify "Accept/Reject" state changes.

### 3.3 Integration API Testing
*   **Focus:** Astro API Routes acting as a bridge to Supabase.
*   **Tools:** Vitest (with mocked Supabase client) or Postman/Newman.
*   **Key Targets:**
    *   `/api/v1/study/session`: Ensure weighted random sampling returns correct cards.
    *   `/api/v1/flashcards/[id]/restore`: Verify soft-delete restoration logic.

### 3.4 End-to-End (E2E) Testing
*   **Focus:** Critical user journeys simulating a real browser.
*   **Tools:** Playwright.
*   **Key Targets:**
    *   Full flow: Login $\rightarrow$ Generate Cards (Mock AI) $\rightarrow$ Study Session $\rightarrow$ Verify Progress.

## 4. Test Scenarios

### 4.1 Feature: Authentication & Middleware
*   **Objective:** Ensure secure access and session persistence.
*   **Risk:** Astro Middleware failing to sync Supabase cookies.

| ID | Scenario | Pre-condition | Expected Result |
|----|----------|---------------|-----------------|
| AUTH-01 | Sign Up & Redirect | New User | User created in Supabase, cookies set, redirect to Dashboard. |
| AUTH-02 | Protected Route Access | Unauthenticated | Accessing `/dashboard` redirects to `/auth`. |
| AUTH-03 | Middleware Token Refresh | Expired Access Token, Valid Refresh Token | Middleware regenerates Access Token transparently; request succeeds. |
| AUTH-04 | Account Deletion | Authenticated | User and all related data (cards, logs) removed; redirect to home. |

### 4.2 Feature: AI Generation (OpenRouter)
*   **Objective:** Verify content generation and parsing.
*   **Risk:** API costs and Rate Limiting abuse.

| ID | Scenario | Pre-condition | Expected Result |
|----|----------|---------------|-----------------|
| GEN-01 | Generate Cards (Mock) | Auth User, Text Input | Returns valid JSON suggestions; UI updates to "Reviewing". |
| GEN-02 | Rate Limit Enforcement | User hit limit (e.g., >10 req/hr) | API returns 429; UI shows "Try again in X seconds". |
| GEN-03 | Input Sanitization | Text > 1800 chars | Frontend prevents submission OR Backend truncates/rejects. |
| GEN-04 | Bulk Accept | 5 generated suggestions | All 5 cards persisted to DB; Generation Log updated with counts. |

### 4.3 Feature: Dashboard & Flashcard Management
*   **Objective:** CRUD operations and Soft Delete logic.

| ID | Scenario | Pre-condition | Expected Result |
|----|----------|---------------|-----------------|
| DASH-01 | Create Manual Card | Auth User | Card appears in "Active" tab immediately. |
| DASH-02 | Soft Delete | Active Card | Card moves to "Trash" view; `deleted_at` timestamp set in DB. |
| DASH-03 | Restore Card | Card in Trash | Card moves back to "Active"; `deleted_at` is null. |
| DASH-04 | Permanent Delete | Card in Trash | Card removed from DB permanently. |

### 4.4 Feature: Study Session (Spaced Repetition)
*   **Objective:** Validate the learning algorithm.
*   **Risk:** Algorithm logic (`study.service.ts`) not updating weights correctly.

| ID | Scenario | Pre-condition | Expected Result |
|----|----------|---------------|-----------------|
| STUDY-01 | Start Session | Cards exist | Session initialized with weighted random selection of cards. |
| STUDY-02 | Mark Incorrect | Reviewing Card X (Weight 1.0) | Weight increases (e.g., to ~1.5); DB updated. |
| STUDY-03 | Mark Correct | Reviewing Card Y (Weight 5.0) | Weight decreases (e.g., to ~4.0); DB updated. |
| STUDY-04 | Session Summary | Session Finished | Modal shows correct accuracy stats (Correct vs Incorrect). |

## 5. Test Environment

### 5.1 Local (Dev)
*   **Database:** Local Supabase Docker instance or Staging Project.
*   **AI:** `MockAIGenerationService` enabled (`USE_MOCK_AI=true`).
*   **Data:** Seed data with ~50 flashcards.

### 5.2 CI/CD Pipeline (GitHub Actions)
*   **Trigger:** Pull Request.
*   **Actions:** Lint (ESLint), Type Check (TSC), Unit Tests (Vitest), Build (Astro build).
*   **Integration:** Playwright tests running against a preview build with mocked API services.

## 6. Testing Tools Configuration

*   **Vitest:** Configured with `jsdom` for React component testing.
*   **Playwright:** Configured to save storage state (cookies) to speed up auth testing.
*   **Mock Service:** Explicitly use `src/lib/services/ai-generation-mock.service.ts` during automated tests to avoid OpenRouter bills.

## 7. Schedule

1.  **Phase 1 (Unit/Service Tests):** Immediate. Cover `study.service.ts`, `rate-limiter.ts`, and Zod validators.
2.  **Phase 2 (Integration/API):** Following Phase 1. Verify `api/v1` endpoints interacting with a test Supabase instance.
3.  **Phase 3 (UI/E2E):** Final phase. Focus on the "Happy Path" of Generating -> Studying.

## 8. Test Acceptance Criteria (Exit Criteria)

*   **Code Coverage:** > 80% on Service files (`lib/services`).
*   **Performance:**
    *   Dashboard load time < 1.5s (LCP).
    *   API response time (excluding AI generation) < 200ms.
*   **Functional:**
    *   0 Critical/Blocker bugs.
    *   Auth flow (Sign in/out/refresh) works 100% of the time.
    *   Study algorithm correctly modifies card weights in the DB.

## 9. Roles and Responsibilities

*   **QA Engineer:** Design test plan, write Playwright E2E scenarios, perform manual exploratory testing on "Edge Case" AI prompts.
*   **Developer:** Write Unit tests for Services and Component tests for React UI during development.
*   **DevOps:** Maintain CI/CD pipeline ensuring tests run on every commit.

## 10. Bug Reporting Procedure

Issues should be reported in the repository Issue Tracker with the following template:
1.  **Title:** [Component] Short description (e.g., "[Study] Weights not updating on 'Correct' click")
2.  **Environment:** Browser/OS, Local/Prod.
3.  **Severity:** Critical/High/Medium/Low.
4.  **Steps to Reproduce:**
    1. Start study session.
    2. Flip card.
    3. Click "Correct".
5.  **Expected vs Actual Result.**
6.  **Logs/Screenshots:** Include Console logs or Network tab response.