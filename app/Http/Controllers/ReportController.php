<?php

namespace App\Http\Controllers;

use App\Actions\Report\ApproveReportAction;
use App\Actions\Report\EscalateReportAction;
use App\Actions\Report\ReturnReportAction;
use App\Actions\Report\SaveDraftAction;
use App\Actions\Report\SubmitReportAction;
use App\Contracts\ReportRepositoryInterface;
use App\Http\Requests\SaveDraftRequest;
use App\Http\Requests\SubmitReportRequest;
use App\Http\Requests\UpdateReportStatusRequest;
use App\Http\Resources\ReportResource;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        private ReportRepositoryInterface $reportRepository,
    ) {
        $this->authorizeResource(Report::class, 'report');
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $sortBy = $request->sortBy ?? 'createdAt';
        $sortDirection = $request->sortDirection ?? ($sortBy === 'submittedAt' ? 'asc' : 'desc');
        $allowedSorts = ['submittedAt', 'createdAt', 'type'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'createdAt';
        }

        $filters = [];
        if ($request->filled('projectId')) $filters['projectId'] = $request->projectId;
        if ($request->owner === 'me') {
            $filters['owner'] = 'me';
            $filters['ownerId'] = $user->id;
        }
        if ($request->filled('status')) $filters['status'] = $request->status;
        if ($request->filled('type')) $filters['type'] = $request->type;
        if ($request->filled('submittedBy')) $filters['submittedBy'] = $request->submittedBy;
        if ($request->filled('division')) $filters['division'] = $request->division;

        $filters['scopingRole'] = $user->role;
        $filters['scopingUserId'] = $user->id;
        $filters['scopingDivisionId'] = $user->division_id;

        $limit = min((int) $request->limit, 100);
        $reports = $this->reportRepository->getPaginated($filters, $limit, $sortBy, $sortDirection);

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
            'data' => $this->reportRepository->statsForSecretary($request->user()->id),
        ]);
    }

    public function store(SubmitReportRequest $request, SubmitReportAction $action): JsonResponse
    {
        $report = $action->execute($request);

        return response()->json([
            'data' => (new ReportResource($report))->resolve($request),
            'message' => 'Report submitted to Scientific Secretary.',
        ], 201);
    }

    public function saveDraft(SaveDraftRequest $request, SaveDraftAction $action): JsonResponse
    {
        $this->authorize('create', Report::class);

        $report = $action->execute($request);

        return response()->json([
            'data' => (new ReportResource($report))->resolve($request),
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
            'data' => (new ReportResource($report))->resolve($request),
            'message' => "Report {$actionText}. Researcher notified.",
        ]);
    }
}
