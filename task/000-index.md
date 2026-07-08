# SKMS Task Index

**Maintain this file:** Whoever picks up a task must flip its status here when they start and when they finish. This is the single source of truth for tracking build progress.

## Build Phases

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 — Foundation | 001–003 | Scaffold, schema, base API conventions |
| 2 — Auth & Shell | 004–007 | Auth backend, login, shell, inbox |
| 3 — Entity Backends | 008–012 | Projects, Activities, Documents, Reports, Publications |
| 4 — Stats Backend | 013 | Aggregated stats endpoints |
| 5 — Feature Screens | 014–023 | All frontend screens + admin |
| 6 — AI Assistant | 024–025 | Retrieval, indexing, assistant UI |
| 7 — Infrastructure | 026–028 | Scheduled tasks, offline, CI/hardening |

## Task List

| # | Title | Description | Depends On | Status |
|---|-------|-------------|------------|--------|
| 001 | Project Scaffold | Laravel + React/Vite init, env, folder structure | None | Done |
| 002 | Database Schema & Models | All migrations, Eloquent models, enums, seeders | 001 | Done |
| 003 | Base API Conventions | CamelCaseResource, pagination, error shapes, Contracts, queue config | 002 | Done |
| 004 | Auth System Backend | Sanctum setup, AuthController, password reset, public stats | 003 | Done |
| 005 | Auth Frontend | Login page (WF02), AuthContext, route guard, forgot password UI | 004 | Done |
| 006 | Shell & Global Components | WF01 — sidebar, nav, routing, contexts, floating AI button | 004, 005 | Done |
| 007 | Inbox Backend & Frontend | InboxItem model, notification classes, InboxController, WF12 | 003, 004, 006 | Done |
| 008 | Projects Backend | CRUD, Members, Access Requests, policies, resources, actions | 003, 004 | Done |
| 009 | Activities Backend | CRUD, Types seeder, CSV export, policies, resources, actions | 003, 004 | Done |
| 010 | Documents & File Storage | CRUD, upload/download/preview, FileStorageInterface, Library browse/search | 003, 004 | Done |
| 011 | Reports Backend | CRUD, Draft, Submit, Approve/Return/Escalate, events/listeners, policies | 003, 004 | Done |
| 012 | Publications Backend | CRUD, Pipeline stats, policies, resources | 003, 004 | Done |
| 013 | Stats Backend | Dashboard stats, Division endpoints, Institute endpoints | 004, 008, 009, 011 | Done |
| 014 | Dashboard & Project Directory | WF03 + WF04a frontend screens | 006, 008, 009, 011, 013 | Done |
| 015 | Project Detail Frontend | WF04b — tabs, locked preview, team, actions | 006, 008, 009, 010, 011 | Done |
| 016 | Log Activity & My Activities | WF05a + WF05b — multi-step form, activity list | 006, 009, 010 | Done |
| 017 | Submit Report & My Reports | WF06a + WF06b — multi-step form, report list, timeline | 006, 011 | Done |
| 018 | Report Queue & Review | WF07a + WF07b — Secretary workspace | 006, 011, 013 | Done |
| 019 | Division Dashboard | WF08 — Division Head overview | 006, 013 | Done |
| 020 | Executive Dashboard | WF09 — Management overview | 006, 013 | Done |
| 021 | Library Frontend | WF10 — browse, search, preview, forward | 006, 010 | Done |
| 022 | Publications Frontend | WF11 — cards, tabs, pipeline, CRUD | 006, 012 | Done |
| 023 | Admin Screens (Backend + Frontend) | User CRUD, Division CRUD, ActivityType CRUD, User Management & Settings screens | 004, 006 | Not Started |
| 024 | AI Assistant Backend | MySQL FTS, AiRetrievalInterface, document indexing, AiController | 003, 004, 010 | Not Started |
| 025 | AI Assistant Frontend | WF13 — floating button, panel, conversation, citations | 006, 024 | Not Started |
| 026 | Scheduled Commands | CalculateReportOverdue, GenerateDeadlineAlerts | 003, 004, 011 | Not Started |
| 027 | Offline Support | Service Worker, IndexedDB queue, offline indicators | 001 | Done |
| 028 | Non-Functional Hardening & CI | Performance, security, backup config, testing, CI pipeline | 001 | Done |

## Dependency Graph (Acyclic)

```
001
 └─ 002
     └─ 003
         ├─ 004
         │   ├─ 005
         │   │   └─ 006
         │   │       ├─ 007
         │   │       ├─ 014  015  016  017  018  019  020  021  022  023  025
         │   │       └─ 007
         │   ├─ 008 ──┐
         │   │        ├─ 013 ── 014  018  019  020
         │   │        └─ 014  015
         │   ├─ 009 ──┐
         │   │        ├─ 013 ── 014  018  019  020
         │   │        └─ 014  015  016
         │   ├─ 010 ──┐
         │   │        ├─ 024 ── 025
         │   │        └─ 015  016  021
         │   ├─ 011 ──┐
         │   │        ├─ 013 ── 014  018  019  020
         │   │        ├─ 014  015  017  018
         │   │        └─ 026
         │   └─ 012 ── 022
         └─ 024  026  027  028
```
