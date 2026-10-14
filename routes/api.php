<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommodityController;
use App\Http\Controllers\ExchangeRateController;
use App\Http\Controllers\ProducerController;
use App\Http\Controllers\RecommendationController;
use Illuminate\Support\Facades\Route;

// Publik, dibatasi 10 permintaan per menit untuk mencegah tebak password
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Data referensi publik (bukan data sensitif)
Route::get('/commodities', [CommodityController::class, 'index']);
Route::get('/exchange-rate/latest', [ExchangeRateController::class, 'latest']);
Route::get('/exchange-rate/history', [ExchangeRateController::class, 'history']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Memicu panggilan ke API kurs luar: wajib login dan dibatasi
    Route::get('/exchange-rate/check', [ExchangeRateController::class, 'check'])
        ->middleware('throttle:6,1');

    // UMKM
    Route::middleware('role:umkm')->group(function () {
        Route::get('/recommendations', [RecommendationController::class, 'index']);
    });

    // PRODUSEN
    Route::middleware('role:produsen')->group(function () {
        Route::get('/my-listings', [ProducerController::class, 'mine']);
        Route::post('/my-listings', [ProducerController::class, 'storeProfile']);
        Route::put('/producer-commodities/{producerCommodity}', [ProducerController::class, 'update']);
    });

    // KUD dan ADMIN: lihat semua produsen
    Route::middleware('role:kud,admin')->group(function () {
        Route::get('/producers', [ProducerController::class, 'index']);
    });

    // KUD saja: validasi
    Route::middleware('role:kud')->group(function () {
        Route::patch('/producers/{producer}/validation', [ProducerController::class, 'setValidation']);
    });

    // ADMIN saja: kelola akun
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/users', [AdminController::class, 'users']);
        Route::post('/kud-accounts', [AdminController::class, 'createKud']);
        Route::patch('/users/{user}/active', [AdminController::class, 'setActive']);
    });
});