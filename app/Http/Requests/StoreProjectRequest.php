<?php

namespace App\Http\Requests;

class StoreProjectRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'division_id' => 'required|exists:divisions,id',
            'funding_type' => 'required|in:DONOR,GOVERNMENT,INTERNAL',
            'funding_source' => 'nullable|string|max:255',
            'research_area' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
        ];
    }
}
