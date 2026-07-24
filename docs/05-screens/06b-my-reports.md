# WF06b — My Reports

## Purpose
Status tracker for all the user's report submissions, including drafts and resubmission flow.

## Entry Points
- Sidebar "Reports" link
- "View all" from Dashboard recent report status panel

## Data Fetched on Mount
- `GET /api/reports?owner=me` → all submissions including drafts, sorted by `createdAt` descending

## Layout

### Page Header
- Total submission count
- "Needs attention" count = Returned + overdue Draft count
- "New report" button → `/reports/new`

### Table Columns
Report name + period, project, submission date, status badge, action button.

### Status Badges and Actions
| Status | Badge Colour | Action |
|--------|-------------|--------|
| Draft | Grey | "Continue" → resume step flow from last completed step |
| Pending review | Amber | None |
| Returned | Red (row gets red background tint) | "Resubmit" → `/reports/new?projectId=:id&resubmit=:reportId` |
| Approved | Green | "View" → read-only report detail |

### Inline Expand (row click)
Submission timeline rendered chronologically:
- **Submitted** → `[timestamp] · [researcher name]`
- **Returned with comments** → `[timestamp] · [Secretary name]`
  - Secretary's comment verbatim inside red-tinted block
- **Resubmitted** → `[timestamp]`
- **Approved** → `[timestamp] · [Secretary name]`

Resubmit button sits directly below the Secretary's comment block.

## Edge Cases
- **Resubmission:** POST creates a new report with `parentReportId` linking to original. Backend increments version number. Secretary sees "v2 (resubmission)".
- **Empty state:** "No reports yet" + New report button.
