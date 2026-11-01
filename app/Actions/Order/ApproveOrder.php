<?php

namespace App\Actions\Order;

use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Exceptions\InvalidStatusTransitionException;
use App\Models\Order;
use App\Models\ProductAccount;
use DomainException;
use Illuminate\Support\Facades\DB;

class ApproveOrder
{
    /**
     * Approve order: transitions VERIFYING -> PAID.
     * Sets paid_at, access_starts_at, access_expires_at based on variant duration_hours.
     * Updates account: BUY -> SOLD, RENT -> RENTED + rented_until.
     * Optionally swaps assigned unit if new account is provided.
     */
    public function handle(Order $order, ?int $newAccountId = null, string $actor = 'admin:1'): Order
    {
        return DB::transaction(function () use ($order, $newAccountId, $actor) {
            $order = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            if (! $order->status->canTransitionTo(OrderStatus::PAID)) {
                throw new InvalidStatusTransitionException($order->status->value, OrderStatus::PAID->value);
            }

            $variant = $order->variant;
            if (! $variant) {
                throw new DomainException('Varian produk untuk pesanan ini tidak ditemukan.');
            }

            // Swap account unit if requested
            if ($newAccountId && (int) $newAccountId !== (int) $order->account_id) {
                $newAccount = ProductAccount::where('id', $newAccountId)
                    ->where('product_id', $order->product_id)
                    ->where('kind', $order->order_type->value)
                    ->where('status', AccountStatus::AVAILABLE)
                    ->lockForUpdate()
                    ->first();

                if (! $newAccount) {
                    throw new DomainException('Unit akun pengganti tidak tersedia atau tidak sesuai dengan layanan ini.');
                }

                // Release old account
                if ($order->account_id) {
                    ProductAccount::where('id', $order->account_id)
                        ->lockForUpdate()
                        ->update([
                            'status' => AccountStatus::AVAILABLE,
                            'order_id' => null,
                            'rented_until' => null,
                        ]);
                }

                $order->account_id = $newAccount->id;
            }

            $assignedAccount = ProductAccount::where('id', $order->account_id)
                ->lockForUpdate()
                ->firstOrFail();

            $now = now();
            $durationHours = max(1, (int) $variant->duration_hours);
            $accessExpiresAt = (clone $now)->addHours($durationHours);

            if ($order->order_type === OrderType::BUY) {
                $assignedAccount->update([
                    'status' => AccountStatus::SOLD,
                    'order_id' => $order->id,
                    'rented_until' => null,
                ]);
            } else {
                $assignedAccount->update([
                    'status' => AccountStatus::RENTED,
                    'order_id' => $order->id,
                    'rented_until' => $accessExpiresAt,
                ]);
            }

            $from = $order->status;

            $order->update([
                'account_id' => $assignedAccount->id,
                'status' => OrderStatus::PAID,
                'paid_at' => $now,
                'access_starts_at' => $now,
                'access_expires_at' => $accessExpiresAt,
            ]);

            $order->events()->create([
                'from_status' => $from,
                'to_status' => OrderStatus::PAID,
                'actor' => $actor,
                'note' => 'Pembayaran diverifikasi dan akun streaming dikirimkan ke pembeli.',
            ]);

            return $order->fresh(['product', 'variant', 'account']);
        });
    }
}
