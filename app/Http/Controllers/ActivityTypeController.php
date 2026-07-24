<?php

namespace App\Http\Controllers;

use App\Models\ActivityType;
use Illuminate\Http\JsonResponse;

class ActivityTypeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => ActivityType::orderBy('name')->get()->map(fn($at) => [
                'id' => $at->id,
                'name' => $at->name,
                'slug' => $at->slug,
            ]),
        ]);
    }
}
