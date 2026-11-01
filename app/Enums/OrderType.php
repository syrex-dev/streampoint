<?php

namespace App\Enums;

enum OrderType: string
{
    case RENT = 'RENT';
    case BUY = 'BUY';

    public function label(): string
    {
        return match ($this) {
            self::RENT => 'Sewa Harian',
            self::BUY => 'Beli Akun',
        };
    }
}
