<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_admin === true;
    }

    protected function prepareForValidation(): void
    {
        $brandColor = $this->input('brand_color');
        if ($brandColor === '#' || trim((string) $brandColor) === '') {
            $this->merge(['brand_color' => null]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash'],
            'category' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'rules' => ['nullable', 'string'],
            'is_active' => ['required', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'brand_color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'has_warranty' => ['nullable', 'boolean'],
            'thumbnail' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
            'cover' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama produk wajib diisi.',
            'category.required' => 'Kategori produk wajib diisi.',
            'brand_color.regex' => 'Format warna merek harus berupa kode HEX 6 digit (contoh: #E50914).',
            'thumbnail.file' => 'File thumbnail harus berupa berkas gambar.',
            'thumbnail.mimes' => 'Format logo/thumbnail yang didukung: JPG, PNG, WEBP.',
            'thumbnail.max' => 'Ukuran file logo/thumbnail maksimal 10MB.',
            'cover.file' => 'File gambar sampul harus berupa berkas gambar.',
            'cover.mimes' => 'Format gambar sampul yang didukung: JPG, PNG, WEBP.',
            'cover.max' => 'Ukuran file gambar sampul maksimal 10MB.',
        ];
    }
}
