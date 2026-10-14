<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ADMIN_EMAIL');
        $password = env('ADMIN_PASSWORD');

        if (!$email || !$password) {
            $this->command->error('ADMIN_EMAIL dan ADMIN_PASSWORD belum diisi di file .env');
            return;
        }

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => env('ADMIN_NAME', 'Administrator LokalChain'),
                'password' => $password,
                'role' => 'admin',
                'is_active' => true,
            ]
        );

        $this->command->info("Akun admin siap: {$email}");
    }
}