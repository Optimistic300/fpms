<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\Document;
use App\Models\Project;
use Illuminate\Http\JsonResponse;

class PublicController extends Controller
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
