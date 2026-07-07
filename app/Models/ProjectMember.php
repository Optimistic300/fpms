<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectMember extends Model
{
    /** @use HasFactory<\Database\Factories\ProjectMemberFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = ['project_id', 'user_id', 'role', 'added_at'];

    protected function casts(): array
    {
        return [
            'added_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
