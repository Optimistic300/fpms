# WF04b — Project Detail

## Purpose
Full view of a single project. Shows activities, documents, reports, and team. Accessible only if user is owner, collaborator, or Division Head.

## Entry Points
- Row click in Project Directory (if has access)
- Post-creation redirect from New Project

## Data Fetched on Mount
- `GET /api/projects/:id` → full project detail. If returns 403 → redirect to `/projects/:id/preview` immediately.
- Tabs fetch their own data on selection.

## Layout

### Breadcrumb
`Projects › [Project title]` — clicking "Projects" navigates back to `/projects`.

### Header
- Full project title
- Status badge
- Lead researcher + division
- Funding source
- Date range
- Progress bar
- **Edit button** (visible if `isOwner: true`) → opens modal → `PUT /api/projects/:id`
- **Log Activity button** (visible if `isOwner: true`) → `/log-activity?projectId=:id`

### Four Tabs

**Activities Tab (default):**
- `GET /api/activities?projectId=:id`
- Each row: description, date, researcher, doc count
- Row click → inline expand: full notes + attached documents
- Document actions: Download, Publish to library, Forward icons

**Documents Tab:**
- `GET /api/documents?projectId=:id`
- Each row: type chip, filename, Download, Publish, Forward icons
- Publish → confirm modal → `PATCH /api/documents/:id { published: true }`

**Reports Tab:**
- `GET /api/reports?projectId=:id`
- Each row: report name, period, status badge, submitted date
- Row click → `/reports/:id`

**Team Tab:**
- `GET /api/projects/:id/members`
- Each row: researcher name, role (Lead / Collaborator), date added
- Share access button → modal with email/name search → `POST /api/projects/:id/members`

### Right Sidebar
- Project metadata: research area, location, dates, funding, activity count, doc count
- Recent documents list with quick download
- Action buttons:
  - **Submit report** → `/reports/new?projectId=:id`
  - **Share access** → same modal as team tab
  - **Publish to library** → only if user has publish permission

## Locked Project Preview (`/projects/:id/preview`)
Shows only: title, lead, division, status, research area, start date, end date.
No tabs. No documents. No activities.
One button: **Request access** → `POST /api/projects/:id/access-requests` → success toast "Access request sent."

## Edge Cases
- **403 on project detail:** redirect to preview route.
- **Empty tab:** each tab shows its own empty state (no activities, no documents, no reports, no team members).
