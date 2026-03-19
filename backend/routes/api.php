<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PlotController;
use App\Http\Controllers\Api\BurialRecordController;
use App\Http\Controllers\Api\QrCodeController;
use App\Http\Controllers\Api\MapController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\ServiceRequestController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SecurityAuditLogController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SystemMaintenanceController;
use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\Api\InvitationController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\Api\StorageController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Smart Cemetery Navigation and Digital Plot Management System
| API Routes organized by module
|
*/

// ============================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================

// Authentication
Route::post('/login', [AuthController::class, 'login']);
// Note: Registration is disabled - only admins can create accounts

// Password Reset
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Social Authentication (OAuth)
Route::get('/auth/{provider}/redirect', [SocialAuthController::class, 'redirect']);
Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'callback']);

// Public grave profile (accessed via QR code)
Route::get('/public/grave/{code}', [PublicController::class, 'graveProfile']);

// Public search for burial records
Route::get('/public/search', [PublicController::class, 'search']);

// Public announcements
Route::get('/announcements', [AnnouncementController::class, 'index']);

// System maintenance status (public so frontend can show maintenance screen)
Route::get('/system/maintenance-status', [SystemMaintenanceController::class, 'status']);

// Storage file serving — serves files directly from backend storage disk,
// so image URLs never depend on the /storage symlink or .htaccess rules.
Route::get('/file/{path}', [StorageController::class, 'serve'])->where('path', '.+');

// Temporary diagnostic endpoint – remove after debugging invitation URLs
Route::get('/debug/urls', function () {
    return response()->json([
        'FRONTEND_URL_env' => env('FRONTEND_URL'),
        'FRONTEND_URL_config' => config('app.frontend_url'),
        'APP_URL_env' => env('APP_URL'),
        'APP_URL_config' => config('app.url'),
    ]);
});

// Public feedback submission
Route::post('/feedback', [FeedbackController::class, 'store']);

// Xendit payment webhook (authenticated by x-callback-token header, not by Sanctum)
Route::post('/payments/webhook/xendit', [PaymentWebhookController::class, 'xendit']);

// Invitation acceptance (public - user accepts invitation from email)
Route::get('/invitations/activate', [InvitationController::class, 'activateRedirect']);
Route::get('/invitations/details', [InvitationController::class, 'getInvitationDetails']);
Route::post('/invitations/accept', [InvitationController::class, 'acceptInvitation']);

// User lookup by email (public - only returns activated accounts for auto-fill feature)
Route::get('/users/by-email', [UserController::class, 'getByEmail']);

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

