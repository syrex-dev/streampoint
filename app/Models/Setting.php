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
        'announcement_text',
        'announcement_url',
        'announcement_active',
        'store_tagline',
        'delivery_eta',
        'min_sold_display',
        'stats_min_orders',
        'custom_request_enabled',
        'social_links',
        'telegram_active',
        'telegram_bot_token',
        'telegram_chat_id',
    ];

    protected function casts(): array
    {
        return [
            'max_daily_rent_quota' => 'integer',
            'announcement_active' => 'boolean',
            'custom_request_enabled' => 'boolean',
            'min_sold_display' => 'integer',
            'stats_min_orders' => 'integer',
            'social_links' => 'array',
            'telegram_active' => 'boolean',
            'telegram_bot_token' => 'encrypted',
        ];
    }

    public static function current(): self
    {
        if (app()->bound('current_setting_instance')) {
            $instance = app('current_setting_instance');
            if ($instance instanceof self && $instance->exists) {
                return $instance;
            }
        }

        $setting = static::firstOrCreate([], [
            'max_daily_rent_quota' => 3,
            'accent_preset' => 'emerald',
            'stats_min_orders' => 20,
        ]);

        app()->instance('current_setting_instance', $setting);

        return $setting;
    }

    public static function clearCurrentInstance(): void
    {
        if (app()->bound('current_setting_instance')) {
            app()->forgetInstance('current_setting_instance');
        }
    }
}
