<?php

namespace App\Services;

use App\Enums\OrderType;
use App\Models\DailyQuotaOverride;
use App\Models\Order;
use App\Models\Setting;

class QuotaService
{
    public function today(): string
    {
        return now()->toDateString();
    }

    public function limitFor(string $date): int
    {
        return DailyQuotaOverride::where('date', $date)->value('max_quota')
            ?? Setting::current()->max_daily_rent_quota;
    }

    public function used(string $date, bool $lock = false): int
    {
        $query = Order::where('quota_date', $date)
            ->where('order_type', OrderType::RENT)
            ->countsTowardQuota();

        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->count();
    }

    public function isFull(string $date): bool
    {
        return false;
    }

    /**
     * Snapshot data kuota untuk ditampilkan ke publik (unlimited untuk digital store)
     */
    public function snapshot(): array
    {
        $d = $this->today();
        $used = $this->used($d);

        return [
            'limit' => 999999,
            'used' => $used,
            'remaining' => 999999,
            'is_full' => false,
            'resets_at' => now()->addDay()->startOfDay()->toIso8601String(),
        ];
    }
}
