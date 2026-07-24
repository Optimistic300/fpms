<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class UpdateUserRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user');

        return [
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'full_name' => ['sometimes', 'string', 'max:255'],
            'role' => ['sometimes', Rule::in(['RESEARCHER', 'STUDENT', 'SECRETARY', 'DIVISION_HEAD', 'MANAGEMENT', 'ADMIN'])],
            'division_id' => ['nullable', 'exists:divisions,id'],
            'is_active' => ['sometimes', 'boolean'],
            'password' => ['sometimes', 'string', 'min:8'],
        ];
    }
}
