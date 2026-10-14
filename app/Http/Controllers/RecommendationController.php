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
            commodityId: (int) $validated['commodity_id'],
            umkmLat: (float) $validated['latitude'],
            umkmLon: (float) $validated['longitude'],
            qty: (float) $validated['qty'],
            topN: (int) ($validated['top_n'] ?? 20),
        );

        return response()->json([
            'success' => true,
            'count' => count($results),
            'data' => $results,
        ]);
    }
}