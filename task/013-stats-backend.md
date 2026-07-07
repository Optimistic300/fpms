# Task 013: Dashboard, Division & Institute Stats Backend

**Status:** Done

## Completion Notes
Completed 2026-07-07. Created DivisionRepository and InstituteService to encapsulate aggregation queries. Refactored DivisionController and InstituteController from inline logic to delegate to Repository/Service. DashboardController kept thin (no extraction needed). All 9 stat endpoints working with role authorization. Tests: 115 PHPUnit passing.
**Depends on:** 004, 008, 009, 011
**Docs referenced:** `docs/03-api-reference.md` (Dashboard, Divisions, Institute sections), `docs/05-screens/03-dashboard.md`, `docs/05-screens/08-division-dashboard.md`, `docs/05-screens/09-executive-dashboard.md`

## Objective

Implement all aggregated statistics endpoints: the dashboard stats for individual users, division-level stats/activity/researcher summaries for Division Heads, and institute-wide stats/summaries for Management. These are read-only aggregation endpoints that query the Projects, Activities, Reports, and Users data created by previous backend tasks.

## Context

The Dashboard (WF03), Division Dashboard (WF08), and Executive Dashboard (WF09) all need live statistics. These endpoints aggregate data across entities: project counts, activity frequencies, report status summaries, researcher summaries, and compliance percentages. They must be built after the entity backends (Projects, Activities, Reports) exist since they query them.

## Scope

**In scope:**
- `GET /api/dashboard/stats` — personal stats for RESEARCHER/STUDENT (totalProjects, ongoing, reportsPending, activitiesThisMonth)
- `GET /api/divisions/:divisionId/stats` — division stat cards (totalProjects, ongoing, reportsPending, reportsOverdue, activeResearchers)
- `GET /api/divisions/:divisionId/researcher-activity` — per-researcher summary for a division
- `GET /api/divisions/:divisionId/activity-feed` — chronological feed of activities + system alerts
- `GET /api/institute/stats` — institute-wide stat cards
- `GET /api/divisions/summary` — one row per division with compliance %, report summary
- `GET /api/institute/funding-breakdown` — project counts by funding type
- `GET /api/institute/compliance` — per-division compliance percentages
- `GET /api/institute/alerts` — system-generated institute alerts (report overdue, queue backlog, milestones)

**Out of scope:**
- Frontend screens (Tasks 014, 019, 020)
- Any mutation endpoints

## Relevant API contract

### `GET /api/dashboard/stats`
**Auth:** Required, **Roles:** RESEARCHER, STUDENT
**Response 200:** `{ data: { totalProjects, ongoing, reportsPending, activitiesThisMonth } }`

### `GET /api/divisions/:divisionId/stats`
**Auth:** Required, **Roles:** DIVISION_HEAD, MANAGEMENT
**Response 200:** `{ data: { totalProjects, ongoing, reportsPending, reportsOverdue, activeResearchers } }`

### `GET /api/divisions/:divisionId/researcher-activity`
**Auth:** Required, **Roles:** DIVISION_HEAD, MANAGEMENT
**Response 200:** `{ data: [{ researcherId, fullName, activeProjects, projects, activitiesThisMonth, documentsUploaded, reportStatus }] }`

### `GET /api/divisions/:divisionId/activity-feed`
**Auth:** Required, **Roles:** DIVISION_HEAD, MANAGEMENT
**Query Params:** `limit` (default 10)
**Response 200:** `{ data: [{ type, message, timestamp, link, severity? }] }`

### `GET /api/institute/stats`
**Auth:** Required, **Roles:** MANAGEMENT
**Response 200:** `{ data: { totalProjects, ongoing, divisionsActive, reportsPendingReview, reportsOverdue, libraryDocuments } }`

### `GET /api/divisions/summary`
**Auth:** Required, **Roles:** MANAGEMENT
**Response 200:** `{ data: [{ divisionId, divisionName, headName, totalProjects, ongoing, activeStaff, documentCount, reportStatusSummary, compliancePercent }] }`

### `GET /api/institute/funding-breakdown`
**Auth:** Required, **Roles:** MANAGEMENT
**Response 200:** `{ data: { donor: N, government: N, internal: N } }`

### `GET /api/institute/compliance`
**Auth:** Required, **Roles:** MANAGEMENT
**Response 200:** `{ data: [{ division, compliancePercent }] }`

### `GET /api/institute/alerts`
**Auth:** Required, **Roles:** MANAGEMENT
**Query Params:** `limit` (default 5)
**Response 200:** `{ data: [{ id, type, message, timestamp, link }] }`

## Architectural conventions that apply

