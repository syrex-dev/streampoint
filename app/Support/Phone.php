<?php

namespace App\Support;

use InvalidArgumentException;

class Phone
{
    public const MIN_DIGITS_AFTER_62 = 9;
    public const MAX_DIGITS_AFTER_62 = 12;

    /**
     * Normalize phone number to format 628xxxxxxxxx.
     * Rejects if not digits or length outside 9-12 digits after '62' (equivalent to 10-13 digits with leading 0).
     */
    public static function normalize(string $phone): string
    {
        // Remove spaces, dashes, plus, dots, parentheses
        $cleaned = preg_replace('/[\s\-\+\.\(\)]+/', '', $phone);

        if (! ctype_digit($cleaned)) {
            throw new InvalidArgumentException('Nomor WhatsApp harus berupa angka.');
        }

        if (str_starts_with($cleaned, '08')) {
            $cleaned = '62' . substr($cleaned, 1);
        } elseif (str_starts_with($cleaned, '8')) {
            $cleaned = '62' . $cleaned;
        }

        if (! str_starts_with($cleaned, '628')) {
            throw new InvalidArgumentException('Nomor WhatsApp harus diawali dengan 08 atau 628.');
        }

        $after62 = substr($cleaned, 2);
        $len = strlen($after62);

        if ($len < self::MIN_DIGITS_AFTER_62 || $len > self::MAX_DIGITS_AFTER_62) {
            throw new InvalidArgumentException(
                sprintf('Nomor WhatsApp harus memiliki %d-%d digit setelah 62.', self::MIN_DIGITS_AFTER_62, self::MAX_DIGITS_AFTER_62)
            );
        }

        return $cleaned;
    }
}
