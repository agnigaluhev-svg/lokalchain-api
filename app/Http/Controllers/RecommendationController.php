<?php

namespace App\Http\Controllers;

use App\Services\RecommendationService;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    protected RecommendationService $recommendationService;

    public function __construct(RecommendationService $recommendationService)
    {
        $this->recommendationService = $recommendationService;
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'commodity_id' => 'required|integer|exists:commodities,id',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'qty' => 'required|numeric|min:0.01',
            'top_n' => 'nullable|integer|min:1|max:20',
        ]);

        $results = $this->recommendationService->recommend(
            commodityId: $validated['commodity_id'],
            umkmLat: $validated['latitude'],
            umkmLon: $validated['longitude'],
            qty: $validated['qty'],
            topN: $validated['top_n'] ?? 5,
        );

        return response()->json([
            'success' => true,
            'count' => count($results),
            'data' => $results,
        ]);
    }
}