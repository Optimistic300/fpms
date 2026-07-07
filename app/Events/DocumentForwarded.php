<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DocumentForwarded
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $documentId;
    public User $sender;
    public array $recipientIds;
    public ?string $message;

    public function __construct(int $documentId, User $sender, array $recipientIds, ?string $message = null)
    {
        $this->documentId = $documentId;
        $this->sender = $sender;
        $this->recipientIds = $recipientIds;
        $this->message = $message;
    }
}
