# Task 017: Submit Report & My Reports Frontend

**Status:** Not Started
**Depends on:** 006, 011
**Docs referenced:** `docs/05-screens/06a-submit-report.md`, `docs/05-screens/06b-my-reports.md`, `docs/04-frontend-architecture.md` (Multi-step forms)

## Objective

Build the Submit Report multi-step form (WF06a — 4 steps: select project, report details, attach file, confirm) and the My Reports screen (WF06b — report history with status badges, submission timeline, resubmission flow).

## Context

Researchers create quarterly, mid-year, and annual reports through a formal 4-step wizard. Reports can be saved as drafts mid-flow and resumed later. The My Reports screen shows all submissions with their status (Draft, Pending, Returned, Approved), a chronological timeline per report, and a resubmission path for returned reports.

## Scope

**In scope:**
- Submit Report (WF06a): Step 1 (project selector), Step 2 (type, period, narrative), Step 3 (file upload), Step 4 (confirm + submit)
- Save as draft on Steps 1-3
- Draft resume (navigate from My Reports with pre-filled data)
- Resubmission flow (`?resubmit=reportId` pre-fills from original)
- My Reports (WF06b): paginated list, status badges, action buttons per status, inline expand with timeline, resubmit button
- beforeunload warning, step indicator, back preserves state

**Out of scope:**
- Report Queue + Review (Task 018 — Secretary-side)
- Draft offline saving (Task 027)
- Report file upload infrastructure (Task 011 — backend exists; this task uses it)

## Relevant API contract

- `GET /api/projects?owner=me&status=ACTIVE` (or all owned) — project selector
- `POST /api/reports` — submit report
- `POST /api/reports/draft` — save draft
- `GET /api/reports?owner=me` — list reports
- `GET /api/reports/:id` — full detail with history

## Relevant frontend behavior

### Submit Report (WF06a) — 4 Steps
**Step 1 — Select Project:** Dropdown of user's active projects. Pre-filled from `?projectId=`. Next → requires selection.
**Step 2 — Report Details:** Type (Quarterly/Mid-year/Annual), Period start, Period end, Narrative summary. All required. Back → preserves data.
**Step 3 — Attach Report:** Single PDF upload. After upload: filename, type, size, remove. Back → clears file.
**Step 4 — Confirm:** Full summary. Non-dismissible warning: "Once submitted you cannot edit this report." Two buttons: Edit report (→ Step 2), Submit to Scientific Secretary (→ POST /api/reports → navigate to `/reports`).
**Save as Draft:** Available Steps 1-3. POST /api/reports/draft → navigate to `/reports`. Draft appears with "Continue" action.
**Resubmission (`?resubmit=:reportId`):** Pre-fill all fields from original report. POST creates new report with parentReportId. Version incremented by backend.

### My Reports (WF06b)
**Header:** Total count, "Needs attention" (Returned + overdue Draft), "New report" button.
**Table:** Report name + period, project, submission date, status badge, action button.
**Status badges:** Draft (grey, "Continue"), Pending (amber, none), Returned (red/red tint, "Resubmit"), Approved (green, "View").
**Inline expand (row click):** Chronological timeline: Submitted → Returned with comments (red block) → Resubmitted → Approved. Resubmit button below Secretary's comment block.
**Edge cases:** Resubmission POST creates version 2. Empty: "No reports yet" + New report button.

## Architectural conventions that apply

- Multi-step form: component state, nothing submits until Step 4
- Draft save available on Steps 1-3: sends current state to backend, report appear as "Continue" in list
- Resubmission pre-fills from fetched report data
- beforeunload warning if navigating away mid-flow without saving draft
- Timeline renders from report `history` array in API response

## Step-by-step implementation checklist

- [ ] Create `resources/js/pages/SubmitReport.jsx`:
  - Step indicator (1/4, 2/4, 3/4, 4/4)
  - Step 1: project selector (fetch user's active projects)
  - Step 2: type selector (radio/dropdown), period date pickers, narrative textarea
  - Step 3: single PDF upload zone with remove
  - Step 4: summary display, submit button with warning text
  - Save as draft button on Steps 1-3
  - Resubmission: detect `?resubmit=` param, fetch original report, pre-fill
  - beforeunload warning
  - Back preserves all state
- [ ] Create `resources/js/pages/MyReports.jsx`:
  - Fetch `GET /api/reports?owner=me`
  - Header: total count, needs-attention count, new report button
  - Table with status-colored badges and action buttons
  - Inline expand: render timeline from history array
  - Resubmit button: navigate to `/reports/new?projectId=&resubmit=`
  - "Continue" on drafts: navigate to `/reports/new?draft=:reportId` and pre-fill
- [ ] Create `resources/js/components/reports/ReportTimeline.jsx` — renders chronological event list with colored indicators
- [ ] Create `resources/js/components/reports/ResubmitButton.jsx`
- [ ] Add routes: `/reports/new` → SubmitReport, `/reports` → MyReports
- [ ] Wire sidebar "Reports" link

## Definition of done

- Submit Report Step 1 shows project selector (pre-filled from URL param)
- Step 2 shows type + period + narrative, validates required
- Step 3 shows PDF upload with remove
- Step 4 shows summary with warning, submit creates report
- Save as draft creates draft report, appears in My Reports with "Continue"
- Draft resume pre-fills step data from saved draft
- Resubmission (`?resubmit=`) pre-fills from original report
- My Reports shows all submissions with correct status colors and actions
- Inline expand shows full timeline with comments
- Resubmit button navigates to pre-filled form
- Empty state: "No reports yet" + new report button
- beforeunload warning works mid-flow without draft save

## Open questions / assumptions inherited

None.
