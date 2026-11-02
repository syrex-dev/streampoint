<?php

namespace App\Http\Requests\Admin;

use App\Enums\OrderType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AccountBulkStoreRequest extends FormRequest
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
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'kind' => ['required', Rule::enum(OrderType::class)],
            'items_text' => [
                'required',
                'string',
                function (string $attribute, mixed $value, \Closure $fail) {
                    $lines = preg_split('/\r\n|\r|\n/', trim((string) $value));
                    if (count($lines) > 200) {
                        $fail('Maksimal 200 baris per impor.');
                    }
                },
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'product_id.required' => 'Pilih produk layanan terlebih dahulu.',
            'product_id.exists' => 'Produk tidak ditemukan.',
            'kind.required' => 'Kategori unit (RENT / BUY) wajib dipilih.',
            'items_text.required' => 'Data unit akun tidak boleh kosong.',
        ];
    }
}
