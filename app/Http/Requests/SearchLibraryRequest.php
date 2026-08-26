<?php

namespace App\Http\Requests;

class SearchLibraryRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'q' => 'required|string|min:2',
        ];
    }
}
