# FPMS Handoff — Session Summary

## What Was Done in This Session

### 1. Email Notification Support (Notification System)
- Added `toMail()` methods + updated `via()` to `['database', 'mail']` on all 4 notification classes:
  - `ReportSubmittedNotification`
  - `ReportStatusChangedNotification`
  - `DocumentForwardedNotification`
  - `AccessRequestNotification`
- Added `routeNotificationForMail()` to `User` model
- Fixed `config/mail.php` default from address → `notifications@forig.org`
- Created `ProjectMemberAddedNotification` (DB + mail)
- Created `SendProjectMemberNotification` listener (fixed orphaned `ProjectMemberAdded` event)
- Created `NotifyProjectMembersOnActivity` listener (fixed orphaned `ActivityLogged` event)
- Updated `EventServiceProvider` with new listeners

### 2. Backend Foundation (Group 1)
- Created `database/seeders/UserSeeder.php` — seeds 6 users (one per role)
- Updated `DatabaseSeeder.php` to call `UserSeeder`
- Added `publications()` relationship to `Project` model
- Fixed `ReportComment` timestamps (removed `$timestamps = false`)
- Fixed `InboxItem` timestamps (removed `$timestamps = false`)

### 3. Authorization Fixes (Group 2)
- Created `app/Policies/AccessRequestPolicy.php`
- Registered it in `AuthServiceProvider`
- Fixed `InstituteController` → `$this->authorize('viewInstitute')`
- Fixed `DivisionController` → `$this->authorize('view', $division)`
- Fixed `ActivityController::store()` → `$this->authorize('manageActivities', $project)`
- Fixed `AccessRequestController` → `$this->authorize('update', $accessRequest)`
- Cleaned up `AuthServiceProvider` gates

### 4. Cleanup (Group 3)
- Deleted 3 unused duplicate controllers (AuthController, ProjectController, PublicController in base dir)
- Created 4 Form Requests: ForgotPasswordRequest, ResetPasswordRequest, SearchLibraryRequest, ResetAdminPasswordRequest
- Wired Form Requests into AuthController, LibraryController, AdminController
- Fixed `AiResponseResource` → extends `CamelCaseResource`
- Fixed `SubmitReportAction` → uses `Storage::disk('local')->put()` instead of `file_put_contents()`

### 5. Jobs (Group 4)
- Created `app/Jobs/ProcessDocumentUpload.php` — queued file storage
- Created `app/Jobs/SendBulkNotifications.php` — queued batch notifications
- Implemented `app/Repositories/ReportRepository.php` — replaced stubs with real Eloquent queries

### 6. Controller Refactoring (Group 5)
- Refactored `ReportController` → uses `ReportRepository` for index/stats
- Changed `ReportController::store/saveDraft/update` → return `ReportResource`
- Changed `ProjectController::store/update` → return `ProjectResource`
- Changed `ActivityController::store` → return `ActivityResource`
- Changed `DocumentController::uploadToActivity/update` → return `DocumentResource`

### 7. Frontend Fixes (Group 6)
- Added `allowedRoles` prop to `ProtectedRoute.jsx`
- Added role arrays to all routes in `App.jsx`
- Consolidated Axios to single instance in `resources/js/api/axios.js`
- Deleted duplicate `resources/js/services/axios.js`
- Fixed AI endpoint `/api/ai/ask` → `/ai/query` in `offlineQueue.js`
- Mobile bottom tab bar already existed and was working
- `beforeunload` warnings already existed in LogActivity + SubmitReport

---

## What's Still Left (6 items)

### Minor Code Items (3)

1. **`DashboardController::stats()`** — returns inline array, should use API Resource or proper envelope
2. **`PublicStatsController::stats()`** — same issue
3. **`AdminController`** — uses `$this->authorize('create', User::class)` for division/activity-type CRUD; should use `Gate::authorize('manageUsers')` instead (semantically correct, functionally works)

### Documentation Gaps (3)

4. **`docs/02-data-model.md`** — missing `DocumentText` entity and `Report.is_overdue` field
5. **`docs/03-api-reference.md`** — missing `POST /api/auth/forgot-password` and `POST /api/auth/reset-password` endpoints

### Frontend Stub Pages (2)

6. **`NewProject.jsx`** — stub ("Coming soon"), but `NewProjectModal` on Project Directory handles creation. Either implement full page or remove route.
7. **`SubmissionHistory.jsx`** — stub ("Coming soon"), not in docs routing table. Can remove route.

---

## Vite Preamble Error Fix

The `@vitejs/plugin-react` preamble error happens because the Vite dependency cache (`node_modules/.vite/deps`) is stale after our file changes.

**Fix:**
1. Kill the Vite dev server (Ctrl+C)
2. `rm -rf node_modules/.vite/deps`
3. `npm run dev`

---

## Key Architecture Notes

- **Backend:** Laravel + Sanctum + MySQL, SOLID architecture with Actions/Services/Contracts/Events/Listeners
- **Frontend:** React 19 + Vite 8 + React Router v7
- **Auth:** Token-based (localStorage), role-based access via Policies
- **All 18 functional pages are fully implemented** (Login, Dashboard, Projects, Activities, Reports, Queue, Division, Executive, Library, Publications, Inbox, Users, Settings)
- **2 stub pages:** NewProject.jsx, SubmissionHistory.jsx

## User Credentials (for testing)

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@forig.org | password |
| RESEARCHER | researcher@forig.org | password |
| STUDENT | student@forig.org | password |
| SECRETARY | secretary@forig.org | password |
| DIVISION_HEAD | division_head@forig.org | password |
| MANAGEMENT | management@forig.org | password |

---

## Commands to Run After New Session

```bash
# Clear Vite cache
rm -rf node_modules/.vite/deps

# Start dev server
npm run dev

# Run tests (requires MySQL running)
php artisan test

# Run frontend tests
npm run test
```
