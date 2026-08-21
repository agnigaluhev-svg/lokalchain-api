<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProducerCommodity extends Model
{
    use HasFactory;

    protected $fillable = [
        'producer_id',
        'commodity_id',
        'product_label',
        'price_per_kg',
        'capacity_per_day',
    ];

    protected $casts = [
        'price_per_kg' => 'decimal:2',
        'capacity_per_day' => 'decimal:2',
    ];

    public function producer(): BelongsTo
    {
        return $this->belongsTo(Producer::class);
    }

    public function commodity(): BelongsTo
    {
        return $this->belongsTo(Commodity::class);
    }
}