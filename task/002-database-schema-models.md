# Task 002: Database Schema & Models

**Status:** Not Started
**Depends on:** 001
**Docs referenced:** `docs/02-data-model.md`, `docs/03-api-reference.md`, `docs/08-glossary.md`

## Objective

Create all database migrations, Eloquent models with relationships and casts, PHP enums, and seeders for the 12 entities defined in the data model. This task establishes the persistence layer that every backend task builds upon.

## Context

Every entity in the system (User, Division, Project, ProjectMember, Activity, ActivityType, Document, Report, ReportComment, Publication, InboxItem, AccessRequest) needs a migration and a model before any controller, action, or resource can reference them. This task also seeds the activity_types table and default divisions.

## Scope

**In scope:**
- Migrations for all 12 entities with all fields, foreign keys, indexes, and enums
- Eloquent models with `$fillable`, `$casts`, relationships, and attribute overrides
- PHP 8.1+ backed enums for all enum fields (UserRole, ProjectStatus, etc.)
- `DivisionSeeder` with CSIR-FORIG division names
- `ActivityTypeSeeder` with default activity types
- `DatabaseSeeder` that calls all seeders in dependency order
- FULLTEXT index on `documents.filename` and a future `document_texts` content column (prepared for but not populated in this task)
- `document_texts` table for AI indexing content storage (structure only, no data)

**Out of scope:**
- Any controller, action, policy, resource, event, listener, notification, or job
- Any route definitions
- Any frontend code
- Actual data (seeded reference data only)

## Relevant data model

All entities, fields, enums, and relationships are defined in `docs/02-data-model.md`. The full reference is replicated below:

### User
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| email | varchar(255) | Unique |
| password | varchar(255) | Hashed |
| fullName | varchar(255) | |
| role | enum | `RESEARCHER`, `STUDENT`, `SECRETARY`, `DIVISION_HEAD`, `MANAGEMENT`, `ADMIN` |
| divisionId | bigint | FK to divisions |
| isActive | boolean | Default true |
| avatarInitials | varchar(4) | Auto-generated |
| timestamps | | |

### Division
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| name | varchar(255) | |
| headId | bigint, nullable | FK to users |
| timestamps | | |

### Project
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| title | varchar(255) | |
| description | text, nullable | |
| divisionId | bigint | FK |
| leadResearcherId | bigint | FK |
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

### Activity
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| projectId | bigint | FK |
| userId | bigint | FK |
| date | date | |
| type | varchar(100) | From activity_types |
| description | text | |
| notes | text, nullable | |
| timestamps | | |

### ActivityType
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| name | varchar(100) | |
| slug | varchar(100) | |

### Document
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| projectId | bigint | FK |
| activityId | bigint, nullable | FK |
| uploadedBy | bigint | FK |
| filename | varchar(255) | |
| filePath | varchar(500) | |
| mimeType | varchar(100) | |
| size | int | Bytes |
| type | enum | DATA_SHEET, PHOTO, MAP, RECEIPT, REPORT, MANUSCRIPT, OTHER |
| published | boolean | Default false |
| timestamps | | |

Fulltext index on `(filename)`.

### DocumentText (for AI indexing)
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| documentId | bigint | FK unique |
| content | longtext | Extracted text |
| timestamps | | |

Fulltext index on `(content)`.

### Report
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| projectId | bigint | FK |
| submittedBy | bigint | FK |
| type | enum | QUARTERLY, MID_YEAR, ANNUAL |
| periodStart | date | |
| periodEnd | date | |
| narrativeSummary | text | |
| filePath | varchar(500), nullable | |
| status | enum | DRAFT, PENDING, RETURNED, APPROVED, ESCALATED |
| parentReportId | bigint, nullable | FK self |
| version | int | Starts at 1 |
| comment | text, nullable | |
| reviewedBy | bigint, nullable | FK |
| submittedAt | timestamp, nullable | |
| timestamps | | |

### ReportComment
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| reportId | bigint | FK |
| userId | bigint | FK |
| comment | text | |
| createdAt | timestamp | |

### Publication
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| title | varchar(500) | |
| authors | text | |
| type | enum | PAPER, THESIS, REPORT, STUDENT |
| status | enum | DRAFT, SUBMITTED, IN_REVISION, PUBLISHED |
| journalName | varchar(255), nullable | |
| linkedProjectId | bigint, nullable | FK |
| doi | varchar(255), nullable | |
| manuscriptFilePath | varchar(500), nullable | |
| submittedById | bigint | FK |
| studentName | varchar(255), nullable | |
| supervisor | varchar(255), nullable | |
| degreeProgramme | varchar(255), nullable | |
| submissionDate | date, nullable | |
| revisionDueDate | date, nullable | |
| timestamps | | |

### InboxItem
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| userId | bigint | FK |
| senderId | bigint, nullable | FK |
| type | enum | DOCUMENT, REPORT_UPDATE, SYSTEM |
| subject | varchar(255) | |
| message | text, nullable | |
| documentId | bigint, nullable | FK |
| reportId | bigint, nullable | FK |
| read | boolean | Default false |
| createdAt | timestamp | |