- These are thin read-only endpoints. Business logic is in Repository or Service classes, not in controllers.
- `DivisionRepository` and `InstituteService` encapsulate the aggregation queries
- `DivisionController` and `InstituteController` each have multiple methods
- Stats are computed live (no caching for v1). If performance becomes an issue, add `Cache::remember()` in a future task.
- Compliance % = (approved reports on time / total expected reports) × 100 — computed per division
- Overdue report = PENDING status with submittedAt > 7 days ago
- Activity feed mixes actual activities (from activities table) with system alerts (from inbox_items where type=SYSTEM)

## Step-by-step implementation checklist

- [ ] Create `app/Repositories/DivisionRepository.php`:
  - `stats(divisionId)`: count projects by division (total, ongoing), reports pending/overdue, active researchers
  - `researcherActivity(divisionId)`: per-researcher summary query
  - `activityFeed(divisionId, limit)`: UNION of recent activities and department alerts
- [ ] Create `app/Services/InstituteService.php`:
  - `stats()`: aggregate counts across all divisions
  - `divisionSummaries()`: one row per division with computed compliance
  - `fundingBreakdown()`: project count grouped by fundingType
  - `compliance()`: per-division compliance percentages
  - `alerts(limit)`: query inbox_items where type=SYSTEM, return most recent
- [ ] Create `app/Http/Controllers/Api/DivisionController.php` with methods: `stats`, `researcherActivity`, `activityFeed`
- [ ] Create `app/Http/Controllers/Api/DashboardController.php` with method: `stats` (returns personal counts for auth user)
- [ ] Create `app/Http/Controllers/Api/InstituteController.php` with methods: `stats`, `divisionSummaries`, `fundingBreakdown`, `compliance`, `alerts`
- [ ] Implement `DashboardController@stats`:
  - Count projects where user is owner/lead: `Project::where('leadResearcherId', auth()->id())->count()`
  - Count where status=ACTIVE
  - Count reports where submittedBy=auth()->id() and status=PENDING
  - Count activities where userId=auth()->id() and date is this month
- [ ] Implement `DivisionController@stats`:
  - Use DivisionRepository
- [ ] Implement `DivisionController@researcherActivity`:
  - For each user in division, count active projects (as owner or member), list project titles, count activities this month, count documents uploaded, get latest report status
- [ ] Implement `DivisionController@activityFeed`:
  - Recent activities for projects in division + system alerts for division
- [ ] Implement `InstituteController@stats`:
  - Count all active projects, total ongoing, count distinct divisions with active projects, count pending reports, count overdue reports, count published documents
- [ ] Implement `InstituteController@divisionSummaries`:
  - For each division: aggregate project/report/document counts, compute compliance %
- [ ] Implement `InstituteController@fundingBreakdown`:
  - `Project::selectRaw('funding_type, count(*) as count')->groupBy('funding_type')->get()`
- [ ] Implement `InstituteController@compliance`:
  - For each division: percentage of reports submitted on time vs overdue
- [ ] Implement `InstituteController@alerts`:
  - Query recent system-type inbox items, or compute on-the-fly from report statuses
- [ ] Register routes in `routes/api.php`:
  - `GET /dashboard/stats`
  - `GET /divisions/{divisionId}/stats`
  - `GET /divisions/{divisionId}/researcher-activity`
  - `GET /divisions/{divisionId}/activity-feed`
  - `GET /institute/stats`
  - `GET /divisions/summary`
  - `GET /institute/funding-breakdown`
  - `GET /institute/compliance`
  - `GET /institute/alerts`
- [ ] Write tests: verify each endpoint returns correct counts with seeded data, authorization checks (wrong role gets 403)

## Definition of done

- `GET /api/dashboard/stats` returns personal counts for RESEARCHER/STUDENT
- `GET /api/divisions/:id/stats` returns division counts for DIVISION_HEAD and MANAGEMENT
- `GET /api/divisions/:id/researcher-activity` returns per-researcher rows
- `GET /api/divisions/:id/activity-feed` returns chronological mix of activities and system alerts
- `GET /api/institute/stats` returns institute-wide counts
- `GET /api/divisions/summary` returns one row per division with compliance
- `GET /api/institute/funding-breakdown` returns counts by funding type
- `GET /api/institute/compliance` returns per-division compliance percentages
- `GET /api/institute/alerts` returns recent alerts
- All endpoints enforce role authorization (non-MANAGEMENT gets 403 on institute endpoints; non-DIVISION_HEAD gets 403 on division endpoints)
- All responses use camelCase keys
- PHPUnit tests pass

## Open questions / assumptions inherited

- **Overdue definition:** 7+ days in PENDING status per `09-open-questions-and-assumptions.md`.
- **Compliance %:** Computed as approved-on-time vs. total expected. The exact formula may need refinement during pilot.
- **Activity feed** mixes real activities with system alerts — the feed link format is implementation-defined.
