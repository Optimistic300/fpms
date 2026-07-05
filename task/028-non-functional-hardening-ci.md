# Task 028: Non-Functional Hardening, Testing & CI

**Status:** Not Started
**Depends on:** 001
**Docs referenced:** `docs/07-non-functional-requirements.md`, `docs/01-roles-and-permissions.md`, `docs/09-open-questions-and-assumptions.md`

## Objective

Harden the application for production: performance optimization, security audit, backup configuration, comprehensive test suite, and CI pipeline setup. This is the final task that wraps all feature work with quality, safety, and operational readiness.

## Context

The system must be secure, performant, and maintainable. All permission checks must be server-side. File uploads must be validated by MIME type and size. The system must handle concurrent users, database backups, and deployment automation. This task also establishes the testing patterns and CI pipeline that enforce quality going forward.

## Scope

**In scope:**
- **Testing:** Establish test architecture (PHPUnit for backend, Vitest for frontend), write end-to-end feature tests covering all API endpoints and role/permission scenarios, write frontend component tests for key screens
- **Security audit:** Verify all endpoints enforce authorization via Policies (no inline role checks), verify inactive users blocked, verify file upload MIME/size enforcement, verify Sanctum token protection, rate limiting on login endpoint, CORS configuration
- **Performance:** Database query optimization (add missing indexes, eager loading), N+1 query audit, pagination limits enforced
- **Backup:** Database backup configuration (MySQL daily), storage backup configuration (S3 replication), retention policy documented
- **CI pipeline:** GitHub Actions (or equivalent) workflow: `composer install → npm install → lint → php artisan test → npm run test`
- **Environment configuration:** Production `.env` checklist, APP_DEBUG=false, QUEUE_CONNECTION=database, mail config, S3 config

**Out of scope:**
- Performance benchmarking beyond N+1 detection (no load testing for v1)
- Infrastructure provisioning (server setup, S3 bucket creation, RDS setup)
- Real-time delivery (WebSockets — architecturally supported but not implemented in v1)

## Step-by-step implementation checklist

**Testing Backend:**
- [ ] Create `phpunit.xml` configuration (ensure in-memory SQLite or test MySQL database)
- [ ] Write feature tests for AUTH endpoints: login (valid, invalid, inactive user), logout, validate, forgot-password flow
- [ ] Write feature tests for PROJECTS endpoints: CRUD, filter, search, member management, access requests, role-based access (verify RESEARCHER can create, SECRETARY cannot, etc.)
- [ ] Write feature tests for ACTIVITIES endpoints: CRUD, filters, CSV export, document upload
- [ ] Write feature tests for DOCUMENTS endpoints: upload, download, preview, publish, delete, access control
- [ ] Write feature tests for REPORTS endpoints: draft, submit, approve, return, escalate, resubmission, history, role access
- [ ] Write feature tests for PUBLICATIONS endpoints: CRUD, pipeline counts, DOI validation
- [ ] Write feature tests for INBOX endpoints: list, read, read-all, forward
- [ ] Write feature tests for STATS endpoints: dashboard, division, institute
- [ ] Write feature tests for scheduled commands: overdue calculation, deadline alerts
- [ ] Write feature tests for ADMIN endpoints: user management, division CRUD, activity type CRUD
- [ ] Write feature tests for every role/permission combination in the matrix (`01-roles-and-permissions.md`)
- [ ] Write model tests for custom attributes, casts, relationships, scopes

**Testing Frontend:**
- [ ] Configure Vitest with React Testing Library
- [ ] Write component tests for critical shared components (Sidebar role rendering, StatCard, Multi-step form navigation)
- [ ] Write integration tests for key user flows (login → dashboard, login → reports, secretary queue → approve)

**Security:**
- [ ] Audit all routes: verify every route has `auth:sanctum` middleware where required
- [ ] Audit all controller methods: verify `$this->authorize()` calls exist where needed
- [ ] Verify inactive user receives 403 on login attempt
- [ ] Verify file upload validates MIME type (sniffing, not just extension)
- [ ] Verify file upload validates max size (25MB activity, 50MB report/publication)
- [ ] Verify Sanctum token expiration is configured (e.g., 24h default or long-lived with config)
- [ ] Add rate limiting: `RateLimiter::for('login', fn => Limit::perMinute(5))`
- [ ] Verify CORS is configured correctly for production (same-origin, no wildcard)
- [ ] Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy` (basic)

**Performance:**
- [ ] Audit all list endpoints for N+1 queries (eager load relationships used in resources)
- [ ] Add `->withCount()` where counts are returned alongside list items (e.g., documentCount on activities)
- [ ] Verify all paginated endpoints enforce a maximum page size (e.g., `min($limit, 100)`)
- [ ] Add database indexes for frequently queried columns: `reports.status`, `reports.submitted_at`, `documents.published`, `documents.project_id`, `activities.project_id`, `activities.user_id`, `inbox_items.user_id`
- [ ] Verify FULLTEXT index exists on `document_texts.content` and `documents.filename`

**Backup & Operations:**
- [ ] Create `config/backup.php` or document backup strategy in README:
  - `mysqldump` command for daily database backup
  - S3-compatible storage with cross-region replication for file storage
  - 30-day daily retention, 12-month monthly retention
- [ ] Document deployment steps in README: `php artisan migrate`, `php artisan storage:link`, queue worker setup, scheduler setup

**CI Pipeline:**
- [ ] Create `.github/workflows/tests.yml` (or equivalent):
  - Trigger: push to main, pull request to main
  - Jobs: `composer install --no-interaction`, `npm ci`, `npm run build`, `php artisan key:generate`
  - Run `php artisan migrate --env=testing` (SQLite or MySQL service)
  - Run `php artisan test` (backend)
  - Run `npm run test` (frontend)
  - Add linting step: `npm run lint` (ESLint) if configured
- [ ] Create `.env.example` with all required environment variables documented

## Definition of done

- `php artisan test` passes with all feature tests (100+ tests covering all endpoints, roles, and permissions)
- `npm run test` passes with frontend component tests
- All route policies verified (no controller with inline role checks)
- File upload validation passes for allowed types, rejects disallowed types and oversized files
- Login rate limiting (5 attempts per minute) enforced
- No N+1 queries in any list endpoint (verified by Debugbar or query logging)
- CI pipeline runs on push/PR and all tests pass
- Inactive user cannot log in
- Sanctum token authentication works with proper 401 responses
- Database backup and storage backup procedures documented
- `.env.example` contains all required variables with documentation

## Open questions / assumptions inherited

- **Performance thresholds** (2s dashboard, 3s search, 1.5s list) from `07-non-functional-requirements.md` should be verified but formal load testing is out of scope for v1.
- **Backup configuration** is documented but actual infrastructure setup (S3 buckets, RDS automated backups) is outside this task's scope.
