# SKMS / FPMS — Project Handoff

## Quick Facts

| Field | Value |
|-------|-------|
| **Stack** | Laravel 11 (PHP 8.4) + React/Vite + MySQL |
| **Auth** | Laravel Sanctum (token mode) |
| **Database** | MySQL 8.0+ via XAMPP (local), cPanel (production) |
| **Queue** | `database` driver (no Redis) |
| **File storage** | Local disk (dev), S3-compatible (prod) |
| **CI** | GitHub Actions (`.github/workflows/tests.yml`) |
| **Deployment** | cPanel (primary), Docker (future) |

## Task Status (14/28 Done)

**✅ Done:** 001 (Scaffold), 002 (Schema/Models), 003 (API Conventions), 004 (Auth Backend), 005 (Auth Frontend), 006 (Shell/Global), 008 (Projects Backend), 009 (Activities Backend), 010 (Documents Backend), 011 (Reports Backend), 012 (Publications Backend), 027 (Offline Support), 028 (CI/Hardening)

**❌ Remaining:** 007 (Inbox), 013 (Stats Backend), 014 (Dashboard/Project Directory), 015 (Project Detail), 016 (Log Activity), 017 (Submit Report), 018 (Report Queue), 019 (Division Dashboard), 020 (Executive Dashboard), 021 (Library Frontend), 022 (Publications Frontend), 023 (Admin Screens), 024 (AI Assistant Backend), 025 (AI Assistant Frontend), 026 (Scheduled Commands)

Full dependency graph in `task/000-index.md`. Each task file at `task/task_NN.md` is self-contained with DoD.

## Architecture Conventions (Must Follow)

All enforced by Tasks 003–004. See `docs/04b-backend-architecture.md`:

- **Responses:** Extend `CamelCaseResource` (snake_case → camelCase). Use `BaseResource::paginated()` for lists.
- **Requests:** Extend `ApiRequest` (camelCase inputs auto-converted to snake_case before validation).
- **Business logic:** `app/Actions/{Entity}/` classes. Controllers are thin — validate via FormRequest, delegate to Action, return Resource.
- **Auth:** `$this->authorize()` via Policy classes. No inline role checks.
- **Side effects:** Fire Events → Listeners handle Notifications/Jobs.
- **Queue:** `QUEUE_CONNECTION=database`. Slow work → Queued Jobs.

### Key Infrastructure Classes

| Class | Path | Purpose |
|-------|------|---------|
| `CamelCaseResource` | `app/Http/Resources/CamelCaseResource.php` | Recursive camelCase JSON key conversion |
| `BaseResource` | `app/Http/Resources/BaseResource.php` | Pagination envelope + HasMessage trait |
| `ApiRequest` | `app/Http/Requests/ApiRequest.php` | camelCase→snake_case input transformation |
| `FileStorageInterface` | `app/Contracts/FileStorageInterface.php` | File storage abstraction (`store`, `get`, `delete`, `url`) |
| `AiRetrievalInterface` | `app/Contracts/AiRetrievalInterface.php` | AI query abstraction (`query(string, array): AiQueryResult`) |
| `ReportRepositoryInterface` | `app/Contracts/ReportRepositoryInterface.php` | Report data access abstraction |
| `AiQueryResult` | `app/Contracts/AiQueryResult.php` | Readonly DTO: `canAnswer`, `answer`, `citations`, `followUpPrompts` |

### Existing Action Pattern (follow for new tasks)

Each entity backend follows this layout:

```
app/Actions/{Entity}/{Verb}Action.php        # Single-purpose action class
app/Http/Requests/{Verb}{Entity}Request.php   # FormRequest extending ApiRequest
app/Http/Resources/{Entity}Resource.php       # Resource extending CamelCaseResource
app/Http/Controllers/{Entity}Controller.php   # Thin controller
app/Policies/{Entity}Policy.php               # Authorization via $this->authorize()
app/Events/{Entity}{Action}.php               # Dispatched by actions
app/Listeners/{Entity}{Action}.php            # Handles side effects
app/Notifications/{Entity}{Action}.php        # Database-channel notifications
```

