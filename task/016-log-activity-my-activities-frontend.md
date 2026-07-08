# Task 016: Log Activity & My Activities Frontend

**Status:** Done

## Completion Notes
Completed 2026-07-07. 3-step Log Activity wizard (WF05a) + My Activities list (WF05b) with filters, CSV export, inline expand, edit/delete. FileUploadZone, EditActivityModal, step components. 292 frontend tests passing.
**Depends on:** 006, 009, 010
**Docs referenced:** `docs/05-screens/05a-log-activity.md`, `docs/05-screens/05b-my-activities.md`, `docs/04-frontend-architecture.md` (Multi-step forms, File upload), `docs/07-non-functional-requirements.md` (Offline)

## Objective

Build the Log Activity multi-step form (WF05a — 3 steps: details, attach files, confirm) and the My Activities screen (WF05b — paginated activity list with inline expand, edit, delete, CSV export, and document actions).

## Context

Researchers log field/lab activities against their projects. The three-step wizard guides them through entering details, attaching files (queued client-side, uploaded on final submit), and confirming. The My Activities screen provides full history with inline expand for notes and documents, edit/delete controls, and CSV export.

## Scope

**In scope:**
- Log Activity (WF05a): Step 1 (project selector, date, type, description, notes), Step 2 (file upload zone, queued in state), Step 3 (confirm + submit)
- Multi-step form conventions: back preserves state, beforeunload warning, step indicator, nothing submits until Step 3
- My Activities (WF05b): paginated list, filter bar (search, project, type), CSV export button, row expand (notes + documents), edit modal, delete with confirm, load-more pagination
- Document actions from expanded activity row: Download, Publish, Forward, Delete

**Out of scope:**
- Offline queuing for activity logging (Task 027 — this task builds the form; offline support adds IndexedDB queue)
- Project Detail page (Task 015)

## Relevant API contract

### Log Activity
- `GET /api/activity-types` — types dropdown
- `POST /api/activities` — create activity
- `POST /api/activities/:id/documents` — upload file (multipart, sequential)

### My Activities
- `GET /api/activities?owner=me` — paginated, plus filters
- `GET /api/activities?owner=me&format=csv` — CSV download
- `PUT /api/activities/:id` — update activity
- `DELETE /api/activities/:id` — delete activity + files
- `GET /api/documents/:id/download`
- `PATCH /api/documents/:id` — publish
- `DELETE /api/documents/:id`
- `POST /api/inbox/forward`

## Relevant frontend behavior

### Log Activity (WF05a) — 3 Steps
**Step 1 — Details:** Project selector (pre-filled from URL), Date (defaults to today), Activity type dropdown, Description, Notes (optional). Next → validates.
**Step 2 — Attach Files:** Drag-and-drop + click upload zone. Queued files: filename, size, remove (X). Skip → advances with empty list. Back → preserves state.
**Step 3 — Confirm:** Summary of all fields. Submit flow: POST /api/activities → receive activityId → for each file POST /api/activities/:id/documents sequentially with progress bars. File failure → retry button on that file only. On complete → navigate to `/projects/:projectId`.

### My Activities (WF05b)
**Filter bar:** Search (client-side), Project dropdown, Type dropdown, Export CSV button
**Table:** Date, description, project (truncated, hover tooltip), type, file count, chevron
**Inline expand (row click):** Full notes, document list with action icons (Download, Publish, Forward, Delete). Below: Edit activity button → modal, Delete activity button → confirm.
**Load more:** Button at bottom, appends next page. Hidden when no more pages.

### Edge Cases
- No projectId in URL for Log Activity → user picks from dropdown
- File upload failure in Log Activity → retry per file, don't block successful ones
- Empty state in My Activities: "No activities logged yet." + Log activity button

## Architectural conventions that apply

- Multi-step form data lives in component state (no global state)
- Files are queued in state during Step 2, uploaded after activity is created in Step 3
- File uploads are sequential with per-file progress bars
- Per-file error handling with retry (don't fail entire submission)
- Edit activity opens a modal with pre-filled fields
- Delete activity shows confirmation modal
- CSV export triggers file download via browser (open URL or programmatic download)

## Step-by-step implementation checklist

- [ ] Create `resources/js/pages/LogActivity.jsx`:
  - Step indicator (1/3, 2/3, 3/3) at top
  - Step 1: project selector (fetch all accessible?), date picker, type dropdown (from activity-types), description input, notes textarea
  - Step 2: file drop zone + queued file list (client-side state only)
  - Step 3: summary display, submit button
  - Submit handler: create activity → upload files sequentially → navigate to project
  - beforeunload warning
  - Back/Next navigation preserves state
- [ ] Create `resources/js/components/activities/FileUploadZone.jsx` — drag-and-drop + click, queued files display
- [ ] Create `resources/js/components/activities/ActivityFormStep.jsx` (Step 1)
- [ ] Create `resources/js/components/activities/FileAttachStep.jsx` (Step 2)
- [ ] Create `resources/js/components/activities/ConfirmStep.jsx` (Step 3)
- [ ] Create `resources/js/pages/MyActivities.jsx`:
  - Fetch activities on mount with pagination
  - Filter bar with search, project select, type select, export CSV
  - Table with inline expand
  - Expand row: document list with action buttons, edit modal trigger, delete trigger
  - Load more pagination
- [ ] Create `resources/js/components/activities/EditActivityModal.jsx` — pre-filled form, PUT on submit
- [ ] Create document action components (or reuse from Task 015): DownloadButton, PublishButton, ForwardButton, DeleteButton
- [ ] Add routes: `/log-activity` → LogActivity, `/activities` → MyActivities
- [ ] Wire sidebar "Log Activity" and "My Activities" links

## Definition of done

- Log Activity Step 1 shows all fields, validates required, advances to Step 2
- Step 2 allows file queuing (drag-and-drop + click), skip advances with empty files
- Step 3 shows full summary and submit button
- Submit creates activity then uploads files with progress bars
- File upload failure shows retry button on that file
- Navigation preserves state on Back
- beforeunload warning when navigating away mid-flow
- My Activities shows paginated list with working filters
- CSV export triggers download
- Row expand shows notes, document list with action icons
- Edit activity modal opens with pre-filled data
- Delete activity confirms and removes row
- Empty state shows "No activities logged yet." + CTA
- All document actions (download, publish, forward, delete) work

## Open questions / assumptions inherited

None.
