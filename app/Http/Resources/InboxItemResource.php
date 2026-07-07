<?php

namespace App\Http\Resources;

class InboxItemResource extends BaseResource
{
    protected function resourceToArray($request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'subject' => $this->subject,
            'message' => $this->message,
            'sender' => $this->when($this->relationLoaded('sender') && $this->sender, function () {
                return [
                    'fullName' => $this->sender->full_name,
                    'division' => $this->sender->division?->name,
                ];
            }),
            'senderId' => $this->sender_id,
            'read' => $this->read,
            'documentId' => $this->document_id,
            'reportId' => $this->report_id,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}
