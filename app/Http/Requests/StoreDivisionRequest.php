<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreDivisionRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('divisions', 'name')],
            'head_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
