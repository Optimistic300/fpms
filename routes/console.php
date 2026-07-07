<?php

use App\Models\Report;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    $overdue = Report::where('status', 'PENDING')
        ->where('submitted_at', '<', now()->subDays(30))
        ->count();

    \Illuminate\Support\Facades\Log::info("Report overdue check: {$overdue} reports overdue.");
})->daily()->name('reports:calculate-overdue');

Schedule::call(function () {
    $pending = Report::whereNull('submitted_at')
        ->orWhere('submitted_at', '>', now()->subDays(30))
        ->count();

    \Illuminate\Support\Facades\Log::info("Deadline alert check: {$pending} reports pending action.");
})->daily()->name('reports:deadline-alerts');
