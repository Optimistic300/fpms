<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreUserRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
            'full_name' => ['required', 'string', 'max:255'],
            'role' => ['required', Rule::in(['RESEARCHER', 'STUDENT', 'SECRETARY', 'DIVISION_HEAD', 'MANAGEMENT', 'ADMIN'])],
            'division_id' => ['nullable', 'exists:divisions,id'],
        ];
    }
}
