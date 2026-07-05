# API Reference

## Conventions

### Base URL
All endpoints are prefixed with `/api`. Example: `https://skms.example.com/api/projects`

### Authentication
All endpoints except the public stats endpoint and login require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <token>
```
Tokens are issued by `POST /api/auth/login`. Expired tokens return `401 Unauthorized`.

### JSON Key Casing
All request and response bodies use **camelCase** for JSON keys, regardless of Laravel's internal snake_case conventions. This is enforced at the response layer via Laravel API Resources (`$this->mergeWhen` / `$this->wrap`) with a custom `CamelCaseResource` base class. All Form Requests must transform incoming camelCase keys to snake_case for validation/store logic.

### Standard Pagination Envelope
```json
{
  "data": [ ... ],
  "meta": {
    "currentPage": 1,
    "lastPage": 5,
    "perPage": 20,
    "total": 97
  }
}
```
Query params: `?page=1&limit=20`. Default `limit` is 20 if omitted.

### Standard Success Response Envelope
```json
{
  "data": { ... },
  "message": "optional success message"
}
```

### Standard Error Response Envelope
```json
{
  "message": "Human-readable error description",
  "errors": {
    "fieldName": ["Validation error 1", "Validation error 2"]
  }
}
```

### HTTP Status Code Usage

| Code | Usage |
|------|-------|
| 200 | Successful GET, PUT, PATCH, DELETE |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE (no content) |
| 400 | Bad request (malformed payload) |
| 401 | Missing or expired token |
| 403 | Authenticated but not authorised (locked project, wrong role) |
| 404 | Resource not found |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Server error |

---

## Authentication

### `POST /api/auth/login`

Authenticate with email and password. Returns a Sanctum token.

**Auth:** None

**Request:**
```json
{
  "email": "user@forig.org",
  "password": "secret"
}
```

**Response 200:**
```json
{
  "data": {
    "token": "1|sanctumTokenString",
    "userId": 42,
    "fullName": "Yaa Asantewaa",
    "email": "yaa@forig.org",
    "role": "RESEARCHER",
    "division": "Forest Ecology"
  }
}
```

**Response 422:** Wrong credentials:
```json
{
  "message": "Invalid email or password.",
  "errors": {
    "email": ["Invalid email or password."]
  }
}
```

### `POST /api/auth/logout`

Revoke current token.

**Auth:** Required

**Response 200:**
```json
{
  "message": "Logged out successfully."
}
```

### `GET /api/auth/validate`

Check if stored token is still valid.

**Auth:** Required

**Response 200:**
```json
{
  "data": {
    "valid": true,
    "userId": 42,
    "fullName": "Yaa Asantewaa",
    "role": "RESEARCHER",
    "division": "Forest Ecology"
  }
}
```

**Response 401:** Token expired/invalid.

---

## Public

### `GET /api/public/stats`

Stats displayed on the login screen (no auth required).

**Auth:** None

**Response 200:**
```json
{
  "data": {
    "activeProjects": 47,
    "libraryDocuments": 312,
    "divisionsConnected": 6
  }
}
```

---

## Dashboard

### `GET /api/dashboard/stats`

Stats overview for the authenticated user's dashboard.

**Auth:** Required
**Roles:** RESEARCHER, STUDENT

**Response 200:**
```json
{
  "data": {
    "totalProjects": 12,
    "ongoing": 5,
    "reportsPending": 2,
    "activitiesThisMonth": 8
  }
}
```

---

## Projects

### `GET /api/projects`

List all projects. Each item includes `isOwner`, `hasAccess`, `isLocked` fields relative to the requesting user.

**Auth:** Required
**Roles:** All

**Query Params:**

| Param | Type | Description |
|-------|------|-------------|
| `owner` | `me` | Filter to projects where user is owner |
| `status` | string | Filter by project status |
| `division` | int | Filter by division ID |
| `fundingType` | string | Filter by funding type |
| `researchArea` | string | Filter by research area |
| `page` | int | Page number (default 1) |
| `limit` | int | Items per page (default 20) |
| `q` | string | Search by title, lead name, research area |

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Carbon Stock Assessment in Kakum",
      "division": "Forest Ecology",
      "lead": "Yaa Asantewaa",
      "fundingType": "DONOR",
      "status": "ACTIVE",
      "progress": 65,
      "isOwner": true,
      "hasAccess": true,
      "isLocked": false
    }
  ],
  "meta": { "currentPage": 1, "lastPage": 3, "perPage": 20, "total": 57 }
}
```

