<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class UpdateDivisionRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $divisionId = $this->route('division');

        return [
            'name' => ['sometimes', 'string', 'max:255', Rule::unique('divisions', 'name')->ignore($divisionId)],
            'head_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
