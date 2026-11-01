# Task Prompt untuk Antigravity

Cara pakai:

1. Buat folder proyek, lalu taruh `PRD.md`, `TECH_SPEC.md`, dan `DESIGN_SYSTEM.md` di folder `docs/` (buat dulu foldernya).
2. Jalankan **Fase 1** terlebih dahulu. Jangan lanjut ke fase berikutnya sebelum fase sebelumnya lolos pengecekan.
3. Satu fase = satu percakapan/tugas agent. Setelah selesai, tinjau hasilnya, commit ke git, baru kirim prompt fase berikutnya.
4. Jika agent melenceng dari dokumen, arahkan kembali dengan: "Baca ulang `docs/…` bagian … lalu perbaiki."

---

## FASE 1: Fondasi Proyek (Prompt Pembuka)

````
Kamu adalah senior full-stack engineer (Laravel + React). Kita membangun website sewa dan beli akun streaming bergaya top-up game, dengan Laravel, React, dan Inertia.js.

## Langkah 0: Baca dulu, jangan coding dulu
Baca seluruh isi tiga dokumen ini sampai habis dan jadikan sebagai sumber kebenaran:
- docs/PRD.md  (aturan bisnis & alur pengguna)
- docs/TECH_SPEC.md  (stack, skema database, logika kuota, keamanan)
- docs/DESIGN_SYSTEM.md  (token visual & komponen)

Jika ada hal yang ambigu atau saling bertentangan, tulis daftar pertanyaan singkat di awal respons, lalu lanjutkan dengan asumsi paling masuk akal yang kamu tulis eksplisit. Jika konflik: PRD menang untuk perilaku, DESIGN_SYSTEM menang untuk tampilan.

## Tujuan Fase 1
Menyiapkan fondasi: proyek berjalan, database lengkap, logika inti kuota/order teruji, dan token desain terpasang. BELUM membuat halaman storefront/checkout/admin yang lengkap (itu fase berikutnya).

## Yang harus dikerjakan (berurutan)

1. **Scaffold proyek**
   - Buat proyek Laravel versi stabil terbaru dengan starter kit React resmi (Inertia, TypeScript), tanpa WorkOS. Gunakan versi paket terbaru dari composer/npm; jangan menebak versi dari ingatan.
   - Set `APP_TIMEZONE=Asia/Jakarta`, `APP_LOCALE=id`, database MySQL.
   - Matikan registrasi publik. Hanya akan ada satu admin (dibuat lewat seeder).
   - Install `lucide-react`. Pasang font Inter dan JetBrains Mono secara self-host (paket fontsource), tanpa CDN.

2. **Token desain**
   - Terapkan palet, tipografi, radius, dan jarak dari DESIGN_SYSTEM.md Bagian 2–4 sebagai CSS variables dan konfigurasi tema Tailwind (kelas seperti bg-surface, text-text-2, border-border, bg-accent tersedia).
   - Atur body ke background primary, teks primary, font Inter, `lang="id"`.
   - Restyle atau hapus gaya bawaan starter kit yang bertentangan (tema terang, gradien, shadow, radius besar). Hasil akhirnya harus dark matte sesuai dokumen.

3. **Database**
   - Buat migration dan model sesuai TECH_SPEC.md Bagian 4: products, product_variants, product_accounts, orders, order_events, payment_methods, settings, daily_quota_overrides, serta kolom is_admin di users.
   - Buat PHP backed Enums sesuai Bagian 2 (OrderType, OrderStatus dengan canTransitionTo(), RentDuration, AccountStatus, PaymentMethodType). Pasang cast di model, dan cast `encrypted` untuk product_accounts.credential.
   - Buat factory untuk model utama.

