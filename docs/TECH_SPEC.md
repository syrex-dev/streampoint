# Technical Specification (TECH_SPEC)

**Versi:** 2.0
**Acuan:** `PRD.md` (aturan bisnis) dan `DESIGN_SYSTEM.md` (tampilan). Jika ada konflik, PRD menang untuk perilaku, DESIGN_SYSTEM menang untuk tampilan.

---

## 1. Tech Stack

| Lapisan | Pilihan | Catatan |
| :-- | :-- | :-- |
| Backend | **Laravel** (versi stabil terbaru), PHP 8.3+ | Cek versi terbaru lewat `composer`, jangan mengandalkan versi dari ingatan. |
| Frontend | **React + TypeScript** via **Inertia.js** | Tanpa API terpisah. Controller mengembalikan `Inertia::render()`. |
| Scaffolding | Starter kit React resmi Laravel (Inertia) | Tanpa WorkOS. Pertahankan auth bawaan hanya untuk admin, matikan registrasi publik. |
| Build | Vite | Bawaan Laravel. |
| Styling | **Tailwind CSS** | Token mengikuti `DESIGN_SYSTEM.md`. Komponen bawaan starter kit (shadcn/ui) boleh dipakai sebagai primitif, tetapi **wajib di-restyle** sesuai design system. |
| Icons | `lucide-react` | |
| Database | **MySQL 8 / MariaDB** (dev dan produksi) | Pakai MySQL juga di dev agar perilaku locking sama dengan produksi. SQLite hanya untuk test cepat yang tidak menguji concurrency. |
| Queue | Driver `database` | Tanpa Redis. Lihat Bagian 8.4 jika hosting tidak punya worker. |
| Scheduler | Laravel Scheduler + cron | Untuk expire order dan pelepasan unit sewa. |
| Notifikasi | Telegram Bot API via `Http` facade + driver WhatsApp opsional | Gratis, tanpa SDK tambahan. |
| Testing | Pest (atau PHPUnit) | Feature test wajib untuk kuota (Bagian 12). |
| Zona waktu | `APP_TIMEZONE=Asia/Jakarta` | Semua waktu aplikasi dan `quota_date` dalam WIB. |

---

## 2. Arsitektur & Struktur Folder

Prinsip: controller tipis, logika bisnis di `Actions`/`Services`, aturan status di Enum. Tidak ada logika kuota di controller atau di frontend.

```
app/
├── Enums/
│   ├── OrderType.php            # RENT, BUY
│   ├── OrderStatus.php          # + canTransitionTo(), countsTowardQuota()
│   ├── RentDuration.php         # HALF_DAY, ONE_DAY, TWO_DAYS, THREE_DAYS (+ hours())
│   ├── AccountStatus.php        # AVAILABLE, RESERVED, SOLD, RENTED, DISABLED
│   └── PaymentMethodType.php    # QRIS, BANK, EWALLET
├── Models/                      # Product, ProductVariant, ProductAccount, Order,
│                                # OrderEvent, PaymentMethod, Setting, DailyQuotaOverride, User
├── Actions/
│   ├── Order/
│   │   ├── CreateOrder.php
│   │   ├── ConfirmPayment.php
│   │   ├── ApproveOrder.php
│   │   ├── RejectOrder.php
│   │   ├── ExpireOrders.php
│   │   └── ReactivateOrder.php
│   └── Account/ImportAccounts.php
├── Services/
│   ├── QuotaService.php         # hitung & validasi kuota
│   ├── InvoiceCodeGenerator.php
│   ├── UniqueAmountGenerator.php
│   └── Notification/
│       ├── NotificationChannel.php   # interface
│       ├── TelegramChannel.php
│       ├── FonnteChannel.php         # opsional
│       └── AdminNotifier.php         # memilih channel dari config
├── Jobs/SendAdminNotification.php
├── Http/
│   ├── Controllers/
│   │   ├── StorefrontController.php
│   │   ├── ProductController.php
│   │   ├── CheckoutController.php
│   │   ├── InvoiceController.php
│   │   ├── TrackingController.php        # Cek Transaksi
│   │   ├── QuotaController.php           # endpoint ringan untuk polling
│   │   └── Admin/ (Dashboard, Order, Product, Variant, Account, PaymentMethod, Setting)
│   ├── Requests/                # FormRequest per aksi
│   └── Middleware/EnsureAdmin.php
└── Console/Commands/ExpireOrdersCommand.php

resources/js/
├── pages/
│   ├── storefront/Index.tsx
│   ├── product/Show.tsx
│   ├── invoice/Show.tsx
│   ├── tracking/Index.tsx
│   └── admin/ (Dashboard, Orders/Index, Orders/Show, Products/*, Accounts/*, PaymentMethods/*, Settings)
├── components/
│   ├── ui/                      # Button, Input, Badge, Card, Tabs, Modal (restyled)
│   └── shop/                    # QuotaBar, ProductCard, PackageSelector, CheckoutSteps,
│                                # StickyCheckoutBar, CountdownTimer, CopyButton,
│                                # StatusBadge, CredentialBox, PaymentInstruction
├── layouts/ (PublicLayout, AdminLayout)
├── lib/ (format.ts untuk Rupiah/tanggal, phone.ts)
└── types/ (model dan props Inertia)
```

