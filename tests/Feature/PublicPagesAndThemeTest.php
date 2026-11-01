<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicPagesAndThemeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Setting::create([
            'store_name' => 'StreamPoint Test',
            'daily_rent_quota' => 50,
            'admin_whatsapp' => '081234567890',
            'business_hours' => 'Setiap hari, 09.00 - 21.00 WIB',
            'telegram_bot_token' => 'secret_bot_token_xyz',
            'telegram_chat_id' => 'secret_chat_id_123',
        ]);
    }

    public function test_static_terms_page_returns_200(): void
    {
        $response = $this->get('/syarat-ketentuan');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('static/Terms')
        );
    }

    public function test_static_privacy_page_returns_200(): void
    {
        $response = $this->get('/kebijakan-privasi');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('static/Privacy')
        );
    }

    public function test_settings_shared_props_exposes_public_fields_only(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertInertia(function (Assert $page) {
            $page->has('settings', function (Assert $settings) {
                $settings->where('admin_whatsapp', '081234567890')
                    ->where('business_hours', 'Setiap hari, 09.00 - 21.00 WIB')
                    ->missing('telegram_bot_token')
                    ->missing('telegram_chat_id')
                    ->missing('id')
                    ->missing('created_at')
                    ->missing('updated_at');
            });
        });
    }

    public function test_pending_order_banner_is_null_when_no_owned_invoices(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('pendingOrder', null)
        );
    }

    public function test_pending_order_banner_loads_active_session_order(): void
    {
        $product = Product::create([
            'name' => 'Netflix Premium',
            'slug' => 'netflix-premium',
            'category' => 'Streaming Video',
            'is_active' => true,
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => '1 Hari',
            'duration_hours' => 24,
            'price' => 5000,
            'type' => OrderType::RENT->value,
            'is_active' => true,
        ]);

        $pm = PaymentMethod::create([
            'code' => 'QRIS01',
            'label' => 'QRIS',
            'type' => 'QRIS',
            'is_active' => true,
        ]);

        $order = Order::create([
            'invoice_code' => 'INV-TEST-0001',
            'product_id' => $product->id,
            'variant_id' => $variant->id,
            'payment_method_id' => $pm->id,
            'payment_method_label' => 'QRIS',
            'customer_phone' => '081234567890',
            'order_type' => OrderType::RENT->value,
            'base_price' => 5000,
            'unique_code' => 123,
            'total_amount' => 5123,
            'status' => OrderStatus::PENDING->value,
            'quota_date' => now()->toDateString(),
            'payment_expires_at' => now()->addMinutes(10),
        ]);

        $response = $this->withSession([
            'owned_invoices' => ['INV-TEST-0001'],
        ])->get('/');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('pendingOrder', fn (Assert $pending) => $pending
                ->where('invoice_code', 'INV-TEST-0001')
                ->where('status', 'PENDING')
                ->where('status_label', 'Menunggu Bayar')
                ->missing('customer_phone')
                ->missing('unique_code')
                ->missing('total_amount')
            )
        );
    }

    public function test_pending_order_banner_ignores_expired_orders(): void
    {
        $product = Product::create([
            'name' => 'Disney+ Hotstar',
            'slug' => 'disney-hotstar',
            'category' => 'Streaming Video',
            'is_active' => true,
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => '1 Hari',
            'duration_hours' => 24,
            'price' => 4000,
            'type' => OrderType::RENT->value,
            'is_active' => true,
        ]);

        $pm = PaymentMethod::create([
            'code' => 'QRIS02',
            'label' => 'QRIS',
            'type' => 'QRIS',
            'is_active' => true,
        ]);

        Order::create([
            'invoice_code' => 'INV-TEST-EXPIRED',
            'product_id' => $product->id,
            'variant_id' => $variant->id,
            'payment_method_id' => $pm->id,
            'payment_method_label' => 'QRIS',
            'customer_phone' => '081234567890',
            'order_type' => OrderType::RENT->value,
            'base_price' => 4000,
            'unique_code' => 55,
            'total_amount' => 4055,
            'status' => OrderStatus::PENDING->value,
            'quota_date' => now()->toDateString(),
            'payment_expires_at' => now()->subMinute(), // expired!
        ]);

        $response = $this->withSession([
            'owned_invoices' => ['INV-TEST-EXPIRED'],
        ])->get('/');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('pendingOrder', null)
        );
    }

    public function test_storefront_returns_filter_props_and_categories(): void
    {
        $product = Product::create([
            'name' => 'Spotify Family',
            'slug' => 'spotify-family',
            'category' => 'Streaming Musik',
            'is_active' => true,
        ]);

        ProductVariant::create([
            'product_id' => $product->id,
            'name' => '1 Bulan',
            'duration_hours' => 720,
            'price' => 15000,
            'type' => OrderType::BUY->value,
            'is_active' => true,
        ]);

        $response = $this->get('/');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('storefront/Index')
            ->has('categories')
            ->has('paymentMethods')
            ->has('products.0', fn (Assert $prod) => $prod
                ->where('slug', 'spotify-family')
                ->where('has_buy', true)
                ->where('has_rent', false)
                ->etc()
            )
        );
    }
}