4. **Logika inti (tanpa UI)**
   - Implementasikan QuotaService, InvoiceCodeGenerator, UniqueAmountGenerator, helper Phone::normalize, dan Actions: CreateOrder, ExpireOrders, RejectOrder sesuai TECH_SPEC.md Bagian 5–6.
   - CreateOrder wajib atomik (DB::transaction + lockForUpdate pada baris settings), mereservasi unit akun, dan melempar QuotaFullException / OutOfStockException.
   - Tambahkan scope `countsTowardQuota` di Order seperti pada spesifikasi (PENDING yang sudah lewat payment_expires_at TIDAK dihitung).
   - Buat command `orders:expire` dan jadwalkan setiap menit.
   - Notifikasi: buat interface NotificationChannel, TelegramChannel (Http facade), AdminNotifier, dan job SendAdminNotification (queue, tries 3, afterCommit). Baca config dari config/notify.php dan .env. Kegagalan kirim tidak boleh melempar error ke alur checkout.

5. **Seeder**
   - AdminSeeder (dari env), SettingSeeder (kuota 3), DemoSeeder khusus environment local: 3 layanan, 4 varian sewa + 2 varian beli per layanan, beberapa unit akun DUMMY (bukan kredensial asli) per kategori, 2 metode pembayaran.

6. **Feature test (Pest atau PHPUnit)**
   Tulis dan jalankan minimal test berikut (TECH_SPEC.md Bagian 12 nomor 1–7, 9, 11, 12):
   - 3 order RENT aktif → order RENT ke-4 ditolak, order BUY tetap sukses
   - PENDING yang lewat payment_expires_at tidak dihitung kuota (tanpa menjalankan scheduler)
   - orders:expire mengubah status ke EXPIRED dan melepas unit akun
   - batas hari WIB (Carbon::setTestNow pada 23:59 dan 00:01)
   - override kuota harian (nilai 5 dan 0)
   - transisi status tidak sah ditolak
   - reject melepas kuota dan unit
   - total_amount unik di antara order aktif
   - Http::fake Telegram gagal tidak membatalkan pembuatan order

7. **Halaman sementara**
   - Satu halaman `/` yang menampilkan teks "NamaToko" dan komponen QuotaBar sederhana (data dari QuotaService) memakai token desain, hanya untuk memverifikasi bahwa Laravel → Inertia → React → Tailwind terhubung benar. Tanpa grid produk dulu.

## Aturan keras
- Semua uang integer Rupiah. Harga selalu dari database, tidak pernah dari request.
- Tidak ada logika kuota di controller atau frontend. Semuanya di QuotaService/Action.
- Tidak ada gradien, glow, emoji, atau shadow dekoratif di UI.
- Jangan simpan atau commit kredensial asli. Semua rahasia lewat .env.
- Jangan membuat fitur di luar daftar Fase 1.
- Jangan pakai localStorage untuk data penting.

## Kriteria selesai (verifikasi sendiri sebelum melapor)
- [ ] `php artisan migrate:fresh --seed` berhasil di MySQL
- [ ] `php artisan test` hijau (semua test di atas)
- [ ] `npm run build` berhasil tanpa error TypeScript
- [ ] Halaman `/` tampil dark matte sesuai token dan menampilkan data kuota nyata
- [ ] `php artisan schedule:list` menampilkan orders:expire tiap menit

## Format laporan akhir
1. Ringkasan apa yang dibuat (maks. 10 baris)
2. Daftar asumsi yang kamu ambil
3. Hasil menjalankan test dan build (tempel ringkasan output)
4. Hal yang belum selesai atau berisiko
5. Saran perintah untuk menjalankan proyek di lokal
````

---

## FASE 2: Storefront & Halaman Detail Layanan (UI)

````
Baca ulang docs/DESIGN_SYSTEM.md (seluruhnya) dan docs/PRD.md Bagian 5.1 dan 5.2. Proyek dari Fase 1 sudah memiliki model, QuotaService, dan token desain.

