<?php

namespace App\Notifications;

use App\Models\AccessRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccessRequestNotification extends Notification
{
    use Queueable;

    public AccessRequest $accessRequest;

    public function __construct(AccessRequest $accessRequest)
    {
        $this->accessRequest = $accessRequest;
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $project = $this->accessRequest->project;
        $requester = $this->accessRequest->requester;
        $requesterName = $requester?->full_name ?? 'A user';

        return (new MailMessage)
            ->subject("Access request for {$project->title}")
            ->line("{$requesterName} has requested access to your project \"{$project->title}\".")
            ->action('Review Request', url("/projects/{$project->id}"));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'access_request',
            'access_request_id' => $this->accessRequest->id,
            'project_id' => $this->accessRequest->project_id,
            'requester_id' => $this->accessRequest->requester_id,
            'message' => 'A new access request has been submitted.',
        ];
    }
}
