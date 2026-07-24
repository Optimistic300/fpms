<?php

use App\Http\Controllers\InstituteController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/institute/stats', [InstituteController::class, 'stats']);
    Route::get('/institute/funding-breakdown', [InstituteController::class, 'fundingBreakdown']);
    Route::get('/institute/compliance', [InstituteController::class, 'compliance']);
    Route::get('/institute/alerts', [InstituteController::class, 'alerts']);
});
