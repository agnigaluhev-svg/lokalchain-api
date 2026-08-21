<?php

namespace App\Http\Controllers;

use App\Models\ProducerCommodity;
use Illuminate\Http\Request;

class ProducerController extends Controller
{
    public function index()
    {
        $items = ProducerCommodity::with('producer', 'commodity')->get()->map(function ($item) {
            return [
                'producer_commodity_id' => $item->id,
                'producer_id' => $item->producer->id,
                'name' => $item->producer->name,
                'producer_type' => $item->producer->producer_type,
                'is_validated' => $item->producer->is_validated,
                'product_label' => $item->product_label,
                'price_per_kg' => (float) $item->price_per_kg,
                'capacity_per_day' => (float) $item->capacity_per_day,
                'last_updated_at' => $item->producer->last_updated_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    public function update(Request $request, ProducerCommodity $producerCommodity)
    {
        $validated = $request->validate([
            'price_per_kg' => 'required|numeric|min:0',
            'capacity_per_day' => 'required|numeric|min:0',
        ]);

        $producerCommodity->update($validated);
        $producerCommodity->producer->update(['last_updated_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil diperbarui.',
        ]);
    }
}