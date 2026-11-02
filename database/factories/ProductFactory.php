<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);
        return [
            'slug' => Str::slug($name),
            'name' => ucwords($name),
            'category' => 'Streaming',
            'thumbnail_path' => null,
            'description' => fake()->sentence(),
            'rules' => fake()->paragraph(),
            'is_active' => true,
            'sort_order' => 0,
            'brand_color' => null,
        ];
    }
}
