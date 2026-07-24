<?php

namespace App\Http\Resources;

class ReportCommentResource extends CamelCaseResource
{
    protected function resourceToArray($request): array
    {
        return [
            'id' => $this->id,
            'report_id' => $this->report_id,
            'user_id' => $this->user_id,
            'user_name' => $this->user?->full_name,
            'comment' => $this->comment,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