Route::middleware(['auth:sanctum', 'sanitize.input', 'must_change_password'])->group(function () {
    
    // Auth Management
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword'])->middleware('recent_auth');
    Route::post('/profile/update', [UserController::class, 'updateProfile'])->middleware('recent_auth');
    Route::get('/get-profile', [ProfileController::class, 'getProfile']);
    Route::post('/save-token', [UserController::class, 'saveToken']);
    Route::post('/system/maintenance', [SystemMaintenanceController::class, 'update'])->middleware('role:admin,staff');

    // My Loved Ones (Member access to their linked records)
    Route::get('/my-burial-records', [BurialRecordController::class, 'myRecords']);
    Route::post('/my-burial-records/{id}', [BurialRecordController::class, 'updateMyRecord']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // ----------------------------------------
    // PLOT MANAGEMENT
    // ----------------------------------------
    Route::prefix('plots')->group(function () {
        Route::get('/', [PlotController::class, 'index']);
        Route::get('/next-number', [PlotController::class, 'nextPlotNumber']);
        Route::get('/available', [PlotController::class, 'available']);
        Route::get('/statistics', [PlotController::class, 'statistics']);
        Route::get('/{id}', [PlotController::class, 'show']);
        
        // Admin only routes
        Route::middleware('role:admin')->group(function () {
            Route::post('/', [PlotController::class, 'store']);
            Route::delete('/{id}', [PlotController::class, 'destroy']);
        });

        // Admin and Staff routes
        Route::middleware('role:admin,staff')->group(function () {
            Route::put('/{id}', [PlotController::class, 'update']);
        });
    });

    // ----------------------------------------
    // BURIAL RECORD MANAGEMENT
    // ----------------------------------------
    Route::prefix('burial-records')->group(function () {
        Route::get('/', [BurialRecordController::class, 'index']);
        Route::get('/search', [BurialRecordController::class, 'search']);
        Route::get('/statistics', [BurialRecordController::class, 'statistics']);
        Route::get('/{id}', [BurialRecordController::class, 'show']);

        // Admin and Staff routes
        Route::middleware('role:admin,staff')->group(function () {
            Route::post('/', [BurialRecordController::class, 'store']);
            Route::put('/{id}', [BurialRecordController::class, 'update']);
            
            // Invitation routes
            Route::post('/{id}/invitation/send', [InvitationController::class, 'sendInvitation']);
            Route::post('/{id}/invitation/resend', [InvitationController::class, 'resendInvitation']);
            Route::get('/{id}/invitation/status', [InvitationController::class, 'getInvitationStatus']);
        });

        // Admin only routes
        Route::middleware('role:admin')->group(function () {
            Route::delete('/{id}', [BurialRecordController::class, 'destroy']);
        });
    });

    // ----------------------------------------
    // QR CODE MANAGEMENT
    // ----------------------------------------
    // Generate QR codes for burial records (scanner feature removed)
    Route::prefix('qr-codes')->group(function () {
        Route::get('/{code}', [QrCodeController::class, 'show']);
        
        Route::middleware('role:admin,staff')->group(function () {
            Route::post('/generate/{burialId}', [QrCodeController::class, 'generate']);
            Route::post('/regenerate/{burialId}', [QrCodeController::class, 'regenerate']);
            Route::patch('/{code}/deactivate', [QrCodeController::class, 'deactivate']);
        });
    });

    // ----------------------------------------
    // MAP DATA
    // ----------------------------------------
    Route::prefix('map')->group(function () {
        Route::get('/markers', [MapController::class, 'markers']);
        Route::get('/marker/{plotId}', [MapController::class, 'markerDetails']);
        Route::get('/bounds', [MapController::class, 'bounds']);
        
        // Admin only routes
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/plots', [MapController::class, 'createPlot']);
            Route::delete('/plots/{plotId}', [MapController::class, 'deletePlot']);

            Route::get('/landmarks', [MapController::class, 'getLandmarks']);
            Route::post('/landmarks', [MapController::class, 'createLandmark']);
            Route::put('/landmarks/{landmarkId}', [MapController::class, 'updateLandmark']);
            Route::delete('/landmarks/{landmarkId}', [MapController::class, 'deleteLandmark']);
        });
    });

    // ----------------------------------------
    // MEMBER ROUTES (for visitors/members)
    // ----------------------------------------
    Route::prefix('member')->group(function () {
        Route::get('/my-plots', [PlotController::class, 'myPlots']);
        Route::get('/dashboard-stats', [DashboardController::class, 'memberStats']);
    });

    // ----------------------------------------
    // USER MANAGEMENT (Admin Only)
    // ----------------------------------------
    Route::prefix('users')->middleware('role:admin')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/statistics', [UserController::class, 'statistics']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::post('/', [UserController::class, 'store']);
        // Send invitation to a new admin/staff account (invitation flow, no immediate account creation)
        Route::post('/staff-invite', [InvitationController::class, 'sendStaffAdminInvitation']);
        // Resend invitation to pending user
        Route::post('/{id}/resend-invitation', [InvitationController::class, 'resendStaffAdminInvitation']);
        // Edit and hard-delete are disabled; use archive/unarchive instead.
        Route::post('/{id}/archive', [UserController::class, 'archive']);
        Route::post('/{id}/unarchive', [UserController::class, 'unarchive']);
    });

    // ----------------------------------------
    // SECURITY AUDIT LOGS (Admin Only)
    // ----------------------------------------
    Route::prefix('security-audit-logs')->middleware('role:admin')->group(function () {
        Route::get('/', [SecurityAuditLogController::class, 'index']);
    });

    // ----------------------------------------
    // ANNOUNCEMENTS MANAGEMENT
    // ----------------------------------------
    Route::prefix('announcements')->group(function () {
        Route::get('/statistics', [AnnouncementController::class, 'statistics'])->middleware('role:admin,staff');
        Route::get('/{id}', [AnnouncementController::class, 'show']);
        
        Route::middleware('role:admin,staff')->group(function () {
            Route::post('/', [AnnouncementController::class, 'store']);
            Route::put('/{id}', [AnnouncementController::class, 'update']);
            Route::delete('/{id}', [AnnouncementController::class, 'destroy']);
        });
    });

    // ----------------------------------------
    // SERVICE REQUESTS
    // ----------------------------------------
    Route::prefix('service-requests')->group(function () {
        Route::get('/', [ServiceRequestController::class, 'index']);
        Route::post('/', [ServiceRequestController::class, 'store']);
        Route::get('/statistics', [ServiceRequestController::class, 'statistics'])->middleware('role:admin,staff');
        Route::get('/{id}', [ServiceRequestController::class, 'show']);
        Route::patch('/{id}/cancel', [ServiceRequestController::class, 'cancel'])->middleware('role:member');
        
        Route::middleware('role:admin,staff')->group(function () {
            Route::put('/{id}', [ServiceRequestController::class, 'update']);
            Route::delete('/{id}', [ServiceRequestController::class, 'destroy']);
        });
    });

    // ----------------------------------------
    // PAYMENTS
    // ----------------------------------------
    Route::prefix('payments')->group(function () {
        Route::get('/', [PaymentController::class, 'index']);
        Route::post('/', [PaymentController::class, 'store']);
        Route::post('/xendit', [PaymentController::class, 'createXendit']);
        Route::get('/my-dues', [PaymentController::class, 'myDues']);
        Route::get('/statistics', [PaymentController::class, 'statistics'])->middleware('role:admin,staff');
        Route::post('/{id}/checkout', [PaymentController::class, 'checkout']);
        Route::post('/{id}/mark-paid', [PaymentController::class, 'markPaid']);
        Route::get('/{id}', [PaymentController::class, 'show']);
        
        Route::middleware('role:admin,staff')->group(function () {
            Route::post('/{id}/verify', [PaymentController::class, 'verify'])->middleware('recent_auth');
            Route::delete('/{id}', [PaymentController::class, 'destroy']);
        });
    });

    // ----------------------------------------
    // FEEDBACK (Admin Management)
    // ----------------------------------------
    Route::prefix('feedbacks')->middleware('role:admin,staff')->group(function () {
        Route::get('/', [FeedbackController::class, 'index']);
        Route::get('/statistics', [FeedbackController::class, 'statistics']);
        Route::post('/test-email', [FeedbackController::class, 'testEmail']);
        Route::get('/{id}', [FeedbackController::class, 'show']);
        Route::post('/{id}/respond', [FeedbackController::class, 'respond']);
        Route::delete('/{id}', [FeedbackController::class, 'destroy']);
    });

    // ----------------------------------------
    // REPORTS (Admin Only)
    // ----------------------------------------
    Route::prefix('reports')->middleware('role:admin,staff')->group(function () {
        Route::get('/payments', [ReportController::class, 'payments']);
        Route::get('/feedbacks', [ReportController::class, 'feedbacks']);
        Route::get('/users', [ReportController::class, 'users']);
    });
});
