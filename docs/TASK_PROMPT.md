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

## FASE 3B: Mode Terang/Gelap & Struktur Halaman Bergaya Seakun

Jalankan setelah Fase 3 lolos dan di-commit. Pastikan docs/DESIGN_SYSTEM.md (v3), docs/PRD.md (Bagian 5.1, 5.6, 5.7), dan docs/TECH_SPEC.md versi terbaru sudah menggantikan file lama di folder docs/.

````
ATURAN KERAS (tetap berlaku): bekerja HANYA di D:\Coding\StreamPoint. Dilarang membaca folder/proyek/.env lain atau clipboard, dan dilarang menampilkan nilai rahasia.

Baca ulang docs/DESIGN_SYSTEM.md v3 seluruhnya (terutama Bagian 0, 1, 2, 6) dan docs/PRD.md Bagian 5.1, 5.6, 5.7.

Referensi struktur halaman adalah seakun.id. Kamu BOLEH membuka seakun.id di browser untuk memahami susunan seksi dan pola navigasinya. DILARANG menyalin teks, ilustrasi, ikon, logo, nama merek, atau klaim dari sana, dan dilarang mengunduh asetnya. Warna dan tipografi mengikuti DESIGN_SYSTEM.md, bukan situs tersebut. Elemen yang sengaja tidak diambil: hero besar, statistik pengguna, testimoni, logo partner, banner promo, banner aplikasi, klaim "legal/resmi".

TUGAS A: Mode Terang / Gelap / Sistem
1. Ganti token di resources/css/app.css menjadi dua set (:root = terang, .dark = gelap) sesuai tabel DESIGN_SYSTEM 2.1 dan 2.2, termasuk token baru --accent-text, --overlay, dan peta status 2.5. Petakan ke tema Tailwind.
2. Audit SEMUA komponen dan halaman yang sudah ada (storefront, produk, invoice semua status, cek pesanan, login/pengaturan bawaan starter kit, CopyButton, CountdownTimer, TotalHighlight, CredentialBox, badge, tabs, input, button, QuotaBar). Hapus hex langsung dan class warna tetap, ganti dengan token. Teks berwarna aksen di mode terang wajib memakai --accent-text.
3. ThemeToggle di header (Terang/Gelap/Sistem, ikon Sun/Moon/Monitor) memakai mekanisme use-appearance.tsx yang sudah ada. Default Sistem. Tambahkan skrip inline di resources/views/app.blade.php agar class "dark" ditetapkan sebelum render (tanpa kedipan).
4. Gambar QRIS ditaruh di kotak putih berpadding 12px di kedua mode.

TUGAS B: Struktur halaman publik
1. Header sticky 56px: nama toko, tautan jangkar (Layanan, Cara Pesan, FAQ), Cek Pesanan, ThemeToggle. Mobile: hamburger yang membuka panel menu (fokus terkunci, Esc menutup).
2. Beranda (/) urutan: [banner pesanan belum selesai jika ada] -> pita intro ringkas (maks 88px mobile) -> QuotaBar -> filter katalog (Tipe: Semua/Sewa/Beli, Kategori: dropdown dari products.category, disembunyikan jika hanya satu) -> grid produk -> Cara Pesan (5 langkah, ikon Lucide) -> Metode Pembayaran (dari payment_methods aktif) -> FAQ akordeon -> Footer.
3. Filter di sisi klien, dengan keadaan kosong + tombol Reset filter.
4. Banner pesanan belum selesai: ambil dari session owned_invoices, hanya order PENDING/VERIFYING milik sesi. Kirim lewat shared props (data minimal: invoice_code dan status), tampil di semua halaman publik kecuali invoice yang sama.
5. FAQ dari resources/js/data/faq.ts, isi 8 pertanyaan dari PRD Bagian 5.6, ditulis dengan kata-kata sendiri.
6. Footer: brand + deskripsi, tautan (Cek Pesanan, Syarat & Ketentuan, Kebijakan Privasi), WhatsApp admin dan Jam Operasional dari settings, disclaimer non-afiliasi (teks di DESIGN_SYSTEM 6.10). Buat halaman statis /syarat-ketentuan dan /kebijakan-privasi dengan template teks sederhana.
7. Tombol bantuan WhatsApp mengambang (DESIGN_SYSTEM 6.11), disembunyikan jika admin_whatsapp kosong; di halaman produk mobile posisinya di atas sticky bottom bar.
8. Tambahkan kolom settings.business_hours (migration baru, jangan ubah migration lama), isi di SettingSeeder, dan bagikan admin_whatsapp + business_hours lewat HandleInertiaRequests.
9. Skip link "Lewati ke konten".

TEST dan VERIFIKASI
- Feature test: shared props memuat banner hanya untuk order milik sesi; halaman statis mengembalikan 200; settings dibagikan ke publik tanpa kolom sensitif.
- php artisan test, npm run types:check, npm run build harus bersih.
- Ambil screenshot (di dalam storage/ atau folder sementara yang dihapus setelahnya) untuk: beranda, halaman produk, invoice PENDING, invoice PAID, Cek Pesanan. Masing-masing di MODE TERANG dan GELAP, pada 375px (gunakan emulasi device sesungguhnya, bukan headless dengan window-size kecil) dan 1366px.
- Lampirkan checklist DESIGN_SYSTEM Bagian 12 dengan LULUS/GAGAL per butir.
- Hapus file scratch. Pastikan tabel orders kosong.
````

---

## FASE 4: Panel Admin

````
Baca docs/PRD.md Bagian 5.5 dan docs/TECH_SPEC.md Bagian 3, 6, 9, serta DESIGN_SYSTEM 6.14–6.15.

Bangun di prefix /admin dengan middleware auth + EnsureAdmin dan AdminLayout (padat, mobile-friendly, memakai token dua mode Terang/Gelap dan ThemeToggle yang sama dengan halaman publik; tanpa hex langsung):
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

---

## FASE 6: Tampilan Lebih Hidup (Opsi A)

Jalankan setelah Fase 5 di-commit. Pastikan `docs/DESIGN_SYSTEM.md` (v3.1), `docs/PRD.md`, dan `docs/TECH_SPEC.md` terbaru sudah menggantikan file lama di folder `docs/`.

````
ATURAN KERAS: bekerja HANYA di D:\Coding\StreamPoint. Dilarang membaca di luar proyek (termasuk log sesi .gemini, clipboard, proyek lain), dilarang menampilkan nilai rahasia, dilarang menebak password atau menyisipkan sesi/otentikasi palsu atau parameter khusus screenshot. Jangan melakukan git commit. File scratch hanya di storage/ dan dihapus setelah dipakai. Dilarang mengunduh logo atau gambar dari internet; semua logo dan gambar banner diunggah sendiri oleh admin nanti.

Baca ulang docs/DESIGN_SYSTEM.md v3.1 (Bagian 0, 1, 2.6, 5, 6.1, 6.2, 6.6, 6.26, 6.27, 6.28, 11, 12), docs/PRD.md Bagian 5.1 dan 5.5, dan docs/TECH_SPEC.md Bagian 4 (products.brand_color, settings tambahan, tabel banners).

TUGAS:
1. Migration baru (jangan ubah migration lama): products.brand_color (string 7, nullable); settings.store_name, store_logo_path, accent_preset (default 'emerald'); tabel banners sesuai TECH_SPEC. Perbarui model, fillable/casts, factory.
2. Admin:
   a. Form produk: field warna merek (input warna + field hex, boleh dikosongkan), validasi regex ^#[0-9A-Fa-f]{6}$.
   b. CRUD Banner di /admin/banners (menu baru): validasi sesuai TECH_SPEC (cta_url hanya path berawalan "/" atau "https://", tolak javascript:, data:, dsb.; gambar jpg/png/webp maks 2MB, nama acak, tanpa SVG; tone neutral|accent|warning; maks 5 banner aktif; starts_at/ends_at opsional dengan ends_at setelah starts_at). Tampilkan pengingat konten di form: "Jangan menulis klaim yang tidak bisa dibuktikan". Pratinjau kecil banner di form.
   c. Pengaturan: store_name, upload logo toko (jpg/png/webp maks 1MB, tanpa SVG), pilihan preset aksen (emerald, teal, blue, mono) dengan swatch pratinjau. Validasi preset dengan daftar putih.
3. Publik:
   a. Preset aksen: tambahkan override token di resources/css/app.css berdasarkan html[data-accent="..."] untuk teal, blue, mono sesuai DESIGN_SYSTEM 2.6 (kedua mode). Tetapkan atribut data-accent di resources/views/app.blade.php dari settings di sisi server (tanpa kedipan). Pastikan semua komponen hanya memakai token (tidak ada hex langsung).
   b. BrandMark (6.28) di header, footer, dan login; <title> memakai store_name.
   c. ProductCard sesuai 6.6: logo 56px dengan tint merek via color-mix (set --brand lewat style hanya setelah lolos validasi hex di server DAN klien), kotak inisial jika tanpa logo, chip tipe Sewa/Beli. Halaman produk: logo 64px dengan tint yang sama.
   d. Banner slider sesuai 6.26: scroll-snap manual, tanpa autoplay, panah (desktop) dan titik, keyboard kiri/kanan, teks tidak di atas gambar, tidak ada gradien. Sembunyikan pita intro jika ada banner aktif; fallback ke pita intro jika tidak ada. Hanya banner aktif dan dalam jadwal yang dikirim ke publik, dengan kolom minimal.
   e. Seksi "Kenapa Beli di Sini" sesuai 6.27, isi dari resources/js/data/benefits.ts (6 poin default di dokumen), ditempatkan setelah katalog dan sebelum Cara Pesan.
