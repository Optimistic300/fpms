<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\ActivityType;
use App\Models\Document;
use App\Policies\ProjectPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ActivityController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Activity::class, 'activity');
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Activity::with(['project', 'user', 'documents']);

        if ($request->filled('projectId')) {
            $query->where('project_id', $request->projectId);
        }

        if ($request->owner === 'me') {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('period') && $request->period === 'this-month') {
            $query->whereMonth('date', now()->month)
                ->whereYear('date', now()->year);
        }

        if ($request->filled('researcher')) {
            $query->where('user_id', $request->researcher);
        }

        // CSV export
        if ($request->format === 'csv') {
            $activities = $query->get();
            $csv = "ID,Project,Date,Type,Description,User\n";
            foreach ($activities as $a) {
                $csv .= "{$a->id},{$a->project?->title},{$a->date},{$a->type},{$a->description},{$a->user?->full_name}\n";
            }

            return response($csv, 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="activities.csv"',
            ]);
        }

        $limit = min((int) $request->limit, 100);
        $activities = $query->orderBy('created_at', 'desc')->paginate($limit);

        $activities->getCollection()->transform(function ($activity) {
            return [
                'id' => $activity->id,
                'projectId' => $activity->project_id,
                'projectTitle' => $activity->project?->title,
                'date' => $activity->date?->toDateString(),
                'type' => $activity->type,
                'description' => $activity->description,
                'notes' => $activity->notes,
                'documentCount' => $activity->documents->count(),
                'documents' => $activity->documents->map(fn($d) => [
                    'id' => $d->id,
                    'filename' => $d->filename,
                    'type' => $d->type,
                    'published' => $d->published,
                ]),
            ];
        });

        return response()->json([
            'data' => $activities->items(),
            'meta' => [
                'currentPage' => $activities->currentPage(),
                'lastPage' => $activities->lastPage(),
                'perPage' => $activities->perPage(),
                'total' => $activities->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'projectId' => 'required|exists:projects,id',
            'date' => 'required|date',
            'type' => 'required|string|max:100',
            'description' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $project = \App\Models\Project::findOrFail($validated['projectId']);
        $this->authorize('manageActivities', $project);

        $activity = Activity::create([
            'project_id' => $validated['projectId'],
            'user_id' => $request->user()->id,
            'date' => $validated['date'],
            'type' => $validated['type'],
            'description' => $validated['description'],
            'notes' => $validated['notes'],
        ]);

        return response()->json([
            'data' => ['id' => $activity->id, 'activityId' => $activity->id],
            'message' => 'Activity created. You can now upload files.',
        ], 201);
    }

    public function show(Request $request, Activity $activity): JsonResponse
    {
        $activity->load(['project', 'user', 'documents']);

        return response()->json([
            'data' => [
                'id' => $activity->id,
                'projectId' => $activity->project_id,
                'projectTitle' => $activity->project?->title,
                'date' => $activity->date?->toDateString(),
                'type' => $activity->type,
                'description' => $activity->description,
                'notes' => $activity->notes,
                'documents' => $activity->documents->map(fn($d) => [
                    'id' => $d->id,
                    'filename' => $d->filename,
                    'type' => $d->type,
                    'published' => $d->published,
                ]),
            ],
        ]);
    }

    public function update(Request $request, Activity $activity): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'sometimes|date',
            'type' => 'sometimes|string|max:100',
            'description' => 'sometimes|string',
            'notes' => 'nullable|string',
        ]);

        $update = [];
        if (isset($validated['date'])) $update['date'] = $validated['date'];
        if (isset($validated['type'])) $update['type'] = $validated['type'];
        if (isset($validated['description'])) $update['description'] = $validated['description'];
        if (array_key_exists('notes', $validated)) $update['notes'] = $validated['notes'];

        $activity->update($update);

        return response()->json(['data' => $activity->fresh()->load('documents')]);
    }

    public function destroy(Request $request, Activity $activity): JsonResponse
    {
        $docCount = $activity->documents()->count();

        foreach ($activity->documents as $doc) {
            Storage::disk('local')->delete($doc->file_path);
            $doc->delete();
        }

        $activity->delete();

        return response()->json([
            'message' => "Activity and {$docCount} attached documents deleted.",
        ]);
    }
}
