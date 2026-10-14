<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Producer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'producer_type',
        'is_validated',
        'validated_at',
        'latitude',
        'longitude',
        'address',
        'last_updated_at',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'is_validated' => 'boolean',
        'validated_at' => 'datetime',
        'last_updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function producerCommodities(): HasMany
    {
        return $this->hasMany(ProducerCommodity::class);
    }
}