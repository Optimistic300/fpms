# Backend Architecture

## SOLID Principles Applied

| Principle | How SKMS Enforces It |
|-----------|---------------------|
| **Single Responsibility** | Controllers only handle HTTP concerns. Business logic lives in Action/Service classes. Validation lives in Form Requests. Response shaping lives in API Resources. Side effects live in Event Listeners. |
| **Open/Closed** | Behaviour is extended via new Action classes, Event/Listener pairs, and Service implementations behind Contracts — never by modifying existing classes. |
| **Liskov Substitution** | Repository/Service contracts guarantee substitutable implementations. E.g., `FileStorageInterface` can swap `LocalFileStorage` for `S3FileStorage` without callers changing. |
| **Interface Segregation** | Small, focused interfaces (`FileStorageInterface`, `AiRetrievalInterface`, `ReportRepositoryInterface`) rather than large god interfaces. |
| **Dependency Inversion** | High-level modules depend on interfaces declared in `app/Contracts/`, not on concrete classes. Concrete implementations are bound via the service container. |

## Standard Request Lifecycle

```
Route (api.php)
  → Middleware (auth:sanctum, role check via Policy)
    → Form Request (validation + authorisation)
      → Controller (thin — only calls Action, returns Resource response)
        → Action / Service class (business logic)
          → Model / Repository (data access — Eloquent under the interface)
        → Event (fired by Action after domain operation completes)
          → Listener (handles side effects: notifications, jobs, etc.)
            → Queued Job (for slow work: file processing, AI indexing)
        → API Resource (response transformation: camelCase, sparse fields)
      → Response (JSON, 200/201/422/403)
```

## Folder Structure

```
app/
├── Actions/               # Single-purpose action classes (e.g., SubmitReportAction, LogActivityAction)
│   └── Report/
│       ├── SubmitReportAction.php
│       ├── ApproveReportAction.php
│       └── ReturnReportAction.php
├── Services/              # Service classes (e.g., AiAssistantService, FileStorageService)
│   ├── AiAssistantService.php
│   ├── FileStorageService.php
│   └── ReportOverdueService.php
├── Contracts/             # Interfaces for swappable implementations
│   ├── FileStorageInterface.php
│   ├── AiRetrievalInterface.php
│   └── ReportRepositoryInterface.php
├── Repositories/          # Data access implementations behind contracts
│   ├── ReportRepository.php
│   └── DivisionRepository.php
├── Http/
│   ├── Controllers/
│   │   ├── Api/           # Versioned API controllers (thin, no business logic)
│   │   │   ├── AuthController.php
│   │   │   ├── ProjectController.php
│   │   │   ├── ReportController.php
│   │   │   ├── ActivityController.php
│   │   │   ├── DocumentController.php
│   │   │   ├── LibraryController.php
│   │   │   ├── PublicationController.php
│   │   │   ├── InboxController.php
│   │   │   ├── DivisionController.php
│   │   │   ├── InstituteController.php
│   │   │   └── AiController.php
│   ├── Requests/          # Form Request classes (validation only)
│   │   ├── StoreProjectRequest.php
│   │   ├── UpdateProjectRequest.php
│   │   ├── SubmitReportRequest.php
│   │   ├── LogActivityRequest.php
│   │   └── AiQueryRequest.php
│   └── Resources/         # API Resource classes (response shaping, camelCase)
│       ├── ProjectResource.php
│       ├── ReportResource.php
│       ├── ActivityResource.php
│       └── CamelCaseResource.php  # Base class for camelCase transformation
├── Events/                # Event classes
│   ├── ReportSubmitted.php
│   ├── ReportApproved.php
│   ├── ReportReturned.php
│   ├── ReportEscalated.php
│   ├── DocumentPublished.php
│   ├── ActivityLogged.php
│   └── AccessRequestCreated.php
├── Listeners/             # Event listeners
│   ├── SendReportSubmittedNotification.php
│   ├── SendReportApprovedNotification.php
│   ├── SendAccessRequestNotification.php
│   └── IndexPublishedDocumentForAi.php
├── Notifications/         # Laravel notification classes (database channel)
│   ├── ReportSubmittedNotification.php
│   ├── ReportStatusChangedNotification.php
│   ├── DocumentForwardedNotification.php
│   └── AccessRequestNotification.php
├── Jobs/                  # Queued job classes
│   ├── ProcessDocumentUpload.php
│   ├── IndexDocumentForAi.php
│   └── SendBulkNotifications.php
├── Policies/              # Authorisation policies
│   ├── ProjectPolicy.php
│   ├── ReportPolicy.php
│   ├── ActivityPolicy.php
│   ├── DocumentPolicy.php
│   └── PublicationPolicy.php
├── Models/
│   ├── User.php
│   ├── Division.php
│   ├── Project.php
│   ├── ProjectMember.php
│   ├── Activity.php
│   ├── ActivityType.php
│   ├── Document.php
│   ├── Report.php
│   ├── ReportComment.php
│   ├── Publication.php
│   ├── InboxItem.php
│   └── AccessRequest.php
└── Console/
    └── Commands/
        ├── CalculateReportOverdue.php   # Scheduled: marks reports overdue
        └── GenerateDeadlineAlerts.php    # Scheduled: revision/publication alerts
```

## Fixed Conventions

