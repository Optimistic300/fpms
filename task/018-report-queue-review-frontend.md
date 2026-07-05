# Task 018: Report Queue & Report Review Frontend

**Status:** Not Started
**Depends on:** 006, 011, 013
**Docs referenced:** `docs/05-screens/07a-report-queue.md`, `docs/05-screens/07b-report-review.md`

## Objective

Build the Secretary's workspace: the Report Queue (WF07a — list of pending submissions sorted oldest-first with stat cards) and the Report Review page (WF07b — single-report view with action panel for Approve/Return/Escalate).

## Context

The Scientific Secretary's primary role is to review report submissions. The queue shows all PENDING reports with overdue indicators, stat cards (overdue, pending, approved this quarter, returned), and filter/search. Clicking Review opens the report detail with narrative, file, submission history, and the three action buttons (Approve, Return, Escalate) with comment requirement.

## Scope

**In scope:**
- Report Queue (WF07a): four stat cards, filter bar, table with overdue highlighting, Review button, load-more pagination
- Report Review (WF07b): two-column layout, left shows report content and prior submissions, right shows action panel with Approve/Return/Escalate buttons, comment textarea, queue navigation
- Status change actions: Approve (comment optional), Return (comment required), Escalate (comment required)
- "Next in queue" navigation after actioning
- Handle resubmission (v2+) display

**Out of scope:**
- Submit Report form (Task 017)
- My Reports screen (Task 017)
- Scheduled overdue calculation (Task 026)

## Relevant API contract

- `GET /api/reports?status=PENDING` — sorted by submittedAt ascending
- `GET /api/reports/stats` — queue stat counts
- `GET /api/reports/:id` — full detail with history
- `GET /api/reports?projectId=&submittedBy=&status=APPROVED` — prior approved reports
- `PATCH /api/reports/:id` — approve/return/escalate

## Relevant frontend behavior

### Report Queue (WF07a)
**Four stat cards:** Overdue (red), Pending review, Approved this quarter, Returned for revision
**Filter bar:** Search (researcher/project/division), "Pending only" toggle (default on), Division chip, Report type chip
**Table:** Report name + period, researcher + division, project, type badge, days waiting, Review button
**Overdue rows (>7 days):** Red left border accent, red "Overdue" badge, sorted to top
**Load more:** 20 per page, append on scroll/click

### Report Review (WF07b)
**Breadcrumb:** `Report queue › [Report name]`
**Queue navigation:** "N of M in queue" with Next button. Next without actioning leaves report in queue.
**Two-column layout:**
- Left: report title, researcher, division, period, submission timestamp, narrative summary (tinted panel), attached file with Preview/Download, prior approved submissions list
- Right: type, version, days waiting, prior approved count. Comment textarea (label: "Required for return and escalation"). Three buttons: Approve (green), Return for revision (red), Escalate to management (purple)
**Edge cases:** Next without actioning stays PENDING. Queue empty after actioning → redirect to `/queue`. All buttons disabled while API in flight. Resubmission shows "v2 (resubmission)" label.

## Architectural conventions that apply

- Secretary is the only role with access to these pages (route guard checks role)
- Stat cards are informational-only (not clickable)
- Comment required validation handled in form, confirmed by 422 from backend
- After actioning, navigate to next report in queue (or back to queue if empty)
- Disable all three action buttons during API call

## Step-by-step implementation checklist

- [ ] Create `resources/js/pages/ReportQueue.jsx`:
  - Fetch `GET /api/reports?status=PENDING` and `GET /api/reports/stats` on mount
  - Render four stat cards
  - Filter bar with search, toggles, dropdowns
  - Table with overdue highlighting and sorting
  - Review button → navigate to `/queue/:reportId`
  - Load-more pagination
- [ ] Create `resources/js/pages/ReportReview.jsx`:
  - Fetch `GET /api/reports/:id` and prior approved reports on mount
  - Render two-column layout
  - Left column: report content, narrative, file preview/download, prior submissions
  - Right column: metadata, comment textarea, three action buttons
  - Approve: optional comment, PATCH → success → next in queue
  - Return: required comment, PATCH → success → next
  - Escalate: required comment, PATCH → success → next
  - Queue navigation: "N of M" with Next button
  - Handle resubmission display
- [ ] Create `resources/js/components/reports/ReviewActionPanel.jsx` — right column component
- [ ] Create `resources/js/components/reports/PriorSubmissionsList.jsx` — left column component
- [ ] Add routes: `/queue` → ReportQueue, `/queue/:reportId` → ReportReview
- [ ] Wire sidebar "Report Queue" and "Submission History" links (or just Report Queue; Submission History points to same page with filter)

## Definition of done

- Report Queue shows stat cards with correct counts
- Filter bar filters by search, division, type
- Table shows pending reports with overdue highlighting (red border, sorted top)
- Review button navigates to report review page
- Report Review shows two-column layout with report content and action panel
- Approve works (optional comment), navigates to next in queue
- Return works (required comment) — comment validation before PATCH
- Escalate works (required comment) — comment validation before PATCH
- Queue navigation shows position and allows skipping
- Resubmission reports display "v2 (resubmission)"
- Actions disabled during API call, enabled after
- Empty queue redirects from review page

## Open questions / assumptions inherited

None.
