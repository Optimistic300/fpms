<?php

namespace App\Http\Resources;

class ActivityResource extends BaseResource
{
    protected function resourceToArray($request): array
    {
        $activity = $this->resource;

        return [
            'id' => $activity->id,
            'project_id' => $activity->project_id,
            'project_title' => $activity->project?->title,
            'date' => $activity->date?->toDateString(),
            'type' => $activity->type,
            'description' => $activity->description,
            'notes' => $activity->notes,
            'document_count' => $activity->documents->count(),
            'documents' => $activity->documents->map(fn($d) => [
                'id' => $d->id,
                'filename' => $d->filename,
                'type' => $d->type,
                'published' => $d->published,
            ]),
        ];
    }
}
