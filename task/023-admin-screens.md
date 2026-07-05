# Task 023: Admin Screens (Backend + Frontend)

**Status:** Not Started
**Depends on:** 004, 006
**Docs referenced:** `docs/01-roles-and-permissions.md` (Admin section), `docs/09-open-questions-and-assumptions.md` (Admin screens not specified)

## Objective

Build the Admin workspace: backend endpoints for user/division/activity-type management and two frontend screens (User Management + Settings). These screens have no wireframe but are essential for system operation.

## Context

Administrators manage users and system configuration. The backend endpoints serve both the Admin UI and other screens (e.g., activity type listing). User Management is the Admin's landing screen after login. Settings provides CRUD for reference data (divisions, activity types). Layout is the implementer's interpretation following the assumptions in the open questions doc.

## Scope

**In scope:**
- Backend: User CRUD endpoints (list, create, update, reset password)
- Backend: Division CRUD endpoints (list, create, update, delete)
- Backend: ActivityType CRUD endpoints (list, create, update, delete)
- Frontend: User Management page (`/users`): table, create modal, deactivate/reactivate, reset password
- Frontend: Settings page (`/settings`): tabs for Divisions and Activity Types management

**Out of scope:**
- Any non-Admin screens
- Any business logic beyond CRUD

## Relevant API contract

### User Management
- `GET /api/users` (Admin only) — list all users with role, division, status
- `POST /api/users` (Admin only) — create user
- `PATCH /api/users/:id` (Admin only) — update `isActive`, `role`, `divisionId`
- `POST /api/users/:id/reset-password` (Admin only) — reset password (send reset link or set new password)

### Division Management
- `GET /api/divisions` — list
- `POST /api/divisions` (Admin only) — create
- `PUT /api/divisions/:id` (Admin only) — update
- `DELETE /api/divisions/:id` (Admin only) — delete (if no dependencies)

### Activity Type Management
- `GET /api/activity-types` — list (all roles)
- `POST /api/activity-types` (Admin only) — create
- `PUT /api/activity-types/:id` (Admin only) — update
- `DELETE /api/activity-types/:id` (Admin only) — delete

### Document Type Management (if applicable)
- Document types are enum-based — Admin may toggle available types in Settings (stretch goal)

## Relevant frontend behavior

### User Management
- Table: email, fullName, role badge, division, active/inactive toggle, actions
- Create user modal: email, fullName, role dropdown, division dropdown, password
- Row actions: deactivate/reactivate toggle (instant PATCH), reset password (confirm → POST → toast)

### Settings
- Tab navigation: Divisions | Activity Types
- Divisions tab: table with name + head (user dropdown), inline edit, add new, delete (with confirm, disable if dependencies)
- Activity Types tab: table with name + slug, inline edit, add new, delete

## Architectural conventions that apply

- All endpoints use `UserPolicy` to restrict to Admin only
- Layout uses existing shell components (sidebar, nav, etc.)
- Delete operations for reference data show confirmation
- Form submissions use existing FormRequest validation patterns

## Step-by-step implementation checklist

**Backend:**
- [ ] Create `app/Http/Controllers/Api/UserManagementController.php` with: `index`, `store`, `update`, `resetPassword`
- [ ] Create `app/Http/Requests/StoreUserRequest.php` — validates email (unique), fullName, role, divisionId, password
- [ ] Create `app/Http/Requests/UpdateUserRequest.php` — validates isActive, role, divisionId
- [ ] Implement `UserPolicy` fully: `viewAny` (Admin), `create` (Admin), `update` (Admin)
- [ ] Create `app/Http/Controllers/Api/DivisionController.php` — CRUD for Division model (index all roles, create/update/delete Admin only)
- [ ] Create `app/Http/Requests/StoreDivisionRequest.php`
- [ ] Create `app/Http/Requests/UpdateDivisionRequest.php`
- [ ] Create or extend `app/Http/Controllers/Api/ActivityTypeController.php` — CRUD (GET all roles, create/update/delete Admin only)
- [ ] Create `app/Http/Requests/StoreActivityTypeRequest.php`
- [ ] Create `app/Http/Requests/UpdateActivityTypeRequest.php`
- [ ] Register all admin routes in `routes/api.php` with `auth:sanctum` and `can:viewAny,App\Models\User` or policy gates

**Frontend:**
- [ ] Create `resources/js/pages/admin/UserManagement.jsx`:
  - Fetch users on mount, table with all fields
  - Create user modal
  - Deactivate/reactivate toggle
  - Reset password action
- [ ] Create `resources/js/pages/admin/Settings.jsx`:
  - Tabs: Divisions, Activity Types
  - Each tab: list with CRUD modal/forms
- [ ] Create `resources/js/components/admin/UserFormModal.jsx`
- [ ] Create `resources/js/components/admin/DivisionManager.jsx`
- [ ] Create `resources/js/components/admin/ActivityTypeManager.jsx`
- [ ] Add routes: `/users` → UserManagement, `/settings` → Settings
- [ ] Wire sidebar links for ADMIN role

## Definition of done

- Admin can view all users in a table
- Admin can create a new user with role and division assignment
- Admin can deactivate/reactivate a user (toggle updates immediately)
- Admin can reset a user's password (sends reset link or sets new password)
- Admin can view, create, update, and delete divisions
- Admin can view, create, update, and delete activity types
- Delete operations show confirmation and handle dependency errors
- All operations enforce Admin-only authorization

## Open questions / assumptions inherited

- **No wireframe exists** for Admin screens. Layout and UX are implementer's discretion per the minimum viable capability defined in `01-roles-and-permissions.md` and `09-open-questions-and-assumptions.md`.
- **Document types** are enum-based; Admin settings for document types may be deferred if enums are hardcoded. The Settings screen should show them as read-only or allow enabling/disabling.
