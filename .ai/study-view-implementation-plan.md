# View Implementation Plan: Study View

## 1. Overview

The Study View provides an immersive, distraction-free environment for users to study their flashcards using a spaced repetition system. Users are presented with cards one by one, can flip them to see the answer, and provide feedback on their performance. This feedback updates the card's study weight, optimizing future sessions. The view includes progress tracking and a summary at the end of the session.

## 2. View Routing

-   **Path**: `/study`
-   **Access**: This view should be protected and accessible only to authenticated users. It is initiated from the main dashboard, likely by clicking a "Start Study" button.

## 3. Component Structure

The view will be composed of the following components in a hierarchical structure:

```
StudyView
├── ProgressBar
├── Flashcard
├── FeedbackControls
└── SessionSummaryModal
```

## 4. Component Details

### StudyView

-   **Component Description**: The main container for the study session. It orchestrates the flow of the session, manages state, and handles API interactions.
-   **Main Elements**: It will render the `ProgressBar`, `Flashcard`, and `FeedbackControls` components. It also conditionally renders the `SessionSummaryModal` when the session is complete.
-   **Handled Interactions**: 
    -   Fetches the study session from the API when the component mounts.
    -   Advances to the next card when feedback is submitted.
    -   Displays the session summary modal when all cards have been reviewed.
-   **Handled Validation**: None directly. It relies on child components for user input validation.
-   **Types**: `StudySessionViewModel`, `StudyCardViewModel`
-   **Props**: None.

### ProgressBar

-   **Component Description**: A visual indicator showing the user's progress through the current study session.
-   **Main Elements**: A `<div>` element that visually represents the percentage of completed cards (e.g., using a background color or width). It will also display text like "Card 5 of 20".
-   **Handled Interactions**: None. This is a display-only component.
-   **Handled Validation**: None.
-   **Types**: None.
-   **Props**:
    -   `currentCardIndex: number`
    -   `totalCards: number`

### Flashcard

-   **Component Description**: Displays the content of a single flashcard and handles the flip animation between the front and back sides.
-   **Main Elements**: A container `<div>` with two child `<div>` elements for the front and back. CSS will be used to manage the 3D flip effect.
-   **Handled Interactions**:
    -   Flips the card when clicked or when the Spacebar is pressed.
-   **Handled Validation**: None.
-   **Types**: `StudyCardViewModel`
-   **Props**:
    -   `card: StudyCardViewModel`
    -   `isFlipped: boolean`
    -   `onFlip: () => void`

### FeedbackControls

-   **Component Description**: A set of buttons that allow the user to submit their review outcome for the current card.
-   **Main Elements**: Two buttons: "Incorrect" and "Correct". These buttons should only become active after the card has been flipped.
-   **Handled Interactions**:
    -   Handles clicks on the "Incorrect" and "Correct" buttons.
    -   Triggers the `onFeedback` event with the corresponding `StudyOutcome`.
    -   Listens for number key presses (e.g., '1' for Incorrect, '2' for Correct) as a keyboard shortcut.
-   **Handled Validation**: The buttons are disabled until the card is flipped to ensure the user sees the answer before providing feedback.
-   **Types**: `StudyOutcome`
-   **Props**:
    -   `isFlipped: boolean`
    -   `onFeedback: (outcome: StudyOutcome) => void`

### SessionSummaryModal

-   **Component Description**: A modal dialog that appears at the end of the study session, displaying performance statistics.
-   **Main Elements**: A modal overlay containing a summary of the session, such as the number of correct and incorrect answers. It will include a button to close the modal and navigate back to the dashboard.
-   **Handled Interactions**:
    -   Handles the click on the "Finish" or "Close" button to navigate the user away from the study view.
-   **Handled Validation**: None.
-   **Types**: `StudySessionViewModel`
-   **Props**:
    -   `session: StudySessionViewModel`
    -   `onClose: () => void`

## 5. Types

### DTOs (Data Transfer Objects)

These types map directly to the API responses.

-   `StartStudySessionResponse`: The response from `POST /api/v1/study/session`.
-   `StudyCardDTO`: The structure of a card within the `StartStudySessionResponse`.
-   `SubmitStudyReviewRequest`: The payload for `POST /api/v1/study/review`.
-   `SubmitStudyReviewResponse`: The response from `POST /api/v1/study/review`.

### ViewModels

These types are derived from DTOs and tailored for the view's state management.

-   **`StudyCardViewModel`**: Represents a single card in the study session. It includes the card's content and its review state.
    ```typescript
    interface StudyCardViewModel {
      id: string;
      front: string;
      back: string; // Note: Fetched separately or included in a custom DTO
      tags: string[];
      outcome: StudyOutcome | null; // 'correct', 'incorrect', or null if not reviewed
    }
    ```

-   **`StudySessionViewModel`**: Represents the entire state of the study session.
    ```typescript
    interface StudySessionViewModel {
      sessionId: string;
      cards: StudyCardViewModel[];
      totalCards: number;
      currentCardIndex: number;
      isFlipped: boolean;
      correctCount: number;
      incorrectCount: number;
      status: 'loading' | 'studying' | 'submitting' | 'finished' | 'error';
      error: string | null;
    }
    ```

