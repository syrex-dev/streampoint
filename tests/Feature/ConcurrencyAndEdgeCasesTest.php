<?php

namespace Tests\Feature;

use App\Actions\Order\CreateOrder;
use App\Actions\Order\CreateOrderData;
use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentMethodType;
use App\Enums\RentDuration;
use App\Exceptions\OutOfStockException;
use App\Exceptions\QuotaFullException;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductAccount;
use App\Models\ProductVariant;
use App\Models\Setting;
use App\Models\User;
use App\Services\QuotaService;
use App\Support\Phone;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ConcurrencyAndEdgeCasesTest extends TestCase
{
    use RefreshDatabase;

    protected Product $product;
    protected ProductVariant $rentVariant;
    protected ProductVariant $buyVariant;
    protected PaymentMethod $paymentMethod;
    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        Setting::current()->update(['max_daily_rent_quota' => 2]);

        $this->product = Product::create([
            'slug' => 'netflix-premium',
            'name' => 'Netflix Premium UHD',
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
            'label' => 'QRIS Realtime',
            'is_active' => true,
        ]);

        $this->adminUser = User::factory()->create([
            'name' => 'Admin StreamPoint',
            'email' => 'admin@streampoint.test',
            'is_admin' => true,
        ]);
    }

    /**
     * B.1: Concurrency simulation for the last quota slot.
     * When quota is set to 2, 1 order is already active (1 slot remaining).
     * Two concurrent requests try to checkout the last slot:
     * Request A acquires Setting lock and reserves slot.
     * Request B, serialized behind A, sees quota is now full and throws QuotaFullException.
     */
    public function test_concurrency_simulation_for_last_quota_slot_serializes_and_rejects_second_request(): void
    {
        // 5 accounts available so stock is NOT the bottleneck
        for ($i = 1; $i <= 5; $i++) {
            ProductAccount::create([
                'product_id' => $this->product->id,
                'kind' => OrderType::RENT,
                'credential' => "user{$i}@test.com | pass | Profil {$i} | 1234",
                'status' => AccountStatus::AVAILABLE,
            ]);
        }

        $createOrder = app(CreateOrder::class);

        // First order occupies 1 of 2 slots
        $order1 = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567801', $this->paymentMethod->id));
        $this->assertNotNull($order1);

        $quotaService = app(QuotaService::class);
        $this->assertEquals(1, $quotaService->used($quotaService->today()));

        // Simulate two competing requests A and B for the last slot
        $requestASucceeded = false;
        $requestBFailureReason = null;

        DB::transaction(function () use ($createOrder, &$requestASucceeded) {
            // Request A executes inside transaction, acquiring Setting lock
            $orderA = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567802', $this->paymentMethod->id));
            $requestASucceeded = ($orderA !== null);
        });

        // Request B arrives right after
        try {
            $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567803', $this->paymentMethod->id));
        } catch (QuotaFullException $e) {
            $requestBFailureReason = 'QuotaFullException';
        }

        $this->assertTrue($requestASucceeded, 'Request A must succeed and take the last quota slot.');
        $this->assertEquals('QuotaFullException', $requestBFailureReason, 'Request B must fail with QuotaFullException because quota is serialized.');
        $this->assertEquals(2, $quotaService->used($quotaService->today()));
        $this->assertTrue($quotaService->snapshot()['is_full']);
    }

    /**
     * B.1: Concurrency simulation for the last account unit.
     * When exactly 1 account unit is AVAILABLE for this product:
     * Request A locks the account row with lockForUpdate() and reserves it.
     * Request B sees 0 available units and throws OutOfStockException.
     */
    public function test_concurrency_simulation_for_last_account_unit_serializes_and_rejects_second_request(): void
    {
        // Generous quota so quota is NOT the bottleneck
        Setting::current()->update(['max_daily_rent_quota' => 10]);

        // Exactly 1 account unit
        $singleAccount = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => 'last_unit@test.com | pass | Profil 1 | 1234',
            'status' => AccountStatus::AVAILABLE,
        ]);

        $createOrder = app(CreateOrder::class);

        $requestASucceeded = false;
        $requestBFailureReason = null;

        // Request A reserves the unit
        DB::transaction(function () use ($createOrder, &$requestASucceeded) {
            $orderA = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567801', $this->paymentMethod->id));
            $requestASucceeded = ($orderA !== null);
        });

        // Request B tries for the same product variant
        try {
            $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567802', $this->paymentMethod->id));
        } catch (OutOfStockException $e) {
            $requestBFailureReason = 'OutOfStockException';
        }

        $this->assertTrue($requestASucceeded, 'Request A must succeed and take the last unit.');
        $this->assertEquals('OutOfStockException', $requestBFailureReason, 'Request B must receive OutOfStockException.');
        $this->assertEquals(AccountStatus::RESERVED, $singleAccount->fresh()->status);
    }

    /**
     * B.3: BUY orders succeed even when daily RENT quota is 100% full.
     */
    public function test_buy_orders_succeed_even_when_daily_rent_quota_is_full(): void
    {
        Setting::current()->update(['max_daily_rent_quota' => 1]);

        // 1 rent account, 1 buy account
        ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => 'rent@test.com | pass | P1 | 1111',
            'status' => AccountStatus::AVAILABLE,
        ]);

        $buyAccount = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::BUY,
            'credential' => 'buy@test.com | pass | P1 | 2222',
            'status' => AccountStatus::AVAILABLE,
        ]);

        $createOrder = app(CreateOrder::class);

        // 1. Consume rent quota
        $rentOrder = $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567801', $this->paymentMethod->id));
        $this->assertNotNull($rentOrder);

        $quotaService = app(QuotaService::class);
        $this->assertTrue($quotaService->snapshot()['is_full']);

        // 2. Additional rent order is rejected
        $this->expectException(QuotaFullException::class);
        try {
            $createOrder->handle(new CreateOrderData($this->rentVariant->id, '081234567802', $this->paymentMethod->id));
        } catch (QuotaFullException $e) {
            // 3. BUY order succeeds regardless of full rent quota!
            $buyOrder = $createOrder->handle(new CreateOrderData($this->buyVariant->id, '081234567803', $this->paymentMethod->id));
            $this->assertNotNull($buyOrder);
            $this->assertEquals(OrderType::BUY, $buyOrder->order_type);
            $this->assertEquals($buyAccount->id, $buyOrder->account_id);

            throw $e;
        }
    }

    /**
     * B.2: Rental duration expiration releases account unit back to AVAILABLE.
     */
    public function test_rental_duration_expiration_releases_rented_account_to_available(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-01 10:00:00'));

        $account = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => 'rented@test.com | pass | P1 | 1111',
            'status' => AccountStatus::RENTED,
            'rented_until' => Carbon::parse('2026-11-02 10:00:00'),
        ]);

        $order = Order::create([
            'invoice_code' => 'INV-20261101-RENTEXP',
            'product_id' => $this->product->id,
            'variant_id' => $this->rentVariant->id,
            'account_id' => $account->id,
            'order_type' => OrderType::RENT,
            'status' => OrderStatus::PAID,
            'base_price' => 15000,
            'unique_code' => 123,
            'total_amount' => 15123,
            'customer_phone' => '6281234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'payment_method_label' => 'QRIS',
            'payment_expires_at' => now()->addMinutes(15),
            'quota_date' => now()->toDateString(),
            'access_starts_at' => Carbon::parse('2026-11-01 10:00:00'),
            'access_expires_at' => Carbon::parse('2026-11-02 10:00:00'),
        ]);

        $account->update(['order_id' => $order->id]);

        // Advance clock past expiration
        Carbon::setTestNow(Carbon::parse('2026-11-02 10:05:00'));

        // Run scheduler command
        Artisan::call('accounts:release-rented');

        $account->refresh();
        $this->assertEquals(AccountStatus::AVAILABLE, $account->status);
        $this->assertNull($account->order_id);
        $this->assertNull($account->rented_until);

        Carbon::setTestNow();
    }

    /**
     * B.2: Phone normalization edge cases (+62, 08, 62, spaces, dashes).
     */
    public function test_phone_number_formats_normalize_identically(): void
    {
        $expected = '6281234567890';

        $this->assertEquals($expected, Phone::normalize('081234567890'));
        $this->assertEquals($expected, Phone::normalize('+6281234567890'));
        $this->assertEquals($expected, Phone::normalize('6281234567890'));
        $this->assertEquals($expected, Phone::normalize('81234567890'));
        $this->assertEquals($expected, Phone::normalize('0812-3456-7890'));
        $this->assertEquals($expected, Phone::normalize('+62 812 3456 7890'));
    }

    /**
     * C.1: Query count verification for Storefront to ensure no N+1 query.
     */
    public function test_storefront_has_predictable_query_count_without_n_plus_one(): void
    {
        // Create 5 products with variants and accounts
        for ($p = 1; $p <= 5; $p++) {
            $prod = Product::create([
                'slug' => "product-{$p}",
                'name' => "Product {$p}",
                'category' => 'Streaming',
                'is_active' => true,
                'sort_order' => $p,
            ]);

            ProductVariant::create([
                'product_id' => $prod->id,
                'name' => "Variant {$p}",
                'type' => OrderType::RENT,
                'rent_duration' => RentDuration::ONE_DAY,
                'duration_hours' => 24,
                'price' => 15000,
                'is_active' => true,
                'sort_order' => 1,
            ]);

            ProductAccount::create([
                'product_id' => $prod->id,
                'kind' => OrderType::RENT,
                'credential' => "acc{$p}@test.com | pass | P1 | 1111",
                'status' => AccountStatus::AVAILABLE,
            ]);
        }

        DB::flushQueryLog();
        DB::enableQueryLog();

        $response = $this->get('/');
        $response->assertOk();

        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        // Should not exceed a small fixed number of queries regardless of product count (setting, quota, products with variants, payment methods, session)
        $this->assertLessThanOrEqual(10, count($queries), 'Storefront query count must remain bounded without N+1.');
    }

    /**
     * C.1: Query count verification for Admin Stock Accounts to ensure no N+1 query.
     */
    public function test_admin_accounts_index_has_bounded_query_count_without_n_plus_one(): void
    {
        // 5 products, each with accounts
        for ($p = 1; $p <= 5; $p++) {
            $prod = Product::create([
                'slug' => "stock-prod-{$p}",
                'name' => "Stock Prod {$p}",
                'category' => 'Streaming',
                'is_active' => true,
                'sort_order' => $p,
            ]);

            ProductAccount::create([
                'product_id' => $prod->id,
                'kind' => OrderType::RENT,
                'credential' => "stock{$p}@test.com | pass | P1 | 1111",
                'status' => AccountStatus::AVAILABLE,
            ]);
        }

        DB::flushQueryLog();
        DB::enableQueryLog();

        $response = $this->actingAs($this->adminUser)->get('/admin/accounts');
        $response->assertOk();

        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        // Prior to optimization with withCount, 5 products would add 10 extra count queries (2 per product).
        // With withCount, the summary is a single query!
        $this->assertLessThanOrEqual(10, count($queries), 'Admin accounts index query count must remain bounded without N+1.');
    }
}
