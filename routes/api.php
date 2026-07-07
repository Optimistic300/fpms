<?php

use App\Http\Controllers\AccessRequestController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ActivityTypeController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DivisionController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\InboxController;
use App\Http\Controllers\InstituteController;
use App\Http\Controllers\LibraryController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\PublicationController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

// Public
Route::get('/public/stats', [PublicController::class, 'stats']);

// Auth
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/validate', [AuthController::class, 'validateToken']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Projects
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);
    Route::put('/projects/{project}', [ProjectController::class, 'update']);
    Route::get('/projects/{project}/members', [ProjectController::class, 'members']);
    Route::post('/projects/{project}/members', [ProjectController::class, 'addMember']);
    Route::post('/projects/{project}/access-requests', [ProjectController::class, 'requestAccess']);

    // Activity Types
    Route::get('/activity-types', [ActivityTypeController::class, 'index']);

    // Activities
    Route::get('/activities', [ActivityController::class, 'index']);
    Route::post('/activities', [ActivityController::class, 'store']);
    Route::get('/activities/{activity}', [ActivityController::class, 'show']);
    Route::put('/activities/{activity}', [ActivityController::class, 'update']);
    Route::delete('/activities/{activity}', [ActivityController::class, 'destroy']);

    // Activity Documents
    Route::post('/activities/{activity}/documents', [DocumentController::class, 'uploadToActivity']);

    // Documents
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::patch('/documents/{document}', [DocumentController::class, 'update']);
    Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
    Route::get('/documents/{document}/preview', [DocumentController::class, 'preview']);
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy']);

    // Reports
    Route::get('/reports', [ReportController::class, 'index']);
    Route::get('/reports/stats', [ReportController::class, 'stats']);
    Route::post('/reports', [ReportController::class, 'store']);
    Route::post('/reports/draft', [ReportController::class, 'saveDraft']);
    Route::get('/reports/{report}', [ReportController::class, 'show']);
    Route::patch('/reports/{report}', [ReportController::class, 'update']);

    // Publications
    Route::get('/publications', [PublicationController::class, 'index']);
    Route::get('/publications/pipeline', [PublicationController::class, 'pipeline']);
    Route::post('/publications', [PublicationController::class, 'store']);
    Route::get('/publications/{publication}', [PublicationController::class, 'show']);
    Route::put('/publications/{publication}', [PublicationController::class, 'update']);

    // Inbox
    Route::get('/inbox', [InboxController::class, 'index']);
    Route::patch('/inbox/read-all', [InboxController::class, 'markAllRead']);
    Route::post('/inbox/forward', [InboxController::class, 'forward']);
    Route::patch('/inbox/{inboxItem}/read', [InboxController::class, 'markRead']);

    // Library
    Route::get('/library/stats', [LibraryController::class, 'stats']);
    Route::get('/library/documents', [LibraryController::class, 'documents']);
    Route::get('/library/search', [LibraryController::class, 'search']);

    // Divisions
    Route::get('/divisions/summary', [InstituteController::class, 'divisionSummary']);
    Route::get('/divisions/{division}/stats', [DivisionController::class, 'stats']);
    Route::get('/divisions/{division}/researcher-activity', [DivisionController::class, 'researcherActivity']);
    Route::get('/divisions/{division}/activity-feed', [DivisionController::class, 'activityFeed']);

    // Institute
    Route::get('/institute/stats', [InstituteController::class, 'stats']);
    Route::get('/institute/funding-breakdown', [InstituteController::class, 'fundingBreakdown']);
    Route::get('/institute/compliance', [InstituteController::class, 'compliance']);
    Route::get('/institute/alerts', [InstituteController::class, 'alerts']);

    // Admin
    Route::get('/admin/users', [AdminController::class, 'users']);
    Route::post('/admin/users', [AdminController::class, 'createUser']);
    Route::put('/admin/users/{user}', [AdminController::class, 'updateUser']);
    Route::get('/admin/divisions', [AdminController::class, 'divisions']);
    Route::post('/admin/divisions', [AdminController::class, 'createDivision']);
    Route::get('/admin/activity-types', [AdminController::class, 'activityTypes']);
    Route::post('/admin/activity-types', [AdminController::class, 'createActivityType']);
});