Bangun:
1. PublicLayout (header 48px dengan nama toko dan tautan "Cek Pesanan") dan komponen UI dasar yang direstyle: Button (4 varian), Input, Badge, Card, Tabs.
2. Halaman `/` (Storefront): QuotaBar (tiga keadaan sesuai DESIGN_SYSTEM 6.2) dan grid ProductCard (badge status layanan). Harus terlihat tanpa scroll di 375x667 dan 1366x768. Polling kuota 30 detik via router.reload({ only: ['quota'] }), berhenti saat tab tidak aktif, tanpa kedipan.
3. Halaman `/p/{slug}`: layout 2 kolom desktop (info + syarat kiri, form 4 langkah kanan), 1 kolom mobile dengan StickyBottomBar. Langkah 1: tab Sewa Harian / Beli Akun, PackageOption dengan keadaan disabled yang menampilkan ALASAN tertulis. Langkah 2: input nomor WA (normalisasi sisi klien). Langkah 3: pilihan metode pembayaran. Langkah 4: ringkasan dan total. Tombol checkout belum perlu terhubung ke server (cukup state lokal dan ringkasan).
4. Data dari controller via Inertia props eksplisit (StorefrontController, ProductController), tidak boleh membocorkan kolom sensitif (credential, account_id).

Jangan membuat logika checkout server atau invoice di fase ini.
Kriteria selesai: checklist akhir DESIGN_SYSTEM Bagian 12 untuk dua halaman ini terpenuhi, `npm run build` dan test lama tetap hijau, dan berikan screenshot atau deskripsi hasil di 375px dan 1366px.
````

---

## FASE 3: Checkout Server & Invoice Pembayaran

````
Baca docs/TECH_SPEC.md Bagian 3, 5, 6, 7, 9 dan docs/PRD.md Bagian 4.4–4.6 serta 5.3.

Bangun:
1. CheckoutController@store + FormRequest (validasi varian aktif, nomor WA, metode pembayaran aktif, idempotency_key, honeypot). Panggil Action CreateOrder dari Fase 1. Tangkap QuotaFullException dan OutOfStockException lalu kembalikan sebagai error validasi inline pada form (halaman tidak berpindah). Throttle 5/menit per IP. Simpan invoice_code ke session `owned_invoices`.
2. Hubungkan tombol "Beli / Sewa Sekarang" ke server (disabled + loading saat proses, cegah klik ganda). Setelah sukses, redirect ke `/invoice/{invoiceCode}`.
3. Halaman invoice sesuai DESIGN_SYSTEM 6.10–6.13 untuk semua status (PENDING, VERIFYING, PAID, EXPIRED, CANCELLED): CountdownTimer berbasis payment_expires_at dan server_now, total highlight dengan kode unik berwarna aksen, CopyButton, upload bukti bayar opsional (jpg/png/webp maks 3MB, disk privat), tombol "Saya Sudah Bayar" → Action ConfirmPayment (PENDING → VERIFYING) + notifikasi. Polling status 10 detik, berhenti di status akhir.
4. Akses kredensial: tampil hanya jika invoice ada di session atau sudah lolos verifikasi nomor WA (POST /invoice/{code}/verify, throttle 5/menit). Selain itu hanya ringkasan.
5. Halaman `/cek-pesanan`: mode Kode Invoice + Nomor WA (membuka invoice) dan mode Nomor WA saja (daftar tanpa kredensial dan tanpa total). Throttle 10/menit.
6. Notifikasi Telegram untuk order.created dan payment.confirmed memakai format TECH_SPEC 8.5, dengan input pengguna di-escape.

Tulis feature test: kredensial tidak bocor (pencarian by WA, invoice tanpa sesi), upload menolak non-gambar dan >3MB, file bukti tidak bisa diakses publik, ConfirmPayment menolak order expired, idempotency_key mencegah order ganda.
Kriteria selesai: alur lengkap (pilih paket → bayar → konfirmasi) bisa dicoba manual di lokal, semua test hijau, notifikasi Telegram masuk (uji dengan token asli di .env lokal atau Http::fake).
````

