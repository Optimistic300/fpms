<?php

namespace App\Http\Requests;

class StoreAccessRequestRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [];
    }
}
