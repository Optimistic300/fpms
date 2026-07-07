# Task 008: Projects Backend

**Status:** Done
**Depends on:** 003, 004
**Docs referenced:** `docs/03-api-reference.md` (Projects section), `docs/02-data-model.md` (Project, ProjectMember, AccessRequest), `docs/01-roles-and-permissions.md`, `docs/04b-backend-architecture.md`

## Objective

Implement all backend endpoints for Projects, Project Members, and Access Requests: CRUD operations, member management (add/list), access request flow, and the project directory listing with `isOwner`/`hasAccess`/`isLocked` computation per user. Projects are the central entity — reports, activities, and documents are attached to them.

## Context

Researchers, Students, and Division Heads can create and manage projects. Every user can view the project directory (metadata only), but project contents are gated by ownership (`isOwner`), granted access (`hasAccess`), or locked (`isLocked`). Division Heads have owner-level access to all projects in their division.

## Scope

**In scope:**
- `GET /api/projects` — list all projects with access fields per user, filtering, pagination, search
- `POST /api/projects` — create project, creator becomes LEAD member
- `GET /api/projects/:id` — full detail (or 403 if locked)
- `PUT /api/projects/:id` — update metadata
- `GET /api/projects/:id/members` — list members
- `POST /api/projects/:id/members` — add member by email
- `POST /api/projects/:id/access-requests` — request access to locked project
- `PATCH /api/access-requests/:id` — grant/deny access request (on Project)
- `ProjectPolicy` — authorization rules
- `ProjectResource` with access fields, member list, member objects
- Action classes: `CreateProjectAction`, `UpdateProjectAction`, `AddMemberAction`, `RequestAccessAction`

**Out of scope:**
- Activities (Task 009)
- Documents (Task 010)
- Reports (Task 011)
- Frontend screens for projects (Tasks 014, 015)

## Relevant data model

### Project
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| title | varchar(255) | |
| description | text, nullable | |
| divisionId | bigint | FK |
| leadResearcherId | bigint | FK (user who created it) |
| fundingType | enum | DONOR, GOVERNMENT, INTERNAL |
| fundingSource | varchar(255), nullable | |
| researchArea | varchar(255), nullable | |
| location | varchar(255), nullable | |
| startDate | date | |
| endDate | date, nullable | |
| status | enum | PROPOSED, ACTIVE, COMPLETED, ARCHIVED |
| progress | tinyint | 0-100 |
| timestamps | | |

### ProjectMember
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| projectId | bigint | FK |
| userId | bigint | FK |
| role | enum | LEAD, COLLABORATOR |
| addedAt | timestamp | |

### AccessRequest
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| projectId | bigint | FK |
| requesterId | bigint | FK |
| status | enum | PENDING, GRANTED, DENIED |
| timestamps | | |

## Relevant API contract

### `GET /api/projects`
**Auth:** Required, **Roles:** All
**Query Params:** `owner=me`, `status`, `division`, `fundingType`, `researchArea`, `page`, `limit`, `q`
**Response 200:** Array of `{ id, title, division, lead, fundingType, status, progress, isOwner, hasAccess, isLocked }` + pagination meta

### `POST /api/projects`
**Auth:** Required, **Roles:** RESEARCHER, STUDENT, DIVISION_HEAD
**Request:** `{ title, divisionId, fundingType, researchArea, location, startDate, endDate?, description? }`
**Response 201:** `{ data: { id, title, status }, message: "Project created." }`

### `GET /api/projects/:id`
**Auth:** Required, **Roles:** All (403 if locked)
**Response 200:** Full detail with members, activityCount, documentCount
**Response 403:** `{ message: "You do not have access...", data: { isLocked: true, title, lead, division, status, researchArea, startDate, endDate } }`

### `PUT /api/projects/:id`
**Auth:** Required, **Roles:** Owner or Division Head
**Request:** Same fields as POST (all optional)
**Response 200:** Updated project

### `GET /api/projects/:id/members`
**Auth:** Required, **Roles:** Owner, collaborator, Division Head
**Response 200:** Array of `{ userId, fullName, role, addedAt }`

### `POST /api/projects/:id/members`
**Auth:** Required, **Roles:** Owner or Division Head
**Request:** `{ email, role }` (role: LEAD or COLLABORATOR)
**Response 201:** `{ data: { userId, fullName, role }, message: "Member added." }`

### `POST /api/projects/:id/access-requests`
**Auth:** Required, **Roles:** All
**Response 201:** `{ message: "Access request sent." }`

