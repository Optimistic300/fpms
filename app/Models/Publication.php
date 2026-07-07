<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Publication extends Model
{
    /** @use HasFactory<\Database\Factories\PublicationFactory> */
    use HasFactory;

    protected $fillable = [
        'title',
        'authors',
        'type',
        'status',
        'journal_name',
        'linked_project_id',
        'doi',
        'manuscript_file_path',
        'submitted_by_id',
        'student_name',
        'supervisor',
        'degree_programme',
        'submission_date',
        'revision_due_date',
    ];

    protected function casts(): array
    {
        return [
            'submission_date' => 'date',
            'revision_due_date' => 'date',
        ];
    }

    public function linkedProject(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'linked_project_id');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_id');
    }
}
