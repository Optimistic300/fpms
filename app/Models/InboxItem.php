<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InboxItem extends Model
{
    /** @use HasFactory<\Database\Factories\InboxItemFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'sender_id',
        'type',
        'subject',
        'message',
        'document_id',
        'report_id',
        'read',
    ];

    protected function casts(): array
    {
        return [
            'read' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }
}
