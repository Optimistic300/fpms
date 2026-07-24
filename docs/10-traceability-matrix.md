# Traceability Matrix

Each row maps a wireframe screen to its primary entities, API endpoints, and the screen doc that covers it.

| WF | Screen Name | Primary Entities | API Endpoints Used | Screen Doc |
|----|-------------|-----------------|--------------------|------------|
| 01 | Shell | User, Notification | `GET /api/inbox?limit=1` (unread count) | `05-screens/01-shell.md` |
| 02 | Login | User, Division, Project, Document | `GET /api/public/stats`, `POST /api/auth/login`, `GET /api/auth/validate`, `POST /api/auth/logout` | `05-screens/02-login.md` |
| 03 | Dashboard | User, Project, Activity, Report | `GET /api/dashboard/stats`, `GET /api/projects?owner=me&limit=20`, `GET /api/activities?owner=me&limit=3`, `GET /api/reports?owner=me&limit=3` | `05-screens/03-dashboard.md` |
| 04a | Project Directory | Project, Division, User, ProjectMember | `GET /api/projects`, `POST /api/projects` | `05-screens/04a-project-directory.md` |
| 04b | Project Detail | Project, Activity, Document, Report, ProjectMember, AccessRequest | `GET /api/projects/:id`, `PUT /api/projects/:id`, `GET /api/activities?projectId=:id`, `GET /api/documents?projectId=:id`, `GET /api/reports?projectId=:id`, `GET /api/projects/:id/members`, `POST /api/projects/:id/members`, `PATCH /api/documents/:id`, `POST /api/projects/:id/access-requests` | `05-screens/04b-project-detail.md` |
| 05a | Log Activity | Activity, ActivityType, Document | `GET /api/activity-types`, `POST /api/activities`, `POST /api/activities/:id/documents` | `05-screens/05a-log-activity.md` |
| 05b | My Activities | Activity, Document | `GET /api/activities?owner=me`, `GET /api/activities?owner=me&format=csv`, `PUT /api/activities/:id`, `DELETE /api/activities/:id`, `GET /api/documents/:id/download`, `PATCH /api/documents/:id`, `DELETE /api/documents/:id`, `POST /api/inbox/forward` | `05-screens/05b-my-activities.md` |
| 06a | Submit Report | Report, Project | `POST /api/reports`, `POST /api/reports/draft` | `05-screens/06a-submit-report.md` |
| 06b | My Reports | Report, ReportComment | `GET /api/reports?owner=me` | `05-screens/06b-my-reports.md` |
| 07a | Report Queue | Report, Division | `GET /api/reports?status=PENDING`, `GET /api/reports/stats` | `05-screens/07a-report-queue.md` |
| 07b | Report Review | Report, ReportComment, Document | `GET /api/reports/:id`, `GET /api/reports?projectId=&submittedBy=&status=APPROVED`, `PATCH /api/reports/:id` | `05-screens/07b-report-review.md` |
| 08 | Division Dashboard | Division, Project, User, Activity, Report | `GET /api/divisions/:divisionId/stats`, `GET /api/projects?division=:divisionId`, `GET /api/divisions/:divisionId/researcher-activity`, `GET /api/reports?division=:divisionId&limit=5`, `GET /api/divisions/:divisionId/activity-feed?limit=10` | `05-screens/08-division-dashboard.md` |
| 09 | Executive Dashboard | Division, Project, Publication, Report | `GET /api/institute/stats`, `GET /api/divisions/summary`, `GET /api/institute/funding-breakdown`, `GET /api/institute/compliance`, `GET /api/publications?limit=4`, `GET /api/institute/alerts?limit=5` | `05-screens/09-executive-dashboard.md` |
| 10 | Library | Document, Division | `GET /api/library/stats`, `GET /api/library/documents`, `GET /api/library/search`, `GET /api/documents/:id/preview`, `GET /api/documents/:id/download`, `POST /api/inbox/forward` | `05-screens/10-library.md` |
| 11 | Publications | Publication, Project | `GET /api/publications`, `GET /api/publications/pipeline`, `POST /api/publications`, `PUT /api/publications/:id` | `05-screens/11-publications.md` |
| 12 | Inbox | InboxItem, Document, Report, User | `GET /api/inbox`, `PATCH /api/inbox/read-all`, `PATCH /api/inbox/:id/read`, `POST /api/inbox/forward` | `05-screens/12-inbox.md` |
| 13 | AI Assistant | Document, Citation | `POST /api/ai/query`, `GET /api/documents/:id/preview` | `05-screens/13-ai-assistant.md` |

## Coverage Summary

| Metric | Count |
|--------|-------|
| Wireframe screens | 17 (WF01–WF13, including a/b splits) |
| Screen doc files | 17 (one per WF in `05-screens/`) |
| Unique entities defined | 12 (User, Division, Project, ProjectMember, Activity, ActivityType, Document, Report, ReportComment, Publication, InboxItem, AccessRequest) |
| Unique API endpoints | 40+ |
| All endpoints documented in `03-api-reference.md` | ✅ |
| All entity fields documented in `02-data-model.md` | ✅ |
| All role permissions documented in `01-roles-and-permissions.md` | ✅ |
