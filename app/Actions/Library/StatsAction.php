<?php

namespace App\Actions\Library;

use App\Models\Division;
use App\Models\Document;
use Illuminate\Support\Facades\DB;

class StatsAction
{
    public function execute(): array
    {
        $totalDocuments = Document::where('published', true)->count();

        $topDivisions = Division::select('divisions.name')
            ->selectRaw('COUNT(documents.id) as count')
            ->join('projects', 'divisions.id', '=', 'projects.division_id')
            ->join('documents', 'projects.id', '=', 'documents.project_id')
            ->where('documents.published', true)
            ->groupBy('divisions.id', 'divisions.name')
            ->orderByDesc('count')
            ->take(3)
            ->get()
            ->map(fn($d) => ['division' => $d->name, 'count' => $d->count])
            ->values();

        $addedThisQuarter = Document::where('published', true)
            ->where('created_at', '>=', now()->startOfQuarter())
            ->count();

        return [
            'totalDocuments' => $totalDocuments,
            'topDivisions' => $topDivisions,
            'addedThisQuarter' => $addedThisQuarter,
        ];
    }
}
