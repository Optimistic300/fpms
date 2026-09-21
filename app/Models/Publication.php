<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Publication extends Model
{
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

    /**
     * All documents (manuscript + supplementary files) linked to this publication.
     */
    public function documents(): BelongsToMany
    {
        return $this->belongsToMany(Document::class);
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