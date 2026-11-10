<?php

namespace Tests\Feature;

use App\Actions\Order\ApproveOrder;
use App\Actions\Order\CreateOrder;
use App\Actions\Order\CreateOrderData;
use App\Actions\Order\RevokeAccess;
use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductAccount;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RevokeAccessTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Product $product;
    private ProductVariant $variant;
    private PaymentMethod $paymentMethod;
    private ProductAccount $account;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['is_admin' => true]);

        $this->product = Product::create([
            'name' => 'Netflix Premium',
            'slug' => 'netflix-premium',
            'category' => 'Streaming',
            'is_active' => true,
        ]);

        $this->variant = ProductVariant::create([
            'product_id' => $this->product->id,
            'name' => '1 Hari',
            'type' => OrderType::RENT,
            'duration_hours' => 24,
            'price' => 10000,
            'is_active' => true,
        ]);

        $this->paymentMethod = PaymentMethod::create([
            'type' => 'QRIS',
            'label' => 'QRIS Demo',
            'is_active' => true,
        ]);

        $this->account = ProductAccount::create([
            'product_id' => $this->product->id,
            'kind' => OrderType::RENT,
            'credential' => 'test@netflix.com|password123|Profil 1|1234',
            'status' => AccountStatus::AVAILABLE,
        ]);
    }

    public function test_admin_can_revoke_access_for_paid_order(): void
    {
        $createOrder = app(CreateOrder::class);
        $order = $createOrder->handle(new CreateOrderData(
            variantId: $this->variant->id,
            phone: '081234567890',
            paymentMethodId: $this->paymentMethod->id,
        ));

        $order->update(['status' => OrderStatus::VERIFYING]);

        // Approve order so it is PAID
        $order->update(['status' => OrderStatus::VERIFYING]);

        app(ApproveOrder::class)->handle($order, $this->account->id, 'admin:1');
        $order->refresh();
        $this->assertEquals(OrderStatus::PAID, $order->status);
        $this->assertEquals($this->account->id, $order->account_id);
        $this->assertEquals(AccountStatus::RENTED, $this->account->fresh()->status);

        // Admin revokes access
        $revokeAction = app(RevokeAccess::class);
        $revoked = $revokeAction->handle(
            order: $order,
            reason: 'Ganti password akun tanpa izin',
            releaseStock: true,
            actor: 'admin:' . $this->admin->id,
        );

        $this->assertEquals(OrderStatus::CANCELLED, $revoked->status);
        $this->assertNull($revoked->account_id);
        $this->assertStringContainsString('Ganti password akun tanpa izin', $revoked->status_note);

        // Account is released back to AVAILABLE
        $this->assertEquals(AccountStatus::AVAILABLE, $this->account->fresh()->status);
        $this->assertNull($this->account->fresh()->order_id);

        // Buyer invoice view must NOT return credentials
        $response = $this->get("/invoice/{$order->invoice_code}");
        $response->assertOk();
        $response->assertSee('Dibatalkan');
        $this->assertNull($response->original->getData()['page']['props']['order']['credentials']);
    }

    public function test_admin_can_revoke_access_and_disable_quarantine_account(): void
    {
        $createOrder = app(CreateOrder::class);
        $order = $createOrder->handle(new CreateOrderData(
            variantId: $this->variant->id,
            phone: '081234567890',
            paymentMethodId: $this->paymentMethod->id,
        ));

        $order->update(['status' => OrderStatus::VERIFYING]);

        app(ApproveOrder::class)->handle($order, $this->account->id, 'admin:1');

        $revokeAction = app(RevokeAccess::class);
        $revokeAction->handle(
            order: $order,
            reason: 'Login lebih dari 1 device',
            releaseStock: false,
            actor: 'admin:1',
        );

        $this->assertEquals(AccountStatus::DISABLED, $this->account->fresh()->status);
    }
}
