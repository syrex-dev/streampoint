<?php

namespace Tests\Feature;

use App\Enums\AccountStatus;
use App\Enums\OrderType;
use App\Enums\PaymentMethodType;
use App\Enums\RentDuration;
use App\Models\DailyQuotaOverride;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductAccount;
use App\Models\ProductVariant;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StorefrontAndProductPageTest extends TestCase
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
            'name' => 'Netflix Premium UHD',
            'category' => 'Streaming',
            'description' => 'Akun premium 4K UHD',
            'rules' => 'Aturan penggunaan akun',
            'is_active' => true,
            'sort_order' => 1,
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
            'sort_order' => 1,
        ]);
    }

    /**
     * 1. Storefront returns correct props and does not leak credentials or account_id.
     */
    public function test_storefront_returns_correct_props_and_does_not_leak_credentials(): void
    {
        ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => 'secret_email@test.com | secret_pass | Profil 1 | 1234',
            'status' => AccountStatus::AVAILABLE,
        ]);

        $response = $this->get('/');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('storefront/Index')
            ->has('storeName')
            ->has('quota')
            ->has('products', 1)
            ->has('products.0', fn (Assert $item) => $item
                ->where('id', $this->product->id)
                ->where('slug', 'netflix-premium')
                ->where('name', 'Netflix Premium UHD')
                ->where('category', 'Streaming')
                ->where('min_price', 15000)
                ->where('status', 'low_stock') // only 1 unit
                ->where('status_label', 'Stok Menipis')
                ->where('available_rent_stock', 1)
                ->where('available_buy_stock', 0)
                ->etc()
                ->missing('credential')
                ->missing('account_id')
                ->missing('accounts')
            )
        );
    }

    /**
     * 2. Product page returns correct props and does not leak credentials or account_id.
     */
    public function test_product_page_returns_correct_props_and_does_not_leak_credentials(): void
    {
        ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => 'secret_email@test.com | secret_pass | Profil 1 | 1234',
            'status' => AccountStatus::AVAILABLE,
        ]);

        $response = $this->get('/p/netflix-premium');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('product/Show')
            ->has('storeName')
            ->has('quota')
            ->has('paymentMethods', 1)
            ->has('variants', 2)
            ->has('product', fn (Assert $prod) => $prod
                ->where('id', $this->product->id)
                ->where('slug', 'netflix-premium')
                ->where('name', 'Netflix Premium UHD')
                ->where('available_rent_stock', 1)
                ->where('available_buy_stock', 0)
                ->etc()
                ->missing('credential')
                ->missing('account_id')
                ->missing('accounts')
            )
            ->has('variants.0', fn (Assert $v) => $v
                ->where('id', $this->rentVariant->id)
                ->where('name', 'Sewa 1 Hari (24 Jam)')
                ->where('type', 'RENT')
                ->where('price', 15000)
                ->etc()
                ->missing('credential')
                ->missing('account_id')
            )
        );
    }

    /**
     * 3. RENT packages marked as full when quota is full.
     */
    public function test_rent_packages_marked_as_full_when_quota_is_full(): void
    {
        // Override quota to 0 for today
        DailyQuotaOverride::create([
            'date' => now()->toDateString(),
            'max_quota' => 0,
            'note' => 'Full today',
        ]);

        $response = $this->get('/p/netflix-premium');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('product/Show')
            ->where('quota.is_full', true)
            ->where('quota.remaining', 0)
        );
    }

    /**
     * 4. Service with no available units is marked as Habis (out_of_stock).
     */
    public function test_service_with_no_available_units_marked_as_habis(): void
    {
        // No ProductAccount created (0 stock)
        $response = $this->get('/');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('storefront/Index')
            ->has('outOfStockProducts.0', fn (Assert $item) => $item
                ->where('status', 'out_of_stock')
                ->where('status_label', 'Habis')
                ->where('available_rent_stock', 0)
                ->where('available_buy_stock', 0)
                ->etc()
            )
        );
    }

    /**
     * 5. Service with BUY units having AVAILABLE status displays buy stock > 0.
     */
    public function test_service_with_available_buy_units_displays_buy_stock_greater_than_zero(): void
    {
        ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::BUY,
            'credential' => 'buy_account_1@test.com | pass123 | Full Private',
            'status' => AccountStatus::AVAILABLE,
        ]);

        ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::BUY,
            'credential' => 'buy_account_2@test.com | pass456 | Full Private',
            'status' => AccountStatus::AVAILABLE,
        ]);

        // Also create a SOLD unit to ensure only AVAILABLE units are counted
        ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::BUY,
            'credential' => 'buy_account_sold@test.com | pass789 | Full Private',
            'status' => AccountStatus::SOLD,
        ]);

        // Check storefront
        $storefrontResponse = $this->get('/');
        $storefrontResponse->assertOk();
        $storefrontResponse->assertInertia(fn (Assert $page) => $page
            ->component('storefront/Index')
            ->has('products.0', fn (Assert $item) => $item
                ->where('available_buy_stock', 2)
                ->where('available_rent_stock', 0)
                ->etc()
            )
        );

        // Check product detail page
        $productResponse = $this->get('/p/netflix-premium');
        $productResponse->assertOk();
        $productResponse->assertInertia(fn (Assert $page) => $page
            ->component('product/Show')
            ->has('product', fn (Assert $item) => $item
                ->where('available_buy_stock', 2)
                ->where('available_rent_stock', 0)
                ->etc()
            )
        );
    }
}
