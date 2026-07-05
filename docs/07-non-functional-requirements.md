# Non-Functional Requirements

## Security / Permissions Enforcement

- **All permission checks are server-side.** The frontend may hide UI elements for UX convenience, but the API enforces every restriction independently.
- Authentication: Laravel Sanctum token-based. Tokens are issued on login, validated on every authenticated request, revocable on logout.
- Policy classes (`app/Policies/`) handle all authorisation. Controllers call `$this->authorize()`.
- Project access model (`isOwner`, `hasAccess`, `isLocked`) is computed server-side per request.
- Role-based middleware or policy gates prevent cross-role access to admin/secretary/management-only endpoints.
- Inactive users (deactivated by Admin) receive `403` on login attempt.

## Offline-First Behaviour for Field Use

Core functions must work on weak or absent connectivity and sync on reconnect.

### What Must Work Offline
- **Activity logging** — the three-step form (WF05a) must work offline. Data is queued in IndexedDB or localStorage and synced when connectivity returns.
- **Draft saving** — report drafts can be saved locally and submitted later.
- **Project browsing** — cached project directory and project detail views should be readable offline.
- **Library browsing** — cached library documents and search results should be accessible offline.

### What Requires a Connection
- **AI Assistant ("Ask SKMS")** — requires a connection for retrieval and synthesis. Users can type questions offline; they are queued and answered on reconnect.
- **Real-time notifications** — bell badge counts only update when online.

### Implementation Approach (v1)
- Service Worker with cache-first strategy for GET requests to project directory, library browse, and static assets.
- IndexedDB queue for POST/PUT/DELETE requests when offline. On `online` event, replay the queue.
- Frontend detects online/offline state via `navigator.onLine` and `window` `online`/`offline` events.
- Show a subtle offline indicator in the nav bar when disconnected.

## Backup / Durability

- **Database:** MySQL daily automated backups. Backups stored in separate geographic location (S3-compatible storage).
- **File storage:** S3-compatible in production with cross-region replication enabled. Local disk for development only.
- **Retention:** At least 30 days of daily backups. Monthly backups retained for 12 months.
- **Point-in-time recovery:** MySQL binary logs enabled for point-in-time recovery capability.

## Performance

- **Dashboard page load:** All four dashboard fetches must complete within 2 seconds (p95) under normal load.
- **Executive Dashboard:** Six parallel fetches. Each individual fetch must complete within 3 seconds. Failure of one fetch must not block the others.
- **Library search (FTS):** Full-text search must return results within 3 seconds for a corpus of up to 10,000 documents.
- **Report list loads:** Paginated lists must load first page within 1.5 seconds.
- **File uploads:** Sequential file uploads in Log Activity should show individual progress. 10MB file upload should complete within 30 seconds on typical connectivity.
- **AI query:** Target response time under 10 seconds for most queries. Timeout at 30 seconds on the backend; frontend shows retry on timeout.

## Audit / Traceability

- **Report submissions:** Every state change (submitted, returned, resubmitted, approved, escalated) is timestamped and attributed to the acting user.
- **Submission history:** Stored as `ReportComment` records with `userId`, `comment`, and `createdAt`.
- **Document actions:** Publishing to library is logged. Deleting documents is logged.
- **Access requests:** Every access request (created, granted, denied) is timestamped and attributed.
- **Authentication:** Login and logout events are logged for security audit.

## File Upload Constraints

| Context | Allowed MIME Types | Max Size |
|---------|-------------------|----------|
| Activity attachments | `application/pdf`, `image/*`, `application/vnd.openxmlformats-officedocument.*`, `application/vnd.ms-*`, `text/csv`, `application/zip` | 25 MB per file |
| Report files (PDF) | `application/pdf` | 50 MB per file |
| Publication manuscripts | `application/pdf`, `application/vnd.openxmlformats-officedocument.*` | 50 MB per file |

- File type validation is enforced server-side (MIME type sniffing, not just extension).
- File size validation is enforced both client-side (before upload) and server-side.
- Uploaded files are stored outside the web root. Access is controlled via signed URLs or application-level download endpoints (not direct filesystem access).

## Notifications / Inbox Delivery Model

**v1 decision: Polling-based.** The notification bell polls every 60 seconds via a lightweight endpoint returning the unread count. The Inbox screen fetches its data on mount with manual refresh options.

**Rationale:** Real-time delivery (WebSockets, Laravel Reverb, Pusher) adds operational complexity that is not warranted for v1. The 60-second poll interval is acceptable for SKMS's usage patterns (not a real-time chat application).

**Future state:** The Events/Listeners layer is already structured to support real-time broadcasting. Adding a WebSocket broadcaster later requires only adding `ShouldBroadcast` to event classes and configuring a broadcast driver — no changes to business logic.
