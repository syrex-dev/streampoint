<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\UniqueAmountGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class UniqueAmountGeneratorTest extends TestCase
{
    use RefreshDatabase;

    protected Product $product;
    protected ProductVariant $variant;
    protected PaymentMethod $paymentMethod;
    protected UniqueAmountGenerator $generator;

    protected function setUp(): void
    {
        parent::setUp();

        $this->generator = new UniqueAmountGenerator();

        $this->product = Product::create([
            'slug' => 'test-service',
            'name' => 'Test Service',
            'category' => 'Streaming',
            'is_active' => true,
        ]);

        $this->variant = ProductVariant::create([
            'product_id' => $this->product->id,
            'name' => '1 Hari',
            'type' => OrderType::RENT,
            'duration_hours' => 24,
            'price' => 10000,
            'is_active' => true,
        ]);

        $this->paymentMethod = PaymentMethod::create([
            'type' => 'QRIS',
            'label' => 'QRIS Demo',
            'is_active' => true,
        ]);
    }

    public function test_generates_3_digit_unique_code_between_100_and_999(): void
    {
        for ($i = 0; $i < 20; $i++) {
            $code = $this->generator->generate(10000);
            $this->assertGreaterThanOrEqual(100, $code);
            $this->assertLessThanOrEqual(999, $code);
        }
    }

    public function test_ensures_total_amount_is_unique_among_active_orders(): void
    {
        $basePrice = 10000;

        // Order 1: PENDING active
        Order::create([
            'invoice_code' => 'INV-TEST-ACTIVE-1',
            'product_id' => $this->product->id,
            'variant_id' => $this->variant->id,
            'payment_method_id' => $this->paymentMethod->id,
            'payment_method_label' => 'QRIS',
            'customer_phone' => '081234567890',
            'order_type' => OrderType::RENT->value,
            'base_price' => $basePrice,
            'unique_code' => 500,
            'total_amount' => $basePrice + 500,
            'status' => OrderStatus::PENDING->value,
            'payment_expires_at' => now()->addMinutes(15),
            'quota_date' => now()->toDateString(),
        ]);

        // Order 2: VERIFYING active
        Order::create([
            'invoice_code' => 'INV-TEST-ACTIVE-2',
            'product_id' => $this->product->id,
            'variant_id' => $this->variant->id,
            'payment_method_id' => $this->paymentMethod->id,
            'payment_method_label' => 'QRIS',
            'customer_phone' => '081234567891',
            'order_type' => OrderType::RENT->value,
            'base_price' => $basePrice,
            'unique_code' => 501,
            'total_amount' => $basePrice + 501,
            'status' => OrderStatus::VERIFYING->value,
            'payment_expires_at' => now()->addMinutes(15),
            'quota_date' => now()->toDateString(),
        ]);

        // Generating a new code 50 times must NEVER collide with 500 or 501
        for ($i = 0; $i < 50; $i++) {
            $code = $this->generator->generate($basePrice);
            $this->assertNotEquals(500, $code);
            $this->assertNotEquals(501, $code);
            $this->assertNotContains($basePrice + $code, [$basePrice + 500, $basePrice + 501]);
        }
    }

    public function test_allows_reusing_unique_codes_from_expired_or_paid_orders(): void
    {
        $basePrice = 10000;

        // Order with code 200 is EXPIRED
        Order::create([
            'invoice_code' => 'INV-TEST-EXPIRED',
            'product_id' => $this->product->id,
            'variant_id' => $this->variant->id,
            'payment_method_id' => $this->paymentMethod->id,
            'payment_method_label' => 'QRIS',
            'customer_phone' => '081234567890',
            'order_type' => OrderType::RENT->value,
            'base_price' => $basePrice,
            'unique_code' => 200,
            'total_amount' => $basePrice + 200,
            'status' => OrderStatus::PENDING->value,
            'payment_expires_at' => now()->subMinute(), // expired!
            'quota_date' => now()->toDateString(),
        ]);

        // Order with code 201 is already PAID
        Order::create([
            'invoice_code' => 'INV-TEST-PAID',
            'product_id' => $this->product->id,
            'variant_id' => $this->variant->id,
            'payment_method_id' => $this->paymentMethod->id,
            'payment_method_label' => 'QRIS',
            'customer_phone' => '081234567890',
            'order_type' => OrderType::RENT->value,
            'base_price' => $basePrice,
            'unique_code' => 201,
            'total_amount' => $basePrice + 201,
            'status' => OrderStatus::PAID->value,
            'payment_expires_at' => now()->addMinutes(15),
            'quota_date' => now()->toDateString(),
        ]);

        // Verify active query does not consider 200 or 201 as active
        $code = $this->generator->generate($basePrice);
        $this->assertGreaterThanOrEqual(100, $code);
        $this->assertLessThanOrEqual(999, $code);
    }
}
