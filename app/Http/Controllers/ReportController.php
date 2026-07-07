<?php

namespace App\Http\Controllers;

use App\Actions\Report\ApproveReportAction;
use App\Actions\Report\EscalateReportAction;
use App\Actions\Report\ReturnReportAction;
use App\Actions\Report\SaveDraftAction;
use App\Actions\Report\SubmitReportAction;
use App\Http\Requests\SaveDraftRequest;
use App\Http\Requests\SubmitReportRequest;
use App\Http\Requests\UpdateReportStatusRequest;
use App\Http\Resources\ReportResource;
use App\Models\Report;
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
        if (in_array($user->role, ['RESEARCHER', 'STUDENT'])) {
            $query->where('submitted_by', $user->id);
        } elseif ($user->role === 'DIVISION_HEAD') {
            $query->whereHas('project', fn($q) => $q->where('division_id', $user->division_id));
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

        return response()->json([
            'data' => ReportResource::collection($reports)->resolve(),
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
        $this->authorize('review', Report::class);

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

    public function store(SubmitReportRequest $request, SubmitReportAction $action): JsonResponse
    {
        $report = $action->execute($request);

        return response()->json([
            'data' => [
                'id' => $report->id,
                'status' => $report->status,
                'version' => $report->version,
            ],
            'message' => 'Report submitted to Scientific Secretary.',
        ], 201);
    }

    public function saveDraft(SaveDraftRequest $request, SaveDraftAction $action): JsonResponse
    {
        $this->authorize('create', Report::class);

        $report = $action->execute($request);

        return response()->json([
            'data' => ['id' => $report->id, 'status' => 'DRAFT'],
            'message' => 'Draft saved.',
        ], 201);
    }

    public function show(Request $request, Report $report): JsonResponse
    {
        $report->load(['project', 'submitter', 'project.division', 'comments.user']);

        $resource = (new ReportResource($report))->withHistory(true);

        return response()->json([
            'data' => $resource->resolve($request),
        ]);
    }

    public function update(
        UpdateReportStatusRequest $request,
        Report $report,
        ApproveReportAction $approveAction,
        ReturnReportAction $returnAction,
        EscalateReportAction $escalateAction,
    ): JsonResponse {
        $validTransitions = ['PENDING' => ['APPROVED', 'RETURNED', 'ESCALATED']];

        if (!isset($validTransitions[$report->status]) || !in_array($request->input('status'), $validTransitions[$report->status])) {
            return response()->json(['message' => 'Invalid status transition.'], 422);
        }

        $report = match ($request->input('status')) {
            'APPROVED' => $approveAction->execute($request, $report),
            'RETURNED' => $returnAction->execute($request, $report),
            'ESCALATED' => $escalateAction->execute($request, $report),
        };

        $actionText = match ($request->input('status')) {
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
