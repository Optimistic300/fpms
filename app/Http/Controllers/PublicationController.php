<?php

namespace App\Http\Controllers;

use App\Models\Publication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicationController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Publication::class, 'publication');
    }

    public function index(Request $request): JsonResponse
    {
        $query = Publication::with(['submitter', 'linkedProject']);

        if ($request->filled('submittedBy')) {
            $query->where('submitted_by_id', $request->submittedBy);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $limit = min((int) $request->limit, 100);
        $publications = $query->orderBy('created_at', 'desc')->paginate($limit);

        $publications->getCollection()->transform(function ($pub) {
            return [
                'id' => $pub->id,
                'title' => $pub->title,
                'authors' => $pub->authors,
                'type' => $pub->type,
                'status' => $pub->status,
                'journalName' => $pub->journal_name,
                'doi' => $pub->doi,
                'linkedProject' => $pub->linkedProject ? [
                    'id' => $pub->linkedProject->id,
                    'title' => $pub->linkedProject->title,
                ] : null,
                'submittedAt' => $pub->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => $publications->items(),
            'meta' => [
                'currentPage' => $publications->currentPage(),
                'lastPage' => $publications->lastPage(),
                'perPage' => $publications->perPage(),
                'total' => $publications->total(),
            ],
        ]);
    }

    public function pipeline(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [
                'draft' => Publication::where('status', 'DRAFT')->count(),
                'submitted' => Publication::where('status', 'SUBMITTED')->count(),
                'inRevision' => Publication::where('status', 'IN_REVISION')->count(),
                'published' => Publication::where('status', 'PUBLISHED')->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:500',
            'authors' => 'required|string',
            'type' => 'required|in:PAPER,THESIS,REPORT,STUDENT',
            'status' => 'required|in:DRAFT,SUBMITTED,IN_REVISION,PUBLISHED',
            'journalName' => 'nullable|string|max:255',
            'linkedProjectId' => 'nullable|exists:projects,id',
            'doi' => 'nullable|string|max:255',
            'manuscriptFile' => 'nullable|string',
        ]);

        if ($validated['status'] === 'PUBLISHED' && empty($validated['doi'])) {
            return response()->json([
                'message' => 'DOI is required for published publications.',
                'errors' => ['doi' => ['DOI is required when status is PUBLISHED.']],
            ], 422);
        }

        $publication = Publication::create([
            'title' => $validated['title'],
            'authors' => $validated['authors'],
            'type' => $validated['type'],
            'status' => $validated['status'],
            'journal_name' => $validated['journalName'],
            'linked_project_id' => $validated['linkedProjectId'],
            'doi' => $validated['doi'],
            'submitted_by_id' => $request->user()->id,
        ]);

        return response()->json(['data' => $publication], 201);
    }

    public function show(Request $request, Publication $publication): JsonResponse
    {
        $publication->load(['submitter', 'linkedProject']);

        return response()->json(['data' => $publication]);
    }

    public function update(Request $request, Publication $publication): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:500',
            'authors' => 'sometimes|string',
            'type' => 'sometimes|in:PAPER,THESIS,REPORT,STUDENT',
            'status' => 'sometimes|in:DRAFT,SUBMITTED,IN_REVISION,PUBLISHED',
            'journalName' => 'nullable|string|max:255',
            'linkedProjectId' => 'nullable|exists:projects,id',
            'doi' => 'nullable|string|max:255',
        ]);

        $update = [];
        if (isset($validated['title'])) $update['title'] = $validated['title'];
        if (isset($validated['authors'])) $update['authors'] = $validated['authors'];
        if (isset($validated['type'])) $update['type'] = $validated['type'];
        if (isset($validated['status'])) $update['status'] = $validated['status'];
        if (isset($validated['journalName'])) $update['journal_name'] = $validated['journalName'];
        if (isset($validated['linkedProjectId'])) $update['linked_project_id'] = $validated['linkedProjectId'];
        if (isset($validated['doi'])) $update['doi'] = $validated['doi'];

        $publication->update($update);

        return response()->json(['data' => $publication->fresh()]);
    }
}
