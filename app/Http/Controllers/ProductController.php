<?php

namespace App\Http\Controllers;

use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductAccount;
use App\Services\QuotaService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function show(string $slug, QuotaService $quotaService, Request $request): Response
    {
        $product = Product::where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        $rentStock = ProductAccount::where('product_id', $product->id)
            ->where('kind', OrderType::RENT)
            ->where('status', AccountStatus::AVAILABLE)
            ->count();

        $buyStock = ProductAccount::where('product_id', $product->id)
            ->where('kind', OrderType::BUY)
            ->where('status', AccountStatus::AVAILABLE)
            ->count();

        $variants = $product->variants()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($v) => [
                'id' => $v->id,
                'product_id' => $v->product_id,
                'name' => $v->name,
                'type' => $v->type->value,
                'rent_duration' => $v->rent_duration?->value,
                'duration_hours' => (int) $v->duration_hours,
                'price' => (int) $v->price,
                'is_active' => (bool) $v->is_active,
                'sort_order' => (int) $v->sort_order,
            ]);

        $paymentMethods = PaymentMethod::where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($pm) => [
                'id' => $pm->id,
                'type' => $pm->type->value,
                'label' => $pm->label,
                'account_number' => $pm->account_number,
                'account_holder' => $pm->account_holder,
                'qris_image_path' => $pm->qris_image_path,
                'instructions' => $pm->instructions,
            ]);

        $setting = \App\Models\Setting::current();

        // Reviews & Ratings (Verified Buyers Only)
        $reviewsQuery = $product->reviews()->where('is_visible', true);
        $totalReviews = (int) $reviewsQuery->count();
        $avgRating = $totalReviews > 0 ? round((float) $reviewsQuery->avg('rating'), 1) : 0.0;

        $starCounts = (clone $reviewsQuery)
            ->selectRaw('rating, count(*) as count')
            ->groupBy('rating')
            ->pluck('count', 'rating')
            ->toArray();

        $breakdown = [];
        for ($star = 5; $star >= 1; $star--) {
            $cnt = (int) ($starCounts[$star] ?? 0);
            $pct = $totalReviews > 0 ? (int) round(($cnt / $totalReviews) * 100) : 0;
            $breakdown[] = [
                'stars' => $star,
                'count' => $cnt,
                'percentage' => $pct,
            ];
        }

        $reviews = (clone $reviewsQuery)
            ->with('variant')
            ->latest()
            ->take(20)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'rating' => (int) $r->rating,
                'comment' => $r->comment,
                'customer_name' => $r->customer_name,
                'variant_name' => $r->variant?->name,
                'created_at' => $r->created_at->format('d M Y'),
                'is_verified_buyer' => true,
            ]);

        // Check if buyer has an eligible paid order for this product that has not been reviewed yet
        $ownedInvoices = $request->session()->get('owned_invoices', []);
        $eligibleOrder = null;
        if (! empty($ownedInvoices)) {
            $eligibleOrder = Order::whereIn('invoice_code', $ownedInvoices)
                ->where('product_id', $product->id)
                ->where('status', OrderStatus::PAID)
                ->doesntHave('review')
                ->with('variant')
                ->first();
        }

        $userPendingOrderForReview = $eligibleOrder ? [
            'invoice_code' => $eligibleOrder->invoice_code,
            'variant_name' => $eligibleOrder->variant?->name ?? 'Paket',
        ] : null;

        return Inertia::render('product/Show', [
            'storeName' => $setting->store_name ?: config('app.name', 'StreamPoint'),
            'deliveryEta' => $setting->delivery_eta,
            'product' => [
                'id' => $product->id,
                'slug' => $product->slug,
                'name' => $product->name,
                'category' => $product->category,
                'thumbnail_path' => $product->thumbnail_path,
                'cover_path' => $product->cover_path,
                'brand_color' => $product->brand_color && preg_match('/^#[0-9A-Fa-f]{6}$/', $product->brand_color) ? $product->brand_color : null,
                'has_warranty' => (bool) $product->has_warranty,
                'description' => $product->description,
                'rules' => $product->rules,
                'available_rent_stock' => $rentStock,
                'available_buy_stock' => $buyStock,
            ],
            'variants' => $variants,
            'quota' => $quotaService->snapshot(),
            'paymentMethods' => $paymentMethods,
            'reviewsData' => [
                'average_rating' => $avgRating,
                'total_reviews' => $totalReviews,
                'breakdown' => $breakdown,
                'reviews' => $reviews,
                'user_pending_order_for_review' => $userPendingOrderForReview,
            ],
        ]);
    }
}
