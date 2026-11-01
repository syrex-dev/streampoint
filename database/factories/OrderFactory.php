<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductAccount;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $unique = fake()->numberBetween(1, 999);
        $basePrice = 15000;

        return [
            'invoice_code' => 'INV-' . date('Ymd') . '-' . strtoupper(Str::random(6)),
            'product_id' => Product::factory(),
            'variant_id' => ProductVariant::factory(),
            'account_id' => ProductAccount::factory(),
            'order_type' => OrderType::RENT,
            'customer_phone' => '6281234567890',
            'customer_note' => null,
            'payment_method_id' => PaymentMethod::factory(),
            'payment_method_label' => 'QRIS',
            'base_price' => $basePrice,
            'unique_code' => $unique,
            'total_amount' => $basePrice + $unique,
            'payment_proof_path' => null,
            'status' => OrderStatus::PENDING,
            'status_note' => null,
            'access_starts_at' => null,
            'access_expires_at' => null,
            'payment_expires_at' => now()->addMinutes(15),
            'quota_date' => now()->toDateString(),
            'paid_at' => null,
        ];
    }
}
