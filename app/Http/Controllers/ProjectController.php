<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\AccessRequest;
use App\Policies\ProjectPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProjectController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Project::class, 'project');
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Project::with(['division', 'lead', 'members']);

        if ($request->owner === 'me') {
            $query->where('lead_researcher_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('division')) {
            $query->where('division_id', $request->division);
        }

        if ($request->filled('fundingType')) {
            $query->where('funding_type', $request->fundingType);
        }

        if ($request->filled('researchArea')) {
            $query->where('research_area', 'like', '%' . $request->researchArea . '%');
        }

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($qry) use ($q) {
                $qry->where('title', 'like', "%{$q}%")
                    ->orWhere('research_area', 'like', "%{$q}%")
                    ->orWhereHas('lead', function ($qry2) use ($q) {
                        $qry2->where('full_name', 'like', "%{$q}%");
                    });
            });
        }

        $limit = min((int) $request->limit, 100);
        $projects = $query->orderBy('created_at', 'desc')->paginate($limit);

        $projects->getCollection()->transform(function ($project) use ($user) {
            $policy = app(ProjectPolicy::class);

            return [
                'id' => $project->id,
                'title' => $project->title,
                'division' => $project->division?->name,
                'lead' => $project->lead?->full_name,
                'fundingType' => $project->funding_type,
                'status' => $project->status,
                'progress' => $project->progress,
                'isOwner' => $policy->isOwner($user, $project),
                'hasAccess' => $policy->hasAccess($user, $project),
                'isLocked' => $policy->isLocked($user, $project),
            ];
        });

        return response()->json([
            'data' => $projects->items(),
            'meta' => [
                'currentPage' => $projects->currentPage(),
                'lastPage' => $projects->lastPage(),
                'perPage' => $projects->perPage(),
                'total' => $projects->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'divisionId' => 'required|exists:divisions,id',
            'fundingType' => 'required|in:DONOR,GOVERNMENT,INTERNAL',
            'fundingSource' => 'nullable|string|max:255',
            'researchArea' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'startDate' => 'required|date',
            'endDate' => 'nullable|date|after:startDate',
        ]);

        $project = Project::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'division_id' => $validated['divisionId'],
            'lead_researcher_id' => $request->user()->id,
            'funding_type' => $validated['fundingType'],
            'funding_source' => $validated['fundingSource'] ?? null,
            'research_area' => $validated['researchArea'] ?? null,
            'location' => $validated['location'] ?? null,
            'start_date' => $validated['startDate'],
            'end_date' => $validated['endDate'] ?? null,
            'status' => 'PROPOSED',
            'progress' => 0,
        ]);

        ProjectMember::create([
            'project_id' => $project->id,
            'user_id' => $request->user()->id,
            'role' => 'LEAD',
        ]);

        return response()->json([
            'data' => ['id' => $project->id, 'title' => $project->title, 'status' => $project->status],
            'message' => 'Project created successfully.',
        ], 201);
    }

    public function show(Request $request, Project $project): JsonResponse
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

        $project->load(['division', 'lead', 'members.user']);

        return response()->json([
            'data' => [
                'id' => $project->id,
                'title' => $project->title,
                'description' => $project->description,
                'division' => $project->division?->name,
                'lead' => $project->lead?->full_name,
                'fundingType' => $project->funding_type,
                'fundingSource' => $project->funding_source,
                'researchArea' => $project->research_area,
                'location' => $project->location,
                'startDate' => $project->start_date?->toDateString(),
                'endDate' => $project->end_date?->toDateString(),
                'status' => $project->status,
                'progress' => $project->progress,
                'activityCount' => $project->activities()->count(),
                'documentCount' => $project->documents()->count(),
                'isOwner' => $policy->isOwner($user, $project),
                'hasAccess' => $policy->hasAccess($user, $project),
                'isLocked' => false,
                'members' => $project->members->map(fn($m) => [
                    'id' => $m->user_id,
                    'fullName' => $m->user?->full_name,
                    'role' => $m->role,
                ]),
            ],
        ]);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'fundingType' => 'sometimes|in:DONOR,GOVERNMENT,INTERNAL',
            'fundingSource' => 'nullable|string|max:255',
            'researchArea' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'startDate' => 'sometimes|date',
            'endDate' => 'nullable|date|after:startDate',
            'status' => 'sometimes|in:PROPOSED,ACTIVE,COMPLETED,ARCHIVED',
            'progress' => 'sometimes|integer|min:0|max:100',
        ]);

        $update = [];
        if (isset($validated['title'])) $update['title'] = $validated['title'];
        if (isset($validated['description'])) $update['description'] = $validated['description'];
        if (isset($validated['fundingType'])) $update['funding_type'] = $validated['fundingType'];
        if (isset($validated['fundingSource'])) $update['funding_source'] = $validated['fundingSource'];
        if (isset($validated['researchArea'])) $update['research_area'] = $validated['researchArea'];
        if (isset($validated['location'])) $update['location'] = $validated['location'];
        if (isset($validated['startDate'])) $update['start_date'] = $validated['startDate'];
        if (isset($validated['endDate'])) $update['end_date'] = $validated['endDate'];
        if (isset($validated['status'])) $update['status'] = $validated['status'];
        if (isset($validated['progress'])) $update['progress'] = $validated['progress'];

        $project->update($update);

        return response()->json([
            'data' => ['id' => $project->id, 'title' => $project->title, 'status' => $project->status],
            'message' => 'Project updated successfully.',
        ]);
    }

    public function members(Request $request, Project $project): JsonResponse
    {
        $this->authorize('manageMembers', $project);

        $project->load('members.user');

        return response()->json([
            'data' => $project->members->map(fn($m) => [
                'userId' => $m->user_id,
                'fullName' => $m->user?->full_name,
                'role' => $m->role,
                'addedAt' => $m->added_at?->toIso8601String(),
            ]),
        ]);
    }

    public function addMember(Request $request, Project $project): JsonResponse
    {
        $this->authorize('manageMembers', $project);

        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
            'role' => 'required|in:LEAD,COLLABORATOR',
        ]);

        $user = \App\Models\User::where('email', $validated['email'])->firstOrFail();

        $existing = ProjectMember::where('project_id', $project->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'User is already a member of this project.'], 422);
        }

        ProjectMember::create([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'role' => $validated['role'],
        ]);

        return response()->json([
            'data' => ['userId' => $user->id, 'fullName' => $user->full_name, 'role' => $validated['role']],
            'message' => 'Member added successfully.',
        ], 201);
    }

    public function requestAccess(Request $request, Project $project): JsonResponse
    {
        $existing = AccessRequest::where('project_id', $project->id)
            ->where('requester_id', $request->user()->id)
            ->where('status', 'PENDING')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You already have a pending access request.'], 422);
        }

        AccessRequest::create([
            'project_id' => $project->id,
            'requester_id' => $request->user()->id,
            'status' => 'PENDING',
        ]);

        return response()->json([
            'message' => 'Access request sent.',
        ], 201);
    }
}
