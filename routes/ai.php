<?php

use App\Http\Controllers\Api\AiController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/ai/query', [AiController::class, 'query']);
});