## 6. State Management

State for the Study View will be managed locally within the `StudyView` component using React's `useState` and `useReducer` hooks. A custom hook, `useStudySession`, will encapsulate all the logic for fetching data, managing state transitions, and handling user interactions.

-   **`useStudySession` Hook**: This hook will:
    -   Initialize the `StudySessionViewModel` state.
    -   Contain the `fetchStudySession` function to call the `POST /api/v1/study/session` endpoint upon initialization.
    -   Contain the `submitReview` function to call the `POST /api/v1/study/review` endpoint. This function will handle updating the current card's outcome and advancing to the next card.
    -   Manage the `isFlipped` state for the current card.
    -   Track session progress (`currentCardIndex`, `correctCount`, `incorrectCount`).
    -   Handle loading, error, and finished states.

## 7. API Integration

-   **Start Session**: On component mount, the `useStudySession` hook will call the `POST /api/v1/study/session` endpoint.
    -   **Request**: `StartStudySessionQuery` (optional: `card_count`, `tags`).
    -   **Response**: `StartStudySessionResponse`. The `cards` array from the response will be used to populate the `StudySessionViewModel`.

-   **Submit Review**: When the user provides feedback via `FeedbackControls`, the `useStudySession` hook will call the `POST /api/v1/study/review` endpoint.
    -   **Request**: `SubmitStudyReviewRequest` containing `card_id` and `outcome`.
    -   **Response**: `SubmitStudyReviewResponse`. The response is noted, but the primary action is to advance the session state to the next card.

All API calls must include the `Authorization: Bearer {access_token}` header.

## 8. User Interactions

-   **Flip Card**: The user can click the flashcard or press the `Spacebar` to flip it. This toggles the `isFlipped` state in `StudySessionViewModel`.
-   **Provide Feedback**: After the card is flipped, the user can click the "Incorrect" or "Correct" buttons or use number keys ('1', '2'). This triggers the `submitReview` function, sends the outcome to the API, and moves to the next card.
-   **End Session**: Once all cards are reviewed, the `SessionSummaryModal` is displayed. The user can click a button to close it and be navigated back to the dashboard.

## 9. Conditions and Validation

-   **Feedback Disablement**: The `FeedbackControls` buttons will be disabled until the current card is flipped (`isFlipped` is true). This ensures the user sees the answer before rating their knowledge.
-   **Loading State**: The UI will display a loading indicator while the initial study session is being fetched.
-   **Submission State**: The `FeedbackControls` will be disabled while a review is being submitted to the API (`status` is 'submitting') to prevent duplicate submissions.

## 10. Error Handling

-   **API Fetch Error**: If the initial call to `POST /api/v1/study/session` fails (e.g., 401 Unauthorized, 404 Not Found), an error message will be displayed to the user, with an option to retry or return to the dashboard.
-   **API Submit Error**: If a call to `POST /api/v1/study/review` fails, a temporary error notification (e.g., a toast) will be shown, and the UI will allow the user to retry the submission.
-   **No Cards**: If the API returns a 404 or an empty array of cards, the view will inform the user that no cards are available for study under the current filters and direct them to return to the dashboard.

## 11. Implementation Steps

1.  **Create `useStudySession` Hook**: Develop the custom hook to manage all state and business logic for the study session. Implement the initial state structure and placeholder functions for API calls.
2.  **Implement `StudyView` Component**: Create the main view component. Use the `useStudySession` hook to get state and functions. Render a loading spinner based on the `status` field.
3.  **Build Static Components**: Create the `ProgressBar`, `Flashcard`, `FeedbackControls`, and `SessionSummaryModal` components with static props to ensure they render correctly.
4.  **Integrate API - Start Session**: Implement the `fetchStudySession` logic inside the `useStudySession` hook. Connect it to the `useEffect` hook in `StudyView` to trigger on mount. Populate the view with the fetched data.
5.  **Implement Card Flip Logic**: Wire up the `onFlip` event in the `Flashcard` component to the state management in the `useStudySession` hook. Add keyboard listeners for the Spacebar.
6.  **Integrate API - Submit Review**: Implement the `submitReview` logic. Connect the `onFeedback` event from `FeedbackControls` to this function. Ensure the state transitions correctly (submitting -> next card).
7.  **Develop `SessionSummaryModal`**: Implement the logic to display the modal when `currentCardIndex` equals `totalCards`. Add a button to navigate the user back to the dashboard.
8.  **Add Error Handling**: Implement UI for displaying errors for both API fetch and submit failures.
9.  **Refine Styling and Accessibility**: Apply Tailwind CSS for a clean, distraction-free UI. Ensure all components are fully accessible via keyboard and are compatible with screen readers, adhering to WCAG AA standards.
10. **Testing**: Write unit tests for the `useStudySession` hook and component tests for each of the view components to verify props and event handling.
