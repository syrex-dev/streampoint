<?php

namespace App\Enums;

enum DeliveryType: string
{
    case STOCK = 'STOCK';
    case INVITE = 'INVITE';
    case MANUAL = 'MANUAL';

    public function label(): string
    {
        return match ($this) {
            self::STOCK => 'Stok Akun/Kode',
            self::INVITE => 'Undangan Email',
            self::MANUAL => 'Diproses Admin',
        };
    }

    public function badgeText(): string
    {
        return match ($this) {
            self::STOCK => 'Dikirim di invoice',
            self::INVITE => 'Undangan email',
            self::MANUAL => 'Diproses admin',
        };
    }
}
