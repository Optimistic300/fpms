<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class SaveDraftRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'project_id' => 'sometimes|exists:projects,id',
            'type' => 'sometimes|in:QUARTERLY,MID_YEAR,ANNUAL',
            'period_start' => 'sometimes|date',
            'period_end' => 'sometimes|date|after:period_start',
            'narrative_summary' => 'sometimes|string',
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
