<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/users', [AdminController::class, 'users']);
    Route::post('/admin/users', [AdminController::class, 'createUser']);
    Route::put('/admin/users/{user}', [AdminController::class, 'updateUser']);
    Route::post('/admin/users/{user}/reset-password', [AdminController::class, 'resetPassword']);

    Route::get('/admin/divisions', [AdminController::class, 'divisions']);
    Route::post('/admin/divisions', [AdminController::class, 'createDivision']);
    Route::put('/admin/divisions/{division}', [AdminController::class, 'updateDivision']);
    Route::delete('/admin/divisions/{division}', [AdminController::class, 'deleteDivision']);

    Route::get('/admin/activity-types', [AdminController::class, 'activityTypes']);
    Route::post('/admin/activity-types', [AdminController::class, 'createActivityType']);
    Route::put('/admin/activity-types/{activity_type}', [AdminController::class, 'updateActivityType']);
    Route::delete('/admin/activity-types/{activity_type}', [AdminController::class, 'deleteActivityType']);
});
