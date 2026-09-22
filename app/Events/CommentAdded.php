<?php

namespace App\Events;

use App\Models\Comment;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommentAdded
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Comment $comment;
    public Model $commentable;
    public User $author;

    public function __construct(Comment $comment, Model $commentable, User $author)
    {
        $this->comment = $comment;
        $this->commentable = $commentable;
        $this->author = $author;
    }
}
