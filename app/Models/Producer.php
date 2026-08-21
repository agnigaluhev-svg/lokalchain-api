<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Producer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'producer_type',
        'is_validated',
        'latitude',
        'longitude',
        'address',
        'last_updated_at',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'is_validated' => 'boolean',
        'last_updated_at' => 'datetime',
    ];

    public function producerCommodities(): HasMany
    {
        return $this->hasMany(ProducerCommodity::class);
    }
}