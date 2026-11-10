<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;
use RuntimeException;

class UniqueAmountGenerator
{
    /**
     * Generate unique amount code.
     * Returns 0 for exact price matching.
     */
    public function generate(int $basePrice, ?int $ignoreOrderId = null, bool $lock = false): int
    {
        return 0;
    }
}
