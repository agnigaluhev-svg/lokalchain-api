<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExchangeRateLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'rate',
        'status',
        'checked_at',
    ];

    protected $casts = [
        'rate' => 'decimal:4',
        'checked_at' => 'datetime',
    ];
}