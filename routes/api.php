<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommodityController;
use App\Http\Controllers\ExchangeRateController;
use App\Http\Controllers\ProducerController;
use App\Http\Controllers\RecommendationController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Produsen
    Route::get('/my-listings', [ProducerController::class, 'mine']);
    Route::post('/my-listings', [ProducerController::class, 'storeProfile']);
    Route::put('/producer-commodities/{producerCommodity}', [ProducerController::class, 'update']);

    // KUD
    Route::get('/producers', [ProducerController::class, 'index']);
    Route::patch('/producers/{producer}/validation', [ProducerController::class, 'setValidation']);
});

Route::get('/recommendations', [RecommendationController::class, 'index']);

Route::get('/exchange-rate/latest', [ExchangeRateController::class, 'latest']);
Route::get('/exchange-rate/check', [ExchangeRateController::class, 'check']);
Route::get('/exchange-rate/history', [ExchangeRateController::class, 'history']);

Route::get('/commodities', [CommodityController::class, 'index']);