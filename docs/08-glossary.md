# Glossary

## Domain Terms

| Term | Definition |
|------|------------|
| Activity | A logged piece of work (field data collection, lab work, community engagement, etc.) attached to a project, with optional file attachments. |
| CCST Student | A student conducting research at CSIR-FORIG through the CCST programme; their research is tracked in the system. |
| Citation | A numbered reference to a source document, rendered as a card with title, author, division, and page number, used in AI Assistant responses. |
| Compliance % | The percentage of reports submitted on time within a division. Used on the Executive Dashboard. |
| Division | An organisational unit within CSIR-FORIG (e.g., Forest Ecology, Climate Change). |
| Document | A file (data sheet, photo, map, receipt, report, manuscript) attached to a project or activity. Published documents are visible in the Library. |
| Honest-limits banner | A non-dismissible disclaimer rendered below every AI Assistant response, stating the answer draws only from FORIG's own library. |
| Inbox | A per-user feed of three item types: forwarded documents, report status updates, and system alerts. |
| Institute | The whole of CSIR-FORIG, across all divisions. |
| Library | The permanent, searchable collection of all published documents. |
| Pipeline (Publications) | The four-stage lifecycle of a publication: Draft → Submitted → In Revision → Published. |
| Progress | A 0–100 percentage indicating how complete a project is, manually set or computed from milestones. |
| Project | A research initiative with a title, lead researcher, division, funding, dates, status, and attached files. |
| Publication | A scholarly output (paper, thesis, report) tracked through its lifecycle stages. |
| Report | A formal submission (quarterly, mid-year, or annual) created by a researcher and submitted to the Scientific Secretary for review. |
| Report Queue | The Secretary's workspace showing all reports with PENDING status, sorted oldest-first. |
| Resubmission | A new report version linked to an original via `parentReportId`, created when a returned report is revised and resubmitted. |
| Scientific Secretary | The role responsible for reviewing, approving, returning, or escalating report submissions. |
| Session | A user's authenticated period, maintained via a Laravel Sanctum token stored in localStorage. |

## Project Statuses

| Status | Definition |
|--------|------------|
| PROPOSED | A project has been created but work has not yet started. |
| ACTIVE | The project is currently in progress. |
| COMPLETED | All project work is finished. |
| ARCHIVED | The project record is preserved but no longer active. |

## Report Statuses

| Status | Definition |
|--------|------------|
| DRAFT | The report is being composed but has not been submitted. Saved via `POST /api/reports/draft`. |
| PENDING | The report has been submitted to the Scientific Secretary and awaits review. |
| RETURNED | The Secretary has reviewed and returned the report with comments for revision. |
| APPROVED | The Secretary has accepted the report. Approved reports are published to the Library. |
| ESCALATED | The Secretary has escalated the report to Management for resolution. |

## Publication Statuses

| Status | Definition |
|--------|------------|
| DRAFT | The publication record is being created but not yet submitted. |
| SUBMITTED | The paper has been submitted to a journal. |
| IN_REVISION | The journal has requested revisions; a revision due date tracks the deadline. |
| PUBLISHED | The paper has been accepted and published. A DOI is recorded. |

## Publication Types

| Type | Definition |
|------|------------|
| PAPER | A journal article, conference paper, or other scholarly publication. |
| THESIS | A postgraduate thesis or dissertation. |
| REPORT | A technical report or institutional publication. |
| STUDENT | A CCST student research project output. |

## Project Fundng Types

| Type | Definition |
|------|------------|
| DONOR | Funded by an external donor organisation. |
| GOVERNMENT | Funded by government allocation. |
| INTERNAL | Funded by CSIR-FORIG's own resources. |

## Document Types

| Type | Definition |
|------|------------|
| DATA_SHEET | Spreadsheet or structured data file. |
| PHOTO | Photographic image. |
| MAP | Map or GIS file. |
| RECEIPT | Financial receipt or supporting paperwork. |
| REPORT | Formal report document (typically PDF). |
| MANUSCRIPT | Draft or submitted manuscript. |
| OTHER | Any other document type. |

## Inbox Item Types

| Type | Definition |
|------|------------|
| DOCUMENT | A document forwarded by another user. |
| REPORT_UPDATE | A notification about a report status change. |
| SYSTEM | A system-generated alert. |

## Access Request Statuses

| Status | Definition |
|--------|------------|
| PENDING | The request has been sent but not yet actioned. |
| GRANTED | The project owner has approved access. |
| DENIED | The project owner has denied access. |

## Project Member Roles

| Role | Definition |
|------|------------|
| LEAD | The project owner (creator/lead researcher). Has full edit and management permissions. |
| COLLABORATOR | A team member with read access to project contents. |

## User Roles

| Role | Definition |
|------|------------|
| RESEARCHER | A scientist conducting research; full project, activity, report, and publication capabilities for owned projects. |
| STUDENT | A CCST student; same capabilities as RESEARCHER but scope is typically their student project. |
| SECRETARY | The Scientific Secretary; reviews and actions all report submissions. |
| DIVISION_HEAD | Oversees a division's projects and researchers; has owner-level access to division projects. |
| MANAGEMENT | Institute leadership; views all data institute-wide without restrictions. |
| ADMIN | System administrator; manages users and settings, no project/research capabilities. |
