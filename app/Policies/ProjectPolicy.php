<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Project $project): bool
    {
        if ($this->isOwner($user, $project)) {
            return true;
        }

        if ($this->hasAccess($user, $project)) {
            return true;
        }

        if ($user->isDivisionHead() && $user->division_id === $project->division_id) {
            return true;
        }

        if ($user->isManagement()) {
            return true;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['RESEARCHER', 'STUDENT', 'DIVISION_HEAD']);
    }

    public function update(User $user, Project $project): bool
    {
        if ($this->isOwner($user, $project)) {
            return true;
        }

        if ($user->isDivisionHead() && $user->division_id === $project->division_id) {
            return true;
        }

        return false;
    }

    public function delete(User $user, Project $project): bool
    {
        return $this->isOwner($user, $project);
    }

    public function manageMembers(User $user, Project $project): bool
    {
        if ($this->isOwner($user, $project)) {
            return true;
        }

        if ($user->isDivisionHead() && $user->division_id === $project->division_id) {
            return true;
        }

        return false;
    }

    public function manageAccessRequests(User $user, Project $project): bool
    {
        return $this->isOwner($user, $project);
    }

    public function manageActivities(User $user, Project $project): bool
    {
        if ($this->isOwner($user, $project)) {
            return true;
        }

        if ($this->hasAccess($user, $project)) {
            return true;
        }

        return false;
    }

    public function isOwner(User $user, Project $project): bool
    {
        if ($project->lead_researcher_id === $user->id) {
            return true;
        }

        return $project->members()
            ->where('user_id', $user->id)
            ->where('role', 'LEAD')
            ->exists();
    }

    public function hasAccess(User $user, Project $project): bool
    {
        if ($this->isOwner($user, $project)) {
            return true;
        }

        if ($user->isDivisionHead() && $user->division_id === $project->division_id) {
            return true;
        }

        if ($user->isManagement()) {
            return true;
        }

        return $project->members()
            ->where('user_id', $user->id)
            ->exists();
    }

    public function isLocked(User $user, Project $project): bool
    {
        return !$this->hasAccess($user, $project);
    }
}