### `POST /api/projects`

Create a new project.

**Auth:** Required
**Roles:** RESEARCHER, STUDENT, DIVISION_HEAD

**Request:**
```json
{
  "title": "Carbon Stock Assessment in Kakum",
  "divisionId": 1,
  "fundingType": "DONOR",
  "researchArea": "Carbon sequestration",
  "location": "Kakum National Park",
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "description": "A study of carbon stocks..."
}
```

**Response 201:**
```json
{
  "data": { "id": 42, "title": "Carbon Stock Assessment in Kakum", "status": "PROPOSED" },
  "message": "Project created successfully."
}
```

### `GET /api/projects/:id`

Get full project details. Returns 403 if project is locked for the requesting user.

**Auth:** Required
**Roles:** All (but 403 if `isLocked`)

**Response 200:**
```json
{
  "data": {
    "id": 1,
    "title": "Carbon Stock Assessment in Kakum",
    "description": "...",
    "division": "Forest Ecology",
    "lead": "Yaa Asantewaa",
    "fundingType": "DONOR",
    "fundingSource": "World Bank",
    "researchArea": "Carbon sequestration",
    "location": "Kakum National Park",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "status": "ACTIVE",
    "progress": 65,
    "activityCount": 14,
    "documentCount": 23,
    "isOwner": true,
    "hasAccess": true,
    "isLocked": false,
    "members": [
      { "id": 1, "fullName": "Yaa Asantewaa", "role": "LEAD" }
    ]
  }
}
```

**Response 403:**
```json
{
  "message": "You do not have access to this project.",
  "data": {
    "isLocked": true,
    "title": "Carbon Stock Assessment in Kakum",
    "lead": "Yaa Asantewaa",
    "division": "Forest Ecology",
    "status": "ACTIVE",
    "researchArea": "Carbon sequestration",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31"
  }
}
```

### `PUT /api/projects/:id`

Update project metadata.

**Auth:** Required
**Roles:** Owner (isOwner: true) or Division Head (own division)

**Request:** Same fields as POST (all optional for PUT).

**Response 200:**
```json
{
  "data": { "id": 1, "title": "Updated Title", "status": "ACTIVE" },
  "message": "Project updated successfully."
}
```

### `GET /api/projects/:id/members`

List project members.

**Auth:** Required
**Roles:** Owner, collaborator (hasAccess), Division Head

**Response 200:**
```json
{
  "data": [
    { "userId": 1, "fullName": "Yaa Asantewaa", "role": "LEAD", "addedAt": "2026-01-15T10:00:00Z" },
    { "userId": 2, "fullName": "Kofi Mensah", "role": "COLLABORATOR", "addedAt": "2026-02-01T14:30:00Z" }
  ]
}
```

### `POST /api/projects/:id/members`

Add a member to the project.

**Auth:** Required
**Roles:** Owner or Division Head

**Request:**
```json
{
  "email": "kofi@forig.org",
  "role": "COLLABORATOR"
}
```

**Response 201:**
```json
{
  "data": { "userId": 2, "fullName": "Kofi Mensah", "role": "COLLABORATOR" },
  "message": "Member added successfully."
}
```

### `POST /api/projects/:id/access-requests`

Request access to a locked project.

**Auth:** Required
**Roles:** All

**Response 201:**
```json
{
  "message": "Access request sent."
}
```

---

## Activities

### `GET /api/activity-types`

List available activity types for the activity type dropdown.

**Auth:** Required
**Roles:** All

**Response 200:**
```json
{
  "data": [
    { "id": 1, "name": "Field data collection", "slug": "field-data-collection" },
    { "id": 2, "name": "Lab work", "slug": "lab-work" },
    { "id": 3, "name": "Community engagement", "slug": "community-engagement" }
  ]
}
```

### `GET /api/activities`

List activities with optional filters.

**Auth:** Required
**Roles:** All (scoped by project access)