---

## FASE 4: Panel Admin

````
Baca docs/PRD.md Bagian 5.5 dan docs/TECH_SPEC.md Bagian 3, 6, 9, serta DESIGN_SYSTEM 6.14–6.15.

Bangun di prefix /admin dengan middleware auth + EnsureAdmin dan AdminLayout (padat, mobile-friendly):
1. Dashboard: jumlah order hari ini per status, slot sewa terpakai/limit, daftar order VERIFYING di bagian atas.
2. Order: daftar (filter status, cari invoice/nomor WA, VERIFYING paling atas), detail (bukti bayar lewat rute admin-only yang men-stream file privat, unit akun yang di-assign dan bisa diganti, tombol Approve dan Reject dengan modal konfirmasi, Reject wajib alasan, Aktifkan Kembali untuk EXPIRED). Implementasikan Action ApproveOrder dan ReactivateOrder sesuai tabel TECH_SPEC Bagian 6, semua transaksional dan tercatat di order_events.
3. Produk dan Varian: CRUD, termasuk teks aturan sewa/garansi per layanan.
4. Stok Akun: tambah satuan, impor massal (satu baris per unit: email|password|profil|pin), lihat dan ubah status unit, tandai DISABLED.
5. Metode Pembayaran: CRUD termasuk upload gambar QRIS.
6. Pengaturan: kuota default, override kuota per tanggal (0 = tutup sewa), nomor WhatsApp admin untuk invoice, tombol Tes Notifikasi Telegram.
7. Command terjadwal: accounts:release-rented (RENTED yang lewat rented_until kembali AVAILABLE) dan orders:remind-verifying (VERIFYING > 30 menit, sekali per order). Notifikasi stok menipis (≤ 2 unit).

Tulis feature test: non-admin tidak bisa mengakses /admin, approve mengisi access_starts_at/access_expires_at sesuai duration_hours dan mengubah status unit, reject melepas kuota dan unit, override kuota dihormati, ReactivateOrder gagal jika kuota atau stok tidak ada.
Kriteria selesai: seluruh alur admin bisa dijalankan dari HP (375px), test hijau.
````

---

## FASE 5: Hardening, QA, dan Deploy

````
Lakukan audit penuh terhadap docs/TECH_SPEC.md Bagian 9 (Keamanan), Bagian 12 (Pengujian), dan DESIGN_SYSTEM Bagian 12 (Checklist Akhir). Untuk setiap butir, nyatakan LULUS atau GAGAL beserta bukti (nama test atau file), lalu perbaiki yang GAGAL.

Tambahan:
1. Pastikan semua test di TECH_SPEC Bagian 12 ada dan hijau, termasuk test concurrency kuota/unit terakhir.
2. Uji manual skenario tepi di PRD Bagian 7 dan laporkan hasilnya.
3. Periksa tidak ada kredensial, token, atau data sensitif pada props Inertia publik, log, atau pesan error. Pastikan APP_DEBUG=false di produksi.
4. Optimasi: gambar produk diperkecil dan lazy-load di luar layar awal, tidak ada query N+1 pada storefront dan daftar order admin (cek dengan eager loading), index database sesuai spesifikasi.
5. Siapkan DEPLOY.md berisi langkah deploy berdasarkan checklist TECH_SPEC Bagian 13 (cron scheduler, queue worker atau mode sync + afterResponse, storage privat, backup harian, HTTPS), plus cara membuat bot Telegram dan mendapatkan chat_id.
6. Buat README.md singkat: cara menjalankan lokal, akun admin dari seeder, cara menjalankan test.

Kriteria selesai: laporan audit lengkap (LULUS/GAGAL per butir), `php artisan test` hijau, `npm run build` bersih, DEPLOY.md dan README.md ada.
````
