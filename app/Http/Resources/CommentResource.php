<?php

namespace App\Http\Resources;

class CommentResource extends CamelCaseResource
{
    protected function resourceToArray($request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'user' => $this->user?->full_name,
            'userId' => $this->user_id,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
