<?php

namespace App\Policies;

use App\Models\Report;
use App\Models\User;

class ReportPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Report $report): bool
    {
        if ($user->isSecretary()) {
            return true;
        }

        if ($user->id === $report->submitted_by) {
            return true;
        }

        if (app(ProjectPolicy::class)->isOwner($user, $report->project)) {
            return true;
        }

        if ($user->isDivisionHead() && $user->division_id === $report->project->division_id) {
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

    public function submit(User $user, Report $report): bool
    {
        return $user->id === $report->submitted_by && $report->status === 'DRAFT';
    }

    public function review(User $user): bool
    {
        return $user->isSecretary();
    }

    public function update(User $user, Report $report): bool
    {
        return $user->isSecretary();
    }
}
