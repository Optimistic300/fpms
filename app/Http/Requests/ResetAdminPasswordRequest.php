<?php

namespace App\Http\Requests;

use Illuminate\Support\Facades\Gate;

class ResetAdminPasswordRequest extends ApiRequest
{
    public function authorize(): bool
    {
        Gate::authorize('manageUsers');

        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'password' => 'required|min:8|confirmed',
        ];
    }
}
