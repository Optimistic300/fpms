<?php

use App\Http\Controllers\Api\AccessRequestController;
use App\Http\Controllers\Api\ProjectController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);
    Route::put('/projects/{project}', [ProjectController::class, 'update']);
    Route::get('/projects/{project}/members', [ProjectController::class, 'members']);
    Route::post('/projects/{project}/members', [ProjectController::class, 'addMember']);
    Route::post('/projects/{project}/access-requests', [ProjectController::class, 'requestAccess']);
    Route::patch('/access-requests/{accessRequest}', [AccessRequestController::class, 'update']);
});
