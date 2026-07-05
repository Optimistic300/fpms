# WF03 — Dashboard

## Purpose
Landing screen for RESEARCHER and STUDENT after login. Provides an overview of the user's projects, activities, and report statuses.

## Entry Points
- Post-login redirect for RESEARCHER and STUDENT
- Sidebar "Dashboard" link

## Data Fetched on Mount (4 parallel fetches)

1. `GET /api/dashboard/stats` → `{ totalProjects, ongoing, reportsPending, activitiesThisMonth }`
2. `GET /api/projects?owner=me&limit=20` → user's project list
3. `GET /api/activities?owner=me&limit=3` → recent activities
4. `GET /api/reports?owner=me&limit=3` → recent report statuses

## Layout

### Page Header
- Greeting with user's first name
- Today's date
- Division name

### Four Stat Cards
Each card is clickable:
- **My Projects** → filters table to show all user projects
- **Ongoing** → filters table to status=ONGOING
- **Reports pending** → navigates to `/reports?status=PENDING`
- **Activities this month** → navigates to `/activities?period=this-month`

Active card: accent border + tinted background.
Micro-hint "click to filter" always visible below each label.

### Project Table
Columns: project title (ellipsis on overflow), division, funding, status badge, progress bar.
- **Search input:** client-side filter on title, debounced 300ms
- **Status dropdown:** re-fetches with `?status=` param
- **Advanced filters toggle:** reveals division, funding, research area filters
- **Row click:** navigates to `/projects/:id`

### Bottom Two Panels

**Left — Recent Activity:**
- Last 3 activities
- Each: description + project + date
- "View all" → `/activities`

**Right — Report Status:**
- Last 3 reports with status badge
- Returned reports highlighted red
- "View all" → `/reports`

## Edge Cases
- **Loading:** skeleton loaders on all four regions. Never blank.
- **Empty project list:** show empty state with "Create your first project" CTA.
