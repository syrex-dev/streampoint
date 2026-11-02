<?php

namespace App\Http\Controllers;

use App\Enums\AccountStatus;
use App\Enums\OrderType;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductAccount;
use App\Services\QuotaService;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function show(string $slug, QuotaService $quotaService): Response
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

        return Inertia::render('product/Show', [
            'storeName' => \App\Models\Setting::current()->store_name ?: config('app.name', 'StreamPoint'),
            'product' => [
                'id' => $product->id,
                'slug' => $product->slug,
                'name' => $product->name,
                'category' => $product->category,
                'thumbnail_path' => $product->thumbnail_path,
                'brand_color' => $product->brand_color && preg_match('/^#[0-9A-Fa-f]{6}$/', $product->brand_color) ? $product->brand_color : null,
                'description' => $product->description,
                'rules' => $product->rules,
                'available_rent_stock' => $rentStock,
                'available_buy_stock' => $buyStock,
            ],
            'variants' => $variants,
            'quota' => $quotaService->snapshot(),
            'paymentMethods' => $paymentMethods,
        ]);
    }
}