4. DemoSeeder (local saja): beri brand_color untuk 3 layanan demo, dan 2 banner demo hanya teks (tanpa gambar, tone neutral dan accent). Jangan menambahkan file logo.
5. Test:
   - banner CRUD hanya untuk admin; cta_url menolak javascript:/data:/skema lain; gambar menolak SVG dan file non-gambar; maks 5 banner aktif;
   - props publik memuat hanya banner aktif dan dalam jadwal (dan tidak memuat kolom internal);
   - brand_color menolak "red", "#12345", "#GGGGGG", "url(x)", dan string berisi ";" atau tanda kurung;
   - accent_preset menolak nilai di luar daftar putih; logo toko menolak SVG;
   - atribut data-accent pada halaman sesuai pengaturan.
6. Verifikasi:
   a. Hitung kontras WCAG untuk keempat preset di kedua mode: --accent-text terhadap --bg dan --surface, dan --on-accent terhadap --accent. Tampilkan tabel hasilnya. Jika ada yang < 4.5:1, sesuaikan nilai preset (dan perbarui DESIGN_SYSTEM.md) lalu hitung ulang.
   b. Ukur lewat DOM (getBoundingClientRect, bukan perkiraan) dengan satu banner aktif: di 375x667 bar kuota harus terlihat penuh tanpa scroll; di 1366x768 bar kuota dan baris produk pertama harus terlihat. Laporkan angka koordinatnya. Jika tidak lolos, perkecil tinggi banner di mobile atau perbaiki spacing, jangan menyembunyikan bar kuota.
   c. Simpan screenshot di storage/screenshots (login normal, tanpa bypass): beranda dengan banner, beranda tanpa banner, halaman produk, dan satu pasang untuk setiap preset aksen, di mode terang dan gelap pada 375px dan 1366px. Laporkan jalurnya. Jangan menampilkan tautan lokal sebagai gambar.
7. php artisan test, npm run types:check, npm run build harus bersih. Tabel orders kosong, tidak ada sesi atau skrip sisa, git status hanya memuat perubahan Fase 6.

Laporkan ringkas: daftar file berubah, nama test untuk tiap butir, tabel kontras, dan angka pengukuran DOM.
````

---

## FASE 6B: Katalog Bergaya Marketplace (Opsi A+)

Jalankan setelah Fase 6 di-commit. Pastikan docs/DESIGN_SYSTEM.md (v3.2), docs/PRD.md, dan docs/TECH_SPEC.md terbaru sudah menggantikan file lama di folder `docs/`.

````
ATURAN KERAS: bekerja HANYA di D:\Coding\StreamPoint. Dilarang membaca di luar proyek (termasuk log sesi .gemini, clipboard, proyek lain), dilarang menampilkan rahasia, dilarang menebak password atau menyisipkan sesi/otentikasi palsu. Dilarang menghentikan proses (Stop-Process/taskkill) kecuali yang kamu mulai sendiri dalam tugas ini; jangan menghentikan Herd, node, php, atau layanan proyek lain. Jangan git commit. Scratch hanya di storage/ dan dihapus. Dilarang mengunduh gambar atau logo dari internet, dan dilarang menyalin teks atau aset dari situs referensi (orvaki.com, seakun.id). Referensi hanya untuk pola susunan.

Baca ulang docs/DESIGN_SYSTEM.md v3.2 (Bagian 0, 1, 5, 6.6, 6.8, 6.10, 6.28, 6.29, 6.30, 6.31, 6.32, 11, 12), docs/PRD.md Bagian 5.1 dan 5.5, docs/TECH_SPEC.md Bagian 4 dan 15.

TUGAS:
1. Migration baru (jangan ubah yang lama): products.cover_path (nullable), products.has_warranty (boolean default false); settings: announcement_text (160), announcement_url (255), announcement_active (boolean default false), store_tagline (60), delivery_eta (60), min_sold_display (unsigned smallint default 5), custom_request_enabled (boolean default false), social_links (json nullable); payment_methods.logo_path (nullable). Perbarui model, fillable, casts, dan factory.
2. ImageOptimizer (service) sesuai TECH_SPEC Bagian 15: GD, perkecil sesuai jenis, simpan WebP, tolak SVG dan non-gambar via getimagesize, nama acak, tidak membesarkan gambar kecil, fallback aman jika GD tidak ada. Terapkan pada sampul layanan, logo layanan, logo toko, gambar banner (ganti penyimpanan yang ada), dan logo metode pembayaran.
3. Admin:
   a. Form produk: unggah sampul, toggle has_warranty (perhatikan pratinjau kartu).
   b. Pengaturan: bar pengumuman (teks, url, aktif), tagline, estimasi pengiriman, ambang tampil terjual, toggle pesanan custom, tautan sosial (telegram, instagram, threads, tiktok) dengan validasi https dan daftar putih host sesuai TECH_SPEC.
   c. Metode pembayaran: unggah logo opsional.
