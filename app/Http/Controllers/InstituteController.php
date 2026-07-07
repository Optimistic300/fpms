<?php

namespace App\Http\Controllers;

use App\Policies\InstitutePolicy;
use App\Services\InstituteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstituteController extends Controller
{
    public function __construct(
        private readonly InstituteService $instituteService
    ) {}

    public function stats(Request $request): JsonResponse
    {
        abort_unless(app(InstitutePolicy::class)->view($request->user()), 403);

        return response()->json([
            'data' => $this->instituteService->stats(),
        ]);
    }

    public function divisionSummary(Request $request): JsonResponse
    {
        abort_unless(app(InstitutePolicy::class)->view($request->user()), 403);

        return response()->json([
            'data' => $this->instituteService->divisionSummaries(),
        ]);
    }

    public function fundingBreakdown(Request $request): JsonResponse
    {
        abort_unless(app(InstitutePolicy::class)->view($request->user()), 403);

        return response()->json([
            'data' => $this->instituteService->fundingBreakdown(),
        ]);
    }

    public function compliance(Request $request): JsonResponse
    {
        abort_unless(app(InstitutePolicy::class)->view($request->user()), 403);

        return response()->json([
            'data' => $this->instituteService->compliance(),
        ]);
    }

    public function alerts(Request $request): JsonResponse
    {
        abort_unless(app(InstitutePolicy::class)->view($request->user()), 403);

        $limit = min((int) $request->integer('limit', 5), 20);

        return response()->json([
            'data' => $this->instituteService->alerts($limit),
        ]);
    }
}
