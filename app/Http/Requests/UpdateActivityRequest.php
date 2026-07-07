<?php

namespace App\Http\Requests;

class UpdateActivityRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date' => 'sometimes|date',
            'type' => 'sometimes|string|max:100',
            'description' => 'sometimes|string',
            'notes' => 'nullable|string',
        ];
    }
}
