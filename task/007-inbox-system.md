# Task 007: Inbox System

**Status:** Done

## Completion Notes
Completed 2026-07-07. Refactored InboxController to use InboxService + InboxItemResource + FormRequests + Policy. Created 9 new backend files (Resource, Requests, Service, Events, Listeners, Notifications). Created full Inbox.jsx frontend with tabs, bulk actions, forward modal, inline expand for documents. Wired events/listeners for report lifecycle + document forwarding + access requests. Tests: 115 PHPUnit + 109 Vitest all passing.
**Depends on:** 003, 004, 006
**Docs referenced:** `docs/03-api-reference.md` (Inbox section), `docs/02-data-model.md` (InboxItem), `docs/05-screens/12-inbox.md`, `docs/04b-backend-architecture.md` (Notifications/Events)

## Objective

Implement the full inbox system: InboxItem model/controller/endpoints, Laravel notification classes, the backend event → listener → notification pipeline, and the Inbox frontend screen (WF12). This is the communication backbone — every feature that sends an alert or notification flows through this system.

## Context

The inbox receives three item types: forwarded documents (from any user), report status updates (from Secretary actions), and system alerts. The notification bell polls the inbox API for unread count. When a report is submitted, approved, returned, or escalated, the appropriate event fires, its listener creates a notification, and the notification appears in the recipient's inbox.

## Scope

**In scope:**
- InboxItem model (already created in Task 002) — ensure it has correct relationships
- `InboxController` with: index, read (single), readAll, forward
- `InboxService` — encapsulates inbox operations
- Notification classes: `ReportSubmittedNotification`, `ReportStatusChangedNotification`, `DocumentForwardedNotification`, `AccessRequestNotification`
- Event + Listener pairs (stubs for now, wired to actual business logic in Tasks 008-011):
  - `ReportSubmitted` → `SendReportSubmittedNotification`
  - `ReportApproved` → `SendReportStatusChangedNotification`
  - `ReportReturned` → `SendReportStatusChangedNotification`
  - `ReportEscalated` → `SendReportStatusChangedNotification`
  - `AccessRequestCreated` → `SendAccessRequestNotification`
  - `DocumentForwarded` → (direct notification create in forward method)
- Inbox frontend screen (WF12): tabs (All, Documents, Report updates, System alerts), inline expand, bulk actions, forward modal
- NotificationContext data fetching (wired to real endpoint)

**Out of scope:**
- The actual report/business logic that fires events (Tasks 008-011)
- Notification for report submission (wired in Task 011)
- Any inbox item not created through the notification pipeline

## Relevant data model

### InboxItem
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| userId | bigint | FK to users (recipient) |
| senderId | bigint, nullable | FK to users (null for system) |
| type | enum | DOCUMENT, REPORT_UPDATE, SYSTEM |
| subject | varchar(255) | |
| message | text, nullable | |
| documentId | bigint, nullable | FK to documents |
| reportId | bigint, nullable | FK to reports |
| read | boolean | Default false |
| createdAt | timestamp | |

## Relevant API contract

