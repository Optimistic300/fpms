<?php

use App\Http\Controllers\PublicationController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/publications', [PublicationController::class, 'index']);
    Route::get('/publications/pipeline', [PublicationController::class, 'pipeline']);
    Route::post('/publications', [PublicationController::class, 'store']);
    Route::get('/publications/{publication}', [PublicationController::class, 'show']);
    Route::put('/publications/{publication}', [PublicationController::class, 'update']);
});
