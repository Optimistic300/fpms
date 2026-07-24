# WF01 — Shell

## Purpose
Layout wrapper. Every authenticated page renders inside this shell. Build this before any other screen.

## Entry Points
- All authenticated routes render within this shell.
- Login page (WF02) is the only public screen rendered outside the shell.

## Data Fetched on Mount
- `GET /api/inbox?page=1&limit=1` (for unread count in bell badge — or a dedicated unread count endpoint)
- Poll unread count every 60 seconds

## Layout Regions

### Top Nav Bar (fixed, always visible)
Left to right:
- **Logo** → links to user's landing screen based on role
- **Action buttons** (Log Activity, New Project) — hidden for SECRETARY and ADMIN; show **role tag pill** instead
- **Notification bell** with unread badge count
- **Avatar** with user initials

### Left Sidebar
Sections:
- **Workspace:** Dashboard, Projects, My Activities, Reports
- **Institute:** Library, Publications, Inbox
- **Role-specific additions:**
  - SECRETARY: Report Queue, Submission History
  - DIVISION_HEAD: Division Overview
  - MANAGEMENT: Executive Dashboard
  - ADMIN: User Management, Settings (replaces everything else)

Active item: white background + left border + bold text.
Badges: pending count on Reports, unread count on Inbox.
Role determines which sidebar items render (see `01-roles-and-permissions.md`).

### Content Area
All page content renders here. Only this region changes on navigation. Never unmounts shell components.

### Floating AI Button (global)
- Gold circle, `position: fixed`, bottom-right
- Hover → expands to show "Ask SKMS" label
- Click → opens AI panel (WF13)
- On mobile (<768px): moves to bottom-left

## Interactive Elements
- **Sidebar items** → navigate to routes
- **Bell** → click = dropdown tray with recent items; not a page navigation
- **Avatar** → click = dropdown with profile info, logout
- **Log Activity** → navigates to `/log-activity`
- **New Project** → opens "New Project" modal

## Edge Cases
- **Role with no action buttons (SECRETARY/ADMIN):** show role tag pill in header instead of Log Activity / New Project buttons
- **Bell count decrement:** keep in sync when inbox items are marked read (shared NotificationContext)
- **Mobile (<768px):** sidebar hides → bottom tab bar: Dashboard, Projects, Log, Library, Inbox. AI button moves to bottom-left.

## Visual Reference
*See `docs/wireframes.md` WF01 for the annotated screenshot. Wireframe images were unavailable at time of writing; see `09-open-questions-and-assumptions.md`.*
