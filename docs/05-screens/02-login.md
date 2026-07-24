# WF02 — Login

## Purpose
The only public screen. Authenticates users and redirects based on role.

## Entry Points
- `/login` — default route when no valid token is found
- Token expired on app load → clear storage, redirect to `/login`

## Data Fetched on Mount
- `GET /api/public/stats` — public endpoint, no token needed. Returns `{ activeProjects, libraryDocuments, divisionsConnected }`

## Layout

### Left Panel (brand)
- Logo
- System name: "Scientific Knowledge Management System"
- One-line tagline
- Three live stat numbers: active projects, library documents, divisions connected
- On mobile (<768px): collapses to just the logo above the form

### Right Panel (form)
- Work email input
- Password input
- "Forgot password?" link
- "Sign in" button
- Below button: "Contact your administrator for access" note

## Interactive Elements
- **Sign in** → `POST /api/auth/login` → on success, store `{ token, userId, fullName, email, role, division }` in AuthContext and localStorage → redirect based on role:
  - RESEARCHER / STUDENT → `/dashboard`
  - SECRETARY → `/queue`
  - DIVISION_HEAD → `/division`
  - MANAGEMENT → `/executive`
  - ADMIN → `/users`
- **Forgot password** → `TODO: wireframe not provided.` See open questions.

## Edge Cases
- **Wrong credentials:** inline error below password field. No toast.
- **Token found in localStorage on app load:** validate it via `GET /api/auth/validate` before rendering. If expired → clear and stay on login.
- **No register option:** accounts are created by Admin only.
- **Inactive user:** return 403 with message "Account deactivated. Contact your administrator."
