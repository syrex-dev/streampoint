<?php

namespace App\Actions\Order;

use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Exceptions\InvalidStatusTransitionException;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class RejectOrder
{
    /**
     * Reject order and release account back to AVAILABLE.
     * Transitions from PENDING or VERIFYING to CANCELLED.
     */
    public function handle(Order $order, string $reason, string $actor = 'admin:1'): Order
    {
        $reason = trim($reason);
        if (empty($reason)) {
            throw new InvalidArgumentException('Alasan penolakan pesanan wajib diisi.');
        }

        return DB::transaction(function () use ($order, $reason, $actor) {
            $order = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            if (! $order->status->canTransitionTo(OrderStatus::CANCELLED)) {
                throw new InvalidStatusTransitionException($order->status->value, OrderStatus::CANCELLED->value);
            }

            $from = $order->status;

            if ($order->account_id) {
                $account = \App\Models\ProductAccount::where('id', $order->account_id)->lockForUpdate()->first();
                if ($account && in_array($account->status, [AccountStatus::RESERVED, AccountStatus::RENTED], true)) {
                    $account->update([
                        'status' => AccountStatus::AVAILABLE,
                        'order_id' => null,
                        'rented_until' => null,
                    ]);
                }
            }

            $order->update([
                'status' => OrderStatus::CANCELLED,
                'status_note' => $reason,
            ]);

            $order->events()->create([
                'from_status' => $from,
                'to_status' => OrderStatus::CANCELLED,
                'actor' => $actor,
                'note' => $reason,
            ]);

            return $order->fresh();
        });
    }
}
