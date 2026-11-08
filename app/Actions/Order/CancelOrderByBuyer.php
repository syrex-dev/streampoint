<?php

namespace App\Actions\Order;

use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\ProductAccount;
use DomainException;
use Illuminate\Support\Facades\DB;

class CancelOrderByBuyer
{
    /**
     * Cancel a PENDING order by the buyer.
     * Releasing quota, releasing reserved account unit, and writing audit event.
     * Rejects VERIFYING, PAID, EXPIRED, and already CANCELLED orders.
     */
    public function handle(Order $order): Order
    {
        return DB::transaction(function () use ($order) {
            $locked = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            if ($locked->status === OrderStatus::VERIFYING) {
                throw new DomainException('Pesanan yang sedang diverifikasi tidak dapat dibatalkan pembeli.');
            }

            if ($locked->status === OrderStatus::PAID) {
                throw new DomainException('Pesanan yang sudah dibayar tidak dapat dibatalkan.');
            }

            if ($locked->status !== OrderStatus::PENDING) {
                throw new DomainException('Hanya pesanan berstatus Menunggu Pembayaran yang dapat dibatalkan.');
            }

            if ($locked->payment_expires_at <= now()) {
                throw new DomainException('Batas waktu pembayaran pesanan ini telah berakhir.');
            }

            // Release reserved account unit if any
            if ($locked->account_id) {
                $account = ProductAccount::where('id', $locked->account_id)->lockForUpdate()->first();
                if ($account) {
                    $account->update([
                        'status' => AccountStatus::AVAILABLE,
                        'order_id' => null,
                    ]);
                }
            }

            $from = $locked->status;
            $locked->update([
                'status' => OrderStatus::CANCELLED,
                'status_note' => 'Dibatalkan oleh pembeli.',
                'account_id' => null,
            ]);

            $locked->events()->create([
                'from_status' => $from,
                'to_status' => OrderStatus::CANCELLED,
                'actor' => 'buyer',
                'note' => 'Dibatalkan oleh pembeli.',
            ]);

            return $locked;
        });
    }
}
