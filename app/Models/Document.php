<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Document extends Model
{
    /** @use HasFactory<\Database\Factories\DocumentFactory> */
    use HasFactory;

    protected $fillable = [
        'project_id',
        'activity_id',
        'uploaded_by',
        'filename',
        'file_path',
        'mime_type',
        'size',
        'type',
        'published',
        'index_status',
        'indexed_at',
        'index_error',
    ];

    protected $casts = [
        'size' => 'integer',
        'published' => 'boolean',
        'indexed_at' => 'datetime',
    ];

    // Valid index status values
    const INDEX_STATUS_NOT_INDEXED = 'not_indexed';
    const INDEX_STATUS_PENDING = 'pending';
    const INDEX_STATUS_INDEXED = 'indexed';
    const INDEX_STATUS_NEEDS_OCR = 'needs_ocr';
    const INDEX_STATUS_FAILED = 'failed';

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function texts(): HasMany
    {
        return $this->hasMany(DocumentText::class);
    }

    public function chunks(): HasMany
    {
        return $this->hasMany(DocumentChunk::class);
    }

    // Scope for published documents
    public function scopePublished($query)
    {
        return $query->where('published', true);
    }

    // Validate index status
    public static function validIndexStatuses(): array
    {
        return [
            self::INDEX_STATUS_NOT_INDEXED,
            self::INDEX_STATUS_PENDING,
            self::INDEX_STATUS_INDEXED,
            self::INDEX_STATUS_NEEDS_OCR,
            self::INDEX_STATUS_FAILED,
        ];
    }

    public function isValidIndexStatus($status): bool
    {
        return in_array($status, self::validIndexStatuses());
    }
}
