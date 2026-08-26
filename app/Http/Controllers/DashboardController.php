<?php

namespace App\Http\Controllers;

use App\Http\Resources\DashboardStatsResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = [
            'total_projects' => $user->ownedProjects()->count(),
            'ongoing' => $user->ownedProjects()->where('status', 'ACTIVE')->count(),
            'reports_pending' => $user->reports()->where('status', 'PENDING')->count(),
            'activities_this_month' => $user->activities()
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
        ];

        return response()->json(['data' => new DashboardStatsResource($data)]);
    }
}
