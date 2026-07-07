# Task 011: Reports Backend

**Status:** Done
**Depends on:** 003, 004
**Docs referenced:** `docs/03-api-reference.md` (Reports section), `docs/02-data-model.md` (Report, ReportComment), `docs/01-roles-and-permissions.md`, `docs/04b-backend-architecture.md` (Worked example), `docs/07-non-functional-requirements.md`

## Objective

Implement the complete report submission pipeline: create drafts, submit reports, review/approve/return/escalate, resubmission with versioning, and full submission history tracking. Reports are the most workflow-heavy entity — they move through a formal state machine with audit trail, notifications, and the Secretary acting as gatekeeper.

## Context

Researchers create quarterly, mid-year, or annual reports. Reports start as drafts (saved mid-flow), then are submitted to the Scientific Secretary. The Secretary can approve, return with comments, or escalate to Management. Returned reports can be resubmitted (creating a new version linked to the original). Every state change is timestamped and attributed via ReportComment records.

## Scope

**In scope:**
- `POST /api/reports/draft` — save report as draft
- `POST /api/reports` — submit report (status → PENDING)
- `GET /api/reports` — list reports with filters (projectId, owner, status, division, type, submittedBy), sorting, pagination
- `GET /api/reports/stats` — Secretary queue stats (overdue, pending, approved, returned)
- `GET /api/reports/:id` — full detail with submission history (ReportComment timeline)
- `PATCH /api/reports/:id` — Secretary actions: approve, return, escalate
- `ReportPolicy` — authorization for all report operations
- `ReportResource` — with submitter name, project title, daysWaiting, history, file info
- Action classes: `SaveDraftAction`, `SubmitReportAction`, `ApproveReportAction`, `ReturnReportAction`, `EscalateReportAction`
- Event/Listener pairs for each state change:
  - `ReportSubmitted` → `SendReportSubmittedNotification`
  - `ReportApproved` → `SendReportStatusChangedNotification`
  - `ReportReturned` → `SendReportStatusChangedNotification`
  - `ReportEscalated` → `SendReportStatusChangedNotification`
- ReportComment records created for each state change

**Out of scope:**
- Report file upload (part of this task — file stored via `POST /api/reports` with base64-encoded PDF or separate upload endpoint)
- Submit Report multi-step frontend (Task 017)
- My Reports frontend (Task 017)
- Report Queue frontend (Task 018)
- Report Review frontend (Task 018)
- Overdue calculation scheduled command (Task 026)

## Relevant data model

### Report
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| projectId | bigint | FK |
| submittedBy | bigint | FK |
| type | enum | QUARTERLY, MID_YEAR, ANNUAL |
| periodStart | date | |
| periodEnd | date | |
| narrativeSummary | text | |
| filePath | varchar(500), nullable | PDF path |
| status | enum | DRAFT, PENDING, RETURNED, APPROVED, ESCALATED |
| parentReportId | bigint, nullable | FK self |
| version | int | Starts at 1 |
| comment | text, nullable | Secretary's comment |
| reviewedBy | bigint, nullable | FK |
| submittedAt | timestamp, nullable | |
| timestamps | | |

### ReportComment
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| reportId | bigint | FK |
| userId | bigint | FK |
| comment | text | |
| createdAt | timestamp | |

## Relevant API contract

### `POST /api/reports/draft`
**Auth:** Required, **Roles:** RESEARCHER, STUDENT, DIVISION_HEAD
**Request:** Same as POST (all optional for draft)
**Response 201:** `{ data: { id, status: "DRAFT" }, message: "Draft saved." }`

### `POST /api/reports`
**Auth:** Required, **Roles:** RESEARCHER, STUDENT, DIVISION_HEAD
**Request:** `{ projectId, type, periodStart, periodEnd, narrativeSummary, file? (base64) }`
**Response 201:** `{ data: { id, status: "PENDING", version: 1 }, message: "Report submitted to Scientific Secretary." }`

### `GET /api/reports`
**Auth:** Required, **Roles:** All (scoped)
**Query Params:** `projectId`, `owner=me`, `status`, `division`, `type`, `submittedBy`, `sortBy`, `sortDirection`, `page`, `limit`
**Response 200:** Paginated array with `{ id, reportName, projectId, projectTitle, period, type, status, version, parentReportId, submittedBy, division, submittedAt, daysWaiting }`

### `GET /api/reports/stats`
**Auth:** Required, **Roles:** SECRETARY
**Response 200:** `{ data: { overdue, pending, approvedThisQuarter, returned } }`

### `GET /api/reports/:id`
**Auth:** Required, **Roles:** SECRETARY, submitter, project owner, Division Head, Management
**Response 200:** Full detail with `{ file, history: [{ event, timestamp, user, comment? }] }`

### `PATCH /api/reports/:id`
**Auth:** Required, **Roles:** SECRETARY
**Request:** `{ status: "APPROVED" | "RETURNED" | "ESCALATED", comment? }`
**Response 200:** `{ data: { id, status }, message: "Report approved. Researcher notified." }`
Valid transitions: PENDING → APPROVED (comment optional), PENDING → RETURNED (comment required), PENDING → ESCALATED (comment required)

## Architectural conventions that apply

