<?php

namespace App\Repositories;

use App\Models\Activity;
use App\Models\Document;
use App\Models\Project;
use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DivisionRepository
{
    public function stats(int $divisionId): array
    {
        $totalProjects = Project::where('division_id', $divisionId)->count();
        $ongoing = Project::where('division_id', $divisionId)->where('status', 'ACTIVE')->count();

        $reportsPending = Report::whereHas('project', fn($q) => $q->where('division_id', $divisionId))
            ->where('status', 'PENDING')
            ->count();

        $reportsOverdue = Report::whereHas('project', fn($q) => $q->where('division_id', $divisionId))
            ->where('status', 'PENDING')
            ->where(function ($q) {
                $q->where('submitted_at', '<', now()->subDays(7))
                    ->orWhere(function ($q2) {
                        $q2->whereNull('submitted_at')
                            ->where('created_at', '<', now()->subDays(7));
                    });
            })
            ->count();

        $projectIds = Project::where('division_id', $divisionId)->pluck('id');
        $activeResearchers = User::where('division_id', $divisionId)
            ->where('is_active', true)
            ->where(function ($q) use ($projectIds) {
                $q->whereIn('id', function ($sub) use ($projectIds) {
                    $sub->select('lead_researcher_id')->from('projects')
                        ->whereIn('id', $projectIds);
                })->orWhereIn('id', function ($sub) use ($projectIds) {
                    $sub->select('user_id')->from('project_members')
                        ->whereIn('project_id', $projectIds);
                });
            })
            ->count();

        return [
            'totalProjects' => $totalProjects,
            'ongoing' => $ongoing,
            'reportsPending' => $reportsPending,
            'reportsOverdue' => $reportsOverdue,
            'activeResearchers' => $activeResearchers,
        ];
    }

    public function researcherActivity(int $divisionId): array
    {
        $projectIds = Project::where('division_id', $divisionId)->pluck('id');

        $users = User::where('division_id', $divisionId)
            ->where('is_active', true)
            ->whereIn('role', ['RESEARCHER', 'STUDENT'])
            ->where(function ($q) use ($projectIds) {
                $q->whereIn('id', function ($sub) use ($projectIds) {
                    $sub->select('lead_researcher_id')->from('projects')
                        ->whereIn('id', $projectIds);
                })->orWhereIn('id', function ($sub) use ($projectIds) {
                    $sub->select('user_id')->from('project_members')
                        ->whereIn('project_id', $projectIds);
                });
            })
            ->get();

        return $users->map(function ($user) use ($projectIds, $divisionId) {
            $userProjectIds = Project::where('division_id', $divisionId)
                ->where(function ($q) use ($user) {
                    $q->where('lead_researcher_id', $user->id)
                        ->orWhereIn('id', function ($sub) use ($user) {
                            $sub->select('project_id')->from('project_members')
                                ->where('user_id', $user->id);
                        });
                })
                ->pluck('id');

            $activeProjects = Project::whereIn('id', $userProjectIds)
                ->where('status', 'ACTIVE')
                ->count();

            $activitiesThisMonth = Activity::where('user_id', $user->id)
                ->whereIn('project_id', $userProjectIds)
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();

            $documentsUploaded = Document::where('uploaded_by', $user->id)
                ->whereIn('project_id', $projectIds)
                ->count();

            $latestReport = Report::where('submitted_by', $user->id)
                ->whereIn('project_id', $projectIds)
                ->latest('submitted_at')
                ->first();

            return [
                'researcherId' => $user->id,
                'fullName' => $user->full_name,
                'activeProjects' => $activeProjects,
                'projects' => $userProjectIds->count(),
                'activitiesThisMonth' => $activitiesThisMonth,
                'documentsUploaded' => $documentsUploaded,
                'reportStatus' => $latestReport?->status ?? 'NONE',
            ];
        })->toArray();
    }

    public function activityFeed(int $divisionId, int $limit = 10): array
    {
        $projectIds = Project::where('division_id', $divisionId)->pluck('id');

        $activities = Activity::whereIn('project_id', $projectIds)
            ->with('user')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn($a) => [
                'type' => 'activity',
                'message' => ($a->user?->full_name ?? 'Someone') . ' logged ' . $a->type,
                'timestamp' => $a->created_at?->toIso8601String(),
                'link' => '/projects/' . $a->project_id,
            ]);

        $overdueReports = Report::whereIn('project_id', $projectIds)
            ->where('status', 'PENDING')
            ->where(function ($q) {
                $q->where('submitted_at', '<', now()->subDays(7))
                    ->orWhere(function ($q2) {
                        $q2->whereNull('submitted_at')
                            ->where('created_at', '<', now()->subDays(7));
                    });
            })
            ->with('project')
            ->latest('submitted_at')
            ->limit($limit)
            ->get()
            ->map(fn($r) => [
                'type' => 'alert',
                'message' => 'Report overdue: ' . ($r->project?->title ?? 'Unknown project'),
                'timestamp' => ($r->submitted_at ?? $r->created_at)?->toIso8601String(),
                'link' => '/projects/' . $r->project_id . '/reports',
                'severity' => 'danger',
            ]);

        $feed = collect($activities)
            ->merge($overdueReports)
            ->sortByDesc('timestamp')
            ->take($limit)
            ->values()
            ->toArray();

        return $feed;
    }
}
