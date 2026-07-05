# WF04a — Project Directory

## Purpose
Browseable directory of all projects across the institute. Access to individual project contents is controlled by ownership/access.

## Entry Points
- Sidebar "Projects" link
- "View all" from Dashboard project list

## Data Fetched on Mount
- `GET /api/projects` → returns all projects. Each item includes `isOwner`, `hasAccess`, `isLocked`.

## Layout

### Three Tabs
- **All projects** → full list, all roles
- **My projects** → filter to `isOwner: true`
- **Shared with me** → filter to `hasAccess: true && !isOwner`

### Table Columns
Title, division + lead, funding, status badge.
Visual indicators on title cell:
- "Mine" tag → if `isOwner: true`
- Lock icon → if `isLocked: true`

### Row Click Behaviour
- `isOwner: true` or `hasAccess: true` → navigate to `/projects/:id` (full detail)
- `isLocked: true` → navigate to `/projects/:id/preview` (public metadata only + request access button)

### Filter Bar
- **Search input:** client-side filter on title, lead, research area (debounced)
- **Division chip:** re-fetches with `?division=` param
- **Status chip:** re-fetches with `?status=` param
- **Funding chip:** re-fetches with `?fundingType=` param

### New Project Button
Top right. Opens modal with fields: title, division, funding type, research area, location, start date, end date, description.
`POST /api/projects` → on success navigate to `/projects/:newId`.

## Edge Cases
- **Empty "Shared with me" tab:** "No projects have been shared with you yet" — no CTA.
- **Locked project row:** shows lock icon, clicking leads to preview page.
