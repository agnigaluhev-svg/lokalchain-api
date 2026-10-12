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
});

Route::get('/recommendations', [RecommendationController::class, 'index']);

Route::get('/exchange-rate/latest', [ExchangeRateController::class, 'latest']);
Route::get('/exchange-rate/check', [ExchangeRateController::class, 'check']);
Route::get('/exchange-rate/history', [ExchangeRateController::class, 'history']);

Route::get('/commodities', [CommodityController::class, 'index']);

Route::get('/producers', [ProducerController::class, 'index']);
Route::put('/producer-commodities/{producerCommodity}', [ProducerController::class, 'update']);