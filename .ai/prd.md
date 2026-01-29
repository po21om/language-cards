# Product Requirements Document (PRD) - Flashcards AI

## 1. Product Overview
**Flashcards AI** is a web-based application designed to help students and language learners accelerate their learning process through spaced repetition. The core value proposition is the use of AI to instantly convert text excerpts (up to ~1,800 characters) into high-quality flashcards, removing the time-consuming friction of manual creation. The application supports a study workflow with a custom weighted repetition algorithm and is designed for desktop web browsers (Chrome & Firefox) with a focus on accessibility and ease of use.

## 2. User Problem
**Core Problem:** Manually creating high-quality flashcards is a tedious and time-consuming process.
**Impact:** This high effort barrier discourages learners from adopting spaced repetition, despite it being a highly effective learning method.
**Solution:** By automating the creation of flashcards from source text, users can focus their energy on studying rather than administration, thereby increasing adherence to their learning goals.

## 3. Functional Requirements

### 3.1 AI Flashcard Generation
- **Input:** Users can paste text up to 1,800 characters (approx. one A4 page).
- **Processing:** System sends text to AI to generate Question/Answer pairs.
- **Workflow:** Generated cards enter a "Review" state (Accept / Refine / Edit / Reject).
- **Feedback:** User actions on AI suggestions are logged to measure acceptance rates.

### 3.2 Manual Card Management
- **Creation:** Users can manually create flashcards with Front and Back text.
- **Organization:** Flat tagging system supporting standard Unicode emojis.
- **Editing:** Full ability to view, edit, and update existing cards.
- **Deletion:** Soft-delete mechanism; cards are excluded from scheduling immediately and permanently purged after 30 days.

