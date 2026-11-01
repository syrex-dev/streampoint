<?php

namespace Tests\Unit;

use App\Support\Phone;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class PhoneTest extends TestCase
{
    /**
     * Test valid phone numbers with different prefixes.
     */
    public function test_valid_phone_numbers_are_normalized_to_62_format(): void
    {
        // 08 prefix (11 digits after 62)
        $this->assertEquals('6281234567890', Phone::normalize('081234567890'));

        // +62 prefix
        $this->assertEquals('6281234567890', Phone::normalize('+6281234567890'));

        // 8 prefix (no 0, no 62)
        $this->assertEquals('6281234567890', Phone::normalize('81234567890'));

        // With formatting characters: spaces, dashes
        $this->assertEquals('6281234567890', Phone::normalize('0812-3456-7890'));
        $this->assertEquals('6281234567890', Phone::normalize('+62 812 3456 7890'));
    }

    /**
     * Test boundary lengths (9 to 12 digits after 62).
     */
    public function test_boundary_lengths_after_62(): void
    {
        // Min boundary: 9 digits after 62 (e.g., 0812345678 -> 62812345678)
        $this->assertEquals('62812345678', Phone::normalize('0812345678'));

        // Max boundary: 12 digits after 62 (e.g., 0812345678901 -> 62812345678901)
        $this->assertEquals('62812345678901', Phone::normalize('0812345678901'));
    }

    /**
     * Test rejected phone numbers that are too short.
     */
    public function test_rejects_numbers_too_short(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Phone::normalize('0812345');
    }

    /**
     * Test rejected phone numbers that are too long.
     */
    public function test_rejects_numbers_too_long(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Phone::normalize('08123456789012345');
    }

    /**
     * Test rejects invalid prefix (not 08 or 628).
     */
    public function test_rejects_invalid_prefix(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Phone::normalize('02112345678');
    }

    /**
     * Test rejects non-numeric input.
     */
    public function test_rejects_non_numeric_input(): void
    {
        $this->expectException(InvalidArgumentException::class);
        Phone::normalize('0812abcd3456');
    }
}
