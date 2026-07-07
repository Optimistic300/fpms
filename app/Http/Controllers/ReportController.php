<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ReportComment;
use App\Policies\ProjectPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Report::class, 'report');
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Report::with(['project', 'submitter', 'project.division']);

        if ($request->filled('projectId')) {
            $query->where('project_id', $request->projectId);
        }

        if ($request->owner === 'me') {
            $query->where('submitted_by', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('submittedBy')) {
            $query->where('submitted_by', $request->submittedBy);
        }

        if ($request->filled('division')) {
            $query->whereHas('project', fn($q) => $q->where('division_id', $request->division));
        }

        // Scoping
        if ($user->isResearcher() || $user->isStudent()) {
            $query->where('submitted_by', $user->id);
        } elseif ($user->isDivisionHead()) {
            $query->whereHas('project', fn($q) => $q->where('division_id', $user->division_id));
        } elseif ($user->isSecretary()) {
            // Can see all pending/returned/approved
        }

        $sortBy = $request->sortBy ?? 'createdAt';
        $sortDirection = $request->sortDirection ?? ($sortBy === 'submittedAt' ? 'asc' : 'desc');

        $allowedSorts = ['submittedAt', 'createdAt', 'type'];
        if (!in_array($sortBy, $allowedSorts)) $sortBy = 'createdAt';

        $sortColumn = match ($sortBy) {
            'submittedAt' => 'submitted_at',
            'type' => 'type',
            default => 'created_at',
        };

        $limit = min((int) $request->limit, 100);
        $reports = $query->orderBy($sortColumn, $sortDirection)->paginate($limit);

        $reports->getCollection()->transform(function ($report) {
            $daysWaiting = $report->submitted_at ? now()->diffInDays($report->submitted_at) : 0;

            return [
                'id' => $report->id,
                'reportName' => $report->type . ' Report',
                'projectId' => $report->project_id,
                'projectTitle' => $report->project?->title,
                'period' => $report->period_start?->toDateString() . ' — ' . $report->period_end?->toDateString(),
                'type' => $report->type,
                'status' => $report->status,
                'version' => $report->version,
                'parentReportId' => $report->parent_report_id,
                'submittedBy' => $report->submitter?->full_name,
                'division' => $report->project?->division?->name,
                'submittedAt' => $report->submitted_at?->toIso8601String(),
                'daysWaiting' => $daysWaiting,
            ];
        });

        return response()->json([
            'data' => $reports->items(),
            'meta' => [
                'currentPage' => $reports->currentPage(),
                'lastPage' => $reports->lastPage(),
                'perPage' => $reports->perPage(),
                'total' => $reports->total(),
            ],
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $request->user()->isSecretary() || abort(403);

        return response()->json([
            'data' => [
                'overdue' => Report::where('status', 'PENDING')
                    ->where(function ($q) {
                        $q->whereNull('submitted_at')
                            ->orWhere('submitted_at', '<', now()->subDays(30));
                    })
                    ->count(),
                'pending' => Report::where('status', 'PENDING')->count(),
                'approvedThisQuarter' => Report::where('status', 'APPROVED')
                    ->where('submitted_at', '>=', now()->startOfQuarter())
                    ->count(),
                'returned' => Report::where('status', 'RETURNED')->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'projectId' => 'required|exists:projects,id',
            'type' => 'required|in:QUARTERLY,MID_YEAR,ANNUAL',
            'periodStart' => 'required|date',
            'periodEnd' => 'required|date|after:periodStart',
            'narrativeSummary' => 'required|string',
            'file' => 'nullable|string',
        ]);

        $report = Report::create([
            'project_id' => $validated['projectId'],
            'submitted_by' => $request->user()->id,
            'type' => $validated['type'],
            'period_start' => $validated['periodStart'],
            'period_end' => $validated['periodEnd'],
            'narrative_summary' => $validated['narrativeSummary'],
            'status' => 'PENDING',
            'version' => 1,
            'submitted_at' => now(),
        ]);

        return response()->json([
            'data' => ['id' => $report->id, 'status' => $report->status, 'version' => $report->version],
            'message' => 'Report submitted to Scientific Secretary.',
        ], 201);
    }

    public function saveDraft(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'projectId' => 'sometimes|exists:projects,id',
            'type' => 'sometimes|in:QUARTERLY,MID_YEAR,ANNUAL',
            'periodStart' => 'sometimes|date',
            'periodEnd' => 'sometimes|date|after:periodStart',
            'narrativeSummary' => 'sometimes|string',
        ]);

        $data = [
            'submitted_by' => $request->user()->id,
            'status' => 'DRAFT',
            'period_start' => $validated['periodStart'] ?? now()->toDateString(),
            'period_end' => $validated['periodEnd'] ?? now()->addDay()->toDateString(),
            'narrative_summary' => $validated['narrativeSummary'] ?? '',
        ];
        if (isset($validated['projectId'])) $data['project_id'] = $validated['projectId'];
        if (isset($validated['type'])) $data['type'] = $validated['type'];

        $report = Report::create($data);

        return response()->json([
            'data' => ['id' => $report->id, 'status' => 'DRAFT'],
            'message' => 'Draft saved.',
        ], 201);
    }

    public function show(Request $request, Report $report): JsonResponse
    {
        $report->load(['project', 'submitter', 'project.division', 'comments.user']);

        $daysWaiting = $report->submitted_at ? now()->diffInDays($report->submitted_at) : 0;

        $history = $report->comments->map(fn($c) => [
            'event' => 'COMMENT',
            'timestamp' => $c->created_at?->toIso8601String(),
            'user' => $c->user?->full_name,
            'comment' => $c->comment,
        ]);

        // Add status transitions to history
        $history->prepend([
            'event' => 'SUBMITTED',
            'timestamp' => $report->submitted_at?->toIso8601String(),
            'user' => $report->submitter?->full_name,
            'comment' => null,
        ]);

        return response()->json([
            'data' => [
                'id' => $report->id,
                'projectId' => $report->project_id,
                'projectTitle' => $report->project?->title,
                'type' => $report->type,
                'status' => $report->status,
                'version' => $report->version,
                'narrativeSummary' => $report->narrative_summary,
                'file' => $report->file_path ? ['filename' => basename($report->file_path), 'size' => 0] : null,
                'submittedBy' => $report->submitter?->full_name,
                'division' => $report->project?->division?->name,
                'submittedAt' => $report->submitted_at?->toIso8601String(),
                'daysWaiting' => $daysWaiting,
                'comment' => $report->comment,
                'history' => $history,
            ],
        ]);
    }

    public function update(Request $request, Report $report): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:APPROVED,RETURNED,ESCALATED',
            'comment' => 'required_if:status,RETURNED,ESCALATED|string|nullable',
        ]);

        $validTransitions = ['PENDING' => ['APPROVED', 'RETURNED', 'ESCALATED']];

        if (!isset($validTransitions[$report->status]) || !in_array($validated['status'], $validTransitions[$report->status])) {
            return response()->json(['message' => 'Invalid status transition.'], 422);
        }

        $report->update([
            'status' => $validated['status'],
            'comment' => $validated['comment'] ?? null,
            'reviewed_by' => $request->user()->id,
        ]);

        // Add a comment to history
        if ($validated['comment']) {
            ReportComment::create([
                'report_id' => $report->id,
                'user_id' => $request->user()->id,
                'comment' => $validated['comment'],
            ]);
        }

        $actionText = match ($validated['status']) {
            'APPROVED' => 'approved',
            'RETURNED' => 'returned',
            'ESCALATED' => 'escalated',
        };

        return response()->json([
            'data' => ['id' => $report->id, 'status' => $report->status],
            'message' => "Report {$actionText}. Researcher notified.",
        ]);
    }
}
