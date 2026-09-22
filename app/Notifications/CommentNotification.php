<?php

namespace App\Notifications;

use App\Models\Comment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CommentNotification extends Notification
{
    use Queueable;

    public Comment $comment;
    public string $subjectLine;
    public string $url;

    public function __construct(Comment $comment, string $subjectLine, string $url)
    {
        $this->comment = $comment;
        $this->subjectLine = $subjectLine;
        $this->url = $url;
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $author = $this->comment->user?->full_name ?? 'Someone';

        return (new MailMessage)
            ->subject($this->subjectLine)
            ->line("{$author} commented: \"{$this->comment->body}\"")
            ->action('View', $this->url);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'comment_added',
            'comment_id' => $this->comment->id,
            'message' => $this->subjectLine,
        ];
    }
}
