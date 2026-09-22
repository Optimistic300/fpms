<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ActivityTypeController;
use App\Http\Controllers\CommentController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/activity-types', [ActivityTypeController::class, 'index']);

    Route::get('/activities', [ActivityController::class, 'index']);
    Route::post('/activities', [ActivityController::class, 'store']);
    Route::get('/activities/{activity}', [ActivityController::class, 'show']);
    Route::put('/activities/{activity}', [ActivityController::class, 'update']);
    Route::delete('/activities/{activity}', [ActivityController::class, 'destroy']);

    Route::get('/activities/{activity}/comments', [CommentController::class, 'activityIndex']);
    Route::post('/activities/{activity}/comments', [CommentController::class, 'activityStore']);
});
