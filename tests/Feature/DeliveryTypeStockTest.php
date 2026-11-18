<?php

namespace Tests\Feature;

use App\Actions\Order\ApproveOrder;
use App\Enums\AccountStatus;
use App\Enums\DeliveryType;
use App\Enums\FulfillmentStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductAccount;
use App\Models\ProductVariant;
use App\Models\User;
use App\Services\AvailabilityService;
use App\Support\BuyerFieldsSchema;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class DeliveryTypeStockTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Product $product;
    protected ProductVariant $variant;
    protected PaymentMethod $paymentMethod;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['is_admin' => true]);

        $this->product = Product::create([
            'name' => 'Canva Pro',
            'slug' => 'canva-pro',
            'category' => 'Desain',
            'is_active' => true,
        ]);

        $this->variant = ProductVariant::create([
            'product_id' => $this->product->id,
            'name' => '1 Bulan Private',
            'type' => OrderType::BUY,
            'delivery_type' => DeliveryType::STOCK,
            'duration_hours' => 720,
            'price' => 25000,
            'is_active' => true,
            'sort_order' => 1,
            'stock_fields' => ['email', 'password'],
            'buyer_fields' => [
                [
                    'key' => 'target_email',
                    'label' => 'Email Canva Anda',
                    'type' => 'email',
                    'required' => true,
                    'allowed_domains' => ['gmail.com'],
                ],
            ],
            'delivery_instructions' => 'Buka canva.com lalu login dengan akun yang diberikan.',
            'eta_text' => 'Instan 1-5 detik',
        ]);

        $this->paymentMethod = PaymentMethod::create([
            'type' => 'QRIS',
            'label' => 'QRIS Otomatis',
            'is_active' => true,
        ]);
    }

    public function test_buyer_fields_schema_rejects_password_labels(): void
    {
        $this->expectException(ValidationException::class);

        BuyerFieldsSchema::validateDefinition([
            [
                'key' => 'password',
                'label' => 'Kata Sandi Akun',
                'type' => 'text',
                'required' => true,
            ],
        ]);
    }

    public function test_buyer_fields_schema_validates_type_limits_and_domains(): void
    {
        $sixFields = array_map(fn ($i) => [
            'key' => "field_{$i}",
            'label' => "Field {$i}",
            'type' => 'text',
            'required' => false,
        ], range(1, 6));

        try {
            BuyerFieldsSchema::validateDefinition($sixFields);
            $this->fail('Expected ValidationException for exceeding 5 fields');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('buyer_fields', $e->errors());
        }

        // Invalid email domain when allowed_domains is set to ['gmail.com']
        $ruleArray = BuyerFieldsSchema::rulesForVariant($this->variant);
        $validator = validator(
            ['buyer_inputs' => ['target_email' => 'user@invalid-domain-xyz123.fake']],
            $ruleArray
        );

        $this->assertTrue($validator->fails());
    }

    public function test_availability_service_for_stock_prioritizes_variant_specific(): void
    {
        $service = new AvailabilityService();

        // Initially no units
        $avail = $service->forVariant($this->variant);
        $this->assertFalse($avail['available']);

        // Add a variant-specific unit
        ProductAccount::create([
            'product_id' => $this->product->id,
            'variant_id' => $this->variant->id,
            'kind' => OrderType::BUY,
            'credential' => 'user1@example.com|pass123',
            'status' => AccountStatus::AVAILABLE,
        ]);

        $avail = $service->forVariant($this->variant);
        $this->assertTrue($avail['available']);
        $this->assertEquals(1, $avail['remaining']);
    }

    public function test_checkout_saves_buyer_inputs_and_approving_stock_sets_delivered(): void
    {
        ProductAccount::create([
            'product_id' => $this->product->id,
            'variant_id' => $this->variant->id,
            'kind' => OrderType::BUY,
            'credential' => 'user1@canva.com|canvapass',
            'status' => AccountStatus::AVAILABLE,
        ]);

        $response = $this->post('/checkout', [
            'variant_id' => $this->variant->id,
            'customer_phone' => '081299998888',
            'payment_method_id' => $this->paymentMethod->id,
            'idempotency_key' => 'idemp-stock-test-1',
            'hp_website' => '',
            'buyer_inputs' => [
                'target_email' => 'buyer@gmail.com',
            ],
        ]);

        $response->assertStatus(302);

        $order = Order::latest()->first();
        $this->assertNotNull($order);
        $this->assertEquals('buyer@gmail.com', $order->buyer_inputs['target_email'] ?? null);

        // Buyer confirms payment -> status VERIFYING
        $order->update(['status' => OrderStatus::VERIFYING]);

        // Simulate admin approval
        app(ApproveOrder::class)->handle($order, null, $this->admin);

        $order->refresh();
        $this->assertEquals(OrderStatus::PAID, $order->status);
        $this->assertEquals(FulfillmentStatus::DELIVERED, $order->fulfillment_status);
    }

    public function test_invoice_displays_generic_stock_items(): void
    {
        $account = ProductAccount::create([
            'product_id' => $this->product->id,
            'variant_id' => $this->variant->id,
            'kind' => OrderType::BUY,
            'credential' => 'login@canva.com|secretpassword',
            'status' => AccountStatus::SOLD,
        ]);

        $order = Order::create([
            'invoice_code' => 'INV-STOCK-TEST-01',
            'product_id' => $this->product->id,
            'variant_id' => $this->variant->id,
            'account_id' => $account->id,
            'order_type' => OrderType::BUY,
            'status' => OrderStatus::PAID,
            'fulfillment_status' => FulfillmentStatus::DELIVERED,
            'payment_method_label' => 'QRIS Otomatis',
            'base_price' => 25000,
            'unique_code' => 55,
            'total_amount' => 25055,
            'quota_date' => now()->toDateString(),
            'customer_phone' => '6281299998888',
            'payment_expires_at' => now()->addMinutes(30),
        ]);

        $response = $this->withSession(['owned_invoices' => [$order->invoice_code]])
            ->get("/invoice/{$order->invoice_code}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('order.credentials.items', 2)
            ->where('order.credentials.items.0.value', 'login@canva.com')
            ->where('order.credentials.items.1.is_secret', true)
        );
    }
}