---

## 3. Rute

### Publik

| Method | URI | Controller | Catatan |
| :-- | :-- | :-- | :-- |
| GET | `/` | `StorefrontController@index` | Props: `products`, `quota`. |
| GET | `/p/{product:slug}` | `ProductController@show` | Props: `product`, `variants`, `quota`, `paymentMethods`. |
| GET | `/quota` | `QuotaController@show` | JSON ringan untuk polling. Boleh juga lewat Inertia partial reload (`only: ['quota']`). |
| POST | `/checkout` | `CheckoutController@store` | Throttle: 5/menit per IP. |
| GET | `/invoice/{invoiceCode}` | `InvoiceController@show` | Kredensial hanya jika sesi memiliki invoice atau sudah terverifikasi (Bagian 9). |
| POST | `/invoice/{invoiceCode}/confirm` | `InvoiceController@confirm` | "Saya Sudah Bayar" + upload bukti opsional. |
| POST | `/invoice/{invoiceCode}/verify` | `InvoiceController@verify` | Verifikasi nomor WA untuk membuka kredensial. Throttle ketat. |
| POST | `/invoice/{invoiceCode}/cancel` | `InvoiceController@cancel` | Pembeli membatalkan pesanan `PENDING` miliknya (sesi atau terverifikasi). Throttle 5/menit. |
| GET/POST | `/cek-pesanan` | `TrackingController` | Throttle: 10/menit per IP. |

### Admin (middleware `auth` + `EnsureAdmin`, prefix `/admin`)

`GET /admin` (dashboard), `orders` (index, show), `POST orders/{order}/approve`, `POST orders/{order}/reject`, `POST orders/{order}/reactivate`, `GET orders/{order}/proof` (stream bukti bayar privat), resource `products`, `products/{product}/variants`, `accounts` (index, store, import, update status), resource `payment-methods`, `settings` (update kuota default, override tanggal, tes notifikasi).

---

## 4. Skema Database

Gunakan migration Laravel. Semua uang dalam **integer Rupiah**. Kolom enum disimpan sebagai `string` dan di-cast ke PHP backed enum.

### `products`

| Kolom | Tipe | Catatan |
| :-- | :-- | :-- |
| id | bigint PK | |
| slug | string unique | `netflix-premium` |
| name | string | |
| category | string default `Streaming` | |
| thumbnail_path | string | Logo/gambar layanan |
| description | text | |
| rules | text | Aturan sewa/garansi (bisa diedit admin) |
| is_active | boolean default true | |
| sort_order | unsigned int default 0 | |
| brand_color | string(7) nullable | Hex `#RRGGBB` untuk tint kotak logo. Divalidasi regex. |
| cover_path | string nullable | Gambar sampul kartu (jpg/png/webp, bukan SVG), diperkecil ke ≤ 800px lebar dan disimpan WebP. |
| has_warranty | boolean default false | Menampilkan chip `Garansi` di kartu. |
| timestamps | | |

### `product_variants`

| Kolom | Tipe | Catatan |
| :-- | :-- | :-- |
| id | bigint PK | |
| product_id | FK cascade | |
| name | string | `Sewa 1 Hari (24 Jam)`, `Beli 1 Bulan Private` |
| type | string | `RENT` atau `BUY` |
| rent_duration | string nullable | Wajib jika `RENT` |
| duration_hours | unsigned int | 12, 24, 48, 72, atau 720 |
| price | unsigned int | Rupiah |
| is_active | boolean default true | |
| sort_order | unsigned int | |

> Stok **tidak** disimpan sebagai angka di varian. Stok = jumlah `product_accounts` berstatus `AVAILABLE` untuk produk dan kategori tersebut (lihat tabel berikut).

### `product_accounts` (unit akun)

| Kolom | Tipe | Catatan |
| :-- | :-- | :-- |
| id | bigint PK | |
| product_id | FK cascade | |
| kind | string | `RENT` atau `BUY` (unit dikhususkan) |
| credential | text | **Terenkripsi** (cast `encrypted`). Format: `Email | Password | Profil | PIN` |
| status | string | `AVAILABLE`, `RESERVED`, `SOLD`, `RENTED`, `DISABLED` |
| order_id | FK nullable | Order yang memegang unit ini |
| rented_until | datetime nullable | Untuk `RENTED` |
| note | string nullable | Catatan internal admin |
| timestamps | | |