### `GET /api/inbox`
**Auth:** Required, **Roles:** All
**Query Params:** `type` (DOCUMENT/REPORT_UPDATE/SYSTEM), `read` (boolean), `page`, `limit`
**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "type": "DOCUMENT",
      "subject": "GPS data from K. Mensah",
      "message": "Here are the GPS coordinates...",
      "sender": { "fullName": "Kofi Mensah", "division": "Forest Ecology" },
      "read": false,
      "documentId": 10,
      "reportId": null,
      "createdAt": "2026-07-01T09:00:00Z"
    }
  ],
  "meta": { "currentPage": 1, "lastPage": 3, "perPage": 20, "total": 45, "unreadCount": 12 }
}
```

### `PATCH /api/inbox/read-all`
**Auth:** Required, **Roles:** All
**Request:** `{ "ids": [1, 2, 3] }` or empty body to mark all as read
**Response 200:** `{ "message": "3 items marked as read." }`

### `PATCH /api/inbox/:id/read`
**Auth:** Required, **Roles:** All (item must belong to user)
**Response 200:** `{ "data": { "id": 1, "read": true } }`

### `POST /api/inbox/forward`
**Auth:** Required, **Roles:** All
**Request:** `{ "documentId": 10, "recipientIds": [2, 3], "message": "..." }`
**Response 201:** `{ "message": "Document forwarded to 2 recipients." }`

## Relevant frontend behavior

### Inbox Screen (WF12)
**Data fetched on mount:** `GET /api/inbox?page=1&limit=20`

**Page Header:**
- Unread count
- Description of three item types

**Four Tabs:**
- All, Documents (`type=DOCUMENT`), Report updates (`type=REPORT_UPDATE`), System alerts (`type=SYSTEM`)
- Tab counts update on mount and after read actions

**Two buttons on tab row:**
- Mark all read → `PATCH /api/inbox/read-all` → clears badges
- Filter unread → toggles to show only `read=false` items

**Bulk Actions:**
- Checkbox per item on hover
- Selecting items → bulk action bar: "[N] items selected", Mark read, Download all, Deselect

**Item Rendering:**
- Unread: blue left border, bold subject, blue unread dot
- Read: no border, normal weight, no dot
- Each: sender + division (or "SKMS · System"), subject, preview, type badge, metadata chips, timestamp

**Document Item — Click to Expand Inline:**
- Full sender message
- File row: type chip, filename, size
- Preview (inline viewer), Download, Publish to library, Forward, Mark read
- Preview and Download do NOT trigger mark read — explicit only

**Report Update Item:**
- Notification text, → button navigates to `/reports/:reportId`
- Clicking marks as read automatically

**System Alert Item:**
- Text only, → button navigates to relevant screen
- Also marks as read on navigation

**Edge Cases:**
- Recipient picker empty: "No users found matching '[query]'"
- Download all with non-document items: skip silently
- Bell badge sync via shared NotificationContext

## Architectural conventions that apply

- **Inbox writes happen only through Events/Listeners/Notifications** — never ad-hoc `InboxItem::create()` in controllers
- Notification classes use the `database` channel (`viaDatabase()`/`toDatabase()`)
- `InboxController` is thin: calls `InboxService` for operations, returns Resource response
- `InboxResource` transforms to camelCase, includes sender info
- Forward requires `StoreInboxForwardRequest` FormRequest validation
- The notification bell's unread count comes from `InboxItem::where('userId', $user->id)->where('read', false)->count()`

## Step-by-step implementation checklist

**Backend:**
- [ ] Create `app/Http/Resources/InboxItemResource.php` — camelCase, includes sender object
- [ ] Create `app/Http/Controllers/Api/InboxController.php` with methods: `index`, `markRead`, `markAllRead`, `forward`
- [ ] Create `app/Http/Requests/ForwardDocumentRequest.php` — validates documentId, recipientIds (array, exists:users), message (optional)
- [ ] Create `app/Http/Requests/MarkReadAllRequest.php` — validates ids (optional array)
- [ ] Create `app/Services/InboxService.php`:
  - `getItemsForUser(user, filters)` — paginated query with type/read filters
  - `markAsRead(itemId, user)` — ensure item belongs to user
  - `markAllAsRead(user, ids?)` — if ids given, mark specific; else mark all
  - `forwardDocument(documentId, sender, recipientIds, message)` — create InboxItem per recipient
- [ ] Create notification classes in `app/Notifications/`:
  - `ReportSubmittedNotification.php` — `toDatabase()` returns `{ type, subject, message, reportId, actionUrl }`
  - `ReportStatusChangedNotification.php` — for approve/return/escalate
  - `DocumentForwardedNotification.php`
  - `AccessRequestNotification.php`
- [ ] Create event classes in `app/Events/`:
  - `ReportSubmitted.php` — properties: `$report`
  - `ReportApproved.php`, `ReportReturned.php`, `ReportEscalated.php` — properties: `$report`, `$comment`
  - `AccessRequestCreated.php` — properties: `$accessRequest`
  - `DocumentForwarded.php` — properties: `$documentId`, `$sender`, `$recipientIds`, `$message`
- [ ] Create listeners in `app/Listeners/`:
  - `SendReportSubmittedNotification.php` — sends to all SECRETARY users
  - `SendReportStatusChangedNotification.php` — sends to report submitter
  - `SendAccessRequestNotification.php` — sends to project owner
- [ ] Register events + listeners in `EventServiceProvider`
- [ ] Register inbox routes in `routes/api.php`:
  - `GET /inbox`
  - `PATCH /inbox/read-all`
  - `PATCH /inbox/{id}/read`
  - `POST /inbox/forward`

**Frontend:**
- [ ] Create `resources/js/pages/Inbox.jsx` with tabs, list, bulk actions
- [ ] Implement item rendering with read/unread styling
- [ ] Implement inline expand for document items (file info, action buttons)
- [ ] Implement report update item → navigate to `/reports/:reportId`
- [ ] Implement mark read (single + bulk)
- [ ] Implement forward modal with user search (livesearch via GET /api/users or client-filtered)
- [ ] Wire NotificationContext to real inbox polling — `refreshCount()` calls inbox endpoint and reads `meta.unreadCount`
- [ ] Add route for `/inbox` in the routing table
- [ ] Add inbox unread badge in sidebar (reads from NotificationContext)

## Definition of done

- `GET /api/inbox` returns paginated inbox items for authenticated user
- `GET /api/inbox?type=DOCUMENT` filters by type
- `GET /api/inbox?read=false` filters unread
- `PATCH /api/inbox/read-all` marks all as read (or specific items with ids)
- `PATCH /api/inbox/:id/read` marks single item as read (only if belongs to user)
- `POST /api/inbox/forward` creates inbox items for each recipient
- Inbox frontend renders with tabs, correct read/unread styling, and bulk actions
- Forward modal opens with user search, sends document
- Report update and system alert items navigate and auto-mark-read
- NotificationContext polls inbox every 60 seconds and bell badge updates
- All event/listener classes exist and are registered (testable by dispatching events manually)
- All notification classes exist and write to the `notifications` table via `database` channel

## Open questions / assumptions inherited

- **Inbox ↔ Notifications table relationship:** Inbox items are stored in the `inbox_items` table. Notification classes write to `inbox_items` from their listeners. The `notifications` table (Laravel default) is not used as the primary inbox store for v1 — see `09-open-questions-and-assumptions.md`.
- **Division for SECRETARY/ADMIN:** All users have a divisionId; when forwarding, sender's division is shown.
- **Notification bell polling:** 60-second interval is acceptable for v1.
