<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ADMIN_EMAIL');
        $password = env('ADMIN_PASSWORD');

        if (empty($email) || empty($password)) {
            throw new RuntimeException('Kredensial admin (ADMIN_EMAIL dan ADMIN_PASSWORD) wajib diatur pada file .env.');
        }

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Admin StreamPoint',
                'password' => Hash::make($password),
                'is_admin' => true,
                'email_verified_at' => now(),
            ]
        );
    }
}
