<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreActivityTypeRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['required', 'string', 'max:100', Rule::unique('activity_types', 'slug')],
        ];
    }
}
