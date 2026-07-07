<?php

namespace App\Events;

use App\Models\Report;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReportEscalated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Report $report;
    public ?string $comment;

    public function __construct(Report $report, ?string $comment = null)
    {
        $this->report = $report;
        $this->comment = $comment;
    }
}