Index: `(product_id, kind, status)`, `order_id`.

### `orders`

| Kolom | Tipe | Catatan |
| :-- | :-- | :-- |
| id | bigint PK | |
| invoice_code | string unique | `INV-YYYYMMDD-XXXXXX` (acak) |
| product_id, variant_id | FK | |
| account_id | FK nullable → product_accounts | Unit yang di-reserve/assign |
| order_type | string | `RENT`/`BUY` (salin dari varian saat order) |
| customer_phone | string | Ternormalisasi `628...` |
| customer_note | string nullable | |
| payment_method_id | FK nullable | |
| payment_method_label | string | Snapshot nama metode saat order |
| base_price | unsigned int | Snapshot harga varian |
| unique_code | unsigned smallint default 0 | 100–999 (selalu 3 digit) |
| total_amount | unsigned int | `base_price + unique_code` |
| payment_proof_path | string nullable | Disk **privat** |
| status | string default `PENDING` | |
| status_note | string nullable | Alasan reject/cancel |
| access_starts_at / access_expires_at | datetime nullable | Diisi saat `PAID` |
| payment_expires_at | datetime | `now()+15 menit` |
| quota_date | date | Tanggal WIB saat order dibuat |
| paid_at | datetime nullable | |
| timestamps | | |

Index: `(quota_date, order_type, status)`, `(status, payment_expires_at)`, `customer_phone`, `total_amount`.

### `order_events` (audit)

`id, order_id FK, from_status nullable, to_status, actor` (`system` | `buyer` | `admin:{id}`), `note nullable, created_at`.

### `payment_methods`

`id, type (QRIS|BANK|EWALLET), label` (mis. "BCA", "DANA", "QRIS"), `account_number nullable, account_holder nullable, qris_image_path nullable, logo_path nullable (logo opsional, jpg/png/webp, bukan SVG, ≤ 256px), instructions text nullable, is_active, sort_order`.

### `settings` (satu baris)

`id, max_daily_rent_quota unsigned tinyint default 3, admin_whatsapp string nullable` (nomor kontak yang ditampilkan di invoice, footer, dan tombol bantuan), `business_hours string nullable` (mis. "Setiap hari, 09.00-21.00 WIB", tampil di footer). Keduanya dibagikan ke semua halaman publik lewat shared props Inertia (`HandleInertiaRequests`). Tambahan identitas toko: `store_name string nullable` (default dari `APP_NAME`), `store_logo_path string nullable` (jpg/png/webp maks 1 MB, **bukan SVG**), `accent_preset string default 'emerald'` (daftar putih: `emerald`, `teal`, `blue`, `mono`). `accent_preset` diterapkan sebagai atribut `data-accent` pada `<html>` di `app.blade.php` (server-side, tanpa kedipan).

Kolom tambahan `settings` untuk katalog: `announcement_text string(160) nullable, announcement_url string(255) nullable` (path internal `/…` atau `https://`), `announcement_active boolean default false, store_tagline string(60) nullable, delivery_eta string(60) nullable` (teks bebas, mis. "setelah verifikasi admin"; tampil di halaman layanan dan langkah 5 "Cara Pesan"), `min_sold_display unsigned smallint default 5` (ambang tampil `N terjual`), `custom_request_enabled boolean default false, social_links json nullable` dengan kunci `telegram`, `instagram`, `threads`, `tiktok`. Setiap URL sosial wajib `https://` dan host-nya masuk daftar putih per platform (`t.me`/`telegram.me`; `instagram.com`; `threads.net`/`threads.com`; `tiktok.com`), selain itu ditolak.

**Data katalog publik (`StorefrontController`):** per layanan kirim `cover_url`, `logo_url`, `brand_color` (hanya jika lolos regex), `has_warranty`, `is_new` (dibuat ≤ 14 hari), `min_price`, status stok, dan `sold_count` yang dihitung dengan `withCount(['orders as sold_count' => fn ($q) => $q->where('status', OrderStatus::PAID)])` (tanpa N+1). `sold_count` **hanya dikirim jika ≥ `min_sold_display`**, selain itu `null`. Penanda `Terlaris` dihitung di server: tiga layanan teratas yang memenuhi ambang. Tidak ada kolom sensitif yang ikut terkirim.

