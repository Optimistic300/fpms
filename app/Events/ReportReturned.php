<?php

namespace App\Events;

use App\Models\Report;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReportReturned
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Report $report;

    public function __construct(Report $report)
    {
        $this->report = $report;
    }
}
