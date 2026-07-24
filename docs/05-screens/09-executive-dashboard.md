# WF09 — Executive Dashboard

## Purpose
Landing screen for MANAGEMENT after login. Institute-wide overview with no restrictions.

## Entry Points
- Post-login redirect for MANAGEMENT role
- Sidebar "Executive Dashboard" link

## Data Fetched on Mount (6 parallel fetches — use Promise.all)

1. `GET /api/institute/stats` → six stat card values
2. `GET /api/divisions/summary` → one row per division
3. `GET /api/institute/funding-breakdown` → donor/government/internal counts
4. `GET /api/institute/compliance` → per-division compliance percentages
5. `GET /api/publications?limit=4` → recent publications
6. `GET /api/institute/alerts?limit=5` → system-generated alerts

## Layout

### Six Stat Cards (informational)
Total projects, Ongoing (green), Divisions active, Reports pending review (amber), Reports overdue (red), Library documents (green).

### Division Breakdown Table (full width)
One row per division. Columns: division name + head, total projects, ongoing, active staff, document count, report status summary, compliance %.

Compliance colouring:
- 100% → green
- 80–99% → amber
- Below 80% → red

Row click → navigates to `/division?divisionId=:id`. Management can view any division's dashboard.

### Three Panels Below Table

**Funding Breakdown panel:**
- Three horizontal bars: Donor, Government, Internal
- Width proportional to project count
- Label shows count on the right
- Below bars: compliance bar chart — one bar per division, same colour rules, division name on left, percentage on right

**Publications Output panel:**
- Recent publications (limit 4)
- Each: status badge, title, authors, journal, date
- "All publications →" → `/publications`

**Institute Alerts panel:**
- System-generated only
- Icon colours: red = danger, amber = warning, green = success, blue = info
- Alert types: report overdue in a division, Secretary queue backlog above threshold, division milestone (all reports submitted), library document count milestone, paper status change (submitted, published)
- Each alert has a → button navigating to the relevant screen

## Edge Cases
- **Parallel fetch failure:** If any single fetch fails, show error banner for that section only. Never fail the whole page.
