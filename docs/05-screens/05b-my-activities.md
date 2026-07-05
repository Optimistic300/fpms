# WF05b — My Activities

## Purpose
Full personal activity history across all projects. View, edit, delete, and export activities.

## Entry Points
- Sidebar "My Activities" link
- "View all" from Dashboard recent activity panel

## Data Fetched on Mount
- `GET /api/activities?owner=me&page=1&limit=20` → paginated activity list

## Layout

### Filter Bar
- **Search** → debounced client-side filter on description
- **Project dropdown** → re-fetches with `?projectId=`
- **Type dropdown** → re-fetches with `?type=`
- **Export CSV button** → `GET /api/activities?owner=me&format=csv` with current filters → triggers file download

### Table Columns
Date, description, project (truncated, full title on hover tooltip), activity type, file count badge, chevron.

### Inline Expand (row click)
Shows:
- Full notes text
- Document list — each row: type chip, filename, four icon buttons:
  - **Download** → `GET /api/documents/:id/download`
  - **Publish** → confirm modal → `PATCH /api/documents/:id { published: true }`
  - **Forward** → recipient picker modal → `POST /api/inbox/forward`
  - **Delete (X)** → confirm modal → `DELETE /api/documents/:id`

Below document list:
- **Edit activity** → modal with pre-filled fields → `PUT /api/activities/:id`
- **Delete activity** → confirm modal → `DELETE /api/activities/:id` → row disappears, update count

### Load More
Button at bottom. Fetches next page, appends to existing list. Hidden when no more pages.

## Edge Cases
- **Empty state:** "No activities logged yet." + Log activity button.
- **Load more:** maintain scroll position when appending rows.
