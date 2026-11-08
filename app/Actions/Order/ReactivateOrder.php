<?php

namespace App\Actions\Order;

use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Exceptions\InvalidStatusTransitionException;
use App\Exceptions\OutOfStockException;
use App\Exceptions\QuotaFullException;
use App\Models\Order;
use App\Models\ProductAccount;
use App\Services\QuotaService;
use App\Services\UniqueAmountGenerator;
use Illuminate\Support\Facades\DB;

class ReactivateOrder
{
    public function __construct(
        protected QuotaService $quotaService,
        protected UniqueAmountGenerator $uniqueAmountGenerator,
    ) {}

    /**
     * Reactivate an EXPIRED order to PENDING (or VERIFYING if payment proof exists).
     * Validates quota for RENT, reserves an AVAILABLE account unit,
     * resets payment_expires_at, guarantees unique total_amount, and writes audit event.
     */
    public function handle(Order $order, string $actor = 'admin:1'): Order
    {
        return DB::transaction(function () use ($order, $actor) {
            $order = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            $targetStatus = ! empty($order->payment_proof_path)
                ? OrderStatus::VERIFYING
                : OrderStatus::PENDING;

            if (! $order->status->canTransitionTo($targetStatus)) {
                throw new InvalidStatusTransitionException($order->status->value, $targetStatus->value);
            }

            // Reject if buyer already has another active order (PRD 4.4b, TECH_SPEC 12 #18)
            $hasActive = Order::where('customer_phone', $order->customer_phone)
                ->where('id', '!=', $order->id)
                ->countsAsActiveForBuyer()
                ->exists();

            if ($hasActive) {
                throw new \DomainException('Nomor WhatsApp pembeli ini masih memiliki pesanan aktif lain yang belum selesai.');
            }

            // 1. Quota check for RENT
            if ($order->order_type === OrderType::RENT) {
                $quotaDate = $order->quota_date ? $order->quota_date->toDateString() : now()->toDateString();
                $limit = $this->quotaService->limitFor($quotaDate);
                $used = $this->quotaService->used($quotaDate);

                if ($used >= $limit) {
                    throw new QuotaFullException('Slot kuota sewa untuk tanggal pesanan ini sudah penuh.');
                }
            }

            // 2. Stock check
            $availableAccount = ProductAccount::where('product_id', $order->product_id)
                ->where('kind', $order->order_type->value)
                ->where('status', AccountStatus::AVAILABLE)
                ->lockForUpdate()
                ->first();

            if (! $availableAccount) {
                throw new OutOfStockException('Unit akun untuk layanan ini sedang tidak tersedia.');
            }

            // 3. Reserve unit
            $availableAccount->update([
                'status' => AccountStatus::RESERVED,
                'order_id' => $order->id,
            ]);

            // 4. Ensure total_amount is unique among active orders
            $activeAmounts = Order::where(function ($q) {
                $q->where('status', OrderStatus::VERIFYING)
                  ->orWhere(fn ($sq) => $sq->where('status', OrderStatus::PENDING)
                                           ->where('payment_expires_at', '>', now()));
            })->where('id', '!=', $order->id)->pluck('total_amount')->all();

            $uniqueCode = $order->unique_code;
            $totalAmount = $order->total_amount;

            if (in_array($totalAmount, $activeAmounts, true) || $uniqueCode < 100) {
                $uniqueCode = $this->uniqueAmountGenerator->generate($order->base_price, $order->id);
                $totalAmount = $order->base_price + $uniqueCode;
            }

            // 5. Reset payment expiration
            $ttlMinutes = (int) config('order.payment_ttl_minutes', 15);
            $paymentExpiresAt = now()->addMinutes($ttlMinutes > 0 ? $ttlMinutes : 15);

            $from = $order->status;

            // 6. Update order
            $order->update([
                'account_id' => $availableAccount->id,
                'unique_code' => $uniqueCode,
                'total_amount' => $totalAmount,
                'status' => $targetStatus,
                'status_note' => null,
                'payment_expires_at' => $paymentExpiresAt,
            ]);

            // 7. Audit log
            $order->events()->create([
                'from_status' => $from,
                'to_status' => $targetStatus,
                'actor' => $actor,
                'note' => 'Pesanan diaktifkan kembali oleh admin.',
            ]);

            return $order->fresh(['product', 'variant', 'account']);
        });
    }
}
