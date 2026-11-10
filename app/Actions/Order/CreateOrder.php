<?php

namespace App\Actions\Order;

use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Exceptions\ActiveOrderExistsException;
use App\Exceptions\OutOfStockException;
use App\Exceptions\QuotaFullException;
use App\Jobs\SendAdminNotification;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\ProductAccount;
use App\Models\ProductVariant;
use App\Models\Setting;
use App\Services\InvoiceCodeGenerator;
use App\Services\QuotaService;
use App\Services\UniqueAmountGenerator;
use App\Support\Phone;
use Illuminate\Support\Facades\DB;

class CreateOrder
{
    public function __construct(
        protected QuotaService $quota,
        protected InvoiceCodeGenerator $invoice,
        protected UniqueAmountGenerator $uniqueAmount
    ) {}

    public function handle(CreateOrderData $data): Order
    {
        Setting::current(); // Ensure settings row exists before transaction begins

        return DB::transaction(function () use ($data) {
            // Serialization: lock the settings row first so concurrent checkouts serialize cleanly
            Setting::lockForUpdate()->firstOrFail();

            // Active order check (PRD 4.4b, TECH_SPEC 5.3)
            $phone = Phone::normalize($data->phone);

            $active = Order::query()
                ->where('customer_phone', $phone)
                ->countsAsActiveForBuyer()
                ->lockForUpdate()
                ->first();

            $sessionOwned = $data->ownedInvoices ?? (function_exists('session') ? session('owned_invoices', []) : []);
            $sessionActive = ! empty($sessionOwned) && is_array($sessionOwned)
                ? Order::whereIn('invoice_code', $sessionOwned)->countsAsActiveForBuyer()->lockForUpdate()->first()
                : null;

            if ($active || $sessionActive) {
                $target = $sessionActive ?? $active;
                throw new ActiveOrderExistsException(
                    invoiceCode: $target->invoice_code,
                    ownedBySession: (bool) $sessionActive,
                    isVerifying: $target->status === OrderStatus::VERIFYING
                );
            }

            $variant = ProductVariant::with('product')->where('is_active', true)->findOrFail($data->variantId);
            abort_unless($variant->product && $variant->product->is_active, 404, 'Layanan tidak aktif.');

            $paymentMethod = PaymentMethod::where('is_active', true)->findOrFail($data->paymentMethodId);

            $date = $this->quota->today();

            if ($variant->type === OrderType::RENT) {
                if ($this->quota->used($date, lock: true) >= $this->quota->limitFor($date)) {
                    throw new QuotaFullException();
                }
            }

            // Reserve an account unit with matching kind (RENT or BUY)
            $account = ProductAccount::where('product_id', $variant->product_id)
                ->where('kind', $variant->type)
                ->where('status', AccountStatus::AVAILABLE)
                ->lockForUpdate()
                ->first();

            if (! $account) {
                throw new OutOfStockException();
            }

            $unique = 0;
            $ttlMinutes = (int) env('ORDER_PAYMENT_TTL_MINUTES', 15);

            $order = Order::create([
                'invoice_code' => $this->invoice->generate(),
                'product_id' => $variant->product_id,
                'variant_id' => $variant->id,
                'account_id' => $account->id,
                'order_type' => $variant->type,
                'customer_phone' => Phone::normalize($data->phone),
                'customer_note' => $data->note,
                'payment_method_id' => $paymentMethod->id,
                'payment_method_label' => $paymentMethod->label,
                'base_price' => $variant->price,
                'unique_code' => 0,
                'total_amount' => $variant->price,
                'status' => OrderStatus::PENDING,
                'payment_expires_at' => now()->addMinutes($ttlMinutes),
                'quota_date' => $date,
            ]);

            $account->update([
                'status' => AccountStatus::RESERVED,
                'order_id' => $order->id,
            ]);

            // If remaining AVAILABLE stock for this product + kind <= 2, notify admin (deduped per 6 hours)
            $remainingStock = ProductAccount::where('product_id', $variant->product_id)
                ->where('kind', $variant->type)
                ->where('status', AccountStatus::AVAILABLE)
                ->count();

            if ($remainingStock <= 2) {
                $cacheKey = "stock_low_notified_{$variant->product_id}_{$variant->type->value}";
                if (\Illuminate\Support\Facades\Cache::add($cacheKey, true, now()->addHours(6))) {
                    SendAdminNotification::dispatch('stock.low', [
                        'product_id' => $variant->product_id,
                        'kind' => $variant->type->value,
                        'remaining' => $remainingStock,
                    ])->afterCommit();
                }
            }

            $order->events()->create([
                'from_status' => null,
                'to_status' => OrderStatus::PENDING,
                'actor' => 'buyer',
                'note' => 'Order dibuat.',
            ]);

            SendAdminNotification::dispatch('order.created', $order->id)->afterCommit();

            return $order;
        });
    }
}
