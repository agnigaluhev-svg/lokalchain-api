<?php

namespace App\Http\Controllers;

use App\Models\Producer;
use App\Models\ProducerCommodity;
use Illuminate\Http\Request;

class ProducerController extends Controller
{
    private function formatItem(ProducerCommodity $item): array
    {
        return [
            'producer_commodity_id' => $item->id,
            'producer_id' => $item->producer->id,
            'name' => $item->producer->name,
            'producer_type' => $item->producer->producer_type,
            'address' => $item->producer->address,
            'is_validated' => (bool) $item->producer->is_validated,
            'product_label' => $item->product_label,
            'price_per_kg' => (float) $item->price_per_kg,
            'capacity_per_day' => (float) $item->capacity_per_day,
            'last_updated_at' => $item->producer->last_updated_at,
        ];
    }

    private function requireRole(Request $request, string $role): void
    {
        abort_unless($request->user()->role === $role, 403, 'Akses ditolak untuk peran Anda.');
    }

    // Produsen: lihat produk milik sendiri
    public function mine(Request $request)
    {
        $this->requireRole($request, 'produsen');

        $items = ProducerCommodity::with('producer')
            ->whereHas('producer', fn ($q) => $q->where('user_id', $request->user()->id))
            ->get()
            ->map(fn ($item) => $this->formatItem($item));

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    // Produsen: buat profil usaha + produk pertama
    public function storeProfile(Request $request)
    {
        $this->requireRole($request, 'produsen');

        $user = $request->user();

        if (Producer::where('user_id', $user->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Profil produsen sudah ada.',
            ], 422);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'producer_type' => 'required|in:Petani,KUD,UD,CV,Gapoktan',
            'address' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'commodity_id' => 'required|integer|exists:commodities,id',
            'product_label' => 'nullable|string|max:255',
            'price_per_kg' => 'required|numeric|min:0',
            'capacity_per_day' => 'required|numeric|min:0',
        ]);

        $producer = Producer::create([
            'user_id' => $user->id,
            'name' => $validated['name'],
            'producer_type' => $validated['producer_type'],
            'is_validated' => false,
            'address' => $validated['address'],
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'last_updated_at' => now(),
        ]);

        ProducerCommodity::create([
            'producer_id' => $producer->id,
            'commodity_id' => $validated['commodity_id'],
            'product_label' => $validated['product_label'] ?? null,
            'price_per_kg' => $validated['price_per_kg'],
            'capacity_per_day' => $validated['capacity_per_day'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profil produsen dibuat. Menunggu validasi KUD.',
        ], 201);
    }

    // Produsen: ubah harga dan stok milik sendiri
    public function update(Request $request, ProducerCommodity $producerCommodity)
    {
        $this->requireRole($request, 'produsen');

        abort_unless(
            (int) $producerCommodity->producer->user_id === (int) $request->user()->id,
            403,
            'Data ini bukan milik Anda.'
        );

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

    // KUD: lihat semua produsen
    public function index(Request $request)
    {
        $this->requireRole($request, 'kud');

        $items = ProducerCommodity::with('producer')
            ->get()
            ->map(fn ($item) => $this->formatItem($item));

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    // KUD: setujui atau cabut validasi produsen
    public function setValidation(Request $request, Producer $producer)
    {
        $this->requireRole($request, 'kud');

        $validated = $request->validate([
            'is_validated' => 'required|boolean',
        ]);

        $producer->update([
            'is_validated' => $validated['is_validated'],
            'validated_at' => $validated['is_validated'] ? now() : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => $validated['is_validated'] ? 'Produsen divalidasi.' : 'Validasi produsen dicabut.',
        ]);
    }
}