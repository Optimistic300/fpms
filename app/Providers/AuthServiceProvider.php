<?php

namespace App\Providers;

use App\Models\AccessRequest;
use App\Models\Activity;
use App\Models\ActivityType;
use App\Models\Division;
use App\Models\Document;
use App\Models\InboxItem;
use App\Models\Project;
use App\Models\Publication;
use App\Models\Report;
use App\Models\User;
use App\Policies\AccessRequestPolicy;
use App\Policies\ActivityPolicy;
use App\Policies\ActivityTypePolicy;
use App\Policies\AdminPolicy;
use App\Policies\DivisionPolicy;
use App\Policies\DocumentPolicy;
use App\Policies\InboxItemPolicy;
use App\Policies\ProjectPolicy;
use App\Policies\PublicationPolicy;
use App\Policies\ReportPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        User::class => UserPolicy::class,
        Project::class => ProjectPolicy::class,
        Activity::class => ActivityPolicy::class,
        ActivityType::class => ActivityTypePolicy::class,
        Document::class => DocumentPolicy::class,
        Report::class => ReportPolicy::class,
        Publication::class => PublicationPolicy::class,
        InboxItem::class => InboxItemPolicy::class,
        Division::class => DivisionPolicy::class,
        AccessRequest::class => AccessRequestPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        Gate::define('viewInstitute', fn (User $user) => $user->isManagement());
        Gate::define('manageUsers', fn (User $user) => $user->isAdmin());
        Gate::define('manageSettings', fn (User $user) => $user->isAdmin());
    }
}
