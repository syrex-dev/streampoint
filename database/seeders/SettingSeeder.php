<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        Setting::updateOrCreate(
            ['id' => 1],
            [
                'max_daily_rent_quota' => 3,
                'admin_whatsapp' => '6281234567890',
                'business_hours' => 'Setiap hari, 09.00 - 21.00 WIB',
            ]
        );
    }
}
