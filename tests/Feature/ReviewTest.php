<?php

namespace Tests\Feature;

use App\Actions\Order\ApproveOrder;
use App\Actions\Order\CreateOrder;
use App\Actions\Order\CreateOrderData;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductAccount;
use App\Models\ProductVariant;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewTest extends TestCase
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
            'credential' => 'user@netflix.com | pass123 | Profil 1 | 1234',
            'status' => 'AVAILABLE',
        ]);
    }

    private function createPaidOrder(string $phone = '081234567890'): Order
    {
        $order = app(CreateOrder::class)->handle(new CreateOrderData(
            variantId: $this->variant->id,
            phone: $phone,
            paymentMethodId: $this->paymentMethod->id,
        ));

        // Confirm and approve
        $order->update(['status' => OrderStatus::VERIFYING]);
        app(ApproveOrder::class)->handle($order, null, 'admin:1');

        return $order->fresh();
    }

    public function test_verified_buyer_can_submit_review(): void
    {
        $order = $this->createPaidOrder();

        $response = $this->withSession(['owned_invoices' => [$order->invoice_code]])
            ->post("/invoice/{$order->invoice_code}/review", [
                'rating' => 5,
                'comment' => 'Layanan sangat cepat dan akun bekerja dengan baik!',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('reviews', [
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'rating' => 5,
            'comment' => 'Layanan sangat cepat dan akun bekerja dengan baik!',
        ]);
    }

    public function test_unpaid_order_cannot_submit_review(): void
    {
        $order = app(CreateOrder::class)->handle(new CreateOrderData(
            variantId: $this->variant->id,
            phone: '081234567890',
            paymentMethodId: $this->paymentMethod->id,
        ));

        $this->assertEquals(OrderStatus::PENDING, $order->status);

        $response = $this->withSession(['owned_invoices' => [$order->invoice_code]])
            ->post("/invoice/{$order->invoice_code}/review", [
                'rating' => 5,
                'comment' => 'Mau review tapi belum bayar',
            ]);

        $response->assertSessionHasErrors(['review']);
        $this->assertDatabaseMissing('reviews', ['order_id' => $order->id]);
    }

    public function test_duplicate_review_is_rejected_anti_spam(): void
    {
        $order = $this->createPaidOrder();

        // First review succeeds
        $this->withSession(['owned_invoices' => [$order->invoice_code]])
            ->post("/invoice/{$order->invoice_code}/review", [
                'rating' => 5,
                'comment' => 'Ulasan pertama yang sah',
            ])->assertRedirect();

        $this->assertDatabaseCount('reviews', 1);

        // Second review on same order MUST be rejected
        $response = $this->withSession(['owned_invoices' => [$order->invoice_code]])
            ->post("/invoice/{$order->invoice_code}/review", [
                'rating' => 1,
                'comment' => 'Spam ulasan kedua kali',
            ]);

        $response->assertSessionHasErrors(['review']);
        $this->assertDatabaseCount('reviews', 1);
    }

    public function test_unauthorized_user_without_phone_verification_is_rejected(): void
    {
        $order = $this->createPaidOrder('081234567890');

        // Request with empty session and no phone
        $response = $this->post("/invoice/{$order->invoice_code}/review", [
            'rating' => 5,
            'comment' => 'Mencoba review pesanan orang lain',
        ]);

        $response->assertSessionHasErrors(['phone']);
        $this->assertDatabaseMissing('reviews', ['order_id' => $order->id]);

        // Request with wrong phone
        $responseWrong = $this->post("/invoice/{$order->invoice_code}/review", [
            'rating' => 5,
            'comment' => 'Mencoba dengan nomor ngawur',
            'phone' => '089999999999',
        ]);

        $responseWrong->assertSessionHasErrors(['phone']);
        $this->assertDatabaseMissing('reviews', ['order_id' => $order->id]);

        // Request with matching phone succeeds
        $responseRight = $this->post("/invoice/{$order->invoice_code}/review", [
            'rating' => 5,
            'comment' => 'Berhasil setelah verifikasi nomor yang sesuai',
            'phone' => '081234567890',
        ]);

        $responseRight->assertRedirect();
        $this->assertDatabaseHas('reviews', [
            'order_id' => $order->id,
            'comment' => 'Berhasil setelah verifikasi nomor yang sesuai',
        ]);
    }

    public function test_rating_must_be_between_one_and_five(): void
    {
        $order = $this->createPaidOrder();

        $response = $this->withSession(['owned_invoices' => [$order->invoice_code]])
            ->post("/invoice/{$order->invoice_code}/review", [
                'rating' => 6,
                'comment' => 'Bintang 6 tidak valid',
            ]);

        $response->assertSessionHasErrors(['rating']);
    }

    public function test_product_page_shows_reviews_data(): void
    {
        $order = $this->createPaidOrder();

        Review::create([
            'product_id' => $this->product->id,
            'order_id' => $order->id,
            'variant_id' => $this->variant->id,
            'customer_phone' => $order->customer_phone,
            'customer_name' => 'Pembeli Terverifikasi',
            'rating' => 5,
            'comment' => 'Mantap sekali akunnya!',
            'is_visible' => true,
        ]);

        $response = $this->get("/p/{$this->product->slug}");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('product/Show')
            ->has('reviewsData')
            ->where('reviewsData.total_reviews', 1)
            ->where('reviewsData.average_rating', 5)
        );
    }

    public function test_admin_can_toggle_review_visibility_and_delete(): void
    {
        $order = $this->createPaidOrder();

        $review = Review::create([
            'product_id' => $this->product->id,
            'order_id' => $order->id,
            'variant_id' => $this->variant->id,
            'customer_phone' => $order->customer_phone,
            'customer_name' => 'Pembeli Terverifikasi',
            'rating' => 1,
            'comment' => 'Komentar spam tidak pantas',
            'is_visible' => true,
        ]);

        // Toggle visibility to hidden
        $this->actingAs($this->admin)
            ->patch("/admin/reviews/{$review->id}/visibility")
            ->assertRedirect();

        $this->assertFalse($review->fresh()->is_visible);

        // Delete review
        $this->actingAs($this->admin)
            ->delete("/admin/reviews/{$review->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
    }
}
