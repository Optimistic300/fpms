<?php

namespace App\Http\Resources;

class ProjectMemberResource extends CamelCaseResource
{
    protected function resourceToArray($request): array
    {
        $member = $this->resource;

        return [
            'user_id' => $member->user_id,
            'full_name' => $member->user?->full_name,
            'role' => $member->role,
            'added_at' => $member->added_at?->toIso8601String(),
        ];
    }
}
