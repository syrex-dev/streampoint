<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PENDING = 'PENDING';
    case VERIFYING = 'VERIFYING';
    case PAID = 'PAID';
    case EXPIRED = 'EXPIRED';
    case CANCELLED = 'CANCELLED';

    public function canTransitionTo(self $to): bool
    {
        return match ($this) {
            self::PENDING => in_array($to, [self::VERIFYING, self::EXPIRED, self::CANCELLED], true),
            self::VERIFYING => in_array($to, [self::PAID, self::CANCELLED], true),
            self::EXPIRED => in_array($to, [self::PENDING, self::VERIFYING], true),
            self::PAID => in_array($to, [self::CANCELLED], true),
            self::CANCELLED => false,
        };
    }

    public function countsTowardQuota(): bool
    {
        return match ($this) {
            self::VERIFYING, self::PAID => true,
            default => false,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Menunggu Bayar',
            self::VERIFYING => 'Diverifikasi',
            self::PAID => 'Lunas',
            self::EXPIRED => 'Kedaluwarsa',
            self::CANCELLED => 'Dibatalkan',
        };
    }
}
