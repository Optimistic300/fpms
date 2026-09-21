<?php

namespace App\Events;

use App\Models\Publication;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PublicationCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Publication $publication
    ) {}
}