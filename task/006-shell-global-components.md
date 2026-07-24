# Task 006: Shell & Global Components

**Status:** Done
**Depends on:** 004, 005
**Docs referenced:** `docs/04-frontend-architecture.md`, `docs/05-screens/01-shell.md`, `docs/01-roles-and-permissions.md`, `docs/08-glossary.md`

## Objective

Build the navigation shell (WF01) that wraps every authenticated page: top nav bar, role-aware sidebar, content area, floating AI button, notification bell (stub until Task 007), and the three React contexts (AuthContext already created in Task 005, NotificationContext, AIContext). Establish the routing table mapping routes to screens.

## Context

Every frontend screen from Task 014 onwards renders inside this shell. It must be built before any screen can be implemented. The shell fetches role-specific data to determine sidebar items, badge counts, and action button visibility. The floating AI button and notification bell are globally mounted and persist across navigation.

## Scope

**In scope:**
- Top nav bar: logo, action buttons (Log Activity, New Project — role-dependent), notification bell, avatar dropdown
- Left sidebar: role-aware navigation links per `01-roles-and-permissions.md`, active state indicators, badges (Reports pending, Inbox unread)
- Content area: renders active route component
- Floating AI button: gold circle, fixed position, hover-to-expand, click opens AI panel
- `NotificationContext`: `{ unreadCount, refreshCount }` — stubbed with polling to be wired in Task 007
- `AIContext`: `{ isOpen, conversationHistory, openPanel(), closePanel() }` — stubbed until Task 025
- Routing table per `04-frontend-architecture.md`
- Mobile breakpoint (<768px): sidebar becomes bottom tab bar (Dashboard, Projects, Log, Library, Inbox)
- Error boundary component at app root

**Out of scope:**
- Login page (Task 005)
- Any specific screen content (Tasks 014-023)
- Actual notification bell data fetching (Task 007 — this task shows a stub badge)
- Actual AI panel (Task 025 — this task creates the button and open/close only)

## Relevant data model

Not directly — this task touches no entities beyond reading the user's role from AuthContext.

## Relevant API contract

### `GET /api/inbox?page=1&limit=1` (for unread count)
**Auth:** Required
**Roles:** All
Used by the notification bell to fetch unread count. Response includes `meta.unreadCount`.

## Relevant frontend behavior

### Shell (WF01) Layout Regions

**Top Nav Bar** (fixed, always visible):
- Left: Logo → links to role-based landing screen
- Center: Action buttons (Log Activity, New Project) — hidden for SECRETARY and ADMIN; show role tag pill instead
- Right: Notification bell with unread badge, Avatar with user initials

**Left Sidebar:**
- Workspace section: Dashboard, Projects, My Activities, Reports
- Institute section: Library, Publications, Inbox
- Role-specific additions:
  - SECRETARY: Report Queue, Submission History
  - DIVISION_HEAD: Division Overview
  - MANAGEMENT: Executive Dashboard
  - ADMIN: User Management, Settings (replaces everything else)
- Active item: white background + left border + bold text
- Badges: pending count on Reports, unread count on Inbox

**Content Area:**
- All page content renders here. Only this region changes on navigation.
- Shell components never unmount.

**Floating AI Button:**
- Gold circle, `position: fixed`, bottom-right
- On mobile (<768px): bottom-left
- Hover → expands to show "Ask SKMS" label
- Click → opens AI panel (stub until Task 025)

**Mobile (<768px):**
- Sidebar hides
- Bottom tab bar: Dashboard, Projects, Log, Library, Inbox
- AI button moves to bottom-left

### Routing Table
| Route | Screen | Role Access |
|-------|--------|-------------|
| `/login` | Login | Public |
| `/dashboard` | Dashboard | RESEARCHER, STUDENT |
| `/projects` | Project Directory | All (except ADMIN) |
| `/projects/:id` | Project Detail | Owner/HasAccess |
| `/projects/:id/preview` | Project Preview | All |
| `/log-activity` | Log Activity | RESEARCHER, STUDENT, DIVISION_HEAD |
| `/activities` | My Activities | RESEARCHER, STUDENT, DIVISION_HEAD |
| `/reports/new` | Submit Report | RESEARCHER, STUDENT, DIVISION_HEAD |
| `/reports` | My Reports | RESEARCHER, STUDENT, DIVISION_HEAD |
| `/queue` | Report Queue | SECRETARY |
| `/queue/:reportId` | Report Review | SECRETARY |
| `/division` | Division Dashboard | DIVISION_HEAD |
| `/executive` | Executive Dashboard | MANAGEMENT |
| `/library` | Library | All |
| `/publications` | Publications | All |
| `/inbox` | Inbox | All |
| `/users` | User Management | ADMIN |
| `/settings` | Settings | ADMIN |

