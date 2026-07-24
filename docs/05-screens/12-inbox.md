# WF12 — Inbox

## Purpose
Receives three types of items: forwarded documents, report status updates, and system alerts.

## Entry Points
- Sidebar "Inbox" link
- Bell dropdown tray "View all" link

## Data Fetched on Mount
- `GET /api/inbox?page=1&limit=20` → all items sorted by `createdAt` descending

## Layout

### Page Header
- Unread count
- Description of the three item types

### Four Tabs
- **All** → full list
- **Documents** → `type=DOCUMENT`
- **Report updates** → `type=REPORT_UPDATE`
- **System alerts** → `type=SYSTEM`

Tab counts update on mount and after any read action.

### Two Buttons on Tab Row
- **Mark all read** → `PATCH /api/inbox/read-all` → clears all badges, removes unread styling
- **Filter unread** → toggles list to show only `read=false` items

### Bulk Actions
Checkbox appears on hover per item. Selecting any item → bulk action bar slides in:
- "[N] items selected"
- **Mark read** → `PATCH /api/inbox/read-all { ids: [...] }`
- **Download all** → sequential download of document-type items in selection only
- **Deselect** → clears selection, hides bulk bar

### Item Rendering
- **Unread item:** blue left border, bold subject, blue unread dot
- **Read item:** no border, normal weight, no dot

Each item shows: sender name + division (or "SKMS · System" for automated), subject line, one-line preview, type badge (Document = blue, Report update = green, System alert = amber), metadata chips, timestamp.

### Document Item — Click to Expand Inline
- Full sender message
- File row: type chip, filename, size
- **Preview** → inline viewer
- **Download** → file download
- **Publish to library** → confirm modal → `PATCH /api/documents/:id { published: true }`
- **Forward** → recipient picker → `POST /api/inbox/forward`
- **Mark read** → `PATCH /api/inbox/:id/read`

**Preview and Download do NOT trigger mark read.** Mark read is always explicit.

### Report Update Item
- Shows notification text
- → button navigates to `/reports/:reportId`
- **Clicking also marks item as read automatically** — this is the one exception to the explicit read rule because navigation is the primary action.

### System Alert Item
- Text only
- → button navigates to relevant screen
- **Also marks as read on navigation.**

## Edge Cases
- **Recipient picker empty:** "No users found matching '[query]'"
- **Download all with non-document items:** skip non-document items silently, only download document-type items
- **Bell badge sync:** keep bell count in sync with inbox read state via shared NotificationContext
