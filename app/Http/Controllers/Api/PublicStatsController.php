<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\Document;
use App\Models\Project;
use Illuminate\Http\JsonResponse;

class PublicStatsController extends Controller
{
    public function stats(): JsonResponse
    {
        return response()->json([
            'data' => [
                'activeProjects' => Project::where('status', 'ACTIVE')->count(),
                'libraryDocuments' => Document::where('published', true)->count(),
                'divisionsConnected' => Division::count(),
            ],
        ]);
    }
}
