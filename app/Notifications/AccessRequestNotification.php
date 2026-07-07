<?php

namespace App\Notifications;

use App\Models\AccessRequest;
use Illuminate\Bus\Queueable;
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
        return ['database'];
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
