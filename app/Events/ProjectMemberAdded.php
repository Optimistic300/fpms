<?php

namespace App\Events;

use App\Models\Project;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectMemberAdded
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Project $project;
    public User $user;
    public string $role;

    public function __construct(Project $project, User $user, string $role)
    {
        $this->project = $project;
        $this->user = $user;
        $this->role = $role;
    }
}
