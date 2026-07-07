<?php

use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/reports', [ReportController::class, 'index']);
    Route::get('/reports/stats', [ReportController::class, 'stats']);
    Route::post('/reports', [ReportController::class, 'store']);
    Route::post('/reports/draft', [ReportController::class, 'saveDraft']);
    Route::get('/reports/{report}', [ReportController::class, 'show']);
    Route::patch('/reports/{report}', [ReportController::class, 'update']);
});
