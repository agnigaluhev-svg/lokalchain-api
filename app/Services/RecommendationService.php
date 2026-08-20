<?php

namespace App\Services;

use App\Models\ProducerCommodity;
use Carbon\Carbon;

class RecommendationService
{
    protected DistanceService $distanceService;
    protected float $costPerKm = 2000;
    protected int $freshnessThresholdDays = 7;
    protected float $stalePenaltyPercent = 15.0;

    public function __construct(DistanceService $distanceService)
    {
        $this->distanceService = $distanceService;
    }

    public function recommend(int $commodityId, float $umkmLat, float $umkmLon, float $qty, int $topN = 5): array
    {
        $candidates = ProducerCommodity::with('producer')
            ->where('commodity_id', $commodityId)
            ->get();

        $results = [];

        foreach ($candidates as $item) {
            $producer = $item->producer;

            $distanceKm = $this->distanceService->haversine(
                $umkmLat,
                $umkmLon,
                (float) $producer->latitude,
                (float) $producer->longitude
            );

            $baseCost = ($item->price_per_kg * $qty) + ($distanceKm * $this->costPerKm);

            $daysSinceUpdate = $producer->last_updated_at
                ? Carbon::parse($producer->last_updated_at)->diffInDays(now())
                : null;

            $isStale = $daysSinceUpdate !== null && $daysSinceUpdate > $this->freshnessThresholdDays;

            $totalCost = $isStale
                ? $baseCost * (1 + $this->stalePenaltyPercent / 100)
                : $baseCost;

            $results[] = [
                'producer_id' => $producer->id,
                'producer_name' => $producer->name,
                'address' => $producer->address,
                'latitude' => (float) $producer->latitude,
                'longitude' => (float) $producer->longitude,
                'price_per_kg' => (float) $item->price_per_kg,
                'capacity_per_day' => (float) $item->capacity_per_day,
                'distance_km' => round($distanceKm, 2),
                'days_since_update' => $daysSinceUpdate !== null ? floor($daysSinceUpdate) : null,
                'is_stale' => $isStale,
                'total_cost' => round($totalCost, 2),
            ];
        }

        usort($results, fn ($a, $b) => $a['total_cost'] <=> $b['total_cost']);

        return array_slice($results, 0, $topN);
    }
}