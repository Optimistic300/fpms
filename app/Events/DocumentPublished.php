<?php

namespace App\Events;

use App\Models\Document;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DocumentPublished
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Document $document;

    public function __construct(Document $document)
    {
        $this->document = $document;
    }
}
