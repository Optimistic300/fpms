# Task 027: Offline Support

**Status:** Done
**Depends on:** 001
**Docs referenced:** `docs/07-non-functional-requirements.md` (Offline-First Behaviour), `docs/04-frontend-architecture.md` (Offline Queue), `docs/09-open-questions-and-assumptions.md` (Offline Sync Strategy)

## Objective

Implement offline-first behavior for field use: service worker with cache-first strategy for GET requests, IndexedDB queue for POST/PUT/DELETE mutations when offline, offline detection indicators, and queue replay on reconnect.

## Context

Scientists work in the field with weak or absent connectivity. Activity logging and report draft saving must work offline. Cached project directory and library documents should be readable. The AI Assistant requires connectivity but can queue questions. When connectivity returns, queued operations replay in FIFO order.

## Scope

**In scope:**
- Service Worker: cache-first for GET requests to project directory, library browse, and static assets
- IndexedDB queue for offline mutation requests (activity POST, draft save)
- `navigator.onLine` detection and `window` `online`/`offline` event listeners
- Offline indicator in the nav bar when disconnected
- Queue replay on `online` event (FIFO order)
- AI Assistant question queuing (store questions locally, submit on reconnect)
- Draft saving to localStorage for report wizard

**Out of scope:**
- Complex conflict resolution (optimistic concurrency deferred to v2 per `09-open-questions-and-assumptions.md`)
- Real-time notification sync (polling only works when online, per `07-non-functional-requirements.md`)
- Full offline support for all screens (only the priority list from docs)

## Relevant API contract

No new endpoints — this task is entirely frontend + service worker.

## Architectural conventions that apply

- Service Worker is registered from the main app entry point
- Cache-first strategy: serve from cache, fetch from network, update cache on success
- IndexedDB queue stores: endpoint, method, body, timestamp, retryCount
- On `online` event: replay queue items in FIFO order, remove on success, keep on failure for retry
- Online/offline state is surfaced via a React context or simple state in the nav component
- AI Assistant: queued questions stored in a separate IndexedDB store or as part of the general mutation queue

## Step-by-step implementation checklist

- [ ] Create `public/sw.js` service worker:
  - Install event: cache static assets (JS, CSS, fonts)
  - Fetch event: cache-first strategy for GET requests to `/api/projects`, `/api/library`, static assets
  - Network-only for all POST/PUT/DELETE/PATCH
  - Cache versioning for cache busting on deploy
- [ ] Register service worker in main app entry point (`resources/js/app.jsx`):
  - `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js') }`
- [ ] Create `resources/js/services/offlineQueue.js`:
  - IndexedDB wrapper: open `skms-offline` database with `mutations` object store
  - `enqueue(method, url, body)` — store request for later replay
  - `dequeue()` — get next pending mutation
  - `processQueue()` — on `online` event, replay mutations in FIFO order, remove on success
  - Retry logic: max 3 retries, exponential backoff
- [ ] Create `resources/js/hooks/useOnlineStatus.js`:
  - `navigator.onLine` + `online`/`offline` event listeners
  - Returns `{ isOnline }`
- [ ] Create `resources/js/components/layout/OfflineIndicator.jsx`:
  - Subtle indicator in nav bar: yellow/orange bar or icon when offline
  - "You are offline. Changes will sync when reconnected."
- [ ] Integrate offline queue with Axios instance:
  - Request interceptor: check if offline and request is mutation → enqueue instead of sending
  - Response interceptor for failed requests (network error) → optionally enqueue for retry
- [ ] Implement AI Assistant question queuing:
  - When offline and user submits a question, store it locally
  - Show "Question saved. It will be answered when you reconnect."
  - On reconnect, submit queued questions in order
- [ ] Implement draft saving to localStorage:
  - Report wizard: auto-save form state to localStorage on step change
  - Restore from localStorage when user returns to `/reports/new?draft=:localId`
  - Clear localStorage draft on successful submit
- [ ] Test offline behavior: toggle DevTools offline mode, verify mutations queue, verify replay on reconnect

## Definition of done

- Service Worker caches static assets and project/library GET responses
- When offline, activity POST is queued to IndexedDB instead of failing
- When online event fires, queued mutations replay in FIFO order
- Offline indicator shown in nav bar when disconnected
- AI Assistant shows "question saved" when offline, submits on reconnect
- Report draft form auto-saves to localStorage, restores on return
- No data loss on page refresh (queued operations survive refresh via IndexedDB)
- `navigator.onLine` detection works across all major browsers

## Completion Notes

**Date:** 2026-07-07
**Implemented by:** Subagent (ses_0c154f563ffen5SV06jHqDD2BT)

Audited all 7 existing offline-support files against DoD. Registered service worker (already done). Added global online event handler for AI question queue in app.jsx. Created offline fallback page (public/offline.html). Fixed fake-indexeddb Infinity incompatibility in offlineQueue.js. Installed Vitest + test libraries. Wrote 41 passing tests across 7 test files covering all offline components, hooks, and services.

## Open questions / assumptions inherited

- **No conflict resolution for v1** — offline queued operations are POSTs (new records) which are inherently conflict-free. Optimistic concurrency (_updated_at_ checks) deferred to v2 per `09-open-questions-and-assumptions.md`.
