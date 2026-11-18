<?php

namespace App\Support;

use App\Models\ProductVariant;
use Closure;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class BuyerFieldsSchema
{
    public const ALLOWED_TYPES = ['email', 'text', 'url', 'textarea', 'select'];

    public const FORBIDDEN_PASSWORD_WORDS = [
        'password',
        'kata sandi',
        'katasandi',
        'pin',
        'sandi',
        'pass',
        'secret',
        'rahasia',
    ];

    /**
     * Validate the schema definition configured by admin for a variant.
     *
     * @param array<int, array<string, mixed>> $fields
     * @throws ValidationException
     */
    public static function validateDefinition(array $fields): void
    {
        if (count($fields) > 5) {
            throw ValidationException::withMessages([
                'buyer_fields' => 'Maksimal 5 kolom data pembeli yang diizinkan per varian.',
            ]);
        }

        $seenKeys = [];

        foreach ($fields as $index => $field) {
            $key = (string) ($field['key'] ?? '');
            $label = (string) ($field['label'] ?? '');
            $type = (string) ($field['type'] ?? 'text');

            if (! preg_match('/^[a-z0-9_]+$/', $key)) {
                throw ValidationException::withMessages([
                    "buyer_fields.{$index}.key" => "Kunci kolom '{$key}' harus berformat snake_case (huruf kecil, angka, garis bawah).",
                ]);
            }

            if (in_array($key, $seenKeys, true)) {
                throw ValidationException::withMessages([
                    "buyer_fields.{$index}.key" => "Kunci kolom '{$key}' tidak boleh duplikat.",
                ]);
            }
            $seenKeys[] = $key;

            if (empty($label) || mb_strlen($label) > 60) {
                throw ValidationException::withMessages([
                    "buyer_fields.{$index}.label" => 'Label kolom wajib diisi dan maksimal 60 karakter.',
                ]);
            }

            // Reject any field that asks for passwords or sensitive secret credentials
            $lowerLabel = mb_strtolower($label);
            $lowerKey = mb_strtolower($key);
            foreach (self::FORBIDDEN_PASSWORD_WORDS as $forbidden) {
                if (str_contains($lowerLabel, $forbidden) || str_contains($lowerKey, $forbidden)) {
                    throw ValidationException::withMessages([
                        "buyer_fields.{$index}.label" => "Kolom dilarang meminta kata sandi atau data rahasia pembeli (terdeteksi kata '{$forbidden}').",
                    ]);
                }
            }

            if (! in_array($type, self::ALLOWED_TYPES, true)) {
                throw ValidationException::withMessages([
                    "buyer_fields.{$index}.type" => "Tipe kolom '{$type}' tidak didukung. Tipe yang valid: " . implode(', ', self::ALLOWED_TYPES) . '.',
                ]);
            }

            if ($type === 'select') {
                $options = $field['options'] ?? [];
                if (! is_array($options) || empty($options)) {
                    throw ValidationException::withMessages([
                        "buyer_fields.{$index}.options" => 'Tipe select wajib menyertakan daftar pilihan options.',
                    ]);
                }
            }

            if ($type === 'email' && ! empty($field['allowed_domains'])) {
                if (! is_array($field['allowed_domains'])) {
                    throw ValidationException::withMessages([
                        "buyer_fields.{$index}.allowed_domains" => 'allowed_domains harus berupa array domain (contoh: gmail.com).',
                    ]);
                }
            }
        }
    }

    /**
     * Build Laravel validation rules for buyer inputs according to variant's buyer_fields.
     *
     * @return array<string, mixed>
     */
    public static function rulesForVariant(?ProductVariant $variant): array
    {
        if (! $variant || empty($variant->buyer_fields) || ! is_array($variant->buyer_fields)) {
            return [];
        }

        $rules = [];

        foreach ($variant->buyer_fields as $field) {
            $key = (string) ($field['key'] ?? '');
            if (empty($key)) {
                continue;
            }

            $type = (string) ($field['type'] ?? 'text');
            $isRequired = ! empty($field['required']);
            $allowedDomains = $field['allowed_domains'] ?? null;
            $options = $field['options'] ?? [];

            $fieldRules = [$isRequired ? 'required' : 'nullable'];

            switch ($type) {
                case 'email':
                    $fieldRules[] = 'string';
                    $fieldRules[] = 'email';
                    $fieldRules[] = 'max:255';
                    if (! empty($allowedDomains) && is_array($allowedDomains)) {
                        $fieldRules[] = function (string $attribute, mixed $value, Closure $fail) use ($allowedDomains) {
                            if (! empty($value) && filter_var($value, FILTER_VALIDATE_EMAIL)) {
                                $domain = Str::after($value, '@');
                                $normalizedAllowed = array_map('strtolower', array_map('trim', $allowedDomains));
                                if (! in_array(strtolower($domain), $normalizedAllowed, true)) {
                                    $fail('Email harus menggunakan domain yang diizinkan: ' . implode(', ', $allowedDomains) . '.');
                                }
                            }
                        };
                    }
                    break;

                case 'url':
                    $fieldRules[] = 'string';
                    $fieldRules[] = 'url';
                    $fieldRules[] = 'starts_with:https://';
                    $fieldRules[] = 'max:255';
                    break;

                case 'textarea':
                    $fieldRules[] = 'string';
                    $fieldRules[] = 'max:1000';
                    break;

                case 'select':
                    $fieldRules[] = 'string';
                    if (! empty($options) && is_array($options)) {
                        $fieldRules[] = Rule::in($options);
                    }
                    break;

                case 'text':
                default:
                    $fieldRules[] = 'string';
                    $fieldRules[] = 'max:255';
                    break;
            }

            $rules["buyer_inputs.{$key}"] = $fieldRules;
        }

        return $rules;
    }

    /**
     * Sanitize and extract only defined buyer fields from request inputs.
     *
     * @param array<string, mixed> $inputs
     * @return array<string, mixed>
     */
    public static function sanitize(array $inputs, ?ProductVariant $variant): array
    {
        if (! $variant || empty($variant->buyer_fields) || ! is_array($variant->buyer_fields)) {
            return [];
        }

        $sanitized = [];
        foreach ($variant->buyer_fields as $field) {
            $key = (string) ($field['key'] ?? '');
            if (empty($key)) {
                continue;
            }

            if (array_key_exists($key, $inputs)) {
                $val = $inputs[$key];
                $sanitized[$key] = is_string($val) ? trim($val) : $val;
            }
        }

        return $sanitized;
    }
}
