<?php

use App\Http\Controllers\CommodityController;
use App\Http\Controllers\ExchangeRateController;
use App\Http\Controllers\RecommendationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/recommendations', [RecommendationController::class, 'index']);

Route::get('/exchange-rate/latest', [ExchangeRateController::class, 'latest']);
Route::get('/exchange-rate/check', [ExchangeRateController::class, 'check']);

Route::get('/commodities', [CommodityController::class, 'index']);