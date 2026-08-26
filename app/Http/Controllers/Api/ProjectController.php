<?php

namespace App\Http\Controllers\Api;

use App\Actions\Project\AddMemberAction;
use App\Actions\Project\CreateProjectAction;
use App\Actions\Project\ListProjectsAction;
use App\Actions\Project\RequestAccessAction;
use App\Actions\Project\ShowProjectAction;
use App\Actions\Project\UpdateProjectAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\AddMemberRequest;
use App\Http\Requests\StoreAccessRequestRequest;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\ProjectMemberResource;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Policies\ProjectPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request, ListProjectsAction $action): JsonResponse
    {
        $this->authorize('viewAny', Project::class);

        $paginator = $action->execute($request);

        return response()->json(
            ProjectResource::paginated(
                $paginator,
                ProjectResource::collection($paginator->items())
            )
        );
    }

    public function store(StoreProjectRequest $request, CreateProjectAction $action): JsonResponse
    {
        $this->authorize('create', Project::class);

        $project = $action->execute($request->validated(), $request->user()->id);

        return response()->json([
            'data' => (new ProjectResource($project))->resolve($request),
            'message' => 'Project created successfully.',
        ], 201);
    }

    public function show(Request $request, Project $project, ShowProjectAction $action): JsonResponse
    {
        $user = $request->user();
        $policy = app(ProjectPolicy::class);

        if ($policy->isLocked($user, $project)) {
            return response()->json([
                'message' => 'You do not have access to this project.',
                'data' => [
                    'isLocked' => true,
                    'title' => $project->title,
                    'lead' => $project->lead?->full_name,
                    'division' => $project->division?->name,
                    'status' => $project->status,
                    'researchArea' => $project->research_area,
                    'startDate' => $project->start_date?->toDateString(),
                    'endDate' => $project->end_date?->toDateString(),
                ],
            ], 403);
        }

        $this->authorize('view', $project);

        $project = $action->execute($project);

        return response()->json([
            'data' => new ProjectResource($project),
        ]);
    }

    public function update(UpdateProjectRequest $request, Project $project, UpdateProjectAction $action): JsonResponse
    {
        $this->authorize('update', $project);

        $project = $action->execute($project, $request->validated());

        return response()->json([
            'data' => (new ProjectResource($project))->resolve($request),
            'message' => 'Project updated successfully.',
        ]);
    }

    public function members(Request $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $project->load('members.user');

        return response()->json([
            'data' => ProjectMemberResource::collection($project->members),
        ]);
    }

    public function addMember(AddMemberRequest $request, Project $project, AddMemberAction $action): JsonResponse
    {
        $this->authorize('manageMembers', $project);

        $result = $action->execute($project, $request->validated()['email'], $request->validated()['role']);

        return response()->json([
            'data' => $result,
            'message' => 'Member added successfully.',
        ], 201);
    }

    public function requestAccess(StoreAccessRequestRequest $request, Project $project, RequestAccessAction $action): JsonResponse
    {
        $action->execute($project, $request->user()->id);

        return response()->json([
            'message' => 'Access request sent.',
        ], 201);
    }
}
