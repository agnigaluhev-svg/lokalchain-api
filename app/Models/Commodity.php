<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Commodity extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'unit',
    ];

    public function producerCommodities(): HasMany
    {
        return $this->hasMany(ProducerCommodity::class);
    }
}