**Query Params:**

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | int | Filter by project |
| `owner` | `me` | Filter to own activities |
| `type` | string | Filter by activity type slug |
| `period` | string | `this-month` for current month filter |
| `researcher` | int | Filter by user ID (Division Head/Management) |
| `page` | int | Page number |
| `limit` | int | Items per page |
| `format` | `csv` | If set, returns CSV download instead of JSON |

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "projectId": 42,
      "projectTitle": "Carbon Stock Assessment",
      "date": "2026-06-15",
      "type": "Field data collection",
      "description": "GPS coordinates taken",
      "notes": "Weather was clear",
      "documentCount": 3,
      "documents": [
        { "id": 10, "filename": "gps_data.xlsx", "type": "DATA_SHEET", "published": false }
      ]
    }
  ],
  "meta": { "currentPage": 1, "lastPage": 5, "perPage": 20, "total": 97 }
}
```

### `POST /api/activities`

Create a new activity (Step 3 submit).

**Auth:** Required
**Roles:** Owner of the project or member with access

**Request:**
```json
{
  "projectId": 42,
  "date": "2026-06-15",
  "type": "Field data collection",
  "description": "GPS coordinates taken",
  "notes": "Weather was clear"
}
```

**Response 201:**
```json
{
  "data": { "id": 1, "activityId": 1 },
  "message": "Activity created. You can now upload files."
}
```

### `POST /api/activities/:id/documents`

Upload a document to an activity (multipart). Called once per file.

**Auth:** Required
**Roles:** Activity owner

**Request:** `multipart/form-data`
- `file`: the file
- `type`: document type enum value

**Response 201:**
```json
{
  "data": { "id": 10, "filename": "gps_data.xlsx", "size": 204800 },
  "message": "File uploaded."
}
```

### `PUT /api/activities/:id`

Update an activity.

**Auth:** Required
**Roles:** Activity owner

**Request:** Same fields as POST.

**Response 200:** Activity object.

### `DELETE /api/activities/:id`

Delete an activity and its attached documents.

**Auth:** Required
**Roles:** Activity owner

**Response 200:**
```json
{
  "message": "Activity and 3 attached documents deleted."
}
```

---

## Documents

### `GET /api/documents`

List documents with optional filters.

**Auth:** Required
**Roles:** All (scoped by project access)

**Query Params:** `projectId`, `published`, `page`, `limit`

**Response 200:** Array of document objects.

### `PATCH /api/documents/:id`

Update document metadata. Used to publish to library.

**Auth:** Required
**Roles:** Document owner or project owner

**Request:**
```json
{
  "published": true
}
```

**Response 200:**
```json
{
  "data": { "id": 10, "published": true },
  "message": "Document published to library."
}
```

### `GET /api/documents/:id/download`

Download the file. Streams the file as `attachment`.

**Auth:** Required
**Roles:** User must have project access or document is published

**Response 200:** Binary file stream with `Content-Disposition: attachment`.

### `GET /api/documents/:id/preview`

View document inline. Returns metadata + file URL or base64 for supported types. PDFs return a URL suitable for embedding in an `<iframe>` or PDF viewer. DOCX/XLSX return a download-prompt message if inline rendering is not possible.

**Auth:** Required
**Roles:** Same as download.

**Response 200:**
```json
{
  "data": {
    "id": 10,
    "filename": "report.pdf",
    "mimeType": "application/pdf",
    "previewUrl": "/storage/documents/report.pdf",
    "inlinePreviewSupported": true
  }
}
```

### `DELETE /api/documents/:id`

Delete a document permanently.

**Auth:** Required
**Roles:** Document owner or project owner

**Response 200:**
```json
{
  "message": "Document removed."
}
```

---

## Reports

### `GET /api/reports`

List reports with optional filters.

**Auth:** Required
**Roles:** All (scoped by project access and ownership)

**Query Params:**

| Param | Type | Description |
|-------|------|-------------|
| `projectId` | int | Filter by project |
| `owner` | `me` | Filter to own submissions |
| `status` | string | Filter by status |
| `division` | int | Filter by division |
| `type` | string | Filter by report type |
| `submittedBy` | int | Filter by submitter user ID |
| `sortBy` | string | Field to sort by: `submittedAt`, `createdAt`, `type` (default: `createdAt`) |
| `sortDirection` | `asc` / `desc` | Sort direction (default: `desc`; defaults to `asc` when `sortBy=submittedAt`) |
| `page` | int | Page number |
| `limit` | int | Items per page |

Default sort: `createdAt desc` (newest first). When `?status=PENDING&sortBy=submittedAt` is used without explicit direction, defaults to `asc` (oldest first — queue view).

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "reportName": "Q1 2026 Progress Report",
      "projectId": 42,
      "projectTitle": "Carbon Stock Assessment",
      "period": "2026-01-01 — 2026-03-31",
      "type": "QUARTERLY",
      "status": "PENDING",
      "version": 1,
      "parentReportId": null,
      "submittedBy": "Yaa Asantewaa",
      "division": "Forest Ecology",
      "submittedAt": "2026-04-05T10:00:00Z",
      "daysWaiting": 5
    }
  ],
  "meta": { "currentPage": 1, "lastPage": 2, "perPage": 20, "total": 35 }
}
```

