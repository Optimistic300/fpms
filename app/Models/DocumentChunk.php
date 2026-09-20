<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;

class DocumentChunk extends Model
{
    protected $guarded = [];

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function shouldBeSearchable(): bool
    {
        return (bool) $this->document?->published;
    }

    // Avoid N+1 when bulk-indexing
    public function makeSearchableUsing($models): Collection
    {
        return $models->load('document');
    }

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'document_id' => $this->document_id,
            'published' => (bool) $this->document->published, // filterable
            'title' => $this->document->title,
            'division' => $this->document->division,
            'file_type' => $this->document->file_type,
            'page_number' => $this->page_number,
            'content' => $this->content,
        ];
    }
}