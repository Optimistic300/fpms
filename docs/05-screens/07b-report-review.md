# WF07b — Report Review

## Purpose
Secretary reviews a single report, views submission history, and takes action (Approve / Return / Escalate).

## Entry Points
- Clicking "Review" on a queue item (WF07a)

## Data Fetched on Mount
- `GET /api/reports/:id` → full report with narrative, file, submission history
- `GET /api/reports?projectId=:projectId&submittedBy=:researcherId&status=APPROVED` → prior approved reports for context panel

## Layout

### Breadcrumb
`Report queue › [Report name]` — clicking "Report queue" returns to `/queue`.

### Queue Navigation (top right)
"N of M in queue" — N is current position, M is total pending count.
Next → fetches next oldest pending report, navigates to `/queue/:nextReportId`.
Clicking Next without actioning leaves current report in queue unchanged.

### Two-Column Layout

**Left Column:**
- Report title, researcher, division, period, submission timestamp
- Narrative summary in tinted panel
- Attached file row: type chip, filename, size, Preview button (inline viewer), Download button
- Prior approved submissions list: filename + approval date + View button per row

**Right Column — Action Panel:**
- Submission details: type, version number, days waiting, prior approved report count
- Comment textarea — label: "Required for return and escalation"
- Three action buttons stacked vertically:
  - **Approve (green)** → comment optional → `PATCH /api/reports/:id { status: "APPROVED", comment }` → researcher notified → navigate to next in queue
  - **Return for revision (red)** → comment required (inline error if empty) → `PATCH /api/reports/:id { status: "RETURNED", comment }` → researcher notified → navigate to next
  - **Escalate to management (purple)** → comment required → `PATCH /api/reports/:id { status: "ESCALATED", comment }` → management notified → navigate to next
- Note: "All decisions are timestamped and recorded. The researcher is notified immediately."

## Edge Cases
- **Next without actioning:** report stays PENDING, position in queue unchanged
- **Queue empty after actioning:** navigate to `/queue` with empty state
- **All three action buttons disabled** while API call is in flight. Spinner on active button.
- **Report is a resubmission (version > 1):** show "v2 (resubmission)" label; include history from parent report.
