<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateReportStatusRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'status' => 'required|in:APPROVED,RETURNED,ESCALATED',
            'comment' => 'required_if:status,RETURNED,ESCALATED|string|nullable',
        ];
    }

    public function messages(): array
    {
        return [
            'comment.required_if' => 'A comment is required when returning or escalating a report.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'message' => 'The given data was invalid.',
            'errors' => $validator->errors(),
        ], 422));
    }
}
