<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['full_name', 'email', 'password', 'role', 'division_id', 'is_active', 'avatar_initials'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function ledProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'lead_researcher_id');
    }

    public function ownedProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'lead_researcher_id');
    }

    public function projectMembers(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function projects()
    {
        return $this->belongsToMany(Project::class, 'project_members')
            ->withPivot('role', 'added_at')
            ->withTimestamps();
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function submittedReports(): HasMany
    {
        return $this->hasMany(Report::class, 'submitted_by');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class, 'submitted_by');
    }

    public function reviewedReports(): HasMany
    {
        return $this->hasMany(Report::class, 'reviewed_by');
    }

    public function publications(): HasMany
    {
        return $this->hasMany(Publication::class, 'submitted_by_id');
    }

    public function inboxItems(): HasMany
    {
        return $this->hasMany(InboxItem::class);
    }

    public function sentItems(): HasMany
    {
        return $this->hasMany(InboxItem::class, 'sender_id');
    }

    public function accessRequests(): HasMany
    {
        return $this->hasMany(AccessRequest::class, 'requester_id');
    }

    public function reportComments(): HasMany
    {
        return $this->hasMany(ReportComment::class);
    }

    protected static function booted(): void
    {
        static::creating(function (User $user): void {
            if (empty($user->avatar_initials)) {
                $words = explode(' ', $user->full_name);
                $initials = '';
                foreach ($words as $word) {
                    $initials .= strtoupper((string) mb_substr($word, 0, 1));
                }
                $user->avatar_initials = mb_substr($initials, 0, 4);
            }
        });
    }

    public function isResearcher(): bool
    {
        return $this->role === 'RESEARCHER';
    }

    public function isStudent(): bool
    {
        return $this->role === 'STUDENT';
    }

    public function isSecretary(): bool
    {
        return $this->role === 'SECRETARY';
    }

    public function isDivisionHead(): bool
    {
        return $this->role === 'DIVISION_HEAD';
    }

    public function isManagement(): bool
    {
        return $this->role === 'MANAGEMENT';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'ADMIN';
    }

    public function routeNotificationForMail(): string
    {
        return $this->email;
    }
}
