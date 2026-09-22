<?php

namespace App\Listeners;

use App\Events\CommentAdded;
use App\Models\Activity;
use App\Models\Document;
use App\Models\InboxItem;
use App\Models\Project;
use App\Models\Publication;
use App\Models\User;
use App\Notifications\CommentNotification;
use Illuminate\Support\Facades\Notification;

class SendCommentNotification
{
    public function handle(CommentAdded $event): void
    {
        [$ownerId, $label, $url] = match (true) {
            $event->commentable instanceof Project => [
                $event->commentable->lead_researcher_id,
                "New comment on \"{$event->commentable->title}\"",
                url("/projects/{$event->commentable->id}"),
            ],
            $event->commentable instanceof Activity => [
                $event->commentable->user_id,
                'New comment on your logged activity',
                url("/projects/{$event->commentable->project_id}"),
            ],
            $event->commentable instanceof Document => [
                $event->commentable->uploaded_by,
                "New comment on \"{$event->commentable->filename}\"",
                url('/library'),
            ],
            $event->commentable instanceof Publication => [
                $event->commentable->submitted_by_id,
                "New comment on \"{$event->commentable->title}\"",
                url('/publications'),
            ],
            default => [null, 'New comment', url('/')],
        };

        if (! $ownerId || $ownerId === $event->author->id) {
            return;
        }

        $owner = User::find($ownerId);

        if (! $owner) {
            return;
        }

        InboxItem::create([
            'user_id' => $owner->id,
            'sender_id' => $event->author->id,
            'type' => 'SYSTEM',
            'subject' => $label,
            'message' => $event->comment->body,
            'document_id' => $event->commentable instanceof Document ? $event->commentable->id : null,
        ]);

        Notification::send($owner, new CommentNotification($event->comment, $label, $url));
    }
}
