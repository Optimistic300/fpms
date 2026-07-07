# Task 004: Auth System Backend

**Status:** Done
**Depends on:** 003
**Docs referenced:** `docs/03-api-reference.md` (Auth section, Public section), `docs/02-data-model.md`, `docs/01-roles-and-permissions.md`, `docs/09-open-questions-and-assumptions.md`

## Objective

Implement Sanctum-based authentication: login (issues token), logout (revokes token), validate (checks token), forgot-password flow, and the public stats endpoint. This is the gate all authenticated endpoints depend on.

## Context

Before any authenticated API endpoint works, a user must be able to log in, obtain a token, and have their session validated. The public stats endpoint on the login screen must also return data. Password reset follows Laravel's built-in Notifications flow. Inactive users must be denied login.

## Scope

**In scope:**
- `POST /api/auth/login` — authenticate, return token + user info
- `POST /api/auth/logout` — revoke current token
- `GET /api/auth/validate` — check token validity, return user info
- `POST /api/auth/forgot-password` — send reset link email (Laravel built-in)
- `POST /api/auth/reset-password` — process password reset (Laravel built-in)
- `GET /api/public/stats` — public stats (active projects, library documents, divisions)
- `UserPolicy` — `view`, `create`, `update`, `deactivate` gates for Admin (stub, will be fully used in Task 023)
- Route registration in `routes/api.php` under `/api/auth/*` and `/api/public/*`
- `api.php` route file registration via `RouteServiceProvider` with `auth:sanctum` middleware group

**Out of scope:**
- Login frontend page (Task 005)
- User management (Task 023)
- Email-sending configuration (assumes .env mail config is set up)

## Relevant data model

### User (fields relevant to auth)
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| email | varchar(255) | Unique |
| password | varchar(255) | Hashed |
| fullName | varchar(255) | |
| role | enum | RESEARCHER, STUDENT, SECRETARY, DIVISION_HEAD, MANAGEMENT, ADMIN |
| divisionId | bigint | FK |
| isActive | boolean | Admin can deactivate; inactive cannot log in |
| avatarInitials | varchar(4) | Auto-generated |
| timestamps | | |

### Division (for public stats)
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | |
| name | varchar(255) | |

### Project (for public stats count)
| Field | Type | Notes |
|-------|------|-------|
| status | enum | Only ACTIVE counted |

### Document (for public stats count)
| Field | Type | Notes |
|-------|------|-------|
| published | boolean | Only published counted |

## Relevant API contract

### `POST /api/auth/login`
**Auth:** None
**Request:** `{ email, password }`
**Response 200:** `{ data: { token, userId, fullName, email, role, division } }`
**Response 422:** `{ message: "Invalid email or password.", errors: { email: [...] } }`

### `POST /api/auth/logout`
**Auth:** Required
**Response 200:** `{ message: "Logged out successfully." }`

### `GET /api/auth/validate`
**Auth:** Required
**Response 200:** `{ data: { valid: true, userId, fullName, role, division } }`
**Response 401:** Token expired/invalid

### `GET /api/public/stats`
**Auth:** None
**Response 200:** `{ data: { activeProjects: 47, libraryDocuments: 312, divisionsConnected: 6 } }`

### `POST /api/auth/forgot-password`
**Auth:** None
**Request:** `{ email }`
**Response 200:** `{ message: "Password reset link sent." }`

### `POST /api/auth/reset-password`
**Auth:** None
**Request:** `{ email, token, password, passwordConfirmation }`
**Response 200:** `{ message: "Password reset successful." }`

## Relevant frontend behavior

Not directly — login screen is Task 005.

## Architectural conventions that apply

- `AuthController` is a thin controller: receives request, delegates to action/service, returns response
- Validation in `LoginRequest` FormRequest (email required, valid email; password required)
- Login response uses a simple resource or manual array — no CamelCaseResource needed since these are flat values
- Inactive user check: after credential verification, check `$user->isActive` → return 403
- Use Sanctum's `createToken()` for token issuance and `currentAccessToken()->delete()` for logout
- Password reset uses Laravel's built-in `Password::broker()` facade

