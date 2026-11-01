<?php

namespace App\Actions\Order;

use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Models\Order;
use Illuminate\Support\Facades\DB;

class ExpireOrders
{
    /**
     * Expire all pending orders whose payment window has passed, and release reserved accounts.
     * Idempotent and safe to run repeatedly.
     */
    public function handle(): int
    {
        return DB::transaction(function () {
            $expiredCount = 0;

            $orders = Order::where('status', OrderStatus::PENDING)
                ->where('payment_expires_at', '<=', now())
                ->lockForUpdate()
                ->get();

            foreach ($orders as $order) {
                if (! $order->status->canTransitionTo(OrderStatus::EXPIRED)) {
                    continue;
                }

                if ($order->account_id && $order->account) {
                    if ($order->account->status === AccountStatus::RESERVED) {
                        $order->account->update([
                            'status' => AccountStatus::AVAILABLE,
                            'order_id' => null,
                        ]);
                    }
                }

                $order->update(['status' => OrderStatus::EXPIRED]);

                $order->events()->create([
                    'from_status' => OrderStatus::PENDING,
                    'to_status' => OrderStatus::EXPIRED,
                    'actor' => 'system',
                    'note' => 'Batas waktu pembayaran 15 menit habis.',
                ]);

                $expiredCount++;
            }

            return $expiredCount;
        });
    }
}
