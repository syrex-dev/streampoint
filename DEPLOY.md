# Panduan Deployment StreamPoint (Produksi)

Dokumen ini memuat langkah lengkap penyebaran (*deployment*), konfigurasi server, penjadwalan (*scheduler*), opsi antrean (*queue*), keamanan, pencadangan (*backup*), dan panduan konfigurasi bot Telegram untuk pemilik toko.

---

## 1. Prasyarat Server

- **OS:** Linux (Ubuntu 22.04 LTS / 24.04 LTS direkomendasikan)
- **Web Server:** Nginx (atau Apache 2.4+)
- **PHP:** PHP 8.3+ dengan ekstensi: `bcmath`, `ctype`, `curl`, `dom`, `fileinfo`, `json`, `mbstring`, `openssl`, `pcre`, `pdo_mysql`, `tokenizer`, `xml`
- **Database:** MySQL 8.0+ atau MariaDB 10.6+
- **Node.js:** Node.js 20+ & npm
- **Composer:** Composer 2+
- **Sertifikat SSL/TLS:** Let's Encrypt (Certbot) atau SSL berbayar (HTTPS wajib)

---

## 2. Langkah Deployment Bertahap

Jalankan perintah berikut di direktori root aplikasi di server (misalnya `/var/www/streampoint`):

```bash
# 1. Salin file environment produksi
cp .env.example .env

# 2. Pasang dependensi PHP untuk produksi (tanpa dependensi dev)
composer install --no-dev --optimize-autoloader

# 3. Pasang dependensi Node dan kompilasi asset frontend (React + Tailwind)
npm ci
npm run build
# Pastikan file public/hot tidak ada di server (jika ada, halaman tampil tanpa CSS)
rm -f public/hot

# 4. Generate Application Key (Simpan nilai APP_KEY ini di tempat aman!)
php artisan key:generate

# 5. Jalankan migrasi database
php artisan migrate --force

# 6. Jalankan seeder Admin dan Pengaturan saja (JANGAN jalankan DemoSeeder di produksi)
php artisan db:seed --class=AdminSeeder --force
php artisan db:seed --class=SettingSeeder --force

# 7. Buat symbolic link untuk storage publik (thumbnail & QRIS)
php artisan storage:link

# 8. Cache konfigurasi, rute, dan view untuk performa maksimal
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

> [!IMPORTANT]
> **JANGAN PERNAH** menjalankan `DemoSeeder` di lingkungan produksi. `DemoSeeder` hanya ditujukan untuk pengujian lokal (`APP_ENV=local`).

---

## 3. Konfigurasi Lingkungan (`.env`)

Pastikan nilai berikut diatur dengan benar di server produksi:

```env
APP_NAME="StreamPoint"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://domainanda.com

APP_TIMEZONE=Asia/Jakarta
APP_LOCALE=id

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=streampoint_prod
DB_USERNAME=streampoint_user
DB_PASSWORD=PasswordDatabaseYangKuat

# Kredensial Akun Admin Pertama
ADMIN_EMAIL=admin@domainanda.com
ADMIN_PASSWORD=PasswordAdminSangatKuatMinimal12Karakter

# Pengaturan Notifikasi Telegram (diisi oleh pemilik toko)
NOTIFY_CHANNELS=telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

ORDER_PAYMENT_TTL_MINUTES=15

# Session & Keamanan Cookie
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax

