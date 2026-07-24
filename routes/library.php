<?php

use App\Http\Controllers\LibraryController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/library/stats', [LibraryController::class, 'stats']);
    Route::get('/library/documents', [LibraryController::class, 'documents']);
    Route::get('/library/search', [LibraryController::class, 'search']);
});
