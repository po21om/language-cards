# View Implementation Plan: Settings

## 1. Overview

The Settings view allows users to manage their account and application preferences. It provides options to change the interface language, export personal data, and permanently delete their account. The view is designed to be secure and user-friendly, with clear confirmation steps for destructive actions.

## 2. View Routing

-   **Path**: `/settings`
-   **Access**: This view should only be accessible to authenticated users.

## 3. Component Structure

The Settings view will be composed of the following components in a clear, sectioned layout:

```
SettingsView (Container)
├── LanguageSelector (Client Component)
├── ExportButtons (Client Component)
└── DeleteAccount (Client Component)
    └── ConfirmationModal (Dialog)
```

## 4. Component Details

### LanguageSelector

-   **Component Description**: A client-side component that allows the user to switch the application's interface language between English and Polish. It fetches the current user's language preference and provides a dropdown or segmented control to change it. The selection is persisted to the backend and the UI is updated immediately.
-   **Main Elements**: A `<label>` for accessibility and a `<select>` dropdown (or a similarly functioning custom component from `shadcn/ui`) containing 'English' and 'Polish' options.
-   **Handled Interactions**:
    -   `onMount`: Fetches the current user's profile to set the initial language.
    -   `onChange`: When the user selects a new language, it triggers an API call to update the preference and refreshes the application's language state.
-   **Handled Validation**: The component will only allow selecting from the available languages ('en', 'pl').
-   **Types**: `ProfileDTO`, `UpdateProfileRequest`
-   **Props**: None.

### ExportButtons

-   **Component Description**: This component provides buttons for users to export their flashcard data. It will fetch all flashcards and then format them into either CSV or JSON format for download.
-   **Main Elements**: Two `<button>` elements: 'Export to JSON' and 'Export to CSV'.
-   **Handled Interactions**:
    -   `onClick` (JSON): Fetches user's flashcards, formats them as a JSON string, and triggers a file download.
    -   `onClick` (CSV): Fetches user's flashcards, converts them to CSV format, and triggers a file download.
-   **Handled Validation**: Buttons should be disabled while data is being fetched or processed.
-   **Types**: `FlashcardExportEntity`
-   **Props**: None.

### DeleteAccount

-   **Component Description**: A section that contains a button to initiate account deletion. Clicking the button opens a confirmation modal to prevent accidental deletion.
-   **Main Elements**: A `<button>` with a clear, destructive-action style (e.g., red color) labeled 'Delete Account'. It will render a `ConfirmationModal` component when activated.
-   **Handled Interactions**:
    -   `onClick` (Delete Button): Opens the `ConfirmationModal`.
    -   `onConfirm` (from Modal): Calls the API to delete the account, logs the user out, and redirects to the homepage.
    -   `onCancel` (from Modal): Closes the modal with no further action.
-   **Handled Validation**: The confirmation button in the modal should be disabled until the user performs a required action (e.g., types 'DELETE').
-   **Types**: `DeleteAccountResponse`
-   **Props**: None.

## 5. Types

### ViewModel Types

-   **`SettingsViewModel`**: A new type to manage the state of the settings view.

    ```typescript
    export interface SettingsViewModel {
      language: LanguagePreference;
      isLoading: boolean;
      error: string | null;
      isModalOpen: boolean;
    }
    ```

    -   `language`: The user's current language preference (`'en' | 'pl'`).
    -   `isLoading`: A boolean to indicate when an API call is in progress.
    -   `error`: A string to hold any error messages from API calls.
    -   `isModalOpen`: A boolean to control the visibility of the deletion confirmation modal.

### DTOs (Data Transfer Objects)

-   **`ProfileDTO`**: Used for fetching and displaying the user's current language preference.
-   **`UpdateProfileRequest`**: Used as the payload for updating the language preference.
-   **`FlashcardExportEntity`**: The structure of each flashcard record when exporting data.
-   **`DeleteAccountResponse`**: The expected response after successfully deleting an account.

