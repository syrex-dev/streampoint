<?php

namespace Database\Factories;

use App\Enums\AccountStatus;
use App\Enums\OrderType;
use App\Models\Product;
use App\Models\ProductAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductAccount>
 */
class ProductAccountFactory extends Factory
{
    protected $model = ProductAccount::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'kind' => OrderType::RENT,
            'credential' => fake()->email() . ' | pass123 | Profil 1 | 1234',
            'status' => AccountStatus::AVAILABLE,
            'order_id' => null,
            'rented_until' => null,
            'note' => null,
        ];
    }

    public function buy(): static
    {
        return $this->state(fn () => [
            'kind' => OrderType::BUY,
        ]);
    }
}
