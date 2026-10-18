<?php

namespace App\Services;

use App\Models\ExchangeRateLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExchangeRateService
{
    protected string $baseUrl;
    protected string $apiKey;

    // Ambang pelemahan rupiah yang memicu mode krisis (persen)
    protected float $thresholdPercent = 3.0;

    // Pembanding: kurs sekitar 7 hari lalu
    protected int $baselineDays = 7;

    public function __construct()
    {
        $this->baseUrl = config('services.exchangerate.base_url');
        $this->apiKey = config('services.exchangerate.key');
    }

    public function fetchLatestRate(string $base = 'USD', string $target = 'IDR'): ?float
    {
        $response = Http::timeout(15)->get("{$this->baseUrl}/{$this->apiKey}/latest/{$base}");

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

        // Pembanding utama: data terakhir yang umurnya sudah >= 7 hari.
        // Kalau belum ada, pakai data tertua yang tersedia.
        $baseline = ExchangeRateLog::where('checked_at', '<=', now()->subDays($this->baselineDays))
            ->orderByDesc('checked_at')
            ->first()
            ?? ExchangeRateLog::orderBy('checked_at')->first();

        $changePercent = null;
        $status = 'normal';

        if ($baseline && (float) $baseline->rate > 0) {
            // Kurs = rupiah per 1 USD. Angka naik berarti rupiah MELEMAH.
            $changePercent = (($currentRate - (float) $baseline->rate) / (float) $baseline->rate) * 100;

            // Hanya pelemahan yang dianggap krisis, penguatan rupiah tidak.
            if ($changePercent >= $this->thresholdPercent) {
                $status = 'crisis';
            }
        }

        return ExchangeRateLog::create([
            'rate' => $currentRate,
            'status' => $status,
            'change_percent' => $changePercent,
            'checked_at' => now(),
        ]);
    }
}