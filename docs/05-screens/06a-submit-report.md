# WF06a — Submit Report

## Purpose
Four-step formal submission flow. Reports are submitted to the Scientific Secretary with full traceability.

## Entry Points
- Sidebar Reports → New report button
- Project Detail sidebar CTA
- My Reports page New report button
- All accept `?projectId=` to pre-fill

## Data Fetched on Mount
- `GET /api/projects?owner=me&status=ACTIVE` (or all owned projects) → populates project selector

## Layout
Step indicator always visible at top showing current position (1/4, 2/4, 3/4, 4/4).

### Step 1 — Select Project
Dropdown of user's active projects. Pre-filled if `projectId` in URL.
Next → requires selection.

### Step 2 — Report Details
- **Report type:** Quarterly, Mid-year, Annual. No default. Required.
- **Period start date:** date picker. Required.
- **Period end date:** date picker, defaults to today. Required.
- **Narrative summary:** textarea. Required.
Next → validates all fields. Back → returns to Step 1, data preserved.

### Step 3 — Attach Report
Single file upload. PDF expected.
After upload: filename, type, size with remove option.
Back → returns to Step 2, file cleared from state.

### Step 4 — Confirm
Full summary of all fields.
Non-dismissible warning: "Once submitted you cannot edit this report. The Secretary can return it with comments if changes are needed."
Two buttons:
- **Edit report** → back to Step 2
- **Submit to Scientific Secretary** → `POST /api/reports` → on success navigate to `/reports` → Secretary receives inbox notification automatically

### Save as Draft
Available on Steps 1–3. `POST /api/reports/draft` with current state → navigate to `/reports`. Draft appears with "Continue" action.

## Multi-Step Form Rules
- Nothing submits until Step 4
- Back preserves all state
- `beforeunload` warning if navigated away mid-flow without saving

## Edge Cases
- **Resubmission:** If `?resubmit=:reportId` is present, pre-fill all fields from original report. POST creates a new report linked via `parentReportId`. Backend increments version number.
