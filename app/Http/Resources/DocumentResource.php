<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class DocumentResource extends CamelCaseResource
{
    protected function resourceToArray($request): array
    {
        return [
            'id' => $this->id,
            'projectId' => $this->project_id,
            'activityId' => $this->activity_id,
            'uploadedBy' => $this->uploader?->full_name,
            'filename' => $this->filename,
            'filePath' => $this->file_path,
            'mimeType' => $this->mime_type,
            'size' => $this->size,
            'type' => $this->type,
            'published' => $this->published,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
