<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AiResponseResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'canAnswer' => $this->canAnswer,
            'answer' => $this->answer,
            'citations' => $this->citations,
            'followUpPrompts' => $this->followUpPrompts,
            'banner' => 'This answer draws only from FORIG\'s own library. It is not a literature review. For published external research use Google Scholar or Web of Science.',
        ];
    }
}