**Data hero dan statistik (Fase 7):** kolom `settings.stats_min_orders unsigned smallint default 20` (0 = sembunyikan statistik). `StorefrontController` mengirim: `available_services_count` (layanan yang punya paket bisa dipesan), `verification_median_minutes` (median selisih waktu event `VERIFYING` ke `PAID` dari `order_events` dalam 30 hari terakhir, **hanya jika ≥ 10 sampel**, dibulatkan ke atas ke kelipatan 5, selain itu `null`; di-cache 10 menit lewat `Cache::remember`), dan `stats` = `{ completed_orders, active_services }` di mana `completed_orders` dikirim hanya jika ≥ `stats_min_orders` dan `active_services` hanya jika ≥ 3, selain itu `null`. Semua angka dihitung dari data nyata (tanpa N+1, tanpa kolom sensitif). Harga per hari untuk paket sewa dihitung di server atau klien dari `price ÷ (duration_hours ÷ 24)` dan ditampilkan sebagai bilangan bulat rupiah; badge "Paling hemat per hari" ditentukan dari nilai terendah di antara paket sewa aktif (≥ 2 paket).

> **Tema:** mode Terang/Gelap/Sistem diimplementasikan lewat CSS variables (`DESIGN_SYSTEM.md` Bagian 2) dengan class `dark` pada `<html>`. Skrip inline di `app.blade.php` menetapkan class sebelum render agar tidak berkedip.

### `banners`

`id, title string(80), subtitle string(160) nullable, cta_label string(30) nullable, cta_url string(255) nullable` (hanya path internal berawalan `/` atau `https://`; tolak skema lain), `image_path string nullable` (jpg/png/webp maks 2 MB di disk public, nama acak, bukan SVG), `tone string default 'neutral'` (`neutral|accent|warning`), `is_active boolean default true, sort_order unsigned int default 0, starts_at datetime nullable, ends_at datetime nullable, timestamps`. Maksimal 5 banner aktif (validasi saat simpan). Ke publik hanya dikirim banner aktif yang sedang dalam jadwal, dengan kolom minimal.

### `daily_quota_overrides`

`id, date unique, max_quota unsigned tinyint, note nullable`. Jika ada baris untuk tanggal tertentu, nilainya menggantikan default. Nilai 0 berarti sewa ditutup hari itu.

### `users`

Bawaan Laravel + kolom `is_admin boolean default false`. Admin dibuat lewat seeder atau `artisan` command, **bukan** registrasi publik.

---

## 5. Logika Kuota & Pembuatan Order (Bagian Paling Kritis)

### 5.1 Definisi hitungan kuota

```php
// Order model
public function scopeCountsTowardQuota($q)
{
    return $q->where(function ($q) {
        $q->whereIn('status', [OrderStatus::VERIFYING, OrderStatus::PAID])
          ->orWhere(fn ($q) => $q->where('status', OrderStatus::PENDING)
                                 ->where('payment_expires_at', '>', now()));
    });
}
```

Klausa `payment_expires_at > now()` pada `PENDING` membuat hitungan **benar walau scheduler belum sempat menandai `EXPIRED`**. Jangan hanya mengandalkan cron.

### 5.2 QuotaService

```php
class QuotaService
{
    public function today(): string { return now()->toDateString(); } // APP_TIMEZONE = Asia/Jakarta

    public function limitFor(string $date): int
    {
        return DailyQuotaOverride::where('date', $date)->value('max_quota')
            ?? Setting::current()->max_daily_rent_quota;
    }

    public function used(string $date): int
    {
        return Order::where('quota_date', $date)
            ->where('order_type', OrderType::RENT)
            ->countsTowardQuota()
            ->count();
    }

    /** Untuk ditampilkan ke publik */
    public function snapshot(): array
    {
        $d = $this->today();
        $limit = $this->limitFor($d);
        $used = $this->used($d);
        return [
            'limit' => $limit,
            'used' => $used,
            'remaining' => max(0, $limit - $used),
            'is_full' => $used >= $limit,
            'resets_at' => now()->addDay()->startOfDay()->toIso8601String(),
        ];
    }
}
```

### 5.3 CreateOrder (atomik)

Kunci baris `settings` agar semua checkout `RENT` berjalan **berurutan** (cukup untuk skala ini dan sederhana):

