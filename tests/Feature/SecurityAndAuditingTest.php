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
use App\Services\Notification\TelegramChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SecurityAndAuditingTest extends TestCase
{
    use RefreshDatabase;

    protected Product $product;
    protected ProductVariant $variant;
    protected PaymentMethod $paymentMethod;
    protected ProductAccount $account;
    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        Setting::current()->update(['max_daily_rent_quota' => 5]);

        $this->product = Product::create([
            'slug' => 'netflix-premium',
            'name' => 'Netflix Premium UHD',
            'category' => 'Streaming',
            'thumbnail_path' => '/storage/products/dummy.webp',
            'description' => 'Akun premium 4K',
            'rules' => 'Aturan penggunaan akun',
            'is_active' => true,
        ]);

        $this->variant = ProductVariant::create([
            'product_id' => $this->product->id,
            'name' => 'Sewa 1 Hari (24 Jam)',
            'type' => OrderType::RENT,
            'rent_duration' => RentDuration::ONE_DAY,
            'duration_hours' => 24,
            'price' => 15000,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->paymentMethod = PaymentMethod::create([
            'type' => PaymentMethodType::QRIS,
            'label' => 'QRIS Realtime',
            'account_number' => null,
            'account_holder' => 'StreamPoint',
            'qris_image_path' => '/storage/qris/dummy.webp',
            'instructions' => 'Scan QRIS',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->account = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => 'user_rahasia@example.com | pass_super_secret_123 | Profil 1 | 9999',
            'status' => AccountStatus::AVAILABLE,
        ]);

        $this->adminUser = User::factory()->create([
            'name' => 'Admin StreamPoint',
            'email' => 'admin@streampoint.test',
            'is_admin' => true,
        ]);
    }

    /**
     * A.1: Kredensial terenkripsi di DB (baca kolom mentah vs Eloquent).
     */
    public function test_credentials_are_encrypted_in_database_raw_column(): void
    {
        $rawCredential = DB::table('product_accounts')
            ->where('id', $this->account->id)
            ->value('credential');

        // Raw column must not contain the plaintext password or email
        $this->assertNotEmpty($rawCredential);
        $this->assertStringNotContainsString('pass_super_secret_123', $rawCredential);
        $this->assertStringNotContainsString('user_rahasia@example.com', $rawCredential);

        // Eloquent model must automatically decrypt
        $freshAccount = ProductAccount::find($this->account->id);
        $this->assertStringContainsString('pass_super_secret_123', $freshAccount->credential);
        $this->assertStringContainsString('user_rahasia@example.com', $freshAccount->credential);
    }

    /**
     * A.1: Tidak ada kredensial atau nomor WA lengkap di controller publik.
     */
    public function test_public_controllers_do_not_expose_credentials_or_unmasked_phone(): void
    {
        // 1. Storefront GET /
        $resStorefront = $this->get('/');
        $resStorefront->assertOk();
        $resStorefront->assertInertia(fn (Assert $page) => $page
            ->component('storefront/Index')
            ->missing('products.0.credential')
            ->missing('products.0.accounts')
        );

        // 2. Product Detail GET /p/{slug}
        $resProduct = $this->get("/p/{$this->product->slug}");
        $resProduct->assertOk();
        $resProduct->assertInertia(fn (Assert $page) => $page
            ->component('product/Show')
            ->missing('product.credential')
            ->missing('product.accounts')
        );

        // Create an active paid order
        $order = Order::create([
            'invoice_code' => 'INV-20261102-SEC01',
            'product_id' => $this->product->id,
            'variant_id' => $this->variant->id,
            'account_id' => $this->account->id,
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
            'access_starts_at' => now(),
            'access_expires_at' => now()->addHours(24),
        ]);

        // 3. Tracking search POST /cek-pesanan by phone
        $resTracking = $this->post('/cek-pesanan', [
            'mode' => 'phone',
            'phone' => '081234567890',
        ]);
        $resTracking->assertOk();
        $resTracking->assertInertia(fn (Assert $page) => $page
            ->component('tracking/Index')
            ->missing('orders.0.credentials')
            ->missing('orders.0.account_id')
            ->missing('orders.0.customer_phone')
        );

        // 4. Unauthorized invoice GET /invoice/{code}
        $resInvoice = $this->get("/invoice/{$order->invoice_code}");
        $resInvoice->assertOk();
        $resInvoice->assertInertia(fn (Assert $page) => $page
            ->component('invoice/Show')
            ->where('isAuthorized', false)
            ->where('order.credentials', null)
            ->where('order.customer_phone', '6281****7890') // Masked
            ->missing('order.account_id')
        );
    }

    /**
     * A.2: Invoice credentials strictly locked to owner session or verified WhatsApp phone.
     */
    public function test_invoice_credentials_accessible_only_with_authorized_session_or_verified_phone(): void
    {
        $order = Order::create([
            'invoice_code' => 'INV-20261102-SEC02',
            'product_id' => $this->product->id,
            'variant_id' => $this->variant->id,
            'account_id' => $this->account->id,
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
            'access_starts_at' => now(),
            'access_expires_at' => now()->addHours(24),
        ]);

        // Unauthorized access: no credentials
        $this->get("/invoice/{$order->invoice_code}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('isAuthorized', false)
                ->where('order.credentials', null)
            );

        // Wrong phone verification: still unauthorized
        $this->post("/invoice/{$order->invoice_code}/verify", ['phone' => '089999999999'])
            ->assertSessionHasErrors('phone');

        // Correct phone verification unlocks credentials
        $this->post("/invoice/{$order->invoice_code}/verify", ['phone' => '081234567890'])
            ->assertSessionHasNoErrors();

        $this->get("/invoice/{$order->invoice_code}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('isAuthorized', true)
                ->where('order.credentials.email', 'user_rahasia@example.com')
                ->where('order.credentials.password', 'pass_super_secret_123')
            );
    }

    /**
     * A.3: Rate limits on checkout, invoice verification, tracking search, and login.
     */
    public function test_rate_limit_on_checkout_returns_429_after_threshold(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $res = $this->post('/checkout', [
                'variant_id' => $this->variant->id,
                'customer_phone' => '081234567890',
                'payment_method_id' => $this->paymentMethod->id,
                'idempotency_key' => 'idemp-rl-' . $i,
                'hp_website' => '',
            ]);
            $this->assertNotEquals(429, $res->status());
        }

        // 6th request within the same minute should be rate limited (429)
        $res = $this->post('/checkout', [
            'variant_id' => $this->variant->id,
            'customer_phone' => '081234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'idempotency_key' => 'idemp-rl-6',
            'hp_website' => '',
        ]);
        $res->assertStatus(429);
    }

    public function test_rate_limit_on_invoice_verification_returns_429_after_threshold(): void
    {
        $order = Order::create([
            'invoice_code' => 'INV-20261102-RLVERIFY',
            'product_id' => $this->product->id,
            'variant_id' => $this->variant->id,
            'account_id' => $this->account->id,
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
        ]);

        for ($i = 0; $i < 5; $i++) {
            $res = $this->post("/invoice/{$order->invoice_code}/verify", [
                'phone' => '089999999999',
            ]);
            $this->assertNotEquals(429, $res->status());
        }

        // 6th attempt within the same minute
        $res = $this->post("/invoice/{$order->invoice_code}/verify", [
            'phone' => '089999999999',
        ]);
        $res->assertStatus(429);
    }

    public function test_rate_limit_on_tracking_search_returns_429_after_threshold(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $res = $this->post('/cek-pesanan', [
                'mode' => 'phone',
                'phone' => '081234567890',
            ]);
            $this->assertNotEquals(429, $res->status());
        }

        // 11th request within the same minute
        $res = $this->post('/cek-pesanan', [
            'mode' => 'phone',
            'phone' => '081234567890',
        ]);
        $res->assertStatus(429);
    }

    public function test_rate_limit_on_admin_login_returns_429_after_threshold(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $res = $this->post('/login', [
                'email' => 'wrong_admin@streampoint.test',
                'password' => 'wrong_password',
            ]);
            $this->assertNotEquals(429, $res->status());
        }

        // 6th failed attempt within the same minute
        $res = $this->post('/login', [
            'email' => 'wrong_admin@streampoint.test',
            'password' => 'wrong_password',
        ]);
        $res->assertStatus(429);
    }

    /**
     * A.5: Two-factor authentication is active and configurable for admin.
     */
    public function test_two_factor_authentication_can_be_enabled_for_admin(): void
    {
        $this->actingAs($this->adminUser)
            ->withSession(['auth.password_confirmed_at' => time()]);

        // Fortify 2FA endpoint enables two factor
        $response = $this->post('/user/two-factor-authentication');
        $response->assertRedirect();

        $this->adminUser->refresh();
        $this->assertNotNull($this->adminUser->two_factor_secret);
    }

    /**
     * A.6: Security headers are present on HTTP responses.
     */
    public function test_security_headers_are_present_on_web_responses(): void
    {
        $response = $this->get('/');
        $response->assertOk();

        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    /**
     * A.7: TelegramChannel logs message body only when APP_ENV=local, and redacts in production.
     */
    public function test_telegram_channel_logging_in_local_vs_production(): void
    {
        // 1. In Local Environment: logs message content
        $this->app['env'] = 'local';
        Config::set('notify.telegram.bot_token', null);
        Config::set('notify.telegram.chat_id', null);

        Log::shouldReceive('info')
            ->once()
            ->withArgs(function ($message) {
                return str_contains($message, 'Telegram notification skipped')
                    && str_contains($message, 'Test Order Message Content');
            });

        $channel = new TelegramChannel();
        $channel->send('<b>Test Order Message Content</b>');

        // 2. In Production Environment: logs high-level summary only without message content
        $this->app['env'] = 'production';

        Log::shouldReceive('info')
            ->once()
            ->withArgs(function ($message) {
                return str_contains($message, 'Telegram notification skipped: bot_token or chat_id is not configured.')
                    && ! str_contains($message, 'Secret Message Content 6281234567890');
            });

        $channel->send('<b>Secret Message Content 6281234567890</b>');
    }
}
