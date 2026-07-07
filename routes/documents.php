<?php

use App\Http\Controllers\DocumentController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/activities/{activity}/documents', [DocumentController::class, 'uploadToActivity']);

    Route::get('/documents', [DocumentController::class, 'index']);
    Route::patch('/documents/{document}', [DocumentController::class, 'update']);
    Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
    Route::get('/documents/{document}/preview', [DocumentController::class, 'preview']);
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy']);
});
