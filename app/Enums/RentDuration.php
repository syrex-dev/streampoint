<?php

namespace App\Enums;

enum RentDuration: string
{
    case HALF_DAY = 'HALF_DAY';
    case ONE_DAY = 'ONE_DAY';
    case TWO_DAYS = 'TWO_DAYS';
    case THREE_DAYS = 'THREE_DAYS';

    public function hours(): int
    {
        return match ($this) {
            self::HALF_DAY => 12,
            self::ONE_DAY => 24,
            self::TWO_DAYS => 48,
            self::THREE_DAYS => 72,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::HALF_DAY => '12 Jam',
            self::ONE_DAY => '1 Hari (24 Jam)',
            self::TWO_DAYS => '2 Hari (48 Jam)',
            self::THREE_DAYS => '3 Hari (72 Jam)',
        };
    }
}
