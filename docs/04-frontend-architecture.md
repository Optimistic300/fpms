# Frontend Architecture

## Tech Stack
- React 18+ with Vite
- React Router v6+ (client-side routing)
- Axios (HTTP client with base URL `/api`)
- DOMPurify (sanitising library search snippets)
- Service Worker (offline support)

## Routing Table

| Route | Screen | Role Access | WF |
|-------|--------|-------------|----|
| `/login` | Login | Public | 02 |
| `/dashboard` | Dashboard | RESEARCHER, STUDENT | 03 |
| `/projects` | Project Directory | All (except ADMIN) | 04a |
| `/projects/:id` | Project Detail | Owner/HasAccess | 04b |
| `/projects/:id/preview` | Project Preview (locked) | All | 04b |
| `/log-activity` | Log Activity | RESEARCHER, STUDENT, DIVISION_HEAD | 05a |
| `/activities` | My Activities | RESEARCHER, STUDENT, DIVISION_HEAD | 05b |
| `/reports/new` | Submit Report | RESEARCHER, STUDENT, DIVISION_HEAD | 06a |
| `/reports` | My Reports | RESEARCHER, STUDENT, DIVISION_HEAD | 06b |
| `/queue` | Report Queue | SECRETARY | 07a |
| `/queue/:reportId` | Report Review | SECRETARY | 07b |
| `/division` | Division Dashboard | DIVISION_HEAD | 08 |
| `/executive` | Executive Dashboard | MANAGEMENT | 09 |
| `/library` | Library | All | 10 |
| `/publications` | Publications | All | 11 |
| `/inbox` | Inbox | All | 12 |
| `/users` | User Management | ADMIN | (unwired) |
| `/settings` | Settings | ADMIN | (unwired) |

## Global / Persistent Components

These components are mounted at the app root level and never unmount during navigation:

### Navigation Shell (WF01)
- **Top nav bar** — fixed, always visible. Contains logo, action buttons (Log activity, New project — hidden for SECRETARY and ADMIN), notification bell with unread badge, avatar.
- **Left sidebar** — role-aware navigation links. Active item has white background + border + bold. Badges on Reports and Inbox show pending/unread counts.
- **Content area** — renders active route. Only this region changes on navigation.

### Floating AI Button (WF13)
- Gold circle, `position: fixed`, bottom-right (bottom-left on mobile below 768px).
- Global component mounted at app root.
- Click → opens AI panel as right slide-in overlay.
- Panel persists across all route changes, conversation state preserved.
- Page behind dims (`rgba(0,0,0,0.18)`) while panel is open.

### Notification Bell
- Fetches unread count on mount.
- Polls every 60 seconds for fresh count.
- Click → dropdown tray (not a page navigation).
- Bell count decrements when inbox items are marked read.

## State Management

### Global State (React Context)
- **AuthContext** — `{ token, user, isAuthenticated, login(), logout() }`. Token stored in localStorage. On app load, validates stored token before rendering any authenticated route.
- **NotificationContext** — `{ unreadCount, refreshCount }`. Shared between bell component and inbox.
- **AIContext** — `{ isOpen, conversationHistory, openPanel(), closePanel() }`. Persists across route changes.

### Per-Screen State
- All form data (Log Activity multi-step, Submit Report multi-step) lives in local component state.
- Table filter state (search, status, division dropdowns) is component-local.
- No global state for table data — each screen fetches its own.

### Offline Queue
- Activity logging and draft-saving must work offline. See `07-non-functional-requirements.md` for details.

## Multi-Step Form Pattern

Used by: **Log Activity** (WF05a, 3 steps) and **Submit Report** (WF06a, 4 steps).

### Conventions
1. **Nothing submits until the final step.** All form data accumulates in component state across steps.
2. **Back preserves state.** Navigating to a previous step retains all filled values.
3. **`beforeunload` warning** fires if the user navigates away mid-flow without saving as draft.
4. **Step indicator** always visible at the top, showing current step position.
5. **Draft save** available on non-final steps via `POST /api/reports/draft` (reports only) or local storage (activities).

### File Upload in Multi-Step
- In Log Activity Step 2, files are queued in state but NOT uploaded until final submit.
- On final submit: `POST /api/activities` first, then `POST /api/activities/:id/documents` per file sequentially.
- Each file upload shows its own progress bar.
- If a file fails, show error on that file with retry button; do not block other uploads.

## Loading / Skeleton / Empty State Conventions

### Loading
- Every data-fetching screen shows **skeleton loaders** matching the layout of the content being loaded.
- Never show a blank page or a global spinner.

### Empty States
- Each list view has a specific empty state message and optional CTA:

| Screen | Empty State Message | CTA |
|--------|-------------------|-----|
| Project Directory (Shared tab) | "No projects have been shared with you yet" | None |
| My Activities | "No activities logged yet." | Log activity button |
| Report Queue | "No reports pending review." Green check icon | None |
| Library (Admin) | "The library has no published documents yet." | None |
| Library (others) | "No documents match your filters." | Clear filters button |
| Inbox | "Your inbox is empty." | None |
| AI Assistant search | "No documents found matching '[query]'. Try different keywords or use Ask SKMS." | Ask SKMS button |

### Error States
- **Per-panel error:** If one data fetch fails on a page with multiple fetches (e.g., Executive Dashboard), show an error banner for that panel only. Do not fail the whole page.
- **Global error boundary:** Catch unhandled React errors and show a fallback UI with "Something went wrong. Please refresh the page."

## Mobile Breakpoint

**Below 768px:**
- Sidebar hides → bottom tab bar appears (Dashboard, Projects, Log, Library, Inbox).
- AI button moves to bottom-left.
- AI panel takes full screen width when open.
- Login page: left brand panel collapses to just the logo above the form.
- Tables: horizontal scroll or switch to card layout.

## Security: Frontend Cannot Enforce Permissions

All permission checks are server-side. The frontend:
- Hides UI elements (buttons, sidebar items) based on role for UX convenience.
- Does NOT rely on hidden UI as a security mechanism — the API enforces all restrictions and returns 403 where access is denied.
- Redirects to preview page when `GET /api/projects/:id` returns 403.
