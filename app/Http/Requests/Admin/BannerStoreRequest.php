<?php

namespace App\Http\Requests\Admin;

use App\Models\Banner;
use Illuminate\Foundation\Http\FormRequest;

class BannerStoreRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:80'],
            'subtitle' => ['nullable', 'string', 'max:160'],
            'cta_label' => ['nullable', 'string', 'max:30'],
            'cta_url' => [
                'nullable',
                'string',
                'max:255',
                function ($attribute, $value, $fail) {
                    if (! empty($value)) {
                        $lower = strtolower(trim($value));
                        if (str_starts_with($lower, 'javascript:') || str_starts_with($lower, 'data:') || str_starts_with($lower, 'vbscript:') || str_starts_with($lower, '//') || (! str_starts_with($value, '/') && ! str_starts_with($lower, 'https://'))) {
                            $fail('Tautan tombol hanya boleh berupa path lokal yang diawali "/" atau URL aman yang diawali "https://".');
                        }
                    }
                },
            ],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'tone' => ['required', 'string', 'in:neutral,accent,warning'],
            'is_active' => [
                'required',
                'boolean',
                function ($attribute, $value, $fail) {
                    if (filter_var($value, FILTER_VALIDATE_BOOLEAN)) {
                        $activeCount = Banner::where('is_active', true)->count();
                        if ($activeCount >= 5) {
                            $fail('Maksimal 5 banner aktif sekaligus. Nonaktifkan salah satu banner terlebih dahulu.');
                        }
                    }
                },
            ],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Judul banner wajib diisi.',
            'title.max' => 'Judul banner maksimal 80 karakter.',
            'subtitle.max' => 'Subjudul banner maksimal 160 karakter.',
            'cta_label.max' => 'Label tombol maksimal 30 karakter.',
            'image.image' => 'File banner harus berupa gambar.',
            'image.mimes' => 'Format gambar yang didukung: JPG, PNG, WEBP (SVG tidak diizinkan).',
            'image.max' => 'Ukuran gambar banner maksimal 2MB.',
            'tone.in' => 'Tone warna banner harus neutral, accent, atau warning.',
            'ends_at.after' => 'Waktu berakhir harus setelah waktu mulai tayang.',
        ];
    }
}
