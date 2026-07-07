<?php

namespace App\Http\Requests;

class StoreActivityRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'project_id' => 'required|exists:projects,id',
            'date' => 'required|date',
            'type' => 'required|string|max:100',
            'description' => 'required|string',
            'notes' => 'nullable|string',
        ];
    }
}
