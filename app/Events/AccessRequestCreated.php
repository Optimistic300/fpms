<?php

namespace App\Events;

use App\Models\AccessRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AccessRequestCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public AccessRequest $accessRequest;

    public function __construct(AccessRequest $accessRequest)
    {
        $this->accessRequest = $accessRequest;
    }
}
