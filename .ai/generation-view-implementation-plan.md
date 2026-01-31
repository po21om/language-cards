# View Implementation Plan: AI Generation

## 1. Overview
This document outlines the implementation plan for the AI Generation view, accessible at the `/generate` path. This view enables users to input a piece of text, leverage an AI service to generate flashcard suggestions, and then review, edit, refine, accept, or reject these suggestions before adding them to their permanent collection. The entire process is designed to be intuitive, accessible, and efficient, with clear state management for loading, reviewing, and bulk actions.

## 2. View Routing
The AI Generation view will be a single-page application view accessible at the following client-side route:
- **Path**: `/generate`

## 3. Component Structure
The view will be composed of a hierarchy of React components built on Astro. The component tree is as follows:

```
- GenerationView (Page Container)
  - TextInputArea
  - GenerationControls
  - LoadingIndicator
  - BulkActionToolbar
  - ReviewList
    - ReviewListItem
      - InlineEditForm
      - RefineModal
```

## 4. Component Details

### GenerationView
- **Component Description**: The main container for the entire `/generate` page. It manages the overall view state, orchestrates API calls, and passes data and handlers down to its children.
- **Main Elements**: Renders child components like `TextInputArea`, `GenerationControls`, `LoadingIndicator`, `BulkActionToolbar`, and `ReviewList` based on the current view state.
- **Handled Interactions**: None directly. It orchestrates state changes based on events from child components.
- **Props**: None.

### TextInputArea
- **Component Description**: A large text area for users to paste their source text. It includes a character counter and enforces the maximum character limit.
- **Main Elements**: `<textarea>`, `<p>` for character count.
- **Handled Interactions**: `onChange` to update the source text state and character count.
- **Handled Validation**: Disables the "Generate" button if the text is empty or exceeds 1,800 characters.
- **Types**: `string` for the text content.
- **Props**:
  - `text: string`
  - `onTextChange: (text: string) => void`
  - `characterCount: number`
  - `maxLength: number`

### GenerationControls
- **Component Description**: Contains the primary action button to trigger the AI generation process.
- **Main Elements**: `<button>` for "Generate".
- **Handled Interactions**: `onClick` on the "Generate" button triggers the `handleGenerate` function.
- **Handled Validation**: The button is disabled based on the `isGenerationDisabled` prop (e.g., if text is invalid or a generation is in progress).
- **Types**: None.
- **Props**:
  - `onGenerate: () => void`
  - `isGenerationDisabled: boolean`

### LoadingIndicator
- **Component Description**: A visual indicator displayed while the AI is processing the text to generate suggestions. It should be accessible and provide feedback to the user.
- **Main Elements**: A spinner or progress bar component, with an ARIA live region to announce the loading state to screen readers.
- **Handled Interactions**: None.
- **Types**: None.
- **Props**: 
  - `isLoading: boolean`

### BulkActionToolbar
- **Component Description**: Provides users with actions to manage all suggestions at once, such as "Accept All" and "Reject All".
- **Main Elements**: `<button>` for "Accept All", `<button>` for "Reject All".
- **Handled Interactions**: `onClick` handlers for each bulk action.
- **Types**: None.
- **Props**:
  - `onAcceptAll: () => void`
  - `onRejectAll: () => void`
  - `isVisible: boolean`

### ReviewList
- **Component Description**: Displays the list of AI-generated card suggestions for the user to review.
- **Main Elements**: An ordered or unordered list (`<ol>` or `<ul>`) containing `ReviewListItem` components.
- **Handled Interactions**: None directly. It maps over the suggestions and renders items.
- **Types**: `SuggestionViewModel[]`.
- **Props**:
  - `suggestions: SuggestionViewModel[]`
  - `onUpdateSuggestion: (id: string, front: string, back: string) => void`
  - `onRefineSuggestion: (id: string, instruction: string) => void`
  - `onAcceptSuggestion: (id: string) => void`
  - `onRejectSuggestion: (id: string) => void`

