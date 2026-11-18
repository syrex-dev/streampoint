<?php

namespace App\Services;

use App\Enums\AccountStatus;
use App\Enums\DeliveryType;
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
            DeliveryType::INVITE => [
                'available' => false,
                'remaining' => 0,
                'reason' => 'Undangan keluarga segera hadir',
            ],
            DeliveryType::MANUAL => [
                'available' => false,
                'remaining' => 0,
                'reason' => 'Layanan manual segera hadir',
            ],
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
}
