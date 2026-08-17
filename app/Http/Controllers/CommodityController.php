<?php

namespace App\Http\Controllers;

use App\Models\Commodity;

class CommodityController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Commodity::all(),
        ]);
    }
}