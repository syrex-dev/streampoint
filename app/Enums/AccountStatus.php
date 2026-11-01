<?php

namespace App\Enums;

enum AccountStatus: string
{
    case AVAILABLE = 'AVAILABLE';
    case RESERVED = 'RESERVED';
    case SOLD = 'SOLD';
    case RENTED = 'RENTED';
    case DISABLED = 'DISABLED';

    public function label(): string
    {
        return match ($this) {
            self::AVAILABLE => 'Tersedia',
            self::RESERVED => 'Direservasi',
            self::SOLD => 'Terjual',
            self::RENTED => 'Disewa',
            self::DISABLED => 'Dinonaktifkan',
        };
    }
}
