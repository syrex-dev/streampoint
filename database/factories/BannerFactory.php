<?php

namespace Database\Factories;

use App\Models\Banner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Banner>
 */
class BannerFactory extends Factory
{
    protected $model = Banner::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'subtitle' => fake()->sentence(6),
            'cta_label' => 'Lihat Promo',
            'cta_url' => '/',
            'image_path' => null,
            'tone' => 'neutral',
            'is_active' => true,
            'sort_order' => 0,
            'starts_at' => null,
            'ends_at' => null,
        ];
    }
}
