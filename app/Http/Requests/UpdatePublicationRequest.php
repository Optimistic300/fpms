<?php

namespace App\Http\Requests;

class UpdatePublicationRequest extends ApiRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:500',
            'authors' => 'sometimes|string',
            'type' => 'sometimes|in:PAPER,THESIS,REPORT,STUDENT',
            'status' => 'sometimes|in:DRAFT,SUBMITTED,IN_REVISION,PUBLISHED',
            'journal_name' => 'nullable|string|max:255',
            'linked_project_id' => 'nullable|exists:projects,id',
            'doi' => 'nullable|string|max:255',
            'manuscript_file' => 'nullable|string',
            'student_name' => 'nullable|string|max:255',
            'supervisor' => 'nullable|string|max:255',
            'degree_programme' => 'nullable|string|max:255',
            'submission_date' => 'nullable|date',
            'revision_due_date' => 'nullable|date',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $data = $this->validationData();

            if (($data['status'] ?? null) === 'PUBLISHED' && empty($data['doi'])) {
                $validator->errors()->add('doi', 'DOI is required when status is PUBLISHED.');
            }

            if (($data['type'] ?? null) === 'STUDENT') {
                if (empty($data['student_name'])) {
                    $validator->errors()->add('student_name', 'Student name is required for STUDENT type publications.');
                }
                if (empty($data['supervisor'])) {
                    $validator->errors()->add('supervisor', 'Supervisor is required for STUDENT type publications.');
                }
                if (empty($data['degree_programme'])) {
                    $validator->errors()->add('degree_programme', 'Degree programme is required for STUDENT type publications.');
                }
            }
        });
    }
}
