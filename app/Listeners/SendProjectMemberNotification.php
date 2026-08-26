<?php

namespace App\Listeners;

use App\Events\ProjectMemberAdded;
use App\Models\InboxItem;
use App\Notifications\ProjectMemberAddedNotification;
use Illuminate\Support\Facades\Notification;

class SendProjectMemberNotification
{
    public function handle(ProjectMemberAdded $event): void
    {
        $roleText = $event->role === 'LEAD' ? 'Lead Researcher' : 'Collaborator';

        InboxItem::create([
            'user_id' => $event->user->id,
            'sender_id' => $event->project->lead_researcher_id,
            'type' => 'SYSTEM',
            'subject' => "Added to project: {$event->project->title}",
            'message' => "You have been added as {$roleText} to \"{$event->project->title}\".",
        ]);

        Notification::send($event->user, new ProjectMemberAddedNotification($event->project, $event->role));
    }
}
