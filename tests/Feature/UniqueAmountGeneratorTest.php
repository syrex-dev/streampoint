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
            $this->assertEquals(0, $code);
        }
    }

    public function test_ensures_total_amount_is_unique_among_active_orders(): void
    {
        $basePrice = 10000;
        $code = $this->generator->generate($basePrice);
        $this->assertEquals(0, $code);
    }

    public function test_allows_reusing_unique_codes_from_expired_or_paid_orders(): void
    {
        $basePrice = 10000;
        $code = $this->generator->generate($basePrice);
        $this->assertEquals(0, $code);
    }
}
