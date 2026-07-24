# WF08 — Division Dashboard

## Purpose
Landing screen for DIVISION_HEAD after login. Provides oversight of all division projects, researcher activity, and report statuses.

## Entry Points
- Post-login redirect for DIVISION_HEAD role
- Sidebar "Division Overview" link

## Data Fetched on Mount (5 parallel fetches)

1. `GET /api/divisions/:divisionId/stats` → stat card values
2. `GET /api/projects?division=:divisionId` → division projects
3. `GET /api/divisions/:divisionId/researcher-activity` → per-researcher summary
4. `GET /api/reports?division=:divisionId&limit=5` → recent report statuses
5. `GET /api/divisions/:divisionId/activity-feed?limit=10` → event feed

`:divisionId` comes from the logged-in user's profile (auth context).

## Layout

### Five Stat Cards (informational)
Total projects, Ongoing, Reports pending (amber if >0), Report overdue (red if >0), Active researchers.

### Two-Column Layout

**Left Column:**

Division Projects table:
- Columns: project title, lead researcher, status badge, progress bar
- All rows open in full — no lock restrictions for Division Head within own division
- Row click → `/projects/:id`
- "View all [N] →" → `/projects?division=:divisionId`

Division Report Status panel (below projects):
- Lists recent report submissions from all division researchers
- Columns: report name, researcher, submitted date, status badge
- "All reports →" → `/reports?division=:divisionId`

**Right Column:**

Researcher Activity table:
- One row per researcher in the division
- Columns: name + active project count, projects list, activities this month, documents uploaded, report status badge
- Report status badges: Submitted (green), Due soon (amber — due within 7 days), Overdue (red — past due date)
- Row click → `/activities?researcher=:researcherId`

Activity Feed panel (below researcher table):
- Chronological stream of all activities and documents across the division
- System-generated alerts mixed in: warning icon, amber colour
- Example: "S. Mensah Q2 report not yet submitted — due 30 Jun"
- "View all →" → full feed page

## Division Head's Own Workspace
Division Head is still a researcher. "My Activities" and "My Reports" in the sidebar are scoped to their own data only — not the whole division.
