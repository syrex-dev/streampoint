# 📊 LAPORAN KESELURUHAN PROYEK STREAMPOINT
> **Status:** Siap Digunakan (Production-Ready / Local Active)  
> **Tanggal Audit & Setup:** 18 November 2026  
> **Lokasi Repositori:** `D:\Coding\StreamPoint`  
> **Domain Lokal:** [http://streampoint.test](http://streampoint.test)  

---

## 1. Ringkasan Eksekutif

**StreamPoint** adalah platform *e-commerce* khusus penjualan akun streaming dan produk digital premium (Netflix, Spotify, YouTube Premium, Canva, dsb.) dengan opsi **Sewa Harian** dan **Beli Penuh**. 

Platform dirancang dengan filosofi **Frictionless Shopping (Tanpa Login Pembeli)**:
- Pembeli cukup memilih paket, memasukkan nomor WhatsApp, memilih metode pembayaran, dan langsung mendapatkan instruksi serta invoice transaksi.
- Kredensial akun digital dilindungi dengan enkripsi level enterprise (AES-256) dan hanya dapat dibuka di halaman invoice setelah nomor WhatsApp diverifikasi secara penuh.
- Alur konfirmasi pembayaran otomatis/tanpa ribet unggah struk manual untuk mempercepat transaksi.

---

## 2. Tumpukan Teknologi (Tech Stack)

Aplikasi dibangun menggunakan teknologi modern:

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Backend Framework** | Laravel 13.39.0 | Framework PHP generasi terbaru |
| **Bahasa Pemrograman** | PHP 8.4.27 (VS17 x64) | Memanfaatkan fitur *Property Hooks* & *Asymmetric Visibility* |
| **Frontend Framework** | React 19.3.1 + Inertia.js 3.10 | Single Page Application tanpa REST API overhead |
| **Styling & Desain** | Tailwind CSS 4.3.3 | Desain responsif, token CSS murni, dukungan mode gelap |
| **Bundler & Compiler** | Vite 7.1.11 (Rolldown engine) | Kompilasi ultra-cepat dan pemisahan *chunk* aset optimal |
| **Basis Data** | MySQL 8.4 (Port 3306) | Engine InnoDB dengan row-level locking (`FOR UPDATE`) |
| **Autentikasi Admin** | Laravel Fortify | Khusus akses admin panel (pembeli publik tanpa registrasi/login) |
| **Keamanan Data** | AES-256 Encrypted Cast | Kredensial akun digital tersimpan terenkripsi di database |

---

## 3. Status Lingkungan Lokal & Device Setup (18 November 2026)

Proyek ini telah dikonfigurasi secara lengkap di lingkungan **Laravel Herd** dan **Laragon**:

```
[Internet / Browser]
        │
        ▼
[http://streampoint.test] ── (Port 80 via Laravel Herd Nginx / Laragon Apache)
        │
        ├─► [PHP 8.4.27 FastCGI]
        │         │
        │         ├─► [Laravel 13 Application @ D:\Coding\StreamPoint]
        │         │         │
        │         │         ├─► [MySQL 8.4 Database @ 127.0.0.1:3306] (Database: streampoint)
        │         │         └─► [Built Assets @ public/build] (Vite + React 19)
        │         │
        │         └─► [Storage Symlink @ public/storage]
        │
        └─► [Directory Junction: C:\laragon\www\streampoint -> D:\Coding\StreamPoint]
```

### Rincian Konfigurasi:
1. **PHP 8.4:**
   - Folder: `C:\laragon\bin\php\php-8.4.27-Win32-vs17-x64`
   - Ekstensi aktif: `pdo_mysql`, `curl`, `mbstring`, `openssl`, `fileinfo`, `zip`, `intl`, `gd`, `bcmath`, `pdo_sqlite`, `sqlite3`.
2. **Git Repository:**
   - Remote URL: `https://github.com/syrex-dev/streampoint.git`
   - Branch: `main` (clean, sinkron dengan remote).
3. **Database MySQL:**
   - Host: `127.0.0.1:3306`
   - Nama Database: `streampoint`
   - User: `root` (Password: kosong)
   - Status: **23 Migrasi Selesai**, Seeder default (`AdminSeeder`, `SettingSeeder`, `DemoSeeder`) berhasil di-load.
4. **Environment Variables (User PATH Windows):**
   - `C:\laragon\bin\php\php-8.4.27-Win32-vs17-x64`
   - `C:\laragon\bin\composer`
   - `C:\laragon\bin\nodejs\node-v22`
   - `C:\Program Files\Git\cmd`
5. **Kredensial Akses Admin:**
   - URL: `http://streampoint.test/admin` atau `http://streampoint.test/login`
   - Email: `admin@streampoint.test`
   - Password: `password`

---

## 4. Log Pembaruan & Fitur Terbaru (Changelog November 2026)

Berikut rangkuman fitur dan perbaikan yang telah diterapkan hingga update terkini:

```
[Linimasa Update Terkini]
Nov 08-09  ──► Redesain Toko & Admin, Bottom Nav Mobile, Integrasi Bot Telegram
Nov 10     ──► Trust Proxies HTTPS, Orvaki Checkout Modal, Sistem Review Pembeli
Nov 10-11  ──► Hapus Upload Bukti Transfer (Konfirmasi Instan), Seleksi Varian Akun
Nov 17     ──► Self-healing Skema DB, Rate Limit Checkout 30/min, Bottom Nav & Floating WA
Nov 18     ──► Setup Lengkap Device Windows (PHP 8.4, Herd Linking, MySQL 8.4, Build Assets)
```

### Rincian Changelog:
* **`327c8ac` - Floating WhatsApp Bubble:**  
  Menambahkan tombol WhatsApp mengambang di pojok layar dengan tombol *dismiss/close* agar tidak mengganggu pengalaman pengguna.
* **`5332670` & `b56f3fc` - Navigasi Mobile Terpadu (Bottom Bar):**  
  Mengadopsi *mobile bottom navigation bar* untuk kemudahan akses satu jempol (Beranda, Lacak Pesanan, Bantuan, Akun) dan merampingkan header.
* **`ffa1d5f` & `821bc6e` - Tampilan Mobile Ramping & Stepper Baru:**  
  Menyederhanakan footer pada layar ponsel dan mempercantik indikator langkah pesanan (*order stepper*) pada halaman invoice.
* **`32a530e` - Penyesuaian Rate Limit Checkout:**  
  Menaikkan batas *rate limit* pemesanan menjadi 30 per menit serta menangani respon HTTP 429 secara anggun pada Inertia.js tanpa memicu *white screen*.
* **`88c947b` & `50dce48` - Self-Healing Kolom Varian & Pencegahan Crash Admin:**  
  Mekanisme pemulihan mandiri skema database jika terdapat kolom yang belum ter-migrasi, proteksi terhadap `DecryptException`, dan *error boundary* pada saat admin membuat akun stok.
* **`ec3929d` - Dukungan Varian pada Kredensial Akun:**  
  Admin kini dapat menautkan stok kredensial akun ke varian produk tertentu (misal: 1 Bulan, 3 Bulan, dsb.) serta antarmuka aturan sewa yang lebih rapi.
* **`bec50bc` - Alur Konfirmasi Instan (Tanpa Upload Struk):**  
  Menghilangkan keharusan upload bukti transfer manual di halaman invoice. Pembeli cukup klik tombol konfirmasi pembayaran untuk mempercepat proses.
* **`024c84e` - Sistem Review Pembeli Terverifikasi:**  
  Hanya pesanan berstatus `PAID` yang dapat memberikan ulasan, dilengkapi proteksi anti-spam dan panel moderasi di dashboard admin.
* **`e4f029d` - Orvaki-Style Checkout Modal:**  
  Formulir pemesanan ringkas berbasis modal untuk kenyamanan konversi pengguna mobile.

---

## 5. Struktur Arsitektur & Logika Bisnis Utama

### 5.1 Mesin Status Pesanan (`OrderStatus`)
Siklus hidup pesanan diatur oleh PHP Backed Enum dengan validasi transisi ketat:

```
[PENDING] ──── (Pembeli Konfirmasi Bayar) ────► [VERIFYING] ──── (Admin Approve) ────► [PAID]
    │                                                │
    ├───── (Batas Waktu Habis / Scheduler) ──┐       ├───── (Admin Reject) ─────────► [CANCELLED]
    │                                        │       │
    └───── (Pembeli Batalkan Sendiri) ───────┴───────┴───── (Admin Revoke) ─────────► [CANCELLED]
```

### 5.2 Logika Quota & Anti-Overbooking
* **Penguncian Atomik:** `QuotaService` menggunakan `DB::transaction` dan `lockForUpdate` pada tabel `settings` untuk menjamin tidak ada dua pembeli yang mendapatkan kuota sewa harian yang sama pada detik yang bersamaan.
* **Penghasil Nominal Unik:** `UniqueAmountGenerator` menghasilkan 3 digit acak (100–999) yang dijamin unik di antara pesanan yang sedang aktif guna mempermudah verifikasi mutasi rekening.
* **Aturan 1 Pesanan Aktif:** Nomor WhatsApp atau sesi browser yang masih memiliki pesanan menggantung (`PENDING` atau `VERIFYING`) dilarang membuat pesanan baru sebelum pesanan sebelumnya diselesaikan atau dibatalkan.

### 5.3 Keamanan Kredensial Digital
* Kredensial akun (email, password, PIN profil) dienkripsi dengan kunci `APP_KEY` menggunakan AES-256-CBC sebelum masuk ke database.
* Pembeli harus memasukkan nomor WhatsApp lengkap yang cocok dengan data pesanan sebelum kunci enkripsi dibuka di browser.

---

## 6. Daftar Tabel Basis Data (23 Migrasi)

| Tabel | Fungsi |
| :--- | :--- |
| `users` | Data otentikasi admin |
| `products` | Katalog layanan streaming (Netflix, Spotify, dll.) |
| `product_variants` | Paket durasi (1 Hari, 7 Hari, 1 Bulan) dan tipe (Sewa/Beli) |
| `product_accounts` | Stok akun streaming digital (kredensial terenkripsi) |
| `orders` | Data transaksi, kode invoice, total harga, status |
| `order_events` | Catatan audit jejak riwayat perubahan status transaksi |
| `payment_methods` | Daftar rekening bank dan e-wallet toko |
| `settings` | Konfigurasi kuota sewa harian, jam buka toko, identitas |
| `daily_quota_overrides` | Penyesuaian kuota sewa pada tanggal-tanggal khusus |
| `banners` | Banner promo pada halaman beranda |
| `reviews` | Ulasan dan rating kepuasan pembeli terverifikasi |
| `cache` & `jobs` | Manajemen cache sistem dan antrean background jobs |

---

## 7. Panduan Perintah Operasional Harian

Buka terminal di folder `D:\Coding\StreamPoint`:

### 🔹 Menjalankan Aplikasi
* **Menggunakan Laravel Herd:** Aplikasi otomatis berjalan di latar belakang pada domain `http://streampoint.test`.
* **Menggunakan Built-in Artisan Server:**
  ```bash
  php artisan serve
  ```
* **Menjalankan Frontend Development Server (Live Reload Vite):**
  ```bash
  npm run dev
  ```
* **Kompilasi Ulang Frontend untuk Produksi:**
  ```bash
  npm run build
  ```

### 🔹 Database & Pemeliharaan
* **Menjalankan Migrasi:**
  ```bash
  php artisan migrate
  ```
* **Reset Database & Isi Data Demo Ulang:**
  ```bash
  php artisan migrate:fresh --seed
  ```
* **Pembersihan Cache Laravel:**
  ```bash
  php artisan optimize:clear
  ```
* **Menjalankan Unit & Feature Testing:**
  ```bash
  php artisan test
  ```

---

## 8. Rekomendasi Sebelum Peluncuran Produksi (Hosting/VPS)

Bila nantinya web ini akan diunggah ke server produksi publik (VPS / Cloud):
1. **Atur Bot Notifikasi Telegram:**
   Isi `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID` pada berkas `.env` server agar admin langsung menerima notifikasi setiap kali ada pesanan baru.
2. **Ubah Kredensial Admin:**
   Ubah email dan kata sandi admin default pada `.env` sebelum menjalankan seeder di server produksi.
3. **Bersihkan Data Demo:**
   Jalankan perintah khusus pembersihan order uji:
   ```bash
   php artisan shop:purge-test-orders --i-understand --force
   ```
4. **Jalankan Background Worker & Cron Scheduler:**
   Pasang cron job di server untuk menjalankan pembatalan pesanan kedaluwarsa secara otomatis:
   ```bash
   * * * * * cd /path-to-app && php artisan schedule:run >> /dev/null 2>&1
   ```
