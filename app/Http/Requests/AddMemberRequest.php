<?php

namespace App\Http\Requests;

class AddMemberRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email|exists:users,email',
            'role' => 'required|in:LEAD,COLLABORATOR',
        ];
    }
}