### ReviewListItem
- **Component Description**: Represents a single AI-generated card suggestion in the review list. It contains the front and back text and action buttons for that specific card.
- **Main Elements**: Divs for front and back text, and buttons for "Accept", "Refine", "Edit", and "Reject". It will also render `InlineEditForm` or `RefineModal` when active.
- **Handled Interactions**: `onClick` for all action buttons.
- **Types**: `SuggestionViewModel`.
- **Props**:
  - `suggestion: SuggestionViewModel`
  - `onUpdate: (id: string, front: string, back: string) => void`
  - `onRefine: (id: string, instruction: string) => void`
  - `onAccept: (id: string) => void`
  - `onReject: (id: string) => void`

## 5. Types

### `SuggestionViewModel`
This ViewModel extends the `AICardSuggestion` DTO with client-side state for managing the UI review process.

```typescript
import type { AICardSuggestion } from './types';

export type SuggestionStatus = 'reviewing' | 'accepted' | 'rejected' | 'editing' | 'refining';

export interface SuggestionViewModel extends AICardSuggestion {
  /** Current state of the suggestion in the UI (e.g., 'reviewing', 'accepted'). */
  ui_status: SuggestionStatus;
  /** Flag indicating if the suggestion has been modified by the user. */
  is_edited: boolean;
}
```

- **`ui_status`**: Manages the visual state of the card in the list (e.g., graying it out when rejected).
- **`is_edited`**: Tracks if the user has modified the `front` or `back` text, which is important for the final `/api/v1/ai/accept` payload.

## 6. State Management

A custom React hook, `useGenerationState`, will be created to encapsulate all state and logic for the view. This hook will manage the view's lifecycle, from text input to final submission.

### `useGenerationState` Hook

- **Purpose**: To centralize state management, abstract away API call logic, and provide clean handlers for the UI components.
- **State Variables**:
  - `sourceText: string`: The raw text input from the user.
  - `suggestions: SuggestionViewModel[]`: The list of AI-generated suggestions.
  - `viewStatus: 'idle' | 'loading' | 'reviewing' | 'submitting'`: The overall state of the view.
  - `generationId: string | null`: The ID received from the `/generate` endpoint, required for the `/accept` call.
  - `error: string | null`: Stores any error messages from API calls.

- **Exported Handlers**:
  - `handleTextChange`: Updates `sourceText`.
  - `handleGenerate`: Calls the `/api/v1/ai/generate` endpoint.
  - `handleUpdateSuggestion`: Updates a suggestion's text in the `suggestions` state.
  - `handleRefineSuggestion`: Calls the `/api/v1/ai/refine` endpoint.
  - `handleAcceptSuggestion`: Updates a suggestion's `ui_status` to 'accepted'.
  - `handleRejectSuggestion`: Updates a suggestion's `ui_status` to 'rejected'.
  - `handleAcceptAll`: Marks all suggestions as 'accepted'.
  - `handleRejectAll`: Marks all suggestions as 'rejected'.
  - `handleSubmitAccepted`: Calls the `/api/v1/ai/accept` endpoint with the final payload.

## 7. API Integration

- **Generate**: `POST /api/v1/ai/generate`
  - **Request**: `AIGenerateRequest` (`{ text: string, target_count?: number }`)
  - **Response**: `AIGenerateResponse`. The `suggestions` will be mapped to `SuggestionViewModel[]` and stored in state. The `generation_id` will also be stored.

- **Refine**: `POST /api/v1/ai/refine`
  - **Request**: `AIRefineRequest` (`{ suggestion_id, front, back, refinement_instruction }`)
  - **Response**: `AIRefineResponse`. The hook will find the corresponding suggestion in the `suggestions` array and replace it with the refined version.

