<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;
use RuntimeException;

class UniqueAmountGenerator
{
    /**
     * Generate unique random code between 1-999 such that basePrice + code
     * is unique among active orders (PENDING not expired, or VERIFYING).
     */
    public function generate(int $basePrice, ?int $ignoreOrderId = null): int
    {
        $query = Order::where(function ($q) {
            $q->where('status', OrderStatus::VERIFYING)
              ->orWhere(fn ($sq) => $sq->where('status', OrderStatus::PENDING)
                                       ->where('payment_expires_at', '>', now()));
        });

        if ($ignoreOrderId) {
            $query->where('id', '!=', $ignoreOrderId);
        }

        $activeAmounts = $query->pluck('total_amount')->all();

        $activeMap = array_flip($activeAmounts);

        // Try random attempts first
        for ($i = 0; $i < 50; $i++) {
            $code = random_int(100, 999);
            $total = $basePrice + $code;

            if (! isset($activeMap[$total])) {
                return $code;
            }
        }

        // Exhaustive fallback
        for ($code = 100; $code <= 999; $code++) {
            $total = $basePrice + $code;
            if (! isset($activeMap[$total])) {
                return $code;
            }
        }

        throw new RuntimeException('Semua kode unik sedang terpakai untuk nominal ini. Silakan coba sesaat lagi.');
    }
}