## Routes

Split into individual files under `routes/`:

| File | Contents |
|------|----------|
| `api.php` | Requires all route files below |
| `auth.php` | Public stats + login/forgot-password/reset-password + logout/validate |
| `projects.php` | Project CRUD + members + access requests |
| `activities.php` | Activity CRUD + activity types |
| `documents.php` | Document CRUD + upload to activity + download/preview |
| `reports.php` | Report draft/submit + approve/return/escalate |
| `publications.php` | Publication CRUD + pipeline stats |
| `inbox.php` | Inbox listing + mark read + forward |
| `library.php` | Library stats + browse + search |
| `divisions.php` | Division stats + researcher activity + activity feed |
| `institute.php` | Institute stats + funding breakdown + compliance + alerts |
| `admin.php` | Admin user CRUD + division CRUD + activity-type CRUD |
| `dashboard.php` | Dashboard stats |
| `web.php` | Password reset named route for notification URL generation |
| `console.php` | Artisan command schedules |

## Controllers — Refactoring Status

| Controller | Status | Notes |
|------------|--------|-------|
| `Api/AuthController` | Refactored ✅ | Uses LoginAction, LoginRequest, UserResource |
| `Api/ProjectController` | Refactored ✅ | Uses Actions, Resources, Requests, Events |
| `Api/AccessRequestController` | Created ✅ | Uses UpdateAccessRequestRequest |
| `Api/PublicStatsController` | Refactored ✅ | Uses StatsAction |
| `ActivityController` | Refactored ✅ | Uses Actions, Resources, Events |
| `DocumentController` | Refactored ✅ | Uses Actions, Resources, FileStorageService |
| `ReportController` | Refactored ✅ | Uses Actions, Resources, Events/Listeners/Notifications |
| `PublicationController` | Refactored ✅ | Uses Actions, Resources |
| `LibraryController` | Refactored ✅ | Uses Actions, Resources |
| `DashboardController` | Raw ⚠️ | Inline logic — needs refactoring (Task 013) |
| `DivisionController` | Raw ⚠️ | Inline logic — needs refactoring (Task 013/019) |
| `InstituteController` | Raw ⚠️ | Inline logic — needs refactoring (Task 013/020) |
| `InboxController` | Raw ⚠️ | Inline logic — needs refactoring (Task 007) |
| `AdminController` | Raw ⚠️ | Inline logic — needs refactoring (Task 023) |
| `ActivityTypeController` | Simple ✅ | Single `index()` lookup |

## Test Status

- **Backend:** 115 PHPUnit tests, 247 assertions — all passing
- **Frontend:** 109 Vitest tests across 21 test files — all passing
- **Run:** `php8.4 artisan test` (backend), `npm run test` (frontend)
- **Suite** includes: Auth, Admin, Project, Activity, Document, Library, Report, Publication, Inbox, Dashboard, Division, Institute, Model, RateLimiting, API Conventions, CamelCaseResource tests

## Frontend Structure

