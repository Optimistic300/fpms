<?php

namespace App\Models;

use App\Observers\DocumentObserver;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Document model.
 */
class Document extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'activity_id',
        'uploaded_by',
        'filename',
        'file_path',
        'mime_type',
        'size',
        'type',
        'title',
        'author_name',
        'division',
        'published',
        'allow_external_ai',
        'index_status',
        'indexed_at',
        'index_error',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'published' => 'boolean',
        'allow_external_ai' => 'boolean',
        'indexed_at' => 'datetime',
        'size' => 'integer',
    ];

    /**
     * Get the project that owns the document.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the activity that owns the document.
     */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    /**
     * Get the user that uploaded the document.
     */
    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Get the chunks for the document.
     */
    public function chunks(): HasMany
    {
        return $this->hasMany(DocumentChunk::class);
    }

    /**
     * Get the reports associated with the document.
     */
    public function reports(): BelongsToMany
    {
        return $this->belongsToMany(Report::class);
    }

    /**
     * Get the publications associated with the document.
     */
    public function publications(): BelongsToMany
    {
        return $this->belongsToMany(Publication::class);
    }

    /**
     * Get the access requests for the document.
     */
    public function accessRequests(): HasMany
    {
        return $this->hasMany(AccessRequest::class);
    }

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::observe(DocumentObserver::class);
    }
}