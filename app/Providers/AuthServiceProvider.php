<?php

namespace App\Providers;

use App\Models\Activity;
use App\Models\Document;
use App\Models\InboxItem;
use App\Models\Project;
use App\Models\Publication;
use App\Models\Report;
use App\Policies\ActivityPolicy;
use App\Policies\AdminPolicy;
use App\Policies\DivisionPolicy;
use App\Policies\DocumentPolicy;
use App\Policies\InboxItemPolicy;
use App\Policies\InstitutePolicy;
use App\Policies\ProjectPolicy;
use App\Policies\PublicationPolicy;
use App\Policies\ReportPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Project::class => ProjectPolicy::class,
        Activity::class => ActivityPolicy::class,
        Document::class => DocumentPolicy::class,
        Report::class => ReportPolicy::class,
        Publication::class => PublicationPolicy::class,
        InboxItem::class => InboxItemPolicy::class,
        DivisionPolicy::class => DivisionPolicy::class,
        InstitutePolicy::class => InstitutePolicy::class,
        AdminPolicy::class => AdminPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
