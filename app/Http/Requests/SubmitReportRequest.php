<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class SubmitReportRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'project_id' => 'required|exists:projects,id',
            'type' => 'required|in:QUARTERLY,MID_YEAR,ANNUAL',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after:period_start',
            'narrative_summary' => 'required|string',
            'file' => 'nullable|string',
            'resubmit' => 'nullable|exists:reports,id',
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
