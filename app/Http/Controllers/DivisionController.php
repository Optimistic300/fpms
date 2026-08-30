<?php

namespace App\Http\Controllers;

use App\Http\Resources\DivisionResource;
use App\Models\Division;
use App\Repositories\DivisionRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DivisionController extends Controller
{
    public function __construct(
        private readonly DivisionRepository $divisionRepository
    ) {}

    /**
     * Plain division list for any authenticated user (e.g. populating a
     * "Division" dropdown) - unlike /divisions/summary, intentionally not
     * gated by a role policy.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => DivisionResource::collection(Division::orderBy('name')->get()),
        ]);
    }

    public function stats(Request $request, Division $division): JsonResponse
    {
        $this->authorize('view', $division);

        return response()->json([
            'data' => $this->divisionRepository->stats($division->id),
        ]);
    }

    public function researcherActivity(Request $request, Division $division): JsonResponse
    {
        $this->authorize('view', $division);

        return response()->json([
            'data' => $this->divisionRepository->researcherActivity($division->id),
        ]);
    }

    public function activityFeed(Request $request, Division $division): JsonResponse
    {
        $this->authorize('view', $division);

        $limit = min((int) $request->integer('limit', 10), 50);

        return response()->json([
            'data' => $this->divisionRepository->activityFeed($division->id, $limit),
        ]);
    }
}
