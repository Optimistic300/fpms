# WF07a — Report Queue

## Purpose
Secretary's primary workspace. Shows all pending report submissions sorted oldest-first.

## Entry Points
- Post-login redirect for SECRETARY role
- Sidebar "Report Queue" link

## Data Fetched on Mount
- `GET /api/reports?status=PENDING` → sorted by `submittedAt` ascending (oldest first)
- `GET /api/reports/stats` → `{ overdue, pending, approvedThisQuarter, returned }`

## Layout

### Four Stat Cards (informational, not filters)
- **Overdue** (red) — reports where `submittedAt` > 7 days ago and still PENDING
- **Pending review** — total pending count
- **Approved this quarter** — informational
- **Returned for revision** — informational

### Filter Bar
- **Search** → filter by researcher name, project name, division
- **"Pending only" chip** → active by default. Toggle to show all statuses.
- **Division chip** → re-fetch with `?division=`
- **Report type chip** → re-fetch with `?type=`

### Table Columns
Report name + period, researcher + division, project, type badge, days waiting, Review button.

**Days waiting** = today minus `submittedAt` in days.

### Overdue Rows (>7 days)
- Red left border accent
- Type badge changes to red "Overdue"
- Sorted to top of list regardless of other sorting

### Review Button
→ `/queue/:reportId`

### Load More
Same pattern as other list screens: 20 per page, append on load more.

## Edge Cases
- **Empty state:** "No reports pending review." Green check icon. No CTA needed.
- **Red border sorting:** overdue rows always sort to top.
