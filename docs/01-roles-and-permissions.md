# Roles and Permissions

## Role Definitions

| Role Constant | Display Name | Landing Screen |
|---------------|-------------|----------------|
| `RESEARCHER` | Researcher | `/dashboard` |
| `STUDENT` | CCST Student | `/dashboard` |
| `SECRETARY` | Scientific Secretary | `/queue` |
| `DIVISION_HEAD` | Division Head | `/division` |
| `MANAGEMENT` | Management / Director | `/executive` |
| `ADMIN` | Administrator | `/users` |

## Permission Matrix

| Capability | RESEARCHER | STUDENT | SECRETARY | DIVISION_HEAD | MANAGEMENT | ADMIN |
|---|---|---|---|---|---|---|
| View project directory (metadata) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own project contents | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Edit own project | ✅ | ✅ | — | ✅ | — | — |
| View division project contents | — | — | — | ✅ | ✅ | — |
| View all project contents (any division) | — | — | — | — | ✅ | — |
| Create project | ✅ | ✅ | — | ✅ | — | — |
| Log activity | ✅ | ✅ | — | ✅ | — | — |
| Edit/delete own activity | ✅ | ✅ | — | ✅ | — | — |
| Submit report | ✅ | ✅ | — | ✅ | — | — |
| Resubmit returned report | ✅ | ✅ | — | ✅ | — | — |
| Review reports (queue) | — | — | ✅ | — | — | — |
| Approve/Return/Escalate reports | — | — | ✅ | — | — | — |
| View report queue | — | — | ✅ | — | ✅ | — |
| View division report status | — | — | — | ✅ | ✅ | — |
| View executive/institute stats | — | — | — | — | ✅ | — |
| Add/edit own publication | ✅ | ✅ | — | ✅ | — | — |
| View all publications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Publish document to library | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Browse library | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search library | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Use AI assistant | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Forward documents via inbox | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage users | — | — | — | — | — | ✅ |
| Manage system settings | — | — | — | — | — | ✅ |
| View own inbox | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View division overview | — | — | — | ✅ | ✅ | — |
| View executive dashboard | — | — | — | — | ✅ | — |
| View submission history (all) | — | — | ✅ | — | — | — |
| View division report compliance | — | — | — | ✅ | ✅ | — |

## Project Ownership, Access, and Lock Model

Every project response includes three boolean fields that govern what the requesting user can see and do:

### `isOwner`
- `true` if the user created the project or is listed as a member with role `LEAD`
- Owners can: edit project details, log activities, submit reports, manage team, delete project resources

### `hasAccess`
- `true` if the user is a project member (role `COLLABORATOR`) or has been granted explicit access
- Users with access can: view full project contents (documents, activities, reports), but **cannot** edit project metadata or manage team
- Owners and Division Heads always have access to projects in their division

### `isLocked`
- `true` if the user has neither `isOwner` nor `hasAccess`
- Locked projects render a **preview** page (metadata only) with a "Request access" button
- The project detail endpoint returns `403` for locked projects, signalling the frontend to show the preview route

### Access Request Flow
1. Non-owner/non-member views a locked project preview
2. Clicks "Request access" → `POST /api/projects/:id/access-requests`
3. Project owner receives an inbox notification
4. Owner can grant or deny; access status is tracked

## Division Head Scope
- Division Heads have `isOwner: true` behaviour for **all** projects within their own division
- They can edit project metadata, view all documents/activities/reports, and manage team membership
- Access is scoped to their division only; they see other divisions' projects as locked

## Admin Capabilities (Assumed — No Wireframe Provided)
Since no wireframe specifies Admin screens (WF01 states Admin gets "User Management + Settings" without detail), the minimum viable Admin capability set is:

- **User Management:** View all users; create new users; deactivate/reactivate users; assign roles and divisions; reset passwords
- **Settings:** System-level configuration (division management, document type options, activity type options)
- Admin has no project, report, or publication creation/editing capabilities — their role is operational
- Admin sees no personal "dashboard"; the login landing is `/users`

## Sidebar Visibility by Role

| Sidebar Item | RESEARCHER | STUDENT | SECRETARY | DIVISION_HEAD | MANAGEMENT | ADMIN |
|---|---|---|---|---|---|---|
| Dashboard | ✅ | ✅ | — | — | — | — |
| Projects | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| My Activities | ✅ | ✅ | — | ✅ | — | — |
| Reports | ✅ | ✅ | — | ✅ | — | — |
| Library | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Publications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Inbox | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Report Queue | — | — | ✅ | — | — | — |
| Submission History | — | — | ✅ | — | — | — |
| Division Overview | — | — | — | ✅ | — | — |
| Executive Dashboard | — | — | — | — | ✅ | — |
| User Management | — | — | — | — | — | ✅ |
| Settings | — | — | — | — | — | ✅ |
