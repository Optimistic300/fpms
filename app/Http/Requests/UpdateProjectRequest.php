<?php

namespace App\Http\Requests;

class UpdateProjectRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'funding_type' => 'sometimes|in:DONOR,GOVERNMENT,INTERNAL',
            'funding_source' => 'nullable|string|max:255',
            'research_area' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'start_date' => 'sometimes|date',
            'end_date' => 'nullable|date|after:start_date',
            'status' => 'sometimes|in:PROPOSED,ACTIVE,COMPLETED,ARCHIVED',
            'progress' => 'sometimes|integer|min:0|max:100',
        ];
    }
}
