<?php

namespace Tests\Feature;

use App\Actions\Order\CreateOrder;
use App\Actions\Order\CreateOrderData;
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
use App\Models\User;
use App\Services\Notification\AdminNotifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class AdminManagementAndWarrantyTest extends TestCase
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
            'max_daily_rent_quota' => 10,
            'admin_whatsapp' => '6281234567890',
        ]);

        $this->adminUser = User::factory()->create([
            'name' => 'Admin StreamPoint',
            'email' => 'admin@streampoint.test',
            'is_admin' => true,
        ]);

        $this->regularUser = User::factory()->create([
            'name' => 'Regular Buyer',
            'email' => 'buyer@streampoint.test',
            'is_admin' => false,
        ]);

        $this->product = Product::create([
            'slug' => 'disney-plus-hotstar',
            'name' => 'Disney+ Hotstar',
            'category' => 'Streaming',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->rentVariant = ProductVariant::create([
            'product_id' => $this->product->id,
            'name' => 'Sewa 1 Hari (24 Jam)',
            'type' => OrderType::RENT,
            'rent_duration' => RentDuration::ONE_DAY,
            'duration_hours' => 24,
            'price' => 12000,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->buyVariant = ProductVariant::create([
            'product_id' => $this->product->id,
            'name' => 'Beli 1 Bulan (30 Hari)',
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
            'sort_order' => 1,
        ]);
    }

    /**
     * 1. non-admin tidak bisa mengakses rute produk/stok/metode pembayaran
     */
    public function test_non_admin_cannot_access_product_stock_and_payment_method_routes(): void
    {
        $adminRoutes = [
            ['GET', '/admin/products'],
            ['GET', '/admin/products/create'],
            ['POST', '/admin/products'],
            ['GET', "/admin/products/{$this->product->id}/edit"],
            ['GET', '/admin/accounts'],
            ['POST', '/admin/accounts'],
            ['POST', '/admin/accounts/bulk'],
            ['GET', '/admin/payment-methods'],
            ['POST', '/admin/payment-methods'],
        ];

        // 1. Guest -> redirect to login (302) or 401
        foreach ($adminRoutes as [$method, $uri]) {
            $guestRes = $this->call($method, $uri);
            $this->assertTrue(
                in_array($guestRes->status(), [302, 401], true),
                "Guest accessing {$method} {$uri} expected 302/401, got {$guestRes->status()}"
            );
        }

        // 2. Regular user -> Forbidden (403)
        foreach ($adminRoutes as [$method, $uri]) {
            $userRes = $this->actingAs($this->regularUser)->call($method, $uri);
            $this->assertEquals(
                403,
                $userRes->status(),
                "Regular user accessing {$method} {$uri} expected 403, got {$userRes->status()}"
            );
        }
    }

    /**
     * 2. validasi varian (RENT harus punya rent_duration dan duration_hours cocok; BUY kelipatan 720)
     */
    public function test_variant_validation_rules_for_rent_and_buy(): void
    {
        // RENT without rent_duration should fail
        $response = $this->actingAs($this->adminUser)->postJson("/admin/products/{$this->product->id}/variants", [
            'name' => 'Sewa Tanpa Durasi',
            'type' => 'RENT',
            'rent_duration' => null,
            'duration_hours' => 24,
            'price' => 10000,
            'is_active' => true,
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['rent_duration']);

        // RENT with mismatched duration_hours (e.g. HALF_DAY but hours = 24 instead of 12) should fail
        $response = $this->actingAs($this->adminUser)->postJson("/admin/products/{$this->product->id}/variants", [
            'name' => 'Sewa Mismatched Jam',
            'type' => 'RENT',
            'rent_duration' => 'HALF_DAY',
            'duration_hours' => 24, // Expected 12
            'price' => 10000,
            'is_active' => true,
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['duration_hours']);

        // RENT with matching duration_hours should succeed
        $response = $this->actingAs($this->adminUser)->postJson("/admin/products/{$this->product->id}/variants", [
            'name' => 'Sewa Setengah Hari Valid',
            'type' => 'RENT',
            'rent_duration' => 'HALF_DAY',
            'duration_hours' => 12,
            'price' => 7000,
            'is_active' => true,
        ]);
        $response->assertStatus(302)->assertSessionHas('success');

        // BUY with rent_duration should fail
        $response = $this->actingAs($this->adminUser)->postJson("/admin/products/{$this->product->id}/variants", [
            'name' => 'Beli Dengan Rent Duration',
            'type' => 'BUY',
            'rent_duration' => 'ONE_DAY',
            'duration_hours' => 720,
            'price' => 50000,
            'is_active' => true,
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['rent_duration']);

        // BUY with non-multiple of 720 (e.g. 500 hours) should fail
        $response = $this->actingAs($this->adminUser)->postJson("/admin/products/{$this->product->id}/variants", [
            'name' => 'Beli Jam Salah',
            'type' => 'BUY',
            'rent_duration' => null,
            'duration_hours' => 500,
            'price' => 50000,
            'is_active' => true,
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors(['duration_hours']);

        // BUY with valid multiple of 720 (1440 hours = 2 months) should succeed
        $response = $this->actingAs($this->adminUser)->postJson("/admin/products/{$this->product->id}/variants", [
            'name' => 'Beli 2 Bulan Valid',
            'type' => 'BUY',
            'rent_duration' => null,
            'duration_hours' => 1440,
            'price' => 90000,
            'is_active' => true,
        ]);
        $response->assertStatus(302)->assertSessionHas('success');
    }

    /**
     * 3. produk/varian/metode yang sudah punya order tidak bisa dihapus
     */
    public function test_product_variant_and_payment_method_with_orders_cannot_be_deleted(): void
    {
        $account = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => 'test@stream.test|secret123',
            'status' => AccountStatus::SOLD,
        ]);

        $order = Order::create([
            'invoice_code' => 'INV-20261101-TESTDEL',
            'product_id' => $this->product->id,
            'variant_id' => $this->rentVariant->id,
            'account_id' => $account->id,
            'order_type' => OrderType::RENT,
            'customer_phone' => '6281234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'payment_method_label' => $this->paymentMethod->label,
            'base_price' => 12000,
            'unique_code' => 123,
            'total_amount' => 12123,
            'status' => OrderStatus::PAID,
            'paid_at' => now(),
            'payment_expires_at' => now()->addMinutes(15),
            'quota_date' => now()->toDateString(),
        ]);

        // Attempt deleting Product -> should fail with error
        $response = $this->actingAs($this->adminUser)->delete("/admin/products/{$this->product->id}");
        $response->assertSessionHasErrors('action');
        $this->assertDatabaseHas('products', ['id' => $this->product->id]);

        // Attempt deleting Variant -> should fail with error
        $response = $this->actingAs($this->adminUser)->delete("/admin/products/{$this->product->id}/variants/{$this->rentVariant->id}");
        $response->assertSessionHasErrors('action');
        $this->assertDatabaseHas('product_variants', ['id' => $this->rentVariant->id]);

        // Attempt deleting Payment Method -> should fail with error
        $response = $this->actingAs($this->adminUser)->delete("/admin/payment-methods/{$this->paymentMethod->id}");
        $response->assertSessionHasErrors('action');
        $this->assertDatabaseHas('payment_methods', ['id' => $this->paymentMethod->id]);

        // Clean up order and test that deletion is permitted when no orders exist
        $order->delete();
        $account->delete();

        // Now variant without order can be deleted
        $response = $this->actingAs($this->adminUser)->delete("/admin/products/{$this->product->id}/variants/{$this->rentVariant->id}");
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('product_variants', ['id' => $this->rentVariant->id]);

        // Variant buy can be deleted
        $this->actingAs($this->adminUser)->delete("/admin/products/{$this->product->id}/variants/{$this->buyVariant->id}");

        // Now product can be deleted
        $response = $this->actingAs($this->adminUser)->delete("/admin/products/{$this->product->id}");
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('products', ['id' => $this->product->id]);

        // Now payment method can be deleted
        $response = $this->actingAs($this->adminUser)->delete("/admin/payment-methods/{$this->paymentMethod->id}");
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('payment_methods', ['id' => $this->paymentMethod->id]);
    }

    /**
     * 4. impor massal melaporkan baris tidak valid dan menyimpan yang valid, kredensial tersimpan terenkripsi
     */
    public function test_bulk_import_reports_invalid_lines_and_saves_valid_ones_encrypted(): void
    {
        $rawCredential1 = 'netflix_user1@streampoint.test|SecurePass123|Profile 1|1234';
        $rawCredential2 = 'netflix_user2@streampoint.test|SecurePass456';

        $itemsText = "{$rawCredential1}\n"
            . "invalid_line_without_pipes\n"
            . "notanemail|password\n"
            . "{$rawCredential2}";

        $response = $this->actingAs($this->adminUser)->post('/admin/accounts/bulk', [
            'product_id' => $this->product->id,
            'kind' => 'RENT',
            'items_text' => $itemsText,
        ]);

        $response->assertSessionHas('success');
        $successMsg = session('success');

        // Must report invalid line numbers: 2 and 3
        $this->assertStringContainsString('2', $successMsg);
        $this->assertStringContainsString('3', $successMsg);

        // Valid accounts should be saved
        $acc1 = ProductAccount::where('product_id', $this->product->id)
            ->where('kind', OrderType::RENT)
            ->first();

        $this->assertNotNull($acc1);

        // Kredensial terenkripsi di database: raw di DB bukan teks asli
        $rawDbValue = $acc1->getRawOriginal('credential');
        $this->assertNotEquals($rawCredential1, $rawDbValue);
        $this->assertStringNotContainsString('SecurePass123', $rawDbValue);

        // Decrypted accessor works correctly
        $this->assertEquals($rawCredential1, $acc1->credential);
        $this->assertEquals(AccountStatus::AVAILABLE, $acc1->status);
    }

    /**
     * 5. status unit RESERVED/SOLD/RENTED tidak bisa diubah manual
     */
    public function test_unit_status_cannot_be_manually_changed_if_reserved_sold_or_rented(): void
    {
        $reservedUnit = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => 'res@test.com|pass',
            'status' => AccountStatus::RESERVED,
        ]);

        $soldUnit = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::BUY,
            'credential' => 'sold@test.com|pass',
            'status' => AccountStatus::SOLD,
        ]);

        $rentedUnit = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => 'rented@test.com|pass',
            'status' => AccountStatus::RENTED,
        ]);

        $availableUnit = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => 'avail@test.com|pass',
            'status' => AccountStatus::AVAILABLE,
        ]);

        // Attempt changing RESERVED unit
        $res = $this->actingAs($this->adminUser)->patch("/admin/accounts/{$reservedUnit->id}/status", [
            'status' => 'DISABLED',
        ]);
        $res->assertSessionHasErrors('action');
        $this->assertEquals(AccountStatus::RESERVED, $reservedUnit->fresh()->status);

        // Attempt changing SOLD unit
        $res = $this->actingAs($this->adminUser)->patch("/admin/accounts/{$soldUnit->id}/status", [
            'status' => 'DISABLED',
        ]);
        $res->assertSessionHasErrors('action');
        $this->assertEquals(AccountStatus::SOLD, $soldUnit->fresh()->status);

        // Attempt changing RENTED unit
        $res = $this->actingAs($this->adminUser)->patch("/admin/accounts/{$rentedUnit->id}/status", [
            'status' => 'DISABLED',
        ]);
        $res->assertSessionHasErrors('action');
        $this->assertEquals(AccountStatus::RENTED, $rentedUnit->fresh()->status);

        // Available unit can be toggled to DISABLED
        $res = $this->actingAs($this->adminUser)->patch("/admin/accounts/{$availableUnit->id}/status", [
            'status' => 'DISABLED',
        ]);
        $res->assertSessionHas('success');
        $this->assertEquals(AccountStatus::DISABLED, $availableUnit->fresh()->status);

        // And toggled back to AVAILABLE
        $res = $this->actingAs($this->adminUser)->patch("/admin/accounts/{$availableUnit->id}/status", [
            'status' => 'AVAILABLE',
        ]);
        $res->assertSessionHas('success');
        $this->assertEquals(AccountStatus::AVAILABLE, $availableUnit->fresh()->status);
    }

    /**
     * 6. ReplaceAccount mempertahankan access_expires_at dan menandai unit lama DISABLED
     */
    public function test_replace_account_preserves_access_expires_at_and_marks_old_unit_disabled(): void
    {
        $oldUnit = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => 'old_unit@stream.test|oldPass123',
            'status' => AccountStatus::RENTED,
            'rented_until' => now()->addHours(24),
        ]);

        $replacementUnit = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => 'new_unit@stream.test|newPass456',
            'status' => AccountStatus::AVAILABLE,
        ]);

        $originalExpiresAt = now()->addHours(18)->startOfSecond();
        $originalStartsAt = now()->subHours(6)->startOfSecond();

        $order = Order::create([
            'invoice_code' => 'INV-20261101-GARANSI',
            'product_id' => $this->product->id,
            'variant_id' => $this->rentVariant->id,
            'account_id' => $oldUnit->id,
            'order_type' => OrderType::RENT,
            'customer_phone' => '6281234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'payment_method_label' => $this->paymentMethod->label,
            'base_price' => 12000,
            'unique_code' => 555,
            'total_amount' => 12555,
            'status' => OrderStatus::PAID,
            'paid_at' => now()->subHours(6),
            'payment_expires_at' => now()->addMinutes(15),
            'quota_date' => now()->toDateString(),
            'access_starts_at' => $originalStartsAt,
            'access_expires_at' => $originalExpiresAt,
        ]);

        $oldUnit->update(['order_id' => $order->id]);

        $response = $this->actingAs($this->adminUser)->post("/admin/orders/{$order->id}/replace-account", [
            'reason' => 'Akun lama terkena limit screen Netflix.',
            'new_account_id' => $replacementUnit->id,
        ]);

        $response->assertSessionHas('success');

        $order->refresh();
        $oldUnit->refresh();
        $replacementUnit->refresh();

        // Old unit is DISABLED, order_id released
        $this->assertEquals(AccountStatus::DISABLED, $oldUnit->status);
        $this->assertNull($oldUnit->order_id);
        $this->assertStringContainsString('limit screen', (string) $oldUnit->note);

        // New unit is attached and marked RENTED with rented_until matching access_expires_at
        $this->assertEquals($replacementUnit->id, $order->account_id);
        $this->assertEquals(AccountStatus::RENTED, $replacementUnit->status);
        $this->assertEquals($order->id, $replacementUnit->order_id);
        $this->assertEquals($originalExpiresAt->toDateTimeString(), $replacementUnit->rented_until->toDateTimeString());

        // Order access expiry is preserved
        $this->assertEquals($originalExpiresAt->toDateTimeString(), $order->access_expires_at->toDateTimeString());
        $this->assertEquals($originalStartsAt->toDateTimeString(), $order->access_starts_at->toDateTimeString());

        // Event logged
        $this->assertDatabaseHas('order_events', [
            'order_id' => $order->id,
            'to_status' => OrderStatus::PAID->value,
            'actor' => 'admin:' . $this->adminUser->id,
        ]);
    }

    /**
     * 7. stock.low tidak terkirim berulang dalam 6 jam
     */
    public function test_stock_low_notification_is_deduplicated_within_six_hours(): void
    {
        Queue::fake();
        Cache::flush();

        // Create 3 available units
        for ($i = 1; $i <= 3; $i++) {
            ProductAccount::create([
                'product_id' => $this->product->id,
                'kind' => OrderType::RENT,
                'credential' => "unit{$i}@test.com|pass",
                'status' => AccountStatus::AVAILABLE,
            ]);
        }

        $createOrderAction = app(CreateOrder::class);

        // Order 1: Reserving 1 unit leaves 2 units available (threshold <= 2)
        $order1 = $createOrderAction->handle(new CreateOrderData(
            variantId: $this->rentVariant->id,
            phone: '081234567890',
            paymentMethodId: $this->paymentMethod->id
        ));

        // stock.low should be dispatched
        Queue::assertPushed(SendAdminNotification::class, function ($job) {
            return $job->event === 'stock.low';
        });

        // Reset queue to test deduplication
        Queue::fake();

        // Order 2: Reserving another unit leaves 1 unit available
        $order2 = $createOrderAction->handle(new CreateOrderData(
            variantId: $this->rentVariant->id,
            phone: '081234567891',
            paymentMethodId: $this->paymentMethod->id
        ));

        // Within 6 hours, stock.low should NOT be dispatched again
        Queue::assertNotPushed(SendAdminNotification::class, function ($job) {
            return $job->event === 'stock.low';
        });
    }

    /**
     * 8. AdminNotifier tidak melempar error ketika token kosong (cukup tulis Log::info)
     */
    public function test_admin_notifier_does_not_throw_or_fail_job_when_telegram_token_is_empty(): void
    {
        config([
            'notify.telegram.bot_token' => '',
            'notify.telegram.chat_id' => '',
        ]);

        Log::spy();

        // Dispatch stock.low synchronously
        $job = new SendAdminNotification('stock.low', [
            'product_id' => $this->product->id,
            'kind' => 'RENT',
            'remaining' => 1,
        ]);

        // Must run without throwing any exceptions
        app()->call([$job, 'handle']);

        // Must write Log::info without secret values
        Log::shouldHaveReceived('info')
            ->withArgs(function ($message) {
                return str_contains($message, 'Telegram notification skipped')
                    && str_contains($message, 'Peringatan: Stok Menipis');
            });
    }

    /**
     * 9. produk nonaktif tidak muncul di storefront (dan varian nonaktif tidak bisa dipesan)
     */
    public function test_inactive_product_and_variant_behavior_on_storefront_and_checkout(): void
    {
        // Deactivate product
        $this->product->update(['is_active' => false]);

        // Storefront home should not include this product
        $homeRes = $this->get('/');
        $homeRes->assertStatus(200);
        $productsInProp = $homeRes->original->getData()['page']['props']['products'];
        $this->assertFalse(collect($productsInProp)->contains('id', $this->product->id));

        // Product show route for inactive product should return 404
        $showRes = $this->get("/p/{$this->product->slug}");
        $showRes->assertStatus(404);

        // Reactivate product, but deactivate variant
        $this->product->update(['is_active' => true]);
        $this->rentVariant->update(['is_active' => false]);

        // Variant should not be listed on product page
        $showRes2 = $this->get("/p/{$this->product->slug}");
        $showRes2->assertStatus(200);
        $variantsInProp = $showRes2->original->getData()['page']['props']['variants'];
        $this->assertFalse(collect($variantsInProp)->contains('id', $this->rentVariant->id));

        // Checkout attempt with inactive variant should fail validation
        $checkoutRes = $this->postJson('/checkout', [
            'variant_id' => $this->rentVariant->id,
            'customer_phone' => '081234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'idempotency_key' => 'idem-inactive-test',
        ]);
        $checkoutRes->assertStatus(422)->assertJsonValidationErrors(['variant_id']);
    }
}