4. Data publik di StorefrontController: cover_url, logo_url, brand_color (hanya jika lolos regex), has_warranty, is_new, min_price, status stok, sold_count via withCount (null jika < min_sold_display), flag terlaris (tiga teratas yang memenuhi ambang), dan daftar layanan "Sedang Kosong" terpisah (layanan yang SEMUA paketnya tidak bisa dipesan karena stok habis). Props publik tidak boleh memuat kolom sensitif. Tidak ada N+1.
5. Frontend sesuai dokumen: AnnouncementBar (6.29), CatalogToolbar (6.30: cari klien-sisi dengan debounce, tipe, kategori, urutkan; opsi "Terlaris" hanya jika ada >= 3 layanan bernilai terjual nyata), ProductCard v3 (6.6) dengan sampul 16:10 atau blok tint + logo, badge di atas sampul berlatar solid, chip Sewa/Beli/Garansi, "N terjual" hanya jika tidak null; bagian "Sedang Kosong" (6.31); ajakan pesanan custom (6.32); Footer baru (6.10: sosial, tautan penting, kontak dan jam kerja, metode pembayaran dengan logo di atas latar putih); BrandMark dengan tagline (6.28); Cara Pesan langkah 5 menampilkan delivery_eta bila diisi. Dilarang menampilkan rating, jumlah dilihat, atau angka karangan apa pun.
6. DemoSeeder (local saja, idempoten): has_warranty true untuk layanan demo, satu pengumuman nonaktif contoh. Tanpa gambar.
7. Test: validasi sosial (menolak http://, host di luar daftar putih, javascript:), announcement_url, unggahan gambar (menolak SVG, non-gambar, melebihi batas; hasil unggahan berformat WebP dan lebarnya <= batas bila GD tersedia), sold_count null di bawah ambang dan benar di atas ambang (hitung hanya PAID), flag terlaris hanya pada layanan yang memenuhi ambang, layanan stok habis muncul di daftar "Sedang Kosong" bukan di grid utama, props publik tidak memuat kolom sensitif, tidak ada N+1 pada storefront (batas jumlah query).
8. Verifikasi:
   a. Ukur lewat DOM (getBoundingClientRect), dengan bar pengumuman DAN satu banner aktif bersamaan: di 375x667 bar kuota terlihat penuh (bottom <= 667); di 1366x768 bar kuota dan baris produk pertama terlihat penuh (bottom <= 768). Tampilkan koordinat. Jika gagal, perkecil spacing, jangan menyembunyikan bar kuota.
   b. Periksa stylesheet termuat (tanpa net::ERR, header di y=0 tinggi 56px), pastikan tidak ada public/hot.
   c. Laporkan total ukuran transfer beranda (HTML, JS, CSS, gambar) dari Performance API pada data demo, dan ukuran file hasil optimasi dari satu gambar uji.
   d. Hitung ulang kontras bila ada warna baru dipakai (badge di atas sampul, bar pengumuman).
   e. Simpan screenshot di storage/screenshots (CSS termuat, tanpa bypass login): beranda dengan sampul dan tanpa sampul, dengan pengumuman aktif, bagian Sedang Kosong, footer, terang dan gelap, 375px dan 1366px. Laporkan jalurnya.
9. php artisan test, npm run types:check, npm run build bersih. Tabel orders kosong, tidak ada skrip atau profil Chrome sisa, git status hanya perubahan Fase 6B.
Laporkan ringkas: file berubah, nama test per butir, koordinat DOM, hasil ukuran transfer, dan daftar hal yang butuh keputusan saya.
````

---

## FASE 6C: Satu Pesanan Aktif per Pembeli

Jalankan setelah Fase 6B di-commit. Pastikan docs/PRD.md (Bagian 4.4b, FR-16 s/d FR-21), docs/TECH_SPEC.md (Bagian 3, 5.3, 6, 12 nomor 14-19), dan docs/DESIGN_SYSTEM.md (6.3) terbaru sudah menggantikan file lama di folder `docs/`.

````
ATURAN KERAS: bekerja HANYA di D:\Coding\StreamPoint. Dilarang membaca di luar proyek (termasuk log sesi .gemini, clipboard, proyek lain), dilarang menampilkan rahasia, dilarang menebak password atau menyisipkan sesi/otentikasi palsu. Dilarang menghentikan proses (Stop-Process/taskkill) kecuali yang kamu mulai sendiri dalam tugas ini. Jangan git commit. Jangan menghapus order yang bukan kamu buat sendiri dalam tugas ini (order lokal milik saya mungkin ada; jika kamu perlu tabel orders kosong untuk verifikasi, tanyakan dulu). Scratch hanya di storage/ dan dihapus setelah dipakai.

Baca PRD 4.4b, FR-16 s/d FR-21, TECH_SPEC 5.3, 6, 12 (nomor 14-19), DESIGN_SYSTEM 6.3.

ATURAN BISNIS: selama pembeli punya pesanan yang belum selesai dibayar, ia tidak boleh membuat pesanan baru (layanan sama maupun berbeda). Pesanan aktif = PENDING yang belum melewati payment_expires_at, dan VERIFYING. PAID, EXPIRED (termasuk PENDING yang waktunya sudah lewat walau scheduler belum jalan), dan CANCELLED tidak memblokir. Pembeli yang sama = nomor WA sama setelah normalisasi, ATAU sesi browser yang memegang pesanan aktif (owned_invoices) walau nomor diganti.

TUGAS:
1. Scope baru di model Order: countsAsActiveForBuyer (PENDING dengan payment_expires_at > now(), atau VERIFYING; tanpa batas order_type/quota_date). Migration baru: index (customer_phone, status, payment_expires_at) bila belum ada.
2. CreateOrder (inti): pastikan Setting::lockForUpdate() berlaku untuk SEMUA pembuatan order (RENT dan BUY), bukan hanya RENT, agar pengecekan ini berurutan. Di dalam transaksi dan sebelum cek kuota/stok, cek pesanan aktif berdasarkan nomor ternormalisasi DAN invoice di session owned_invoices. Lempar ActiveOrderExistsException(invoiceCode, ownedBySession). Pemeriksaan idempotency_key dilakukan SEBELUM ini sehingga request ulang yang sama mengembalikan invoice yang sama dan tidak kena penolakan.
3. CheckoutController: terjemahkan ActiveOrderExistsException ke error validasi (422) pada form. Jika ownedBySession true: pesan "Kamu masih punya pesanan yang belum selesai (INV-...). Selesaikan pembayaran atau batalkan dulu." beserta kode invoice untuk tautan Lanjutkan Pembayaran. Jika false (hanya cocok lewat nomor): pesan umum TANPA kode invoice, mis. "Nomor ini masih punya pesanan yang belum selesai. Tunggu sampai selesai atau gunakan Cek Pesanan." Untuk VERIFYING sebutkan bahwa pembayaran sedang diverifikasi.
4. Aksi CancelOrderByBuyer + rute POST /invoice/{invoiceCode}/cancel (throttle 5/menit): hanya pemilik (session owned_invoices atau sudah verifikasi nomor WA), hanya status PENDING dan belum melewati waktu, dalam transaksi + lockForUpdate, lepas kuota dan unit akun, tulis order_events dengan aktor "buyer", status CANCELLED. Tolak VERIFYING dan PAID dengan pesan jelas.
5. ReactivateOrder (admin): tolak jika nomor yang sama punya pesanan aktif lain, dengan pesan jelas di UI admin.
6. Frontend: dari shared props pendingOrder yang sudah ada, nonaktifkan tombol checkout (termasuk sticky bottom bar) di halaman layanan dengan alasan tertulis dan tautan Lanjutkan Pembayaran (untuk VERIFYING: pesan menunggu verifikasi), sesuai DESIGN_SYSTEM 6.3. Tampilkan error server inline di Langkah 4. Tambahkan tombol "Batalkan Pesanan" (Danger kecil) dengan modal konfirmasi pada invoice PENDING, tidak tampil untuk VERIFYING/PAID. Setelah batal, pembeli bisa memesan lagi.
7. Perluas command dev:race-test (jika sudah ada; jika belum ada, buat dengan guard local-only dan database terpisah *_race, jangan menyentuh database `streampoint`) dengan Skenario E: 8 proses serentak dengan nomor WA yang sama ke varian berbeda; tepat 1 order berhasil. Laporkan 5 putaran.
8. Test (feature) sesuai TECH_SPEC 12 nomor 14-19: order kedua nomor sama ditolak saat PENDING (layanan sama dan beda) dan saat VERIFYING; berhasil setelah PAID/EXPIRED/CANCELLED; PENDING lewat waktu tanpa scheduler tidak memblokir; format nomor berbeda dianggap sama; sesi sama nomor beda ditolak; sesi beda nomor beda diizinkan; kode invoice hanya untuk pemilik sesi; CancelOrderByBuyer (pemilik saja, PENDING saja, melepas kuota dan unit, aktor buyer, throttle); ReactivateOrder ditolak bila ada pesanan aktif lain; idempotency_key sama tidak kena penolakan.
9. Verifikasi: php artisan test, npm run types:check, npm run build bersih; uji manual di browser: buat satu order PENDING, coba order lain (layanan sama dan beda) lalu pastikan ditolak, batalkan, lalu order lagi berhasil. Setelah itu kembalikan data seperti sebelumnya (hapus hanya order yang kamu buat). Tidak ada public/hot atau skrip sisa.
Laporkan ringkas: file berubah, nama test per butir, hasil race-test Skenario E, dan batasan yang kamu temukan.
````

---

## FASE 6D: Perbaikan Ukuran Bundle dan Pembersihan Data Uji

````
ATURAN KERAS: sama dengan Fase 6C (hanya di D:\Coding\StreamPoint, tanpa membaca di luar proyek, tanpa menghentikan proses yang bukan milikmu, tanpa git commit, jangan menghapus order yang bukan kamu buat tanpa bertanya).

1. Ukuran bundle JS. Total JS beranda terukur 2,275,498 bytes (~2.17 MB) pada Fase 6B, padahal build awal proyek sekitar 172 KB (gzip ~53 KB). Jalankan npm run build, tampilkan daftar chunk dengan ukuran mentah dan gzip, identifikasi penyebabnya (mis. impor ikon lucide-react dengan wildcard/namespace atau pencarian ikon dinamis berdasarkan nama string, pustaka admin ikut terbundel ke halaman publik, atau source map ikut terhitung). Perbaiki: impor ikon bernama saja (peta ikon eksplisit), pastikan halaman diresolusi secara lazy per halaman (import.meta.glob tanpa eager), pisahkan kode admin dari bundel halaman publik, hapus dependensi starter kit yang tidak terpakai. Target: JS awal halaman beranda <= 250 KB gzip dan tidak ada chunk tunggal publik > 150 KB gzip. Laporkan sebelum dan sesudah (ukuran mentah dan gzip per chunk), dan ukur ulang transfer beranda lewat Performance API (bedakan transferSize dan encodedBodySize).
2. Pastikan hasil build tidak menyertakan source map di produksi (build.sourcemap false) kecuali memang diminta.
3. Command artisan `shop:purge-test-orders` untuk membersihkan data uji sebelum toko dibuka: tampilkan jumlah order, order_events, dan unit akun yang terkait; minta konfirmasi interaktif (atau --force); hapus order dan order_events lalu kembalikan unit akun yang RESERVED/SOLD/RENTED menjadi AVAILABLE (order_id dan rented_until dikosongkan), dalam satu transaksi; juga hapus bukti bayar terkait dari disk privat. Hanya berjalan bila diberi opsi --i-understand. Jangan dijalankan otomatis. Tulis test (database terpisah/SQLite) dan dokumentasikan di README. Catatan: jumlah "terjual" dan badge Terlaris dihitung dari order PAID, jadi order uji harus dihapus sebelum toko live.
4. Ringkas hasil: test, types:check, build bersih; tidak ada file sisa. Jangan menjalankan shop:purge-test-orders terhadap database lokal saya.
````

---

## FASE 6E: Rapikan Panel Admin

Jalankan setelah Fase 6C di-commit. Pastikan docs/DESIGN_SYSTEM.md terbaru (Bagian 6.23, 6.33, dan checklist akhir) sudah menggantikan file lama di folder `docs/`.

````
ATURAN KERAS: bekerja HANYA di D:\Coding\StreamPoint. Dilarang membaca di luar proyek (termasuk log sesi .gemini, clipboard, proyek lain), dilarang menampilkan rahasia, dilarang menebak password atau menyisipkan sesi/otentikasi palsu atau parameter khusus screenshot. Dilarang menghentikan proses kecuali yang kamu mulai sendiri. Jangan git commit. Jangan menghapus order atau data milik saya. Scratch hanya di storage/ dan dihapus setelah dipakai.

MASALAH YANG DITEMUKAN (dari screenshot /admin): layout admin kita ter-render DI DALAM layout bawaan starter kit, sehingga ada dua navigasi (sidebar starter "NamaToko / Platform / Dashboard / Repository / Documentation" dan header admin dengan 8 tab), dua nama brand ("NamaToko" dan "StreamPoint"), tautan sisa starter kit (Repository, Documentation, logo Laravel), menu atas yang patah ke dua baris ("Stok Akun", "Metode Pembayaran"), dan isi dashboard yang membingungkan (strip status mengulang angka kartu, kartu "Menunggu Bayar" berisi "Total 3 pesanan hari ini", angka besar berfont mono bernol bercoret, VERIFYING yang sudah berjam-jam tampil biasa).

Baca DESIGN_SYSTEM.md Bagian 6.23, 6.24, 6.33, 11, 12.

TUGAS:
1. Satukan layout. Di resources/js/app.tsx (resolver layout) pastikan halaman `admin/*` TIDAK lagi memakai layout bawaan starter kit. Semua halaman yang hanya bisa diakses admin memakai SATU AdminLayout: halaman admin, dan juga halaman pengaturan akun starter kit (settings/profile, password, appearance, two-factor) serta dashboard bawaan. Pertahankan nama rute dan semua test yang ada; rute /dashboard bawaan boleh mengalihkan ke /admin (perbarui test bila perlu). Hapus komponen starter kit yang menjadi tidak terpakai (app-sidebar, app-header, nav-footer dengan Repository/Documentation, nav-user bawaan, logo Laravel) dan pastikan tidak ada string "Repository", "Documentation", "Platform", atau tautan ke repo/dokumentasi starter kit yang tersisa di resources/js (tampilkan hasil grep).
2. Bangun ulang AdminLayout sesuai 6.33: sidebar tetap 240px di desktop (>= 1024px) dengan grup Operasional (Dashboard, Order + lencana jumlah VERIFYING), Katalog (Produk, Stok Akun, Banner), Toko (Metode Pembayaran, Pengaturan); bagian bawah: Lihat Toko, Akun (profil dan keamanan/2FA), ThemeToggle, Keluar. Di mobile: bilah atas 56px + laci menu dengan fokus terkunci dan Esc menutup. SATU tombol menu saja. Brand memakai store_name dengan chip "Admin". Tautan lompat ke konten, nav dengan aria-label, aria-current pada item aktif.
3. Lencana jumlah VERIFYING: kirim lewat shared props Inertia HANYA untuk pengguna admin terautentikasi (satu query count, dibungkus closure/lazy), tidak pernah ke pengunjung publik. Tambahkan test: guest dan non-admin tidak menerima prop itu.
4. Komponen bersama: PageHeader, StatCard, FormSection, FlashBanner (role status/alert, ikon + teks, di atas konten). Terapkan ke SEMUA halaman admin: dashboard, order (index, show), produk (index, create, edit), stok akun, metode pembayaran, banner (index, create, edit), pengaturan.
5. Dashboard: StatCard berangka font sans + tabular-nums (mono hanya untuk kode invoice dan nominal); kartu kuota menampilkan "Terpakai X dari Y" + progress tanpa dua angka bertumpuk; kartu Menunggu Bayar dengan keterangan yang jelas ("Belum dibayar, kedaluwarsa dalam 15 menit"); hanya kartu Perlu Verifikasi > 0 yang berborder info; strip status hanya memuat status yang tidak ada di kartu (Kedaluwarsa, Dibatalkan) bergaya teks sekunder; tabel order VERIFYING: kolom waktu berwarna warning jika >= 30 menit, indikator "Ada bukti" / "Tanpa bukti", baris dapat diklik.
6. Halaman Pengaturan (panjang): bagi menjadi bagian (Identitas, Kuota, Notifikasi, Tampilan Katalog, Sosial) memakai FormSection, dengan daftar tautan bagian (kiri di desktop, atas di mobile) dan tombol Simpan sticky saat ada perubahan. Jangan mengubah nama field atau perilaku validasi.
7. Mobile: semua tabel admin menjadi daftar kartu pada < 768px (order, produk, stok, banner, metode pembayaran). Tidak boleh ada scroll horizontal pada halaman.
8. Konsistensi: varian tombol dan modal konfirmasi seragam, keadaan kosong seragam, semua teks UI berbahasa Indonesia (tidak ada sisa "Toggle Sidebar", "Platform", dsb.), semua warna lewat token (tanpa hex), kedua mode tema.
9. Verifikasi: (a) cek lewat DOM bahwa tiap halaman admin hanya memiliki satu elemen navigasi utama dan satu tombol menu mobile; (b) di 375px periksa document.scrollingElement.scrollWidth <= window.innerWidth untuk setiap halaman admin dan tampilkan tabelnya; (c) pastikan stylesheet termuat (tanpa net::ERR, tidak ada public/hot); (d) screenshot tiap halaman admin (dashboard, order index, order show, produk index, produk edit, stok akun, metode pembayaran, banner index, pengaturan) di mode terang dan gelap pada 375px dan 1366px, simpan di storage/screenshots dan laporkan jalurnya; (e) php artisan test, npm run types:check, npm run build bersih; tidak ada skrip atau profil Chrome sisa, git status hanya perubahan ini.
Laporkan ringkas: file berubah, hasil grep string sisa starter kit, tabel overflow 375px, dan hal yang butuh keputusan saya.
````

---

## FASE 6F: QA Visual Akhir dan Laporan Akhir yang Akurat

Jalankan setelah Fase 6E (dan 6D bila belum) selesai.

````
ATURAN KERAS: bekerja HANYA di D:\Coding\StreamPoint. Dilarang membaca di luar proyek (termasuk log sesi .gemini, clipboard, proyek lain), dilarang menampilkan rahasia, dilarang menebak password atau menyisipkan sesi/otentikasi palsu atau parameter khusus screenshot. Dilarang menghentikan proses kecuali yang kamu mulai sendiri. Jangan git commit. Jangan menghapus order atau data milik saya, dan JANGAN menjalankan shop:purge-test-orders pada database saya. Untuk data ekstrem gunakan transaksi yang di-rollback atau database terpisah (*_qa) dan skrip sementara di storage/ yang dihapus setelah dipakai.

TUJUAN: memastikan tampilan rapi di semua halaman dan keadaan, memperbaiki cacat visual yang ditemukan (tanpa fitur baru), dan menghasilkan laporan akhir yang hanya memuat fakta yang sudah diverifikasi.

A. Verifikasi status fase sebelumnya (tampilkan bukti, jangan mengklaim):
1. Fase 6E: grep resources/js untuk "Repository", "Documentation", "Platform", dan tautan ke repo/dokumentasi starter kit; hitung lewat DOM jumlah navigasi utama dan tombol menu di tiap halaman admin (harus satu); pastikan /dashboard mengalihkan ke /admin. Jika belum dikerjakan, kerjakan sesuai Fase 6E di docs/TASK_PROMPT.md.
2. Fase 6D: tampilkan ukuran JS (mentah dan gzip) per chunk dari npm run build dan transfer beranda dari Performance API (transferSize dan encodedBodySize). Target: JS awal beranda <= 250 KB gzip. Jika belum tercapai, kerjakan sesuai Fase 6D. Pastikan source map produksi mati.

B. Matriks QA visual. Screenshot disimpan di storage/screenshots dengan stylesheet termuat (tanpa net::ERR, tanpa public/hot), tanpa bypass login.
Halaman dan keadaan:
- Beranda: dengan banner dan pengumuman; tanpa banner; layanan tanpa sampul; nama layanan 60 karakter; judul banner dua baris penuh; nol layanan; satu layanan; filter tanpa hasil; bagian Sedang Kosong; kuota penuh.
- Halaman layanan: sewa terbuka, sewa penuh, stok habis, ada pesanan aktif (checkout terkunci), nomor WA tidak valid, error server inline.
- Invoice: PENDING (timer normal, <3 menit, <1 menit), VERIFYING, PAID (kredensial tersembunyi dan terbuka), EXPIRED, CANCELLED.
- Cek Pesanan: kosong, ada hasil, error, kena rate limit.
- Syarat, Privasi, 404, login.
- Admin: dashboard (nol data dan berisi), order index dan show (tiap status), produk index dan edit, stok akun, metode pembayaran, banner, pengaturan.
Setiap halaman di mode terang dan gelap, 375px dan 1366px, preset emerald. Tambahan: beranda dan invoice PENDING di preset teal, blue, dan mono.
Pemeriksaan otomatis lewat DOM pada setiap kombinasi dan laporkan sebagai tabel lulus/gagal:
(a) tidak ada overflow horizontal (scrollWidth <= innerWidth);
(b) teks panjang terpotong dengan ellipsis atau membungkus rapi, tidak keluar dari kartu;
(c) di 375px semua tombol dan tautan punya area sentuh >= 44px (daftar yang kurang);
(d) kontras AA untuk semua node teks, dihitung dari computed style dengan rumus WCAG (abaikan elemen disabled);
(e) fokus keyboard terlihat pada setiap elemen interaktif (tab melalui halaman dan ukur outline atau ring);
(f) tidak ada error atau warning konsol;
(g) gambar dengan URL rusak jatuh ke fallback.

C. Perbaiki cacat yang ditemukan (hanya visual dan UX: spacing, pemotongan teks, ukuran sentuh, kontras, fokus, fallback gambar, keadaan kosong). Tulis daftar cacat dan perbaikan (sebelum dan sesudah) beserta hasil ukur ulang.

D. Verifikasi keakuratan sebelum menulis laporan. Periksa tiap klaim berikut terhadap kode nyata dan koreksi:
1. Verifikasi nomor WA untuk membuka kredensial invoice: memakai nomor lengkap ternormalisasi (sesuai spesifikasi) atau hanya 4 digit terakhir? Jika 4 digit, itu regresi keamanan: kembalikan ke nomor lengkap dan tambah test.
2. Rentang kode unik harus 100-999 (bukan 1-999).
3. Konfigurasi Telegram ada di .env (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID), bukan di tabel settings dan bukan di panel admin.
4. Tidak ada status REJECTED atau REACTIVATED: reject menghasilkan CANCELLED, aktifkan kembali memindahkan EXPIRED ke PENDING atau VERIFYING.
5. Kolom order_events yang benar-benar ada (apakah menyimpan user agent?).
6. Apakah products punya kolom counter penjualan, atau jumlah terjual dihitung dari order PAID?
7. Opsi pengurutan katalog yang benar-benar ada.
8. Nama dan alasan sebenarnya dari dua test yang dilewati.
9. Versi sebenarnya: php -v, composer show laravel/framework inertiajs/inertia-laravel, npm ls react @inertiajs/react tailwindcss.
10. Hapus header X-XSS-Protection (usang), pertahankan header lain, perbarui test.
11. Laporan tidak boleh mencantumkan password default akun admin. Cukup sebutkan nilainya berasal dari ADMIN_EMAIL dan ADMIN_PASSWORD di .env.

E. Tulis docs/LAPORAN_AKHIR.md hanya dengan fakta terverifikasi: status jujur (apa yang selesai, apa yang belum: Telegram diisi pemilik, hosting dan deploy, data asli, purge order uji, uji MySQL asli), tabel hasil QA visual (halaman x keadaan x mode, lulus atau gagal, jalur screenshot), ukuran bundle (JS dan CSS), hasil test (jumlah dan dua test yang dilewati), hasil race test (angka per skenario), dan keputusan yang masih terbuka. Hindari klaim promosi ("production-ready", "mutakhir", "superior") kecuali bisa diukur. Tanpa emoji.

F. php artisan test, npm run types:check, npm run build bersih; tidak ada skrip, profil Chrome, atau cookie sisa; git status hanya perubahan ini.
Laporkan ringkas: tabel lulus/gagal QA, daftar cacat dan perbaikan, hasil butir D satu per satu, dan jalur screenshot.
````

---

## FASE 7: Tampilan Premium (Hero Fungsional, Halaman Layanan dan Invoice v2)

Jalankan setelah Fase 6E dan 6D selesai (agar layout admin dan ukuran bundle sudah rapi sebelum menambah komponen). Pastikan docs/DESIGN_SYSTEM.md (v3.3), docs/PRD.md, dan docs/TECH_SPEC.md terbaru sudah menggantikan file lama di folder `docs/`. Fase 6F (QA visual dan laporan akhir) dijalankan sesudahnya.

````
ATURAN KERAS: bekerja HANYA di D:\Coding\StreamPoint. Dilarang membaca di luar proyek (termasuk log sesi .gemini, clipboard, proyek lain), dilarang menampilkan rahasia, dilarang menebak password atau menyisipkan sesi/otentikasi palsu atau parameter khusus screenshot. Dilarang menghentikan proses kecuali yang kamu mulai sendiri. Jangan git commit. Jangan menghapus order atau data milik saya. Dilarang mengunduh gambar atau menyalin teks/aset dari situs lain; semua ikon dari lucide-react, semua teks ditulis sendiri. Scratch hanya di storage/ dan dihapus setelah dipakai.

Baca DESIGN_SYSTEM.md v3.3 (Bagian 0, 1, 6.2, 6.6, 6.17, 6.18, 6.20, 6.22, 6.34 s/d 6.39, 11, 12), PRD 5.1 sampai 5.3, TECH_SPEC bagian "Data hero dan statistik".

TUGAS:
1. Migration baru: settings.stats_min_orders (unsigned smallint default 20, 0 = sembunyikan). Tambahkan ke form Pengaturan admin (bagian Tampilan Katalog) dengan validasi 0 sampai 1000.
2. Data publik (StorefrontController): available_services_count, verification_median_minutes (median selisih event VERIFYING ke PAID di order_events, 30 hari terakhir, null bila < 10 sampel, dibulatkan ke atas kelipatan 5, cache 10 menit), stats {completed_orders, active_services} dengan aturan ambang di TECH_SPEC (selain itu null). Tanpa N+1, tanpa kolom sensitif.
3. Hero Fungsional (6.2): komponen Hero, tinggi tetap 160px (desktop) dan maks 140px (mobile), dua kolom di desktop (judul 24px, subjudul, tombol Lihat Layanan dan Cek Pesanan, panel status 3 baris, mosaik logo maks 6 dengan tint merek tanpa rotasi dan tanpa gradien), versi mobile ringkas dengan baris chip status yang dapat digulir. Menggantikan pita intro HANYA bila tidak ada banner aktif; banner tetap menggantikan hero bila ada. Baris yang datanya null tidak tampil. Teks judul dan subjudul ditulis sendiri dan dapat diubah lewat konstanta di resources/js/data (bukan hardcode tersebar).
4. Pola judul seksi (6.34) diterapkan ke semua seksi beranda, dengan ritme jarak 48/32px.
5. Statistik nyata (6.38) di awal seksi Kenapa Beli di Sini: hanya kartu yang datanya tidak null; jika semua null, baris hilang. Jangan menampilkan angka di bawah ambang.
6. Halaman layanan v2 (6.36): header band bersampul dengan logo 64px menumpang, chip Garansi/ketersediaan/estimasi; PackageOption v2 (grid 2 kolom desktop, ikon durasi, harga mono, "≈ Rp X/hari" untuk paket sewa dari price ÷ (duration_hours ÷ 24), badge "Paling hemat per hari" hanya bila >= 2 paket sewa pada varian dengan harga per hari terendah); ringkasan sticky di kolom kanan desktop (top: 72px); penanda langkah 1 sampai 4 yang berubah centang saat terisi. Jangan mengubah logika checkout, kuota, atau aturan satu pesanan aktif.
7. Stepper status (6.35): komponen OrderStepper dengan pemetaan PENDING, VERIFYING, PAID, EXPIRED, CANCELLED sesuai dokumen; dipakai di invoice dan hasil Cek Pesanan. Label teks dan ikon, aria-label dan aria-current="step".
8. Invoice v2 (6.37): urutan elemen sesuai dokumen, progress bar waktu 4px di bawah countdown (warna sesuai ambang), QRIS di kotak putih maks 280px, tiga langkah singkat berangka, tautan Hubungi Admin via WhatsApp (wa.me dengan teks awal berisi kode invoice; disembunyikan bila admin_whatsapp kosong), toast "Tersalin" 2 detik yang tidak menutup info pembayaran. Pada PAID kartu kredensial naik ke posisi atas.
9. Gerak (6.39): token --dur-fast dan --dur; bilah progres navigasi Inertia 2px warna --accent; skeleton untuk grid katalog saat reload parsial; semua dimatikan oleh prefers-reduced-motion. Tanpa animasi dekoratif.
10. Test: stats dan median null di bawah ambang dan benar di atas ambang (median dihitung dari order_events uji); harga per hari dan badge hemat (kasus 1 paket, >= 2 paket, setengah hari); pemetaan stepper untuk kelima status; props publik tidak memuat kolom sensitif; batas query storefront; tombol hubungi admin tersembunyi tanpa admin_whatsapp.
11. Verifikasi (CSS termuat, tanpa public/hot, tanpa bypass login): (a) lewat DOM, dengan bar pengumuman dan hero aktif bersamaan: di 375x667 bar kuota penuh, di 1366x768 bar kuota dan baris produk pertama penuh, tampilkan koordinat; (b) tinggi hero 160px desktop dan <= 140px mobile; (c) tidak ada overflow horizontal di 375px pada beranda, halaman layanan, invoice, dan Cek Pesanan; (d) kontras semua warna baru dihitung dari computed style; (e) ukuran JS awal beranda (gzip) dilaporkan dan tidak melampaui target Fase 6D; (f) screenshot di storage/screenshots: beranda (hero default tanpa banner, dan dengan banner), halaman layanan v2 (dengan dan tanpa sampul), invoice PENDING, VERIFYING, PAID, EXPIRED, Cek Pesanan; mode terang dan gelap; 375px dan 1366px; laporkan jalurnya; (g) php artisan test, npm run types:check, npm run build bersih; tidak ada skrip atau profil Chrome sisa; git status hanya perubahan Fase 7.
Laporkan ringkas: file berubah, nama test per butir, koordinat DOM, ukuran JS, dan jalur screenshot.
````

---

## FASE 7B: Kebersihan Token Warna dan Pemeriksa Kontras Otomatis

Jalankan setelah Fase 7. Pastikan docs/DESIGN_SYSTEM.md terbaru (Bagian 2.1, 2.2, 6.40, dan checklist akhir) sudah menggantikan file lama di folder `docs/`.

````
ATURAN KERAS: bekerja HANYA di D:\Coding\StreamPoint. Dilarang membaca di luar proyek (termasuk log sesi .gemini, clipboard, proyek lain), dilarang menampilkan rahasia, dilarang menebak password atau menyisipkan sesi/otentikasi palsu. Dilarang menghentikan proses kecuali yang kamu mulai sendiri. Jangan git commit. Jangan menghapus order atau data milik saya. Scratch hanya di storage/ dan dihapus setelah dipakai.

KONTEKS: perbaikan warna terakhir menemukan bahwa banyak kelas (`text-text-3`, `bg-success`, ...) dipakai tanpa terdaftar di @theme, sehingga tidak menghasilkan warna. Perbaikannya benar tetapi masih ada masalah: (1) --text-muted terang #71717A hanya 4.40:1 di atas --surface-2 dan 4.17:1 di atas --surface-hover (gagal AA) padahal dipakai luas lewat `text-text-3` dan placeholder; (2) tombol destruktif memakai kelas palet langsung `bg-red-600 text-white hover:bg-red-700 active:bg-red-800` (melanggar aturan "hanya token"), dan angka kontras di laporan (5.50:1) tidak sesuai hitungan (4.83:1, tetap lolos AA); (3) switch mati hanya berborder --border sehingga batas komponen nyaris tak terlihat.

Baca DESIGN_SYSTEM.md Bagian 2.1, 2.2, 6.15, 6.21, 6.40, 11, 12.

TUGAS:
1. Sinkronkan token di resources/css/app.css dengan docs/DESIGN_SYSTEM.md 2.1 dan 2.2: --text-muted terang #666670 dan gelap #8E8E93; tambahkan --danger-solid (#DC2626), --danger-solid-hover (#B91C1C), --on-danger (#FFFFFF), --on-warning (terang #FFFFFF, gelap #09090B), --success (terang #047857, gelap #10B981). Daftarkan semuanya di @theme (--color-danger-solid, --color-danger-solid-hover, --color-on-danger, --color-on-warning, --color-success, --color-text-3 sebagai alias --text-muted, dst.). Laporkan setiap perbedaan antara app.css dan dokumen (tabel sebelum dan sesudah).
2. Ganti varian destruktif dan semua tombol hapus/tolak (button.tsx dan modal admin) ke `bg-danger-solid text-on-danger hover:bg-danger-solid-hover`. Tombol penuh warning ke `bg-warning text-on-warning`. Tidak ada kelas palet langsung yang tersisa.
3. Sapu seluruh resources/js dan resources/css: temukan kelas palet Tailwind langsung (bg-/text-/border-/ring-/fill-/stroke-/placeholder-/divide-/outline- dengan red, green, emerald, amber, yellow, orange, sky, blue, teal, rose, neutral, zinc, gray, slate, stone, white, black), hex, rgb()/hsl() literal, lalu ganti dengan token. Pengecualian yang diizinkan hanya: kotak QRIS berlatar putih (jadikan satu utilitas `.qris-box` yang terdokumentasi) dan overlay (--overlay). Tampilkan daftar semua yang diganti dan semua pengecualian.
4. Switch (6.40): semua switch di admin memakai komponen Switch tunggal yang dipakai bersama: mati = latar --surface-2, border 1px --text-muted, kenop --text-2; hidup = latar --accent, kenop --on-accent; label teks "Aktif"/"Nonaktif" di samping; role="switch" dan aria-checked; area sentuh >= 44px. Ganti 8 form yang memakai pola lama.
5. Skrip `scripts/check-tokens.mjs` + npm script `check:tokens`: gagal (exit 1) bila menemukan kelas palet langsung/hex/rgb di resources/js dan resources/css di luar allowlist (.qris-box dan --overlay), dan bila ada kelas warna bertoken (awalan warna seperti bg-, text-, border-, ring-, fill-, stroke-, placeholder-, divide-, outline-, shadow-, decoration-, caret-) yang namanya tidak terdaftar di @theme (abaikan utilitas non-warna yang dikenal seperti text-sm, text-center, border-t, border-2, bg-cover, ring-2, dll. lewat daftar putih yang masuk akal). Tampilkan hasil run bersih dan contoh satu pelanggaran buatan yang terdeteksi (lalu hapus).
6. Skrip `scripts/check-contrast.mjs` + npm script `check:contrast`: parse app.css (:root, .dark, dan html[data-accent=...]), hitung rasio WCAG 2.1, dan gagal bila ada pasangan < 4.5:1: --text, --text-2, --text-muted di atas --bg, --surface, --surface-2, --surface-hover; --accent-text di atas --bg dan --surface; --on-accent di atas --accent dan --accent-hover; --on-warning di atas --warning; --on-danger di atas --danger-solid dan --danger-solid-hover; --success, --warning, --danger, --info di atas --surface dan --surface-2 (badge); semua kombinasi untuk keempat preset (emerald, teal, blue, mono) di mode terang dan gelap. Cetak tabel hasil. Ditambah pemeriksaan non-teks >= 3:1 untuk border switch mati (--text-muted di atas --surface-2). Dokumentasikan kedua skrip di README sebagai pemeriksaan wajib sebelum rilis.
7. Hitung dan laporkan ulang angka kontras yang sebelumnya dilaporkan salah (on-warning, destructive, success) dari hasil check:contrast, bukan dari perkiraan.
8. npm run check:tokens, npm run check:contrast, php artisan test, npm run types:check, npm run build semuanya bersih. Tidak ada skrip atau file sisa, git status hanya perubahan ini.
Laporkan ringkas: tabel perbedaan token, daftar kelas yang diganti, daftar pengecualian, output check:tokens dan check:contrast.
````

---

## FASE 7C: Plat Logo, Pemeriksa Kontras Lengkap, dan Pemeriksa Kata Klaim

Jalankan setelah Fase 7B. Pastikan docs/DESIGN_SYSTEM.md terbaru (Bagian 2.1, 6.8, 6.9, 6.10, dan checklist akhir) dan docs/PRD.md terbaru sudah menggantikan file lama di folder `docs/`.

````
ATURAN KERAS: bekerja HANYA di D:\Coding\StreamPoint. Dilarang membaca di luar proyek (termasuk log sesi .gemini, clipboard, proyek lain), dilarang menampilkan rahasia, dilarang menebak password atau menyisipkan sesi/otentikasi palsu. Dilarang menghentikan proses kecuali yang kamu mulai sendiri. Jangan git commit. Jangan menghapus order atau data milik saya. Scratch hanya di storage/ dan dihapus setelah dipakai.

KONTEKS: Fase 7B dan penyederhanaan beranda (FAQ jadi modal, seksi Metode Pembayaran dihapus dari badan halaman, logo pembayaran dipindah ke footer) sudah dikerjakan. Masalah yang tersisa:
(1) Wadah logo metode pembayaran diganti dari bg-white ke bg-surface (Footer.tsx, storefront/Index.tsx, admin payment-methods). Itu mengembalikan masalah "gelap di atas gelap": logo yang dirancang untuk latar putih (mis. logo bank berwarna gelap) menjadi tak terlihat di mode gelap. DESIGN_SYSTEM 2.1 dan 6.8 kini menetapkan pengecualian terdokumentasi `.logo-plate` (plat putih).
(2) check:contrast hanya memuat 28 pasangan, dan untuk keempat preset hanya satu pasangan (on-accent pada accent). Pasangan paling penting (accent-text pada bg dan surface, on-accent pada accent-hover, warna status pada surface-2, text-2 pada surface-2 dan surface-hover) belum diperiksa, jadi klaim "semua preset lolos" belum terbukti.
(3) Laporan menyebut judul/label "Metode Pembayaran Resmi". Kata klaim seperti "resmi" dilarang di DESIGN_SYSTEM 9.

Baca DESIGN_SYSTEM.md Bagian 2.1, 6.8, 6.9, 6.10, 6.21, 9, 11, 12.

TUGAS:
1. `.logo-plate`: buat utilitas di app.css (latar putih, padding 4px 8px, border 1px --border, radius 6px) sebagai pengecualian terdokumentasi kedua selain `.qris-box`. Terapkan pada SEMUA tempat logo metode pembayaran ditampilkan (footer, kolom pembayaran di beranda bila masih ada, Langkah 3 checkout, invoice, preview admin), dan pada logo layanan bila logonya diunggah dengan latar transparan. Tambahkan `.logo-plate` ke allowlist check-tokens. Logo harus terbaca di mode gelap: uji dengan logo uji berwarna gelap (buat file PNG gelap sementara di storage/, hapus sesudahnya) dan laporkan hasilnya lewat screenshot mode gelap.
2. Perluas `scripts/check-contrast.mjs` ke matriks penuh, dibaca langsung dari app.css, untuk kedua mode: --text, --text-2, --text-muted pada --bg, --surface, --surface-2, --surface-hover (12 pasangan per mode); untuk TIAP preset (emerald, teal, blue, mono): --accent-text pada --bg dan --surface, --on-accent pada --accent dan --accent-hover (4 pasangan per preset per mode); --on-warning pada --warning; --on-danger pada --danger-solid dan --danger-solid-hover; --success, --warning, --danger, --info pada --surface dan --surface-2 (badge); border switch mati (>= 3:1). Cetak jumlah total pasangan (harus >= 70) dan tabel lengkap. Bila ada yang < batas, perbaiki token (dan docs/DESIGN_SYSTEM.md) sesuai aturan preset, lalu hitung ulang. Laporkan hasil apa adanya, termasuk kegagalan yang ditemukan sebelum diperbaiki.
3. Skrip `scripts/check-copy.mjs` + npm script `check:copy`: pindai string UI di resources/js (teks JSX, literal string, file data seperti faq.ts, benefits.ts) dan view Blade untuk kata klaim terlarang (tidak peka huruf besar/kecil, batas kata): resmi, legal, terpercaya, terbaik, termurah, "100%", "nomor 1". Gagal bila ada, dengan allowlist file:baris bila ada konteks sah (mis. kebijakan privasi/syarat dengan kata "resmi" pada kalimat hukum yang disetujui pemilik; tampilkan daftar allowlist). Perbaiki semua temuan (hapus kata "Resmi" dari judul/label metode pembayaran dll.). Dokumentasikan di README bersama check:tokens dan check:contrast.
4. Modal Tanya Jawab (DESIGN_SYSTEM 6.9): verifikasi dan lengkapi perilaku: fokus terkunci, Esc dan klik luar menutup, fokus kembali ke pemicu, /#faq membuka modal saat dimuat dan hash dihapus (history.replaceState) saat ditutup, kotak cari memfilter pertanyaan dan jawaban, keadaan kosong dengan Reset, tautan WhatsApp disembunyikan bila admin_whatsapp kosong. Tambahkan test (feature atau komponen) untuk logika filter jika ada fungsi murni, dan uji manual lewat DOM untuk perilaku fokus.
5. Pastikan beranda tidak memuat sisa seksi lama (Metode Pembayaran sebagai seksi tersendiri, akordeon FAQ penuh) dan urutan seksi sesuai DESIGN_SYSTEM 1. Ukur ulang lewat DOM dengan bar pengumuman dan hero/banner aktif: di 375x667 bar kuota penuh, di 1366x768 bar kuota dan baris produk pertama penuh; tampilkan koordinat.
6. npm run check:tokens, check:contrast, check:copy, php artisan test, npm run types:check, npm run build semuanya bersih. Tidak ada skrip atau file sisa, git status hanya perubahan ini.
Laporkan ringkas: lokasi `.logo-plate` yang diterapkan, jumlah pasangan kontras dan kegagalan awal (bila ada), daftar kata klaim yang diperbaiki, hasil uji logo gelap, dan koordinat DOM.
````

---

## FASE 8 (Nanti): Ulasan dan Rating Asli

Dikerjakan setelah toko punya transaksi sungguhan. Rencana, belum dibuatkan prompt:

1. Tabel `reviews`, tautan ulasan di halaman invoice setelah status `PAID`, satu ulasan per order (rating 1 sampai 5 dan teks pendek), moderasi admin sebelum tampil. Tanpa testimoni palsu.
2. Rating dan jumlah ulasan di kartu produk dan halaman layanan, **hanya tampil bila ulasan yang disetujui ≥ ambang** yang diatur pemilik.
3. Ringkasan rating (rata-rata dihitung dari ulasan nyata) di seksi statistik, dengan syarat tampil yang sama.
4. Pelaporan ulasan tidak pantas oleh admin, dan penghapusan atas permintaan sah pembeli.

---

## FASE 9A: Fondasi Jenis Pengiriman (Produk Digital Serbaguna)

Jalankan setelah Fase 6E dan 7C. Pastikan docs/PRD.md (Bagian 4.9, FR-22 s/d FR-30), docs/TECH_SPEC.md (Bagian 16), dan docs/DESIGN_SYSTEM.md (6.41 s/d 6.45) terbaru sudah menggantikan file lama di folder `docs/`. Fase 9A hanya meletakkan fondasi dan menyempurnakan jenis `STOCK`; undangan di 9B, manual di 9C.

````
ATURAN KERAS: bekerja HANYA di folder proyek StreamPoint (direktori kerja saat ini). Dilarang membaca di luar proyek (termasuk log sesi, clipboard, proyek lain), dilarang menampilkan rahasia, dilarang menebak password atau menyisipkan sesi/otentikasi palsu. Dilarang menghentikan proses yang bukan kamu mulai sendiri. Jangan git commit. Jangan menghapus order atau data milik saya. Perubahan skema HANYA lewat migration (tidak ada ALTER TABLE atau pemulihan skema saat request). Scratch hanya di storage/ dan dihapus setelah dipakai.

KONTEKS: toko akan menjual produk digital apa pun, bukan hanya akun streaming. Cara pengiriman menyesuaikan jenis varian: STOCK (kredensial/kode dari stok), INVITE (undangan ke email pembeli, mis. paket keluarga YouTube Premium), MANUAL (diproses admin). Baca PRD 4.9 dan FR-22 s/d FR-30, TECH_SPEC Bagian 16 (16.1 sampai 16.6), DESIGN_SYSTEM 6.41, 6.42, 6.43 (bagian STOCK), 6.45.

TUGAS FASE 9A:
0. Audit mekanisme "self-healing skema" yang ditambahkan sebelumnya (commit "Self-Healing Kolom Varian"): tunjukkan kodenya. Jika ada kode yang mengubah skema database saat request atau saat boot (ALTER TABLE/Schema::table di luar migration), hapus dan ganti dengan migration biasa, dengan penjelasan. Pastikan `php artisan migrate` dari database kosong menghasilkan skema lengkap.
1. Migration baru (bukan mengubah yang lama): product_variants: delivery_type (string default 'STOCK'), buyer_fields (json nullable), stock_fields (json nullable), delivery_instructions (text nullable), eta_text (string 60 nullable), stock_limit (unsigned int nullable), duration_hours menjadi nullable (varian RENT tetap wajib durasi lewat validasi); orders: buyer_inputs (json nullable), fulfillment_status (string nullable), delivery_message (text nullable), fulfilled_at (datetime nullable). Semua varian yang ada otomatis STOCK dengan stock_fields default preset Akun (Email, Password secret, Profil, PIN secret). (Kolom slot_host_id dan tabel slot_hosts dibuat di 9B.)
2. Enum DeliveryType (STOCK, INVITE, MANUAL) dan FulfillmentStatus dengan canTransitionTo(to, type) sesuai TECH_SPEC 16.1. Cast di model.
3. AvailabilityService::forVariant sesuai 16.3. Untuk 9A implementasikan STOCK (perilaku sekarang, termasuk unit terikat varian atau per produk+kind) dan kerangka INVITE/MANUAL yang mengembalikan "tidak tersedia" sampai 9B/9C. Refactor StorefrontController, ProductController (props), hero (layanan tersedia), bagian "Sedang Kosong", dan CreateOrder agar memakai service ini. Semua tes yang ada harus tetap lolos tanpa mengubah maknanya (regresi STOCK).
4. BuyerFieldsSchema (value object + pembangun aturan validasi) sesuai 16.6: tipe email/text/url(https)/textarea/select, maks 5 kolom, kunci snake_case, label <= 60, nilai <= 255 (textarea <= 1000), allowed_domains pencocokan persis, tolak kolom yang labelnya meminta kata sandi. CreateOrder/CheckoutRequest memvalidasi buyer_inputs terhadap varian yang dipilih (varian tanpa buyer_fields tetap seperti sekarang) dan menyimpannya di orders.buyer_inputs. Pesan Telegram order.created menyertakan buyer_inputs (di-escape).
5. stock_fields: tampilan kredensial di invoice (CredentialBox) menjadi generik, membaca label dan flag secret dari stock_fields varian (posisional terhadap nilai terdekripsi dipisah "|"). Impor massal di admin: jumlah kolom per baris divalidasi terhadap skema varian terpilih; laporkan nomor baris yang tidak valid tanpa membatalkan yang valid. Preset skema: Akun streaming (Email, Password, Profil, PIN), Kode/voucher (Kode), Link (URL). Jika varian mengganti skema setelah ada unit, tampilkan peringatan (unit lama tetap dibaca posisional).
6. Admin: form varian (DESIGN_SYSTEM 6.45) untuk jenis STOCK: editor skema kolom stok, editor kolom data pembeli (maks 5, peringatan jangan meminta kata sandi), instruksi untuk pembeli, estimasi, durasi opsional untuk varian beli. Pilihan jenis INVITE dan MANUAL belum bisa dipilih (tampil nonaktif dengan keterangan "segera") sampai 9B/9C.
7. Frontend publik: kolom dinamis di Langkah 2 checkout (DESIGN_SYSTEM 6.42), ringkasan Langkah 4 menampilkan data yang akan dikirim, penanda jenis pengiriman pada kartu dan varian (6.41), dan DeliveryPanel di invoice dengan cabang STOCK (6.43). Jangan mengubah aturan kuota, aturan satu pesanan aktif, atau alur pembayaran.
8. Test: regresi STOCK (suite yang ada tetap hijau); BuyerFieldsSchema per tipe, batas, domain email, penolakan kolom kata sandi; AvailabilityService STOCK (unit terikat varian dan per produk+kind); impor dengan skema kustom (jumlah kolom salah dilaporkan per baris); invoice STOCK memakai label dari stock_fields; props publik tidak memuat buyer_inputs orang lain; tamu dan non-admin tidak bisa memanggil aksi admin.
9. Verifikasi: php artisan test, npm run check:tokens, check:contrast, check:copy (jika ada), npm run types:check, npm run build bersih; uji manual di browser: pesan varian STOCK lama (hasilnya persis seperti sebelumnya), lalu varian STOCK dengan satu kolom kustom (mis. "Nama profil") dan satu varian skema "Kode"; tidak ada skrip atau file sisa; git status hanya perubahan 9A.
Laporkan ringkas: hasil audit self-healing, file berubah, nama test per butir, dan hal yang butuh keputusan saya.
````

---

## FASE 9B: Produk Undangan (Paket Keluarga, Slot Host)

Jalankan setelah Fase 9A lolos dan di-commit.

````
ATURAN KERAS: bekerja HANYA di folder proyek StreamPoint (direktori kerja saat ini). Dilarang membaca di luar proyek (termasuk log sesi, clipboard, proyek lain), dilarang menampilkan rahasia, dilarang menebak password atau menyisipkan sesi/otentikasi palsu. Dilarang menghentikan proses yang bukan kamu mulai sendiri. Jangan git commit. Jangan menghapus order atau data milik saya. Perubahan skema HANYA lewat migration (tidak ada ALTER TABLE atau pemulihan skema saat request). Scratch hanya di storage/ dan dihapus setelah dipakai.

KONTEKS: lanjutan 9A. Implementasikan jenis INVITE sesuai PRD 4.9 dan TECH_SPEC 16.2 sampai 16.9, DESIGN_SYSTEM 6.41 sampai 6.45. Contoh: varian "YouTube Premium Family Invite 1 Bulan": pembeli mengisi email Google, bayar, admin mengirim undangan dari akun host, pembeli melihat status di invoice.

TUGAS FASE 9B:
1. Migration baru: tabel slot_hosts (product_id FK, variant_id FK nullable, label 80, capacity unsigned smallint, notes text nullable, renews_at date nullable, status ACTIVE/DISABLED, timestamps) dan kolom orders.slot_host_id (FK nullable) serta orders.slot_released_at (datetime nullable) beserta indeks (slot_host_id, slot_released_at). Model, factory, dan relasi.
2. AvailabilityService (INVITE): slot kosong = jumlah (kapasitas host ACTIVE dikurangi pesanan aktif pada host itu), pesanan aktif = slot_released_at null dan (PENDING belum expired, VERIFYING, atau PAID). Varian INVITE tanpa slot kosong ditandai Habis dengan alasan tertulis dan masuk bagian "Sedang Kosong".
3. CreateOrder untuk INVITE (dalam kunci settings yang sama, setelah idempotensi dan aturan satu pesanan aktif): buyer_inputs wajib memuat email (kolom email otomatis untuk varian INVITE, dengan allowed_domains opsional); tolak bila email yang sama (tanpa peka huruf besar/kecil) punya pesanan aktif untuk varian yang sama; pilih host ACTIVE dengan slot kosong terbanyak (lockForUpdate, urut slot kosong lalu id) dan isi slot_host_id; bila tidak ada, OutOfStockException. RejectOrder, CancelOrderByBuyer, dan ExpireOrders mengisi slot_released_at. ReactivateOrder memesan ulang slot (gagal bila penuh). ApproveOrder untuk INVITE menetapkan fulfillment_status AWAITING_ACTION.
4. Aksi pemenuhan (TECH_SPEC 16.5) masing-masing dalam transaksi + lockForUpdate pada order, memakai canTransitionTo, dan mencatat order_events dengan aktor: MarkInviteSent (access_starts_at = now, access_expires_at = now + durasi bila ada, fulfilled_at), ResendInvite (hanya event), MarkInviteActive (admin dan pembeli), ReleaseSlot (slot_released_at, status ENDED), ReassignHost (pindah ke host lain dengan slot kosong, lepas slot lama), UpdateBuyerEmail (hanya pemilik invoice, hanya sebelum INVITE_SENT, throttle 5/menit, email unik per varian tetap berlaku).
5. Admin: aktifkan pilihan jenis INVITE di form varian; halaman Host & Slot (CRUD host, progress terpakai/total, tanggal perpanjangan, tabel anggota aktif per host dengan email tersamar sebagian dan tombol Bebaskan, peringatan jangan menyimpan kata sandi host); panel pemenuhan di detail order PAID (DESIGN_SYSTEM 6.44) dengan aksi Undangan Terkirim, Kirim Ulang, Tandai Aktif, Pindah Host, Bebaskan Slot (modal konfirmasi); kartu Perlu Tindakan di dashboard dan lencana menu Order = VERIFYING + AWAITING_ACTION.
6. Publik: DeliveryPanel cabang INVITE (6.43): InviteStatusCard dengan status, email tujuan, tombol Ubah Email (modal), instruksi (delivery_instructions), estimasi (eta_text), tombol "Sudah saya terima", tautan Hubungi Admin; polling status seperti invoice yang ada. Cek Pesanan menampilkan email hanya tersamar sampai terverifikasi. Rute: POST /invoice/{code}/email dan POST /invoice/{code}/active, otorisasi sama dengan invoice (sesi pemilik atau nomor WA terverifikasi).
7. Perintah terjadwal: fulfillment:remind-pending (tiap 5 menit, AWAITING_ACTION > 30 menit, sekali per pesanan, ditandai di order_events) dan fulfillment:remind-removals (tiap jam, akses INVITE lewat tetapi slot belum dibebaskan, sekali per pesanan). Notifikasi Telegram aman saat token kosong (log ringkas).
8. dev:race-test: tambahkan Skenario F (database *_race terpisah, jangan menyentuh database streampoint): satu host kapasitas 1 slot kosong, 8 proses serentak dengan nomor dan email berbeda; tepat 1 berhasil. Skenario G: 6 proses serentak dengan email yang sama ke varian yang sama dan nomor berbeda; tepat 1 berhasil. 5 putaran masing-masing; laporkan outputnya.
9. Test sesuai TECH_SPEC 16.9: slot terakhir, email unik per varian, AvailabilityService INVITE (host nonaktif, slot belum dibebaskan tetap terhitung), siklus FulfillmentStatus (sah dan tidak sah), edit email hanya sebelum INVITE_SENT, ReleaseSlot dan ReassignHost, pengingat sekali per pesanan, props publik tidak memuat buyer_inputs orang lain, tamu dan non-admin ditolak, regresi STOCK tetap hijau.
10. Verifikasi: semua test dan skrip check:* bersih; uji manual: buat produk YouTube Premium Family dengan satu host berkapasitas 2, pesan dua kali dengan email berbeda (ketiga harus ditolak karena penuh), approve, tandai terkirim, ubah email sebelum terkirim lalu setelahnya (harus terkunci), bebaskan slot dan pastikan slot kembali tersedia; hapus hanya data yang kamu buat; screenshot di storage/screenshots (CSS termuat): form varian INVITE, halaman Host & Slot, panel pemenuhan, invoice INVITE di tiga status; terang dan gelap, 375px dan 1366px.
Laporkan ringkas: file berubah, nama test per butir, output race-test Skenario F dan G, dan jalur screenshot.
````

---

## FASE 9C: Produk Manual dan Generalisasi Tampilan

Jalankan setelah Fase 9B lolos dan di-commit.

````
ATURAN KERAS: bekerja HANYA di folder proyek StreamPoint (direktori kerja saat ini). Dilarang membaca di luar proyek (termasuk log sesi, clipboard, proyek lain), dilarang menampilkan rahasia, dilarang menebak password atau menyisipkan sesi/otentikasi palsu. Dilarang menghentikan proses yang bukan kamu mulai sendiri. Jangan git commit. Jangan menghapus order atau data milik saya. Perubahan skema HANYA lewat migration (tidak ada ALTER TABLE atau pemulihan skema saat request). Scratch hanya di storage/ dan dihapus setelah dipakai.

KONTEKS: lanjutan 9A dan 9B. Implementasikan jenis MANUAL dan ubah teks dan tampilan agar tidak lagi hanya bicara "akun streaming". Baca PRD 4.9, TECH_SPEC 16.4, 16.5, 16.8, DESIGN_SYSTEM 6.41 sampai 6.45.

TUGAS FASE 9C:
1. MANUAL: aktifkan pilihan di form varian (kolom data pembeli maks 5, instruksi, estimasi, stock_limit opsional). AvailabilityService (MANUAL): tak terbatas bila stock_limit null, selain itu stock_limit dikurangi pesanan aktif. ApproveOrder menetapkan AWAITING_ACTION. Aksi CompleteManualOrder: wajib delivery_message (maks 1000 karakter, teks biasa), fulfillment_status DONE, fulfilled_at, event, dalam transaksi. DeliveryPanel cabang MANUAL (ManualStatusCard: ringkasan data yang dikirim, status, pesan admin; tautan https dapat diklik dan disalin; tanpa HTML). Panel pemenuhan admin: modal Selesaikan dengan pesan untuk pembeli.
2. Pengingat: fulfillment:remind-pending mencakup MANUAL. Perintah buyer-data:anonymize (harian): kosongkan buyer_inputs dan samarkan delivery_message pada pesanan berakhir lebih dari N hari (setting buyer_data_retention_days default 90, 0 = nonaktif; kolom baru lewat migration, tampil di Pengaturan admin). Test dan dokumentasi di README.
3. Generalisasi teks dan tampilan: ubah semua teks publik yang hanya menyebut "akun" atau "streaming" menjadi netral produk digital tanpa menghilangkan konteks: judul dan subjudul Hero (konstanta di resources/js/data, tetap dapat diubah), langkah 5 Cara Pesan ("Produk dikirim: akun, kode, undangan, atau hasil layanan muncul di invoice"), FAQ (tambahkan pertanyaan tentang undangan email, salah email, dan produk yang diproses manual; pertanyaan lain disesuaikan), BenefitsSection ("Akun di halaman invoice" menjadi "Pengiriman di halaman invoice"), disclaimer footer (tetap non-afiliasi, sebut "penyedia layanan atau merek terkait" bukan hanya streaming), meta judul/deskripsi, dan label kategori. Semua teks ditulis sendiri, tanpa klaim terlarang (npm run check:copy bersih).
4. Kartu produk dan halaman layanan: penanda jenis pengiriman (6.41) dan "Cara terima" pada tiap varian; filter kategori tetap berdasarkan products.category bebas (admin dapat membuat kategori seperti Streaming, Produktivitas, Game, Software). Seed demo (hanya local, idempoten): satu varian per jenis (Stok akun, Stok kode, Undangan keluarga dengan satu host, Manual dengan satu kolom "ID tujuan") tanpa data nyata.
5. Test: MANUAL (availability dengan dan tanpa stock_limit, CompleteManualOrder wajib pesan dan batas panjang, transisi tidak sah ditolak, pesan admin tampil sebagai teks biasa, tidak ada HTML yang di-render), anonimisasi (hanya pesanan lewat batas, 0 menonaktifkan), regresi STOCK dan INVITE tetap hijau.
6. Verifikasi dan QA visual: tampilan semua tiga jenis di beranda, halaman layanan, checkout (Langkah 2 dan 4), invoice (PENDING dan PAID per jenis), Cek Pesanan, dan admin (form varian, panel pemenuhan, Host & Slot), terang dan gelap, 375px dan 1366px; tidak ada overflow horizontal di 375px; kontras dan token bersih (check:tokens, check:contrast, check:copy); php artisan test, npm run types:check, npm run build bersih; tidak ada file sisa. Laporkan jalur screenshot dan tabel overflow.
Laporkan ringkas: file berubah, nama test per butir, perubahan teks yang dilakukan (sebelum dan sesudah), dan keputusan yang butuh jawaban saya.
````