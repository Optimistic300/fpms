# Task 019: Division Dashboard Frontend

**Status:** Done

## Completion Notes
Completed 2026-07-07. Division Dashboard (WF08) with stat cards, researcher activity, activity feed, project/report tables. 61 new tests. All passing.
**Depends on:** 006, 013
**Docs referenced:** `docs/05-screens/08-division-dashboard.md`, `docs/03-api-reference.md` (Divisions, Projects, Reports)

## Objective

Build the Division Dashboard screen (WF08) — the landing page and overview for Division Heads. Displays division-level stats, project list, researcher activity summaries, recent report statuses, and a chronological activity feed.

## Context

Division Heads oversee projects and researchers within their own division. The dashboard provides five stat cards, a two-column layout with division projects and researcher activity tables, plus report status and activity feed panels. Division Heads also have personal "My Activities" and "My Reports" links in the sidebar.

## Scope

**In scope:**
- Five stat cards (Total projects, Ongoing, Reports pending, Reports overdue, Active researchers)
- Left column: Division Projects table, Report Status panel
- Right column: Researcher Activity table, Activity Feed panel
- 5 parallel fetches on mount
- Row click navigation to project detail

**Out of scope:**
- Division Head's personal workspace (My Activities, My Reports — use Task 016/017 screens)
- Executive Dashboard (Task 020)

## Relevant API contract

- `GET /api/divisions/:divisionId/stats`
- `GET /api/projects?division=:divisionId`
- `GET /api/divisions/:divisionId/researcher-activity`
- `GET /api/reports?division=:divisionId&limit=5`
- `GET /api/divisions/:divisionId/activity-feed?limit=10`

## Relevant frontend behavior

**Five stat cards (informational, not clickable):** Total projects, Ongoing, Reports pending (amber if >0), Reports overdue (red if >0), Active researchers.

**Left column:**
- Division Projects table: title, lead researcher, status badge, progress bar. All rows open in full (no locks for Division Head). Row click → `/projects/:id`. "View all N →" → `/projects?division=:divisionId`.
- Division Report Status panel: recent submissions from division researchers. Columns: report name, researcher, submitted date, status badge. "All reports →" → `/reports?division=:divisionId`.

**Right column:**
- Researcher Activity table: one row per researcher. Columns: name + active project count, projects list, activities this month, documents uploaded, report status badge (Submitted=green, Due soon=amber, Overdue=red). Row click → `/activities?researcher=:researcherId`.
- Activity Feed: chronological stream of activities and system alerts. Mixed content: "Yaa Asantewaa logged field data collection", "S. Mensah Q2 report not yet submitted — due 30 Jun". "View all →" links.

**Loading:** Skeleton loaders per panel. Error banner per failed fetch (not whole page).

## Architectural conventions that apply

- `:divisionId` comes from the logged-in user's auth context (divisionId)
- Management can view any division's dashboard via `?divisionId=:id` query param
- 5 parallel fetches use `Promise.allSettled`
- Per-panel error handling (never fail entire page)

## Step-by-step implementation checklist

- [ ] Create `resources/js/pages/DivisionDashboard.jsx`:
  - Get divisionId from auth context or URL param
  - Fetch 5 endpoints in parallel
  - Render stat cards row
  - Render two-column layout
  - Left: Projects table, Report Status panel
  - Right: Researcher Activity table, Activity Feed panel
  - Skeleton loaders per section
  - Per-panel error boundaries
- [ ] Create `resources/js/components/division/DivisionProjectsTable.jsx`
- [ ] Create `resources/js/components/division/ResearcherActivityTable.jsx`
- [ ] Create `resources/js/components/division/ActivityFeedList.jsx`
- [ ] Create `resources/js/components/division/ReportStatusPanel.jsx`
- [ ] Add route: `/division` → DivisionDashboard
- [ ] Wire sidebar "Division Overview" link

## Definition of done

- Division dashboard renders with five stat cards from API
- Left column shows projects table (all rows accessible) and report status panel
- Right column shows researcher activity table and activity feed
- Stat cards show correct colors (amber for pending, red for overdue)
- Row click in projects navigates to project detail
- Row click in researcher activity navigates to `/activities?researcher=:id`
- "View all" links navigate to correct filtered pages
- Activity feed mixes activities and alerts
- Loading skeletons shown during fetch
- Per-panel error handling (one failed fetch doesn't break others)

## Open questions / assumptions inherited

- **Division Dashboard for Management:** Management can view via `?divisionId=:id` per `09-open-questions-and-assumptions.md`.
