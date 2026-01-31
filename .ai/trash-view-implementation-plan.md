# View Implementation Plan: Trash

## 1. Overview

The Trash view allows users to manage their soft-deleted flashcards. It displays a list of cards that have been deleted within the last 30 days, providing options to either restore them to the active deck or delete them permanently. The view emphasizes clear communication about the 30-day data retention policy.

## 2. View Routing

-   **Path**: `/trash`

## 3. Component Structure

```
TrashView (Container)
└── TrashDataTable
    ├── DataTable
    │   ├── DataTable.Header
    │   ├── DataTable.Body
    │   │   └── TrashDataTableRow (Custom Row)
    │   │       ├── DataTableCell (Front, Back)
    │   │       ├── DataTableCell (Time Remaining)
    │   │       └── DataTableCell (Actions: Restore, Delete)
    │   └── DataTable.Pagination
    └── AlertDialog (for permanent delete confirmation)
```

## 4. Component Details

### TrashView

-   **Component Description**: The main container for the Trash view. It is responsible for fetching the list of soft-deleted flashcards, managing the view's state, and passing data down to the `TrashDataTable`.
-   **Main Elements**: A heading indicating the view's purpose (e.g., "Trash") and an instance of the `TrashDataTable` component.
-   **Handled Interactions**: None directly. It orchestrates state changes based on events from child components.
-   **Handled Validation**: None.
-   **Types**: `FlashcardResponseDTO`, `FlashcardViewModel`
-   **Props**: None.

### TrashDataTable

-   **Component Description**: A specialized table that displays soft-deleted flashcards. It handles the presentation of card data, countdown timers, and user actions (restore, delete permanently).
-   **Main Elements**: A `DataTable` component from the `shadcn/ui` library, configured with custom columns for card content, time remaining, and actions. It also includes an `AlertDialog` for confirming permanent deletions.
-   **Handled Interactions**:
    -   **Restore**: Clicking the "Restore" button triggers the `onRestore` event.
    -   **Delete Permanently**: Clicking the "Delete Permanently" button opens a confirmation `AlertDialog`. Confirming triggers the `onDelete` event.
-   **Handled Validation**:
    -   The "Restore" and "Delete Permanently" buttons are disabled while a network request for that specific card is in progress to prevent duplicate actions.
-   **Types**: `FlashcardViewModel`, `DataTableProps`
-   **Props**:
    -   `data: FlashcardViewModel[]`: The array of deleted flashcards to display.
    -   `isLoading: boolean`: Indicates if the initial data fetch is in progress.
    -   `onRestore: (cardId: string) => void`: Callback function to handle card restoration.
    -   `onDelete: (cardId: string) => void`: Callback function to handle permanent deletion.

## 5. Types

### DTOs (Data Transfer Objects)

-   **`FlashcardResponseDTO`**: The object received from the API, defined in `src/types.ts`. It represents the raw flashcard data.

### ViewModels

-   **`FlashcardViewModel`**: A new type that extends the `FlashcardResponseDTO` with UI-specific properties.

    ```typescript
    import { FlashcardResponseDTO } from '@/types';

    export interface FlashcardViewModel extends FlashcardResponseDTO {
      /** Time remaining until permanent deletion, as a human-readable string (e.g., "29 days"). */
      timeRemaining: string;

      /** Indicates if an action (restore/delete) is currently being processed for this card. */
      isProcessing: boolean;
    }
    ```

## 6. State Management

State will be managed within the `TrashView` container component using a custom React hook named `useTrashView`.

### `useTrashView` Hook

-   **Purpose**: To encapsulate all logic related to the Trash view, including data fetching, state management, and event handling.
-   **State Variables**:
    -   `cards: FlashcardViewModel[]`: The list of soft-deleted cards to be displayed.
    -   `isLoading: boolean`: Tracks the loading state of the initial data fetch.
    -   `error: Error | null`: Stores any errors that occur during API calls.