```
resources/js/
├── api/axios.js                       # Auth-aware Axios with 401 interceptor
├── components/
│   ├── auth/
│   │   ├── ProtectedRoute.jsx         # Redirects /login if unauthenticated
│   │   └── PublicRoute.jsx            # Redirects to role landing if authenticated
│   └── layout/
│       ├── AppShell.jsx               # Main layout: sidebar + navbar + <Outlet>
│       ├── Sidebar.jsx                # Role-aware navigation sidebar
│       ├── TopNav.jsx                 # Top bar with actions, bell, avatar
│       ├── BottomTabBar.jsx           # Mobile <768px bottom navigation
│       ├── NotificationBell.jsx       # Unread badge + dropdown (polls /api/inbox)
│       ├── AvatarDropdown.jsx         # User initials + profile/logout
│       ├── FloatingAIButton.jsx       # Gold circle, hover expands
│       ├── AIPanel.jsx                # Slide-in panel (placeholder)
│       ├── ErrorBoundary.jsx          # React crash fallback
│       ├── OfflineIndicator.jsx       # Connection status indicator
│       └── getSidebarItems.js         # Role → menu item mapping
├── contexts/
│   ├── AuthContext.jsx                # Token storage, login/logout, validate on mount
│   ├── NotificationContext.jsx        # Unread count, 60s polling
│   └── AIContext.jsx                  # AI panel open/close state
├── hooks/
│   ├── useOnlineStatus.js             # navigator.onLine listener
│   ├── useDraftSave.js                # localStorage draft auto-save
│   └── useAiQuestionQueue.js          # Offline AI question queue + reconnect submit
├── pages/
│   ├── Login.jsx                      # WF02: brand panel + form + forgot pw
│   ├── Dashboard.jsx                  # Placeholder (WF03)
│   ├── ProjectDirectory.jsx           # Placeholder (WF04a)
│   ├── ProjectDetail.jsx              # Placeholder (WF04b)
│   ├── LogActivity.jsx                # Placeholder (WF05a)
│   ├── MyActivities.jsx               # Placeholder (WF05b)
│   ├── SubmitReport.jsx               # Placeholder (WF06a)
│   ├── MyReports.jsx                  # Placeholder (WF06b)
│   ├── ReportQueue.jsx                # Placeholder (WF07a)
│   ├── ReviewReport.jsx               # Placeholder (WF07b)
│   ├── DivisionDashboard.jsx          # Placeholder (WF08)
│   ├── ExecutiveDashboard.jsx         # Placeholder (WF09)
│   ├── Library.jsx                    # Placeholder (WF10)
│   ├── MyPublications.jsx             # Placeholder (WF11)
│   ├── NewPublication.jsx             # Placeholder (WF11)
│   ├── Inbox.jsx                      # Placeholder (WF12)
│   ├── Users.jsx                      # Placeholder (Admin)
│   ├── Divisions.jsx                  # Placeholder (Admin)
│   ├── Settings.jsx                   # Placeholder (Admin)
│   └── Placeholder.jsx                # Generic "Coming soon" component
├── services/
│   ├── axios.js                       # Base Axios (used by offline queue)
│   ├── offlineQueue.js                # IndexedDB queue + FIFO replay
│   └── draftStorage.js                # localStorage save/load/clear
├── App.jsx                            # Router + AuthProvider + NotificationProvider + AIContextProvider + ErrorBoundary + AppShell
├── app.jsx                            # Entry point (mounts <App />)
├── app.css                            # Global styles + mobile breakpoints
└── test-setup.js                      # @testing-library/jest-dom matchers
```

## Frontend Route Table

| Path | Component | Roles |
|------|-----------|-------|
| `/login` | `Login` | Unauthenticated only |
| `/` | Redirects to role-based landing | All authenticated |
| `/dashboard` | `Dashboard` | All |
| `/projects` | `ProjectDirectory` | All |
| `/projects/new` | `NewProject` | Researcher, Student, DivisionHead |
| `/projects/:id` | `ProjectDetail` | All (with access) |
| `/activities/log` | `LogActivity` | Researcher, Student, DivisionHead |
| `/activities` | `MyActivities` | All |
| `/reports/submit` | `SubmitReport` | Researcher, Student, DivisionHead |
| `/reports` | `MyReports` | All |
| `/queue` | `ReportQueue` | Secretary |
| `/reviews/:id` | `ReviewReport` | Secretary |
| `/submissions` | `MyReports` | Secretary |
| `/library` | `Library` | All |
| `/publications` | `MyPublications` | All |
| `/publications/new` | `NewPublication` | Researcher, Student |
| `/inbox` | `Inbox` | All |
| `/division` | `DivisionDashboard` | DivisionHead |
| `/executive` | `ExecutiveDashboard` | Management |
| `/users` | `Users` | Admin |
| `/divisions/manage` | `Divisions` | Admin |
| `/settings` | `Settings` | Admin |

## Key Document References