# Queue Connection (lihat Bagian 5)
QUEUE_CONNECTION=database
```

---

## 4. Cron Scheduler

StreamPoint mengandalkan Laravel Scheduler untuk:
1. `orders:expire` (setiap 1 menit) — Membatalkan pesanan pending yang melewati 15 menit dan melepaskan unit akun kembali ke status `AVAILABLE`.
2. `accounts:release-rented` (setiap 5 menit) — Melepaskan unit sewa yang masa aktifnya telah habis (`rented_until <= now()`) kembali ke status `AVAILABLE`.
3. `orders:remind-verifying` (setiap 5 menit) — Mengirim notifikasi pengingat ke admin jika ada pesanan berstatus `VERIFYING` lebih dari 30 menit.

Tambahkan satu baris cron pada user server (`crontab -e`):

```cron
* * * * * cd /var/www/streampoint && php artisan schedule:run >> /dev/null 2>&1
```

---

## 5. Pilihan Antrean Notifikasi (Queue)

Pilih salah satu dari dua opsi berikut sesuai arsitektur hosting Anda:

### Opsi A: Worker Permanen dengan Supervisor (Sangat Direkomendasikan untuk VPS/Dedicated)

Gunakan `QUEUE_CONNECTION=database`. Buat konfigurasi Supervisor `/etc/supervisor/conf.d/streampoint-worker.conf`:

```ini
[program:streampoint-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/streampoint/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/streampoint/storage/logs/worker.log
stopwaitsecs=3600
```

Aktifkan konfigurasi:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start streampoint-worker:*
```

### Opsi B: Mode `sync` dengan `afterResponse()` (Untuk Shared Hosting / Server Tanpa Supervisor)

Jika hosting Anda tidak mengizinkan background worker independen:
1. Atur di `.env`:
   ```env
   QUEUE_CONNECTION=sync
   ```
2. Aplikasi secara otomatis menggunakan `dispatch(...)->afterResponse()` pada job `SendAdminNotification`.
3. **Konsekuensi:** Notifikasi dikirimkan setelah HTTP response dikembalikan ke browser pembeli (pembeli tidak menunggu API Telegram). Namun, jika proses PHP webserver mati tiba-tiba di tengah transmisi HTTP ke Telegram, pesan tidak memiliki mekanisme *background retry* otomatis.

---

## 6. Keamanan Server & Web Server

### 6.1 Izin Folder
Pastikan user web server (`www-data` atau `nginx`) memiliki hak akses tulis:

```bash
sudo chown -R www-data:www-data /var/www/streampoint
sudo chmod -R 775 /var/www/streampoint/storage
sudo chmod -R 775 /var/www/streampoint/bootstrap/cache
```

### 6.2 Proteksi Nginx
Konfigurasi Nginx wajib memblokir akses langsung ke file sensitif dan disk privat:

```nginx
server {
    listen 80;
    server_name domainanda.com www.domainanda.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name domainanda.com;
    root /var/www/streampoint/public;

    index index.php;

    ssl_certificate /etc/letsencrypt/live/domainanda.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/domainanda.com/privkey.pem;

    # Keamanan Header Tambahan
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Blokir akses ke file tersembunyi (.env, .git, dll)
    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Pastikan storage/app/private tidak terekspos langsung
    location ~ ^/storage/private {
        deny all;
        return 404;
    }
}
```

---

## 7. Pencadangan Rutin (Backup) Termasuk `APP_KEY`

> [!CAUTION]
> **KRITIS TENTANG ENKRIPSI:** Kolom `credential` pada tabel `product_accounts` dienkripsi menggunakan algoritma AES-256-CBC dengan kunci `APP_KEY` yang ada di file `.env`.
> Jika database Anda dibackup tetapi `APP_KEY` hilang atau berganti, **SELURUH KREDENSIAL AKUN STREAMING TIDAK AKAN BISA DIDEKRIPSI KEMBALI**.

### Prosedur Backup Harian:
1. Backup file database:
   ```bash
   mysqldump -u streampoint_user -p streampoint_prod | gzip > /backup/db_streampoint_$(date +%Y%m%d).sql.gz
   ```
2. Salin dan simpan nilai `APP_KEY` dan file `.env` di penyimpanan terenkripsi yang aman (misalnya password manager / vault terpisah).
3. Backup folder `storage/app/private/proofs` (berisi bukti transfer pembayaran).

---

## 8. Panduan Pemilik Toko: Membuat & Mengonfigurasi Bot Telegram

Ikuti langkah mudah berikut untuk mengaktifkan notifikasi pesanan langsung ke Telegram Anda:

### Langkah 1: Buat Bot lewat @BotFather
1. Buka aplikasi Telegram di HP atau komputer Anda.
2. Cari akun resmi **@BotFather** (pastikan bercentang biru).
3. Ketik perintah `/newbot` lalu tekan Kirim.
4. Masukkan nama tampilan untuk bot Anda (misal: `StreamPoint Notif`).
5. Masukkan username untuk bot Anda yang berakhiran `bot` (misal: `streampoint_order_bot`).
6. BotFather akan memberikan pesan sukses yang memuat **HTTP API Token** (contoh format: `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`). Simpan token ini.

### Langkah 2: Mulai Obrolan dengan Bot Anda
1. Klik tautan bot Anda yang diberikan oleh BotFather (misal: `t.me/streampoint_order_bot`).
2. Tekan tombol **Start** atau kirim pesan teks sembarang (misalnya: `Halo`).
   *(Langkah ini wajib dilakukan agar bot memiliki izin mengirim pesan ke Anda).*

### Langkah 3: Dapatkan Chat ID Anda
1. Buka browser web, lalu buka alamat URL berikut (ganti `<TOKEN_ANDA>` dengan token dari Langkah 1):
   ```text
   https://api.telegram.org/bot<TOKEN_ANDA>/getUpdates
   ```
2. Cari bagian teks `"chat":{"id":123456789,...}`.
3. Angka numerik tersebut (misalnya `123456789`) adalah **Chat ID** Telegram Anda.

### Langkah 4: Simpan ke StreamPoint
Terdapat dua cara untuk menyimpannya:
- **Cara A (Lewat Panel Admin):** Login ke panel admin `/admin` -> pilih menu **Pengaturan** -> isi kolom **Bot Token Telegram** dan **Chat ID Telegram** -> klik **Simpan Pengaturan**.
- **Cara B (Lewat file .env):** Isi variabel `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID` di file `.env` server Anda.

### Langkah 5: Uji Notifikasi
1. Buka menu **Pengaturan** di panel admin StreamPoint (`/admin/settings`).
2. Klik tombol **Tes Notifikasi**.
3. Jika berhasil, bot Telegram akan langsung mengirimkan pesan konfirmasi ke akun Telegram Anda!

---

## 9. Checklist Uji Pasca-Deploy (Smoke Test)

Setelah deployment selesai, lakukan pengujian berikut sebelum membuka toko ke publik:

- [ ] **Checklist Pasca-Build Aset:** Pastikan file `public/hot` tidak ada di server (jika ada, halaman tampil tanpa CSS karena Laravel mengira Vite dev server sedang aktif).
- [ ] Buka halaman utama `https://domainanda.com`:
  - Bar kuota tampil dengan benar (`Slot sewa hari ini: X/X tersisa`).
  - Tema terang dan gelap berfungsi tanpa kedip.
  - Logo produk tampil dengan rasio yang tepat.
- [ ] Login Admin di `https://domainanda.com/login`:
  - Gunakan email dan password dari `.env`.
  - Masuk ke dashboard admin `/admin`.
- [ ] Uji Notifikasi Telegram:
  - Buka menu **Pengaturan** admin.
  - Klik tombol **Tes Notifikasi**, pastikan pesan masuk ke Telegram Anda.
- [ ] Buat Pesanan Uji Coba:
  - Buka halaman produk salah satu layanan.
  - Lakukan checkout sewa 1 hari dengan nomor WhatsApp uji coba.
  - Pastikan diarahkan ke halaman invoice dengan kode unik 3 digit (100–999).
  - Pastikan notifikasi Telegram order baru masuk.
- [ ] Konfirmasi Pembayaran:
  - Di halaman invoice, klik tombol **Saya Sudah Bayar** (sertakan upload bukti transfer).
  - Pastikan status pesanan berubah menjadi `VERIFYING`.
- [ ] Persetujuan Admin (Approve):
  - Buka detail order di panel admin.
  - Klik thumbnail bukti transfer, pastikan gambar terbuka secara aman.
  - Klik **Setujui Pesanan (Kirim Akun)**.
- [ ] Verifikasi Kredensial Pembeli:
  - Buka kembali invoice pembeli, pastikan status `PAID` dan kotak kredensial (Email, Password, Profil, PIN) tampil lengkap dengan tombol salin.
  - Buka invoice di mode *Incognito* / perangkat lain, pastikan kredensial disembunyikan sampai nomor WhatsApp diverifikasi.
- [ ] Bersihkan Pesanan Uji Coba:
  - Hapus atau batalkan pesanan uji coba agar kuota dan stok akun kembali rapi sebelum peluncuran resmi.
