<?php

namespace App\Http\Requests;

class MarkReadAllRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ids' => 'nullable|array',
            'ids.*' => 'integer|exists:inbox_items,id',
        ];
    }
}
