<?php

namespace App\Http\Requests\Admin;

use App\Enums\OrderType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AccountStoreRequest extends FormRequest
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
            'variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'kind' => ['required', Rule::enum(OrderType::class)],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            'profile' => ['nullable', 'string', 'max:100'],
            'pin' => ['nullable', 'string', 'max:20'],
            'note' => ['nullable', 'string', 'max:255'],
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
            'email.required' => 'Email akun wajib diisi.',
            'email.email' => 'Format email akun tidak valid.',
            'password.required' => 'Password akun wajib diisi.',
        ];
    }
}
