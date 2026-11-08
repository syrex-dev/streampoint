<?php

namespace Database\Factories;

use App\Enums\PaymentMethodType;
use App\Models\PaymentMethod;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PaymentMethod>
 */
class PaymentMethodFactory extends Factory
{
    protected $model = PaymentMethod::class;

    public function definition(): array
    {
        return [
            'type' => PaymentMethodType::QRIS,
            'label' => 'QRIS',
            'account_number' => null,
            'account_holder' => 'StreamPoint Store',
            'qris_image_path' => null,
            'logo_path' => null,
            'instructions' => 'Scan QRIS untuk melakukan pembayaran.',
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    public function bank(string $label = 'BCA'): static
    {
        return $this->state(fn () => [
            'type' => PaymentMethodType::BANK,
            'label' => $label,
            'account_number' => '1234567890',
            'account_holder' => 'StreamPoint Store',
            'instructions' => "Transfer ke rekening {$label}.",
        ]);
    }
}
