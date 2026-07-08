<?php

namespace App\Http\Requests;

class AiQueryRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'query' => 'required|string|max:1000',
            'conversation_history' => 'sometimes|array',
            'conversation_history.*.role' => 'required_with:conversation_history|string|in:user,assistant',
            'conversation_history.*.content' => 'required_with:conversation_history|string',
        ];
    }
}