These are not suggestions — every implementer must follow them:

### Side Effects → Events/Listeners
Any operation that has a consequence beyond its primary database change must fire an Event. The Listener handles the consequence. Examples:
- `ReportSubmitted` Event → `SendReportSubmittedNotification` Listener (notifies Secretary)
- `DocumentPublished` Event → `IndexPublishedDocumentForAi` Listener (queues AI indexing)
- `AccessRequestCreated` Event → `SendAccessRequestNotification` Listener (notifies project owner)

### User-Facing Alerts → Notifications (Database Channel)
Every inbox item, notification bell badge, and report status update must be sent via `Illuminate\Notifications` using the `database` channel. No ad-hoc rows written to `inbox_items` directly by controllers.

### Slow/External Work → Queued Jobs
Anything that involves file processing, external API calls, or AI indexing must be dispatched as a Job onto the queue. Never do synchronous file processing in a request.

### Authorisation → Policies
All permission checks go into Policy classes (`ProjectPolicy`, `ReportPolicy`, etc.). Controllers register them via `$this->authorize()` calls. No `if ($user->role === ...)` checks scattered in controllers or Action classes.

### Periodic Computation → Scheduled Tasks
- `CalculateReportOverdue`: runs daily, flags reports as overdue (submitted >7 days ago, still PENDING)
- `GenerateDeadlineAlerts`: runs daily, checks publication revision due dates, generates system alerts for Management dashboard

## Worked Example: Submit Report

This traces the full lifecycle of `POST /api/reports` from request to response, showing which SOLID principle each layer satisfies.

### 1. Route (`routes/api.php`)
```php
Route::post('/reports', [ReportController::class, 'store'])->middleware('auth:sanctum');
```

### 2. Form Request (`app/Http/Requests/SubmitReportRequest.php`)
- Validates: projectId, type, periodStart, periodEnd, narrativeSummary, file.
- Converts camelCase input keys to snake_case internally.
- Uses `authorize()` method to check via `ReportPolicy` that the user can submit to this project.
- **SRP:** Validation lives here, not in the controller.

### 3. Controller (`app/Http/Controllers/Api/ReportController.php`)
```php
public function store(SubmitReportRequest $request)
{
    $report = $this->submitReportAction->execute(
        $request->validated(),
        $request->user()
    );
    return new ReportResource($report);
}
```
- **SRP:** Controller only handles HTTP concerns (validating via FormRequest, returning a Resource response).

### 4. Action (`app/Actions/Report/SubmitReportAction.php`)
- Receives validated data and the authenticated user.
- Creates the `Report` model record.
- Handles file storage via `FileStorageInterface` (DI'd through constructor — **DIP**).
- Fires `ReportSubmitted` event after creation.
- Returns the Report model.
- **SRP:** Business logic is here, not in the controller or model.

### 5. Event (`app/Events/ReportSubmitted.php`)
- Contains the Report model.
- Implements `ShouldBroadcast` interface for potential future real-time delivery.
- **OCP:** New listeners can be added without modifying this class.

### 6. Listener (`app/Listeners/SendReportSubmittedNotification.php`)
- Handles `ReportSubmitted` event.
- Creates a `ReportSubmittedNotification` and sends it via the `database` channel to all Scientific Secretaries.
- **SRP:** Notification logic is isolated here.

### 7. Notification (`app/Notifications/ReportSubmittedNotification.php`)
- Defines viaDatabase() payload: subject, message, reportId, type.
- Stored as a row in the `notifications` table.
- Backs both the Inbox screen and the bell badge count.

### 8. API Resource (`app/Http/Resources/ReportResource.php`)
- Transforms the Report model to camelCase JSON keys.
- Computes derived fields like `daysWaiting`, includes relationship data (submitter name, project title).
- **SRP:** Response shaping lives here.

### 9. Response
```json
{
  "data": { "id": 1, "status": "PENDING", "version": 1 },
  "message": "Report submitted to Scientific Secretary."
}
```

### SOLID Principles Satisfied

| Layer | Principle | How |
|-------|-----------|-----|
| FormRequest | SRP | Validation in one place |
| Controller | SRP | Thin coordinator |
| Action | SRP, OCP, DIP | Business logic; injects FileStorageInterface |
| Event/Listener | OCP, SRP | Side effects decoupled |
| Resource | SRP | Response transformation |
| Notification | SRP | Alert delivery isolated |

## Interface Definitions

### `FileStorageInterface`
```php
interface FileStorageInterface {
    public function store(UploadedFile $file, string $path): string;
    public function get(string $path): StreamedResponse;
    public function delete(string $path): bool;
    public function url(string $path): string;
}
```

### `AiRetrievalInterface`
```php
interface AiRetrievalInterface {
    public function query(string $query, array $conversationHistory): AiQueryResult;
}
```

## Queue Configuration
- Default queue driver: `database` (for simplicity in v1, no Redis required).
- AI indexing job: `IndexDocumentForAi` dispatched on `Queue::PUSH` (high priority).
- File processing: `ProcessDocumentUpload` (medium priority).
- Notifications: sent via sync queue listener by default, with option to push to queue under high volume.

## CamelCase Response Convention
All API Resources extend a `CamelCaseResource` base class that recursively converts snake_case keys to camelCase. This is enforced once at the base level — individual Resources should not manually rename each field.
