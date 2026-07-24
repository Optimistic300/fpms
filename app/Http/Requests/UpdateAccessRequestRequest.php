<?php

namespace App\Http\Requests;

class UpdateAccessRequestRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => 'required|in:GRANTED,DENIED',
        ];
    }
}
