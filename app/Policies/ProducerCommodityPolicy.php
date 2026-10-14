<?php

namespace App\Policies;

use App\Models\ProducerCommodity;
use App\Models\User;

class ProducerCommodityPolicy
{
    // Produsen hanya boleh mengubah produk milik usahanya sendiri
    public function update(User $user, ProducerCommodity $item): bool
    {
        return $user->hasRole('produsen')
            && (int) $item->producer->user_id === (int) $user->id;
    }
}