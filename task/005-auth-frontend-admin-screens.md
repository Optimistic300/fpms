# Task 005: Auth Frontend

**Status:** Not Started
**Depends on:** 004
**Docs referenced:** `docs/04-frontend-architecture.md`, `docs/05-screens/02-login.md`, `docs/09-open-questions-and-assumptions.md`

## Objective

Build the Login page (WF02) with public stats display, implement `AuthContext` that persists the token in localStorage and validates on app load, create route guard that redirects unauthenticated users to login, and implement forgot password UI. This is the authentication gate for the entire application.

## Context

The Login page is the only public screen. Users authenticate via email/password, receive a Sanctum token, and get redirected to their role-based landing screen. The AuthContext and route guard ensure only authenticated users can access protected routes.

## Scope

**In scope:**
- Login page (WF02) implementation — left brand panel with stats, right form panel
- `AuthContext` (React Context) — `{ token, user, isAuthenticated, login(), logout() }`
- Token stored in localStorage on login, cleared on logout
- On app mount: validate stored token via `GET /api/auth/validate` before rendering authenticated routes
- Route guard component (`ProtectedRoute`) — redirects to `/login` if not authenticated
- Role-based landing redirect after login (RESEARCHER/STUDENT → /dashboard, SECRETARY → /queue, etc.)
- Forgot password UI (form to enter email, shows success message)

**Out of scope:**
- Shell/navigation layout (Task 006)
- Admin screens (User Management + Settings) — Task 023
- Styling beyond functional layout (CSS can be basic in this task)

## Relevant data model

Not directly — this task reads user data for display only.

## Relevant API contract

All auth endpoints are implemented in Task 004:
- `POST /api/auth/login`
- `GET /api/auth/validate`
- `POST /api/auth/logout`
- `GET /api/public/stats`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## Relevant frontend behavior

### Login (WF02)
- Left panel: Logo, system name, tagline, three stat numbers (active projects, library documents, divisions connected)
- Right panel: email input, password input, "Forgot password?" link, "Sign in" button, "Contact your administrator" note
- On mobile (<768px): brand panel collapses to just logo above the form
- Wrong credentials: inline error below password field, no toast
- Token found in localStorage on load: validate via GET /api/auth/validate before rendering
- No register option
- Inactive user: show "Account deactivated. Contact your administrator."
- Forgot password: email input form → on submit show success message "Check your email"

## Architectural conventions that apply

- `AuthContext` uses React Context + localStorage for token persistence
- Axios instance preconfigured with base URL `/api` and Authorization header from stored token
- Axios interceptor catches 401 responses → clears auth state and redirects to login
- Login form validates inline (email format, password not empty)
- Forgot password uses the existing `POST /api/auth/forgot-password` endpoint
- Token validation on app load is a blocking check (show loading screen until resolved)

## Step-by-step implementation checklist

**Frontend — Auth infrastructure:**
- [ ] Create `resources/js/contexts/AuthContext.jsx` — provides `{ token, user, isAuthenticated, login(), logout(), loading }`
- [ ] Login function: calls `POST /api/auth/login`, stores token + user in localStorage and context
- [ ] Logout function: calls `POST /api/auth/logout`, clears localStorage, redirects to /login
- [ ] On app mount: check localStorage for token, call `GET /api/auth/validate`, set user or clear token if invalid
- [ ] Create Axios instance in `resources/js/api/axios.js` with base URL `/api`, Authorization header from context, 401 interceptor
- [ ] Create `ProtectedRoute` component — if not authenticated and not loading, redirect to `/login`
- [ ] Create `PublicRoute` component — if authenticated, redirect to role-based landing

**Frontend — Login page:**
- [ ] Create `resources/js/pages/Login.jsx` — left brand panel + right form panel
- [ ] Fetch public stats on mount via `GET /api/public/stats`
- [ ] Implement login form with email + password, inline error handling
- [ ] Implement forgot-password toggle: show email input, call POST, show success message
- [ ] After successful login, use role to determine redirect path
- [ ] Handle 403 (inactive user) with specific message

## Definition of done

- Login page renders with public stats from API
- Successful login stores token and redirects by role
- Failed login shows inline error
- Inactive user gets specific error message
- Token validation on app load restores session or redirects to login
- Logout clears token and redirects
- 401 interceptor redirects to login on any expired token
- Protected routes redirect unauthenticated users to /login
- Forgot password form submits and shows success message

## Open questions / assumptions inherited

- **Password reset:** Uses email-based Laravel built-in flow per `09-open-questions-and-assumptions.md`. Admin password reset from User Management is in Task 023.
