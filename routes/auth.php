<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PublicStatsController;
use Illuminate\Support\Facades\Route;

Route::get('/public/stats', [PublicStatsController::class, 'stats']);

Route::post('/auth/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])
    ->middleware('throttle:5,1');
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/validate', [AuthController::class, 'validateToken']);
});
