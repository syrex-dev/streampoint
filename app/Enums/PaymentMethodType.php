<?php

namespace App\Enums;

enum PaymentMethodType: string
{
    case QRIS = 'QRIS';
    case BANK = 'BANK';
    case EWALLET = 'EWALLET';

    public function label(): string
    {
        return match ($this) {
            self::QRIS => 'QRIS',
            self::BANK => 'Transfer Bank',
            self::EWALLET => 'E-Wallet',
        };
    }
}
