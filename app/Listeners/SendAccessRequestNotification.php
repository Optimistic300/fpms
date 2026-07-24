<?php

namespace App\Listeners;

use App\Events\AccessRequestCreated;
use App\Models\InboxItem;
use App\Models\User;
use App\Notifications\AccessRequestNotification;
use Illuminate\Support\Facades\Notification;

class SendAccessRequestNotification
{
    public function handle(AccessRequestCreated $event): void
    {
        $accessRequest = $event->accessRequest;
        $project = $accessRequest->project;
        $requester = $accessRequest->requester;

        if (!$project) {
            return;
        }

        $owner = User::find($project->lead_researcher_id);

        if (!$owner) {
            return;
        }

        $senderName = $requester?->full_name ?? 'A user';
        $subject = 'Access request: ' . $project->title;
        $message = "{$senderName} has requested access to {$project->title}.";

        InboxItem::create([
            'user_id' => $owner->id,
            'sender_id' => $requester?->id,
            'type' => 'SYSTEM',
            'subject' => $subject,
            'message' => $message,
        ]);

        Notification::send($owner, new AccessRequestNotification($accessRequest));
    }
}
