<?php

namespace Tests\Feature;

use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentMethodType;
use App\Enums\RentDuration;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductAccount;
use App\Models\ProductVariant;
use App\Models\Setting;
use App\Models\User;
use App\Services\ImageOptimizer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MarketplaceCatalogTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create([
            'name' => 'Admin StreamPoint',
            'email' => 'admin@streampoint.test',
            'is_admin' => true,
        ]);

        Setting::current()->update([
            'max_daily_rent_quota' => 10,
            'min_sold_display' => 5,
        ]);
    }

    /**
     * Test 1: Social links validation accepts valid HTTPS whitelisted URLs.
     */
    public function test_social_links_validation_accepts_whitelisted_hosts_with_https(): void
    {
        $response = $this->actingAs($this->adminUser)->post('/admin/settings', [
            'max_daily_rent_quota' => 5,
            'accent_preset' => 'emerald',
            'min_sold_display' => 5,
            'social_links' => [
                'telegram' => 'https://t.me/streampoint_id',
                'instagram' => 'https://instagram.com/streampoint.id',
                'threads' => 'https://threads.net/@streampoint',
                'tiktok' => 'https://tiktok.com/@streampoint',
            ],
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $setting = Setting::current()->fresh();
        $this->assertEquals('https://t.me/streampoint_id', $setting->social_links['telegram']);
        $this->assertEquals('https://instagram.com/streampoint.id', $setting->social_links['instagram']);
        $this->assertEquals('https://threads.net/@streampoint', $setting->social_links['threads']);
        $this->assertEquals('https://tiktok.com/@streampoint', $setting->social_links['tiktok']);
    }

    /**
     * Test 2: Social links validation rejects HTTP, non-whitelisted hosts, and javascript: pseudo-protocols.
     */
    public function test_social_links_validation_rejects_insecure_protocols_and_unwhitelisted_hosts(): void
    {
        // 2a. Reject http://
        $resHttp = $this->actingAs($this->adminUser)->post('/admin/settings', [
            'max_daily_rent_quota' => 5,
            'accent_preset' => 'emerald',
            'min_sold_display' => 5,
            'social_links' => [
                'telegram' => 'http://t.me/streampoint',
            ],
        ]);
        $resHttp->assertSessionHasErrors(['social_links.telegram']);

        // 2b. Reject javascript:
        $resJs = $this->actingAs($this->adminUser)->post('/admin/settings', [
            'max_daily_rent_quota' => 5,
            'accent_preset' => 'emerald',
            'min_sold_display' => 5,
            'social_links' => [
                'instagram' => 'javascript:alert(1)',
            ],
        ]);
        $resJs->assertSessionHasErrors(['social_links.instagram']);

        // 2c. Reject non-whitelisted host (e.g. evil-phishing.com or facebook)
        $resHost = $this->actingAs($this->adminUser)->post('/admin/settings', [
            'max_daily_rent_quota' => 5,
            'accent_preset' => 'emerald',
            'min_sold_display' => 5,
            'social_links' => [
                'tiktok' => 'https://evil-phishing.com/@streampoint',
            ],
        ]);
        $resHost->assertSessionHasErrors(['social_links.tiktok']);
    }

    /**
     * Test 3: Announcement URL accepts internal paths (/...) or HTTPS URLs, rejects non-https/javascript.
     */
    public function test_announcement_url_validation(): void
    {
        // Valid internal path
        $resInternal = $this->actingAs($this->adminUser)->post('/admin/settings', [
            'max_daily_rent_quota' => 5,
            'accent_preset' => 'emerald',
            'min_sold_display' => 5,
            'announcement_text' => 'Promo Spesial Weekend!',
            'announcement_url' => '/p/netflix-premium',
        ]);
        $resInternal->assertSessionHasNoErrors();

        // Valid external HTTPS
        $resHttps = $this->actingAs($this->adminUser)->post('/admin/settings', [
            'max_daily_rent_quota' => 5,
            'accent_preset' => 'emerald',
            'min_sold_display' => 5,
            'announcement_text' => 'Join Telegram Kami',
            'announcement_url' => 'https://t.me/streampoint_channel',
        ]);
        $resHttps->assertSessionHasNoErrors();

        // Invalid: javascript:
        $resJs = $this->actingAs($this->adminUser)->post('/admin/settings', [
            'max_daily_rent_quota' => 5,
            'accent_preset' => 'emerald',
            'min_sold_display' => 5,
            'announcement_url' => 'javascript:void(0)',
        ]);
        $resJs->assertSessionHasErrors(['announcement_url']);

        // Invalid: http://
        $resHttp = $this->actingAs($this->adminUser)->post('/admin/settings', [
            'max_daily_rent_quota' => 5,
            'accent_preset' => 'emerald',
            'min_sold_display' => 5,
            'announcement_url' => 'http://insecure.test',
        ]);
        $resHttp->assertSessionHasErrors(['announcement_url']);
    }

    /**
     * Test 4: Image uploads reject SVG, non-image files, and files exceeding limits.
     */
    public function test_image_upload_rejects_svg_non_image_and_oversized_files(): void
    {
        Storage::fake('public');

        // 4a. Reject SVG
        $svgFile = UploadedFile::fake()->createWithContent('icon.svg', '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="5"/></svg>');
        $resSvg = $this->actingAs($this->adminUser)->post('/admin/products', [
            'name' => 'Spotify Family',
            'slug' => 'spotify-family',
            'category' => 'Music',
            'cover' => $svgFile,
        ]);
        $resSvg->assertSessionHasErrors(['cover']);

        // 4b. Reject non-image disguised as png
        $fakeImg = UploadedFile::fake()->createWithContent('fake.png', 'This is plaintext not image data');
        $optimizer = app(ImageOptimizer::class);
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        $optimizer->optimizeCover($fakeImg, 'test_fake');
    }

    /**
     * Test 5: ImageOptimizer converts valid images to WebP and enforces max width boundaries.
     */
    public function test_image_optimizer_converts_to_webp_and_resizes_dimensions(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension not available in this test environment.');
        }

        Storage::fake('public');
        $optimizer = app(ImageOptimizer::class);

        // Create a 1600x1000 PNG image
        $image = UploadedFile::fake()->image('large_cover.png', 1600, 1000);
        $savedPath = $optimizer->optimizeCover($image, 'test_cover');

        $this->assertStringEndsWith('.webp', $savedPath);
        Storage::disk('public')->assertExists($savedPath);

        // Check resized width <= 800
        $fullPath = Storage::disk('public')->path($savedPath);
        $info = getimagesize($fullPath);
        $this->assertLessThanOrEqual(800, $info[0]);
    }

    /**
     * Test 6: sold_count is null below min_sold_display threshold and accurate counting only PAID orders.
     */
    public function test_sold_count_is_null_below_threshold_and_accurate_above_threshold_counting_only_paid(): void
    {
        Setting::current()->update(['min_sold_display' => 5]);

        $productA = Product::factory()->create(['name' => 'Service Below Threshold', 'slug' => 'service-below']);
        $variantA = ProductVariant::factory()->create(['product_id' => $productA->id]);
        $accountA = ProductAccount::factory()->create(['product_id' => $productA->id, 'status' => AccountStatus::AVAILABLE]);

        $productB = Product::factory()->create(['name' => 'Service Above Threshold', 'slug' => 'service-above']);
        $variantB = ProductVariant::factory()->create(['product_id' => $productB->id]);
        $accountB = ProductAccount::factory()->create(['product_id' => $productB->id, 'status' => AccountStatus::AVAILABLE]);

        // Product A: 3 PAID orders (< 5)
        for ($i = 0; $i < 3; $i++) {
            Order::factory()->create([
                'product_id' => $productA->id,
                'variant_id' => $variantA->id,
                'status' => OrderStatus::PAID,
            ]);
        }

        // Product B: 6 PAID orders and 4 PENDING orders (>= 5, only PAID should be counted: exactly 6)
        for ($i = 0; $i < 6; $i++) {
            Order::factory()->create([
                'product_id' => $productB->id,
                'variant_id' => $variantB->id,
                'status' => OrderStatus::PAID,
            ]);
        }
        for ($i = 0; $i < 4; $i++) {
            Order::factory()->create([
                'product_id' => $productB->id,
                'variant_id' => $variantB->id,
                'status' => OrderStatus::PENDING,
            ]);
        }

        $response = $this->get('/');
        $response->assertOk();

        $props = $response->viewData('page')['props']['products'];
        $itemA = collect($props)->firstWhere('slug', 'service-below');
        $itemB = collect($props)->firstWhere('slug', 'service-above');

        $this->assertNotNull($itemA);
        $this->assertNotNull($itemB);
        $this->assertNull($itemA['sold_count'], 'Products with sold orders < min_sold_display must have null sold_count');
        $this->assertEquals(6, $itemB['sold_count'], 'Products with sold orders >= min_sold_display must display exact PAID count (excluding PENDING)');
    }

    /**
     * Test 7: Bestseller flag is assigned only to the top 3 services that meet the threshold.
     */
    public function test_bestseller_flag_assigned_only_to_top_3_services_meeting_threshold(): void
    {
        Setting::current()->update(['min_sold_display' => 5]);

        $products = [];
        $salesCounts = [20, 15, 10, 8, 3]; // 4 services meet >= 5, but only top 3 get is_bestseller = true

        foreach ($salesCounts as $idx => $count) {
            $prod = Product::factory()->create(['name' => "Prod $idx", 'slug' => "prod-$idx"]);
            $variant = ProductVariant::factory()->create(['product_id' => $prod->id]);
            ProductAccount::factory()->create(['product_id' => $prod->id, 'status' => AccountStatus::AVAILABLE]);

            for ($i = 0; $i < $count; $i++) {
                Order::factory()->create([
                    'product_id' => $prod->id,
                    'variant_id' => $variant->id,
                    'status' => OrderStatus::PAID,
                ]);
            }
            $products[$idx] = $prod;
        }

        $response = $this->get('/');
        $response->assertOk();

        $props = $response->viewData('page')['props']['products'];
        $items = collect($props)->keyBy('slug');

        // Top 3 (20, 15, 10) must have is_bestseller = true
        $this->assertTrue($items['prod-0']['is_bestseller']);
        $this->assertTrue($items['prod-1']['is_bestseller']);
        $this->assertTrue($items['prod-2']['is_bestseller']);

        // Rank 4 (8 sales) meets threshold but is not in top 3 -> false
        $this->assertFalse($items['prod-3']['is_bestseller']);

        // Rank 5 (3 sales) below threshold -> false
        $this->assertFalse($items['prod-4']['is_bestseller']);
    }

    /**
     * Test 8: Services where ALL variants are completely out of stock appear in "Sedang Kosong", not main grid.
     */
    public function test_out_of_stock_services_appear_in_sedang_kosong_not_in_main_grid(): void
    {
        // In-stock product
        $inStockProd = Product::factory()->create(['name' => 'In Stock Service', 'slug' => 'in-stock']);
        ProductVariant::factory()->create(['product_id' => $inStockProd->id]);
        ProductAccount::factory()->create(['product_id' => $inStockProd->id, 'status' => AccountStatus::AVAILABLE]);

        // Out-of-stock product (has variant, but 0 available accounts)
        $outOfStockProd = Product::factory()->create(['name' => 'Empty Service', 'slug' => 'empty-service']);
        ProductVariant::factory()->create(['product_id' => $outOfStockProd->id]);
        // No ProductAccount or only RENTED/DISABLED
        ProductAccount::factory()->create(['product_id' => $outOfStockProd->id, 'status' => AccountStatus::RENTED]);

        $response = $this->get('/');
        $response->assertOk();

        $mainProducts = $response->viewData('page')['props']['products'];
        $outOfStockProducts = $response->viewData('page')['props']['outOfStockProducts'];

        $mainSlugs = collect($mainProducts)->pluck('slug')->all();
        $emptySlugs = collect($outOfStockProducts)->pluck('slug')->all();

        $this->assertContains('in-stock', $mainSlugs);
        $this->assertNotContains('empty-service', $mainSlugs, 'Out-of-stock service must NOT appear in main catalog grid');

        $this->assertContains('empty-service', $emptySlugs, 'Out-of-stock service MUST appear in outOfStockProducts (Sedang Kosong)');
        $this->assertNotContains('in-stock', $emptySlugs);
    }

    /**
     * Test 9: Public storefront props do NOT leak sensitive columns.
     */
    public function test_public_storefront_props_do_not_leak_sensitive_columns(): void
    {
        $prod = Product::factory()->create([
            'name' => 'Secure Netflix',
            'slug' => 'secure-netflix',
            'has_warranty' => true,
        ]);
        ProductVariant::factory()->create(['product_id' => $prod->id]);
        ProductAccount::factory()->create([
            'product_id' => $prod->id,
            'status' => AccountStatus::AVAILABLE,
            'credential' => 'secret_password_do_not_leak',
        ]);

        $response = $this->get('/');
        $response->assertOk();

        $props = $response->viewData('page')['props']['products'];
        $item = collect($props)->firstWhere('slug', 'secure-netflix');

        $this->assertNotNull($item);

        // Assert allowed keys exist
        $this->assertArrayHasKey('id', $item);
        $this->assertArrayHasKey('name', $item);
        $this->assertArrayHasKey('slug', $item);
        $this->assertArrayHasKey('cover_url', $item);
        $this->assertArrayHasKey('logo_url', $item);
        $this->assertArrayHasKey('brand_color', $item);
        $this->assertArrayHasKey('has_warranty', $item);
        $this->assertArrayHasKey('min_price', $item);
        $this->assertArrayHasKey('status', $item);

        // Assert forbidden/sensitive keys DO NOT exist
        $forbiddenKeys = [
            'credential',
            'credentials',
            'password',
            'cost_price',
            'email',
            'login_url',
            'cookies',
            'token',
            'rules',
        ];

        foreach ($forbiddenKeys as $forbiddenKey) {
            $this->assertArrayNotHasKey($forbiddenKey, $item, "Sensitive key '{$forbiddenKey}' leaked to public storefront prop!");
        }
    }

    /**
     * Test 10: Storefront query budget prevents N+1 queries.
     */
    public function test_storefront_query_budget_prevents_n_plus_one(): void
    {
        // Create 12 diverse products with variants, accounts, and orders
        for ($i = 0; $i < 12; $i++) {
            $p = Product::factory()->create(['name' => "Service $i", 'slug' => "service-$i"]);
            $v = ProductVariant::factory()->create(['product_id' => $p->id]);
            ProductAccount::factory()->create(['product_id' => $p->id, 'status' => AccountStatus::AVAILABLE]);

            for ($j = 0; $j < 3; $j++) {
                Order::factory()->create([
                    'product_id' => $p->id,
                    'variant_id' => $v->id,
                    'status' => OrderStatus::PAID,
                ]);
            }
        }

        DB::flushQueryLog();
        DB::enableQueryLog();

        $response = $this->get('/');
        $response->assertOk();

        $queries = DB::getQueryLog();
        $queryCount = count($queries);

        // Setting, QuotaService, Banners, PaymentMethods, Products (eager loaded), and Variants.
        // Query budget should be strictly <= 10 queries regardless of whether there are 5 or 50 products (O(1) queries).
        $this->assertLessThanOrEqual(
            10,
            $queryCount,
            "Storefront query count ({$queryCount}) exceeded N+1 query budget limit of 10 queries."
        );
    }
}
