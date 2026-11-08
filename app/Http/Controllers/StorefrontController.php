<?php

namespace App\Http\Controllers;

use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Models\Banner;
use App\Models\Order;
use App\Models\OrderEvent;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Setting;
use App\Services\QuotaService;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontController extends Controller
{
    public function index(QuotaService $quotaService): Response
    {
        $setting = Setting::current();
        $minSoldDisplay = (int) ($setting->min_sold_display ?? 5);

        $quota = $quotaService->snapshot();

        $productsQuery = Product::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->with(['variants' => fn ($q) => $q->where('is_active', true)->orderBy('price')])
            ->withCount([
                'accounts as available_rent_stock' => fn ($q) => $q
                    ->where('kind', OrderType::RENT)
                    ->where('status', AccountStatus::AVAILABLE),
                'accounts as available_buy_stock' => fn ($q) => $q
                    ->where('kind', OrderType::BUY)
                    ->where('status', AccountStatus::AVAILABLE),
                'orders as sold_count' => fn ($q) => $q
                    ->where('status', OrderStatus::PAID),
            ])
            ->get();

        // 3 layanan teratas yang memenuhi ambang min_sold_display menjadi 'Terlaris'
        $bestsellerIds = $productsQuery
            ->filter(fn (Product $p) => ((int) $p->sold_count) >= $minSoldDisplay)
            ->sortByDesc('sold_count')
            ->take(3)
            ->pluck('id')
            ->all();

        $mappedProducts = $productsQuery->map(function (Product $product) use ($quota, $minSoldDisplay, $bestsellerIds) {
            $minPrice = $product->variants->min('price') ?? 0;
            $rentStock = (int) $product->available_rent_stock;
            $buyStock = (int) $product->available_buy_stock;
            $totalStock = $rentStock + $buyStock;

            $hasRentVariant = $product->variants->contains(fn ($v) => $v->type === OrderType::RENT);
            $hasBuyVariant = $product->variants->contains(fn ($v) => $v->type === OrderType::BUY);

            $isOutOfStock = (! $hasRentVariant || $rentStock === 0) && (! $hasBuyVariant || $buyStock === 0);

            if ($isOutOfStock) {
                $status = 'out_of_stock';
                $statusLabel = 'Habis';
            } elseif ($hasRentVariant && $quota['is_full']) {
                $status = 'rent_full';
                $statusLabel = 'Sewa Penuh';
            } elseif ($totalStock <= 2) {
                $status = 'low_stock';
                $statusLabel = 'Stok Menipis';
            } else {
                $status = 'available';
                $statusLabel = 'Tersedia';
            }

            $rawSoldCount = (int) $product->sold_count;
            $displaySoldCount = $rawSoldCount >= $minSoldDisplay ? $rawSoldCount : null;

            $isNew = $product->created_at ? $product->created_at->gte(now()->subDays(14)) : false;
            $isBestseller = in_array($product->id, $bestsellerIds, true);

            return [
                'id' => $product->id,
                'slug' => $product->slug,
                'name' => $product->name,
                'category' => $product->category,
                'thumbnail_path' => $product->thumbnail_path,
                'logo_url' => $product->thumbnail_path,
                'cover_url' => $product->cover_path,
                'brand_color' => $product->brand_color && preg_match('/^#[0-9A-Fa-f]{6}$/', $product->brand_color) ? $product->brand_color : null,
                'has_warranty' => (bool) $product->has_warranty,
                'description' => $product->description,
                'min_price' => (int) $minPrice,
                'status' => $status,
                'status_label' => $statusLabel,
                'available_rent_stock' => $rentStock,
                'available_buy_stock' => $buyStock,
                'has_rent' => $hasRentVariant,
                'has_buy' => $hasBuyVariant,
                'sold_count' => $displaySoldCount,
                'is_new' => $isNew,
                'is_bestseller' => $isBestseller,
            ];
        });

        $availableProducts = $mappedProducts->filter(fn ($p) => $p['status'] !== 'out_of_stock')->values()->all();
        $outOfStockProducts = $mappedProducts->filter(fn ($p) => $p['status'] === 'out_of_stock')->values()->all();

        $categories = $mappedProducts->pluck('category')->filter()->unique()->values()->all();

        $paymentMethods = PaymentMethod::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($pm) => [
                'id' => $pm->id,
                'type' => $pm->type->value,
                'label' => $pm->label,
                'logo_url' => $pm->logo_path,
            ]);

        $banners = Banner::active()
            ->take(5)
            ->get()
            ->map(fn (Banner $b) => [
                'id' => $b->id,
                'title' => $b->title,
                'subtitle' => $b->subtitle,
                'cta_label' => $b->cta_label,
                'cta_url' => $b->cta_url,
                'image_path' => $b->image_path,
                'tone' => $b->tone,
            ]);

        $announcement = ($setting->announcement_active && ! empty($setting->announcement_text)) ? [
            'text' => $setting->announcement_text,
            'url' => $setting->announcement_url,
        ] : null;

        $availableServicesCount = $mappedProducts->filter(function ($p) use ($quota) {
            $canBuy = $p['has_buy'] && $p['available_buy_stock'] > 0;
            $canRent = $p['has_rent'] && $p['available_rent_stock'] > 0 && ! $quota['is_full'];
            return $canBuy || $canRent;
        })->count();

        $verificationMedianMinutes = Cache::remember('storefront.verification_median_minutes', 600, function () {
            $since = now()->subDays(30);

            $paidEvents = OrderEvent::where('to_status', OrderStatus::PAID)
                ->where('from_status', OrderStatus::VERIFYING)
                ->where('created_at', '>=', $since)
                ->get(['order_id', 'created_at']);

            if ($paidEvents->count() < 10) {
                return null;
            }

            $orderIds = $paidEvents->pluck('order_id')->unique();

            $verifyingEvents = OrderEvent::whereIn('order_id', $orderIds)
                ->where('to_status', OrderStatus::VERIFYING)
                ->orderByDesc('created_at')
                ->get(['order_id', 'created_at'])
                ->groupBy('order_id');

            $diffs = [];
            foreach ($paidEvents as $paidEvent) {
                $events = $verifyingEvents->get($paidEvent->order_id);
                if (! $events) {
                    continue;
                }
                $vEvent = $events->first(fn ($e) => $e->created_at <= $paidEvent->created_at);
                if ($vEvent) {
                    $diffMinutes = ($paidEvent->created_at->getTimestamp() - $vEvent->created_at->getTimestamp()) / 60;
                    if ($diffMinutes >= 0) {
                        $diffs[] = $diffMinutes;
                    }
                }
            }

            if (count($diffs) < 10) {
                return null;
            }

            sort($diffs);
            $count = count($diffs);
            $middle = (int) floor($count / 2);

            if ($count % 2 === 0) {
                $median = ($diffs[$middle - 1] + $diffs[$middle]) / 2;
            } else {
                $median = $diffs[$middle];
            }

            return (int) (ceil(max(1, $median) / 5) * 5);
        });

        $statsMinOrders = (int) ($setting->stats_min_orders ?? 20);
        $totalPaid = Order::where('status', OrderStatus::PAID)->count();

        $completedOrders = ($statsMinOrders > 0 && $totalPaid >= $statsMinOrders)
            ? $totalPaid
            : null;

        $activeServicesCount = $productsQuery->count();
        $activeServices = ($activeServicesCount >= 3)
            ? $activeServicesCount
            : null;

        $stats = [
            'completed_orders' => $completedOrders,
            'active_services' => $activeServices,
        ];

        return Inertia::render('storefront/Index', [
            'storeName' => $setting->store_name ?: config('app.name', 'StreamPoint'),
            'storeLogo' => $setting->store_logo_path,
            'storeTagline' => $setting->store_tagline,
            'deliveryEta' => $setting->delivery_eta,
            'announcement' => $announcement,
            'socialLinks' => $setting->social_links,
            'businessHours' => $setting->business_hours,
            'adminWhatsapp' => $setting->admin_whatsapp,
            'customRequest' => [
                'enabled' => (bool) $setting->custom_request_enabled,
                'adminWhatsapp' => $setting->admin_whatsapp,
            ],
            'quota' => $quota,
            'banners' => $banners,
            'available_services_count' => $availableServicesCount,
            'availableServicesCount' => $availableServicesCount,
            'verification_median_minutes' => $verificationMedianMinutes,
            'verificationMedianMinutes' => $verificationMedianMinutes,
            'stats' => $stats,
            'products' => $availableProducts,
            'outOfStockProducts' => $outOfStockProducts,
            'categories' => $categories,
            'paymentMethods' => $paymentMethods,
        ]);
    }
}