### Loading/Error States
- Skeleton loaders for sidebar (brief, initial load)
- Error boundary catches unhandled React errors, shows fallback UI

## Architectural conventions that apply

- Shell components are mounted at app root level and never unmount
- `NotificationContext` is provided by the shell, consumed by bell and inbox
- `AIContext` is provided by the shell, consumed by AI button and panel
- AuthContext is provided at the app root (can be above the shell)
- Sidebar items are rendered from a role-configurable array
- Mobile detection via CSS media queries + optional `useMediaQuery` hook
- Axios instance from Task 005 is used for all API calls
- React Router v6+ `createBrowserRouter` or nested `<Routes>` inside shell layout

## Step-by-step implementation checklist

- [ ] Create shell layout component `resources/js/components/layout/AppShell.jsx`:
  - TopNav, Sidebar, ContentArea, AIButton rendered as children or sections
  - Uses `AuthContext` to get user role
- [ ] Create `TopNav.jsx`:
  - Logo with role-based landing link
  - Conditional action buttons (hidden for SECRETARY, ADMIN)
  - Role tag pill for SECRETARY/ADMIN
  - NotificationBell component
  - Avatar component with dropdown (profile, logout)
- [ ] Create `Sidebar.jsx`:
  - Build menu items array from role via `getSidebarItems(role)` helper
  - Active item detection via `useLocation()`
  - Badge counts from NotificationContext (for Inbox) and TODO stub for Reports
- [ ] Create `BottomTabBar.jsx` (mobile):
  - Shown below 768px
  - Dashboard, Projects, Log, Library, Inbox icons + labels
- [ ] Create `NotificationBell.jsx`:
  - Shows unread badge count from NotificationContext
  - Click → dropdown tray with recent items (placeholder until Task 007)
  - Polls NotificationContext.refreshCount every 60s
- [ ] Create `AvatarDropdown.jsx`:
  - Shows user initials from AuthContext
  - Dropdown: user info, logout button
- [ ] Create `resources/js/contexts/NotificationContext.jsx`:
  - `{ unreadCount, refreshCount }`
  - `refreshCount()` calls `GET /api/inbox?page=1&limit=1` and reads `meta.unreadCount`
  - Polls on mount every 60 seconds via `setInterval`
- [ ] Create `resources/js/contexts/AIContext.jsx`:
  - `{ isOpen, conversationHistory, openPanel(), closePanel(), setConversationHistory() }`
  - Not connected to any API yet (stub)
- [ ] Create `FloatingAIButton.jsx`:
  - Gold circle, fixed position, bottom-right
  - Hover → width expands, "Ask SKMS" label fades in
  - Click → calls `AIContext.openPanel()`
  - On mobile: bottom-left
- [ ] Create `AIPanel.jsx` placeholder:
  - Slide-in overlay from right
  - Shows "Coming soon" until Task 025
  - Close button calls `AIContext.closePanel()`
  - Dims page behind when open
- [ ] Create `ErrorBoundary.jsx` wrapper component
- [ ] Set up routing in `App.jsx` using React Router:
  - Public routes: `/login`
  - Protected routes (inside AppShell): all authenticated routes
  - Lazy-load each screen component for code splitting
  - Routes render placeholder components ("Coming soon") for screens not yet implemented
- [ ] Add responsive CSS: sidebar → bottom tabs below 768px
- [ ] Add skeleton loading state for initial shell render

## Definition of done

- Shell renders with correct sidebar items for each role (RESEARCHER, SECRETARY, DIVISION_HEAD, MANAGEMENT, ADMIN)
- Active sidebar item has white background + left border + bold text
- Notification bell shows count (starts at 0, will work after Task 007)
- Avatar shows user initials and dropdown with logout
- Action buttons (Log Activity, New Project) visible for RESEARCHER/STUDENT/DIVISION_HEAD
- SECRETARY and ADMIN show role tag pill instead of action buttons
- Floating AI button is visible on all authenticated pages
- Mobile breakpoint: sidebar replaced by bottom tab bar, AI button moves
- Routing table maps all routes to their corresponding components (with placeholders for unimplemented screens)
- ProtectedRoute redirects to /login if not authenticated
- Error boundary catches crashes and shows fallback
- All contexts (AuthContext, NotificationContext, AIContext) are provided at the app root

## Open questions / assumptions inherited

- **Role tag pill appearance** — not specified in wireframes; implement as a small colored badge showing the role name, per `09-open-questions-and-assumptions.md`.
- **Notification bell polling** — 60-second interval via `setInterval`. Real-time delivery available as future upgrade.
- **For the sidebar item "Reports" badge count** — this task stubs the count as 0. The actual count endpoint will be wired from Task 011/013.
