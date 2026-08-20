<?php

namespace App\Http\Controllers;

use App\Models\ExchangeRateLog;
use App\Services\ExchangeRateService;

class ExchangeRateController extends Controller
{
    protected ExchangeRateService $exchangeRateService;

    public function __construct(ExchangeRateService $exchangeRateService)
    {
        $this->exchangeRateService = $exchangeRateService;
    }

    public function latest()
    {
        $latest = ExchangeRateLog::orderByDesc('checked_at')->first();

        if (!$latest) {
            return response()->json([
                'success' => false,
                'message' => 'Belum ada data kurs tersimpan. Jalankan endpoint /check terlebih dahulu.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $latest,
        ]);
    }

    public function check()
    {
        $log = $this->exchangeRateService->checkAndLogRate();

        return response()->json([
            'success' => true,
            'message' => 'Kurs berhasil diperbarui.',
            'data' => $log,
        ]);
    }

    public function history()
    {
        $logs = ExchangeRateLog::orderByDesc('checked_at')->limit(30)->get()->reverse()->values();

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }
}