<?php

namespace App\Services;

use App\Models\Order;

class InvoiceCodeGenerator
{
    private const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    public function generate(): string
    {
        $date = now()->format('Ymd');
        $maxAttempts = 10;

        for ($i = 0; $i < $maxAttempts; $i++) {
            $randomStr = '';
            $length = strlen(self::ALPHABET);
            for ($j = 0; $j < 6; $j++) {
                $randomStr .= self::ALPHABET[random_int(0, $length - 1)];
            }

            $code = "INV-{$date}-{$randomStr}";

            if (! Order::where('invoice_code', $code)->exists()) {
                return $code;
            }
        }

        // Fallback with microtime if repeated collision
        return 'INV-' . $date . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
    }
}
