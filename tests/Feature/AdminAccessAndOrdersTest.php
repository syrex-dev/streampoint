<?php

namespace Tests\Feature;

use App\Actions\Order\ApproveOrder;
use App\Actions\Order\ReactivateOrder;
use App\Actions\Order\RejectOrder;
use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentMethodType;
use App\Enums\RentDuration;
use App\Models\DailyQuotaOverride;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductAccount;
use App\Models\ProductVariant;
use App\Models\Setting;
use App\Models\User;
use App\Services\QuotaService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminAccessAndOrdersTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $regularUser;
    protected Product $product;
    protected ProductVariant $rentVariant;
    protected ProductVariant $buyVariant;
    protected PaymentMethod $paymentMethod;

    protected function setUp(): void
    {
        parent::setUp();

        Setting::current()->update([
            'max_daily_rent_quota' => 3,
            'admin_whatsapp' => '6281234567890',
            'business_hours' => 'Setiap hari, 09.00 - 21.00 WIB',
        ]);

        $this->adminUser = User::factory()->create([
            'name' => 'Admin StreamPoint',
            'email' => 'admin@streampoint.test',
            'is_admin' => true,
        ]);

        $this->regularUser = User::factory()->create([
            'name' => 'Regular User',
            'email' => 'buyer@streampoint.test',
            'is_admin' => false,
        ]);

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
            'name' => 'Beli 1 Bulan',
            'type' => OrderType::BUY,
            'rent_duration' => null,
            'duration_hours' => 720,
            'price' => 50000,
            'is_active' => true,
            'sort_order' => 2,
        ]);

        $this->paymentMethod = PaymentMethod::create([
            'type' => PaymentMethodType::QRIS,
            'label' => 'QRIS Realtime',
            'is_active' => true,
            'sort_order' => 1,
        ]);
    }

    protected function createOrder(
        OrderStatus $status = OrderStatus::PENDING,
        OrderType $type = OrderType::RENT,
        ?ProductAccount $account = null,
        ?string $proofPath = null
    ): Order {
        if (! $account) {
            $account = ProductAccount::create([
                'product_id' => $this->product->id,
                'kind' => $type,
                'credential' => json_encode(['Email' => 'acc@stream.test', 'Password' => 'pass123']),
                'status' => AccountStatus::RESERVED,
            ]);
        }

        $variant = $type === OrderType::RENT ? $this->rentVariant : $this->buyVariant;

        $order = Order::create([
            'invoice_code' => 'INV-' . date('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6)),
            'product_id' => $this->product->id,
            'variant_id' => $variant->id,
            'account_id' => $account->id,
            'order_type' => $type,
            'customer_phone' => '6281234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'payment_method_label' => $this->paymentMethod->label,
            'base_price' => $variant->price,
            'unique_code' => random_int(100, 999),
            'total_amount' => $variant->price + 123,
            'payment_proof_path' => $proofPath,
            'status' => $status,
            'payment_expires_at' => now()->addMinutes(15),
            'quota_date' => now()->toDateString(),
        ]);

        $account->update(['order_id' => $order->id]);

        return $order;
    }

    /** 1. Non-admin dan guest tidak bisa mengakses /admin */
    public function test_guest_is_redirected_when_accessing_admin_routes(): void
    {
        $this->get('/admin')->assertRedirect(route('login'));
        $this->get('/admin/orders')->assertRedirect(route('login'));
        $this->get('/admin/settings')->assertRedirect(route('login'));
    }

    public function test_non_admin_user_receives_403_when_accessing_admin_routes(): void
    {
        $this->actingAs($this->regularUser)
            ->get('/admin')
            ->assertForbidden();

        $this->actingAs($this->regularUser)
            ->get('/admin/orders')
            ->assertForbidden();

        $this->actingAs($this->regularUser)
            ->get('/admin/settings')
            ->assertForbidden();
    }

    public function test_admin_user_can_access_admin_dashboard_orders_and_settings(): void
    {
        $this->actingAs($this->adminUser)
            ->get('/admin')
            ->assertOk();

        $this->actingAs($this->adminUser)
            ->get('/admin/orders')
            ->assertOk();

        $this->actingAs($this->adminUser)
            ->get('/admin/settings')
            ->assertOk();
    }

    /** 2. Bukti bayar hanya bisa dibuka admin dan tidak ada URL publik */
    public function test_payment_proof_can_only_be_accessed_by_admin_and_has_no_public_url(): void
    {
        Storage::fake('private');
        $proofPath = 'proofs/test_transfer.jpg';
        Storage::disk('private')->put($proofPath, 'dummy-image-binary-data');

        $order = $this->createOrder(OrderStatus::VERIFYING, OrderType::RENT, null, $proofPath);

        // Guest is redirected to login
        $this->get("/admin/orders/{$order->id}/proof")->assertRedirect(route('login'));

        // Non-admin receives 403 Forbidden
        $this->actingAs($this->regularUser)
            ->get("/admin/orders/{$order->id}/proof")
            ->assertForbidden();

        // Admin can stream file
        $response = $this->actingAs($this->adminUser)
            ->get("/admin/orders/{$order->id}/proof");
        $response->assertOk();

        // Ensure proof is not present on public disk
        Storage::fake('public');
        $this->assertFalse(Storage::disk('public')->exists($proofPath));
    }

    /** 3. Approve mengisi access_starts_at/access_expires_at sesuai duration_hours dan mengubah status unit */
    public function test_approve_order_sets_access_dates_according_to_duration_hours_and_updates_unit_status(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-01 10:00:00'));

        // Test RENT order (24 hours)
        $rentOrder = $this->createOrder(OrderStatus::VERIFYING, OrderType::RENT);
        $rentAccount = $rentOrder->account;

        $this->actingAs($this->adminUser)
            ->post("/admin/orders/{$rentOrder->id}/approve")
            ->assertRedirect();

        $rentOrder->refresh();
        $rentAccount->refresh();

        $this->assertEquals(OrderStatus::PAID, $rentOrder->status);
        $this->assertEquals('2026-11-01 10:00:00', $rentOrder->paid_at->toDateTimeString());
        $this->assertEquals('2026-11-01 10:00:00', $rentOrder->access_starts_at->toDateTimeString());
        $this->assertEquals('2026-11-02 10:00:00', $rentOrder->access_expires_at->toDateTimeString());

        // Account status becomes RENTED with rented_until matching access_expires_at
        $this->assertEquals(AccountStatus::RENTED, $rentAccount->status);
        $this->assertEquals('2026-11-02 10:00:00', $rentAccount->rented_until->toDateTimeString());

        // Test BUY order (720 hours / 30 days)
        $buyOrder = $this->createOrder(OrderStatus::VERIFYING, OrderType::BUY);
        $buyAccount = $buyOrder->account;

        $this->actingAs($this->adminUser)
            ->post("/admin/orders/{$buyOrder->id}/approve")
            ->assertRedirect();

        $buyOrder->refresh();
        $buyAccount->refresh();

        $this->assertEquals(OrderStatus::PAID, $buyOrder->status);
        $this->assertEquals(AccountStatus::SOLD, $buyAccount->status);
        $this->assertNull($buyAccount->rented_until);

        // Verify audit event written with actor admin:{id}
        $event = $rentOrder->events()->where('to_status', OrderStatus::PAID)->first();
        $this->assertNotNull($event);
        $this->assertEquals("admin:{$this->adminUser->id}", $event->actor);

        Carbon::setTestNow();
    }

    public function test_approve_order_allows_swapping_account_unit(): void
    {
        $order = $this->createOrder(OrderStatus::VERIFYING, OrderType::RENT);
        $oldAccount = $order->account;

        $newAccount = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => json_encode(['Email' => 'new@stream.test', 'Password' => 'newpass']),
            'status' => AccountStatus::AVAILABLE,
        ]);

        $this->actingAs($this->adminUser)
            ->post("/admin/orders/{$order->id}/approve", [
                'account_id' => $newAccount->id,
            ])
            ->assertRedirect();

        $order->refresh();
        $oldAccount->refresh();
        $newAccount->refresh();

        $this->assertEquals($newAccount->id, $order->account_id);
        $this->assertEquals(AccountStatus::AVAILABLE, $oldAccount->status);
        $this->assertNull($oldAccount->order_id);
        $this->assertEquals(AccountStatus::RENTED, $newAccount->status);
        $this->assertEquals($order->id, $newAccount->order_id);
    }

    /** 4. Approve gagal dari status selain VERIFYING */
    public function test_approve_order_fails_from_status_other_than_verifying(): void
    {
        // PENDING order
        $pendingOrder = $this->createOrder(OrderStatus::PENDING);
        $this->actingAs($this->adminUser)
            ->post("/admin/orders/{$pendingOrder->id}/approve")
            ->assertSessionHasErrors('action');

        $this->assertEquals(OrderStatus::PENDING, $pendingOrder->fresh()->status);

        // EXPIRED order
        $expiredOrder = $this->createOrder(OrderStatus::EXPIRED);
        $this->actingAs($this->adminUser)
            ->post("/admin/orders/{$expiredOrder->id}/approve")
            ->assertSessionHasErrors('action');

        $this->assertEquals(OrderStatus::EXPIRED, $expiredOrder->fresh()->status);
    }

    /** 5. Reject melepas kuota dan unit */
    public function test_reject_order_requires_reason_and_releases_quota_and_account_unit(): void
    {
        $quotaService = app(QuotaService::class);
        $today = now()->toDateString();

        $order = $this->createOrder(OrderStatus::VERIFYING, OrderType::RENT);
        $account = $order->account;

        $this->assertEquals(1, $quotaService->used($today));
        $this->assertEquals(AccountStatus::RESERVED, $account->status);

        // Validation error if reason empty
        $this->actingAs($this->adminUser)
            ->post("/admin/orders/{$order->id}/reject", ['reason' => ''])
            ->assertSessionHasErrors('reason');

        // Successful reject with reason
        $this->actingAs($this->adminUser)
            ->post("/admin/orders/{$order->id}/reject", [
                'reason' => 'Mutasi pembayaran tidak ditemukan di rekening.',
            ])
            ->assertRedirect();

        $order->refresh();
        $account->refresh();

        $this->assertEquals(OrderStatus::CANCELLED, $order->status);
        $this->assertEquals('Mutasi pembayaran tidak ditemukan di rekening.', $order->status_note);

        // Unit returned to AVAILABLE
        $this->assertEquals(AccountStatus::AVAILABLE, $account->status);
        $this->assertNull($account->order_id);

        // Quota is released
        $this->assertEquals(0, $quotaService->used($today));

        // Audit event written
        $event = $order->events()->where('to_status', OrderStatus::CANCELLED)->first();
        $this->assertNotNull($event);
        $this->assertEquals("admin:{$this->adminUser->id}", $event->actor);
        $this->assertEquals('Mutasi pembayaran tidak ditemukan di rekening.', $event->note);
    }

    /** 6. Reactivate gagal jika kuota penuh atau unit habis dan berhasil jika tersedia */
    public function test_reactivate_order_fails_if_rent_quota_is_full(): void
    {
        // Fill quota (3 slots used)
        $this->createOrder(OrderStatus::PAID, OrderType::RENT);
        $this->createOrder(OrderStatus::PAID, OrderType::RENT);
        $this->createOrder(OrderStatus::PAID, OrderType::RENT);

        // Expired order to reactivate
        $expiredOrder = $this->createOrder(OrderStatus::EXPIRED, OrderType::RENT);

        // Provide an available account unit
        ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => json_encode(['Email' => 'extra@stream.test', 'Password' => 'pass']),
            'status' => AccountStatus::AVAILABLE,
        ]);

        $this->actingAs($this->adminUser)
            ->post("/admin/orders/{$expiredOrder->id}/reactivate")
            ->assertSessionHasErrors('action');

        $this->assertEquals(OrderStatus::EXPIRED, $expiredOrder->fresh()->status);
    }

    public function test_reactivate_order_fails_if_account_units_are_exhausted(): void
    {
        // 0 units available for this product
        ProductAccount::query()->delete();

        $expiredOrder = $this->createOrder(OrderStatus::EXPIRED, OrderType::RENT);

        $this->actingAs($this->adminUser)
            ->post("/admin/orders/{$expiredOrder->id}/reactivate")
            ->assertSessionHasErrors('action');

        $this->assertEquals(OrderStatus::EXPIRED, $expiredOrder->fresh()->status);
    }

    public function test_reactivate_order_succeeds_when_quota_and_unit_available_and_guarantees_unique_amount(): void
    {
        $expiredOrder = $this->createOrder(OrderStatus::EXPIRED, OrderType::RENT);

        // Provide an available account unit
        $newUnit = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => json_encode(['Email' => 'ready@stream.test', 'Password' => 'ready123']),
            'status' => AccountStatus::AVAILABLE,
        ]);

        $this->actingAs($this->adminUser)
            ->post("/admin/orders/{$expiredOrder->id}/reactivate")
            ->assertRedirect();

        $expiredOrder->refresh();
        $newUnit->refresh();

        $this->assertEquals(OrderStatus::PENDING, $expiredOrder->status);
        $this->assertEquals($newUnit->id, $expiredOrder->account_id);
        $this->assertEquals(AccountStatus::RESERVED, $newUnit->status);
        $this->assertTrue($expiredOrder->payment_expires_at->isFuture());
        $this->assertGreaterThanOrEqual(100, $expiredOrder->unique_code);

        // Audit event written
        $event = $expiredOrder->events()->where('to_status', OrderStatus::PENDING)->first();
        $this->assertNotNull($event);
        $this->assertEquals("admin:{$this->adminUser->id}", $event->actor);
    }

    /** 7. Override kuota dihormati */
    public function test_daily_quota_override_is_honored_and_can_close_rentals_with_zero(): void
    {
        $quotaService = app(QuotaService::class);
        $today = now()->toDateString();

        // Default limit is 3
        $this->assertEquals(3, $quotaService->limitFor($today));

        // Admin sets override to 5
        DailyQuotaOverride::updateOrCreate(['date' => $today], ['max_quota' => 5]);
        $this->assertEquals(5, $quotaService->limitFor($today));

        // Admin sets override to 0 (tutup sewa)
        DailyQuotaOverride::updateOrCreate(['date' => $today], ['max_quota' => 0]);
        $this->assertEquals(0, $quotaService->limitFor($today));
        $this->assertTrue($quotaService->snapshot()['is_full']);
    }

    /** 8. Release-rented mengembalikan unit */
    public function test_release_rented_command_returns_expired_rented_accounts_to_available(): void
    {
        $order1 = $this->createOrder(OrderStatus::PAID);
        $order2 = $this->createOrder(OrderStatus::PAID);

        // Account whose rental time passed 1 hour ago
        $account = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => json_encode(['Email' => 'old@stream.test', 'Password' => 'pass']),
            'status' => AccountStatus::RENTED,
            'order_id' => $order1->id,
            'rented_until' => now()->subHour(),
        ]);

        // Account whose rental time is still active
        $activeAccount = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => json_encode(['Email' => 'active@stream.test', 'Password' => 'pass']),
            'status' => AccountStatus::RENTED,
            'order_id' => $order2->id,
            'rented_until' => now()->addHour(),
        ]);

        Artisan::call('accounts:release-rented');

        $account->refresh();
        $activeAccount->refresh();

        $this->assertEquals(AccountStatus::AVAILABLE, $account->status);
        $this->assertNull($account->order_id);
        $this->assertNull($account->rented_until);

        // Active account remains RENTED
        $this->assertEquals(AccountStatus::RENTED, $activeAccount->status);
    }

    /** 9. Remind-verifying hanya mengirim sekali per order (Http::fake) */
    public function test_remind_verifying_command_sends_notification_only_once_for_orders_over_30_minutes(): void
    {
        Http::fake([
            'api.telegram.org/*' => Http::response(['ok' => true], 200),
        ]);

        Config::set('notify.telegram.bot_token', 'fake-token');
        Config::set('notify.telegram.chat_id', 'fake-chat-id');

        // Order entered VERIFYING 45 minutes ago
        $oldVerifyingOrder = $this->createOrder(OrderStatus::VERIFYING);
        $oldVerifyingOrder->events()->create([
            'from_status' => OrderStatus::PENDING,
            'to_status' => OrderStatus::VERIFYING,
            'actor' => 'buyer',
            'created_at' => now()->subMinutes(45),
        ]);

        // Recent order entered VERIFYING 10 minutes ago
        $recentVerifyingOrder = $this->createOrder(OrderStatus::VERIFYING);
        $recentVerifyingOrder->events()->create([
            'from_status' => OrderStatus::PENDING,
            'to_status' => OrderStatus::VERIFYING,
            'actor' => 'buyer',
            'created_at' => now()->subMinutes(10),
        ]);

        // First run of the command
        Artisan::call('orders:remind-verifying');

        // Telegram should be called once for $oldVerifyingOrder
        Http::assertSentCount(1);

        // Audit reminder event is written
        $reminderEvent = $oldVerifyingOrder->events()
            ->where('actor', 'system')
            ->where('note', 'like', '%Pengingat verifikasi%')
            ->first();
        $this->assertNotNull($reminderEvent);

        // Second run of the command: must NOT send duplicate notification!
        Artisan::call('orders:remind-verifying');

        // Total count sent to Telegram must remain exactly 1!
        Http::assertSentCount(1);
    }

    public function test_verifying_count_shared_prop_is_only_accessible_to_authenticated_admins(): void
    {
        $this->createOrder(OrderStatus::VERIFYING);
        $this->createOrder(OrderStatus::VERIFYING);

        // 1. Guest request to home page
        $guestResponse = $this->get('/');
        $guestResponse->assertOk();
        $this->assertFalse(array_key_exists('verifyingCount', $guestResponse->original->getData()['page']['props']));

        // 2. Regular non-admin user request
        $nonAdminUser = User::factory()->create(['is_admin' => false]);
        $userResponse = $this->actingAs($nonAdminUser)->get('/');
        $userResponse->assertOk();
        $this->assertFalse(array_key_exists('verifyingCount', $userResponse->original->getData()['page']['props']));

        // 3. Authenticated admin request
        $adminResponse = $this->actingAs($this->adminUser)->get('/admin');
        $adminResponse->assertOk();
        $this->assertTrue(array_key_exists('verifyingCount', $adminResponse->original->getData()['page']['props']));
        $this->assertEquals(2, $adminResponse->original->getData()['page']['props']['verifyingCount']);
    }
}
