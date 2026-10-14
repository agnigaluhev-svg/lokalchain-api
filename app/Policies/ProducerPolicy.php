<?php

namespace App\Policies;

use App\Models\Producer;
use App\Models\User;

class ProducerPolicy
{
    // Hanya KUD yang boleh menyetujui atau mencabut validasi
    public function setValidation(User $user, Producer $producer): bool
    {
        return $user->hasRole('kud');
    }
}