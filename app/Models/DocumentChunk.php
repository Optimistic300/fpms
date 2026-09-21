<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Document Chunk model.
 * 
 * Represents a chunk of text from a document that has been indexed for search.
 */
class DocumentChunk extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'document_id',
        'chunk_index',
        'page_number',
        'locator',
        'content',
        'embedding',
        'embedding_model',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'embedding' => 'array', // PostgreSQL vector will be cast to PHP array
        'embedding_model' => 'string',
    ];

    /**
     * Get the document that owns the chunk.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    /**
     * Determine if the chunk is searchable.
     * 
     * In our implementation, we don't use Laravel Scout's searchable() method
     * directly because we're using raw PostgreSQL vector and full-text search.
     * However, we keep this method for compatibility and to signal that the
     * chunk should be included in search indexes.
     * 
     * @return bool
     */
    public function searchable(): bool
    {
        // A chunk is searchable if it belongs to a published document that allows external AI
        // and has been embedded with the current model.
        return $this->document
            && $this->document->published
            && $this->document->allow_external_ai
            && !is_null($this->embedding)
            && $this->embedding_model === app()->make(\App\Contracts\EmbedderInterface::class)->modelId();
    }
}