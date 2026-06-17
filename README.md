# FPMS — Forest Research Project Management System

A full-stack web app for managing research projects, logging field activities, uploading documents, and collaborating via a shared document library and inbox.

**Stack:** Spring Boot 4.0.5 (Java 17) + React 19 + PostgreSQL

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Getting Started](#getting-started)
4. [Environment Variables](#environment-variables)
5. [Database](#database)
6. [Backend](#backend)
7. [Frontend](#frontend)
8. [Authentication & Security](#authentication--security)
9. [Deployment](#deployment)

---

## Architecture Overview

```
client/          React SPA (served separately)
src/             Spring Boot API
  ├── controller/
  ├── service/
  ├── model/
  ├── repository/
  ├── dto/
  ├── security/
  └── exception/
```

The frontend communicates with the backend exclusively via REST (`/api/**`). Auth is JWT-based; the token is stored in `localStorage` and attached as a `Bearer` header on every request.

---

## Project Structure

```
fpms/
├── pom.xml
├── src/
│   └── main/
│       ├── java/com/forig/fpms/
│       │   ├── FpmsApplication.java
│       │   ├── controller/
│       │   ├── service/
│       │   ├── model/
│       │   ├── repository/
│       │   ├── dto/
│       │   ├── security/          # JwtFilter, SecurityConfig
│       │   ├── config/
│       │   └── exception/
│       └── resources/
│           ├── application.properties
│           └── db/migration/      # Flyway SQL migrations
└── client/
    ├── package.json
    ├── nixpacks.toml
    └── src/
        ├── App.js                 # Routing
        ├── context/AuthContext.js
        ├── hooks/queries.js       # React Query hooks
        ├── utils/api.js           # Axios instance
        ├── constants.js
        ├── pages/
        └── components/
```

---

## Getting Started

### Prerequisites

- Java 17+
- Maven 3.8+
- Node 18+
- PostgreSQL 14+ running locally

### 1. Database

```sql
CREATE DATABASE fpms;
```

Flyway runs migrations automatically on startup — no manual schema setup needed.

### 2. Backend

```bash
# Copy and edit env vars (see section below), then:
mvn spring-boot:run
# API available at http://localhost:8080
```

```bash
# Production JAR
mvn clean package
java -jar target/fpms-0.0.1-SNAPSHOT.jar
```

### 3. Frontend

```bash
cd client
npm install
npm start
# Dev server at http://localhost:3000
```

```bash
# Production build
npm run build
npx serve -s build -l 3000
```

---

## Environment Variables

### Backend

| Variable | Default | Notes |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/fpms` | PostgreSQL JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | |
| `SPRING_DATASOURCE_PASSWORD` | `postgres` | |
| `JWT_SECRET` | dev key | **Change in production.** Min 256-bit string. |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS allowed origins, comma-separated |
| `PORT` | `8080` | Server port |
| `UPLOAD_DIR` | `uploads` | Local directory for uploaded files |

### Frontend

| Variable | Default | Notes |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:8080/api` | Backend base URL |

---

## Database

**Engine:** PostgreSQL
**Migrations:** Flyway (auto-runs on startup, `flyway.baseline-on-migrate=true`)
**Full-text search:** PostgreSQL GIN index on `documents.extracted_text` (English tokenization, `tsquery`)

### Migrations

| File | What it does |
|---|---|
| `V1__initial_schema.sql` | Creates `divisions`, `users`, `projects`, `activities` tables + indexes |
| `V2__forig_customisation.sql` | Adds `activity_type`, designation, funding/research fields, `project_team`, `documents`, `document_forwards`, seeds 11 FORIG divisions |
| `V3__document_text.sql` | Adds `extracted_text` column + GIN index to `documents` |
| `V4__missing_fields.sql` | Idempotent patch for missing columns/tables (`IF NOT EXISTS`) |

### Entity Summary

| Entity | Key Fields |
|---|---|
| `User` | id, fullName, email, passwordHash, role (`SCIENTIST`/`MANAGEMENT`), designation, division |
| `Division` | id, name (unique), description |
| `Project` | id, title, description, status, fundingType, researchArea, fundingSource, objectives, keyFindings, lead, division, startDate, endDate |
| `ProjectTeam` | project, user, role (`LEAD`/`MEMBER`) — unique per (project, user) |
| `Activity` | id, user, project, activityType, description, notes, activityDate |
| `Document` | id, project?, activity?, fileName, fileUrl, fileType, fileSize, uploadedBy, isLibraryItem, extractedText |
| `DocumentForward` | id, document, forwardedBy, forwardedTo, message, isRead |

---

## Backend

### API Endpoints

All routes are prefixed `/api`. Public routes (no auth): `/api/auth/**`, `GET /api/divisions`.

#### Auth — `/api/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create account. Body: `{ fullName, email, password, designation, divisionId }`. Returns `AuthResponse` with JWT. |
| POST | `/login` | Authenticate. Body: `{ email, password }`. Returns `AuthResponse` with JWT. |

#### Projects — `/api/projects`

| Method | Path | Description |
|---|---|---|
| GET | `/` | All projects |
| POST | `/` | Create project (authenticated) |
| GET | `/{id}` | Single project |
| PUT | `/{id}` | Update (project lead only) |
| DELETE | `/{id}` | Delete (lead or MANAGEMENT). Cascades to activities and documents. |
| GET | `/status/{status}` | Filter by status: `ONGOING`, `ON_HOLD`, `COMPLETED`, `PROPOSED` |
| GET | `/division/{divisionId}` | Filter by division |
| GET | `/{id}/team` | Team members with roles |

#### Activities — `/api/activities`

| Method | Path | Description |
|---|---|---|
| POST | `/` | Log activity (authenticated) |
| GET | `/mine` | Caller's activities |
| GET | `/project/{projectId}` | Activities for a project |
| PUT | `/{id}` | Update (activity owner only) |
| DELETE | `/{id}` | Delete (activity owner only). Cascades to documents. |
| GET | `/report` | Activities in date range. Query params: `projectId`, `startDate`, `endDate` |

#### Documents — `/api/documents`

| Method | Path | Description |
|---|---|---|
| POST | `/upload` | Upload file. `multipart/form-data`: `file`, `projectId` or `activityId`. Max 10MB. Allowed types: PDF, DOCX, CSV, PNG, JPG, JPEG, GIF. Text extracted automatically from PDF/DOCX. |
| GET | `/activity/{activityId}` | Documents for an activity |
| GET | `/project/{projectId}` | Documents for a project |
| GET | `/mine` | Caller's uploaded documents |
| GET | `/download/{documentId}` | Download raw file |
| DELETE | `/{documentId}` | Delete (uploader only) |
| PUT | `/{documentId}/publish` | Publish to library (uploader or MANAGEMENT) |
| PUT | `/{documentId}/unpublish` | Remove from library |
| POST | `/{documentId}/forward` | Forward to user. Body: `{ forwardedToUserId, message }` |

#### Library — `/api/library`

| Method | Path | Description |
|---|---|---|
| GET | `/` | Published documents. Query params: `search`, `divisionId`, `projectId`, `researchArea` |
| POST | `/search` | Full-text search via PostgreSQL `tsquery`. Body: `{ query }`. Returns documents with text snippet. |
| GET | `/stats` | Stats: counts by division, funding type, file type |

#### Inbox / Forwarding — `/api/forwards`

| Method | Path | Description |
|---|---|---|
| GET | `/inbox` | Caller's received forwards |
| GET | `/inbox/count` | Unread count |
| PUT | `/{forwardId}/read` | Mark as read |

#### Users & Divisions

| Method | Path | Description |
|---|---|---|
| GET | `/api/users` | All users with role/designation/division |
| GET | `/api/divisions` | All divisions (public) |

---

## Frontend

### Routes

| Path | Page | Protected |
|---|---|---|
| `/` | Login / Register | No |
| `/dashboard` | Project list, create/edit/delete | Yes |
| `/log` | Log an activity | Yes |
| `/activities` | My activities (edit/delete) | Yes |
| `/report` | Date-range report + CSV export | Yes |
| `/inbox` | Forwarded documents | Yes |
| `/library` | Published document archive + search | Yes |

`ProtectedRoute` checks `localStorage` for a valid (non-expired) JWT before rendering. Expired tokens auto-redirect to `/`.

### Key Files

| File | Role |
|---|---|
| `src/App.js` | React Router config, protected route wrapper |
| `src/context/AuthContext.js` | `{ user, token, login, logout }` — persisted to localStorage |
| `src/utils/api.js` | Axios instance: attaches Bearer token, handles 401 logout |
| `src/hooks/queries.js` | All React Query queries and mutations |
| `src/constants.js` | Badge configs, activity types, nav items |
| `src/utils/format.js` | Date formatting helpers |
| `src/utils/csv.js` | CSV export for report page |
| `src/components/ForwardModal.js` | Modal for forwarding a document to a user |
| `src/components/Navbar.js` | Nav with unread inbox badge, user dropdown, logout |

### State Management

Data fetching and server state use **React Query** (`@tanstack/react-query`). All queries auto-invalidate after their corresponding mutations. No Redux or other global state library.

---

## Authentication & Security

- **Mechanism:** JWT, 24-hour expiration
- **Storage:** `localStorage` (frontend)
- **Transport:** `Authorization: Bearer <token>` header
- **Password hashing:** BCrypt
- **Session:** Stateless (no server-side sessions)
- **CSRF:** Disabled (stateless API)
- **CORS:** Controlled via `ALLOWED_ORIGINS` env var
- **Roles:** `SCIENTIST` (standard user), `MANAGEMENT` (can delete/publish any)

JWT claims: `sub` (email), `userId`, `role`, `exp`.

---

## Deployment

### Frontend — Vercel

Configured via `.vercel/project.json`. Nixpacks config at `client/nixpacks.toml`:
- Node 18
- Build: `npm install && npm run build`
- Start: `npx serve -s build -l $PORT`

Set `REACT_APP_API_URL` in Vercel environment settings to point to the backend.

### Backend — Railway / JAR

No Docker config in repo. Deploy as a standard Spring Boot JAR. Requires a managed PostgreSQL instance. Set all backend env vars in the platform dashboard.

File uploads (`UPLOAD_DIR`) are written to the local filesystem — this means uploads are ephemeral on platforms with ephemeral filesystems (Railway, Heroku). Plan for object storage (S3, etc.) if persistence is needed.