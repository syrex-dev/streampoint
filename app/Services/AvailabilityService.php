<?php

namespace App\Services;

use App\Enums\AccountStatus;
use App\Enums\DeliveryType;
use App\Enums\FulfillmentStatus;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\ProductAccount;
use App\Models\ProductVariant;

class AvailabilityService
{
    /**
     * Determine availability for a given product variant.
     *
     * @return array{available: bool, remaining: ?int, reason: ?string}
     */
    public function forVariant(ProductVariant $variant): array
    {
        $deliveryType = $variant->delivery_type ?? DeliveryType::STOCK;

        return match ($deliveryType) {
            DeliveryType::STOCK => $this->checkStockAvailability($variant),
            DeliveryType::INVITE, DeliveryType::MANUAL => $this->checkSlotAvailability($variant),
        };
    }

    /**
     * Check STOCK availability: variant-specific units prioritized,
     * fallback to product-level units where variant_id is null.
     *
     * @return array{available: bool, remaining: ?int, reason: ?string}
     */
    protected function checkStockAvailability(ProductVariant $variant): array
    {
        $variantUnitsCount = ProductAccount::where('variant_id', $variant->id)
            ->where('status', AccountStatus::AVAILABLE)
            ->count();

        $productGeneralUnitsCount = ProductAccount::where('product_id', $variant->product_id)
            ->where('kind', $variant->type)
            ->whereNull('variant_id')
            ->where('status', AccountStatus::AVAILABLE)
            ->count();

        $totalAvailable = $variantUnitsCount + $productGeneralUnitsCount;

        if ($totalAvailable <= 0) {
            return [
                'available' => false,
                'remaining' => 0,
                'reason' => 'Stok habis',
            ];
        }

        return [
            'available' => true,
            'remaining' => $totalAvailable,
            'reason' => null,
        ];
    }

    /**
     * Check slot availability for INVITE and MANUAL variants.
     * If stock_limit is null, slots are unlimited.
     *
     * @return array{available: bool, remaining: ?int, reason: ?string}
     */
    protected function checkSlotAvailability(ProductVariant $variant): array
    {
        if ($variant->stock_limit === null) {
            return [
                'available' => true,
                'remaining' => null,
                'reason' => null,
            ];
        }

        $activeOrdersCount = Order::where('variant_id', $variant->id)
            ->whereIn('status', [OrderStatus::PENDING, OrderStatus::VERIFYING, OrderStatus::PAID])
            ->where(function ($q) {
                $q->whereNull('fulfillment_status')
                    ->orWhereIn('fulfillment_status', [
                        FulfillmentStatus::AWAITING_ACTION,
                        FulfillmentStatus::INVITE_SENT,
                        FulfillmentStatus::ACTIVE,
                    ]);
            })
            ->count();

        $remaining = max(0, $variant->stock_limit - $activeOrdersCount);

        if ($remaining <= 0) {
            return [
                'available' => false,
                'remaining' => 0,
                'reason' => 'Slot kuota penuh',
            ];
        }

        return [
            'available' => true,
            'remaining' => $remaining,
            'reason' => null,
        ];
    }
}
