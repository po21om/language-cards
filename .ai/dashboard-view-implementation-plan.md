# View Implementation Plan: Dashboard

## 1. Overview

The Dashboard View is the central hub of the application, accessible after a user logs in. It allows users to view, manage, and organize their flashcards. The view displays a comprehensive list of flashcards in a data table, provides robust filtering and sorting capabilities, and includes primary actions for studying and generating new cards. Key features include manual card creation, editing, and soft deletion, all handled within a modal to maintain user context.

## 2. View Routing

-   **Path**: `/`
-   **Accessibility**: This view is protected and requires user authentication. Unauthenticated users attempting to access this path should be redirected to the login page.

## 3. Component Structure

The Dashboard View is composed of several modular components organized in a clear hierarchy:

```
DashboardView
├── PrimaryActions
│   ├── Button (Start Study Session)
│   └── Button (Generate with AI)
├── FilterControls
│   ├── Tabs ('Active', 'Review', 'Archived')
│   └── MultiSelect (Filter by Tags)
├── FlashcardDataTable
│   ├── TableHeader
│   ├── TableBody
│   │   └── FlashcardRow (repeated for each card)
│   │       ├── TableCell (Front)
│   │       ├── TableCell (Back)
│   │       ├── TableCell (Tags)
│   │       └── TableCell (Actions: Edit, Delete/Restore)
│   └── InfiniteScrollTrigger
└── CreateCardModal
    └── FlashcardForm
```

## 4. Component Details

### PrimaryActions

-   **Component Description**: A container for the main call-to-action buttons, allowing users to initiate key workflows.
-   **Main Elements**: Two `Button` components from `shadcn/ui`.
-   **Handled Interactions**:
    -   `onClick` on 'Start Study Session': Navigates the user to the study session view (`/study`).
    -   `onClick` on 'Generate with AI': Navigates the user to the AI generation view (`/generate`).
-   **Props**: None.

### FilterControls

-   **Component Description**: Provides UI controls for filtering the list of flashcards displayed in the `FlashcardDataTable`.
-   **Main Elements**:
    -   `Tabs` component from `shadcn/ui` for status filtering.
    -   `MultiSelect` component (custom or from a library like `shadcn-multi-select`) for tag filtering.
-   **Handled Interactions**:
    -   `onValueChange` on `Tabs`: Updates the `status` filter in the `useDashboardState` hook and triggers a new API call to fetch filtered cards.
    -   `onValueChange` on `MultiSelect`: Updates the `selectedTags` in the `useDashboardState` hook and triggers a new API call.
-   **Props**:
    -   `allTags: string[]`: A list of all unique tags available for filtering.
    -   `onFilterChange: (filters: { status: FlashcardStatus, tags: string[] }) => void`: Callback to notify the parent of filter changes.

### FlashcardDataTable

-   **Component Description**: Displays the user's flashcards in an infinite-scrolling table, handling both active and archived (soft-deleted) cards.
-   **Main Elements**:
    -   `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` from `shadcn/ui`.
    -   An `InfiniteScrollTrigger` component (e.g., using `react-intersection-observer`) at the bottom of the table to load more data.
-   **Handled Interactions**:
    -   Triggering infinite scroll: Calls the `loadMore` function from the `useDashboardState` hook when the trigger element becomes visible.
    -   `onClick` on 'Edit' button: Opens the `CreateCardModal` in edit mode, passing the selected `FlashcardViewModel`.
    -   `onClick` on 'Delete'/'Restore' button: Calls the appropriate handler (`handleDelete` or `handleRestore`) from the `useDashboardState` hook.
-   **Props**:
    -   `cards: FlashcardViewModel[]`: The list of flashcards to display.
    -   `hasMore: boolean`: Indicates if more cards can be loaded.
    -   `onLoadMore: () => void`: Function to call when more data is needed.
    -   `onEdit: (card: FlashcardViewModel) => void`: Function to open the edit modal.
    -   `onDelete: (cardId: string) => void`: Function to soft-delete a card.
    -   `onRestore: (cardId: string) => void`: Function to restore a card.

### CreateCardModal

