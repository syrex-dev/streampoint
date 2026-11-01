<?php

namespace App\Http\Requests;

use App\Support\Phone;
use Illuminate\Foundation\Http\FormRequest;
use InvalidArgumentException;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'customer_phone' => [
                'required',
                'string',
                function (string $attribute, mixed $value, \Closure $fail) {
                    try {
                        Phone::normalize((string) $value);
                    } catch (InvalidArgumentException $e) {
                        $fail($e->getMessage());
                    }
                },
            ],
            'payment_method_id' => ['required', 'integer', 'exists:payment_methods,id'],
            'customer_note' => ['nullable', 'string', 'max:500'],
            'idempotency_key' => ['required', 'string', 'max:64'],
            'hp_website' => ['nullable', 'max:0'], // Honeypot field (must remain empty)
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'variant_id.required' => 'Pilih paket layanan terlebih dahulu.',
            'variant_id.exists' => 'Paket layanan yang dipilih tidak valid.',
            'customer_phone.required' => 'Nomor WhatsApp wajib diisi.',
            'payment_method_id.required' => 'Pilih metode pembayaran terlebih dahulu.',
            'payment_method_id.exists' => 'Metode pembayaran tidak valid.',
            'customer_note.max' => 'Catatan pesanan maksimal 500 karakter.',
            'idempotency_key.required' => 'Idempotency key wajib disertakan.',
            'hp_website.max' => 'Spam terdeteksi.',
        ];
    }
}