- **State machine is enforced in Action classes**, not in the controller or model. Each action validates the current status allows the transition.
- `ReportPolicy` methods: `viewAny` (filtered by role/project access), `create` (role check), `update` (Secretary only), `view` (submitter, owner, Division Head, Secretary, Management)
- On submit: save ReportComment "SUBMITTED", fire `ReportSubmitted` → Listener sends notification to all SECRETARY users
- On approve: save ReportComment "APPROVED" with comment, fire `ReportApproved` → Listener sends notification to submitter
- On return: save ReportComment "RETURNED" with comment (required), fire `ReportReturned` → Listener sends notification to submitter
- On escalate: save ReportComment "ESCALATED" with comment (required), fire `ReportEscalated` → Listener sends notification to MANAGEMENT users
- Resubmission: `POST /api/reports` with `?resubmit=parentReportId` creates new report linked via `parentReportId`, increments version, copies fields from parent, sets status to PENDING
- `daysWaiting` computed as `now()->diffInDays($report->submittedAt)` when status is PENDING
- Base64 file decoding: decode and store via FileStorageInterface
- All timestamps in history use ISO 8601 format

## Step-by-step implementation checklist

- [ ] Create `app/Policies/ReportPolicy.php` with methods: `viewAny`, `create`, `view`, `update` (Secretary only), `submitDraft`, `submit`
- [ ] Register `ReportPolicy` in `AuthServiceProvider`
- [ ] Create `app/Http/Resources/ReportResource.php` — includes submittedBy name, projectTitle, period string, daysWaiting, history, file metadata
- [ ] Create `app/Http/Resources/ReportCommentResource.php`
- [ ] Create `app/Http/Requests/SubmitReportRequest.php` — validates projectId, type, periodStart, periodEnd, narrativeSummary, file (base64, nullable, max 50MB)
- [ ] Create `app/Http/Requests/SaveDraftRequest.php` — all optional
- [ ] Create `app/Http/Requests/UpdateReportStatusRequest.php` — validates status (in: APPROVED, RETURNED, ESCALATED), comment (required if RETURNED or ESCALATED)
- [ ] Create `app/Actions/Report/SaveDraftAction.php` — create or update draft record with status DRAFT
- [ ] Create `app/Actions/Report/SubmitReportAction.php`:
  - Validate status is not already PENDING for same period/type/project
  - Create Report with status PENDING, version = 1 (or incremented if resubmission)
  - Decode base64 file if present, store via FileStorageInterface
  - Save ReportComment "SUBMITTED"
  - Set submittedAt timestamp
  - Fire `ReportSubmitted` event
  - Return report
- [ ] Create `app/Actions/Report/ApproveReportAction.php`:
  - Validate current status is PENDING
  - Update status to APPROVED, set reviewedBy, comment
  - Save ReportComment "APPROVED"
  - Fire `ReportApproved` event
- [ ] Create `app/Actions/Report/ReturnReportAction.php`:
  - Validate current status is PENDING, comment is present
  - Update status to RETURNED, set reviewedBy, comment
  - Save ReportComment "RETURNED"
  - Fire `ReportReturned` event
- [ ] Create `app/Actions/Report/EscalateReportAction.php`:
  - Validate current status is PENDING, comment is present
  - Update status to ESCALATED, set reviewedBy, comment
  - Save ReportComment "ESCALATED"
  - Fire `ReportEscalated` event
- [ ] Create `app/Events/ReportSubmitted.php`, `ReportApproved.php`, `ReportReturned.php`, `ReportEscalated.php`
- [ ] Create `app/Listeners/SendReportSubmittedNotification.php` — sends to all SECRETARY users
- [ ] Create `app/Listeners/SendReportStatusChangedNotification.php` — sends to report submitter
- [ ] Register events + listeners in `EventServiceProvider`
- [ ] Create `app/Http/Controllers/Api/ReportController.php` with methods: `index`, `stats`, `store`, `saveDraft`, `show`, `update`
- [ ] Implement `index()`: apply filters (`projectId`, `owner`, `status`, `division`, `type`, `submittedBy`), sorting (default `createdAt desc`, special case for `status=PENDING&sortBy=submittedAt` = `asc`), paginate
- [ ] Implement `stats()`: count overdue (PENDING > 7 days), pending, approvedThisQuarter, returned
- [ ] Implement `show()`: eager load comments with user, compute history from comments
- [ ] Register routes in `routes/api.php`:
  - `GET /reports`, `POST /reports`
  - `POST /reports/draft`
  - `GET /reports/stats`
  - `GET /reports/{id}`, `PATCH /reports/{id}`
- [ ] Write tests: draft, submit, list/queue view, approve, return (with and without comment), escalate, resubmission, history tracking, authorization (only Secretary can action; only researcher can submit own projects)

## Definition of done

- `POST /api/reports/draft` saves report with DRAFT status
- `POST /api/reports` submits report (PENDING), creates SUBMITTED comment, fires event, stores file
- `GET /api/reports` returns paginated list with correct filters and sorting
- `GET /api/reports?status=PENDING&sortBy=submittedAt&sortDirection=asc` returns queue-ordered list
- `GET /api/reports/stats` returns Secretary queue counts
- `GET /api/reports/:id` returns full detail with history timeline
- `PATCH /api/reports/:id { status: "APPROVED" }` transitions status, creates comment, fires event, notifies researcher
- `PATCH /api/reports/:id { status: "RETURNED", comment: "..." }` transitions with required comment
- `PATCH /api/reports/:id { status: "ESCALATED", comment: "..." }` transitions with required comment
- `PATCH /api/reports/:id { status: "RETURNED" }` without comment returns 422
- Resubmission creates new report with incremented version and parentReportId link
- Only SECRETARY can PATCH report status
- Only project members/researchers can submit reports to their projects
- All responses use camelCase keys with daysWaiting computed
- PHPUnit tests pass for all state transitions and authorization scenarios

## Open questions / assumptions inherited

None.
