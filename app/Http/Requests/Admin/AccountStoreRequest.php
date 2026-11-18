<?php

namespace App\Http\Requests\Admin;

use App\Enums\OrderType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'credential_type' => ['nullable', 'string', Rule::in(['STREAMING_PROFILE', 'STANDARD_ACCOUNT', 'INVITE_LINK', 'VOUCHER', 'CUSTOM'])],
            'email' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'max:255'],
            'profile' => ['nullable', 'string', 'max:100'],
            'pin' => ['nullable', 'string', 'max:50'],
            'link' => ['nullable', 'string', 'max:1000'],
            'code' => ['nullable', 'string', 'max:255'],
            'custom_credential' => ['nullable', 'string', 'max:1000'],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $type = $this->input('credential_type');
            $hasLink = ! empty(trim((string) $this->input('link')));
            $hasCode = ! empty(trim((string) $this->input('code')));
            $hasCustom = ! empty(trim((string) $this->input('custom_credential')));
            $hasEmail = ! empty(trim((string) $this->input('email')));
            $hasPassword = ! empty(trim((string) $this->input('password')));

            if ($type === 'INVITE_LINK') {
                if (! $hasLink) {
                    $validator->errors()->add('link', 'Tautan / link undangan wajib diisi.');
                }
            } elseif ($type === 'VOUCHER') {
                if (! $hasCode) {
                    $validator->errors()->add('code', 'Kode voucher / lisensi wajib diisi.');
                }
            } elseif ($type === 'CUSTOM') {
                if (! $hasCustom) {
                    $validator->errors()->add('custom_credential', 'Data kredensial kustom wajib diisi.');
                }
            } elseif ($type === 'STANDARD_ACCOUNT' || $type === 'STREAMING_PROFILE') {
                if (! $hasEmail) {
                    $validator->errors()->add('email', 'Email atau username akun wajib diisi.');
                }
                if (! $hasPassword) {
                    $validator->errors()->add('password', 'Password akun wajib diisi.');
                }
            } else {
                // Auto-detect based on filled fields
                if (! $hasLink && ! $hasCode && ! $hasCustom && (! $hasEmail || ! $hasPassword)) {
                    if (! $hasEmail) {
                        $validator->errors()->add('email', 'Email atau kredensial akun wajib diisi.');
                    }
                    if (! $hasPassword && ! $hasLink && ! $hasCode && ! $hasCustom) {
                        $validator->errors()->add('password', 'Password akun wajib diisi.');
                    }
                }
            }
        });
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
            'password.required' => 'Password akun wajib diisi.',
        ];
    }
}