- **Accept**: `POST /api/v1/ai/accept`
  - **Request**: `AIAcceptRequest`. The `useGenerationState` hook will construct this payload by filtering the `suggestions` state based on their `ui_status` and `is_edited` flags.
  - **Response**: `AIAcceptResponse`. On success, the view should be reset to its initial 'idle' state, and a success notification should be displayed.

## 8. User Interactions

- **Pasting Text**: User pastes text into the `TextInputArea`. The character count updates in real-time.
- **Generating Cards**: User clicks "Generate". The `LoadingIndicator` appears. When complete, the `ReviewList` and `BulkActionToolbar` are displayed.
- **Editing a Card**: User clicks "Edit" on a `ReviewListItem`. The text fields become editable (`InlineEditForm`). A "Save" button appears to confirm changes.
- **Accepting/Rejecting a Card**: User clicks "Accept" or "Reject". The `ReviewListItem` provides visual feedback (e.g., changes color, icon appears).
- **Refining a Card**: User clicks "Refine". A modal (`RefineModal`) appears, asking for instructions. On submission, the card shows a loading state until the refined version is returned from the API.
- **Submitting All**: After reviewing, the user clicks a main submission button (e.g., "Add to Deck"). The `handleSubmitAccepted` handler is called, the view enters a 'submitting' state, and upon success, a confirmation is shown.

## 9. Conditions and Validation

- **Character Limit**: The "Generate" button in `GenerationControls` will be disabled if the `sourceText` length is 0 or > 1,800 characters. This is validated in the `useGenerationState` hook and passed as a prop.
- **Loading State**: All interactive elements (buttons, text area) will be disabled when `viewStatus` is 'loading' or 'submitting' to prevent concurrent requests.
- **Empty Suggestions**: If the API returns an empty list of suggestions, a message like "No flashcards could be generated from this text" should be displayed instead of the `ReviewList`.

## 10. Error Handling

- **API Errors**: The `useGenerationState` hook will have a `try...catch` block for each API call. Any error will be caught and its message stored in the `error` state variable.
- **Displaying Errors**: A dedicated error component (e.g., a toast or an alert banner) will display the message from the `error` state. The error should be clearable by the user.
- **Specific Errors**:
  - `400 Bad Request`: Display a message like "Text cannot be empty or exceed 1,800 characters."
  - `429 Too Many Requests`: Inform the user they have exceeded the rate limit and should try again later.
  - `503 Service Unavailable`: Inform the user that the AI service is temporarily down.

## 11. Implementation Steps

1.  **Create File Structure**: Create the necessary files: `src/pages/generate.astro`, `src/components/generation/`, and `src/hooks/useGenerationState.ts`.
2.  **Implement `useGenerationState` Hook**: Set up the state variables and handlers with placeholder logic.
3.  **Build Static UI Components**: Create the stateless React components: `TextInputArea`, `GenerationControls`, `BulkActionToolbar`, `ReviewList`, and `ReviewListItem`.
4.  **Develop `GenerationView` Page**: Assemble the components in `generate.astro` and connect them to the `useGenerationState` hook.
5.  **Integrate API Calls**: Implement the `fetch` logic for the `generate`, `refine`, and `accept` endpoints within the `useGenerationState` hook.
6.  **Implement State Transitions**: Wire up the `viewStatus` logic to correctly show/hide the `LoadingIndicator` and disable/enable controls.
7.  **Implement Inline Editing and Refining**: Develop the `InlineEditForm` and `RefineModal` components and the logic to show/hide them from the `ReviewListItem`.
8.  **Add Error Handling**: Implement the error state and a UI component to display error messages to the user.
9.  **Implement Accessibility Features**: Ensure all inputs are labeled, components are keyboard-navigable, and ARIA live regions are used for asynchronous updates (e.g., generation completion).
10. **Write Tests**: Create unit tests for the `useGenerationState` hook and component tests for the interactive UI elements.
11. **Refine Styling**: Apply Tailwind CSS to match the application's design system and ensure a polished, responsive user experience.
