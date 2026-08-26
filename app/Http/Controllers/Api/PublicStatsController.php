<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PublicStatsResource;
use App\Models\Division;
use App\Models\Document;
use App\Models\Project;
use Illuminate\Http\JsonResponse;

class PublicStatsController extends Controller
{
    public function stats(): JsonResponse
    {
        $data = [
            'active_projects' => Project::where('status', 'ACTIVE')->count(),
            'library_documents' => Document::where('published', true)->count(),
            'divisions_connected' => Division::count(),
        ];

        return response()->json(['data' => new PublicStatsResource($data)]);
    }
}
