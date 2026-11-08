<?php

namespace Database\Seeders;

use App\Enums\AccountStatus;
use App\Enums\OrderType;
use App\Enums\PaymentMethodType;
use App\Enums\RentDuration;
use App\Models\Banner;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductAccount;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local')) {
            return;
        }

        $defaultRules = "- Akun hanya untuk dipakai sendiri sesuai profil yang diberikan.\n"
            . "- Dilarang mengubah email, password, PIN, atau nama profil.\n"
            . "- Masa sewa dihitung sejak akun dikirim, bukan sejak pembayaran.\n"
            . "- Jika akun bermasalah selama masa sewa/garansi, hubungi admin via WhatsApp dengan menyebut kode invoice.\n"
            . "- Pembayaran yang sudah diverifikasi dan akun yang sudah dikirim tidak dapat dibatalkan.";

        $services = [
            [
                'name' => 'Netflix Premium UHD',
                'slug' => 'netflix-premium',
                'category' => 'Streaming',
                'brand_color' => '#E50914',
                'description' => 'Nonton film & series kualitas 4K UHD, support semua device (TV, HP, Laptop).',
                'rules' => $defaultRules,
                'rent_prices' => [8000, 15000, 28000, 38000],
                'buy_prices' => [45000, 120000],
            ],
            [
                'name' => 'YouTube Premium',
                'slug' => 'youtube-premium',
                'category' => 'Streaming',
                'brand_color' => '#FF0000',
                'description' => 'Bebas iklan, putar di latar belakang, dan akses YouTube Music Premium.',
                'rules' => $defaultRules,
                'rent_prices' => [5000, 10000, 18000, 25000],
                'buy_prices' => [30000, 80000],
            ],
            [
                'name' => 'Spotify Premium',
                'slug' => 'spotify-premium',
                'category' => 'Streaming',
                'brand_color' => '#1DB954',
                'description' => 'Dengarkan musik tanpa jeda iklan, download lagu offline, audio kualitas tinggi.',
                'rules' => $defaultRules,
                'rent_prices' => [4000, 8000, 15000, 20000],
                'buy_prices' => [25000, 65000],
            ],
        ];

        foreach ($services as $svc) {
            $product = Product::updateOrCreate(
                ['slug' => $svc['slug']],
                [
                    'name' => $svc['name'],
                    'category' => $svc['category'],
                    'brand_color' => $svc['brand_color'],
                    'has_warranty' => true,
                    'description' => $svc['description'],
                    'rules' => $svc['rules'],
                    'is_active' => true,
                    'sort_order' => 0,
                ]
            );

            // 4 Rent Variants
            $rentConfigs = [
                ['name' => 'Sewa 12 Jam', 'duration' => RentDuration::HALF_DAY, 'hours' => 12, 'price' => $svc['rent_prices'][0], 'sort' => 1],
                ['name' => 'Sewa 1 Hari (24 Jam)', 'duration' => RentDuration::ONE_DAY, 'hours' => 24, 'price' => $svc['rent_prices'][1], 'sort' => 2],
                ['name' => 'Sewa 2 Hari (48 Jam)', 'duration' => RentDuration::TWO_DAYS, 'hours' => 48, 'price' => $svc['rent_prices'][2], 'sort' => 3],
                ['name' => 'Sewa 3 Hari (72 Jam)', 'duration' => RentDuration::THREE_DAYS, 'hours' => 72, 'price' => $svc['rent_prices'][3], 'sort' => 4],
            ];

            foreach ($rentConfigs as $rc) {
                ProductVariant::updateOrCreate(
                    ['product_id' => $product->id, 'name' => $rc['name']],
                    [
                        'type' => OrderType::RENT,
                        'rent_duration' => $rc['duration'],
                        'duration_hours' => $rc['hours'],
                        'price' => $rc['price'],
                        'is_active' => true,
                        'sort_order' => $rc['sort'],
                    ]
                );
            }

            // 2 Buy Variants
            $buyConfigs = [
                ['name' => 'Beli 1 Bulan Private', 'hours' => 720, 'price' => $svc['buy_prices'][0], 'sort' => 5],
                ['name' => 'Beli 3 Bulan Private', 'hours' => 2160, 'price' => $svc['buy_prices'][1], 'sort' => 6],
            ];

            foreach ($buyConfigs as $bc) {
                ProductVariant::updateOrCreate(
                    ['product_id' => $product->id, 'name' => $bc['name']],
                    [
                        'type' => OrderType::BUY,
                        'rent_duration' => null,
                        'duration_hours' => $bc['hours'],
                        'price' => $bc['price'],
                        'is_active' => true,
                        'sort_order' => $bc['sort'],
                    ]
                );
            }

            // Dummy Accounts: 5 RENT units, 3 BUY units
            for ($i = 1; $i <= 5; $i++) {
                ProductAccount::firstOrCreate(
                    [
                        'product_id' => $product->id,
                        'kind' => OrderType::RENT,
                        'credential' => "rent_{$product->slug}_{$i}@dummy.test | passRent{$i} | Profil {$i} | 1234",
                    ],
                    [
                        'status' => AccountStatus::AVAILABLE,
                        'note' => "Unit sewa dummy #{$i}",
                    ]
                );
            }

            for ($i = 1; $i <= 3; $i++) {
                ProductAccount::firstOrCreate(
                    [
                        'product_id' => $product->id,
                        'kind' => OrderType::BUY,
                        'credential' => "buy_{$product->slug}_{$i}@dummy.test | passBuy{$i} | Profil Utama | 4321",
                    ],
                    [
                        'status' => AccountStatus::AVAILABLE,
                        'note' => "Unit beli dummy #{$i}",
                    ]
                );
            }
        }

        // 2 Payment Methods
        PaymentMethod::updateOrCreate(
            ['label' => 'QRIS'],
            [
                'type' => PaymentMethodType::QRIS,
                'account_number' => null,
                'account_holder' => 'StreamPoint Store',
                'instructions' => 'Scan QRIS memakai GoPay, OVO, DANA, ShopeePay, BCA Mobile, atau perbankan apa pun.',
                'is_active' => true,
                'sort_order' => 1,
            ]
        );

        PaymentMethod::updateOrCreate(
            ['label' => 'BCA'],
            [
                'type' => PaymentMethodType::BANK,
                'account_number' => '1234567890',
                'account_holder' => 'StreamPoint Store',
                'instructions' => 'Transfer manual ke rekening BCA di atas sesuai nominal persis.',
                'is_active' => true,
                'sort_order' => 2,
            ]
        );

        // 2 Demo Banners (text only, neutral & accent)
        Banner::updateOrCreate(
            ['title' => 'Promo Akhir Pekan'],
            [
                'subtitle' => 'Sewa akun streaming mulai dari Rp4.000 dengan garansi penuh dan aktivasi cepat.',
                'cta_label' => 'Lihat Katalog',
                'cta_url' => '/#katalog',
                'image_path' => null,
                'tone' => 'neutral',
                'is_active' => true,
                'sort_order' => 1,
                'starts_at' => null,
                'ends_at' => null,
            ]
        );

        Banner::updateOrCreate(
            ['title' => 'Garansi Akun Pengganti'],
            [
                'subtitle' => 'Akun bermasalah langsung diganti atau durasi sewa diperpanjang tanpa biaya tambahan.',
                'cta_label' => 'Pelajari Cara Pesan',
                'cta_url' => '/#cara-pesan',
                'image_path' => null,
                'tone' => 'accent',
                'is_active' => true,
                'sort_order' => 2,
                'starts_at' => null,
                'ends_at' => null,
            ]
        );

        // Pengaturan demo: sampel pengumuman nonaktif, tagline, estimasi pengiriman, pesanan custom
        \App\Models\Setting::current()->update([
            'announcement_text' => 'Info: Layanan aktif normal setiap hari. Hubungi WhatsApp admin bila butuh bantuan cepat.',
            'announcement_url' => '/#katalog',
            'announcement_active' => false,
            'store_tagline' => 'Sewa & Beli Akun Streaming',
            'delivery_eta' => 'setelah verifikasi admin',
            'min_sold_display' => 5,
            'custom_request_enabled' => true,
            'social_links' => [
                'telegram' => 'https://t.me/streampoint',
                'instagram' => 'https://instagram.com/streampoint',
                'threads' => null,
                'tiktok' => null,
            ],
        ]);
    }
}
