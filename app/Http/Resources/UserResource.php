<?php

namespace App\Http\Resources;

class UserResource extends CamelCaseResource
{
    protected function resourceToArray($request): array
    {
        return [
            'userId' => $this->id,
            'fullName' => $this->full_name,
            'email' => $this->email,
            'role' => $this->role,
            'division' => $this->when($this->relationLoaded('division'), fn () => $this->division?->name),
        ];
    }
}
