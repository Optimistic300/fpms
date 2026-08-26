<?php

namespace App\Http\Resources;

class AiResponseResource extends CamelCaseResource
{
    protected function resourceToArray($request): array
    {
        return [
            'can_answer' => $this->canAnswer,
            'answer' => $this->answer,
            'citations' => $this->citations,
            'follow_up_prompts' => $this->followUpPrompts,
            'banner' => 'This answer draws only from FORIG\'s own library. It is not a literature review. For published external research use Google Scholar or Web of Science.',
        ];
    }
}
