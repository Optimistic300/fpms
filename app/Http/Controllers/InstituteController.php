<?php

namespace App\Http\Controllers;

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
        $this->authorize('viewInstitute');

        return response()->json([
            'data' => $this->instituteService->stats(),
        ]);
    }

    public function divisionSummary(Request $request): JsonResponse
    {
        $this->authorize('viewInstitute');

        return response()->json([
            'data' => $this->instituteService->divisionSummaries(),
        ]);
    }

    public function fundingBreakdown(Request $request): JsonResponse
    {
        $this->authorize('viewInstitute');

        return response()->json([
            'data' => $this->instituteService->fundingBreakdown(),
        ]);
    }

    public function compliance(Request $request): JsonResponse
    {
        $this->authorize('viewInstitute');

        return response()->json([
            'data' => $this->instituteService->compliance(),
        ]);
    }

    public function alerts(Request $request): JsonResponse
    {
        $this->authorize('viewInstitute');

        $limit = min((int) $request->integer('limit', 5), 20);

        return response()->json([
            'data' => $this->instituteService->alerts($limit),
        ]);
    }
}
