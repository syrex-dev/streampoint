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
use Illuminate\Console\Command;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PurgeTestOrdersCommandTest extends TestCase
{
    use RefreshDatabase;

    protected Product $product;
    protected ProductVariant $variant;
    protected PaymentMethod $paymentMethod;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('private');

        $this->product = Product::create([
            'name' => 'Netflix Premium Purge Test',
            'slug' => 'netflix-premium-purge-test',
            'description' => 'Test purge description',
            'has_warranty' => true,
        ]);

        $this->variant = ProductVariant::create([
            'product_id' => $this->product->id,
            'name' => 'Sewa 1 Hari',
            'type' => OrderType::RENT,
            'rent_duration' => RentDuration::ONE_DAY,
            'duration_hours' => 24,
            'price' => 35000,
            'is_active' => true,
        ]);

        $this->paymentMethod = PaymentMethod::create([
            'label' => 'BCA Transfer',
            'type' => PaymentMethodType::BANK,
            'account_number' => '1234567890',
            'account_name' => 'Toko StreamPoint',
            'instructions' => 'Transfer tepat',
            'is_active' => true,
        ]);
    }

    public function test_fails_without_i_understand_flag(): void
    {
        $this->artisan('shop:purge-test-orders')
            ->expectsOutputToContain('Perintah ini berisiko tinggi')
            ->expectsOutputToContain('--i-understand')
            ->assertExitCode(Command::FAILURE);
    }

    public function test_aborts_when_interactive_confirmation_declined(): void
    {
        $order = Order::create([
            'invoice_code' => 'INV-TEST-001',
            'product_id' => $this->product->id,
            'variant_id' => $this->variant->id,
            'order_type' => OrderType::RENT,
            'customer_phone' => '081234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'payment_method_label' => $this->paymentMethod->label,
            'base_price' => 35000,
            'unique_code' => 12,
            'total_amount' => 35012,
            'status' => OrderStatus::PENDING,
            'payment_expires_at' => now()->addMinutes(30),
            'quota_date' => now()->toDateString(),
        ]);

        OrderEvent::create([
            'order_id' => $order->id,
            'from_status' => OrderStatus::PENDING,
            'to_status' => OrderStatus::PENDING,
            'actor' => 'SYSTEM',
            'note' => 'Order created',
            'created_at' => now(),
        ]);

        $this->artisan('shop:purge-test-orders', ['--i-understand' => true])
            ->expectsConfirmation('Apakah Anda yakin ingin menghapus seluruh pesanan uji di atas dan mengembalikan unit akun terkait ke AVAILABLE?', 'no')
            ->expectsOutputToContain('Pembersihan data order uji dibatalkan')
            ->assertExitCode(Command::SUCCESS);

        $this->assertDatabaseHas('orders', ['id' => $order->id]);
        $this->assertDatabaseHas('order_events', ['order_id' => $order->id]);
    }

    public function test_purges_orders_events_resets_accounts_and_removes_proofs_with_force(): void
    {
        // Setup dummy payment proof file in private storage
        $proofFilename = 'payment-proofs/test_proof_123.jpg';
        Storage::disk('private')->put($proofFilename, 'dummy image content');
        $this->assertTrue(Storage::disk('private')->exists($proofFilename));

        // Create accounts with various statuses
        $accReserved = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => 'user1@example.com|pass1',
            'status' => AccountStatus::RESERVED,
        ]);

        $accSold = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::BUY,
            'credential' => 'user2@example.com|pass2',
            'status' => AccountStatus::SOLD,
        ]);

        $accRented = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => 'user3@example.com|pass3',
            'status' => AccountStatus::RENTED,
            'rented_until' => now()->addDays(30),
        ]);

        $accDisabled = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => 'disabled@example.com|pass',
            'status' => AccountStatus::DISABLED,
        ]);

        $order1 = Order::create([
            'invoice_code' => 'INV-TEST-001',
            'product_id' => $this->product->id,
            'variant_id' => $this->variant->id,
            'account_id' => $accReserved->id,
            'order_type' => OrderType::RENT,
            'customer_phone' => '081234567890',
            'payment_method_id' => $this->paymentMethod->id,
            'payment_method_label' => $this->paymentMethod->label,
            'base_price' => 35000,
            'unique_code' => 12,
            'total_amount' => 35012,
            'payment_proof_path' => $proofFilename,
            'status' => OrderStatus::VERIFYING,
            'payment_expires_at' => now()->addMinutes(30),
            'quota_date' => now()->toDateString(),
        ]);
        $accReserved->update(['order_id' => $order1->id]);

        $order2 = Order::create([
            'invoice_code' => 'INV-TEST-002',
            'product_id' => $this->product->id,
            'variant_id' => $this->variant->id,
            'account_id' => $accRented->id,
            'order_type' => OrderType::RENT,
            'customer_phone' => '081234567891',
            'payment_method_id' => $this->paymentMethod->id,
            'payment_method_label' => $this->paymentMethod->label,
            'base_price' => 35000,
            'unique_code' => 15,
            'total_amount' => 35015,
            'status' => OrderStatus::PAID,
            'paid_at' => now(),
            'payment_expires_at' => now()->addMinutes(30),
            'quota_date' => now()->toDateString(),
        ]);
        $accRented->update(['order_id' => $order2->id]);

        OrderEvent::create([
            'order_id' => $order1->id,
            'from_status' => OrderStatus::PENDING,
            'to_status' => OrderStatus::VERIFYING,
            'actor' => 'BUYER',
            'note' => 'Payment proof uploaded',
            'created_at' => now(),
        ]);

        OrderEvent::create([
            'order_id' => $order2->id,
            'from_status' => OrderStatus::VERIFYING,
            'to_status' => OrderStatus::PAID,
            'actor' => 'ADMIN',
            'note' => 'Payment approved',
            'created_at' => now(),
        ]);

        $this->assertEquals(2, Order::count());
        $this->assertEquals(2, OrderEvent::count());

        // Execute command with --i-understand and --force
        $this->artisan('shop:purge-test-orders', [
            '--i-understand' => true,
            '--force' => true,
        ])
            ->expectsOutputToContain('Berhasil membersihkan:')
            ->assertExitCode(Command::SUCCESS);

        // Verify orders and order_events are deleted
        $this->assertEquals(0, Order::count());
        $this->assertEquals(0, OrderEvent::count());

        // Verify accounts are reset to AVAILABLE
        $accReserved->refresh();
        $this->assertEquals(AccountStatus::AVAILABLE, $accReserved->status);
        $this->assertNull($accReserved->order_id);
        $this->assertNull($accReserved->rented_until);

        $accSold->refresh();
        $this->assertEquals(AccountStatus::AVAILABLE, $accSold->status);
        $this->assertNull($accSold->order_id);

        $accRented->refresh();
        $this->assertEquals(AccountStatus::AVAILABLE, $accRented->status);
        $this->assertNull($accRented->order_id);
        $this->assertNull($accRented->rented_until);

        // Disabled account remains untouched
        $accDisabled->refresh();
        $this->assertEquals(AccountStatus::DISABLED, $accDisabled->status);

        // Verify private storage proof file is deleted
        $this->assertFalse(Storage::disk('private')->exists($proofFilename));
    }

    public function test_handles_empty_orders_gracefully(): void
    {
        $this->artisan('shop:purge-test-orders', [
            '--i-understand' => true,
        ])
            ->expectsOutputToContain('Tidak ada data pesanan uji')
            ->assertExitCode(Command::SUCCESS);
    }
}
