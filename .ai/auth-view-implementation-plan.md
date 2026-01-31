# View Implementation Plan: Auth

## 1. Overview
This document outlines the implementation plan for the Authentication (`Auth`) view. The purpose of this view is to provide a secure and user-friendly interface for users to either sign up for a new account or sign in to their existing account. The view will be accessible at the `/auth` path and will feature a toggle to switch between the sign-in and sign-up forms.

## 2. View Routing
The `Auth` view will be a single page accessible at the following application path:
- **Path**: `/auth`

## 3. Component Structure
The view will be composed of a main page component that conditionally renders the `AuthForm` for either sign-in or sign-up, along with a language toggle. The component hierarchy is as follows:

```
- AuthView (Page: /auth)
  - LanguageToggle
  - AuthForm
    - Input (for Email)
    - Input (for Password)
    - Button (Submit)
```

## 4. Component Details

### AuthView
- **Component Description**: This is the main page component for the `/auth` route. It manages the state for whether the user is signing in or signing up and renders the `AuthForm` accordingly. It also includes the `LanguageToggle` component.
- **Main Elements**: A container `div`, the `LanguageToggle` component, and the `AuthForm` component.
- **Handled Interactions**: Toggling between sign-in and sign-up modes.
- **Props**: None.

### AuthForm
- **Component Description**: A reusable form component used for both sign-up and sign-in. It contains email and password fields, a submit button, and displays validation errors.
- **Main Elements**: `form` element, `Input` components for email and password, a `Button` for submission, and `p` tags for error messages.
- **Handled Interactions**:
  - Form submission (triggers sign-in or sign-up API call).
  - User input in form fields.
- **Handled Validation**:
  - **Email**: Must be a valid email format.
  - **Password (for Sign Up)**: Must be at least 8 characters long and contain both letters and numbers.
  - **Password (for Sign In)**: Cannot be empty.
- **Types**:
  - **DTO**: `AuthSignInRequest`, `AuthSignUpRequest`
  - **ViewModel**: `AuthFormViewModel`
- **Props**:
  - `mode: 'signIn' | 'signUp'`
  - `onSubmit: (data: AuthFormViewModel) => void`
  - `isLoading: boolean`

### LanguageToggle
- **Component Description**: A simple component that allows the user to switch the application's language between English and Polish.
- **Main Elements**: A `Button` or a dropdown menu.
- **Handled Interactions**: Clicking the toggle to change the language.
- **Props**: None.

## 5. Types

### DTOs (Data Transfer Objects)
These types are used for API communication and are already defined in `src/types.ts`.
- `AuthSignInRequest`: `{ email: string; password: string; }`
- `AuthSignUpRequest`: `{ email: string; password: string; }`
- `AuthSignInResponse`: `{ user: AuthUser; session: SessionInfo; }`
- `AuthSignUpResponse`: `{ user: AuthUser; session: SessionInfo; }`

### ViewModel
- **AuthFormViewModel**: A new type for managing the form's state.
  ```typescript
  export interface AuthFormViewModel {
    email: string;
    password: string;
  }
  ```

## 6. State Management
The state for the `Auth` view will be managed using a custom React hook, `useAuth`. This hook will encapsulate the logic for handling form submission, API calls, loading states, and error handling.

- **`useAuth` Hook**:
  - **State Variables**:
    - `isLoading: boolean`: To show a loading indicator during API calls.
    - `error: string | null`: To display API-related error messages.
  - **Functions**:
    - `signIn(credentials: AuthFormViewModel): Promise<void>`: Handles the sign-in API call.
    - `signUp(credentials: AuthFormViewModel): Promise<void>`: Handles the sign-up API call.

## 7. API Integration
The `AuthForm` will interact with the following endpoints:

- **Sign In**:
  - **Endpoint**: `POST /api/v1/auth/signin`
  - **Request Type**: `AuthSignInRequest`
  - **Response Type**: `AuthSignInResponse`
- **Sign Up**:
  - **Endpoint**: `POST /api/v1/auth/signup`
  - **Request Type**: `AuthSignUpRequest`
  - **Response Type**: `AuthSignUpResponse`

API calls will be made from the `useAuth` hook. Upon successful authentication, the user will be redirected to the dashboard.

## 8. User Interactions
- **Toggle Form**: The user can click a link or button to switch between the sign-in and sign-up forms.
- **Form Input**: The user can type their email and password into the respective fields. The email field will be autofocused.
- **Form Submission**: The user can click the submit button or press Enter to submit the form.
- **Language Change**: The user can click the `LanguageToggle` to change the UI language.

## 9. Conditions and Validation
- **Email Validation**: The email field will be validated on the client-side to ensure it's a valid email format before submission.
- **Password Validation**: For sign-up, the password will be validated to ensure it meets the criteria (min 8 characters, with letters and numbers).
- **Error Display**: Validation errors will be displayed below the respective input fields.

## 10. Error Handling
- **Client-Side Errors**: Form validation errors will be displayed in real-time or upon submission attempt.
- **Server-Side Errors**:
  - `400 Bad Request`: A generic error message will be shown on the form.
  - `401 Unauthorized`: "Invalid credentials" message will be displayed.
  - `409 Conflict`: "Email already registered" message will be shown.
  - `500 Internal Server Error`: A generic "Something went wrong" message will be displayed.

## 11. Implementation Steps
1.  **Create the `AuthView` page component** in `src/pages/auth.astro`.
2.  **Implement the `LanguageToggle` component**.
3.  **Create the `AuthFormViewModel` type** in `src/types.ts`.
4.  **Implement the `AuthForm` component** with props for `mode`, `onSubmit`, and `isLoading`.
5.  **Add client-side validation** to the `AuthForm` using a library like `zod`.
6.  **Create the `useAuth` custom hook** to manage state and API calls for sign-in and sign-up.
7.  **Integrate the `useAuth` hook** into the `AuthView` to connect it with the `AuthForm`.
8.  **Implement redirection** to the dashboard upon successful login or sign-up.
9.  **Add error handling** to display messages from the API.
10. **Ensure all accessibility requirements** are met, including labels, `aria-describedby` for errors, and keyboard navigation.
