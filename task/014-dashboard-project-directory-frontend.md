# Task 014: Dashboard & Project Directory Frontend

**Status:** Not Started
**Depends on:** 006, 008, 009, 011, 013
**Docs referenced:** `docs/05-screens/03-dashboard.md`, `docs/05-screens/04a-project-directory.md`, `docs/03-api-reference.md` (Dashboard, Projects), `docs/04-frontend-architecture.md`

## Objective

Build two frontend screens: the Dashboard (WF03 — landing for RESEARCHER/STUDENT) and the Project Directory (WF04a — browsable table of all projects with tabs and filters). These are the primary navigation targets after login for most users.

## Context

The Dashboard is the first thing Researchers and Students see after login. It shows their personal stats, project list, recent activities, and report statuses in four parallel-loaded panels. The Project Directory is the browseable view of all projects across the institute with tabs for "All projects", "My projects", and "Shared with me", plus a new-project modal.

## Scope

**In scope:**
- Dashboard (WF03) — four parallel fetches, stat cards, project table with search/filters, recent activity panel, recent report status panel
- Project Directory (WF04a) — three tabs, filter bar, table with lock/mine indicators, row click navigation, new-project modal

**Out of scope:**
- Project Detail page (Task 015)
- Activities screens (Task 016)
- Reports screens (Task 017)

## Relevant data model

Projects, Activities, Reports entities — see Tasks 008, 009, 011 for field details.

## Relevant API contract

### Dashboard (WF03)
- `GET /api/dashboard/stats` — `{ totalProjects, ongoing, reportsPending, activitiesThisMonth }`
- `GET /api/projects?owner=me&limit=20`
- `GET /api/activities?owner=me&limit=3`
- `GET /api/reports?owner=me&limit=3`

### Project Directory (WF04a)
- `GET /api/projects` — list with `isOwner`/`hasAccess`/`isLocked` per item
- `POST /api/projects` — create project

## Relevant frontend behavior

### Dashboard (WF03)
**Four stat cards** (clickable):
- My Projects → filters project table
- Ongoing → filters by ACTIVE status
- Reports pending → navigates to `/reports?status=PENDING`
- Activities this month → navigates to `/activities?period=this-month`

**Project Table:**
- Columns: title (ellipsis), division, funding, status badge, progress bar
- Search (client-side, debounced 300ms)
- Status dropdown (re-fetches)
- Advanced filters toggle (division, funding, research area)
- Row click → `/projects/:id`

**Bottom two panels:**
- Left: Recent Activity (3 items, "View all" → `/activities`)
- Right: Report Status (3 items, returned = red, "View all" → `/reports`)

**Loading:** skeleton loaders on all four regions. Never blank.
**Empty project list:** "Create your first project" CTA.

### Project Directory (WF04a)
**Three tabs:** All projects, My projects (`isOwner`), Shared with me (`hasAccess && !isOwner`)

**Table columns:** Title (with "Mine" tag if owner, lock icon if locked), division + lead, funding, status badge

**Row click:** owner/hasAccess → `/projects/:id`; locked → `/projects/:id/preview`

**Filter bar:** Search (client-side, debounced), Division chip, Status chip, Funding chip

**New Project button (top right):** Opens modal with fields: title, division, funding type, research area, location, start date, end date, description. On success → navigate to `/projects/:newId`.

**Edge Cases:**
- Empty "Shared with me" tab: "No projects have been shared with you yet" (no CTA)
- Locked project row: lock icon, click leads to preview page

## Architectural conventions that apply

- Dashboard makes 4 parallel fetch requests on mount — use `Promise.allSettled` or similar so one failure doesn't block others
- Per-screen filter state is component-local (no global store)
- Dashboard stat cards have click-to-filter behavior via URL params or local state
- Project Directory uses client-side search (debounced) and server-side filter chips
- Skeleton loaders match layout shape of whatever is loading
- Empty states have specific messages per component (not a generic "no data")
- Error states: if one fetch fails, show error for that panel only

## Step-by-step implementation checklist

- [ ] Create `resources/js/pages/Dashboard.jsx`:
  - Fetch 4 endpoints in parallel on mount
  - Render stat cards with skeleton while loading
  - Render project table with search/filter
  - Render recent activity panel (left)
  - Render report status panel (right)
  - Wire stat card clicks to filter/filter behavior
  - Empty state for projects with "Create your first project" button
- [ ] Create `resources/js/pages/ProjectDirectory.jsx`:
  - Fetch `GET /api/projects` on mount
  - Three tabs: All / My projects / Shared with me
  - Table with indicators (Mine tag, lock icon)
  - Filter bar with search + dropdown chips
  - New project button → modal → `POST /api/projects` → redirect
  - Row click handler: check `isOwner`/`hasAccess` → navigate to detail or preview
  - Empty states per tab
- [ ] Create `resources/js/components/projects/ProjectFilters.jsx` — search + chip filter row
- [ ] Create `resources/js/components/projects/NewProjectModal.jsx` — form with all project fields
- [ ] Create `resources/js/components/dashboard/StatCard.jsx` — reusable stat card with label, value, click handler
- [ ] Create skeleton components matching dashboard layout
- [ ] Add routes: `/dashboard` → Dashboard, `/projects` → ProjectDirectory
- [ ] Wire sidebar "Dashboard" and "Projects" links to correct routes
- [ ] Test: dashboard shows correct data, project directory tabs work correctly, new project creation works

## Definition of done

- Dashboard renders four stat cards from API data
- Stat card clicks navigate/filter as specified
- Project table in dashboard shows user's projects with search/filter
- Recent activity panel shows last 3 activities
- Report status panel shows last 3 reports with color-coded badges
- Project directory renders all projects with correct access indicators
- Three tabs filter correctly (all, mine, shared)
- Filter bar with search and dropdown chips re-fetches data
- "New project" modal creates project and redirects to detail
- Locked projects show lock icon and navigate to preview
- Skeleton loaders shown during loading
- Empty states shown when no data
- Per-panel error handling on dashboard (don't fail whole page)

## Open questions / assumptions inherited

None.
