<?php

namespace App\Http\Resources;

class ActivityTypeResource extends CamelCaseResource
{
    protected function resourceToArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
        ];
    }
}
