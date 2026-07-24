<?php

namespace App\Http\Resources;

class AccessRequestResource extends CamelCaseResource
{
    protected function resourceToArray($request): array
    {
        $ar = $this->resource;

        return [
            'id' => $ar->id,
            'project_id' => $ar->project_id,
            'requester_id' => $ar->requester_id,
            'status' => $ar->status,
            'created_at' => $ar->created_at?->toIso8601String(),
            'updated_at' => $ar->updated_at?->toIso8601String(),
        ];
    }
}
