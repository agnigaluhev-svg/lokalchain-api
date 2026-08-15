<?php

namespace App\Services;

use App\Models\ExchangeRateLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExchangeRateService
{
    protected string $baseUrl;
    protected string $apiKey;
    protected float $thresholdPercent = 3.0;

    public function __construct()
    {
        $this->baseUrl = config('services.exchangerate.base_url');
        $this->apiKey = config('services.exchangerate.key');
    }

    public function fetchLatestRate(string $base = 'USD', string $target = 'IDR'): ?float
    {
        $response = Http::get("{$this->baseUrl}/{$this->apiKey}/latest/{$base}");

        if (!$response->successful()) {
            Log::error('Gagal mengambil data kurs dari ExchangeRate-API', [
                'status' => $response->status(),
            ]);
            return null;
        }

        $data = $response->json();

        return $data['conversion_rates'][$target] ?? null;
    }

    public function checkAndLogRate(): ExchangeRateLog
    {
        $currentRate = $this->fetchLatestRate();

        if ($currentRate === null) {
            throw new \Exception('Tidak bisa mengambil data kurs saat ini.');
        }

        $previousLog = ExchangeRateLog::orderByDesc('checked_at')
            ->where('checked_at', '<=', now()->subDays(7))
            ->first();

        $status = 'normal';

        if ($previousLog) {
            $changePercent = (($currentRate - $previousLog->rate) / $previousLog->rate) * 100;

            if (abs($changePercent) >= $this->thresholdPercent) {
                $status = 'crisis';
            }
        }

        return ExchangeRateLog::create([
            'rate' => $currentRate,
            'status' => $status,
            'checked_at' => now(),
        ]);
    }
}