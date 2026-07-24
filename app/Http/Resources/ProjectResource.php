<?php

namespace App\Http\Resources;

use App\Policies\ProjectPolicy;

class ProjectResource extends BaseResource
{
    protected function resourceToArray($request): array
    {
        $project = $this->resource;
        $user = $request->user();
        $policy = app(ProjectPolicy::class);

        $base = [
            'id' => $project->id,
            'title' => $project->title,
            'description' => $project->description,
            'division' => $project->division?->name,
            'lead' => $project->lead?->full_name,
            'funding_type' => $project->funding_type,
            'funding_source' => $project->funding_source,
            'research_area' => $project->research_area,
            'location' => $project->location,
            'start_date' => $project->start_date?->toDateString(),
            'end_date' => $project->end_date?->toDateString(),
            'status' => $project->status,
            'progress' => $project->progress,
            'is_owner' => $policy->isOwner($user, $project),
            'has_access' => $policy->hasAccess($user, $project),
            'is_locked' => $policy->isLocked($user, $project),
        ];

        if ($project->relationLoaded('members')) {
            $base['members'] = ProjectMemberResource::collection($project->members);
        }

        return $base;
    }
}
