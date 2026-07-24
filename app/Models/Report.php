<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Report extends Model
{
    /** @use HasFactory<\Database\Factories\ReportFactory> */
    use HasFactory;

    protected $fillable = [
        'project_id',
        'submitted_by',
        'type',
        'period_start',
        'period_end',
        'narrative_summary',
        'file_path',
        'status',
        'parent_report_id',
        'version',
        'comment',
        'reviewed_by',
        'submitted_at',
        'is_overdue',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'version' => 'integer',
            'submitted_at' => 'datetime',
            'is_overdue' => 'boolean',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(ReportComment::class);
    }

    public function parentReport(): BelongsTo
    {
        return $this->belongsTo(Report::class, 'parent_report_id');
    }

    public function resubmissions(): HasMany
    {
        return $this->hasMany(Report::class, 'parent_report_id');
    }
}