-   **Component Description**: A modal dialog for creating a new flashcard or editing an existing one. It contains the `FlashcardForm`.
-   **Main Elements**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` from `shadcn/ui`.
-   **Handled Interactions**:
    -   `onOpenChange`: Controls the visibility of the modal.
    -   `onSubmit` from `FlashcardForm`: Calls the `handleCreate` or `handleUpdate` function from the `useDashboardState` hook.
-   **Props**:
    -   `isOpen: boolean`: Controls whether the modal is open.
    -   `onClose: () => void`: Function to close the modal.
    -   `onSubmit: (data: FlashcardFormValues) => void`: Callback to handle form submission.
    -   `initialData?: FlashcardViewModel`: Optional data to pre-fill the form for editing.

### FlashcardForm

-   **Component Description**: The form used inside `CreateCardModal` for flashcard data entry.
-   **Main Elements**: `Input`, `Textarea`, `Button` components within a `<form>` element, managed by `react-hook-form`.
-   **Handled Validation**:
    -   `front`: Required, string, 1-2000 characters.
    -   `back`: Required, string, 1-2000 characters.
    -   `tags`: Optional, array of strings. Each tag is a string.
-   **Types**: `FlashcardFormValues`.
-   **Props**:
    -   `onSubmit: (data: FlashcardFormValues) => void`: The function to execute upon successful form submission.
    -   `initialData?: FlashcardViewModel`: Data for pre-filling the form in edit mode.

## 5. Types

-   **`FlashcardResponseDTO`**: (from `src/types.ts`) The DTO received from the API for a single flashcard.
-   **`FlashcardViewModel`**: A new client-side model to represent a flashcard in the UI. It adapts the API response for direct use in components.
    ```typescript
    export interface FlashcardViewModel {
      id: string;
      front: string;
      back: string;
      tags: string[];
      status: FlashcardStatus;
      isDeleted: boolean; // Derived from `deleted_at`
      createdAt: string; // Formatted for display
      updatedAt: string; // Formatted for display
    }
    ```
-   **`FlashcardFormValues`**: A new type representing the data structure for the flashcard creation/editing form.
    ```typescript
    export interface FlashcardFormValues {
      front: string;
      back: string;
      tags: string[];
    }
    ```
-   **`ListFlashcardsQuery`**: (from `src/types.ts`) The query parameters for the `GET /api/v1/flashcards` endpoint.

## 6. State Management

A custom hook, `useDashboardState`, will encapsulate the view's logic and state, promoting separation of concerns and reusability.

-   **`useDashboardState` Hook**:
    -   **Purpose**: To manage the entire state of the Dashboard View, including the list of flashcards, pagination, filters, loading states, and modal visibility.
    -   **State Variables**:
        -   `cards: FlashcardViewModel[]`: The currently displayed list of flashcards.
        -   `pagination: PaginationMeta`: Pagination info from the API (`total`, `limit`, `offset`, `has_more`).
        -   `filters: { status: FlashcardStatus, tags: string[] }`: Current filter settings.
        -   `isLoading: boolean`: True when fetching data.
        -   `error: Error | null`: Stores any API errors.
        -   `isModalOpen: boolean`: Controls the `CreateCardModal` visibility.
        -   `editingCard: FlashcardViewModel | null`: The card currently being edited.
    -   **Exposed Functions**:
        -   `loadMore()`: Fetches the next page of cards and appends them to the list.
        -   `setFilters()`: Updates filter state and re-fetches the card list from the first page.
        -   `handleCreate(data: FlashcardFormValues)`: Calls `POST /api/v1/flashcards` and updates the UI.
        -   `handleUpdate(cardId: string, data: FlashcardFormValues)`: Calls `PATCH /api/v1/flashcards/{id}` and updates the UI.
        -   `handleDelete(cardId: string)`: Calls `DELETE /api/v1/flashcards/{id}` and removes the card from the UI.
        -   `handleRestore(cardId: string)`: Calls `POST /api/v1/flashcards/{id}/restore` and updates the card in the UI.
        -   `openModal(card?: FlashcardViewModel)`: Opens the `CreateCardModal` for creation or editing.
        -   `closeModal()`: Closes the modal.

## 7. API Integration

All API calls will be managed within the `useDashboardState` hook.

-   **`GET /api/v1/flashcards`**
    -   **Purpose**: Fetch a paginated and filtered list of flashcards.
    -   **Request**: `ListFlashcardsQuery` object containing `limit`, `offset`, `status`, `tags`, and `include_deleted`.
    -   **Response**: `FlashcardListResponse` containing `data: FlashcardResponseDTO[]` and `pagination: PaginationMeta`.
-   **`POST /api/v1/flashcards`**
    -   **Purpose**: Create a new flashcard.
    -   **Request**: `CreateFlashcardRequest` (`front`, `back`, `tags`).
    -   **Response**: `FlashcardResponseDTO`.
-   **`PATCH /api/v1/flashcards/{id}`**
    -   **Purpose**: Update an existing flashcard.
    -   **Request**: `UpdateFlashcardRequest` (partial of `front`, `back`, `tags`).
    -   **Response**: `FlashcardResponseDTO`.
-   **`DELETE /api/v1/flashcards/{id}`**
    -   **Purpose**: Soft-delete a flashcard.
    -   **Response**: `DeleteFlashcardResponse`.
-   **`POST /api/v1/flashcards/{id}/restore`**
    -   **Purpose**: Restore a soft-deleted flashcard.
    -   **Response**: `FlashcardResponseDTO`.

## 8. User Interactions

-   **Filtering Cards**: User clicks a status tab ('Active', 'Review', 'Archived') or selects tags from the multi-select dropdown. The `FlashcardDataTable` updates to show the filtered results.
-   **Loading More Cards**: As the user scrolls to the bottom of the `FlashcardDataTable`, a loading indicator appears, and the next page of cards is fetched and appended to the list.
-   **Creating a Card**: User clicks the 'Add Card' button (to be placed near `PrimaryActions`), which opens the `CreateCardModal`. After filling the form and clicking 'Save', the modal closes, and the new card appears at the top of the list (if it matches the current filters).
-   **Editing a Card**: User clicks the 'Edit' icon on a card row. The `CreateCardModal` opens with the form pre-filled. After saving, the modal closes, and the card's data is updated in the table.
-   **Deleting a Card**: User clicks the 'Delete' icon on a card row. A confirmation dialog appears. Upon confirmation, the card is removed from the 'Active' list.
-   **Restoring a Card**: In the 'Archived' tab, the user clicks the 'Restore' icon on a card row. The card is moved back to the 'Active' list.

## 9. Conditions and Validation

-   **Form Validation**: The `FlashcardForm` will enforce validation rules using `react-hook-form` and a Zod schema. Error messages will be displayed below the respective fields.
    -   `front` and `back` fields must not be empty and must be between 1 and 2000 characters.
-   **API Conditions**: The UI will reflect API constraints.
    -   The 'Restore' button will only be visible for cards where `isDeleted` is true (i.e., in the 'Archived' tab).
    -   The 'Delete' button will only be visible for cards where `isDeleted` is false.
-   **Loading State**: A loading spinner or skeleton loader will be displayed in the `FlashcardDataTable` during initial data fetch and when filters are changed.
-   **Empty State**: If no flashcards match the current filters, the table will display a message like "No flashcards found. Try adjusting your filters or create a new card!"

## 10. Error Handling

-   **API Errors**: The `useDashboardState` hook will catch errors from API calls. A generic error message (e.g., using a Toast component) will be displayed to the user, such as "Failed to fetch flashcards. Please try again later."
-   **Form Submission Errors**: If the API returns a validation error (400) on form submission, the specific error message will be displayed near the form's 'Save' button.
-   **Not Found Errors (404)**: If an action (e.g., update, delete) targets a card that no longer exists, the UI will display a toast notification and remove the card from the list.
-   **Unauthorized Errors (401)**: A global error handler or middleware should intercept 401 responses and redirect the user to the login page.

## 11. Implementation Steps

1.  **Create Types**: Define the `FlashcardViewModel` and `FlashcardFormValues` types in a new file, e.g., `src/features/dashboard/types.ts`.
2.  **Develop `useDashboardState` Hook**: Create the `useDashboardState.ts` file. Implement the state variables and the logic for fetching, creating, updating, and deleting flashcards. Start with fetching and filtering.
3.  **Build Static Components**: Create the file structure for the view (`src/pages/dashboard/index.astro`) and its components (`src/features/dashboard/components/`). Build the static JSX/TSX for `PrimaryActions`, `FilterControls`, and `FlashcardDataTable` without state.
4.  **Integrate State with Components**: Wire up the `useDashboardState` hook to the `DashboardView`. Pass down state and callbacks as props to the child components (`FilterControls`, `FlashcardDataTable`).
5.  **Implement Infinite Scroll**: Add the `InfiniteScrollTrigger` to `FlashcardDataTable` and connect it to the `loadMore` function from the hook.
6.  **Build the Modal and Form**: Create the `CreateCardModal` and `FlashcardForm` components. Integrate `react-hook-form` and Zod for validation.
7.  **Connect Modal to State**: Implement the `openModal` and `closeModal` logic. Wire up the form's `onSubmit` to the `handleCreate` and `handleUpdate` functions in the `useDashboardState` hook.
8.  **Implement Delete/Restore Logic**: Add confirmation dialogs for delete actions and connect the UI buttons to the `handleDelete` and `handleRestore` functions.
9.  **Refine UI and Error Handling**: Add loading indicators, empty states, and toast notifications for a polished user experience.
10. **Testing**: Write tests for the `useDashboardState` hook logic and component interactions. Manually test all user stories related to the dashboard.
