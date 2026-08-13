<?php

namespace App\Providers;

use App\Contracts\AiRetrievalInterface;
use App\Contracts\FileStorageInterface;
use App\Contracts\ReportRepositoryInterface;
use App\Services\AiAssistantService;
use App\Services\FileStorageService;
use App\Repositories\ReportRepository;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(FileStorageInterface::class, FileStorageService::class);
        $this->app->bind(AiRetrievalInterface::class, AiAssistantService::class);
        $this->app->bind(ReportRepositoryInterface::class, ReportRepository::class);
    }

    public function boot(): void
    {
        // Render terminates TLS at its edge and forwards requests over plain
        // HTTP, so without this Laravel generates http:// asset/URL links
        // behind an https:// page, which browsers block as mixed content.
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // Point the emailed reset link at the React reset-password page
        // instead of the web.php route, which just dumps the token as JSON.
        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            return config('app.url').'/reset-password?token='.$token
                .'&email='.urlencode($notifiable->getEmailForPasswordReset());
        });
    }
}
