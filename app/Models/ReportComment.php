<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportComment extends Model
{
    /** @use HasFactory<\Database\Factories\ReportCommentFactory> */
    use HasFactory;

    // The report_comments table only has created_at (append-only event log,
    // entries are never edited) - tell Eloquent not to manage updated_at,
    // since that column doesn't exist.
    const UPDATED_AT = null;

    protected $fillable = ['report_id', 'user_id', 'comment'];

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
