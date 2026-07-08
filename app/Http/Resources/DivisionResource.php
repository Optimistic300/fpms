<?php

namespace App\Http\Resources;

class DivisionResource extends CamelCaseResource
{
    protected function resourceToArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'headName' => $this->when($this->relationLoaded('head'), fn () => $this->head?->full_name),
            'headId' => $this->when($this->relationLoaded('head'), fn () => $this->head?->id),
        ];
    }
}
