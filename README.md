# StreamPoint 🚀

Aplikasi e-commerce penyewaan harian dan pembelian akun streaming premium berbasis Laravel, Inertia.js, React, TypeScript, dan Tailwind CSS.

---

## 1. Menjalankan di Lingkungan Lokal (Laravel Herd)

Aplikasi ini dikembangkan dan diuji menggunakan **Laravel Herd** pada Windows:

1. **Clone dan Setup `.env`:**
   ```bash
   cp .env.example .env
   ```
2. **Pasang Dependensi:**
   ```bash
   composer install
   npm install
   ```
3. **Kunci Enkripsi & Database:**
   ```bash
   php artisan key:generate
   ```
   Pastikan database MySQL lokal Anda aktif dan sesuaikan `DB_DATABASE`, `DB_USERNAME`, dan `DB_PASSWORD` di `.env`.

4. **Migrasi & Seeder Demo (Lokal):**
   ```bash
   php artisan migrate:fresh --seed
   ```
   *Catatan: `DatabaseSeeder` di lokal menjalankan `SettingSeeder`, `AdminSeeder`, dan `DemoSeeder` (berisi produk Netflix, YouTube, Spotify, varian sewa/beli, stok akun dummy, dan metode pembayaran).*

5. **Jalankan Frontend Dev Server:**
   ```bash
   npm run dev
   ```
6. **Akses Aplikasi:**
   Buka peramban di `http://streampoint.test` (atau `http://localhost:8000` jika menggunakan `php artisan serve`).

---

## 2. Akun Admin Default

Akun admin dibuat secara otomatis melalui `AdminSeeder` berdasarkan nilai pada `.env`:

```env
ADMIN_EMAIL=admin@streampoint.test
ADMIN_PASSWORD=password
```

- **URL Login:** `http://streampoint.test/login`
- **Dashboard Admin:** `http://streampoint.test/admin`

*(Untuk produksi, ubah nilai `ADMIN_EMAIL` dan `ADMIN_PASSWORD` di `.env` sebelum menjalankan seeder).*

---

## 3. Menjalankan Pengujian (Automated Tests)

Jalankan seluruh suite test otomatis (Unit & Feature tests):

```bash
php artisan test
```

Untuk menjalankan file test tertentu:
```bash
# Uji fitur keamanan dan audit
php artisan test --filter=SecurityAndAuditingTest

# Uji konkurensi dan kasus tepi
php artisan test --filter=ConcurrencyAndEdgeCasesTest

# Uji alur order dan kuota inti
php artisan test --filter=CoreOrderLogicTest

# Uji panel admin dan garansi
php artisan test --filter=AdminAccessAndOrdersTest
```

---

## 4. Struktur Folder Penting

```
StreamPoint/
├── app/
│   ├── Actions/Order/       # Logika bisnis order (CreateOrder, ConfirmPayment, ApproveOrder, RejectOrder, dll)
│   ├── Enums/               # OrderStatus, OrderType, AccountStatus, RentDuration, PaymentMethodType
│   ├── Http/
│   │   ├── Controllers/     # StorefrontController, ProductController, InvoiceController, TrackingController
│   │   │   └── Admin/       # AdminDashboardController, AdminOrderController, AdminProductController, dll
│   │   └── Middleware/      # EnsureAdmin, SecurityHeaders, HandleInertiaRequests
│   ├── Models/              # Product, ProductVariant, ProductAccount, Order, Setting, PaymentMethod
│   ├── Services/            # QuotaService, InvoiceCodeGenerator, UniqueAmountGenerator
│   └── Services/Notification/ # TelegramChannel, AdminNotifier
├── database/
│   ├── migrations/          # Skema database dan indeks performa
│   └── seeders/             # AdminSeeder, SettingSeeder, DemoSeeder
├── docs/                    # Dokumentasi spesifikasi (PRD.md, TECH_SPEC.md, DESIGN_SYSTEM.md)
├── resources/
│   ├── css/app.css          # Token desain variabel CSS tema Terang / Gelap
│   └── js/
│       ├── components/ui/   # Komponen UI primitif (Button, Input, Badge, Card, Tabs)
│       ├── components/shop/ # Komponen e-commerce (QuotaBar, ProductCard, CredentialBox, dll)
│       ├── layouts/         # PublicLayout, AdminLayout
│       └── pages/           # Halaman Inertia (storefront, product, invoice, tracking, admin)
└── tests/                   # Automated feature & unit test suite
```

---

## 5. Panduan Deployment Produksi

Silakan merujuk ke dokumen [DEPLOY.md](DEPLOY.md) untuk panduan konfigurasi server produksi, cron scheduler, supervisor worker, proteksi Nginx, dan backup database.