### AccessRequest
| Field | Type | Notes |
|-------|------|-------|
| id | bigint, auto | PK |
| projectId | bigint | FK |
| requesterId | bigint | FK |
| status | enum | PENDING, GRANTED, DENIED |
| timestamps | | |

## Relevant API contract

Not applicable — this task implements no endpoints.

## Relevant frontend behavior

Not applicable.

## Architectural conventions that apply

- Model names must be singular, StudlyCase (matching folder structure)
- Table names are snake_case plurals (`project_members`, `activity_types`, `inbox_items`, `access_requests`, `document_texts`)
- Foreign keys use the convention `snake_case_id` (e.g., `division_id`, `lead_researcher_id`, `submitted_by_id`)
- Add `use HasFactory` trait to all models
- All enum fields use PHP 8.1+ backed enums stored as strings in the DB
- `User` model extends `Authenticatable` and uses `HasApiTokens` (Sanctum) and `Notifiable`
- `DocumentText` does not have an Eloquent model — it exists for AI indexing only and is accessed via a relationship on `Document`

## Step-by-step implementation checklist

- [ ] Create PHP enums in `app/Enums/`: `UserRole`, `ProjectStatus`, `FundingType`, `ProjectMemberRole`, `DocumentType`, `ReportType`, `ReportStatus`, `PublicationType`, `PublicationStatus`, `InboxItemType`, `AccessRequestStatus`
- [ ] Create migration for `divisions` table
- [ ] Create migration for `projects` table (with FK to divisions, users)
- [ ] Create migration for `project_members` table (FKs to projects, users; unique composite on project_id + user_id)
- [ ] Create migration for `activity_types` table
- [ ] Create migration for `activities` table (FKs to projects, users, activity_types)
- [ ] Create migration for `documents` table (FKs to projects, activities nullable, users) with FULLTEXT index on `filename`
- [ ] Create migration for `document_texts` table (FK to documents, unique) with FULLTEXT index on `content`
- [ ] Create migration for `reports` table (FKs to projects, users; self-referencing FK `parent_report_id`)
- [ ] Create migration for `report_comments` table (FKs to reports, users)
- [ ] Create migration for `publications` table (FKs to projects nullable, users)
- [ ] Create migration for `inbox_items` table (FKs to users, sender nullable, documents nullable, reports nullable)
- [ ] Create migration for `access_requests` table (FKs to projects, users)
- [ ] Add `avatarInitials` column to the default Laravel users migration (or create a new migration to add it)
- [ ] Create `Division` model with `$fillable`, `$casts`, relationships (`users`, `projects`, `head`)
- [ ] Create `Project` model with `$fillable`, `$casts`, relationships (`division`, `lead`, `members`, `activities`, `reports`, `documents`, `accessRequests`)
- [ ] Create `ProjectMember` model with `$fillable`, `$casts`, relationships (`project`, `user`)
- [ ] Create `Activity` model with `$fillable`, `$casts`, relationships (`project`, `user`, `documents`)
- [ ] Create `ActivityType` model with `$fillable`, `$casts`
- [ ] Create `Document` model with `$fillable`, `$casts`, relationships (`project`, `activity`, `uploader`)
- [ ] Create `Report` model with `$fillable`, `$casts`, relationships (`project`, `submitter`, `reviewer`, `comments`, `parentReport`, `resubmissions`)
- [ ] Create `ReportComment` model with `$fillable`, `$casts`, relationships (`report`, `user`)
- [ ] Create `Publication` model with `$fillable`, `$casts`, relationships (`linkedProject`, `submitter`)
- [ ] Create `InboxItem` model with `$fillable`, `$casts`, relationships (`user`, `sender`, `document`, `report`)
- [ ] Create `AccessRequest` model with `$fillable`, `$casts`, relationships (`project`, `requester`)
- [ ] Create `DivisionSeeder` with seed divisions (Forest Ecology, Climate Change, Social Science, etc. — at least 4)
- [ ] Create `ActivityTypeSeeder` with default types: Field data collection, Lab work / sample analysis, Community engagement, Stakeholder meeting, Literature review, Training / workshop, Equipment maintenance, Administrative
- [ ] Create `DatabaseSeeder` that calls `DivisionSeeder` then `ActivityTypeSeeder`
- [ ] Run `php artisan migrate:fresh --seed` and verify all tables exist with correct columns
- [ ] Run `php artisan db:show` (or inspect via MySQL) to confirm all tables, FKs, and indexes exist

## Definition of done

- `php artisan migrate:fresh` creates all 12+ tables without errors
- All foreign keys and composite indexes exist in MySQL
- All PHP enums exist and match the enum values in `02-data-model.md`
- All models can be instantiated, have correct relationships defined, and return expected types from casts
- Seeders produce reference data (divisions, activity types)
- `php artisan db:seed` runs cleanly on a fresh database
- FULLTEXT indexes exist on `documents.filename` and `document_texts.content`

## Open questions / assumptions inherited

- Division names are assumed; the Admin Settings screen will allow adding more later.
- Activity type seed data is assumed per `09-open-questions-and-assumptions.md`.
- The `document_texts` table is created with structure only; no data is populated in this task.
