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

    /**
     * Snapshot data kuota untuk ditampilkan ke publik
     */
    public function snapshot(): array
    {
        $d = $this->today();
        $limit = $this->limitFor($d);
        $used = $this->used($d);

        return [
            'limit' => $limit,
            'used' => $used,
            'remaining' => max(0, $limit - $used),
            'is_full' => $used >= $limit,
            'resets_at' => now()->addDay()->startOfDay()->toIso8601String(),
        ];
    }
}
