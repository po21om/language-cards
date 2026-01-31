# UI Architecture for Flashcards AI

## 1. UI Structure Overview

The UI architecture for Flashcards AI is designed as a desktop-first, responsive web application. It is built on a modern tech stack featuring Astro for the static site structure and React for interactive components (islands of interactivity). The design prioritizes speed, accessibility (WCAG AA Level A), and a streamlined user experience. Styling is managed with Tailwind CSS and the shadcn/ui component library, ensuring a consistent and modern look and feel.

The structure is centered around a main dashboard that provides access to all core features. Modals and dedicated views are used for specific tasks like card creation, studying, and AI generation to maintain context and workflow efficiency.

## 2. View List

### Auth View
-   **View Path:** `/auth`
-   **Main Purpose:** To provide a secure entry point for users to sign up or log in.
-   **Key Information to Display:**
    -   Login form (email, password).
    -   Sign-up form (email, password).
    -   Links to toggle between login and sign-up.
-   **Key View Components:**
    -   `AuthForm`: A component containing input fields for credentials, a submit button, and validation messages.
    -   `LanguageToggle`: Allows users to switch the UI language.
-   **UX, Accessibility, and Security Considerations:**
    -   **UX:** Clear error messages for invalid credentials or password requirement failures. Autofocus on the email field.
    -   **Accessibility:** All form fields have labels. Full keyboard navigation is supported. Error messages are associated with inputs using `aria-describedby`.
    -   **Security:** Forms use POST requests over HTTPS. No sensitive information is stored in the URL. Password fields obscure input.

### Dashboard View
-   **View Path:** `/`
-   **Main Purpose:** To serve as the central hub for users to view, manage, and organize their flashcards.
-   **Key Information to Display:**
    -   A list of all user flashcards.
    -   Tabs to filter cards by status ('Active', 'Review').
    -   Controls for filtering by tags.
    -   A primary call-to-action to start a study session or generate new cards.
-   **Key View Components:**
    -   `FlashcardDataTable`: An infinite-scrolling table displaying flashcards with columns for Front, Back, Tags, and Actions (Edit, Delete).
    -   `FilterControls`: A set of dropdowns or input fields to filter the card list.
    -   `CreateCardModal`: A modal form for manually creating or editing a flashcard.
    -   `PrimaryActions`: Buttons for 'Start Study Session' and 'Generate with AI'.
-   **UX, Accessibility, and Security Considerations:**
    -   **UX:** Infinite scroll for the card list prevents pagination. Editing and creating cards in a modal keeps the user in the main view. A welcome message and demo deck for new users.
    -   **Accessibility:** The data table is navigable with a keyboard. Interactive elements have clear focus states. Tabs are implemented with correct ARIA roles.
    -   **Security:** All data is fetched for the authenticated user only. Actions are authorized via API requests.

### AI Generation View
-   **View Path:** `/generate`
-   **Main Purpose:** To allow users to generate flashcards from a piece of text using AI.
-   **Key Information to Display:**
    -   A large text area for pasting source text.
    -   A list of AI-generated card suggestions for review.
    -   The number of cards generated and character count.
-   **Key View Components:**
    -   `TextInputArea`: A form field for user text input with a character counter.
    -   `ReviewList`: A list of generated cards, each with 'Accept', 'Refine', 'Edit', and 'Reject' buttons.
    -   `BulkActionToolbar`: Buttons to 'Accept All' or 'Reject All' suggestions.
    -   `LoadingIndicator`: Displayed while the AI is processing the text.
-   **UX, Accessibility, and Security Considerations:**
    -   **UX:** A clear loading state during generation. The ability to edit cards inline before accepting. Visual feedback when a card is accepted or rejected.
    -   **Accessibility:** The text area is properly labeled. The review list is keyboard-navigable. ARIA live regions announce the completion of the generation process.
    -   **Security:** User's source text is not stored on the server, as per the PRD.

### Study View
-   **View Path:** `/study`
-   **Main Purpose:** To provide an immersive, distraction-free environment for users to study their flashcards.
-   **Key Information to Display:**
    -   The front of the current flashcard.
    -   The back of the card (revealed on user action).
    -   Session progress (e.g., 'Card 5 of 20').
-   **Key View Components:**
    -   `Flashcard`: A component that displays the card content and can be flipped.
    -   `FeedbackControls`: Buttons for the user to indicate if they knew the answer ('Correct', 'Incorrect').
    -   `ProgressBar`: A visual indicator of the user's progress through the session.
    -   `SessionSummaryModal`: A modal displayed at the end of the session with performance stats.