### `GET /api/reports/stats`

Summary stats for the Secretary's report queue.

**Auth:** Required
**Roles:** SECRETARY

**Response 200:**
```json
{
  "data": {
    "overdue": 3,
    "pending": 12,
    "approvedThisQuarter": 28,
    "returned": 4
  }
}
```

### `POST /api/reports`

Submit a new report.

**Auth:** Required
**Roles:** RESEARCHER, STUDENT, DIVISION_HEAD

**Request:**
```json
{
  "projectId": 42,
  "type": "QUARTERLY",
  "periodStart": "2026-01-01",
  "periodEnd": "2026-03-31",
  "narrativeSummary": "This quarter we completed...",
  "file": "base64-encoded-pdf-content-or-omit"
}
```

**Response 201:**
```json
{
  "data": { "id": 1, "status": "PENDING", "version": 1 },
  "message": "Report submitted to Scientific Secretary."
}
```

### `POST /api/reports/draft`

Save a report as draft during the multi-step flow.

**Auth:** Required
**Roles:** RESEARCHER, STUDENT, DIVISION_HEAD

**Request:** Same fields as POST (all optional for draft).

**Response 201:**
```json
{
  "data": { "id": 1, "status": "DRAFT" },
  "message": "Draft saved."
}
```

### `GET /api/reports/:id`

Get full report details including submission history.

**Auth:** Required
**Roles:** SECRETARY, submitter, project owner, Division Head, Management

**Response 200:**
```json
{
  "data": {
    "id": 1,
    "projectId": 42,
    "projectTitle": "Carbon Stock Assessment",
    "type": "QUARTERLY",
    "status": "RETURNED",
    "version": 1,
    "narrativeSummary": "This quarter we completed...",
    "file": { "filename": "q1-report.pdf", "size": 1048576 },
    "submittedBy": "Yaa Asantewaa",
    "division": "Forest Ecology",
    "submittedAt": "2026-04-05T10:00:00Z",
    "daysWaiting": 5,
    "comment": "Please include raw data tables.",
    "history": [
      { "event": "SUBMITTED", "timestamp": "2026-04-05T10:00:00Z", "user": "Yaa Asantewaa" },
      { "event": "RETURNED", "timestamp": "2026-04-07T14:30:00Z", "user": "E. Secretary", "comment": "Please include raw data tables." }
    ]
  }
}
```

### `PATCH /api/reports/:id`

Update report status (Secretary actions).

**Auth:** Required
**Roles:** SECRETARY

**Request:**
```json
{
  "status": "APPROVED",
  "comment": "Approved with commendation."
}
```

Valid status transitions:
- `PENDING` → `APPROVED` (comment optional)
- `PENDING` → `RETURNED` (comment required)
- `PENDING` → `ESCALATED` (comment required)

**Response 200:**
```json
{
  "data": { "id": 1, "status": "APPROVED" },
  "message": "Report approved. Researcher notified."
}
```

---

## Divisions

### `GET /api/divisions/:divisionId/stats`

Division dashboard stat cards.

**Auth:** Required
**Roles:** DIVISION_HEAD, MANAGEMENT

**Response 200:**
```json
{
  "data": {
    "totalProjects": 15,
    "ongoing": 8,
    "reportsPending": 3,
    "reportsOverdue": 1,
    "activeResearchers": 12
  }
}
```

### `GET /api/divisions/:divisionId/researcher-activity`

Per-researcher summary for the division.

**Auth:** Required
**Roles:** DIVISION_HEAD, MANAGEMENT

**Response 200:**
```json
{
  "data": [
    {
      "researcherId": 1,
      "fullName": "Yaa Asantewaa",
      "activeProjects": 3,
      "projects": "Carbon Stock, Agroforestry",
      "activitiesThisMonth": 8,
      "documentsUploaded": 15,
      "reportStatus": "SUBMITTED"
    }
  ]
}
```

### `GET /api/divisions/:divisionId/activity-feed`

Chronological activity feed for the division.

**Auth:** Required
**Roles:** DIVISION_HEAD, MANAGEMENT

**Query Params:** `limit` (default 10)

