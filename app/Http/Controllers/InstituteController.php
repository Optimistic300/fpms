<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\Document;
use App\Models\Project;
use App\Models\Report;
use App\Policies\InstitutePolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstituteController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        abort_unless(app(InstitutePolicy::class)->view($request->user()), 403);

        return response()->json([
            'data' => [
                'totalProjects' => Project::count(),
                'ongoing' => Project::where('status', 'ACTIVE')->count(),
                'divisionsActive' => Division::count(),
                'reportsPendingReview' => Report::where('status', 'PENDING')->count(),
                'reportsOverdue' => Report::where('status', 'PENDING')
                    ->where('submitted_at', '<', now()->subDays(30))
                    ->count(),
                'libraryDocuments' => Document::where('published', true)->count(),
            ],
        ]);
    }

    public function divisionSummary(Request $request): JsonResponse
    {
        abort_unless(app(InstitutePolicy::class)->view($request->user()), 403);

        $divisions = Division::with('head')->get()->map(function ($div) {
            $totalProj = $div->projects()->count();
            $ongoing = $div->projects()->where('status', 'ACTIVE')->count();
            $activeStaff = $div->users()->where('is_active', true)->count();
            $docCount = Document::whereHas('project', fn($q) => $q->where('division_id', $div->id))->count();
            $pending = Report::whereHas('project', fn($q) => $q->where('division_id', $div->id))
                ->where('status', 'PENDING')->count();
            $overdue = Report::whereHas('project', fn($q) => $q->where('division_id', $div->id))
                ->where('status', 'PENDING')
                ->where('submitted_at', '<', now()->subDays(30))
                ->count();

            $totalReports = Report::whereHas('project', fn($q) => $q->where('division_id', $div->id))->count();
            $approvedReports = Report::whereHas('project', fn($q) => $q->where('division_id', $div->id))
                ->where('status', 'APPROVED')->count();
            $compliance = $totalReports > 0 ? round(($approvedReports / $totalReports) * 100) : 0;

            return [
                'divisionId' => $div->id,
                'divisionName' => $div->name,
                'headName' => $div->head?->full_name,
                'totalProjects' => $totalProj,
                'ongoing' => $ongoing,
                'activeStaff' => $activeStaff,
                'documentCount' => $docCount,
                'reportStatusSummary' => "{$pending} pending, {$overdue} overdue",
                'compliancePercent' => $compliance,
            ];
        });

        return response()->json(['data' => $divisions]);
    }

    public function fundingBreakdown(Request $request): JsonResponse
    {
        abort_unless(app(InstitutePolicy::class)->view($request->user()), 403);

        return response()->json([
            'data' => [
                'donor' => Project::where('funding_type', 'DONOR')->count(),
                'government' => Project::where('funding_type', 'GOVERNMENT')->count(),
                'internal' => Project::where('funding_type', 'INTERNAL')->count(),
            ],
        ]);
    }

    public function compliance(Request $request): JsonResponse
    {
        abort_unless(app(InstitutePolicy::class)->view($request->user()), 403);

        $divisions = Division::all()->map(function ($div) {
            $totalReports = Report::whereHas('project', fn($q) => $q->where('division_id', $div->id))->count();
            $approvedReports = Report::whereHas('project', fn($q) => $q->where('division_id', $div->id))
                ->where('status', 'APPROVED')->count();
            $compliance = $totalReports > 0 ? round(($approvedReports / $totalReports) * 100) : 0;

            return [
                'division' => $div->name,
                'compliancePercent' => $compliance,
            ];
        });

        return response()->json(['data' => $divisions]);
    }

    public function alerts(Request $request): JsonResponse
    {
        abort_unless(app(InstitutePolicy::class)->view($request->user()), 403);

        $limit = min((int) $request->limit, 20);

        $overdueReports = Report::where('status', 'PENDING')
            ->where('submitted_at', '<', now()->subDays(30))
            ->with('project.division')
            ->latest('submitted_at')
            ->limit($limit)
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'type' => 'danger',
                'message' => 'Report overdue in ' . ($r->project?->division?->name ?? 'Unknown') . ' division',
                'timestamp' => $r->submitted_at?->toIso8601String(),
                'link' => '/reports?division=' . ($r->project?->division_id ?? '') . '&status=PENDING',
            ]);

        return response()->json(['data' => $overdueReports]);
    }
}
