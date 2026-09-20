# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Laravel (latest LTS) backend, React + Vite frontend served from Laravel

## Users
Researcher/Scientist - Leads or collaborates on projects, submits reports, logs field activities, publishes to library, uses AI assistant

## Product Purpose
AI-powered knowledge assistant - plain-language Q&A interface over the library's contents with source citations. Never guesses — explicitly says when it cannot answer.

## Positioning
Centralized scientific knowledge hub that houses CSIR-FORIG's scientific knowledge — projects, reports, publications, field data, and institutional documents — in one organised place with role-based access control, a formal submission pipeline, a permanent library, and an AI assistant that answers questions from the institute's own stored knowledge.

## Operating Context
Scientific research workflow at CSIR-FORIG involving project management, report submission (quarterly, mid-year, annual), field data logging, publication tracking (Draft → Submitted → In Revision → Published), and knowledge retrieval through the AI assistant. Formal channel from researcher to Scientific Secretary for report review and approval.

## Capabilities and Constraints
- REST API under /api with camelCase JSON over the wire (Laravel transforms snake_case↔camelCase)
- Role-based access control with specific roles: RESEARCHER, STUDENT, SECRETARY, DIVISION_HEAD, MANAGEMENT, ADMIN
- Laravel Sanctum for authentication (token mode, no sessions)
- MySQL database
- Local disk storage (development), S3-compatible storage (production)
- AI assistant must cite source documents and never guess when uncertain
- Side effects handled through Events/Listeners (no inline notification creation)
- Slow/external work queued via Jobs (AI indexing, file processing)
- Authorization via Policies (no inline role checks)
- Periodic tasks via Scheduled Commands (CalculateReportOverdue, GenerateDeadlineAlerts run daily)
- SOLID principles throughout (thin controllers delegating to Action/Service classes)

## Brand Commitments
CSIR-FORIG's Scientific Knowledge Management System (SKMS), also known as Forest Research Project Management System (FPMS)

## Evidence on Hand
Complete documentation in docs/ directory:
- Product overview (00-product-overview.md)
- Roles and permissions (01-roles-and-permissions.md)
- Data model (02-data-model.md)
- API reference (03-api-reference.md) - binding contract between backend and frontend
- Frontend architecture (04-frontend-architecture.md)
- Backend architecture (04b-backend-architecture.md)
- Wireframes (05-screens/)
- AI assistant design (06-ai-assistant.md)
- Non-functional requirements (07-non-functional-requirements.md)
- Glossary (08-glossary.md)
- Open questions (09-open-questions-and-assumptions.md)
- Traceability matrix (10-traceability-matrix.md)

## Product Principles
1. Secure, role-based access to scientific knowledge
2. Formal workflows for knowledge creation and validation  
3. Permanent preservation of institutional memory
4. AI-assisted knowledge retrieval with verifiable sources
5. Staged rollout to minimize risk and incorporate user feedback

## Accessibility & Inclusion
As a government/research system serving diverse users, should follow WCAG accessibility guidelines for inclusive access.