**Response 200:**
```json
{
  "data": [
    {
      "type": "activity",
      "message": "Yaa Asantewaa logged field data collection",
      "timestamp": "2026-07-01T09:00:00Z",
      "link": "/projects/42"
    },
    {
      "type": "alert",
      "severity": "warning",
      "message": "S. Mensah Q2 report not yet submitted — due 30 Jun",
      "timestamp": "2026-06-28T00:00:00Z",
      "link": "/reports?researcher=2"
    }
  ]
}
```

---

## Institute (Executive Dashboard)

### `GET /api/institute/stats`

Institute-wide stat cards.

**Auth:** Required
**Roles:** MANAGEMENT

**Response 200:**
```json
{
  "data": {
    "totalProjects": 57,
    "ongoing": 32,
    "divisionsActive": 6,
    "reportsPendingReview": 12,
    "reportsOverdue": 4,
    "libraryDocuments": 312
  }
}
```

### `GET /api/divisions/summary`

One row per division.

**Auth:** Required
**Roles:** MANAGEMENT

**Response 200:**
```json
{
  "data": [
    {
      "divisionId": 1,
      "divisionName": "Forest Ecology",
      "headName": "Dr. A. Owusu",
      "totalProjects": 15,
      "ongoing": 8,
      "activeStaff": 12,
      "documentCount": 89,
      "reportStatusSummary": "3 pending, 1 overdue",
      "compliancePercent": 85
    }
  ]
}
```

### `GET /api/institute/funding-breakdown`

Funding distribution across the institute.

**Auth:** Required
**Roles:** MANAGEMENT

**Response 200:**
```json
{
  "data": {
    "donor": 22,
    "government": 18,
    "internal": 17
  }
}
```

### `GET /api/institute/compliance`

Per-division compliance percentages.

**Auth:** Required
**Roles:** MANAGEMENT

**Response 200:**
```json
{
  "data": [
    { "division": "Forest Ecology", "compliancePercent": 85 },
    { "division": "Climate Change", "compliancePercent": 100 },
    { "division": "Social Science", "compliancePercent": 72 }
  ]
}
```

### `GET /api/institute/alerts`

System-generated institute alerts.

**Auth:** Required
**Roles:** MANAGEMENT

**Query Params:** `limit` (default 5)

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "type": "danger",
      "message": "Report overdue in Forest Ecology division",
      "timestamp": "2026-07-01T08:00:00Z",
      "link": "/reports?division=1&status=PENDING"
    }
  ]
}
```

---

## Library

### `GET /api/library/stats`

Library statistics.

**Auth:** Required
**Roles:** All

**Response 200:**
```json
{
  "data": {
    "totalDocuments": 312,
    "topDivisions": [
      { "division": "Forest Ecology", "count": 89 },
      { "division": "Climate Change", "count": 67 },
      { "division": "Social Science", "count": 45 }
    ],
    "addedThisQuarter": 28
  }
}
```

### `GET /api/library/documents`

Browse published library documents.

**Auth:** Required
**Roles:** All

**Query Params:** `division`, `documentType`, `researchArea`, `q` (name filter, client-side), `page`, `limit`

**Response 200:**
```json
{
  "data": [
    {
      "id": 10,
      "title": "Carbon Stock Assessment Report",
      "type": "REPORT",
      "division": "Forest Ecology",
      "researchArea": "Carbon sequestration",
      "uploadedBy": "Yaa Asantewaa",
      "uploadedAt": "2026-03-15T10:00:00Z"
    }
  ],
  "meta": { "currentPage": 1, "lastPage": 16, "perPage": 20, "total": 312 }
}
```

### `GET /api/library/search`

Full-text search across published library documents.

**Auth:** Required
**Roles:** All

**Query Params:** `q` (search query, required)

**Response 200:**
```json
{
  "data": [
    {
      "id": 10,
      "title": "Carbon Stock Assessment Report",
      "type": "REPORT",
      "snippet": "...carbon stock in <mark>Kakum</mark> National Park was measured...",
      "division": "Forest Ecology",
      "author": "Yaa Asantewaa",
      "date": "2026-03-15",
      "documentType": "REPORT"
    }
  ],
  "meta": { "total": 5 }
}
```

The `snippet` field contains HTML with `<mark>` tags around search terms. Backend must strip all other HTML tags before returning. Frontend must sanitise with DOMPurify before rendering via `dangerouslySetInnerHTML`.

---

## Publications

### `GET /api/publications`

List all tracked publications.

**Auth:** Required
**Roles:** All

**Query Params:** `submittedBy`, `status`, `type`, `page`, `limit`

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Carbon Sequestration Potential of Agroforestry Systems",
      "authors": "Yaa Asantewaa, Kofi Mensah",
      "type": "PAPER",
      "status": "PUBLISHED",
      "journalName": "Forest Ecology and Management",
      "doi": "10.1016/j.foreco.2026.01.001",
      "linkedProject": { "id": 42, "title": "Carbon Stock Assessment" },
      "submittedAt": "2026-01-15T10:00:00Z"
    }
  ],
  "meta": { "currentPage": 1, "lastPage": 5, "perPage": 20, "total": 84 }
}
```

