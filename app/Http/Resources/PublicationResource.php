<?php

namespace App\Http\Resources;

class PublicationResource extends BaseResource
{
    protected function resourceToArray($request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'authors' => $this->authors,
            'type' => $this->type,
            'status' => $this->status,
            'journal_name' => $this->journal_name,
            'linked_project_id' => $this->linked_project_id,
            'doi' => $this->doi,
            'manuscript_file_path' => $this->manuscript_file_path,
            'submitted_by_id' => $this->submitted_by_id,
            'student_name' => $this->student_name,
            'supervisor' => $this->supervisor,
            'degree_programme' => $this->degree_programme,
            'submission_date' => $this->submission_date?->toDateString(),
            'revision_due_date' => $this->revision_due_date?->toDateString(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'linked_project' => $this->when($this->relationLoaded('linkedProject') && $this->linkedProject, fn () => [
                'id' => $this->linkedProject->id,
                'title' => $this->linkedProject->title,
            ]),
        ];
    }
}
