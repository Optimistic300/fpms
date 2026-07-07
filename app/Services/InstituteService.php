<?php

namespace App\Services;

use App\Models\Division;
use App\Models\Document;
use App\Models\Project;
use App\Models\Report;

class InstituteService
{
    public function stats(): array
    {
        $totalProjects = Project::count();
        $ongoing = Project::where('status', 'ACTIVE')->count();
        $divisionsActive = Division::whereHas('projects', fn($q) => $q->where('status', 'ACTIVE'))
            ->count();
        $reportsPendingReview = Report::where('status', 'PENDING')->count();
        $reportsOverdue = Report::where('status', 'PENDING')
            ->where(function ($q) {
                $q->where('submitted_at', '<', now()->subDays(7))
                    ->orWhere(function ($q2) {
                        $q2->whereNull('submitted_at')
                            ->where('created_at', '<', now()->subDays(7));
                    });
            })
            ->count();
        $libraryDocuments = Document::where('published', true)->count();

        return [
            'totalProjects' => $totalProjects,
            'ongoing' => $ongoing,
            'divisionsActive' => $divisionsActive,
            'reportsPendingReview' => $reportsPendingReview,
            'reportsOverdue' => $reportsOverdue,
            'libraryDocuments' => $libraryDocuments,
        ];
    }

    public function divisionSummaries(): array
    {
        return Division::with('head')->get()->map(function ($div) {
            $totalProjects = $div->projects()->count();
            $ongoing = $div->projects()->where('status', 'ACTIVE')->count();
            $activeStaff = $div->users()->where('is_active', true)->count();
            $documentCount = Document::whereHas('project', fn($q) => $q->where('division_id', $div->id))->count();

            $pendingReports = Report::whereHas('project', fn($q) => $q->where('division_id', $div->id))
                ->where('status', 'PENDING')->count();
            $overdueReports = Report::whereHas('project', fn($q) => $q->where('division_id', $div->id))
                ->where('status', 'PENDING')
                ->where(function ($q) {
                    $q->where('submitted_at', '<', now()->subDays(7))
                        ->orWhere(function ($q2) {
                            $q2->whereNull('submitted_at')
                                ->where('created_at', '<', now()->subDays(7));
                        });
                })
                ->count();

            $totalReports = Report::whereHas('project', fn($q) => $q->where('division_id', $div->id))->count();
            $approvedReports = Report::whereHas('project', fn($q) => $q->where('division_id', $div->id))
                ->where('status', 'APPROVED')->count();
            $compliancePercent = $totalReports > 0 ? round(($approvedReports / $totalReports) * 100) : 0;

            return [
                'divisionId' => $div->id,
                'divisionName' => $div->name,
                'headName' => $div->head?->full_name,
                'totalProjects' => $totalProjects,
                'ongoing' => $ongoing,
                'activeStaff' => $activeStaff,
                'documentCount' => $documentCount,
                'reportStatusSummary' => "{$pendingReports} pending, {$overdueReports} overdue",
                'compliancePercent' => $compliancePercent,
            ];
        })->toArray();
    }

    public function fundingBreakdown(): array
    {
        $breakdown = Project::selectRaw('funding_type, count(*) as count')
            ->groupBy('funding_type')
            ->pluck('count', 'funding_type');

        return [
            'donor' => $breakdown['DONOR'] ?? 0,
            'government' => $breakdown['GOVERNMENT'] ?? 0,
            'internal' => $breakdown['INTERNAL'] ?? 0,
        ];
    }

    public function compliance(): array
    {
        return Division::all()->map(function ($div) {
            $totalReports = Report::whereHas('project', fn($q) => $q->where('division_id', $div->id))->count();
            $approvedReports = Report::whereHas('project', fn($q) => $q->where('division_id', $div->id))
                ->where('status', 'APPROVED')->count();
            $compliancePercent = $totalReports > 0 ? round(($approvedReports / $totalReports) * 100) : 0;

            return [
                'division' => $div->name,
                'compliancePercent' => $compliancePercent,
            ];
        })->toArray();
    }

    public function alerts(int $limit = 5): array
    {
        return Report::where('status', 'PENDING')
            ->where(function ($q) {
                $q->where('submitted_at', '<', now()->subDays(7))
                    ->orWhere(function ($q2) {
                        $q2->whereNull('submitted_at')
                            ->where('created_at', '<', now()->subDays(7));
                    });
            })
            ->with('project.division')
            ->latest('submitted_at')
            ->limit($limit)
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'type' => 'danger',
                'message' => 'Report overdue in ' . ($r->project?->division?->name ?? 'Unknown') . ' division',
                'timestamp' => ($r->submitted_at ?? $r->created_at)?->toIso8601String(),
                'link' => '/reports?division=' . ($r->project?->division_id ?? '') . '&status=PENDING',
            ])
            ->toArray();
    }
}
