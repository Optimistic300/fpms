# Task 026: Scheduled Commands

**Status:** Done

## Completion Notes
Completed 2026-07-07. Created CalculateReportOverdue and GenerateDeadlineAlerts commands. Added is_overdue migration to reports. Registered daily schedules in routes/console.php. 9 ConsoleCommandTest tests. 131 backend tests passing.
**Depends on:** 003, 004, 011
**Docs referenced:** `docs/03-api-reference.md` (no direct endpoint — these are console commands), `docs/04b-backend-architecture.md` (Scheduled Commands), `docs/07-non-functional-requirements.md` (Audit), `docs/09-open-questions-and-assumptions.md`

## Objective

Implement the two scheduled Artisan commands: `CalculateReportOverdue` — marks reports as overdue when PENDING for more than 7 days — and `GenerateDeadlineAlerts` — creates system inbox alerts for publication revision deadlines approaching. These run daily via `schedule:run`.

## Context

Reports that sit in PENDING status for extended periods need to be flagged. Publications with upcoming revision deadlines need proactive alerts. Both are periodic background tasks that support the Secretary and Management workflows. Overdue flags affect the Report Queue display and Executive Dashboard compliance stats.

## Scope

**In scope:**
- `CalculateReportOverdue` command: flag reports PENDING > 7 days, create/update an `is_overdue` boolean or generate system inbox alerts
- `GenerateDeadlineAlerts` command: check publications with `IN_REVISION` status where `revisionDueDate` is within 60 days, create system inbox alerts for Management
- Console Kernel registration (`app/Console/Kernel.php`) — schedule commands to run daily
- Inbox alert creation for overdue reports (notify Secretary) and approaching revision deadlines (notify Management)

**Out of scope:**
- Any frontend changes (overdue display already handled in WF07a via `daysWaiting > 7` logic)
- Any API changes

## Architectural conventions that apply

- Commands live in `app/Console/Commands/`
- Commands are registered in `app/Console/Kernel.php` `schedule()` method
- Alerts are created via `InboxService` (Task 007) — call `InboxService::createSystemAlert()` or equivalent
- Command naming: `reports:calculate-overdue` and `alerts:generate-deadline`
- Output: commands log to `info()` for `schedule:run` monitoring

## Relevant data model

### Report (for overdue calculation)
- `status` = PENDING
- `submittedAt` > 7 days ago

### Publication (for deadline alerts)
- `status` = IN_REVISION
- `revisionDueDate` within 60 days of now

## Step-by-step implementation checklist

- [ ] Create `app/Console/Commands/CalculateReportOverdue.php`:
  - Signature: `reports:calculate-overdue`
  - Query: `Report::where('status', 'PENDING')->where('submittedAt', '<', now()->subDays(7))->get()`
  - For each: create a system inbox alert for SECRETARY users: "Report '[title]' for project '[project]' is overdue (submitted [X] days ago)."
  - Log the count of overdue reports found
- [ ] Create `app/Console/Commands/GenerateDeadlineAlerts.php`:
  - Signature: `alerts:generate-deadline`
  - Query: `Publication::where('status', 'IN_REVISION')->where('revisionDueDate', '<=', now()->addDays(60))->where('revisionDueDate', '>=', now())->get()`
  - For each: create a system inbox alert for MANAGEMENT users: "Revision deadline approaching: '[title]' due on [date] ([N] days remaining)."
  - Also create alert for the publication owner
  - Log the count of alerts generated
- [ ] Update `app/Console/Kernel.php`:
  ```php
  $schedule->command('reports:calculate-overdue')->daily();
  $schedule->command('alerts:generate-deadline')->daily();
  ```
- [ ] Run `php artisan schedule:run` to verify commands are registered
- [ ] Run commands manually to test: `php artisan reports:calculate-overdue`, `php artisan alerts:generate-deadline`
- [ ] Write tests: create test data (reports in PENDING > 7 days, publications nearing revision deadline), run commands, verify inbox alerts created

## Definition of done

- `php artisan reports:calculate-overdue` finds overdue reports and creates system alerts
- `php artisan alerts:generate-deadline` finds approaching revision deadlines and creates alerts
- Commands are registered in Kernel.php to run daily
- Commands log their output to `info()`
- Tests verify alert creation with seeded data
- Running a command multiple times doesn't duplicate alerts (or alert creation is idempotent via check)

## Open questions / assumptions inherited

- **Overdue threshold:** 7 days, per `09-open-questions-and-assumptions.md`. Configurable via config file.
- **Revision deadline alert threshold:** 60 days, per `09-open-questions-and-assumptions.md`. Configurable.
