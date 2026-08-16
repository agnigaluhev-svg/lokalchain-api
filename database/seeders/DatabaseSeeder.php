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
        $kedelai = Commodity::create(['name' => 'Kedelai', 'unit' => 'kg']);
        $gandum = Commodity::create(['name' => 'Gandum', 'unit' => 'kg']);

        $producers = [
            [
                'name' => 'Koperasi Tani Sanan',
                'latitude' => -7.9797,
                'longitude' => 112.6200,
                'address' => 'Sanan, Malang',
                'last_updated_at' => now(),
                'price' => 8000,
            ],
            [
                'name' => 'UD Sumber Kedelai',
                'latitude' => -7.9553,
                'longitude' => 112.6144,
                'address' => 'Lowokwaru, Malang',
                'last_updated_at' => now()->subDays(2),
                'price' => 7800,
            ],
            [
                'name' => 'Petani Gandum Batu',
                'latitude' => -7.8720,
                'longitude' => 112.5240,
                'address' => 'Batu, Malang',
                'last_updated_at' => now()->subDays(10),
                'price' => 9200,
            ],
            [
                'name' => 'Koperasi Agro Surabaya',
                'latitude' => -7.2575,
                'longitude' => 112.7521,
                'address' => 'Surabaya',
                'last_updated_at' => now()->subHours(5),
                'price' => 7500,
            ],
        ];

        foreach ($producers as $data) {
            $producer = Producer::create([
                'name' => $data['name'],
                'latitude' => $data['latitude'],
                'longitude' => $data['longitude'],
                'address' => $data['address'],
                'last_updated_at' => $data['last_updated_at'],
            ]);

            ProducerCommodity::create([
                'producer_id' => $producer->id,
                'commodity_id' => $kedelai->id,
                'price_per_kg' => $data['price'],
                'capacity_per_day' => 500,
            ]);
        }
    }
}