-   **UX, Accessibility, and Security Considerations:**
    -   **UX:** Keyboard shortcuts for flipping the card and providing feedback (e.g., Spacebar to flip, number keys for feedback). A clean, focused UI.
    -   **Accessibility:** High-contrast text. All actions are keyboard-accessible. Card content is readable by screen readers.
    -   **Security:** The study session is generated and managed server-side to prevent manipulation of the algorithm.

### Settings View
-   **View Path:** `/settings`
-   **Main Purpose:** To allow users to manage their account and application preferences.
-   **Key Information to Display:**
    -   Language preference options.
    -   Data export options (CSV, JSON).
    -   Account deletion section.
-   **Key View Components:**
    -   `LanguageSelector`: A dropdown to switch between English and Polish.
    -   `ExportButtons`: Buttons to trigger the download of user data.
    -   `DeleteAccount`: A section with a button to initiate account deletion, protected by a confirmation modal.
-   **UX, Accessibility, and Security Considerations:**
    -   **UX:** A confirmation dialog for account deletion to prevent accidental data loss.
    -   **Accessibility:** All interactive elements are clearly labeled and keyboard-accessible.
    -   **Security:** Account deletion is a protected action requiring confirmation and a valid session.

### Trash View
-   **View Path:** `/trash`
-   **Main Purpose:** To allow users to manage and restore soft-deleted flashcards.
-   **Key Information to Display:**
    -   A list of soft-deleted cards.
    -   The time remaining until each card is permanently deleted.
-   **Key View Components:**
    -   `TrashDataTable`: A table listing deleted cards with 'Restore' and 'Delete Permanently' actions.
-   **UX, Accessibility, and Security Considerations:**
    -   **UX:** Clear indication of the 30-day retention policy. Confirmation dialogs for permanent deletion.
    -   **Accessibility:** The table is keyboard-navigable, and all actions are clearly labeled.
    -   **Security:** Actions are authorized and operate only on the user's own data.

## 3. User Journey Map

1.  **Onboarding & First Use:**
    -   A new user lands on the `/auth` page and creates an account.
    -   Upon first login, they are redirected to the Dashboard (`/`).
    -   They see a pre-loaded 'Demo Deck' and a welcome message explaining the core features.

2.  **Main Use Case (AI Generation):**
    -   From the Dashboard, the user clicks 'Generate with AI', navigating to `/generate`.
    -   The user pastes a text excerpt into the text area and clicks 'Generate'.
    -   A loading indicator appears. After processing, a list of suggested cards is displayed.
    -   The user reviews the suggestions, accepting, editing, or rejecting them.
    -   Accepted cards are added to their deck and appear under the 'Active' tab on the Dashboard.

3.  **Study Flow:**
    -   From the Dashboard, the user clicks 'Start Study Session', navigating to `/study`.
    -   The study view presents the first card (front side).
    -   The user thinks of the answer, then reveals the back side (e.g., by clicking or pressing Spacebar).
    -   The user provides feedback ('Correct' or 'Incorrect').
    -   The next card is presented. This continues until the session is complete.
    -   A session summary is displayed, and the user is returned to the Dashboard.

4.  **Card Management:**
    -   On the Dashboard, the user can click 'Add Card' to open the `CreateCardModal` and manually create a new flashcard.
    -   The user can click 'Edit' on an existing card to open the same modal to make changes.
    -   The user can click 'Delete' on a card. The card disappears from the active list and is moved to the Trash (`/trash`).
    -   The user can navigate to `/trash` to restore the card or delete it permanently.

## 4. Layout and Navigation Structure

-   **Main Layout:** A persistent sidebar navigation menu provides access to all main views. The main content area updates based on the selected view.
-   **Navigation Menu:**
    -   Dashboard (`/`)
    -   Generate (`/generate`)
    -   Study (`/study`)
    -   Trash (`/trash`)
    -   Settings (`/settings`)
-   **Header:** A simple header contains the application logo, a logout button, and the language toggle.
-   **Protected Routes:** All views except `/auth` are protected. Unauthenticated users attempting to access them will be redirected to the `/auth` page.

## 5. Key Components

-   **`FlashcardDataTable`:** A reusable, accessible data table with features like sorting, filtering, and infinite scroll. Used in the Dashboard and Trash views.
-   **`CreateCardModal`:** A modal form for creating and editing flashcards. It includes fields for front, back, and tags, along with validation.
-   **`LanguageToggle`:** A simple dropdown or button group that allows users to switch the UI language. It updates the application's locale and persists the choice.
-   **`ConfirmationModal`:** A generic modal used to confirm destructive actions like deleting a card or an account. It helps prevent user errors.
-   **`ToastNotification`:** A non-intrusive notification system (e.g., using `react-hot-toast`) to provide feedback for actions like saving a card, API errors, or successful data export.
