# Task 015: Project Detail Frontend

**Status:** Not Started
**Depends on:** 006, 008, 009, 010, 011
**Docs referenced:** `docs/05-screens/04b-project-detail.md`, `docs/03-api-reference.md` (Projects, Activities, Documents, Reports), `docs/04-frontend-architecture.md`

## Objective

Build the Project Detail screen (WF04b) with four tabs (Activities, Documents, Reports, Team), a right sidebar with metadata and quick actions, and the locked project preview page (`/projects/:id/preview`) with access-request button.

## Context

After clicking a project in the directory, users with access see the full project detail. It's the primary workspace for viewing all project-related data: activities, documents, reports, and team members. Owners/Division Heads can edit, add members, log activities, submit reports, and publish documents.

## Scope

**In scope:**
- Project Detail page (`/projects/:id`) — header, four tabs, right sidebar
- Each tab fetches its own data on selection
- Activities tab: inline expand with document actions (Download, Publish, Forward)
- Documents tab: file list with Download, Publish, Forward icons
- Reports tab: list with status badges, row click to report detail
- Team tab: member list, add member modal (email search), share access
- Right sidebar: metadata, recent documents, action buttons (Submit report, Share access, Publish)
- Preview page (`/projects/:id/preview`) — locked project with metadata + "Request access" button
- Edit project modal for owners
- Redirect to preview on 403 from /api/projects/:id

**Out of scope:**
- Report detail page (Task 018)
- Log Activity page (Task 016)
- Inbox forward modal (already in Task 007, referenced here)

## Relevant data model

Projects, Activities, Documents, Reports, ProjectMembers — see Tasks 008-011.

## Relevant API contract

- `GET /api/projects/:id` — full detail (403 → redirect to preview)
- `PUT /api/projects/:id` — update project (owner only)
- `GET /api/activities?projectId=:id` — list project activities
- `GET /api/documents?projectId=:id` — list project documents
- `GET /api/reports?projectId=:id` — list project reports
- `GET /api/projects/:id/members` — list team members
- `POST /api/projects/:id/members` — add member
- `POST /api/projects/:id/access-requests` — request access
- `PATCH /api/documents/:id` — publish document
- `DELETE /api/documents/:id` — delete document
- `POST /api/inbox/forward` — forward document

## Relevant frontend behavior

### Full Detail Page
**Breadcrumb:** `Projects › [Project title]`
**Header:** Title, status badge, lead + division, funding source, date range, progress bar
**Header buttons:** Edit (if owner), Log Activity (if owner)

**Four Tabs (default: Activities):**
- Activities: description + date + researcher + doc count per row; row click → inline expand with full notes + attached documents; document actions: Download, Publish, Forward
- Documents: type chip + filename per row; actions: Download, Publish, Forward
- Reports: report name + period + status badge + submitted date; row click → `/reports/:id`
- Team: researcher name + role + date added; "Share access" button

**Right sidebar:**
- Research area, location, dates, funding, activity count, doc count
- Recent documents with quick download
- Action buttons: Submit report, Share access (same modal as team tab), Publish to library

### Locked Preview Page
- Title, lead, division, status, research area, start date, end date
- "Request access" button → `POST /api/projects/:id/access-requests` → success toast

### Edge Cases
- 403 on project detail → immediate redirect to `/projects/:id/preview`
- Empty tab: each tab shows its own empty state

## Architectural conventions that apply

- Tabs fetch data on selection only (lazy load), not on mount
- 403 handling: Axios interceptor can catch 403 on project detail route and redirect to preview
- Row click for locked projects handled in project directory (Task 014)
- Document actions (Download, Publish, Forward) use existing API endpoints
- Modal forms (Edit project, Add member, Share access) use existing form request validation

## Step-by-step implementation checklist

- [ ] Create `resources/js/pages/ProjectDetail.jsx`:
  - Fetch `GET /api/projects/:id` on mount
  - If 403, redirect to `/projects/:id/preview`
  - Render breadcrumb, header, tabs, sidebar
  - Edit button → modal with project fields → `PUT /api/projects/:id`
  - Log Activity button → navigate to `/log-activity?projectId=:id`
- [ ] Create tab components within ProjectDetail:
  - `ActivitiesTab.jsx` — fetch on select, inline expand, document action icons
  - `DocumentsTab.jsx` — fetch on select, file list with action icons
  - `ReportsTab.jsx` — fetch on select, status badges, row click navigation
  - `TeamTab.jsx` — fetch on select, member list, add member modal
- [ ] Create `resources/js/components/projects/EditProjectModal.jsx`
- [ ] Create `resources/js/components/projects/AddMemberModal.jsx` — email search, role select
- [ ] Create `resources/js/components/projects/ShareAccessModal.jsx` (reuse or alias to AddMemberModal)
- [ ] Create `resources/js/components/documents/DocumentActions.jsx` — Download, Publish, Forward icon buttons with confirmations
- [ ] Create `resources/js/pages/ProjectPreview.jsx` (locked preview):
  - Render limited metadata
  - "Request access" button → POST → success toast
- [ ] Add routes: `/projects/:id` → ProjectDetail, `/projects/:id/preview` → ProjectPreview
- [ ] Wire sidebar items correctly
- [ ] Handle 403 redirect in the component or Axios interceptor for project detail route

## Definition of done

- Project detail page renders with header, four tabs, and right sidebar
- Activities tab loads and shows activity list with inline expand
- Documents tab shows files with Download/Publish/Forward icons
- Reports tab shows list with status badges, clicking navigates to report
- Team tab shows members and add-member modal
- Edit button opens modal and updates project
- 403 on project detail redirects to preview page
- Preview page shows limited metadata with Request Access button
- Request access shows success toast
- Each tab has empty state when no data
- All document actions work (download, publish, forward)

## Open questions / assumptions inherited

None.
