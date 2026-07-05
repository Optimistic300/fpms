# Task 020: Executive Dashboard Frontend

**Status:** Not Started
**Depends on:** 006, 013
**Docs referenced:** `docs/05-screens/09-executive-dashboard.md`

## Objective

Build the Executive Dashboard screen (WF09) — the landing page for Management users. Provides institute-wide overview with six stat cards, division breakdown table, funding breakdown panel, publications output panel, and institute alerts.

## Context

Management (Director-level) sees the entire institute at a glance. The dashboard makes six parallel fetches for stat cards, division summaries, funding breakdown, compliance percentages, recent publications, and system alerts. Division rows are clickable to navigate to division-level view.

## Scope

**In scope:**
- Six stat cards (Total projects, Ongoing, Divisions active, Reports pending, Reports overdue, Library documents)
- Division Breakdown table (full width) with compliance coloring
- Three panels below: Funding Breakdown (horizontal bars), Publications Output (recent 4), Institute Alerts
- 6 parallel fetches on mount, per-panel error handling

**Out of scope:**
- Division Dashboard (Task 019)
- Publications full screen (Task 022)

## Relevant API contract

- `GET /api/institute/stats`
- `GET /api/divisions/summary`
- `GET /api/institute/funding-breakdown`
- `GET /api/institute/compliance`
- `GET /api/publications?limit=4`
- `GET /api/institute/alerts?limit=5`

## Relevant frontend behavior

**Six stat cards:** Total projects, Ongoing (green), Divisions active, Reports pending review (amber), Reports overdue (red), Library documents (green).

**Division Breakdown table:** Division name + head, total projects, ongoing, active staff, document count, report status summary, compliance %.
Compliance coloring: 100% = green, 80–99% = amber, below 80% = red.
Row click → `/division?divisionId=:id`.

**Funding Breakdown panel:** Three horizontal bars (Donor, Government, Internal), width proportional to counts. Below: compliance bar chart (one bar per division, same color rules).

**Publications Output panel:** Recent 4 publications. Each: status badge, title, authors, journal, date. "All publications →" → `/publications`.

**Institute Alerts panel:** System-generated alerts with icon colors (red=danger, amber=warning, green=success, blue=info). Each has → button navigating to relevant screen.

**Edge cases:** Parallel fetch failure shows error banner per panel only. Never fail entire page.

## Architectural conventions that apply

- 6 parallel fetches with `Promise.allSettled`
- Per-panel error boundaries
- Stat cards are informational (not clickable)
- Funding bars are CSS-width proportional to counts

## Step-by-step implementation checklist

- [ ] Create `resources/js/pages/ExecutiveDashboard.jsx`:
  - Fetch 6 endpoints in parallel
  - Render six stat cards
  - Render Division Breakdown table
  - Render Funding Breakdown panel with bar visualization
  - Render Publications Output panel
  - Render Institute Alerts panel
  - Per-panel error boundaries and skeletons
- [ ] Create `resources/js/components/executive/DivisionBreakdownTable.jsx` — compliance coloring, row click navigation
- [ ] Create `resources/js/components/executive/FundingBreakdownPanel.jsx` — horizontal bars
- [ ] Create `resources/js/components/executive/ComplianceChart.jsx` — per-division bars
- [ ] Create `resources/js/components/executive/PublicationsPanel.jsx` — recent 4 cards
- [ ] Create `resources/js/components/executive/InstituteAlerts.jsx` — icon-colored alert list
- [ ] Add route: `/executive` → ExecutiveDashboard
- [ ] Wire sidebar "Executive Dashboard" link

## Definition of done

- Six stat cards render with correct API data and colors
- Division Breakdown table shows all divisions with compliance coloring
- Row click in division table navigates to `/division?divisionId=:id`
- Funding Breakdown shows proportional horizontal bars
- Publications panel shows recent 4 publications
- Institute Alerts shows system alerts with correct icon colors
- Each panel has skeleton loading state
- One failed fetch shows error for that panel only (other panels load normally)
- "All publications →" navigates to `/publications`

## Open questions / assumptions inherited

None.