### 3.3 Study System
- **Algorithm:** In-house weighted random-without-replacement scheduler.
- **Session:** Users review cards one by one, revealing the answer and providing feedback (e.g., knew it/didn't know it) to update the card's weight.
- **API:** The scheduler is exposed via a versioned API.

### 3.4 User System & Security
- **Authentication:** Login/Password required (Min 8 chars, mix of letters and numbers).
- **No Email Verification:** Simplified signup for MVP (limited release).
- **Data Policy:** User source text is not stored; only generated cards are persisted. Account deletion triggers immediate data purge (flashcards follow retention policy).

### 3.5 Platform & Technical
- **Supported Browsers:** Chrome and Firefox.
- **Localization:** UI supports English and Polish (architecture ready for more).
- **Export:** Users can download their deck in CSV and JSON formats.
- **Demo Content:** New accounts are initialized with an optional demo deck.
- **Accessibility:** WCAG AA Level A compliance (semantic HTML, color contrast, keyboard nav).

### 3.6 Compliance & Data Privacy
- **GDPR:** User and flashcard personal data stored in accordance with GDPR principles.
- **Right to Erasure:** Complete removal of account and associated data upon request (immediate purge).
- **Cookie Notice:** Minimal privacy banner for essential cookies.

## 4. Product Boundaries

### 4.1 Out of Scope (MVP)
- **Advanced Algorithms:** No implementation of complex algorithms like SuperMemo (SM-2) or Anki.
- **File Imports:** No support for uploading PDF, DOCX, or images.
- **Social:** No sharing of decks between users.
- **Integrations:** No connections to other educational platforms (e.g., LMS, Quizlet).
- **Mobile App:** No native mobile application (Responsive Web only).
- **AI Quota:** No strict usage limits for the MVP phase.

### 4.2 Constraints
- **Performance:** Time-To-First-Card (TTFC) must be < 3 minutes.
- **Privacy:** Minimal cookie/analytics banner required; GDPR-friendly retention.
- **Browser Support:** Strictly Chrome and Firefox.

## 5. User Stories

### Authentication & Account
**US-001 - User Login**
- **Description:** As a user, I want to log in with a secure password so that I can access my private flashcards.
- **Acceptance Criteria:**
  - Login form accepts alphanumeric password (min 8 chars, must include letters and numbers).
  - Successful login redirects to the main dashboard.
  - Invalid credentials display a clear error message.
  - Session persists securely.

**US-002 - Account Deletion**
- **Description:** As a user, I want to delete my account so that all my personal data is immediately removed from the system.
- **Acceptance Criteria:**
  - "Delete Account" option is available in user settings.
  - User must confirm the deletion action.
  - Upon confirmation, all user data and flashcards are permanently removed from the database immediately.
  - User is logged out and redirected to the home page.

**US-003 - View Demo Deck**
- **Description:** As a new user, I want to see a pre-loaded demo deck upon first login so that I can understand how the application works.
- **Acceptance Criteria:**
  - New accounts are automatically populated with a "Demo Deck".
  - Demo deck contains example flashcards with tags/emojis.
  - User can interact with (edit/delete/study) these cards immediately.

### Card Generation & Management
**US-004 - Generate from Text**
- **Description:** As a learner, I want to paste a text excerpt so that the AI can generate a list of potential flashcards for me.
- **Acceptance Criteria:**
  - Input field allows pasting text up to 1,800 characters.
  - System validates character limit and prevents submission if exceeded.
  - Clicking "Generate" triggers the API call to the LLM.
  - A loading state is displayed during processing.
  - On success, a list of suggested cards is displayed.

**US-005 - Review AI Suggestions**
- **Description:** As a learner, I want to review AI-generated cards so that only accurate cards are added to my deck.
- **Acceptance Criteria:**
  - Generated cards are displayed in a "Review" list.
  - Each card has "Accept", "Edit", and "Reject" actions.
  - "Accept" adds the card to the permanent deck.
  - "Reject" discards the card.
  - Accepted cards are saved to the database.

**US-006 - Refine AI Card**
- **Description:** As a learner, I want to request the AI to refine a specific card suggestion so that it better matches my preferences.
- **Acceptance Criteria:**
  - User can select a "Refine" option on a generated suggestion.
  - System requests an updated version from the AI.
  - The refined card replaces the original suggestion in the review list.

**US-007 - Manual Creation**
- **Description:** As a learner, I want to manually create a flashcard with tags and emojis so that I can add specific knowledge not found in my texts.
- **Acceptance Criteria:**
  - "Add Card" button opens a creation form.
  - Form includes fields for "Front", "Back", and "Tags".
  - Tags support Unicode emojis.
  - Saving adds the card to the "My Flashcards" list.

**US-008 - Edit Flashcard**
- **Description:** As a user, I want to edit the text or tags of an existing flashcard to correct errors or update information.
- **Acceptance Criteria:**
  - Existing cards in the list have an "Edit" button.
  - Clicking "Edit" opens the card content in an editable form.
  - "Save" updates the card in the database and reflects changes in the UI.

**US-009 - Soft Delete**
- **Description:** As a user, I want to delete a flashcard so it is removed from my study schedule, but kept in a "trash" state for 30 days.
- **Acceptance Criteria:**
  - "Delete" action is available on every card.
  - Deleted cards are immediately removed from the active deck and study schedule.
  - Cards are moved to a "Trash" or "Archived" view.
  - Cards remain in this state for 30 days before permanent purge.

**US-010 - Restore Card**
- **Description:** As a user, I want to restore a soft-deleted card within 30 days so that I can recover accidental deletions.
- **Acceptance Criteria:**
  - User can access the "Trash" view.
  - Deleted cards show a "Restore" option.
  - Restoring moves the card back to the active deck and study schedule.

### Study & Usage
**US-011 - Study Session**
- **Description:** As a learner, I want to start a study session where cards are presented based on a weighted random algorithm so that I can review material effectively.
- **Acceptance Criteria:**
  - "Start Study" button launches the session view.
  - Cards are presented one by one (Front first).
  - "Show Answer" reveals the Back.
  - User provides feedback (e.g., "Correct"/"Incorrect").
  - System updates the card's weight/priority for the next session.

**US-012 - Switch Language**
- **Description:** As a user, I want to toggle the interface between English and Polish so that I can use the app in my preferred language.
- **Acceptance Criteria:**
  - Language toggle is accessible in the UI (e.g., header or settings).
  - Switching immediately translates all UI text strings.
  - Preference is saved for the session.

**US-013 - Export Data**
- **Description:** As a user, I want to download my flashcards as a CSV or JSON file so that I can backup my data or use it elsewhere.
- **Acceptance Criteria:**
  - "Export" option available in settings or dashboard.
  - User can select format (CSV or JSON).
  - Download starts immediately upon selection.
  - Exported file contains all active flashcard data (Front, Back, Tags).

### Accessibility
**US-014 - Screen Reader Support**
- **Description:** As a visually impaired user, I want to navigate the application using a screen reader (WCAG AA Level A) so that I can use the learning tools effectively.
- **Acceptance Criteria:**
  - All interactive elements have appropriate ARIA labels.
  - Application supports full keyboard navigation (Tab focus).
  - Color contrast meets WCAG AA standards.
  - Screen readers correctly announce dynamic content changes (e.g., loading states, new cards).

## 6. Success Metrics
To validate the MVP, we will track the following metrics (measured via client events and rolling averages):

1.  **AI Quality Acceptance:**
    *   **Goal:** 75% of flashcards generated by AI are accepted by the user.
    *   *Measurement:* (Accepted Cards / Total AI Generated Cards) per user.

2.  **AI Usage Adoption:**
    *   **Goal:** Users create 75% of their total flashcards using AI.
    *   *Measurement:* (AI Created Cards / Total Active Cards).

3.  **Performance (Time-to-Value):**
    *   **Goal:** Time-to-First-Card (TTFC) < 3 minutes for new users.
    *   *Measurement:* Time from Signup to first "Accept" or "Save" action.

4.  **Accessibility Compliance:**
    *   **Goal:** Zero accessibility blockers at WCAG AA Level A.
    *   *Measurement:* Automated audit score + manual pass.