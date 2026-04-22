<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\AuthController;

// Public routes
Route::get('/products', [ProductController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/{orderNumber}', [OrderController::class, 'show']);
Route::post('/orders/{orderNumber}/cancel', [OrderController::class, 'cancel']);
Route::get('/queue', [OrderController::class, 'queue']);

Route::post('/push-subscriptions', [\App\Http\Controllers\PushSubscriptionController::class, 'store']);

// Auth routes
Route::post('/login', [AuthController::class, 'login']);

// Protected Admin routes
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/orders', [AdminController::class, 'index']);
    Route::put('/orders/{id}/status', [AdminController::class, 'updateStatus']);

    // Product Management
    Route::get('/products', [\App\Http\Controllers\AdminProductController::class, 'index']);
    Route::post('/products', [\App\Http\Controllers\AdminProductController::class, 'store']);
    Route::put('/products/{id}', [\App\Http\Controllers\AdminProductController::class, 'update']);
    Route::delete('/products/{id}', [\App\Http\Controllers\AdminProductController::class, 'destroy']);
});
