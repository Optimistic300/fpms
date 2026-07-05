# WF05a — Log Activity

## Purpose
Three-step form for logging a field or lab activity with optional document attachments.

## Entry Points
- Nav "Log activity" button
- Project Detail header button
- My Activities page button
- All accept `?projectId=` query param to pre-fill the project selector

## Data Fetched on Mount
- `GET /api/activity-types` → populates activity type dropdown

## Layout
Step indicator always visible at top showing current position (1/3, 2/3, 3/3).

### Step 1 — Details
Fields:
- **Project selector** — dropdown. Pre-filled if `projectId` in URL. Required.
- **Date** — date picker, defaults to today. Required.
- **Activity type** — dropdown from `GET /api/activity-types`. No default. Required.
- **Description** — text input. Required.
- **Notes** — textarea. Optional.

Next → validates all required fields → inline error below empty fields → advance to Step 2.

### Step 2 — Attach Files
- Upload zone (drag-and-drop + click)
- Queued files list: filename, size, remove (X) button
- Files in state only — nothing uploaded yet
- Skip → advances to Step 3 with empty file list
- Back → returns to Step 1, all data preserved

### Step 3 — Confirm
Summary: project name, date, type, description, notes, file list.
Submit flow:
1. `POST /api/activities` with activity data → receive `activityId`
2. For each file → `POST /api/activities/:activityId/documents` (multipart)
3. Files upload sequentially, each showing progress bar
4. If a file fails → show error on that file with Retry button. Don't block the others.
5. On all complete → navigate to `/projects/:projectId` Activities tab

Back → returns to Step 2, files still queued.

## Multi-Step Form Rules
- Nothing submits until Step 3
- Back preserves all state
- `beforeunload` warning if user navigates away mid-flow

## Edge Cases
- **User arrived without projectId:** carry selected projectId through to post-submit redirect.
- **File upload failure:** retry per file, don't block successful uploads.
