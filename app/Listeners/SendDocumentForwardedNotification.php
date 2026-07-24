<?php

namespace App\Listeners;

use App\Events\DocumentForwarded;
use App\Models\Document;
use App\Models\InboxItem;
use App\Models\User;
use App\Notifications\DocumentForwardedNotification;
use Illuminate\Support\Facades\Notification;

class SendDocumentForwardedNotification
{
    public function handle(DocumentForwarded $event): void
    {
        $document = Document::findOrFail($event->documentId);

        foreach ($event->recipientIds as $recipientId) {
            InboxItem::create([
                'user_id' => $recipientId,
                'sender_id' => $event->sender->id,
                'type' => 'DOCUMENT',
                'subject' => 'Document forwarded: ' . $document->filename,
                'message' => $event->message,
                'document_id' => $event->documentId,
            ]);

            $recipient = User::find($recipientId);
            if ($recipient) {
                Notification::send($recipient, new DocumentForwardedNotification($document, $event->sender, $event->message));
            }
        }
    }
}
