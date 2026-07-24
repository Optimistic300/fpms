<?php

use App\Http\Controllers\DivisionController;
use App\Http\Controllers\InstituteController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/divisions/summary', [InstituteController::class, 'divisionSummary']);
    Route::get('/divisions/{division}/stats', [DivisionController::class, 'stats']);
    Route::get('/divisions/{division}/researcher-activity', [DivisionController::class, 'researcherActivity']);
    Route::get('/divisions/{division}/activity-feed', [DivisionController::class, 'activityFeed']);
});
