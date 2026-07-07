<?php

namespace App\Http\Controllers;

use App\Models\Division;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LibraryController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $totalDocuments = Document::where('published', true)->count();

        $topDivisions = Division::withCount(['projects as doc_count' => function ($q) {
            $q->withCount(['documents as count' => fn($dq) => $dq->where('published', true)])
                ->get()
                ->sum('count');
        }])->get()->map(fn($d) => [
            'division' => $d->name,
            'count' => Document::whereHas('project', fn($q) => $q->where('division_id', $d->id))
                ->where('published', true)
                ->count(),
        ])->sortByDesc('count')->take(3)->values();

        $addedThisQuarter = Document::where('published', true)
            ->where('created_at', '>=', now()->startOfQuarter())
            ->count();

        return response()->json([
            'data' => [
                'totalDocuments' => $totalDocuments,
                'topDivisions' => $topDivisions,
                'addedThisQuarter' => $addedThisQuarter,
            ],
        ]);
    }

    public function documents(Request $request): JsonResponse
    {
        $query = Document::with(['project.division', 'uploader'])
            ->where('published', true);

        if ($request->filled('division')) {
            $query->whereHas('project', fn($q) => $q->where('division_id', $request->division));
        }

        if ($request->filled('documentType')) {
            $query->where('type', $request->documentType);
        }

        if ($request->filled('researchArea')) {
            $query->whereHas('project', fn($q) => $q->where('research_area', 'like', '%' . $request->researchArea . '%'));
        }

        if ($request->filled('q')) {
            $query->where('filename', 'like', '%' . $request->q . '%');
        }

        $limit = min((int) $request->limit, 100);
        $docs = $query->orderBy('created_at', 'desc')->paginate($limit);

        $docs->getCollection()->transform(function ($doc) {
            return [
                'id' => $doc->id,
                'title' => $doc->filename,
                'type' => $doc->type,
                'division' => $doc->project?->division?->name,
                'researchArea' => $doc->project?->research_area,
                'uploadedBy' => $doc->uploader?->full_name,
                'uploadedAt' => $doc->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => $docs->items(),
            'meta' => [
                'currentPage' => $docs->currentPage(),
                'lastPage' => $docs->lastPage(),
                'perPage' => $docs->perPage(),
                'total' => $docs->total(),
            ],
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $request->validate(['q' => 'required|string|min:2']);

        $q = $request->q;

        $documents = Document::where('published', true)
            ->where(function ($query) use ($q) {
                $query->where('filename', 'like', "%{$q}%")
                    ->orWhereHas('project', fn($pq) => $pq->where('title', 'like', "%{$q}%")
                        ->orWhere('research_area', 'like', "%{$q}%"));
            })
            ->with(['project.division', 'uploader'])
            ->limit(20)
            ->get()
            ->map(fn($doc) => [
                'id' => $doc->id,
                'title' => $doc->filename,
                'type' => $doc->type,
                'snippet' => '<mark>' . $q . '</mark>',
                'division' => $doc->project?->division?->name,
                'author' => $doc->uploader?->full_name,
                'date' => $doc->created_at?->toDateString(),
                'documentType' => $doc->type,
            ]);

        return response()->json([
            'data' => $documents,
            'meta' => ['total' => $documents->count()],
        ]);
    }
}