### `GET /api/publications/pipeline`

Pipeline counts by status.

**Auth:** Required
**Roles:** All

**Response 200:**
```json
{
  "data": {
    "draft": 12,
    "submitted": 8,
    "inRevision": 6,
    "published": 58
  }
}
```

### `POST /api/publications`

Add a new publication.

**Auth:** Required
**Roles:** RESEARCHER, STUDENT, DIVISION_HEAD

**Request:**
```json
{
  "title": "Carbon Sequestration Potential...",
  "authors": "Yaa Asantewaa, Kofi Mensah",
  "type": "PAPER",
  "status": "SUBMITTED",
  "journalName": "Forest Ecology and Management",
  "linkedProjectId": 42,
  "doi": null,
  "manuscriptFile": "base64..."
}
```

**Response 201:** Publication object.

### `PUT /api/publications/:id`

Update publication metadata.

**Auth:** Required
**Roles:** Owner of the publication

**Response 200:** Updated publication object.

---

## Inbox

### `GET /api/inbox`

List inbox items for the authenticated user.

**Auth:** Required
**Roles:** All

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
  "meta": {
    "currentPage": 1,
    "lastPage": 3,
    "perPage": 20,
    "total": 45,
    "unreadCount": 12
  }
}
```

### `PATCH /api/inbox/read-all`

Mark all inbox items as read. If `ids` provided, marks only selected items.

**Auth:** Required
**Roles:** All

**Request:**
```json
{
  "ids": [1, 2, 3]
}
```
Or empty body to mark all as read.

**Response 200:**
```json
{
  "message": "3 items marked as read."
}
```

### `PATCH /api/inbox/:id/read`

Mark a single inbox item as read.

**Auth:** Required
**Roles:** All (item must belong to user)

**Response 200:**
```json
{
  "data": { "id": 1, "read": true }
}
```

### `POST /api/inbox/forward`

Forward a document to another user.

**Auth:** Required
**Roles:** All

**Request:**
```json
{
  "documentId": 10,
  "recipientIds": [2, 3],
  "message": "Thought you might find this useful"
}
```

**Response 201:**
```json
{
  "message": "Document forwarded to 2 recipients."
}
```

---

## AI Assistant

### `POST /api/ai/query`

Send a query to the AI assistant for retrieval-augmented answering.

**Auth:** Required
**Roles:** All

**Request:**
```json
{
  "query": "What has FORIG found about carbon sequestration in agroforestry systems?",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response 200 (can answer):**
```json
{
  "data": {
    "canAnswer": true,
    "answer": "FORIG has conducted research on carbon sequestration in agroforestry systems, including a 2024 study in the Forest Ecology division that found an average of 2.5 tC/ha/year in cocoa agroforests [1]. A 2025 report documented soil carbon changes over 5 years in mixed timber systems [2].",
    "citations": [
      {
        "id": 1,
        "documentId": 42,
        "title": "Carbon Sequestration in Cocoa Agroforests",
        "author": "Yaa Asantewaa",
        "division": "Forest Ecology",
        "fileType": "REPORT",
        "page": 12
      },
      {
        "id": 2,
        "documentId": 57,
        "title": "Soil Carbon Dynamics in Mixed Timber Systems",
        "author": "Kofi Mensah",
        "division": "Forest Ecology",
        "fileType": "REPORT",
        "page": 8
      }
    ],
    "followUpPrompts": [
      "Which divisions have published most on this topic?",
      "Show me the full reports",
      "What methodologies were used?"
    ]
  }
}
```

**Response 200 (cannot answer):**
```json
{
  "data": {
    "canAnswer": false,
    "answer": "The library does not contain enough information to answer this.",
    "citations": [],
    "followUpPrompts": [
      "Browse the library",
      "Try different terms"
    ]
  }
}
```

**Response 408 (timeout):**
```json
{
  "message": "The assistant took too long to respond. Please try again."
}
```
