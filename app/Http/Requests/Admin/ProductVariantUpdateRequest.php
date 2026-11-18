<?php

namespace App\Http\Requests\Admin;

use App\Enums\OrderType;
use App\Enums\RentDuration;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductVariantUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_admin === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(OrderType::class)],
            'delivery_type' => [
                'nullable',
                Rule::in(['STOCK', 'INVITE', 'MANUAL']),
            ],
            'buyer_fields' => [
                'nullable',
                'array',
                'max:5',
                function (string $attribute, mixed $value, Closure $fail) {
                    if (! is_array($value) || empty($value)) {
                        return;
                    }
                    try {
                        \App\Support\BuyerFieldsSchema::validateDefinition($value);
                    } catch (\Illuminate\Validation\ValidationException $e) {
                        foreach ($e->errors() as $fieldErrors) {
                            foreach ($fieldErrors as $err) {
                                $fail($err);
                            }
                        }
                    }
                },
            ],
            'stock_fields' => ['nullable', 'array'],
            'delivery_instructions' => ['nullable', 'string'],
            'eta_text' => ['nullable', 'string', 'max:60'],
            'stock_limit' => ['nullable', 'integer', 'min:1'],
            'rent_duration' => [
                Rule::requiredIf($this->input('type') === OrderType::RENT->value),
                'nullable',
                Rule::enum(RentDuration::class),
                function (string $attribute, mixed $value, Closure $fail) {
                    if ($this->input('type') === OrderType::BUY->value && ! empty($value)) {
                        $fail('Durasi sewa (rent_duration) harus kosong untuk varian Beli (BUY).');
                    }
                },
            ],
            'duration_hours' => [
                Rule::requiredIf($this->input('type') === OrderType::RENT->value),
                'nullable',
                'integer',
                'min:1',
                function (string $attribute, mixed $value, Closure $fail) {
                    if (empty($value)) {
                        return;
                    }
                    $type = $this->input('type');
                    $hours = (int) $value;

                    if ($type === OrderType::RENT->value) {
                        $rentDuration = $this->input('rent_duration');
                        $expectedHours = match ($rentDuration) {
                            RentDuration::HALF_DAY->value => 12,
                            RentDuration::ONE_DAY->value => 24,
                            RentDuration::TWO_DAYS->value => 48,
                            RentDuration::THREE_DAYS->value => 72,
                            default => null,
                        };

                        if ($expectedHours !== null && $hours !== $expectedHours) {
                            $fail("Durasi jam ({$hours} jam) tidak cocok dengan opsi sewa {$rentDuration} (harus {$expectedHours} jam).");
                        }
                    } elseif ($type === OrderType::BUY->value) {
                        if ($hours % 720 !== 0) {
                            $fail('Durasi jam untuk tipe Beli harus merupakan kelipatan 720 jam (30 hari).');
                        }
                    }
                },
            ],
            'price' => ['required', 'integer', 'min:1'],
            'is_active' => ['required', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama varian paket wajib diisi.',
            'type.required' => 'Tipe varian (RENT atau BUY) wajib dipilih.',
            'rent_duration.required' => 'Durasi sewa wajib dipilih untuk paket Sewa.',
            'duration_hours.required' => 'Durasi jam wajib diisi.',
            'duration_hours.min' => 'Durasi jam minimal 1 jam.',
            'price.required' => 'Harga paket wajib diisi.',
            'price.min' => 'Harga paket harus lebih besar dari 0 Rupiah.',
        ];
    }
}
