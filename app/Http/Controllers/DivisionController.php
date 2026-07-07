<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DivisionController extends Controller
{
    public function stats(Request $request, Division $division): JsonResponse
    {
        $user = $request->user();
        if (!$user->isDivisionHead() && !$user->isManagement()) {
            abort(403);
        }

        $totalProjects = $division->projects()->count();
        $ongoing = $division->projects()->where('status', 'ACTIVE')->count();
        $reportsPending = Report::whereHas('project', fn($q) => $q->where('division_id', $division->id))
            ->where('status', 'PENDING')
            ->count();
        $reportsOverdue = Report::whereHas('project', fn($q) => $q->where('division_id', $division->id))
            ->where('status', 'PENDING')
            ->where('submitted_at', '<', now()->subDays(30))
            ->count();
        $activeResearchers = $division->users()
            ->whereIn('role', ['RESEARCHER', 'STUDENT'])
            ->where('is_active', true)
            ->count();

        return response()->json([
            'data' => [
                'totalProjects' => $totalProjects,
                'ongoing' => $ongoing,
                'reportsPending' => $reportsPending,
                'reportsOverdue' => $reportsOverdue,
                'activeResearchers' => $activeResearchers,
            ],
        ]);
    }

    public function researcherActivity(Request $request, Division $division): JsonResponse
    {
        $user = $request->user();
        if (!$user->isDivisionHead() && !$user->isManagement()) {
            abort(403);
        }

        $users = $division->users()
            ->whereIn('role', ['RESEARCHER', 'STUDENT'])
            ->where('is_active', true)
            ->withCount(['ledProjects as active_projects' => fn($q) => $q->where('status', 'ACTIVE')])
            ->get()
            ->map(fn($user) => [
                'researcherId' => $user->id,
                'fullName' => $user->full_name,
                'activeProjects' => $user->active_projects,
                'projects' => $user->ledProjects()->where('status', 'ACTIVE')->pluck('title')->implode(', '),
                'activitiesThisMonth' => $user->activities()
                    ->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
                'documentsUploaded' => $user->activities()->withCount('documents')->get()->sum('documents_count'),
                'reportStatus' => $user->reports()->where('status', 'PENDING')->exists() ? 'SUBMITTED' : 'NONE',
            ]);

        return response()->json(['data' => $users]);
    }

    public function activityFeed(Request $request, Division $division): JsonResponse
    {
        $user = $request->user();
        if (!$user->isDivisionHead() && !$user->isManagement()) {
            abort(403);
        }

        $limit = min((int) $request->limit, 50);

        $activities = \App\Models\Activity::whereHas('project', fn($q) => $q->where('division_id', $division->id))
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

        return response()->json(['data' => $activities]);
    }
}
