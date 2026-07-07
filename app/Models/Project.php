<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    /** @use HasFactory<\Database\Factories\ProjectFactory> */
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'division_id',
        'lead_researcher_id',
        'funding_type',
        'funding_source',
        'research_area',
        'location',
        'start_date',
        'end_date',
        'status',
        'progress',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'progress' => 'integer',
        ];
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lead_researcher_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function accessRequests(): HasMany
    {
        return $this->hasMany(AccessRequest::class);
    }
}
