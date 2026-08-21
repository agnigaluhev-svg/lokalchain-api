<?php

namespace Database\Seeders;

use App\Models\Commodity;
use App\Models\Producer;
use App\Models\ProducerCommodity;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $kedelai = Commodity::create([
            'name' => 'Kedelai',
            'unit' => 'kg',
            'import_price_reference' => 11838,
        ]);

        Commodity::create([
            'name' => 'Gandum',
            'unit' => 'kg',
            'import_price_reference' => 9800,
        ]);

        $producers = [
            [
                'name' => 'Koperasi Tani Sanan',
                'producer_type' => 'KUD',
                'is_validated' => true,
                'latitude' => -7.9797,
                'longitude' => 112.6200,
                'address' => 'Sanan, Malang',
                'last_updated_at' => now(),
                'product_label' => 'Kedelai Lokal Grade A',
                'price' => 8200,
                'stock' => 2400,
            ],
            [
                'name' => 'UD Sumber Makmur',
                'producer_type' => 'UD',
                'is_validated' => true,
                'latitude' => -7.9553,
                'longitude' => 112.6144,
                'address' => 'Lowokwaru, Malang',
                'last_updated_at' => now()->subHours(3),
                'product_label' => 'Kedelai Premium Malang',
                'price' => 8050,
                'stock' => 5100,
            ],
            [
                'name' => 'Gapoktan Kendedes',
                'producer_type' => 'Gapoktan',
                'is_validated' => true,
                'latitude' => -7.9680,
                'longitude' => 112.6420,
                'address' => 'Kendedes, Malang',
                'last_updated_at' => now()->subHours(6),
                'product_label' => 'Kedelai Organik',
                'price' => 8650,
                'stock' => 800,
            ],
            [
                'name' => 'CV Agro Nusantara',
                'producer_type' => 'CV',
                'is_validated' => false,
                'latitude' => -7.9440,
                'longitude' => 112.6510,
                'address' => 'Blimbing, Malang',
                'last_updated_at' => now()->subHours(1),
                'product_label' => 'Kedelai Non-GMO',
                'price' => 8800,
                'stock' => 9800,
            ],
            [
                'name' => 'Pak Sutrisno (Petani)',
                'producer_type' => 'Petani',
                'is_validated' => true,
                'latitude' => -7.8720,
                'longitude' => 112.5240,
                'address' => 'Batu, Malang',
                'last_updated_at' => now()->subDays(10),
                'product_label' => 'Kedelai Lokal Organik',
                'price' => 7900,
                'stock' => 0,
            ],
            [
                'name' => 'Koperasi Tani Pakis',
                'producer_type' => 'KUD',
                'is_validated' => true,
                'latitude' => -7.9280,
                'longitude' => 112.6890,
                'address' => 'Pakis, Malang',
                'last_updated_at' => now()->subHours(8),
                'product_label' => 'Kedelai Lokal',
                'price' => 8300,
                'stock' => 1800,
            ],
        ];

        foreach ($producers as $data) {
            $producer = Producer::create([
                'name' => $data['name'],
                'producer_type' => $data['producer_type'],
                'is_validated' => $data['is_validated'],
                'latitude' => $data['latitude'],
                'longitude' => $data['longitude'],
                'address' => $data['address'],
                'last_updated_at' => $data['last_updated_at'],
            ]);

            ProducerCommodity::create([
                'producer_id' => $producer->id,
                'commodity_id' => $kedelai->id,
                'product_label' => $data['product_label'],
                'price_per_kg' => $data['price'],
                'capacity_per_day' => $data['stock'],
            ]);
        }
    }
}