### `PATCH /api/access-requests/:id`
**Auth:** Required, **Roles:** Project owner
**Request:** `{ status: "GRANTED" | "DENIED" }`
**Response 200:** Updated access request

## Architectural conventions that apply

- `ProjectPolicy` handles all authorization (`view`, `viewAny`, `create`, `update`, `addMember`):
  - `view`: returns true if `isOwner || hasAccess || user->isDivisionHeadOfProjectDivision || user->role === MANAGEMENT`
  - `create`: checks role is RESEARCHER, STUDENT, or DIVISION_HEAD
  - `update`: returns true if user is owner or Division Head of the project's division
  - `addMember`: same as update
- `isOwner` is computed: `$user->id === $project->leadResearcherId || $project->members()->where('user_id', $user->id)->where('role', 'LEAD')->exists()`
- `hasAccess` is computed: `$project->members()->where('user_id', $user->id)->exists()`
- `isLocked` is computed: `!isOwner && !hasAccess && !isDivisionHead && role !== MANAGEMENT`
- For list endpoint, compute these per project in a database-friendly way (eager load members, compare in PHP)
- Access request: after creation, fire `AccessRequestCreated` event → listener sends notification to project owner
- `ProjectResource` includes computed access fields and member array
- Use `ApiRequest` (camelCase → snake_case transformation) for all form requests

## Step-by-step implementation checklist

- [ ] Create `app/Policies/ProjectPolicy.php` with methods: `view`, `viewAny`, `create`, `update`, `addMember`, `manageAccessRequests`
- [ ] Register `ProjectPolicy` in `AuthServiceProvider`
- [ ] Create `app/Http/Resources/ProjectResource.php` — includes `isOwner`, `hasAccess`, `isLocked`, members array
- [ ] Create `app/Http/Resources/ProjectMemberResource.php`
- [ ] Create `app/Http/Resources/AccessRequestResource.php`
- [ ] Create `app/Http/Requests/StoreProjectRequest.php` — validates title, divisionId, fundingType, startDate, etc.
- [ ] Create `app/Http/Requests/UpdateProjectRequest.php` — all optional
- [ ] Create `app/Http/Requests/AddMemberRequest.php` — validates email (exists:users), role (in: LEAD, COLLABORATOR)
- [ ] Create `app/Http/Requests/StoreAccessRequestRequest.php`
- [ ] Create `app/Http/Requests/UpdateAccessRequestRequest.php` — validates status (in: GRANTED, DENIED)
- [ ] Create `app/Actions/Project/CreateProjectAction.php`:
  - Create project with `leadResearcherId = auth()->id()`
  - Create ProjectMember record with role LEAD
  - Return project
- [ ] Create `app/Actions/Project/UpdateProjectAction.php` — update validated fields only
- [ ] Create `app/Actions/Project/AddMemberAction.php` — find user by email, validate not already member, create ProjectMember
- [ ] Create `app/Actions/Project/RequestAccessAction.php` — create AccessRequest with status PENDING, fire `AccessRequestCreated` event
- [ ] Create `app/Http/Controllers/Api/ProjectController.php` with methods: `index`, `store`, `show`, `update`, `members`, `addMember`, `requestAccess`
- [ ] Create `app/Http/Controllers/Api/AccessRequestController.php` with method: `update` (grant/deny)
- [ ] Register routes in `routes/api.php`:
  - `GET /projects`, `POST /projects`
  - `GET /projects/{id}`, `PUT /projects/{id}`
  - `GET /projects/{id}/members`, `POST /projects/{id}/members`
  - `POST /projects/{id}/access-requests`
  - `PATCH /access-requests/{id}`
- [ ] Write tests for each endpoint covering: successful operations, 403 for unauthorized, 422 for validation, locked project 403 behavior, Division Head access, Management access

## Definition of done

- `GET /api/projects` returns paginated project list with `isOwner`/`hasAccess`/`isLocked` computed per user
- `GET /api/projects` filters by `?owner=me`, `?status=`, `?division=`, `?q=`
- `POST /api/projects` creates project and LEAD member record
- `GET /api/projects/:id` returns full detail with members for authorized user
- `GET /api/projects/:id` returns 403 with preview data for locked project
- `PUT /api/projects/:id` updates for owner/Division Head
- `POST /api/projects/:id/members` adds member for owner/Division Head
- `POST /api/projects/:id/access-requests` creates pending request
- `PATCH /api/access-requests/:id` grants/denies for project owner
- Division Head has owner-level access to own division projects
- MANAGEMENT has access to all projects
- All responses use camelCase keys
- Authorization enforced through ProjectPolicy (no inline role checks)
- PHPUnit tests pass for all endpoints and access scenarios
