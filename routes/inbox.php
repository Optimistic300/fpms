<?php

use App\Http\Controllers\InboxController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/inbox', [InboxController::class, 'index']);
    Route::patch('/inbox/read-all', [InboxController::class, 'markAllRead']);
    Route::post('/inbox/forward', [InboxController::class, 'forward']);
    Route::patch('/inbox/{inboxItem}/read', [InboxController::class, 'markRead']);
});
