<?php

namespace App\Http\Requests;

class ForwardDocumentRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'document_id' => 'required|exists:documents,id',
            'recipient_ids' => 'required|array|min:1',
            'recipient_ids.*' => 'exists:users,id',
            'message' => 'nullable|string|max:1000',
        ];
    }
}
