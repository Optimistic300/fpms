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
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Rate limiting for login
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // Register policies
        Gate::policy(Project::class, ProjectPolicy::class);
        Gate::policy(Activity::class, ActivityPolicy::class);
        Gate::policy(Document::class, DocumentPolicy::class);
        Gate::policy(Report::class, ReportPolicy::class);
        Gate::policy(Publication::class, PublicationPolicy::class);
        Gate::policy(InboxItem::class, InboxItemPolicy::class);
    }
}