-   **Functions**:
    -   `fetchDeletedCards()`: Fetches the list of soft-deleted cards from the API.
    -   `handleRestore(cardId: string)`: Handles the logic for restoring a card. It calls the restore API, and on success, removes the card from the local state.
    -   `handleDelete(cardId: string)`: Handles the logic for permanently deleting a card. It calls the delete API, and on success, removes the card from the local state.

## 7. API Integration

-   **List Deleted Flashcards**:
    -   **Endpoint**: `GET /api/v1/flashcards`
    -   **Request**: A `GET` request with the query parameter `include_deleted=true`.
    -   **Response Type**: `FlashcardListResponse`

-   **Restore Flashcard**:
    -   **Endpoint**: `POST /api/v1/flashcards/{id}/restore`
    -   **Request**: A `POST` request with the card's `id` in the URL path.
    -   **Response Type**: `FlashcardResponseDTO`

-   **Delete Flashcard Permanently**:
    -   **Endpoint**: `DELETE /api/v1/flashcards/{id}`
    -   **Request**: A `DELETE` request with the card's `id` in the URL path.
    -   **Response Type**: `DeleteFlashcardResponse`

## 8. User Interactions

-   **View Load**: The user navigates to `/trash`. The `TrashView` component mounts and triggers the `useTrashView` hook to fetch soft-deleted cards.
-   **Restore Card**: The user clicks the "Restore" button for a card. The button enters a disabled state, a loading indicator may appear, and the `handleRestore` function is called. On success, the card is removed from the table. On failure, an error message is displayed.
-   **Delete Card Permanently**: The user clicks the "Delete Permanently" button. An `AlertDialog` appears, asking for confirmation. If the user confirms, the `handleDelete` function is called. The card is removed from the table on success, and an error is shown on failure.

## 9. Conditions and Validation

-   **Time Remaining Calculation**: The `timeRemaining` field in the `FlashcardViewModel` will be calculated based on the `deleted_at` timestamp from the API. The logic will be `30 days - (current_date - deleted_at)`.
-   **Action Button State**: The "Restore" and "Delete Permanently" buttons for a specific row will be disabled (`isProcessing = true`) while an API request for that card is pending to prevent redundant calls.
-   **Empty State**: If the API returns no soft-deleted cards, the `TrashDataTable` will display a message indicating that the trash is empty.

## 10. Error Handling

-   **Data Fetching Error**: If the initial fetch of deleted cards fails, a full-page error message will be displayed with an option to retry the action.
-   **Restore/Delete Error**: If an individual restore or delete action fails:
    -   A toast notification will appear with a descriptive error message (e.g., "Failed to restore card. Please try again.").
    -   The `isProcessing` state for the specific card will be reset to `false`, re-enabling the action buttons.
    -   For a `410 Gone` error on restore, the UI will remove the card from the list and show a toast: "This card can no longer be restored as it is past the 30-day window."

## 11. Implementation Steps

1.  **Create the View Model**: Define the `FlashcardViewModel` interface in a new file, e.g., `src/view-models/trash.ts`.
2.  **Develop the `useTrashView` Hook**: Create the custom hook in `src/hooks/useTrashView.ts`. Implement the state variables and the `fetchDeletedCards` function first.
3.  **Build `TrashView` Component**: Create the main view component at `src/pages/trash.astro`. Use the `useTrashView` hook to fetch data and manage state.
4.  **Implement `TrashDataTable` Component**: Create the `TrashDataTable.tsx` component. Use the `shadcn/ui` `DataTable` and define the columns: "Front", "Back", "Time Remaining", and "Actions".
5.  **Add Action Logic**: Implement the `handleRestore` and `handleDelete` functions in the `useTrashView` hook. Pass these handlers as props to `TrashDataTable`.
6.  **Integrate Actions**: In `TrashDataTable`, connect the "Restore" and "Delete Permanently" buttons to the `onRestore` and `onDelete` props. Implement the `AlertDialog` for delete confirmation.
7.  **Refine UI and Error Handling**: Add loading indicators, empty states, and toast notifications for all API interactions. Ensure action buttons are disabled during processing.
8.  **Testing**: Manually test all user flows: successful restore, successful deletion, API errors, and the empty state. Verify accessibility with keyboard navigation.
