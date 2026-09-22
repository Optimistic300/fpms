<?php

namespace App\Providers;

use App\Events\AccessRequestCreated;
use App\Events\ActivityLogged;
use App\Events\CommentAdded;
use App\Events\DocumentForwarded;
use App\Events\DocumentPublished;
use App\Events\ProjectMemberAdded;
use App\Events\ReportApproved;
use App\Events\ReportEscalated;
use App\Events\ReportReturned;
use App\Events\ReportSubmitted;
use App\Models\Document;
use App\Observers\DocumentObserver;
use App\Listeners\NotifyProjectMembersOnActivity;
use App\Listeners\SendAccessRequestNotification;
use App\Listeners\SendCommentNotification;
use App\Listeners\SendDocumentForwardedNotification;
use App\Listeners\SendProjectMemberNotification;
use App\Listeners\SendReportSubmittedNotification;
use App\Listeners\SendReportStatusChangedNotification;
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
        ProjectMemberAdded::class => [
            SendProjectMemberNotification::class,
        ],
        ActivityLogged::class => [
            NotifyProjectMembersOnActivity::class,
        ],
        CommentAdded::class => [
            SendCommentNotification::class,
        ],
    ];

    protected $observes = [
        Document::class => [
            DocumentObserver::class,
        ],
    ];

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
