<?php

namespace App\Http\Controllers;

use App\Enums\AccountStatus;
use App\Enums\OrderType;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Services\QuotaService;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontController extends Controller
{
    public function index(QuotaService $quotaService): Response
    {
        $quota = $quotaService->snapshot();

        $products = Product::where('is_active', true)
            ->orderBy('sort_order')
            ->with(['variants' => fn ($q) => $q->where('is_active', true)->orderBy('price')])
            ->withCount([
                'accounts as available_rent_stock' => fn ($q) => $q
                    ->where('kind', OrderType::RENT)
                    ->where('status', AccountStatus::AVAILABLE),
                'accounts as available_buy_stock' => fn ($q) => $q
                    ->where('kind', OrderType::BUY)
                    ->where('status', AccountStatus::AVAILABLE),
            ])
            ->get()
            ->map(function (Product $product) use ($quota) {
                $minPrice = $product->variants->min('price') ?? 0;
                $rentStock = (int) $product->available_rent_stock;
                $buyStock = (int) $product->available_buy_stock;
                $totalStock = $rentStock + $buyStock;

                $hasRentVariant = $product->variants->contains(fn ($v) => $v->type === OrderType::RENT);
                $hasBuyVariant = $product->variants->contains(fn ($v) => $v->type === OrderType::BUY);

                if ($totalStock === 0) {
                    $status = 'out_of_stock';
                    $statusLabel = 'Habis';
                } elseif ($quota['is_full']) {
                    if ($buyStock > 0 && $hasBuyVariant) {
                        $status = 'rent_full';
                        $statusLabel = 'Sewa Penuh';
                    } else {
                        $status = 'rent_full';
                        $statusLabel = 'Sewa Penuh';
                    }
                } elseif ($totalStock <= 2) {
                    $status = 'low_stock';
                    $statusLabel = 'Stok Menipis';
                } else {
                    $status = 'available';
                    $statusLabel = 'Tersedia';
                }

                return [
                    'id' => $product->id,
                    'slug' => $product->slug,
                    'name' => $product->name,
                    'category' => $product->category,
                    'thumbnail_path' => $product->thumbnail_path,
                    'description' => $product->description,
                    'min_price' => (int) $minPrice,
                    'status' => $status,
                    'status_label' => $statusLabel,
                    'available_rent_stock' => $rentStock,
                    'available_buy_stock' => $buyStock,
                    'has_rent' => $hasRentVariant,
                    'has_buy' => $hasBuyVariant,
                ];
            });

        $categories = $products->pluck('category')->filter()->unique()->values()->all();

        $paymentMethods = PaymentMethod::where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($pm) => [
                'id' => $pm->id,
                'type' => $pm->type->value,
                'label' => $pm->label,
            ]);

        return Inertia::render('storefront/Index', [
            'storeName' => config('app.name', 'StreamPoint'),
            'quota' => $quota,
            'products' => $products,
            'categories' => $categories,
            'paymentMethods' => $paymentMethods,
        ]);
    }
}
