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
        'change_percent',
        'checked_at',
    ];

    protected $casts = [
        'rate' => 'decimal:4',
        'change_percent' => 'decimal:4',
        'checked_at' => 'datetime',
    ];
}