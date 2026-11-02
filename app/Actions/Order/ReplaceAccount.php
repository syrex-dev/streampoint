<?php

namespace App\Actions\Order;

use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Exceptions\OutOfStockException;
use App\Models\Order;
use App\Models\ProductAccount;
use DomainException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ReplaceAccount
{
    /**
     * Replace account for a PAID order under warranty.
     * Transitions old unit to DISABLED (order_id released).
     * Assigns new AVAILABLE unit with same product & kind.
     * Preserves access_starts_at and access_expires_at.
     * Requires reason and logs to order_events.
     */
    public function handle(Order $order, string $reason, ?int $newAccountId = null, string $actor = 'admin:1'): Order
    {
        $reason = trim($reason);
        if (empty($reason)) {
            throw new InvalidArgumentException('Alasan penggantian akun wajib diisi.');
        }

        return DB::transaction(function () use ($order, $reason, $newAccountId, $actor) {
            $order = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            if ($order->status !== OrderStatus::PAID) {
                throw new DomainException('Penggantian akun garansi hanya dapat dilakukan untuk pesanan yang berstatus Lunas (PAID).');
            }

            // Find replacement AVAILABLE unit of same product and kind
            if ($newAccountId) {
                $newAccount = ProductAccount::where('id', $newAccountId)
                    ->where('product_id', $order->product_id)
                    ->where('kind', $order->order_type)
                    ->where('status', AccountStatus::AVAILABLE)
                    ->lockForUpdate()
                    ->first();
            } else {
                $newAccount = ProductAccount::where('product_id', $order->product_id)
                    ->where('kind', $order->order_type)
                    ->where('status', AccountStatus::AVAILABLE)
                    ->lockForUpdate()
                    ->first();
            }

            if (! $newAccount) {
                throw new OutOfStockException('Tidak ada unit akun pengganti yang tersedia untuk layanan ini.');
            }

            // Disable old account if exists
            $oldAccount = null;
            if ($order->account_id) {
                $oldAccount = ProductAccount::where('id', $order->account_id)
                    ->lockForUpdate()
                    ->first();

                if ($oldAccount) {
                    $oldAccount->update([
                        'status' => AccountStatus::DISABLED,
                        'order_id' => null,
                        'rented_until' => null,
                        'note' => 'Digantikan pada pesanan ' . $order->invoice_code . ': ' . $reason,
                    ]);
                }
            }

            // Update new account status (SOLD for BUY, RENTED for RENT)
            if ($order->order_type === OrderType::BUY) {
                $newAccount->update([
                    'status' => AccountStatus::SOLD,
                    'order_id' => $order->id,
                    'rented_until' => null,
                ]);
            } else {
                $newAccount->update([
                    'status' => AccountStatus::RENTED,
                    'order_id' => $order->id,
                    'rented_until' => $order->access_expires_at,
                ]);
            }

            // Attach new account to order (access_starts_at and access_expires_at DO NOT change)
            $order->update([
                'account_id' => $newAccount->id,
            ]);

            $oldUnitId = $oldAccount?->id ?? '-';
            $order->events()->create([
                'from_status' => OrderStatus::PAID,
                'to_status' => OrderStatus::PAID,
                'actor' => $actor,
                'note' => "Penggantian akun (Garansi): {$reason} (Unit lama #{$oldUnitId} -> Unit baru #{$newAccount->id})",
            ]);

            return $order->fresh(['product', 'variant', 'account']);
        });
    }
}
