<?php

namespace App\Http\Controllers;

use App\Actions\Activity\DeleteActivityAction;
use App\Actions\Activity\ExportActivitiesCsvAction;
use App\Actions\Activity\LogActivityAction;
use App\Actions\Activity\UpdateActivityAction;
use App\Http\Requests\StoreActivityRequest;
use App\Http\Requests\UpdateActivityRequest;
use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ActivityController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Activity::class, 'activity');
    }

    public function index(Request $request, ExportActivitiesCsvAction $csvAction): JsonResponse|Response
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

        if ($request->format === 'csv') {
            return $csvAction->execute($query);
        }

        $limit = min((int) $request->limit, 100);
        $activities = $query->orderBy('created_at', 'desc')->paginate($limit);

        $collection = ActivityResource::collection($activities->items());

        return response()->json(
            ActivityResource::paginated($activities, $collection)
        );
    }

    public function store(StoreActivityRequest $request, LogActivityAction $action): JsonResponse
    {
        $project = \App\Models\Project::findOrFail($request->input('project_id'));
        $this->authorize('manageActivities', $project);

        $activity = $action->execute(
            $request->validated(),
            $request->user()->id
        );

        return response()->json([
            'data' => (new ActivityResource($activity))->resolve($request),
            'message' => 'Activity created. You can now upload files.',
        ], 201);
    }

    public function show(Request $request, Activity $activity): JsonResponse
    {
        $activity->load(['project', 'user', 'documents']);

        return response()->json([
            'data' => (new ActivityResource($activity))->toArray($request),
        ]);
    }

    public function update(UpdateActivityRequest $request, Activity $activity, UpdateActivityAction $action): JsonResponse
    {
        $activity = $action->execute($activity, $request->validated());

        return response()->json([
            'data' => (new ActivityResource($activity))->toArray($request),
        ]);
    }

    public function destroy(Request $request, Activity $activity, DeleteActivityAction $action): JsonResponse
    {
        $docCount = $action->execute($activity);

        return response()->json([
            'message' => "Activity and {$docCount} attached documents deleted.",
        ]);
    }
}
