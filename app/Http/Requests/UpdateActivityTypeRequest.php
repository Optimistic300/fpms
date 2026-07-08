<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class UpdateActivityTypeRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $activityTypeId = $this->route('activity_type');

        return [
            'name' => ['sometimes', 'string', 'max:100'],
            'slug' => ['sometimes', 'string', 'max:100', Rule::unique('activity_types', 'slug')->ignore($activityTypeId)],
        ];
    }
}
