<?php

namespace App\Providers;

use App\Events\AccessRequestCreated;
use App\Events\DocumentForwarded;
use App\Events\ProjectMemberAdded;
use App\Events\ReportApproved;
use App\Events\ReportEscalated;
use App\Events\ReportReturned;
use App\Events\ReportSubmitted;
use App\Listeners\SendAccessRequestNotification;
use App\Listeners\SendDocumentForwardedNotification;
use App\Listeners\SendReportStatusChangedNotification;
use App\Listeners\SendReportSubmittedNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        ReportSubmitted::class => [
            SendReportSubmittedNotification::class,
        ],
        ReportApproved::class => [
            SendReportStatusChangedNotification::class,
        ],
        ReportReturned::class => [
            SendReportStatusChangedNotification::class,
        ],
        ReportEscalated::class => [
            SendReportStatusChangedNotification::class,
        ],
        DocumentForwarded::class => [
            SendDocumentForwardedNotification::class,
        ],
        AccessRequestCreated::class => [
            SendAccessRequestNotification::class,
        ],
        ProjectMemberAdded::class => [],
    ];

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
