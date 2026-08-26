<?php

namespace App\Notifications;

use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectMemberAddedNotification extends Notification
{
    use Queueable;

    public Project $project;
    public string $role;

    public function __construct(Project $project, string $role)
    {
        $this->project = $project;
        $this->role = $role;
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $roleText = $this->role === 'LEAD' ? 'Lead Researcher' : 'Collaborator';

        return (new MailMessage)
            ->subject("You've been added to \"{$this->project->title}\"")
            ->line("You have been added as {$roleText} to the project \"{$this->project->title}\".")
            ->line("Division: {$this->project->division->name}")
            ->action('View Project', url("/projects/{$this->project->id}"));
    }

    public function toArray(object $notifiable): array
    {
        $roleText = $this->role === 'LEAD' ? 'Lead Researcher' : 'Collaborator';

        return [
            'type' => 'project_member_added',
            'project_id' => $this->project->id,
            'project_title' => $this->project->title,
            'role' => $this->role,
            'message' => "You have been added as {$roleText} to \"{$this->project->title}\".",
        ];
    }
}
