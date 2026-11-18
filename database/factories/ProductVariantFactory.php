<?php

namespace Database\Factories;

use App\Enums\DeliveryType;
use App\Enums\OrderType;
use App\Enums\RentDuration;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    protected $model = ProductVariant::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'name' => 'Sewa 1 Hari (24 Jam)',
            'type' => OrderType::RENT,
            'delivery_type' => DeliveryType::STOCK,
            'buyer_fields' => null,
            'stock_fields' => [
                ['key' => 'email', 'label' => 'Email', 'secret' => false],
                ['key' => 'password', 'label' => 'Password', 'secret' => true],
                ['key' => 'profile', 'label' => 'Profil', 'secret' => false],
                ['key' => 'pin', 'label' => 'PIN', 'secret' => true],
            ],
            'delivery_instructions' => null,
            'eta_text' => null,
            'stock_limit' => null,
            'rent_duration' => RentDuration::ONE_DAY,
            'duration_hours' => 24,
            'price' => 15000,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    public function buy(): static
    {
        return $this->state(fn () => [
            'name' => 'Beli 1 Bulan Private',
            'type' => OrderType::BUY,
            'delivery_type' => DeliveryType::STOCK,
            'rent_duration' => null,
            'duration_hours' => 720,
            'price' => 45000,
        ]);
    }
}
