# SKMS Documentation

## Scientific Knowledge Management System — CSIR-FORIG

This folder is the single source of truth for the SKMS project. Every developer and every coding agent should read these documents in the order listed below before writing any code.

### Project Summary

SKMS is a secure, centralised web application that gives CSIR-FORIG a single home for its scientific knowledge: projects, reports, publications, field data, and institutional memory. It provides role-aware access control, a formal report-submission pipeline, a permanent searchable library, and an AI assistant that retrieves and cites answers from the institute's own stored documents.

### Tech Stack

- **Backend:** Laravel (latest LTS), REST API under `/api`
- **Frontend:** React + Vite, served from within the Laravel application
- **Auth:** Laravel Sanctum (token mode)
- **Database:** MySQL
- **File storage:** Local disk (dev), S3-compatible (production)

### Deployment

**Primary platform: cPanel.** SKMS is deployed on cPanel shared hosting with the following configuration:

- **Web server:** Apache (via cPanel's native stack or XAMPP-equivalent during local dev).
- **PHP:** 8.4+, configured through cPanel's MultiPHP Manager.
- **Database:** MySQL managed via cPanel's phpMyAdmin or remote connection.
- **Queue worker:** Laravel queue runs via a cron entry set up in cPanel's Cron Jobs interface (`* * * * * php /path/to/artisan schedule:run`). The `database` queue driver is used (no Redis requirement).
- **File storage:** Local disk within the cPanel account's storage; S3-compatible storage can be configured via environment variables when available.
- **Environment:** cPanel's "dotenv" or manual `.env` configuration. `APP_DEBUG=false` in production.

**Future: Docker deployment.** A `Dockerfile` and `docker-compose.yml` will be added for containerized deployments (staging, CI, or alternative hosting). This is not required for the initial cPanel-hosted pilot.

**Local development:** XAMPP (PHP 8.2+, Apache, MySQL) is the recommended local environment, matching the cPanel production stack.

### Document Index (Read in Order)

| # | File | What it covers |
|---|------|----------------|
| 0 | `00-product-overview.md` | What the system is, who it's for, core capabilities, explicit non-goals, staged rollout |
| 1 | `01-roles-and-permissions.md` | Full role × capability matrix, ownership/access/lock model |
| 2 | `02-data-model.md` | Every entity, its fields, types, enums, and relationships. Includes Mermaid ERD. |
| 3 | `03-api-reference.md` | Complete REST API contract: conventions, every endpoint, request/response shapes |
| 4 | `04-frontend-architecture.md` | Routing, state management, form patterns, mobile breakpoints, global components |
| 4b | `04b-backend-architecture.md` | SOLID principles, request lifecycle, folder structure, conventions, worked example |
| 5 | `05-screens/` (directory) | One file per wireframe screen (WF01–WF13) with specs, data fetches, edge cases |
| 6 | `06-ai-assistant.md` | "Ask SKMS" deep-dive: retrieval, citations, honesty rules, indexing pipeline |
| 7 | `07-non-functional-requirements.md` | Security, offline, backup, performance, audit, file upload constraints |
| 8 | `08-glossary.md` | Domain terms and status values with one-line definitions |
| 9 | `09-open-questions-and-assumptions.md` | Ambiguities, assumptions, gaps, and unresolved decisions |
| 10 | `10-traceability-matrix.md` | Audit table mapping every wireframe screen to entities, endpoints, and screen docs |

### Source Materials

The raw source documents from which this doc set was derived live alongside this folder: `docs/business-case.md` and `docs/wireframes.md`. Future contributors should **not** need to open the raw source files — this doc set is the authoritative reference. The wireframes file references screen images (PNGs) that were unavailable at the time of writing; see `09-open-questions-and-assumptions.md` for details.

### How to Use This Folder

1. Start with `00-product-overview.md` to understand the system's purpose and boundaries.
2. Read `01-roles-and-permissions.md` and `02-data-model.md` to understand who can do what and what the entities are.
3. Read `03-api-reference.md` as the contract between backend and frontend work.
4. Read `04-frontend-architecture.md` and `04b-backend-architecture.md` for implementation conventions.
5. Refer to `05-screens/` for individual screen specs during implementation.
6. Consult `06-ai-assistant.md` for the AI feature's unique requirements.
7. Use `08-glossary.md` to resolve terminology questions.
8. Use `10-traceability-matrix.md` to verify nothing was dropped from the source material.
9. Before making any decision not covered here, read `09-open-questions-and-assumptions.md` to see if it was already flagged.
