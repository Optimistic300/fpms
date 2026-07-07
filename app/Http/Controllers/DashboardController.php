<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $totalProjects = $user->ownedProjects()->count();
        $ongoing = $user->ownedProjects()->where('status', 'ACTIVE')->count();
        $reportsPending = $user->reports()->where('status', 'PENDING')->count();
        $activitiesThisMonth = $user->activities()
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return response()->json([
            'data' => [
                'totalProjects' => $totalProjects,
                'ongoing' => $ongoing,
                'reportsPending' => $reportsPending,
                'activitiesThisMonth' => $activitiesThisMonth,
            ],
        ]);
    }
}
