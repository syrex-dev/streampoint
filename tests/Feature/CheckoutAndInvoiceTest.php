<?php

namespace Tests\Feature;

use App\Actions\Order\ConfirmPayment;
use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentMethodType;
use App\Enums\RentDuration;
use App\Jobs\SendAdminNotification;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductAccount;
use App\Models\ProductVariant;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CheckoutAndInvoiceTest extends TestCase
{
    use RefreshDatabase;

    protected Product $product;
    protected ProductVariant $rentVariant;
    protected ProductVariant $buyVariant;
    protected PaymentMethod $paymentMethod;
    protected ProductAccount $rentAccount;
    protected ProductAccount $buyAccount;

    protected function setUp(): void
    {
        parent::setUp();

        Setting::current()->update(['max_daily_rent_quota' => 5]);

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
            'price' => 50000,
            'is_active' => true,
            'sort_order' => 2,
        ]);

        $this->paymentMethod = PaymentMethod::create([
            'type' => PaymentMethodType::QRIS,
            'label' => 'QRIS All Payment',
            'account_number' => null,
            'account_holder' => 'StreamPoint',
            'qris_image_path' => null,
            'instructions' => 'Scan QRIS untuk pembayaran',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->rentAccount = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => 'rent_user@example.com|rentpass123|Profil 1|1111',
            'status' => AccountStatus::AVAILABLE,
        ]);

        $this->buyAccount = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::BUY,
            'credential' => 'buy_user@example.com|buypass123|Profil 2|2222',
            'status' => AccountStatus::AVAILABLE,
        ]);
    }

    public function test_checkout_successfully_creates_order_and_redirects_to_invoice(): void
    {
        Queue::fake();

        $response = $this->post('/checkout', [
            'variant_id' => $this->rentVariant->id,
            'customer_phone' => '081234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'customer_note' => 'Tolong proses cepat',
            'idempotency_key' => 'idemp-test-1',
            'hp_website' => '',
        ]);

        $order = Order::first();
        $this->assertNotNull($order);
        $this->assertEquals(OrderStatus::PENDING, $order->status);
        $this->assertEquals('6281234567890', $order->customer_phone);
        $this->assertEquals(15000, $order->base_price);
        $this->assertGreaterThanOrEqual(100, $order->unique_code);
        $this->assertLessThanOrEqual(999, $order->unique_code);
        $this->assertEquals($order->base_price + $order->unique_code, $order->total_amount);
        $this->assertEquals($this->rentAccount->id, $order->account_id);

        $response->assertRedirect("/invoice/{$order->invoice_code}");
        $this->assertTrue(in_array($order->invoice_code, session('owned_invoices', []), true));

        Queue::assertPushed(SendAdminNotification::class);
    }

    public function test_checkout_rejects_bot_when_honeypot_is_filled(): void
    {
        $response = $this->post('/checkout', [
            'variant_id' => $this->rentVariant->id,
            'customer_phone' => '081234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'idempotency_key' => 'idemp-bot-1',
            'hp_website' => 'https://spam-bot.com',
        ]);

        $response->assertSessionHasErrors('hp_website');
        $this->assertEquals(0, Order::count());
    }

    public function test_checkout_idempotency_key_returns_same_invoice_without_duplicate(): void
    {
        $key = 'uuid-repeat-test';

        $res1 = $this->post('/checkout', [
            'variant_id' => $this->rentVariant->id,
            'customer_phone' => '081234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'idempotency_key' => $key,
            'hp_website' => '',
        ]);

        $order1 = Order::first();
        $this->assertNotNull($order1);
        $res1->assertRedirect("/invoice/{$order1->invoice_code}");

        // Second submission with identical idempotency_key
        $res2 = $this->post('/checkout', [
            'variant_id' => $this->rentVariant->id,
            'customer_phone' => '081234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'idempotency_key' => $key,
            'hp_website' => '',
        ]);

        $res2->assertRedirect("/invoice/{$order1->invoice_code}");
        $this->assertEquals(1, Order::count());
    }

    public function test_checkout_returns_inline_validation_error_when_quota_full(): void
    {
        Setting::current()->update(['max_daily_rent_quota' => 1]);

        // Consume quota
        $this->post('/checkout', [
            'variant_id' => $this->rentVariant->id,
            'customer_phone' => '081234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'idempotency_key' => 'idemp-q1',
            'hp_website' => '',
        ]);

        // Second checkout attempts rent from a different buyer while quota full
        $this->flushSession();
        $res = $this->from("/p/{$this->product->slug}")->post('/checkout', [
            'variant_id' => $this->rentVariant->id,
            'customer_phone' => '081298765432',
            'payment_method_id' => $this->paymentMethod->id,
            'idempotency_key' => 'idemp-q2',
            'hp_website' => '',
        ]);

        $res->assertRedirect("/p/{$this->product->slug}");
        $res->assertSessionHasErrors(['variant_id']);
        $this->assertEquals(1, Order::count());
    }

    public function test_checkout_returns_inline_validation_error_when_out_of_stock(): void
    {
        // Mark available buy stock as RENTED/DISABLED
        $this->buyAccount->update(['status' => AccountStatus::DISABLED]);

        $res = $this->from("/p/{$this->product->slug}")->post('/checkout', [
            'variant_id' => $this->buyVariant->id,
            'customer_phone' => '081234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'idempotency_key' => 'idemp-nostock',
            'hp_website' => '',
        ]);

        $res->assertRedirect("/p/{$this->product->slug}");
        $res->assertSessionHasErrors(['variant_id']);
        $this->assertEquals(0, Order::count());
    }

    public function test_invoice_page_renders_without_credentials_for_unauthorized_user(): void
    {
        $order = Order::create([
            'invoice_code' => 'INV-20261101-TEST1',
            'product_id' => $this->product->id,
            'variant_id' => $this->rentVariant->id,
            'account_id' => $this->rentAccount->id,
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

        // Request without session
        $response = $this->get("/invoice/{$order->invoice_code}");
        $response->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('invoice/Show')
            ->where('isAuthorized', false)
            ->where('order.credentials', null)
            ->where('order.customer_phone', '6281****7890')
            ->missing('order.account_id')
        );
    }

    public function test_invoice_page_reveals_credentials_for_authorized_user_when_paid(): void
    {
        $order = Order::create([
            'invoice_code' => 'INV-20261101-TEST2',
            'product_id' => $this->product->id,
            'variant_id' => $this->rentVariant->id,
            'account_id' => $this->rentAccount->id,
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

        $response = $this->withSession(['owned_invoices' => [$order->invoice_code]])
            ->get("/invoice/{$order->invoice_code}");

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('invoice/Show')
            ->where('isAuthorized', true)
            ->where('order.credentials.email', 'rent_user@example.com')
            ->where('order.credentials.password', 'rentpass123')
            ->where('order.credentials.profile', 'Profil 1')
            ->where('order.credentials.pin', '1111')
            ->where('order.customer_phone', '6281234567890')
            ->missing('order.account_id')
        );
    }

    public function test_invoice_phone_verification_authorizes_session(): void
    {
        $order = Order::create([
            'invoice_code' => 'INV-20261101-TEST3',
            'product_id' => $this->product->id,
            'variant_id' => $this->rentVariant->id,
            'account_id' => $this->rentAccount->id,
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

        // Wrong phone fails
        $badRes = $this->post("/invoice/{$order->invoice_code}/verify", ['phone' => '089999999999']);
        $badRes->assertSessionHasErrors('phone');
        $this->assertFalse(in_array($order->invoice_code, session('owned_invoices', []), true));

        // Matching phone succeeds and sets session
        $goodRes = $this->post("/invoice/{$order->invoice_code}/verify", ['phone' => '081234567890']);
        $goodRes->assertSessionHasNoErrors();
        $this->assertTrue(in_array($order->invoice_code, session('owned_invoices', []), true));
    }

    public function test_confirm_payment_transitions_pending_to_verifying(): void
    {
        Queue::fake();

        $order = Order::create([
            'invoice_code' => 'INV-20261101-TEST4',
            'product_id' => $this->product->id,
            'variant_id' => $this->rentVariant->id,
            'account_id' => $this->rentAccount->id,
            'order_type' => OrderType::RENT,
            'status' => OrderStatus::PENDING,
            'base_price' => 15000,
            'unique_code' => 123,
            'total_amount' => 15123,
            'customer_phone' => '6281234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'payment_method_label' => 'QRIS',
            'payment_expires_at' => now()->addMinutes(15),
            'quota_date' => now()->toDateString(),
        ]);

        $response = $this->post("/invoice/{$order->invoice_code}/confirm");
        $response->assertSessionHasNoErrors();

        $order->refresh();
        $this->assertEquals(OrderStatus::VERIFYING, $order->status);

        Queue::assertPushed(SendAdminNotification::class);
    }

    public function test_confirm_payment_rejects_expired_order(): void
    {
        $order = Order::create([
            'invoice_code' => 'INV-20261101-TEST5',
            'product_id' => $this->product->id,
            'variant_id' => $this->rentVariant->id,
            'account_id' => $this->rentAccount->id,
            'order_type' => OrderType::RENT,
            'status' => OrderStatus::EXPIRED,
            'base_price' => 15000,
            'unique_code' => 123,
            'total_amount' => 15123,
            'customer_phone' => '6281234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'payment_method_label' => 'QRIS',
            'payment_expires_at' => now()->subMinutes(5),
            'quota_date' => now()->toDateString(),
        ]);

        $response = $this->post("/invoice/{$order->invoice_code}/confirm");
        $response->assertSessionHasErrors('confirm');

        $order->refresh();
        $this->assertEquals(OrderStatus::EXPIRED, $order->status);
    }

    public function test_proof_upload_validates_file_and_stores_on_private_disk(): void
    {
        Storage::fake('private');
        Storage::fake('public');

        $order = Order::create([
            'invoice_code' => 'INV-20261101-TEST6',
            'product_id' => $this->product->id,
            'variant_id' => $this->rentVariant->id,
            'account_id' => $this->rentAccount->id,
            'order_type' => OrderType::RENT,
            'status' => OrderStatus::PENDING,
            'base_price' => 15000,
            'unique_code' => 123,
            'total_amount' => 15123,
            'customer_phone' => '6281234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'payment_method_label' => 'QRIS',
            'payment_expires_at' => now()->addMinutes(15),
            'quota_date' => now()->toDateString(),
        ]);

        // 1. Reject non-image
        $badFile = UploadedFile::fake()->create('proof.pdf', 500, 'application/pdf');
        $resBad = $this->post("/invoice/{$order->invoice_code}/confirm", ['proof' => $badFile]);
        $resBad->assertSessionHasErrors('proof');

        // 2. Reject file > 3MB (3073 KB)
        $largeFile = UploadedFile::fake()->image('huge.jpg')->size(3073);
        $resLarge = $this->post("/invoice/{$order->invoice_code}/confirm", ['proof' => $largeFile]);
        $resLarge->assertSessionHasErrors('proof');

        // 3. Accept valid image (< 3MB)
        $goodFile = UploadedFile::fake()->image('transfer.jpg')->size(1024);
        $resGood = $this->post("/invoice/{$order->invoice_code}/confirm", ['proof' => $goodFile]);
        $resGood->assertSessionHasNoErrors();

        $order->refresh();
        $this->assertNotNull($order->payment_proof_path);

        // Check private disk has file, public disk does not
        Storage::disk('private')->assertExists($order->payment_proof_path);
        Storage::disk('public')->assertMissing($order->payment_proof_path);
    }

    public function test_tracking_by_phone_does_not_leak_credentials_totals_or_account_ids(): void
    {
        $order = Order::create([
            'invoice_code' => 'INV-20261101-TEST7',
            'product_id' => $this->product->id,
            'variant_id' => $this->rentVariant->id,
            'account_id' => $this->rentAccount->id,
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

        $response = $this->post('/cek-pesanan', [
            'mode' => 'phone',
            'phone' => '081234567890',
        ]);

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('tracking/Index')
            ->where('searched', true)
            ->has('orders', 1)
            ->where('orders.0.invoice_code', $order->invoice_code)
            ->where('orders.0.service_name', $this->product->name)
            ->where('orders.0.package_name', $this->rentVariant->name)
            ->where('orders.0.status', 'PAID')
            ->missing('orders.0.credentials')
            ->missing('orders.0.total_amount')
            ->missing('orders.0.base_price')
            ->missing('orders.0.unique_code')
            ->missing('orders.0.account_id')
        );
    }

    public function test_tracking_by_invoice_and_phone_authorizes_session_and_redirects(): void
    {
        $order = Order::create([
            'invoice_code' => 'INV-20261101-TEST8',
            'product_id' => $this->product->id,
            'variant_id' => $this->rentVariant->id,
            'account_id' => $this->rentAccount->id,
            'order_type' => OrderType::RENT,
            'status' => OrderStatus::PENDING,
            'base_price' => 15000,
            'unique_code' => 123,
            'total_amount' => 15123,
            'customer_phone' => '6281234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'payment_method_label' => 'QRIS',
            'payment_expires_at' => now()->addMinutes(15),
            'quota_date' => now()->toDateString(),
        ]);

        $response = $this->post('/cek-pesanan', [
            'mode' => 'invoice',
            'invoice_code' => $order->invoice_code,
            'phone' => '081234567890',
        ]);

        $response->assertRedirect("/invoice/{$order->invoice_code}");
        $this->assertTrue(in_array($order->invoice_code, session('owned_invoices', []), true));
    }

    public function test_telegram_notifications_escape_html_inputs(): void
    {
        config([
            'notify.telegram.bot_token' => 'dummy_token_123',
            'notify.telegram.chat_id' => '987654321',
        ]);

        Http::fake([
            'https://api.telegram.org/*' => Http::response(['ok' => true], 200),
        ]);

        $order = Order::create([
            'invoice_code' => 'INV-20261101-XSS',
            'product_id' => $this->product->id,
            'variant_id' => $this->rentVariant->id,
            'account_id' => $this->rentAccount->id,
            'order_type' => OrderType::RENT,
            'status' => OrderStatus::PENDING,
            'base_price' => 15000,
            'unique_code' => 123,
            'total_amount' => 15123,
            'customer_phone' => '6281234567890',
            'customer_note' => '<script>alert("hack")</script> & "quotes"',
            'payment_method_id' => $this->paymentMethod->id,
            'payment_method_label' => '<b>QRIS</b>',
            'payment_expires_at' => now()->addMinutes(15),
            'quota_date' => now()->toDateString(),
        ]);

        // Test order.created notification
        SendAdminNotification::dispatchSync('order.created', $order->id);

        Http::assertSent(function ($request) {
            $text = $request['text'] ?? '';
            // Must contain escaped HTML entities
            return str_contains($text, '&lt;script&gt;')
                && str_contains($text, '&amp;')
                && ! str_contains($text, '<script>');
        });
    }
}