```php
public function handle(CreateOrderData $data): Order
{
    return DB::transaction(function () use ($data) {
        $variant = ProductVariant::with('product')->where('is_active', true)->findOrFail($data->variantId);
        abort_unless($variant->product->is_active, 404);

        // Serialisasi: semua pembuatan order lewat sini mengunci satu baris
        Setting::lockForUpdate()->firstOrFail();

        $date = now()->toDateString();

        if ($variant->type === OrderType::RENT) {
            if ($this->quota->used($date) >= $this->quota->limitFor($date)) {
                throw new QuotaFullException();   // -> 422 dengan pesan kuota penuh
            }
        }

        // Reservasi unit akun (kind sesuai tipe varian)
        $account = ProductAccount::where('product_id', $variant->product_id)
            ->where('kind', $variant->type->value)
            ->where('status', AccountStatus::AVAILABLE)
            ->lockForUpdate()
            ->first();
        if (! $account) throw new OutOfStockException();

        $unique = $this->uniqueAmount->generate($variant->price); // total unik di antara order aktif

        $order = Order::create([
            'invoice_code' => $this->invoice->generate(),
            'product_id' => $variant->product_id,
            'variant_id' => $variant->id,
            'account_id' => $account->id,
            'order_type' => $variant->type,
            'customer_phone' => Phone::normalize($data->phone),
            'customer_note' => $data->note,
            'payment_method_id' => $data->paymentMethodId,
            'payment_method_label' => /* snapshot */,
            'base_price' => $variant->price,
            'unique_code' => $unique,
            'total_amount' => $variant->price + $unique,
            'status' => OrderStatus::PENDING,
            'payment_expires_at' => now()->addMinutes(15),
            'quota_date' => $date,
        ]);

        $account->update(['status' => AccountStatus::RESERVED, 'order_id' => $order->id]);
        $order->events()->create([...]);

        SendAdminNotification::dispatch('order.created', $order->id)->afterCommit();
        return $order;
    });
}
```

Aturan:

- Harga **selalu diambil dari database**, tidak pernah dari request.
- Kuota dan stok **diperiksa ulang di server** walau UI sudah menonaktifkan tombol.
- `QuotaFullException` dan `OutOfStockException` diterjemahkan ke error validasi yang ditampilkan inline oleh Inertia.
- Order `BUY` melewati pengecekan kuota tetapi tetap melewati lock dan reservasi stok.
- **Satu pesanan aktif per pembeli (PRD 4.4b).** Kunci baris `settings` berlaku untuk **semua** pembuatan order (RENT dan BUY), supaya pengecekan ini ikut berurutan. Di dalam transaksi, sebelum kuota dan stok diperiksa:

  ```php
  $phone = Phone::normalize($data->phone);

  $active = Order::query()
      ->where('customer_phone', $phone)
      ->countsAsActiveForBuyer()   // PENDING (payment_expires_at > now()) atau VERIFYING
      ->first();

  $sessionActive = Order::whereIn('invoice_code', session('owned_invoices', []))
      ->countsAsActiveForBuyer()
      ->first();

  if ($active || $sessionActive) {
      throw new ActiveOrderExistsException(
          invoiceCode: ($sessionActive ?? $active)->invoice_code,
          ownedBySession: (bool) $sessionActive,   // kode invoice hanya ditampilkan jika true
      );
  }
  ```

  Scope `countsAsActiveForBuyer` memakai kondisi yang sama dengan `countsTowardQuota` (PENDING belum expired + VERIFYING) tetapi **tidak** dibatasi `order_type` atau `quota_date`. Pengecekan `idempotency_key` dilakukan **sebelum** ini agar pengiriman ulang request yang sama mengembalikan invoice yang sama. `ActiveOrderExistsException` diterjemahkan ke error validasi (HTTP 422) dengan pesan umum tanpa kode invoice bila `ownedBySession` false. Tambahkan index `customer_phone, status, payment_expires_at`.

### 5.4 Kode unik

`UniqueAmountGenerator`: pilih angka acak 100–999 (selalu 3 digit) sehingga `base_price + angka` belum dipakai oleh order aktif lain (`PENDING` belum expired / `VERIFYING`). Coba ulang beberapa kali, lalu lempar error jika semua terpakai (praktis tidak terjadi).

### 5.5 Kode invoice

