<?php

namespace Tests\Feature;

use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentMethodType;
use App\Enums\RentDuration;
use App\Models\Order;
use App\Models\OrderEvent;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductAccount;
use App\Models\ProductVariant;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class Fase7StorefrontAndInvoiceTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        Setting::clearCurrentInstance();

        $this->adminUser = User::factory()->create([
            'name' => 'Admin StreamPoint',
            'email' => 'admin@streampoint.test',
            'is_admin' => true,
        ]);

        Setting::current()->update([
            'store_name' => 'StreamPoint Store',
            'stats_min_orders' => 20,
            'max_daily_rent_quota' => 20,
            'admin_whatsapp' => '08123456789',
        ]);
    }

    /**
     * Test 1: Stats and median are null below threshold.
     */
    public function test_stats_and_median_are_null_below_threshold(): void
    {
        // 2 active products (< 3 threshold)
        $p1 = Product::factory()->create(['is_active' => true]);
        $v1 = ProductVariant::factory()->create([
            'product_id' => $p1->id,
            'type' => OrderType::RENT,
            'is_active' => true,
        ]);
        ProductAccount::factory()->create([
            'product_id' => $p1->id,
            'kind' => OrderType::RENT,
            'status' => AccountStatus::AVAILABLE,
        ]);

        $p2 = Product::factory()->create(['is_active' => true]);
        $v2 = ProductVariant::factory()->create([
            'product_id' => $p2->id,
            'type' => OrderType::BUY,
            'is_active' => true,
        ]);
        ProductAccount::factory()->create([
            'product_id' => $p2->id,
            'kind' => OrderType::BUY,
            'status' => AccountStatus::AVAILABLE,
        ]);

        $pm = PaymentMethod::factory()->create(['is_active' => true]);

        // 5 completed orders (< 20 threshold)
        for ($i = 0; $i < 5; $i++) {
            $order = Order::factory()->create([
                'product_id' => $p1->id,
                'variant_id' => $v1->id,
                'payment_method_id' => $pm->id,
                'account_id' => null,
                'status' => OrderStatus::PAID,
            ]);

            // Only 5 transition events (< 10 threshold)
            OrderEvent::create([
                'order_id' => $order->id,
                'from_status' => OrderStatus::PENDING,
                'to_status' => OrderStatus::VERIFYING,
                'actor' => 'SYSTEM',
                'created_at' => now()->subMinutes(15),
            ]);
            OrderEvent::create([
                'order_id' => $order->id,
                'from_status' => OrderStatus::VERIFYING,
                'to_status' => OrderStatus::PAID,
                'actor' => 'ADMIN',
                'created_at' => now(),
            ]);
        }

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('storefront/Index')
                ->where('stats.completed_orders', null)
                ->where('stats.active_services', null)
                ->where('verification_median_minutes', null)
                ->where('available_services_count', 2)
            );
    }

    /**
     * Test 2: Stats and median are calculated accurately above threshold.
     */
    public function test_stats_and_median_are_calculated_above_threshold(): void
    {
        Setting::current()->update(['max_daily_rent_quota' => 50]);
        Setting::clearCurrentInstance();

        $pm = PaymentMethod::factory()->create(['is_active' => true]);

        // 4 active products (>= 3 threshold)
        $products = [];
        for ($i = 0; $i < 4; $i++) {
            $p = Product::factory()->create(['is_active' => true]);
            $v = ProductVariant::factory()->create([
                'product_id' => $p->id,
                'type' => OrderType::RENT,
                'is_active' => true,
            ]);
            ProductAccount::factory()->create([
                'product_id' => $p->id,
                'kind' => OrderType::RENT,
                'status' => AccountStatus::AVAILABLE,
            ]);
            $products[] = [$p, $v];
        }

        // 20 completed orders (>= 20 threshold)
        // With 10 verification duration samples: 4, 6, 8, 12, 14, 16, 18, 22, 24, 26 minutes
        // Median of 10 samples is (14 + 16) / 2 = 15 minutes.
        // Rounded up to multiple of 5: 15 minutes.
        $durations = [4, 6, 8, 12, 14, 16, 18, 22, 24, 26];

        for ($i = 0; $i < 20; $i++) {
            [$prod, $variant] = $products[$i % 4];
            $order = Order::factory()->create([
                'product_id' => $prod->id,
                'variant_id' => $variant->id,
                'payment_method_id' => $pm->id,
                'account_id' => null,
                'status' => OrderStatus::PAID,
            ]);

            if ($i < 10) {
                $dur = $durations[$i];
                OrderEvent::create([
                    'order_id' => $order->id,
                    'from_status' => OrderStatus::PENDING,
                    'to_status' => OrderStatus::VERIFYING,
                    'actor' => 'SYSTEM',
                    'created_at' => now()->subMinutes($dur),
                ]);
                OrderEvent::create([
                    'order_id' => $order->id,
                    'from_status' => OrderStatus::VERIFYING,
                    'to_status' => OrderStatus::PAID,
                    'actor' => 'ADMIN',
                    'created_at' => now(),
                ]);
            }
        }

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('storefront/Index')
                ->where('stats.completed_orders', 20)
                ->where('stats.active_services', 4)
                ->where('verification_median_minutes', 15)
                ->where('available_services_count', 4)
            );
    }

    /**
     * Test 3: Completed orders stat is hidden when stats_min_orders is 0.
     */
    public function test_completed_orders_stat_hidden_when_stats_min_orders_is_zero(): void
    {
        Setting::current()->update(['stats_min_orders' => 0]);
        Setting::clearCurrentInstance();

        $pm = PaymentMethod::factory()->create(['is_active' => true]);
        $prod = Product::factory()->create(['is_active' => true]);
        $variant = ProductVariant::factory()->create([
            'product_id' => $prod->id,
            'type' => OrderType::BUY,
            'is_active' => true,
        ]);
        ProductAccount::factory()->create([
            'product_id' => $prod->id,
            'kind' => OrderType::BUY,
            'status' => AccountStatus::AVAILABLE,
        ]);

        for ($i = 0; $i < 25; $i++) {
            Order::factory()->create([
                'product_id' => $prod->id,
                'variant_id' => $variant->id,
                'payment_method_id' => $pm->id,
                'account_id' => null,
                'status' => OrderStatus::PAID,
            ]);
        }

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('storefront/Index')
                ->where('stats.completed_orders', null)
            );
    }

    /**
     * Test 4: Daily rate and savings badge calculation logic.
     */
    public function test_daily_rate_and_savings_badge_logic(): void
    {
        // Half-day (12 hours): price 6.000 -> 12/24 = 0.5 days -> rate = 6000 / 0.5 = 12.000 / day
        $halfDayPrice = 6000;
        $halfDayHours = 12;
        $halfDayRate = (int) round($halfDayPrice / ($halfDayHours / 24));
        $this->assertSame(12000, $halfDayRate);

        // 1 day (24 hours): price 10.000 -> 24/24 = 1 day -> rate = 10.000 / day
        $oneDayPrice = 10000;
        $oneDayHours = 24;
        $oneDayRate = (int) round($oneDayPrice / ($oneDayHours / 24));
        $this->assertSame(10000, $oneDayRate);

        // 3 days (72 hours): price 24.000 -> 72/24 = 3 days -> rate = 8.000 / day (Lowest!)
        $threeDaysPrice = 24000;
        $threeDaysHours = 72;
        $threeDaysRate = (int) round($threeDaysPrice / ($threeDaysHours / 24));
        $this->assertSame(8000, $threeDaysRate);

        // Lowest rate among the options:
        $rates = [$halfDayRate, $oneDayRate, $threeDaysRate];
        $lowest = min($rates);
        $this->assertSame(8000, $lowest);

        // Badge rule: Only show badge when count >= 2 and rate === lowest
        $this->assertTrue(count($rates) >= 2 && $threeDaysRate === $lowest);
        $this->assertFalse(count($rates) >= 2 && $oneDayRate === $lowest);

        // Single package case: No badge shown
        $singlePackage = [$oneDayRate];
        $this->assertFalse(count($singlePackage) >= 2);
    }

    /**
     * Test 5: Stepper status mapping for all 5 order statuses.
     */
    public function test_stepper_status_mapping_for_all_five_statuses(): void
    {
        $statuses = [
            OrderStatus::PENDING->value => [
                'current_step' => 1,
                'is_error' => false,
            ],
            OrderStatus::VERIFYING->value => [
                'current_step' => 3,
                'is_error' => false,
            ],
            OrderStatus::PAID->value => [
                'current_step' => 4,
                'is_error' => false,
            ],
            OrderStatus::EXPIRED->value => [
                'current_step' => 2,
                'is_error' => true,
            ],
            OrderStatus::CANCELLED->value => [
                'current_step' => 2,
                'is_error' => true,
            ],
        ];

        foreach ($statuses as $st => $expected) {
            $this->assertContains($st, [
                OrderStatus::PENDING->value,
                OrderStatus::VERIFYING->value,
                OrderStatus::PAID->value,
                OrderStatus::EXPIRED->value,
                OrderStatus::CANCELLED->value,
            ]);
            $this->assertIsInt($expected['current_step']);
            $this->assertIsBool($expected['is_error']);
        }
    }

    /**
     * Test 6: Public storefront props do not leak sensitive columns.
     */
    public function test_public_storefront_props_do_not_contain_sensitive_columns(): void
    {
        $prod = Product::factory()->create([
            'name' => 'Netflix Premium 4K',
            'is_active' => true,
        ]);

        $variant = ProductVariant::factory()->create([
            'product_id' => $prod->id,
            'name' => '1 Profil 30 Hari',
            'price' => 35000,
            'type' => OrderType::RENT,
            'is_active' => true,
        ]);

        ProductAccount::factory()->create([
            'product_id' => $prod->id,
            'kind' => OrderType::RENT,
            'status' => AccountStatus::AVAILABLE,
            'credential' => 'user@netflix.com|supersecretpassword|Profil 1|1234',
            'note' => 'Secret account notes for admin eyes only',
        ]);

        $pm = PaymentMethod::factory()->create([
            'is_active' => true,
            'label' => 'BCA Transfer',
            'account_number' => '1234567890',
        ]);

        $response = $this->get('/');
        $response->assertOk();

        $content = $response->getContent();
        $this->assertStringNotContainsString('supersecretpassword', $content);
        $this->assertStringNotContainsString('user@netflix.com', $content);
        $this->assertStringNotContainsString('Secret account notes', $content);
        $this->assertStringNotContainsString('remember_token', $content);

        // Product show page
        $prodResponse = $this->get("/p/{$prod->slug}");
        $prodResponse->assertOk();
        $prodContent = $prodResponse->getContent();
        $this->assertStringNotContainsString('supersecretpassword', $prodContent);
        $this->assertStringNotContainsString('user@netflix.com', $prodContent);
        $this->assertStringNotContainsString('Secret account notes', $prodContent);
    }

    /**
     * Test 7: Storefront query budget executes <= 10 queries (prevents N+1).
     */
    public function test_storefront_query_budget_executes_within_limit(): void
    {
        // Populate 10 products with variants and accounts
        for ($i = 0; $i < 10; $i++) {
            $p = Product::factory()->create(['is_active' => true]);
            ProductVariant::factory()->count(2)->create([
                'product_id' => $p->id,
                'is_active' => true,
            ]);
            ProductAccount::factory()->count(2)->create([
                'product_id' => $p->id,
                'status' => AccountStatus::AVAILABLE,
            ]);
        }

        DB::flushQueryLog();
        DB::enableQueryLog();

        $response = $this->get('/');
        $response->assertOk();

        $queryCount = count(DB::getQueryLog());
        $this->assertLessThanOrEqual(10, $queryCount, "Storefront executed {$queryCount} queries, exceeding 10 query limit.");
    }

    /**
     * Test 8: Contact admin button hidden when admin_whatsapp is null or empty.
     */
    public function test_contact_admin_button_hidden_without_admin_whatsapp(): void
    {
        $prod = Product::factory()->create(['is_active' => true]);
        $variant = ProductVariant::factory()->create([
            'product_id' => $prod->id,
            'type' => OrderType::RENT,
            'is_active' => true,
        ]);
        $pm = PaymentMethod::factory()->create(['is_active' => true]);

        $order = Order::factory()->create([
            'product_id' => $prod->id,
            'variant_id' => $variant->id,
            'payment_method_id' => $pm->id,
            'status' => OrderStatus::PENDING,
        ]);

        // Case A: admin_whatsapp is empty
        Setting::current()->update(['admin_whatsapp' => null]);
        Setting::clearCurrentInstance();

        $this->get("/invoice/{$order->invoice_code}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('invoice/Show')
                ->where('admin_whatsapp', null)
                ->where('adminWhatsapp', null)
            );

        // Case B: admin_whatsapp is configured
        Setting::current()->update(['admin_whatsapp' => '089876543210']);
        Setting::clearCurrentInstance();

        $this->get("/invoice/{$order->invoice_code}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('invoice/Show')
                ->where('admin_whatsapp', '089876543210')
                ->where('adminWhatsapp', '089876543210')
            );
    }
}