| File | What It Covers |
|------|----------------|
| `docs/00-product-overview.md` | System purpose, capabilities, non-goals |
| `docs/01-roles-and-permissions.md` | Role × capability matrix |
| `docs/02-data-model.md` | All entities, fields, enums, Mermaid ERD |
| `docs/03-api-reference.md` | Complete REST API contract (40+ endpoints) |
| `docs/04-frontend-architecture.md` | Routing, state, forms, mobile breakpoints |
| `docs/04b-backend-architecture.md` | SOLID layout, request lifecycle, conventions |
| `docs/05-screens/` | One file per wireframe (WF01–WF13) |
| `docs/06-ai-assistant.md` | "Ask SKMS" retrieval + citation model |
| `docs/07-non-functional-requirements.md` | Security, offline, backup, performance |
| `docs/08-glossary.md` | Domain terms and status values |
| `docs/09-open-questions-and-assumptions.md` | Gaps and unresolved decisions |
| `docs/10-traceability-matrix.md` | Wireframe → endpoint audit table |
| `docs/product-deployment.md` | cPanel + Docker deployment guide |
| `HANOFF.md` | This file |

## Migrations (18 total)

All run with `php8.4 artisan migrate:fresh --seed`. Tables created:

`users`, `password_reset_tokens`, `sessions`, `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`, `personal_access_tokens`, `notifications`, `divisions`, `projects`, `project_members`, `activity_types`, `activities`, `documents`, `document_texts`, `reports`, `report_comments`, `publications`, `inbox_items`, `access_requests`

All foreign keys, composite indexes, and FULLTEXT indexes on `documents.filename` and `document_texts.content` are in place.

## Models & Enums

**Models (12):** User, Division, Project, ProjectMember, Activity, ActivityType, Document, Report, ReportComment, Publication, InboxItem, AccessRequest

**Enums (11):** UserRole, ProjectStatus, ProjectMemberRole, ActivityType (via seeder), DocumentType, ReportType, ReportStatus, PublicationType, PublicationStatus, InboxItemType, AccessRequestStatus, FundingType

## Environment

- **PHP 8.4** at `/usr/bin/php8.4`
- **MySQL** via XAMPP at `/opt/lampp/` — start with:
  ```bash
  /opt/lampp/sbin/mysqld --user=the-goated-mufasa --datadir=/opt/lampp/var/mysql \
    --socket=/opt/lampp/temp/mysql.sock --port=3306 --skip-grant-tables &
  ```
- **MySQL client:** `/opt/lampp/bin/mysql -u root -h 127.0.0.1 -P 3306`
- **Database:** `skms` at 127.0.0.1:3306, root/no password
- **Node/npm** available at standard paths
- **Composer** and **npm** deps already installed

## Quick Start for a New Agent

```bash
# 1. Start MySQL (if not running)
/opt/lampp/sbin/mysqld --user=the-goated-mufasa --datadir=/opt/lampp/var/mysql \
  --socket=/opt/lampp/temp/mysql.sock --port=3306 --skip-grant-tables &
sleep 3

# 2. Run all tests
php8.4 artisan test

# 3. Run specific task tests
php8.4 artisan test --filter=ProjectTest

# 4. Read a task and implement it
cat task/007-inbox-system.md

# 5. After implementing, run full suite to check regressions
php8.4 artisan test
```

## Known Gotchas

1. **Laravel 11 uses `bootstrap/app.php`** for exception handling and middleware config, not `app/Exceptions/Handler.php`.
2. **Refreshing test DB** — `RefreshDatabase` trait drops all tables. Running the full test suite sequentially is fine; parallel PHPUnit processes can cause transient migration race conditions. Single-test runs always pass.
3. **All responses are camelCase** — enforced by `CamelCaseResource`. New endpoints and resources MUST extend it.
4. **Nullable validated fields** — Laravel's `validate()` only returns keys present in input. Use `$validated['field'] ?? null` for optional fields.
5. **No SQLite extension** — must use MySQL for all test and dev work.
6. **180+ uncommitted files** — `git status` shows all work done across all tasks. Commits managed per task-completion batch. The working tree is clean enough to continue building on top of.
7. **Events need explicit registration** — Laravel 11 requires events/listeners to be mapped in `AppServiceProvider::boot()` or a dedicated `EventServiceProvider` (already created for Report events).
