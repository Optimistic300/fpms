<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentText extends Model
{
    /** @use HasFactory<\Database\Factories\DocumentTextFactory> */
    use HasFactory;

    protected $fillable = [
        'document_id',
        'content',
    ];

    protected $table = 'document_texts';

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