## 6. State Management

State for the Settings view will be managed locally within the `SettingsView` container component using React's `useState` or `useReducer` hook, encapsulated in a custom hook `useSettings` for cleaner logic.

-   **`useSettings` Custom Hook**: This hook will initialize and manage the `SettingsViewModel`.
    -   It will fetch the user's profile on mount to set the initial language.
    -   It will expose handler functions to update the language, open/close the modal, and handle account deletion.
    -   It will manage `isLoading` and `error` states for all API interactions.

## 7. API Integration

-   **Fetch Profile**: `GET /api/v1/profile`
    -   **Action**: On view load.
    -   **Response Type**: `ProfileDTO`
    -   **Usage**: To get the current `language_preference`.
-   **Update Language**: `PATCH /api/v1/profile`
    -   **Action**: On language selection change.
    -   **Request Type**: `UpdateProfileRequest`
    -   **Response Type**: `ProfileDTO`
    -   **Usage**: To save the new language preference.
-   **Fetch Flashcards for Export**: `GET /api/v1/flashcards?limit=1000` (adjust limit as needed)
    -   **Action**: On 'Export' button click.
    -   **Response Type**: `FlashcardListResponse`
    -   **Usage**: To get all flashcard data for exporting.
-   **Delete Account**: `DELETE /api/v1/auth/account`
    -   **Action**: On confirmation of account deletion.
    -   **Request Headers**: `Authorization: Bearer {access_token}`
    -   **Response Type**: `DeleteAccountResponse`
    -   **Usage**: To permanently delete the user's account.
-   **Sign Out**: `POST /api/v1/auth/signout`
    -   **Action**: After successful account deletion.
    -   **Usage**: To invalidate the user's session.

## 8. User Interactions

-   **Changing Language**: User selects a language from the dropdown. The UI text updates immediately, and the preference is saved in the background.
-   **Exporting Data**: User clicks an export button. The button enters a loading state, and a file download is initiated upon completion.
-   **Deleting Account**: User clicks 'Delete Account'. A modal appears, requiring them to type 'DELETE' to enable the final confirmation button. Upon confirmation, they are logged out and redirected.

## 9. Conditions and Validation

-   **Authentication**: The entire `/settings` route is protected. Unauthenticated users will be redirected to the login page.
-   **API Requests**: All API calls will display a loading indicator to provide feedback and prevent duplicate actions.
-   **Account Deletion**: The 'Confirm Deletion' button in the modal is disabled until the user types the exact word `DELETE` into a text input field, preventing accidental clicks.

## 10. Error Handling

-   **API Errors**: Any failed API request (e.g., network error, server error) will display a descriptive error message to the user, typically using a toast notification.
-   **Profile Fetch Failure**: If the user's profile cannot be fetched, a default language will be used, and an error message will be shown.
-   **Deletion Failure**: If account deletion fails, the modal will close, and an error message will be displayed, advising the user to try again later.

## 11. Implementation Steps

1.  **Create View File**: Create the main page file at `src/pages/settings.astro`.
2.  **Develop `useSettings` Hook**: Implement the custom hook to manage state, fetch the initial profile, and handle API calls.
3.  **Build `LanguageSelector`**: Create the language selection component. Integrate it with the `useSettings` hook to display and update the language.
4.  **Build `ExportButtons`**: Create the export component. Implement the logic to fetch flashcards and generate downloadable CSV and JSON files.
5.  **Build `DeleteAccount` and `ConfirmationModal`**: Create the deletion component and its associated modal. Implement the confirmation logic (typing 'DELETE') and the API call sequence for deletion and logout.
6.  **Assemble the View**: Combine all components in `settings.astro`, ensuring proper layout and styling consistent with the rest of the application.
7.  **Add Routing**: Ensure the route is protected and only accessible to logged-in users.
8.  **Testing**: Write tests to cover user interactions, API integrations, and error handling scenarios for each component.
