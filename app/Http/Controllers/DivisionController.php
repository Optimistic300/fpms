<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Policies\DivisionPolicy;
use App\Repositories\DivisionRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DivisionController extends Controller
{
    public function __construct(
        private readonly DivisionRepository $divisionRepository
    ) {}

    public function stats(Request $request, Division $division): JsonResponse
    {
        app(DivisionPolicy::class)->view($request->user()) || abort(403);

        return response()->json([
            'data' => $this->divisionRepository->stats($division->id),
        ]);
    }

    public function researcherActivity(Request $request, Division $division): JsonResponse
    {
        app(DivisionPolicy::class)->view($request->user()) || abort(403);

        return response()->json([
            'data' => $this->divisionRepository->researcherActivity($division->id),
        ]);
    }

    public function activityFeed(Request $request, Division $division): JsonResponse
    {
        app(DivisionPolicy::class)->view($request->user()) || abort(403);

        $limit = min((int) $request->integer('limit', 10), 50);

        return response()->json([
            'data' => $this->divisionRepository->activityFeed($division->id, $limit),
        ]);
    }
}