## Step-by-step implementation checklist

- [ ] Create `routes/api.php` with route group prefix `/api`:
  - `POST /auth/login` (no middleware)
  - `POST /auth/logout` (auth:sanctum)
  - `GET /auth/validate` (auth:sanctum)
  - `POST /auth/forgot-password` (no middleware, throttle:5,1)
  - `POST /auth/reset-password` (no middleware)
  - `GET /public/stats` (no middleware)
- [ ] Create `app/Http/Controllers/Api/AuthController.php` with methods: `login`, `logout`, `validate`, `forgotPassword`, `resetPassword`
- [ ] Create `app/Http/Requests/LoginRequest.php` — validates email, password. Checks credentials via `Auth::attempt()`. Returns 422 on failure.
- [ ] Implement `login()`:
  - Validate via LoginRequest
  - Check `$user->isActive` — if false return 403 "Account deactivated"
  - Create token: `$user->createToken('api')->plainTextToken`
  - Return token + user data
- [ ] Implement `logout()`:
  - `request()->user()->currentAccessToken()->delete()`
  - Return success message
- [ ] Implement `validate()`:
  - Return user data from `request()->user()`
  - Handle 401 via Sanctum middleware automatically
- [ ] Implement `forgotPassword()`:
  - Validate email exists
  - Send password reset link via `Password::sendResetLink()`
  - Return 200 (always say sent to prevent email enumeration)
- [ ] Implement `resetPassword()`:
  - Validate token + email + password + password_confirmation
  - Call `Password::reset()` with callback to save hashed password
  - Return 200
- [ ] Create `app/Http/Controllers/Api/PublicStatsController.php` with single method `stats`:
  - Count: `Project::where('status', 'ACTIVE')->count()`
  - Count: `Document::where('published', true)->count()`
  - Count: `Division::count()`
  - Return as `{ data: { ... } }`
- [ ] Create `app/Policies/UserPolicy.php` (stub — gates for Admin only, full implementation in Task 023):
  - `viewAny`: Admin only
  - `create`: Admin only
  - `update`: Admin only
  - `deactivate`: Admin only
- [ ] Register `UserPolicy` in `AuthServiceProvider`
- [ ] Add `isActive` and `divisionId` to User model `$fillable`
- [ ] Ensure User model uses `HasApiTokens` (Sanctum) and `Notifiable` traits
- [ ] Add `avatarInitials` auto-generation to User model (booted `creating` event: set from first letters of fullName)
- [ ] Test all auth endpoints with manual curl/Postman or PHPUnit tests
- [ ] Test that inactive user gets 403 on login
- [ ] Test that expired/invalid token gets 401 on validate
- [ ] Test public stats endpoint returns correct counts

## Definition of done

- `POST /api/auth/login` returns token + user data for valid credentials
- `POST /api/auth/login` returns 422 for wrong credentials
- `POST /api/auth/login` returns 403 for inactive user
- `POST /api/auth/logout` with valid token returns 200 and revokes token
- `GET /api/auth/validate` with valid token returns user data
- `GET /api/auth/validate` with expired token returns 401
- `GET /api/public/stats` returns active project count, published doc count, division count
- `POST /api/auth/forgot-password` sends email with reset link (testable via mail trap)
- `POST /api/auth/reset-password` successfully changes password
- All routes are registered under `/api` prefix
- Auth-related PHPUnit tests pass

## Open questions / assumptions inherited

- **Forgot password flow** — No wireframe exists. Implement Laravel's built-in flow as described in `09-open-questions-and-assumptions.md`.
- **Inactive user check** — `isActive` field on User model; inactive users receive 403 on login attempt.
- **SECRETARY/ADMIN division** — All users have a `divisionId` even if their role is not division-scoped.
