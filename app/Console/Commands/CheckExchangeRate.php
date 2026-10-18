<?php

namespace App\Console\Commands;

use App\Services\ExchangeRateService;
use Illuminate\Console\Command;

class CheckExchangeRate extends Command
{
    protected $signature = 'rates:check';

    protected $description = 'Ambil kurs USD/IDR terbaru dan tentukan status normal atau krisis';

    public function handle(ExchangeRateService $service): int
    {
        try {
            $log = $service->checkAndLogRate();
        } catch (\Throwable $e) {
            $this->error('Gagal cek kurs: ' . $e->getMessage());
            return self::FAILURE;
        }

        $change = $log->change_percent === null
            ? 'belum ada pembanding'
            : number_format((float) $log->change_percent, 2) . '%';

        $this->info("Kurs: {$log->rate} | status: {$log->status} | perubahan: {$change}");

        return self::SUCCESS;
    }
}