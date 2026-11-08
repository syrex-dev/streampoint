<?php

namespace Tests\Feature;

use App\Actions\Order\CancelOrderByBuyer;
use App\Actions\Order\CreateOrder;
use App\Actions\Order\CreateOrderData;
use App\Actions\Order\ReactivateOrder;
use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentMethodType;
use App\Enums\RentDuration;
use App\Exceptions\ActiveOrderExistsException;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductAccount;
use App\Models\ProductVariant;
use App\Models\Setting;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ActiveOrderRuleTest extends TestCase
{
    use RefreshDatabase;

    protected Product $rentProduct;
    protected ProductVariant $rentVariant;
    protected Product $buyProduct;
    protected ProductVariant $buyVariant;
    protected PaymentMethod $paymentMethod;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();

        Setting::current()->update([
            'max_daily_rent_quota' => 20,
        ]);

        $this->paymentMethod = PaymentMethod::create([
            'type' => PaymentMethodType::BANK,
            'label' => 'BCA Manual',
            'account_number' => '1234567890',
            'account_holder' => 'StreamPoint PT',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->rentProduct = Product::create([
            'name' => 'Netflix Premium',
            'slug' => 'netflix-premium',
            'description' => 'Netflix test',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->rentVariant = ProductVariant::create([
            'product_id' => $this->rentProduct->id,
            'name' => '1 Hari Sewa',
            'type' => OrderType::RENT,
            'rent_duration' => RentDuration::ONE_DAY,
            'duration_hours' => 24,
            'price' => 20000,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->buyProduct = Product::create([
            'name' => 'Canva Pro',
            'slug' => 'canva-pro',
            'description' => 'Canva test',
            'is_active' => true,
            'sort_order' => 2,
        ]);

        $this->buyVariant = ProductVariant::create([
            'product_id' => $this->buyProduct->id,
            'name' => '1 Bulan Beli',
            'type' => OrderType::BUY,
            'rent_duration' => null,
            'duration_hours' => 720,
            'price' => 35000,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        // Seed 10 available accounts for rent and 10 for buy
        for ($i = 1; $i <= 10; $i++) {
            ProductAccount::create([
                'product_id' => $this->rentProduct->id,
                'kind' => OrderType::RENT,
                'credential' => "rent{$i}@test.com|pass",
                'status' => AccountStatus::AVAILABLE,
            ]);

            ProductAccount::create([
                'product_id' => $this->buyProduct->id,
                'kind' => OrderType::BUY,
                'credential' => "buy{$i}@test.com|pass",
                'status' => AccountStatus::AVAILABLE,
            ]);
        }
    }

    protected function checkout(array $overrides = [], array $session = []): \Illuminate\Testing\TestResponse
    {
        $payload = array_merge([
            'variant_id' => $this->rentVariant->id,
            'customer_phone' => '081234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'customer_note' => '',
            'idempotency_key' => 'idem-' . bin2hex(random_bytes(6)),
            'hp_website' => '',
        ], $overrides);

        return $this->withSession($session)->post('/checkout', $payload);
    }

    /**
     * TECH_SPEC 12 #14: Order kedua dengan nomor sama ditolak saat PENDING (layanan sama dan beda).
     */
    public function test_second_order_with_same_phone_rejected_when_first_is_pending_same_and_different_service(): void
    {
        // 1. Create first order (RENT)
        $response1 = $this->checkout([
            'variant_id' => $this->rentVariant->id,
            'customer_phone' => '081234567890',
        ]);
        $response1->assertRedirect();
        $this->assertDatabaseCount('orders', 1);

        // 2. Try second order with same phone on same service (RENT)
        $response2 = $this->checkout([
            'variant_id' => $this->rentVariant->id,
            'customer_phone' => '081234567890',
        ]);
        $response2->assertSessionHasErrors(['customer_phone']);
        $this->assertDatabaseCount('orders', 1);

        // 3. Try second order with same phone on different service (BUY)
        $response3 = $this->checkout([
            'variant_id' => $this->buyVariant->id,
            'customer_phone' => '081234567890',
        ]);
        $response3->assertSessionHasErrors(['customer_phone']);
        $this->assertDatabaseCount('orders', 1);
    }

    /**
     * TECH_SPEC 12 #14: Order kedua ditolak saat order pertama berstatus VERIFYING.
     */
    public function test_second_order_with_same_phone_rejected_when_first_is_verifying(): void
    {
        Order::factory()->create([
            'customer_phone' => '6281234567890',
            'status' => OrderStatus::VERIFYING,
            'product_id' => $this->rentProduct->id,
            'variant_id' => $this->rentVariant->id,
            'payment_expires_at' => now()->addMinutes(15),
        ]);

        $response = $this->checkout([
            'variant_id' => $this->buyVariant->id,
            'customer_phone' => '081234567890',
        ]);

        $response->assertSessionHasErrors(['customer_phone']);
        $errors = session('errors')->get('customer_phone');
        $this->assertStringContainsString('diverifikasi', $errors[0]);
    }

    /**
     * TECH_SPEC 12 #14: Order kedua diizinkan setelah order pertama PAID, EXPIRED, atau CANCELLED.
     */
    public function test_second_order_allowed_after_first_order_is_paid_expired_or_cancelled(): void
    {
        foreach ([OrderStatus::PAID, OrderStatus::EXPIRED, OrderStatus::CANCELLED] as $status) {
            ProductAccount::query()->update(['status' => AccountStatus::AVAILABLE, 'order_id' => null]);

            $order = Order::factory()->create([
                'customer_phone' => '6281211112222',
                'status' => $status,
                'product_id' => $this->rentProduct->id,
                'variant_id' => $this->rentVariant->id,
                'payment_expires_at' => now()->subHour(),
            ]);

            $response = $this->checkout([
                'variant_id' => $this->buyVariant->id,
                'customer_phone' => '081211112222',
            ]);

            $response->assertRedirect();
            $this->assertDatabaseHas('orders', [
                'customer_phone' => '6281211112222',
                'variant_id' => $this->buyVariant->id,
                'status' => OrderStatus::PENDING,
            ]);

            // Clean up created second order for next iteration
            Order::where('variant_id', $this->buyVariant->id)->delete();
            $order->delete();
        }
    }

    /**
     * TECH_SPEC 12 #14: PENDING yang sudah lewat payment_expires_at tanpa scheduler tidak memblokir.
     */
    public function test_expired_pending_order_without_scheduler_does_not_block_new_order(): void
    {
        Order::factory()->create([
            'customer_phone' => '6281233334444',
            'status' => OrderStatus::PENDING,
            'product_id' => $this->rentProduct->id,
            'variant_id' => $this->rentVariant->id,
            'payment_expires_at' => now()->subMinute(), // Expired in time, but scheduler hasn't run
        ]);

        $response = $this->checkout([
            'variant_id' => $this->buyVariant->id,
            'customer_phone' => '081233334444',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('orders', [
            'customer_phone' => '6281233334444',
            'variant_id' => $this->buyVariant->id,
            'status' => OrderStatus::PENDING,
        ]);
    }

    /**
     * TECH_SPEC 12 #15: Format nomor berbeda (0812…, +62812…, 62812…) dianggap sama.
     */
    public function test_phone_numbers_with_different_formats_are_treated_as_same_buyer(): void
    {
        // First order with 0812...
        $this->checkout([
            'variant_id' => $this->rentVariant->id,
            'customer_phone' => '081299990000',
        ])->assertRedirect();

        // Second order with +62812...
        $response1 = $this->checkout([
            'variant_id' => $this->buyVariant->id,
            'customer_phone' => '+6281299990000',
        ]);
        $response1->assertSessionHasErrors(['customer_phone']);

        // Third order with 62812...
        $response2 = $this->checkout([
            'variant_id' => $this->buyVariant->id,
            'customer_phone' => '6281299990000',
        ]);
        $response2->assertSessionHasErrors(['customer_phone']);
    }

    /**
     * TECH_SPEC 12 #15: Sesi yang sama dengan nomor berbeda tetap ditolak.
     */
    public function test_same_session_with_different_phone_is_blocked(): void
    {
        // 1. Create first order with session
        $this->checkout([
            'variant_id' => $this->rentVariant->id,
            'customer_phone' => '081255556666',
        ], ['owned_invoices' => []])->assertRedirect();

        $firstOrder = Order::where('customer_phone', '6281255556666')->firstOrFail();

        // 2. Same session tries checkout with completely different phone
        $response = $this->checkout([
            'variant_id' => $this->buyVariant->id,
            'customer_phone' => '081277778888',
        ], ['owned_invoices' => [$firstOrder->invoice_code]]);

        $response->assertSessionHasErrors(['customer_phone']);
        $errors = session('errors')->get('customer_phone');
        $this->assertStringContainsString($firstOrder->invoice_code, $errors[0]);
    }

    /**
     * TECH_SPEC 12 #15: Sesi berbeda dengan nomor berbeda diizinkan (batasan terdokumentasi).
     */
    public function test_different_session_with_different_phone_is_allowed(): void
    {
        // Session A
        $this->checkout([
            'variant_id' => $this->rentVariant->id,
            'customer_phone' => '081210101010',
        ], ['owned_invoices' => []])->assertRedirect();

        // Session B with different phone
        $this->checkout([
            'variant_id' => $this->buyVariant->id,
            'customer_phone' => '081220202020',
        ], ['owned_invoices' => []])->assertRedirect();

        $this->assertDatabaseCount('orders', 2);
    }

    /**
     * TECH_SPEC 12 #16: Pesan penolakan memuat kode invoice HANYA untuk pemilik sesi.
     */
    public function test_rejection_message_contains_invoice_code_only_for_session_owner(): void
    {
        $order = Order::factory()->create([
            'customer_phone' => '6281244445555',
            'status' => OrderStatus::PENDING,
            'product_id' => $this->rentProduct->id,
            'variant_id' => $this->rentVariant->id,
            'payment_expires_at' => now()->addMinutes(15),
        ]);

        // Case A: Request from session holding the active invoice
        $responseSessionOwner = $this->checkout([
            'variant_id' => $this->buyVariant->id,
            'customer_phone' => '081244445555',
        ], ['owned_invoices' => [$order->invoice_code]]);

        $responseSessionOwner->assertSessionHasErrors(['customer_phone']);
        $ownerErrors = session('errors')->get('customer_phone');
        $this->assertStringContainsString($order->invoice_code, $ownerErrors[0]);
        $this->assertStringContainsString('Selesaikan pembayaran atau batalkan dulu', $ownerErrors[0]);

        // Case B: Request from stranger session (same phone, but not in owned_invoices)
        $responseStranger = $this->checkout([
            'variant_id' => $this->buyVariant->id,
            'customer_phone' => '081244445555',
        ], ['owned_invoices' => []]);

        $responseStranger->assertSessionHasErrors(['customer_phone']);
        $strangerErrors = session('errors')->get('customer_phone');
        // MUST NOT contain invoice code
        $this->assertStringNotContainsString($order->invoice_code, $strangerErrors[0]);
        $this->assertStringContainsString('Nomor ini masih punya pesanan yang belum selesai', $strangerErrors[0]);
    }

    /**
     * TECH_SPEC 12 #17: CancelOrderByBuyer: hanya pemilik, hanya PENDING, melepas kuota dan unit, aktor buyer.
     */
    public function test_cancel_order_by_buyer_releases_quota_and_account_and_logs_buyer_actor(): void
    {
        $account = ProductAccount::where('product_id', $this->rentProduct->id)
            ->where('status', AccountStatus::AVAILABLE)
            ->firstOrFail();

        $this->checkout([
            'variant_id' => $this->rentVariant->id,
            'customer_phone' => '081266667777',
        ], ['owned_invoices' => []])->assertRedirect();

        $order = Order::where('customer_phone', '6281266667777')->firstOrFail();
        $this->assertEquals(OrderStatus::PENDING, $order->status);
        $this->assertEquals(AccountStatus::RESERVED, $account->fresh()->status);

        // Buyer cancels their order
        $response = $this->withSession(['owned_invoices' => [$order->invoice_code]])
            ->post(route('invoice.cancel', $order->invoice_code));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $order->refresh();
        $this->assertEquals(OrderStatus::CANCELLED, $order->status);
        $this->assertNull($order->account_id);
        $this->assertEquals(AccountStatus::AVAILABLE, $account->fresh()->status);

        // Verify audit event
        $lastEvent = $order->events()->latest('id')->first();
        $this->assertNotNull($lastEvent);
        $this->assertEquals('buyer', $lastEvent->actor);
        $this->assertEquals(OrderStatus::CANCELLED, $lastEvent->to_status);

        // Now buyer can order again!
        $reorderResponse = $this->checkout([
            'variant_id' => $this->rentVariant->id,
            'customer_phone' => '081266667777',
        ], ['owned_invoices' => [$order->invoice_code]]);

        $reorderResponse->assertRedirect();
    }

    /**
     * TECH_SPEC 12 #17: CancelOrderByBuyer: tolak non-pemilik, VERIFYING, dan PAID.
     */
    public function test_cancel_order_by_buyer_rejects_unauthorized_session_verifying_and_paid_orders(): void
    {
        $order = Order::factory()->create([
            'customer_phone' => '6281288889999',
            'status' => OrderStatus::PENDING,
            'product_id' => $this->rentProduct->id,
            'variant_id' => $this->rentVariant->id,
            'payment_expires_at' => now()->addMinutes(15),
        ]);

        // Unauthorized session (not in owned_invoices) -> 403
        $this->withSession(['owned_invoices' => []])
            ->post(route('invoice.cancel', $order->invoice_code))
            ->assertForbidden();

        // Authorized session, but order is VERIFYING -> rejected
        $order->update(['status' => OrderStatus::VERIFYING]);
        $responseVerifying = $this->withSession(['owned_invoices' => [$order->invoice_code]])
            ->post(route('invoice.cancel', $order->invoice_code));
        $responseVerifying->assertSessionHasErrors(['cancel']);
        $this->assertStringContainsString('diverifikasi', session('errors')->get('cancel')[0]);

        // Authorized session, but order is PAID -> rejected
        $order->update(['status' => OrderStatus::PAID]);
        $responsePaid = $this->withSession(['owned_invoices' => [$order->invoice_code]])
            ->post(route('invoice.cancel', $order->invoice_code));
        $responsePaid->assertSessionHasErrors(['cancel']);
        $this->assertStringContainsString('sudah dibayar', session('errors')->get('cancel')[0]);
    }

    /**
     * TECH_SPEC 12 #17: CancelOrderByBuyer terkena throttle 5/menit.
     */
    public function test_cancel_order_by_buyer_is_rate_limited(): void
    {
        $order = Order::factory()->create([
            'customer_phone' => '6281200001111',
            'status' => OrderStatus::PENDING,
            'product_id' => $this->rentProduct->id,
            'variant_id' => $this->rentVariant->id,
            'payment_expires_at' => now()->addMinutes(15),
        ]);

        // Attempt 5 times without owned session (will abort 403, but hits throttle middleware)
        for ($i = 0; $i < 5; $i++) {
            $this->post(route('invoice.cancel', $order->invoice_code));
        }

        // 6th attempt should be 429 Too Many Requests
        $response = $this->post(route('invoice.cancel', $order->invoice_code));
        $response->assertStatus(429);
    }

    /**
     * TECH_SPEC 12 #18: ReactivateOrder ditolak bila nomor yang sama punya pesanan aktif lain.
     */
    public function test_reactivate_order_rejected_if_same_phone_has_another_active_order(): void
    {
        // Order 1: EXPIRED (wants to be reactivated)
        $expiredOrder = Order::factory()->create([
            'customer_phone' => '6281299991111',
            'status' => OrderStatus::EXPIRED,
            'product_id' => $this->rentProduct->id,
            'variant_id' => $this->rentVariant->id,
            'payment_expires_at' => now()->subDay(),
        ]);

        // Order 2: PENDING (active order for same phone)
        Order::factory()->create([
            'customer_phone' => '6281299991111',
            'status' => OrderStatus::PENDING,
            'product_id' => $this->buyProduct->id,
            'variant_id' => $this->buyVariant->id,
            'payment_expires_at' => now()->addMinutes(15),
        ]);

        $reactivateOrder = app(ReactivateOrder::class);

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('Nomor WhatsApp pembeli ini masih memiliki pesanan aktif lain yang belum selesai.');

        $reactivateOrder->handle($expiredOrder);
    }

    /**
     * TECH_SPEC 12 #19: Idempotensi: request ulang dengan idempotency_key sama tidak kena penolakan pesanan aktif.
     */
    public function test_idempotent_request_returns_same_order_without_active_order_rejection(): void
    {
        $key = 'race-idem-key-' . bin2hex(random_bytes(8));

        // First attempt with idempotency key
        $response1 = $this->checkout([
            'variant_id' => $this->rentVariant->id,
            'customer_phone' => '081277770000',
            'idempotency_key' => $key,
        ]);
        $response1->assertRedirect();

        $order = Order::where('customer_phone', '6281277770000')->firstOrFail();

        // Second attempt with exact same idempotency key and phone
        $response2 = $this->checkout([
            'variant_id' => $this->rentVariant->id,
            'customer_phone' => '081277770000',
            'idempotency_key' => $key,
        ]);

        // Should NOT be rejected with ActiveOrderExistsException, should redirect to same invoice
        $response2->assertRedirect(route('invoice.show', $order->invoice_code));
        $this->assertDatabaseCount('orders', 1);
    }
}
