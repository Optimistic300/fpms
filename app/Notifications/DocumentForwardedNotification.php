<?php

namespace App\Notifications;

use App\Models\Document;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DocumentForwardedNotification extends Notification
{
    use Queueable;

    public Document $document;
    public User $sender;
    public ?string $message;

    public function __construct(Document $document, User $sender, ?string $message = null)
    {
        $this->document = $document;
        $this->sender = $sender;
        $this->message = $message;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'document_forwarded',
            'document_id' => $this->document->id,
            'sender_id' => $this->sender->id,
            'sender_name' => $this->sender->full_name,
            'subject' => 'Document forwarded: ' . $this->document->filename,
            'message' => $this->message,
        ];
    }
}
