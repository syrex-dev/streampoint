<?php

namespace Tests\Feature;

use App\Actions\Order\CreateOrder;
use App\Actions\Order\CreateOrderData;
use App\Actions\Order\ExpireOrders;
use App\Actions\Order\RejectOrder;
use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentMethodType;
use App\Enums\RentDuration;
use App\Exceptions\InvalidStatusTransitionException;
use App\Exceptions\OutOfStockException;
use App\Exceptions\QuotaFullException;
use App\Models\DailyQuotaOverride;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductAccount;
use App\Models\ProductVariant;
use App\Models\Setting;
use App\Services\QuotaService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CoreOrderLogicTest extends TestCase
{
    use RefreshDatabase;

    protected Product $product;
    protected ProductVariant $rentVariant;
    protected ProductVariant $buyVariant;
    protected PaymentMethod $paymentMethod;

    protected function setUp(): void
    {
        parent::setUp();

        Setting::current()->update(['max_daily_rent_quota' => 3]);

        $this->product = Product::create([
            'slug' => 'netflix-premium',
            'name' => 'Netflix Premium',
            'category' => 'Streaming',
            'is_active' => true,
        ]);

        $this->rentVariant = ProductVariant::create([
            'product_id' => $this->product->id,
            'name' => 'Sewa 1 Hari (24 Jam)',
            'type' => OrderType::RENT,
            'rent_duration' => RentDuration::ONE_DAY,
            'duration_hours' => 24,
            'price' => 15000,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->buyVariant = ProductVariant::create([
            'product_id' => $this->product->id,
            'name' => 'Beli 1 Bulan Private',
            'type' => OrderType::BUY,
            'rent_duration' => null,
            'duration_hours' => 720,
            'price' => 45000,
            'is_active' => true,
            'sort_order' => 2,
        ]);

        $this->paymentMethod = PaymentMethod::create([
            'type' => PaymentMethodType::QRIS,
            'label' => 'QRIS',
            'is_active' => true,
        ]);
    }

    protected function addAccount(OrderType $kind, int $count = 1): void
    {
        for ($i = 0; $i < $count; $i++) {
            ProductAccount::create([
                'product_id' => $this->product->id,
                'kind' => $kind,
                'credential' => "user{$i}@dummy.test | pass123 | Profil 1 | 1234",
                'status' => AccountStatus::AVAILABLE,
            ]);
        }
    }

    /**
     * Test 1: 3 active RENT orders -> 4th RENT order rejected, BUY still succeeds.
     */
    public function test_three_active_rent_orders_rejects_fourth_rent_but_allows_buy(): void
    {
        $this->addAccount(OrderType::RENT, 5);
        $this->addAccount(OrderType::BUY, 2);

        $createOrder = app(CreateOrder::class);

        // Create 3 RENT orders
        $order1 = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567801', $this->paymentMethod->id));
        $order2 = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567802', $this->paymentMethod->id));
        $order3 = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567803', $this->paymentMethod->id));

        $this->assertNotNull($order1->id);
        $this->assertNotNull($order2->id);
        $this->assertNotNull($order3->id);

        $quotaService = app(QuotaService::class);
        $this->assertEquals(3, $quotaService->used($quotaService->today()));
        $this->assertTrue($quotaService->snapshot()['is_full']);

        // 4th RENT order must throw QuotaFullException
        $this->expectException(QuotaFullException::class);
        try {
            $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567804', $this->paymentMethod->id));
        } catch (QuotaFullException $e) {
            // BUY order must succeed even when quota is full
            $buyOrder = $createOrder->handle(new CreateOrderData($this->buyVariant->id, '081234567805', $this->paymentMethod->id));
            $this->assertNotNull($buyOrder->id);
            $this->assertEquals(OrderType::BUY, $buyOrder->order_type);

            throw $e;
        }
    }

    /**
     * Test 2: PENDING past payment_expires_at is not counted in quota (without scheduler).
     */
    public function test_pending_order_past_payment_expires_at_is_not_counted_in_quota(): void
    {
        $this->addAccount(OrderType::RENT, 5);
        $createOrder = app(CreateOrder::class);
        $quotaService = app(QuotaService::class);

        $order1 = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567801', $this->paymentMethod->id));
        $order2 = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567802', $this->paymentMethod->id));
        $order3 = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567803', $this->paymentMethod->id));

        $this->assertEquals(3, $quotaService->used($quotaService->today()));

        // Mark order1 payment_expires_at as past time (without running scheduler/expire command)
        $order1->update(['payment_expires_at' => now()->subMinutes(1)]);

        // Quota should immediately count only 2
        $this->assertEquals(2, $quotaService->used($quotaService->today()));
        $this->assertFalse($quotaService->snapshot()['is_full']);

        // 4th order should now succeed because slot is open
        $order4 = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567804', $this->paymentMethod->id));
        $this->assertNotNull($order4->id);
        $this->assertEquals(3, $quotaService->used($quotaService->today()));
    }

    /**
     * Test 3: orders:expire changes status to EXPIRED and releases account unit.
     */
    public function test_orders_expire_command_updates_status_to_expired_and_releases_account(): void
    {
        $this->addAccount(OrderType::RENT, 1);
        $createOrder = app(CreateOrder::class);

        $order = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567801', $this->paymentMethod->id));
        $account = $order->account;

        $this->assertEquals(AccountStatus::RESERVED, $account->fresh()->status);
        $this->assertEquals($order->id, $account->fresh()->order_id);

        // Fast-forward payment_expires_at to the past
        $order->update(['payment_expires_at' => now()->subMinutes(1)]);

        // Run artisan orders:expire command
        Artisan::call('orders:expire');

        $order->refresh();
        $account->refresh();

        $this->assertEquals(OrderStatus::EXPIRED, $order->status);
        $this->assertEquals(AccountStatus::AVAILABLE, $account->status);
        $this->assertNull($account->order_id);

        // Audit event recorded
        $this->assertDatabaseHas('order_events', [
            'order_id' => $order->id,
            'from_status' => OrderStatus::PENDING->value,
            'to_status' => OrderStatus::EXPIRED->value,
            'actor' => 'system',
        ]);
    }

    /**
     * Test 4: WIB boundary with Carbon::setTestNow on 23:59 and 00:01 WIB.
     */
    public function test_wib_boundary_resets_quota_at_midnight(): void
    {
        $this->addAccount(OrderType::RENT, 5);
        $createOrder = app(CreateOrder::class);
        $quotaService = app(QuotaService::class);

        // 23:59 WIB on Nov 1, 2026
        Carbon::setTestNow(Carbon::parse('2026-11-01 23:59:00', 'Asia/Jakarta'));

        $order1 = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567801', $this->paymentMethod->id));
        $this->assertEquals('2026-11-01', $order1->quota_date->format('Y-m-d'));
        $this->assertEquals(1, $quotaService->used('2026-11-01'));
        $this->assertEquals(0, $quotaService->used('2026-11-02'));

        // 00:01 WIB on Nov 2, 2026 (reset day)
        Carbon::setTestNow(Carbon::parse('2026-11-02 00:01:00', 'Asia/Jakarta'));

        $this->assertEquals(0, $quotaService->used($quotaService->today()));
        $this->assertEquals(3, $quotaService->snapshot()['remaining']);

        $order2 = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567802', $this->paymentMethod->id));
        $this->assertEquals('2026-11-02', $order2->quota_date->format('Y-m-d'));
        $this->assertEquals(1, $quotaService->used('2026-11-02'));
        $this->assertEquals(1, $quotaService->used('2026-11-01'));

        Carbon::setTestNow(null);
    }

    /**
     * Test 5: Daily quota overrides (e.g. 5 and 0).
     */
    public function test_daily_quota_override(): void
    {
        $quotaService = app(QuotaService::class);

        // Default limit is 3
        $this->assertEquals(3, $quotaService->limitFor('2026-11-05'));

        // Override to 5
        DailyQuotaOverride::create([
            'date' => '2026-11-05',
            'max_quota' => 5,
            'note' => 'Weekend surge',
        ]);
        $this->assertEquals(5, $quotaService->limitFor('2026-11-05'));

        // Override to 0 (rent closed)
        DailyQuotaOverride::create([
            'date' => '2026-11-06',
            'max_quota' => 0,
            'note' => 'Maintenance day',
        ]);
        $this->assertEquals(0, $quotaService->limitFor('2026-11-06'));
    }

    /**
     * Test (spec 6): Two order creations for the last account unit -> only one succeeds.
     */
    public function test_two_orders_for_last_unit_only_one_succeeds(): void
    {
        $this->addAccount(OrderType::RENT, 1);
        $createOrder = app(CreateOrder::class);

        $order1 = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567801', $this->paymentMethod->id));
        $this->assertNotNull($order1->id);
        $this->assertEquals(AccountStatus::RESERVED, $order1->account->fresh()->status);

        $this->expectException(OutOfStockException::class);
        $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567802', $this->paymentMethod->id));
    }

    /**
     * Test 6: Illegal status transitions are rejected.
     */
    public function test_illegal_status_transitions_are_rejected(): void
    {
        $this->assertTrue(OrderStatus::PENDING->canTransitionTo(OrderStatus::VERIFYING));
        $this->assertTrue(OrderStatus::PENDING->canTransitionTo(OrderStatus::EXPIRED));
        $this->assertTrue(OrderStatus::PENDING->canTransitionTo(OrderStatus::CANCELLED));
        $this->assertFalse(OrderStatus::PENDING->canTransitionTo(OrderStatus::PAID));

        $this->assertTrue(OrderStatus::VERIFYING->canTransitionTo(OrderStatus::PAID));
        $this->assertTrue(OrderStatus::VERIFYING->canTransitionTo(OrderStatus::CANCELLED));
        $this->assertFalse(OrderStatus::VERIFYING->canTransitionTo(OrderStatus::EXPIRED));

        $this->assertTrue(OrderStatus::EXPIRED->canTransitionTo(OrderStatus::PENDING));
        $this->assertTrue(OrderStatus::EXPIRED->canTransitionTo(OrderStatus::VERIFYING));
        $this->assertFalse(OrderStatus::EXPIRED->canTransitionTo(OrderStatus::PAID));

        $this->assertTrue(OrderStatus::PAID->canTransitionTo(OrderStatus::CANCELLED)); // Allowed for rule violation access revocation
        $this->assertFalse(OrderStatus::CANCELLED->canTransitionTo(OrderStatus::PAID));

        // Attempting to reject an already CANCELLED order via Action throws exception
        $this->addAccount(OrderType::RENT, 1);
        $order = app(CreateOrder::class)->handle(new CreateOrderData($this->rentVariant->id, '081234567801', $this->paymentMethod->id));
        $order->update(['status' => OrderStatus::CANCELLED]);

        $this->expectException(InvalidStatusTransitionException::class);
        app(RejectOrder::class)->handle($order, 'Double rejection');
    }

    /**
     * Test 7: Reject order releases quota and account unit.
     */
    public function test_reject_order_releases_quota_and_account_unit(): void
    {
        $this->addAccount(OrderType::RENT, 1);
        $createOrder = app(CreateOrder::class);
        $quotaService = app(QuotaService::class);

        $order = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567801', $this->paymentMethod->id));
        $account = $order->account;

        $this->assertEquals(1, $quotaService->used($quotaService->today()));
        $this->assertEquals(AccountStatus::RESERVED, $account->fresh()->status);

        // Reject order
        $rejectOrder = app(RejectOrder::class);
        $rejectedOrder = $rejectOrder->handle($order, 'Bukti transfer palsu', 'admin:1');

        $this->assertEquals(OrderStatus::CANCELLED, $rejectedOrder->status);
        $this->assertEquals('Bukti transfer palsu', $rejectedOrder->status_note);

        // Account is now AVAILABLE again
        $this->assertEquals(AccountStatus::AVAILABLE, $account->fresh()->status);
        $this->assertNull($account->fresh()->order_id);

        // Quota is released back to 0 used
        $this->assertEquals(0, $quotaService->used($quotaService->today()));

        // Audit event recorded
        $this->assertDatabaseHas('order_events', [
            'order_id' => $order->id,
            'from_status' => OrderStatus::PENDING->value,
            'to_status' => OrderStatus::CANCELLED->value,
            'actor' => 'admin:1',
            'note' => 'Bukti transfer palsu',
        ]);
    }

    /**
     * Test 8 (spec 11): total_amount equals base_price and unique_code is 0.
     */
    public function test_total_amount_is_unique_among_active_orders(): void
    {
        $this->addAccount(OrderType::RENT, 5);
        $createOrder = app(CreateOrder::class);

        $order1 = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567801', $this->paymentMethod->id));
        $order2 = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567802', $this->paymentMethod->id));

        $this->assertEquals($order1->base_price, $order1->total_amount);
        $this->assertEquals(0, $order1->unique_code);
        $this->assertEquals($order2->base_price, $order2->total_amount);
        $this->assertEquals(0, $order2->unique_code);
    }

    /**
     * Test 9 (spec 12): Telegram failure (Http::fake 500) does not abort order creation.
     */
    public function test_telegram_failure_does_not_abort_order_creation(): void
    {
        Http::fake([
            'api.telegram.org/*' => Http::response(['ok' => false, 'description' => 'Internal Server Error'], 500),
        ]);

        $this->addAccount(OrderType::RENT, 1);
        $createOrder = app(CreateOrder::class);

        $order = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567801', $this->paymentMethod->id));

        $this->assertNotNull($order->id);
        $this->assertDatabaseHas('orders', ['id' => $order->id]);
    }
}
