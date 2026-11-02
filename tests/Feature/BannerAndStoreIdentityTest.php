<?php

namespace Tests\Feature;

use App\Models\Banner;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BannerAndStoreIdentityTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@streampoint.test',
            'is_admin' => true,
        ]);

        $this->regularUser = User::factory()->create([
            'name' => 'Regular User',
            'email' => 'regular@streampoint.test',
            'is_admin' => false,
        ]);

        Storage::fake('public');
    }

    public function test_banner_crud_is_restricted_to_admin_only(): void
    {
        $banner = Banner::factory()->create(['title' => 'Test Banner']);

        // 1. Guest redirected to login
        $this->get('/admin/banners')->assertRedirect(route('login'));
        $this->get('/admin/banners/create')->assertRedirect(route('login'));
        $this->post('/admin/banners', ['title' => 'Guest Post'])->assertRedirect(route('login'));
        $this->get("/admin/banners/{$banner->id}/edit")->assertRedirect(route('login'));
        $this->put("/admin/banners/{$banner->id}", ['title' => 'Guest Put'])->assertRedirect(route('login'));
        $this->delete("/admin/banners/{$banner->id}")->assertRedirect(route('login'));

        // 2. Regular non-admin user gets 403
        $this->actingAs($this->regularUser)->get('/admin/banners')->assertForbidden();
        $this->actingAs($this->regularUser)->get('/admin/banners/create')->assertForbidden();
        $this->actingAs($this->regularUser)->post('/admin/banners', ['title' => 'User Post'])->assertForbidden();
        $this->actingAs($this->regularUser)->get("/admin/banners/{$banner->id}/edit")->assertForbidden();
        $this->actingAs($this->regularUser)->put("/admin/banners/{$banner->id}", ['title' => 'User Put'])->assertForbidden();
        $this->actingAs($this->regularUser)->delete("/admin/banners/{$banner->id}")->assertForbidden();

        // 3. Admin can access CRUD
        $this->actingAs($this->adminUser)->get('/admin/banners')->assertOk();
        $this->actingAs($this->adminUser)->get('/admin/banners/create')->assertOk();
        $this->actingAs($this->adminUser)->get("/admin/banners/{$banner->id}/edit")->assertOk();

        // Admin create banner
        $response = $this->actingAs($this->adminUser)->post('/admin/banners', [
            'title' => 'Admin Promo Baru',
            'subtitle' => 'Diskon khusus akhir pekan',
            'cta_label' => 'Beli Sekarang',
            'cta_url' => '/#katalog',
            'tone' => 'accent',
            'is_active' => true,
            'sort_order' => 1,
        ]);
        $response->assertRedirect('/admin/banners');
        $this->assertDatabaseHas('banners', ['title' => 'Admin Promo Baru']);

        // Admin delete banner
        $this->actingAs($this->adminUser)->delete("/admin/banners/{$banner->id}")
            ->assertRedirect('/admin/banners');
        $this->assertDatabaseMissing('banners', ['id' => $banner->id]);
    }

    public function test_banner_cta_url_validation(): void
    {
        $validUrls = [
            '/katalog',
            '/p/netflix-premium',
            'https://example.com/promo',
            'https://wa.me/6281234567890',
        ];

        foreach ($validUrls as $url) {
            $response = $this->actingAs($this->adminUser)->post('/admin/banners', [
                'title' => 'Valid URL Banner',
                'cta_url' => $url,
                'tone' => 'neutral',
                'is_active' => false,
            ]);
            $response->assertSessionHasNoErrors();
        }

        $invalidUrls = [
            'javascript:alert(1)',
            'JAVASCRIPT:void(0)',
            'data:text/html,<script>alert(1)</script>',
            'vbscript:msgbox(1)',
            'ftp://example.com/file',
            'http://insecure.example.com',
            'relative-without-slash',
            '//protocol-relative.test',
        ];

        foreach ($invalidUrls as $badUrl) {
            $response = $this->actingAs($this->adminUser)->post('/admin/banners', [
                'title' => 'Invalid URL Banner',
                'cta_url' => $badUrl,
                'tone' => 'neutral',
                'is_active' => false,
            ]);
            $response->assertSessionHasErrors('cta_url');
        }
    }

    public function test_banner_image_upload_validation(): void
    {
        // 1. Valid PNG upload
        $validImage = UploadedFile::fake()->image('banner.png', 800, 400)->size(500);
        $resValid = $this->actingAs($this->adminUser)->post('/admin/banners', [
            'title' => 'Banner With Image',
            'image' => $validImage,
            'tone' => 'neutral',
            'is_active' => false,
        ]);
        $resValid->assertSessionHasNoErrors();

        // 2. Reject SVG
        $svgFile = UploadedFile::fake()->create('banner.svg', 10, 'image/svg+xml');
        $resSvg = $this->actingAs($this->adminUser)->post('/admin/banners', [
            'title' => 'Banner With SVG',
            'image' => $svgFile,
            'tone' => 'neutral',
            'is_active' => false,
        ]);
        $resSvg->assertSessionHasErrors('image');

        // 3. Reject non-image text file
        $txtFile = UploadedFile::fake()->create('banner.txt', 10, 'text/plain');
        $resTxt = $this->actingAs($this->adminUser)->post('/admin/banners', [
            'title' => 'Banner With TXT',
            'image' => $txtFile,
            'tone' => 'neutral',
            'is_active' => false,
        ]);
        $resTxt->assertSessionHasErrors('image');

        // 4. Reject oversized image (> 2MB)
        $bigImage = UploadedFile::fake()->image('huge.jpg')->size(2500);
        $resBig = $this->actingAs($this->adminUser)->post('/admin/banners', [
            'title' => 'Banner Too Big',
            'image' => $bigImage,
            'tone' => 'neutral',
            'is_active' => false,
        ]);
        $resBig->assertSessionHasErrors('image');
    }

    public function test_banner_maximum_5_active_limit(): void
    {
        // Create 5 active banners
        Banner::factory()->count(5)->create(['is_active' => true]);

        // Attempting to create a 6th active banner should fail
        $resCreate6 = $this->actingAs($this->adminUser)->post('/admin/banners', [
            'title' => 'Sixth Active Banner',
            'tone' => 'neutral',
            'is_active' => true,
        ]);
        $resCreate6->assertSessionHasErrors('is_active');

        // Creating an inactive banner should succeed
        $resCreateInactive = $this->actingAs($this->adminUser)->post('/admin/banners', [
            'title' => 'Inactive Banner',
            'tone' => 'neutral',
            'is_active' => false,
        ]);
        $resCreateInactive->assertSessionHasNoErrors();

        $inactiveBanner = Banner::where('title', 'Inactive Banner')->first();
        $this->assertNotNull($inactiveBanner);

        // Attempting to update inactive banner to active when already 5 active exist should fail
        $resUpdateToActive = $this->actingAs($this->adminUser)->put("/admin/banners/{$inactiveBanner->id}", [
            'title' => 'Now Trying to Activate',
            'tone' => 'neutral',
            'is_active' => true,
        ]);
        $resUpdateToActive->assertSessionHasErrors('is_active');

        // Updating an existing active banner without changing active count should succeed
        $firstActive = Banner::where('is_active', true)->first();
        $resUpdateSelf = $this->actingAs($this->adminUser)->put("/admin/banners/{$firstActive->id}", [
            'title' => 'Updated Title for Active',
            'tone' => 'accent',
            'is_active' => true,
        ]);
        $resUpdateSelf->assertSessionHasNoErrors();
    }

    public function test_props_publik_memuat_hanya_banner_aktif_dan_dalam_jadwal(): void
    {
        Carbon::setTestNow('2026-11-02 12:00:00');

        // 1. Inactive banner (should NOT be visible)
        Banner::factory()->create([
            'title' => 'Inactive Banner',
            'is_active' => false,
        ]);

        // 2. Active banner past schedule (ended yesterday -> should NOT be visible)
        Banner::factory()->create([
            'title' => 'Past Schedule Banner',
            'is_active' => true,
            'starts_at' => Carbon::now()->subDays(5),
            'ends_at' => Carbon::now()->subDays(1),
        ]);

        // 3. Active banner future schedule (starts tomorrow -> should NOT be visible)
        Banner::factory()->create([
            'title' => 'Future Schedule Banner',
            'is_active' => true,
            'starts_at' => Carbon::now()->addDay(),
            'ends_at' => Carbon::now()->addDays(5),
        ]);

        // 4. Active banner currently in schedule (should BE visible)
        Banner::factory()->create([
            'title' => 'Currently Scheduled Banner',
            'subtitle' => 'Tampil saat ini',
            'cta_label' => 'Kunjungi',
            'cta_url' => '/#katalog',
            'tone' => 'accent',
            'is_active' => true,
            'starts_at' => Carbon::now()->subHour(),
            'ends_at' => Carbon::now()->addHour(),
        ]);

        // 5. Active banner with no dates (should BE visible)
        Banner::factory()->create([
            'title' => 'Always Active Banner',
            'subtitle' => 'Tanpa jadwal',
            'cta_label' => 'Katalog',
            'cta_url' => '/#katalog',
            'tone' => 'neutral',
            'is_active' => true,
            'starts_at' => null,
            'ends_at' => null,
        ]);

        $response = $this->get('/');
        $response->assertOk();
        $response->assertInertia(function (Assert $page) {
            $page->has('banners', 2);
            $page->where('banners.0.title', 'Currently Scheduled Banner');
            $page->where('banners.1.title', 'Always Active Banner');

            // Verify minimal columns: internal columns excluded
            $page->has('banners.0', function (Assert $banner) {
                $banner->has('id')
                    ->has('title')
                    ->has('subtitle')
                    ->has('cta_label')
                    ->has('cta_url')
                    ->has('image_path')
                    ->has('tone')
                    ->missing('created_at')
                    ->missing('updated_at')
                    ->missing('starts_at')
                    ->missing('ends_at')
                    ->missing('is_active')
                    ->missing('sort_order');
            });
        });

        Carbon::setTestNow();
    }

    public function test_beranda_dengan_banner_aktif_menyembunyikan_pita_intro_dan_beranda_tanpa_banner_menampilkan_pita_intro(): void
    {
        // 1. With active banner
        Banner::query()->delete();
        Banner::factory()->create([
            'title' => 'Banner Diskon Aktif',
            'is_active' => true,
        ]);

        $responseWithBanner = $this->get('/');
        $responseWithBanner->assertOk();
        $responseWithBanner->assertInertia(fn (Assert $page) => $page
            ->component('storefront/Index')
            ->has('banners', 1)
            ->where('banners.0.title', 'Banner Diskon Aktif')
        );

        // 2. Without active banner (all inactive or empty)
        Banner::query()->update(['is_active' => false]);

        $responseWithoutBanner = $this->get('/');
        $responseWithoutBanner->assertOk();
        $responseWithoutBanner->assertInertia(fn (Assert $page) => $page
            ->component('storefront/Index')
            ->has('banners', 0)
        );
    }

    public function test_product_brand_color_validation(): void
    {
        $validColors = [
            '#E50914',
            '#ff0000',
            '#1DB954',
            '#AABBCC',
            null,
            '',
        ];

        foreach ($validColors as $color) {
            $payload = [
                'name' => 'Service ' . uniqid(),
                'slug' => 'service-' . uniqid(),
                'category' => 'Streaming',
                'brand_color' => $color,
                'description' => 'Test service description',
                'rules' => 'Test service rules',
                'is_active' => true,
                'sort_order' => 1,
            ];

            $response = $this->actingAs($this->adminUser)->post('/admin/products', $payload);
            $response->assertSessionHasNoErrors();
        }

        $invalidColors = [
            'red',
            '#12345',
            '#GGGGGG',
            'url(x)',
            '#123456; background: red',
            '#123(45)',
            '#12345678',
            '#12',
            'rgb(255,0,0)',
        ];

        foreach ($invalidColors as $badColor) {
            $payload = [
                'name' => 'Invalid Color Service',
                'slug' => 'invalid-color-' . uniqid(),
                'category' => 'Streaming',
                'brand_color' => $badColor,
                'description' => 'Test service description',
                'rules' => 'Test service rules',
                'is_active' => true,
                'sort_order' => 1,
            ];

            $response = $this->actingAs($this->adminUser)->post('/admin/products', $payload);
            $response->assertSessionHasErrors('brand_color');
        }
    }

    public function test_setting_accent_preset_and_store_logo_validation(): void
    {
        // 1. Valid accent presets
        $presets = ['emerald', 'teal', 'blue', 'mono'];
        foreach ($presets as $preset) {
            $response = $this->actingAs($this->adminUser)->post('/admin/settings', [
                'store_name' => 'StreamPoint Store',
                'accent_preset' => $preset,
                'max_daily_rent_quota' => 10,
                'admin_whatsapp' => '081234567890',
                'business_hours' => '09:00 - 21:00',
            ]);
            $response->assertSessionHasNoErrors();
        }

        // 2. Invalid accent presets
        $invalidPresets = ['purple', 'red', 'dark', 'invalid', 'emerald; color: red'];
        foreach ($invalidPresets as $badPreset) {
            $response = $this->actingAs($this->adminUser)->post('/admin/settings', [
                'store_name' => 'StreamPoint Store',
                'accent_preset' => $badPreset,
                'max_daily_rent_quota' => 10,
                'admin_whatsapp' => '081234567890',
                'business_hours' => '09:00 - 21:00',
            ]);
            $response->assertSessionHasErrors('accent_preset');
        }

        // 3. Valid store logo upload
        $logo = UploadedFile::fake()->image('logo.png', 200, 200)->size(500);
        $resLogo = $this->actingAs($this->adminUser)->post('/admin/settings', [
            'store_name' => 'StreamPoint Store',
            'accent_preset' => 'emerald',
            'store_logo' => $logo,
            'max_daily_rent_quota' => 10,
            'admin_whatsapp' => '081234567890',
            'business_hours' => '09:00 - 21:00',
        ]);
        $resLogo->assertSessionHasNoErrors();

        // 4. Reject SVG logo
        $svgLogo = UploadedFile::fake()->create('logo.svg', 10, 'image/svg+xml');
        $resSvgLogo = $this->actingAs($this->adminUser)->post('/admin/settings', [
            'store_name' => 'StreamPoint Store',
            'accent_preset' => 'emerald',
            'store_logo' => $svgLogo,
            'max_daily_rent_quota' => 10,
            'admin_whatsapp' => '081234567890',
            'business_hours' => '09:00 - 21:00',
        ]);
        $resSvgLogo->assertSessionHasErrors('store_logo');
    }

    public function test_data_accent_attribute_and_store_name_in_html_response(): void
    {
        Setting::current()->update([
            'store_name' => 'KiosStreaming Super',
            'accent_preset' => 'blue',
        ]);

        $response = $this->get('/');
        $response->assertOk();

        // Verify data-accent="blue" rendered server-side on <html>
        $content = $response->getContent();
        $this->assertStringContainsString('data-accent="blue"', $content);

        // Verify store name rendered in title or initial script
        $this->assertStringContainsString('KiosStreaming Super', $content);

        // Change preset to teal
        Setting::current()->update([
            'accent_preset' => 'teal',
        ]);

        $responseTeal = $this->get('/');
        $responseTeal->assertOk();
        $this->assertStringContainsString('data-accent="teal"', $responseTeal->getContent());
    }
}