`INV-` + `Ymd` + `-` + 6 karakter acak dari alfabet tanpa karakter membingungkan (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`). Ulangi jika bentrok dengan `unique` index.

### 5.6 Normalisasi nomor WA

`Phone::normalize()`: hapus spasi, `-`, `+`. `08xx` → `628xx`. `62xx` dibiarkan. Tolak jika bukan angka atau panjangnya di luar 10–13 digit setelah `62`. Sediakan padanan di `resources/js/lib/phone.ts` untuk validasi sisi klien (server tetap sumber kebenaran).

---

## 6. Mesin Status Order

`OrderStatus::canTransitionTo(self $to): bool` memakai tabel transisi di `PRD.md` Bagian 4.5. **Setiap Action wajib memanggilnya** dan menolak transisi tidak sah.

| Action | Efek |
| :-- | :-- |
| `ConfirmPayment` | `PENDING → VERIFYING` (hanya jika belum expired). Simpan bukti bayar bila ada. Kirim notifikasi `payment.confirmed`. |
| `ApproveOrder` | `VERIFYING → PAID`. Set `access_starts_at = now()`, `access_expires_at = now() + duration_hours`. Unit `BUY` → `SOLD`, unit `RENT` → `RENTED` + `rented_until`. Admin boleh mengganti `account_id` sebelum approve. |
| `RejectOrder` | `VERIFYING/PENDING → CANCELLED`. Wajib `status_note`. Lepas unit (`AVAILABLE`, `order_id = null`). |
| `ExpireOrders` | Semua `PENDING` dengan `payment_expires_at <= now()` → `EXPIRED`, lepas unit. Idempoten dan aman dijalankan berulang. |
| `ReactivateOrder` | `EXPIRED → PENDING` (atau `VERIFYING` jika bukti sudah ada) hanya jika kuota (untuk `RENT`) dan unit masih tersedia. Reset `payment_expires_at`. |
| `CancelOrderByBuyer` | `PENDING → CANCELLED` oleh pemilik invoice. Menolak status selain `PENDING` dan order yang sudah lewat waktu. Lepas kuota dan unit akun, tulis `order_events` dengan aktor `buyer`. Dibungkus transaksi + `lockForUpdate` pada order. |

Semua transisi berjalan dalam `DB::transaction` dan menulis `order_events`.

**Scheduler** (`routes/console.php` atau `Kernel`):

```php
Schedule::command('orders:expire')->everyMinute();
Schedule::command('accounts:release-rented')->everyFiveMinutes(); // RENTED yang rented_until lewat → AVAILABLE
Schedule::command('orders:remind-verifying')->everyFiveMinutes(); // VERIFYING > 30 menit → notifikasi pengingat (sekali per order)
```

---

## 7. Props Inertia & Polling

- `StorefrontController` dan `ProductController` mengirim `quota` dari `QuotaService::snapshot()`.
- Di frontend, `QuotaBar` memanggil `router.reload({ only: ['quota'] })` setiap 30 detik (`setInterval`, dibersihkan saat unmount, dihentikan saat tab tidak aktif memakai `document.visibilityState`).
- Halaman invoice berstatus `PENDING`/`VERIFYING` melakukan polling serupa pada props `order.status` setiap 10 detik. Berhenti saat `PAID`, `EXPIRED`, atau `CANCELLED`.
- `CountdownTimer` dihitung dari `payment_expires_at` yang dikirim server (ISO 8601) dan dikoreksi dengan `server_now` agar tidak tergantung jam perangkat pembeli.
- Props yang dikirim ke publik **tidak boleh** memuat kredensial, `account_id`, atau data order milik orang lain. Gunakan API Resource atau array eksplisit, bukan `->toArray()` model mentah.

---

## 8. Notifikasi

### 8.1 Antarmuka

```php
interface NotificationChannel
{
    public function send(string $message, array $options = []): void;
}
```

`AdminNotifier` membaca `config('notify.channels')` (daftar, mis. `['telegram']`) dan mengirim lewat semua channel aktif. Setiap channel yang gagal tidak mengganggu channel lain.

### 8.2 Telegram (utama)

Endpoint: `POST https://api.telegram.org/bot{TOKEN}/sendMessage` dengan `chat_id`, `text`, `parse_mode=HTML`, `disable_web_page_preview=true`. Boleh menambahkan `reply_markup` berisi tombol inline bertipe URL ke halaman admin order.

```php
Http::timeout(8)->retry(2, 500)->post("https://api.telegram.org/bot{$token}/sendMessage", [
    'chat_id' => $chatId,
    'text' => $message,
    'parse_mode' => 'HTML',
    'disable_web_page_preview' => true,
]);
```

- **Escape semua input pengguna** (nomor, catatan) sebelum disisipkan ke pesan HTML (`e()` / `htmlspecialchars`).
- Setup: buat bot lewat @BotFather, simpan token. Kirim satu pesan ke bot, ambil `chat_id` dari `getUpdates` (atau pakai bot penunjuk ID). Tombol **Tes Notifikasi** di halaman Pengaturan memverifikasinya.

### 8.3 WhatsApp (opsional)

`FonnteChannel` memakai `Http::withHeaders(['Authorization' => token])->asForm()->post('https://api.fonnte.com/send', ['target' => ..., 'message' => ...])`. Pastikan format request sesuai **dokumentasi resmi terbaru** gateway yang dipilih sebelum implementasi, dan perhatikan batas paket gratisnya. WAHA (self-hosted) dapat ditambahkan sebagai channel lain dengan antarmuka yang sama.

### 8.4 Pengiriman tanpa mengganggu request

- `SendAdminNotification` mengimplementasikan `ShouldQueue` (`tries = 3`, `backoff = [10, 60]`) dan dipanggil `->afterCommit()`.
- Jika hosting **tidak mendukung worker permanen**, gunakan `dispatch(...)->afterResponse()` dengan `QUEUE_CONNECTION=sync` agar pesan tetap terkirim setelah respons dikembalikan ke pembeli.
- Kegagalan akhir dicatat ke log (`Log::warning`), tidak dilempar ke pembeli.

### 8.5 Contoh pesan

```
🛒 <b>Order Baru</b>
Invoice: <code>INV-20261101-K7P2QX</code>
Layanan: Netflix Premium UHD
Paket: Sewa 1 Hari (24 Jam)
Total: Rp 15.123
WA: 6281234567890
Sisa slot sewa hari ini: 1/3
```

(Emoji hanya di pesan Telegram internal admin. Antarmuka web tidak memakai emoji, lihat `DESIGN_SYSTEM.md`.)

---

## 9. Keamanan

1. **Kredensial terenkripsi:** cast `encrypted` pada `product_accounts.credential`. Jaga `APP_KEY`, dan catat bahwa kehilangan key membuat data tak terbaca.
2. **Akses invoice:**
   - Saat checkout sukses, simpan `invoice_code` ke session (`owned_invoices`). Invoice menampilkan kredensial jika kode ada di session.
   - Selain itu, `POST /invoice/{code}/verify` memeriksa nomor WA cocok (perbandingan dengan nomor ternormalisasi), lalu menyimpan ke session. Throttle: 5 percobaan/menit per IP+invoice.
   - Tanpa itu, invoice hanya menampilkan ringkasan tanpa kredensial.
3. **Pencarian by nomor WA** hanya mengembalikan: kode invoice, nama layanan, status, tanggal. Tidak ada kredensial atau total yang bisa dipakai menebak.
4. **Upload bukti bayar:** validasi `image|mimes:jpg,jpeg,png,webp|max:3072`. Simpan di disk **privat** (`storage/app/private`) dengan nama acak. Jangan dipublikasikan lewat `storage:link`. Sajikan lewat rute admin saja (`GET /admin/orders/{order}/proof`).
5. **Rate limiting:** checkout, verifikasi, dan pencarian (Bagian 3). Login admin memakai throttle bawaan.
6. **Validasi server untuk semuanya:** harga, kuota, stok, kepemilikan metode pembayaran aktif. Jangan percaya data dari klien.
7. **Admin:** middleware `EnsureAdmin`, registrasi publik dimatikan, password kuat, session `httpOnly` dan `secure` di produksi. Semua aksi admin tercatat di `order_events`.
8. **Idempotensi checkout:** kirim `idempotency_key` (UUID dibuat di klien saat halaman dibuka). Server menolak/mengembalikan order yang sama bila key sudah dipakai.
9. **Header & dasar lain:** HTTPS wajib di produksi, `APP_DEBUG=false`, jangan log kredensial atau token ke file log.
10. **Honeypot field** sederhana pada form checkout untuk menyaring bot.

---

## 10. Konfigurasi Lingkungan (`.env`)

```env
APP_NAME="NamaToko"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://domainanda.com
APP_TIMEZONE=Asia/Jakarta
APP_LOCALE=id

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=

QUEUE_CONNECTION=database   # atau sync + afterResponse jika tanpa worker
SESSION_DRIVER=database

NOTIFY_CHANNELS=telegram    # contoh: telegram,fonnte
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
FONNTE_TOKEN=
FONNTE_TARGET=

ORDER_PAYMENT_TTL_MINUTES=15
```

Simpan konfigurasi notifikasi di `config/notify.php` yang membaca `env()`. Jangan memanggil `env()` langsung di luar file config.

---

## 11. Seeder

- `AdminSeeder`: satu admin dari variabel `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
- `SettingSeeder`: baris `settings` dengan kuota 3.
- `DemoSeeder` (hanya `local`): 3 layanan (Netflix, YouTube Premium, Spotify), tiap layanan 4 varian sewa (12/24/48/72 jam) dan 2 varian beli, beberapa unit akun dummy per kategori, 2 metode pembayaran. **Jangan** memakai kredensial asli di seeder.

---

## 12. Pengujian Wajib (Feature Test)

1. 3 order `RENT` aktif pada hari yang sama → order ke-4 ditolak. Order `BUY` tetap sukses.
2. Order `PENDING` melewati `payment_expires_at` (tanpa menjalankan scheduler) tidak dihitung dalam kuota.
3. Setelah `orders:expire` berjalan, order menjadi `EXPIRED` dan unit akun kembali `AVAILABLE`.
4. `quota_date` memakai WIB: gunakan `Carbon::setTestNow()` pada 23:59 dan 00:01 WIB dan pastikan hitungan terpisah.
5. Override tanggal (misalnya 5, atau 0) dihormati oleh `QuotaService`.
6. Dua pembuatan order untuk slot/unit terakhir: hanya satu berhasil (uji dengan dua koneksi atau simulasi dengan transaksi berurutan).
7. Transisi status tidak sah ditolak (mis. `EXPIRED → PAID`).
8. Approve mengisi `access_starts_at`/`access_expires_at` sesuai `duration_hours` dan mengubah status unit.
9. Reject melepas kuota dan unit.
10. Kredensial **tidak** muncul pada: pencarian by nomor WA, invoice tanpa sesi/verifikasi, props order milik orang lain.
11. `total_amount` unik di antara order aktif.
12. Kegagalan Telegram (di-fake `Http::fake` 500) tidak membatalkan checkout.
13. Upload bukti bayar menolak file bukan gambar dan file > 3 MB. File tidak dapat diakses publik.
14. Satu pesanan aktif per pembeli: order kedua dengan nomor sama ditolak saat order pertama `PENDING` (layanan sama maupun berbeda) dan saat `VERIFYING`. Berhasil setelah order pertama `PAID`, `EXPIRED`, atau `CANCELLED`, termasuk `PENDING` yang sudah lewat waktu tanpa scheduler.
15. Nomor berformat berbeda (`0812…`, `+62812…`, `62812…`) dianggap sama. Sesi yang sama dengan nomor berbeda tetap ditolak. Sesi berbeda dengan nomor berbeda diizinkan (batasan terdokumentasi).
16. Pesan penolakan memuat kode invoice hanya untuk pemilik sesi. Untuk selain itu pesan umum tanpa kode.
17. `CancelOrderByBuyer`: hanya pemilik, hanya `PENDING`, melepas kuota dan unit, tercatat aktor `buyer`, terkena throttle. `VERIFYING` dan `PAID` tidak bisa dibatalkan pembeli.
18. `ReactivateOrder` ditolak bila nomor yang sama punya pesanan aktif lain.
19. Konkurensi: dua checkout serentak nomor sama (MySQL) menghasilkan tepat satu order. Idempotensi: request ulang dengan `idempotency_key` sama tidak kena penolakan pesanan aktif.

---

## 13. Checklist Deploy

- [ ] `composer install --no-dev -o`, `npm ci && npm run build`
- [ ] `php artisan key:generate`, `migrate --force`, `db:seed --class=AdminSeeder`
- [ ] `php artisan config:cache route:cache view:cache`
- [ ] Cron: `* * * * * cd /path && php artisan schedule:run >> /dev/null 2>&1`
- [ ] Queue worker (Supervisor) **atau** `QUEUE_CONNECTION=sync` dengan `afterResponse`
- [ ] Disk privat tidak terekspos web. Folder `storage` dan `bootstrap/cache` dapat ditulis
- [ ] HTTPS aktif, `APP_DEBUG=false`
- [ ] Backup database harian terjadwal
- [ ] Uji Telegram lewat tombol Tes Notifikasi
- [ ] Uji alur penuh di produksi: order → bayar → approve → kredensial tampil

---

## 14. Definition of Done (MVP)

Semua kriteria FR-01 sampai FR-15 di `PRD.md` terpenuhi, semua pengujian Bagian 12 lolos, tampilan mematuhi checklist akhir `DESIGN_SYSTEM.md`, dan checklist deploy Bagian 13 selesai.

---

## 15. Optimasi Gambar Unggahan

Karena server bisa berupa perangkat rumahan dengan upload terbatas, semua gambar unggahan admin dioptimalkan **di server saat diunggah**, tanpa paket tambahan (cukup ekstensi PHP GD):

| Jenis | Lebar maks | Format simpan | Batas unggah |
| :-- | :-- | :-- | :-- |
| Sampul layanan | 800px | WebP kualitas ~80 | 2 MB |
| Gambar banner | 1200px | WebP kualitas ~80 | 2 MB |
| Logo layanan, logo toko | 256px | WebP (PNG bila perlu transparansi) | 1 MB |
| Logo metode pembayaran | 160px | WebP/PNG | 512 KB |

Aturan: tolak SVG dan file yang bukan gambar (validasi `getimagesize`, bukan hanya ekstensi), buang metadata (EXIF), beri nama acak, jaga proporsi, jangan membesarkan gambar yang lebih kecil dari batas. Jika GD tidak tersedia, simpan file asli yang sudah lolos validasi dan catat peringatan di log. Sajikan lewat disk `public` dengan header cache panjang (nama file acak sehingga aman di-cache oleh Cloudflare).
