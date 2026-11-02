<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'max_daily_rent_quota',
        'admin_whatsapp',
        'business_hours',
        'store_name',
        'store_logo_path',
        'accent_preset',
    ];

    protected function casts(): array
    {
        return [
            'max_daily_rent_quota' => 'integer',
        ];
    }

    public static function current(): self
    {
        return static::firstOrCreate([], [
            'max_daily_rent_quota' => 3,
            'accent_preset' => 'emerald',
        ]);
    }
}
