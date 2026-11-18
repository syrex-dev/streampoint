# Product Requirements Document (PRD)

**Nama Proyek:** Platform Produk Digital Gaya Top-Up (akun, undangan, kode, dan layanan)
**Versi:** 2.0
**Arsitektur:** Single-Page Checkout, Guest Checkout (pembeli tanpa login)
**Stack:** Laravel + React + Inertia.js (detail di `TECH_SPEC.md`)
**Bahasa Antarmuka:** Bahasa Indonesia

---

## 1. Tujuan Produk

> **Cakupan diperluas:** toko ini tidak hanya menjual akun streaming. Produk digital apa pun dapat dijual, dan **cara pengiriman menyesuaikan produknya**: kredensial akun atau kode (stok), undangan ke email pembeli (mis. paket keluarga YouTube Premium), atau layanan yang diproses admin. Aturan lengkap ada di Bagian 4.9. Bagian lain yang menyebut "akun" berlaku penuh untuk jenis Stok dan dibaca "produk" untuk jenis lain.

Website untuk menjual dan menyewakan akun streaming premium (Netflix, YouTube Premium, Spotify, Prime Video, dll.) dengan antarmuka bergaya web top-up game: cepat, padat informasi, dan langsung checkout dalam satu halaman.

Tiga hal yang harus berhasil:

1. **Alur pembayaran jelas.** Pembeli selalu tahu: berapa yang harus dibayar, ke mana, batas waktunya, dan apa status pesanannya.
2. **Notifikasi instan ke admin.** Setiap ada order masuk, admin langsung menerima pesan di Telegram (utama, gratis) atau WhatsApp (opsional).
3. **Kuota sewa harian maksimal 3 penyewa.** Jika kuota penuh, semua paket sewa terkunci otomatis sampai reset pukul 00:00 WIB atau sampai ada slot yang dilepas.

## 2. Ruang Lingkup MVP

**Termasuk:**
- Storefront, halaman detail layanan dengan checkout 4 langkah, halaman invoice, halaman Cek Transaksi.
- Pembayaran manual (QRIS statis / transfer bank / e-wallet) dengan verifikasi oleh admin.
- Panel admin ringkas: order, stok akun, produk, metode pembayaran, pengaturan kuota.
- Notifikasi Telegram, dengan driver WhatsApp yang bisa dipasang belakangan.

**Tidak termasuk (lihat Bagian 10):** payment gateway otomatis, akun pembeli, kupon/voucher, perpanjangan otomatis, multi-admin.

## 3. Persona

| Persona | Karakter | Kebutuhan Utama |
| :-- | :-- | :-- |
| **Pembeli (guest)** | Mayoritas buka dari HP, tidak mau daftar akun, ingin cepat | Pilih paket, isi nomor WA, bayar, langsung dapat akun. Tahu status pesanan kapan saja. |
| **Admin (pemilik)** | Satu orang, memantau dari HP lewat notifikasi | Tahu ada order masuk seketika, cek bukti bayar, approve dengan 1 klik, kelola stok akun. |

---

## 4. Aturan Bisnis Utama

### 4.1 Mode Pembelian

Setiap layanan memiliki dua kategori paket:

| Kategori | Kode | Pilihan Durasi | Pembatasan |
| :-- | :-- | :-- | :-- |
| **Sewa Harian** | `RENT` | 12 Jam, 1 Hari (24 Jam), 2 Hari (48 Jam), 3 Hari (72 Jam) | Tunduk pada **kuota harian maksimal 3 penyewa** dan ketersediaan unit akun sewa. |
| **Beli Akun** | `BUY` | Bulanan (1 Bulan, 3 Bulan, dst.) sesuai varian | Tidak terkena kuota harian. Dibatasi stok unit akun. |

Harga ditentukan per varian (`ProductVariant`) dan dikelola admin.

### 4.2 Kuota Sewa Harian

**Definisi presisi** (agar tidak ambigu saat implementasi):

- **Kuota bersifat global**: 3 transaksi sewa per hari untuk seluruh layanan, bukan 3 per layanan.
- **Hari kuota (`quota_date`)** adalah tanggal **saat pesanan dibuat**, dalam zona waktu `Asia/Jakarta` (WIB). Reset setiap pukul `00:00` WIB. Pesanan pukul 23:59 memakai kuota hari itu, meskipun masa sewanya berlanjut ke hari berikutnya.
- **Pesanan yang menghabiskan slot** (dihitung aktif):
  - `PENDING` yang belum melewati `payment_expires_at`
  - `VERIFYING`
  - `PAID`
- **Pesanan yang tidak menghabiskan slot:** `EXPIRED`, `CANCELLED`. Slot langsung kembali terbuka.
- Batas default 3, bisa diubah admin di Pengaturan. Admin juga bisa membuat **override per tanggal** (misalnya menaikkan jadi 5 saat ramai, atau 0 untuk menutup sewa hari itu).

**Perilaku saat kuota penuh (3/3):**

- Semua paket `RENT` otomatis *disabled* dan menampilkan: **"Kuota Sewa Hari Ini Penuh (3/3) — Reset 00:00 WIB"**.
- Paket `BUY` tetap aktif selama stok ada.
- Jika slot terbuka kembali (ada pesanan `EXPIRED`/`CANCELLED`), halaman memperbarui diri tanpa reload manual (polling ringan tiap 30 detik).

**Perlindungan race condition:** dua pembeli yang checkout bersamaan pada slot terakhir tidak boleh sama-sama berhasil. Pengecekan kuota dan pembuatan order wajib atomik (lihat `TECH_SPEC.md` Bagian 5).

### 4.3 Stok & Unit Akun

Setiap pesanan yang sukses harus mengirim kredensial nyata, sehingga sistem harus tahu akun mana yang tersedia.

- **Unit akun** (`product_accounts`) = satu paket kredensial yang dikirim ke satu pembeli (satu akun penuh, atau satu profil+PIN pada akun sharing). Kredensial disimpan terenkripsi.
- Setiap unit dikhususkan untuk satu kategori: `RENT` atau `BUY`.
- **Reservasi saat checkout:** begitu order dibuat, satu unit sesuai kategori dan layanan di-*reserve* untuk order itu. Jika order `EXPIRED`/`CANCELLED`, unit dilepas kembali.
- **Saat `PAID`:** unit `BUY` berubah menjadi `SOLD`. Unit `RENT` menjadi `RENTED` sampai `accessExpiresAt`, lalu otomatis kembali `AVAILABLE`.
- Jika tidak ada unit tersedia untuk suatu layanan, paket menampilkan label **Habis** (terpisah dari status kuota).
- Admin bisa mengganti unit yang di-assign sebelum menekan Approve (misalnya jika akun bermasalah).
- Notifikasi admin saat stok suatu layanan tinggal ≤ 2 unit.

### 4.4 Pembayaran

- Metode MVP: **QRIS statis**, **transfer bank**, **e-wallet** (DANA, dll.). Semua dikelola admin di panel (nama, nomor, atas nama, gambar QRIS).
- Verifikasi **manual** oleh admin. Tidak ada biaya payment gateway.
- **Kode unik** 3 digit ditambahkan ke total agar admin mudah mencocokkan mutasi. Total nominal setiap order aktif harus **unik** (dua order aktif tidak boleh punya total yang sama).
- **Batas bayar 15 menit** sejak order dibuat. Setelah itu otomatis `EXPIRED`.
- Pembeli menekan **"Saya Sudah Bayar"** (bukti transfer opsional tetapi disarankan) → status `VERIFYING` → admin dinotifikasi.
- **Pembayaran terlambat:** jika pembeli sudah transfer tetapi order telah `EXPIRED`, admin dapat melakukan **Aktifkan Kembali** selama kuota dan stok masih tersedia. Jika tidak tersedia, admin menangani refund secara manual di luar sistem.
- Order `VERIFYING` **tidak** kedaluwarsa otomatis (pembeli sudah bayar). Admin diingatkan lewat notifikasi jika ada order `VERIFYING` lebih dari 30 menit.

### 4.4b Satu Pesanan Aktif per Pembeli

Selama pembeli masih punya pesanan yang **belum selesai dibayar**, ia **tidak boleh membuat pesanan baru**, baik untuk layanan yang sama maupun layanan lain. Tujuannya mencegah satu orang menahan kuota atau stok dengan banyak pesanan.

- **Pesanan aktif (memblokir):** `PENDING` yang belum melewati `payment_expires_at`, dan `VERIFYING`.
- **Tidak memblokir:** `PAID`, `EXPIRED` (termasuk `PENDING` yang waktunya sudah lewat walau scheduler belum berjalan), dan `CANCELLED`. Setelah pesanan lunas atau berakhir, pembeli bebas memesan lagi.
- **Siapa yang dianggap "pembeli yang sama"** (tanpa login): (1) nomor WhatsApp yang sama setelah dinormalisasi (`0812…`, `+62812…`, `62812…` dianggap sama), atau (2) sesi browser yang sama yang masih memegang pesanan aktif walau nomornya diganti.
- **Pembatalan oleh pembeli:** pembeli bisa menekan **Batalkan Pesanan** pada invoice yang masih `PENDING` (kuota dan unit akun langsung dilepas). Pesanan `VERIFYING` tidak bisa dibatalkan pembeli, harus diselesaikan atau ditolak admin.
- **Pesan penolakan:** jika pesanan aktif milik sesi yang sama, tampilkan kode invoice dan tombol **Lanjutkan Pembayaran**. Jika hanya cocok lewat nomor WA (bukan sesi ini), tampilkan pesan umum **tanpa kode invoice** (mencegah orang lain membaca pesanan milik nomor tertentu).
- **Tombol checkout** dinonaktifkan di antarmuka dengan alasan tertulis ("Selesaikan pesanan INV-… terlebih dahulu"). Server tetap menjadi penentu akhir.
- **Admin:** "Aktifkan Kembali" pada order `EXPIRED` juga ditolak jika nomor yang sama masih punya pesanan aktif lain.
- **Batasan jujur:** tanpa akun, aturan ini bisa dihindari dengan nomor lain dan browser lain. Karena itu aturan ini bukan satu-satunya pengaman: batas bayar 15 menit, rate limit checkout, dan kuota global tetap berlaku.

### 4.5 Siklus Status Order

| Dari | Ke | Pemicu |
| :-- | :-- | :-- |
| `PENDING` | `VERIFYING` | Pembeli menekan "Saya Sudah Bayar" |
| `PENDING` | `EXPIRED` | Lewat 15 menit (scheduler) |
| `PENDING` | `CANCELLED` | Admin membatalkan |
| `VERIFYING` | `PAID` | Admin menekan Approve |
| `VERIFYING` | `CANCELLED` | Admin menekan Reject (wajib isi alasan) |
| `EXPIRED` | `PENDING` / `VERIFYING` | Admin menekan Aktifkan Kembali (jika kuota & stok ada) |

Transisi di luar tabel ini **ditolak** oleh sistem. Setiap perubahan status dicatat di log audit (`order_events`).

### 4.6 Guest Checkout & Keamanan Akses Invoice

Pembeli tidak perlu login, tetapi halaman invoice memuat kredensial akun, jadi aksesnya harus dijaga:

- **Kode Invoice** berformat `INV-YYYYMMDD-XXXXXX` dengan 6 karakter acak (tidak berurutan dan tidak bisa ditebak).
- Setelah checkout, pembeli langsung dapat melihat invoice-nya (dikenali lewat session di browser yang sama).
- Dari perangkat lain, lewat **Cek Transaksi**: pembeli memasukkan **Kode Invoice + Nomor WhatsApp** yang cocok. Hanya dengan keduanya, kredensial ditampilkan.
- Pencarian hanya dengan Nomor WhatsApp menampilkan daftar pesanan (kode invoice, layanan, status) **tanpa kredensial**.
- Percobaan pencarian dibatasi (rate limit) untuk mencegah tebak-tebakan.

### 4.7 Notifikasi Admin (Gratis)

- **Utama: Telegram Bot API.** Gratis, instan, tanpa biaya bulanan.
- **Opsional: WhatsApp** lewat gateway (Fonnte/WAHA) sebagai driver terpisah yang bisa diaktifkan lewat `.env`.
- Kegagalan notifikasi **tidak boleh** menggagalkan checkout. Pengiriman berjalan di luar alur request dengan percobaan ulang otomatis.

| Event | Isi Notifikasi |
| :-- | :-- |
| Order baru dibuat | Invoice, layanan, paket, total, nomor WA, sisa kuota |
| Pembeli konfirmasi bayar | Invoice, total, link bukti bayar, tombol buka halaman admin |
| Kuota harian penuh | Pemberitahuan 3/3 tercapai |
| Stok menipis | Layanan dan sisa unit |
| Order `VERIFYING` > 30 menit | Pengingat |

### 4.8 Aturan Sewa & Garansi (Template Default)

Teks berikut ditampilkan di kolom kiri halaman detail dan **dapat diedit admin per layanan**:

- Akun hanya untuk dipakai sendiri sesuai profil yang diberikan.
- Dilarang mengubah email, password, PIN, atau nama profil.
- Masa sewa dihitung sejak akun dikirim (`accessStartsAt`), bukan sejak pembayaran.
- Jika akun bermasalah selama masa sewa/garansi, hubungi admin via WhatsApp dengan menyebut kode invoice. Solusi: penggantian akun atau kompensasi sisa masa aktif.
- Pembayaran yang sudah diverifikasi dan akun yang sudah dikirim tidak dapat dibatalkan, kecuali akun bermasalah.

### 4.9 Jenis Pengiriman Produk

Setiap **varian** punya satu **jenis pengiriman** yang menentukan arti stok, data yang diminta dari pembeli, tindakan admin, dan tampilan setelah bayar. Satu layanan boleh punya varian berbeda jenis (mis. YouTube Premium: "Akun Sharing 1 Hari" berjenis Stok, dan "Family Invite 1 Bulan" berjenis Undangan).

| Jenis | Kode | Contoh | Stok berarti | Data dari pembeli | Setelah `PAID` | Tampilan pembeli |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| **Stok** | `STOCK` | Akun streaming, voucher, license key, link unduhan | Unit stok (satu baris berisi kolom berlabel, terenkripsi) | WhatsApp (+ kolom kustom bila ada) | Terkirim otomatis (unit di-assign) | Kotak kredensial/kode dengan tombol Salin |
| **Undangan** | `INVITE` | YouTube Premium Family, Google One, Canva Team, paket keluarga lain | Slot kosong pada **host** (akun paket milik admin) | **Email penerima undangan** + WhatsApp | Admin mengirim undangan lalu menandai terkirim | Status: menunggu undangan, undangan terkirim, aktif |
| **Manual** | `MANUAL` | Top up, jasa, aktivasi lewat admin, produk custom | Tak terbatas (opsional batas antrean) | Kolom kustom (maks 5) + WhatsApp | Admin memproses lalu mengisi pesan hasil | Status + pesan dari admin |

**Aturan:**
1. **Kolom data pembeli** (`buyer_fields`, per varian, maks 5): tipe `email` (opsional batasi domain, mis. `gmail.com`), `text`, `url` (hanya `https`), `textarea`, dan `select`. Dilarang meminta kata sandi akun pembeli. Validasi di server, dan nilai selalu ditampilkan dengan escape.
2. **Email undangan:** pembeli boleh mengubahnya selama undangan **belum dikirim**. Satu email tidak boleh punya dua pesanan aktif untuk varian yang sama.
3. **Slot undangan:** kapasitas host (mis. 5) dikurangi pesanan aktif. Slot dipesan saat checkout, dilepas saat `EXPIRED` atau `CANCELLED`, dan **tetap terpakai sampai admin menandai anggota sudah dikeluarkan** dari paket (karena kursi aslinya masih terisi).
4. **Status pemenuhan** (`fulfillment_status`) terpisah dari status bayar. `STOCK`: `DELIVERED`. `INVITE`: `AWAITING_ACTION`, `INVITE_SENT`, `ACTIVE`, `ENDED`. `MANUAL`: `AWAITING_ACTION`, `DONE`.
5. **Masa aktif:** dihitung dari saat admin menandai undangan terkirim (`INVITE`) atau saat `PAID` (`STOCK`). Varian beli tanpa durasi berarti tanpa masa berakhir (mis. kode sekali pakai).
6. **Pengingat ke admin (Telegram):** pesanan `AWAITING_ACTION` lebih dari 30 menit, masa akses `INVITE` berakhir tetapi slot belum dibebaskan, dan (opsional) host mendekati tanggal perpanjangan.
7. **Garansi:** `STOCK` mengganti unit, `INVITE` memindahkan pembeli ke host lain lalu mengirim ulang undangan, `MANUAL` diproses ulang.
8. **Kuota sewa harian** hanya berlaku untuk varian bertipe sewa (`RENT`), apa pun jenis pengirimannya.
9. **Risiko:** berbagi atau menjual slot paket keluarga dapat melanggar ketentuan penyedia (mis. syarat satu rumah tangga dan satu negara), sehingga anggota bisa dikeluarkan sewaktu-waktu. Aturan dan garansi harus ditulis jelas di halaman layanan dan FAQ.
10. **Privasi:** email dan data kustom pembeli disimpan. Setelah 90 hari sejak pesanan berakhir, data itu dianonimkan oleh perintah terjadwal (angka hari dapat diatur pemilik).

---

## 5. Alur Pengguna & Halaman

### 5.1 Storefront (`/`)

- **Bar kuota** di paling atas, di atas grid:
  - Tersedia: `Slot sewa hari ini: 2/3 tersisa`
  - Penuh: `Kuota Sewa Hari Ini Penuh (3/3) — Reset 00:00 WIB`
- **Grid katalog layanan:** logo, nama, harga mulai dari, dan badge status (`Tersedia`, `Stok Menipis`, `Habis`, `Sewa Penuh`).
- **Navigasi cepat:** tautan **Cek Pesanan** di header.
- **Filter katalog:** Tipe (Semua/Sewa/Beli) dan Kategori, dijalankan di sisi klien tanpa reload.
- **Banner pesanan belum selesai:** jika sesi pengunjung punya order `PENDING`/`VERIFYING`, tampil tautan **Lanjutkan** ke invoice di semua halaman publik.
- **Seksi tambahan di bawah katalog** (urutan): **Cara Pesan** (5 langkah), **Strip Bantuan** yang membuka modal Tanya Jawab (isi FAQ di 5.6), **Footer** (juga memuat logo metode pembayaran aktif; pilihan lengkap metode tampil di Langkah 3 checkout dan di invoice) (tautan, WhatsApp admin, jam operasional, disclaimer non-afiliasi), dan **tombol bantuan WhatsApp** mengambang.
- **Header:** tautan jangkar (Layanan, Cara Pesan, FAQ), Cek Pesanan, pengalih tema Terang/Gelap/Sistem. Menu hamburger di mobile.
- **Pita intro** ringkas (judul + satu kalimat) boleh ada di atas bar kuota, tanpa hero besar. Bar kuota dan produk tetap harus cepat terlihat tanpa scroll (detail di `DESIGN_SYSTEM.md` Bagian 1).
- Referensi susunan halaman: seakun.id (pola saja, bukan menyalin teks atau aset).
- **Banner** yang dapat diedit admin (judul, subjudul, tombol, gambar opsional, jadwal) tampil di atas bar kuota. Tanpa banner aktif, tampil pita intro.
- **Kartu produk** menampilkan logo layanan yang diunggah admin dengan tint warna merek.
- **Seksi "Kenapa Beli di Sini"** setelah katalog (maks. 6 poin, hanya klaim yang benar sesuai kebijakan toko).
- **Identitas toko** (nama, logo, tagline, preset warna aksen) diatur admin dan tampil di header, footer, dan judul halaman.
- **Katalog bergaya marketplace** (referensi pola: orvaki.com): kartu layanan dengan gambar sampul, badge `Baru`/`Terlaris`, chip `Sewa`/`Beli`/`Garansi`, dan jumlah terjual hanya dari data nyata; pencarian, filter, dan pengurutan di sisi klien; layanan yang stoknya habis dipisah ke bagian "Sedang Kosong".
- **Bar pengumuman** opsional di atas header, **ajakan pesanan custom** opsional sebelum footer, dan **footer** berisi tautan sosial, jam kerja, kontak, dan metode pembayaran.
- Tidak ada rating, jumlah dilihat, atau angka penjualan yang dikarang. Rating dan testimoni baru hadir bersama fitur ulasan asli (Fase 7).
- **Hero fungsional** (menggantikan pita intro saat tidak ada banner): judul, tombol Lihat Layanan dan Cek Pesanan, panel status nyata (slot sewa, layanan tersedia, estimasi verifikasi bila datanya ada), dan mosaik logo layanan.
- **Statistik nyata** (opsional) di seksi keunggulan: jumlah pesanan selesai, layanan aktif, dan median waktu verifikasi. Hanya tampil bila memenuhi ambang yang diatur pemilik toko.
- **Gerak halus fungsional:** bilah progres navigasi, skeleton saat memuat, dan toast salin. Tanpa animasi dekoratif.

### 5.2 Detail Layanan & Checkout 4 Langkah (`/p/{slug}`)

Desktop memakai 2 kolom (kiri: info layanan, syarat sewa/garansi; kanan: 4 langkah). Mobile satu kolom dengan *sticky bottom bar*.

| Langkah | Isi | Validasi |
| :-- | :-- | :-- |
| **1. Pilih Tipe & Paket** | Tab **Sewa Harian** (12 Jam, 1 Hari, 2 Hari, 3 Hari) dan **Beli Akun** (varian bulanan). Harga tampil di setiap opsi. | Satu paket wajib dipilih. Paket `RENT` terkunci jika kuota penuh atau unit habis. |
| **2. Data Penerima** | Nomor WhatsApp aktif (wajib) dan catatan (opsional). | Nomor dinormalisasi ke format `628xxxxxxxxx`. Wajib 10–13 digit setelah kode negara. |
| **3. Metode Pembayaran** | QRIS, transfer bank, e-wallet. Rincian: harga, kode unik, total. | Satu metode wajib dipilih. |
| **4. Ringkasan & Konfirmasi** | Layanan, paket, durasi, nomor WA, metode, total. Tombol **"Beli / Sewa Sekarang"**. | Server memvalidasi ulang kuota dan stok saat tombol ditekan. |

Jika kuota habis tepat saat tombol ditekan, tampilkan pesan error inline dan kunci kembali paket sewa. Jangan pindah halaman.

**Halaman layanan (versi 2):** header bersampul dengan logo, chip garansi dan ketersediaan, paket sewa menampilkan perkiraan harga per hari (dihitung dari harga dan durasi) dan penanda "Paling hemat per hari" bila ada ≥ 2 paket sewa, ringkasan pesanan menempel di desktop, dan penanda langkah 1 sampai 4 yang berubah centang saat terisi.

### 5.3 Invoice (`/invoice/{invoiceCode}`)

Tampilan menyesuaikan status:

| Status | Yang Ditampilkan |
| :-- | :-- |
| `PENDING` | Countdown 15 menit (menonjol), instruksi bayar, QRIS atau nomor rekening dengan tombol **Salin**, total nominal tegas dengan tombol **Salin**, upload bukti (opsional), tombol **Saya Sudah Bayar**. |
| `VERIFYING` | Pesan "Pembayaran sedang diverifikasi admin", estimasi waktu, tombol hubungi admin via WhatsApp. Halaman memperbarui status otomatis (polling). |
| `PAID` | Area pengiriman akun: Email/Username, Password, Profil, PIN (masing-masing dengan tombol Salin), `accessStartsAt`, `accessExpiresAt`, hitung mundur sisa masa sewa, aturan singkat. |
| `EXPIRED` | Info waktu habis, tombol **Buat Pesanan Baru**, petunjuk jika sudah terlanjur transfer (hubungi admin dengan kode invoice). |
| `CANCELLED` | Alasan pembatalan dari admin dan kontak admin. |

**Area pengiriman pada invoice `PAID` mengikuti jenis pengiriman (4.9):** kotak kredensial/kode (`STOCK`), kartu status undangan dengan email tujuan dan tombol ubah email sebelum terkirim (`INVITE`), atau kartu status dengan pesan dari admin (`MANUAL`).

**Penyempurnaan invoice (v2):** indikator langkah (Dibuat, Dibayar, Diverifikasi, Selesai) di semua status, progress bar waktu pembayaran, toast "Tersalin", tiga langkah singkat cara bayar, dan tautan Hubungi Admin via WhatsApp yang membawa kode invoice. Stepper yang sama dipakai pada hasil Cek Transaksi.

### 5.4 Cek Transaksi (`/cek-pesanan`)

Dua mode: **Kode Invoice + Nomor WA** (membuka invoice lengkap), atau **Nomor WA saja** (daftar pesanan tanpa kredensial). Lihat Bagian 4.6.

### 5.5 Panel Admin (`/admin`)

- **Login** sederhana (email + password, session). Tidak ada registrasi publik.
- **Dashboard:** jumlah order hari ini per status, slot sewa terpakai, order menunggu verifikasi (diprioritaskan di atas).
- **Order:** daftar dengan filter status dan pencarian (invoice/nomor WA). Detail order menampilkan bukti bayar, unit akun yang di-assign (dapat diganti), tombol **Approve (Kirim Akun)** dan **Reject (Kembalikan Kuota)** dengan alasan, serta **Aktifkan Kembali** untuk order `EXPIRED`.
- **Produk & Varian:** CRUD layanan, varian, harga, aturan sewa/garansi.
- **Stok Akun:** tambah satu per satu atau impor massal (satu baris per unit: `email|password|profil|pin`), lihat status tiap unit.
- **Metode Pembayaran:** kelola rekening, e-wallet, dan gambar QRIS.
- **Tampilan katalog:** per layanan: gambar sampul, logo, warna merek, dan penanda `Garansi`. Pengaturan: bar pengumuman, tagline, estimasi pengiriman (teks bebas, mis. "setelah verifikasi admin"), ambang tampil jumlah terjual, ajakan pesanan custom, dan tautan sosial (Telegram, Instagram, Threads, TikTok). Per metode pembayaran: logo opsional.
- **Jenis pengiriman per varian:** pilihan Stok, Undangan, atau Manual dengan panel pengaturan sesuai jenis (skema kolom stok, kolom data pembeli, instruksi untuk pembeli, estimasi). **Host & Slot** untuk produk Undangan (label, kapasitas, tanggal perpanjangan, anggota aktif). Detail order `PAID` memiliki **panel pemenuhan**: Undangan Terkirim, Kirim Ulang, Tandai Aktif, Pindah Host, Bebaskan Slot (Undangan), dan Selesaikan dengan pesan untuk pembeli (Manual).
- **Banner:** CRUD banner (judul, subjudul, label dan tautan tombol, gambar, nada warna, urutan, jadwal tayang, aktif/nonaktif). Maksimal 5 banner aktif.
- **Pengaturan:** kuota default, override kuota per tanggal, identitas toko (nama, logo, preset warna aksen), tombol uji notifikasi Telegram.

---

### 5.6 Konten FAQ Default (`resources/js/data/faq.ts`)

Tulis ulang dengan kata-kata sendiri dan sesuaikan dengan kebijakan toko. Jangan menyalin dari situs lain.

| Pertanyaan | Inti Jawaban |
| :-- | :-- |
| Apakah perlu daftar akun? | Tidak. Cukup nomor WhatsApp aktif. Pesanan dilacak lewat Cek Pesanan. |
| Kapan masa sewa mulai dihitung? | Sejak akun dikirim (admin menyetujui pembayaran), bukan sejak transfer. |
| Kenapa ada kuota sewa 3 per hari? | Jumlah penyewa dibatasi agar akun tetap lancar. Kuota reset 00:00 WIB dan bisa terbuka lagi jika ada pembayaran yang kedaluwarsa. |
| Berapa lama batas pembayaran? | 15 menit sejak pesanan dibuat. Lewat itu pesanan otomatis kedaluwarsa. |
| Saya sudah transfer tapi pesanan kedaluwarsa. | Hubungi admin via WhatsApp dengan kode invoice. Jika slot masih ada, pesanan bisa diaktifkan kembali. |
| Metode pembayaran apa saja? | Sesuai metode aktif di halaman pembayaran (QRIS, transfer bank, e-wallet), diverifikasi manual. |
| Akun bermasalah, apa yang harus dilakukan? | Hubungi admin via WhatsApp dengan kode invoice. Solusi: penggantian akun atau kompensasi sisa masa aktif. |
| Apakah boleh mengubah password atau profil? | Tidak. Ubah email, password, PIN, atau nama profil dapat membatalkan garansi. |

### 5.7 Halaman Statis

`/syarat-ketentuan` dan `/kebijakan-privasi`: halaman teks sederhana (isi awal berupa template yang diedit pemilik toko). Dilink dari footer. Footer juga memuat **Jam Operasional** (`settings.business_hours`) dan **disclaimer non-afiliasi** dengan penyedia layanan.

---

## 6. Kebutuhan Fungsional & Kriteria Penerimaan

| ID | Kebutuhan | Kriteria Penerimaan |
| :-- | :-- | :-- |
| FR-01 | Kuota sewa maks. 3 per hari (WIB) | Dengan 3 order aktif hari ini, order `RENT` ke-4 ditolak server dengan pesan kuota penuh. Order `BUY` tetap berhasil. |
| FR-02 | Slot kuota dilepas saat expired/cancel | Setelah 1 dari 3 order menjadi `EXPIRED`, order `RENT` baru bisa dibuat. |
| FR-03 | Reset harian | Pada 00:00 WIB, hitungan kuota kembali 0 untuk tanggal baru. Order pukul 23:59 dihitung di tanggal lama. |
| FR-04 | Anti race condition | Dua request bersamaan pada slot terakhir: tepat satu berhasil. |
| FR-05 | Reservasi unit akun | Order sukses selalu punya satu unit akun ter-reserve. Unit kembali `AVAILABLE` saat order expired/cancel. |
| FR-06 | Total unik | Dua order aktif tidak pernah memiliki `total_amount` yang sama. |
| FR-07 | Expire otomatis | Order `PENDING` lewat 15 menit menjadi `EXPIRED` dalam ≤ 1 menit, dan status juga benar saat dibaca sebelum scheduler berjalan. |
| FR-08 | Notifikasi order baru | Telegram admin menerima pesan dalam hitungan detik setelah order dibuat. Gagal kirim tidak membatalkan order. |
| FR-09 | Konfirmasi bayar | "Saya Sudah Bayar" mengubah status ke `VERIFYING` dan mengirim notifikasi berisi tautan admin. |
| FR-10 | Approve | Approve mengubah status ke `PAID`, mengisi `accessStartsAt` dan `accessExpiresAt` sesuai durasi varian, dan kredensial muncul di invoice. |
| FR-11 | Reject | Reject wajib alasan, melepas kuota dan unit akun. |
| FR-12 | Akses kredensial | Kredensial hanya tampil untuk pemilik sesi atau setelah verifikasi Kode Invoice + Nomor WA. Tidak pernah muncul di daftar pencarian by nomor WA. |
| FR-13 | Bukti bayar privat | File bukti bayar hanya dapat dibuka admin. |
| FR-14 | Override kuota | Admin dapat mengubah batas kuota untuk tanggal tertentu, dan bar kuota di storefront mencerminkannya. |
| FR-15 | Audit | Setiap perubahan status tercatat (siapa, kapan, dari, ke, catatan). |
| FR-16 | Satu pesanan aktif per pembeli | Dengan 1 order `PENDING` (belum expired) atau `VERIFYING` untuk sebuah nomor WA, pembuatan order baru dengan nomor itu (layanan sama atau berbeda) ditolak server. Setelah order tersebut `PAID`, `EXPIRED`, atau `CANCELLED`, pembuatan order baru berhasil. |
| FR-17 | Pembeli memblokir lewat sesi | Sesi yang memegang order aktif tidak bisa membuat order baru walau memakai nomor WA lain. |
| FR-18 | Privasi pesan penolakan | Kode invoice pada pesan penolakan hanya ditampilkan jika order itu milik sesi yang sama. |
| FR-19 | Batalkan oleh pembeli | Pemilik invoice `PENDING` bisa membatalkan. Kuota dan unit akun dilepas, dan status `CANCELLED` tercatat dengan aktor `buyer`. Order `VERIFYING`/`PAID` tidak bisa dibatalkan pembeli. |
| FR-20 | Konkurensi | Dua permintaan checkout bersamaan dengan nomor yang sama: tepat satu berhasil. |
| FR-21 | Idempotensi tidak terblokir | Pengiriman ulang request yang sama (`idempotency_key` sama) mengembalikan invoice yang sama, bukan error pesanan aktif. |
| FR-22 | Jenis pengiriman per varian | Varian berjenis `STOCK`, `INVITE`, atau `MANUAL`. Perilaku checkout, stok, dan invoice mengikuti jenisnya. Varian `STOCK` yang sudah ada berjalan persis seperti sebelumnya. |
| FR-23 | Kolom data pembeli dinamis | Kolom sesuai `buyer_fields` varian tampil di Langkah 2 dan divalidasi server (tipe, wajib, batas panjang, domain email). Nilai tersimpan dan tampil dengan escape. |
| FR-24 | Slot undangan atomik | Dua checkout bersamaan pada slot terakhir sebuah host: tepat satu berhasil. Slot dilepas saat `EXPIRED`/`CANCELLED` dan tetap terpakai sampai admin membebaskannya. |
| FR-25 | Email unik per varian | Email yang sama tidak bisa punya dua pesanan aktif untuk varian undangan yang sama. |
| FR-26 | Edit email sebelum terkirim | Pemilik invoice dapat mengubah email selama `fulfillment_status` belum `INVITE_SENT`, dan perubahan tercatat di `order_events`. Setelah itu terkunci. |
| FR-27 | Siklus pemenuhan | Transisi `fulfillment_status` hanya yang diizinkan per jenis (4.9 butir 4). Transisi lain ditolak dan semuanya tercatat di `order_events`. |
| FR-28 | Pengingat pemenuhan | `AWAITING_ACTION` > 30 menit dan akses `INVITE` yang berakhir tetapi slot belum dibebaskan memicu pengingat Telegram sekali per pesanan. |
| FR-29 | Garansi per jenis | `STOCK`: ganti unit. `INVITE`: pindah host dan kirim ulang. Masa akses tidak berubah. |
| FR-30 | Anonimisasi data pembeli | Perintah terjadwal menganonimkan `buyer_inputs` pada pesanan yang berakhir lebih dari 90 hari lalu (atau angka yang diatur pemilik). |

## 7. Kasus Tepi (Edge Cases)

| Situasi | Perilaku yang Diharapkan |
| :-- | :-- |
| Pembeli menekan tombol checkout dua kali | Hanya satu order terbentuk (tombol dinonaktifkan saat proses + idempotency di server). |
| Pembeli menutup tab sebelum bayar | Order tetap `PENDING` sampai expired. Invoice dapat dibuka lagi lewat Cek Transaksi. |
| Pembeli transfer setelah expired | Admin menerima info dari pembeli, lalu memakai **Aktifkan Kembali** bila masih ada slot dan stok. |
| Unit akun terakhir diambil bersamaan | Satu order berhasil, yang lain mendapat pesan "Stok habis". |
| Admin approve tetapi unit bermasalah | Admin mengganti unit sebelum approve. Unit lama ditandai `DISABLED`. |
| Telegram API down | Job notifikasi diulang otomatis. Kegagalan dicatat di log, order tidak terpengaruh. |
| Masa sewa berakhir | Invoice menampilkan "Masa sewa berakhir". Kredensial disembunyikan. Unit sewa kembali `AVAILABLE`. |
| Nomor WA format tidak standar (`08..`, `+62..`, spasi) | Dinormalisasi otomatis ke `628..`. |
| Pembeli mencoba memesan lagi saat pesanan sebelumnya belum dibayar | Ditolak dengan pesan jelas dan tautan **Lanjutkan Pembayaran** (jika sesi sama). Pembeli bisa membatalkan pesanan `PENDING` agar bisa memesan paket lain. |
| Pembeli mengganti nomor WA untuk memesan lagi di browser yang sama | Tetap ditolak karena sesi masih memegang pesanan aktif. |
| Pesanan `PENDING` sudah lewat 15 menit tetapi scheduler belum berjalan | Tidak memblokir. Status dihitung dari `payment_expires_at`, bukan menunggu cron. |
| Admin mengaktifkan kembali order expired padahal nomor itu punya pesanan aktif lain | Ditolak dengan pesan jelas. |
| Pembeli salah mengetik email undangan | Bisa diubah sendiri dari invoice sampai admin menandai undangan terkirim. Setelah itu hubungi admin (admin dapat memindahkan atau mengirim ulang). |
| Undangan sudah kedaluwarsa di sisi penyedia atau tidak masuk | Admin menekan **Kirim Ulang** atau **Pindah Host**. Tercatat di `order_events`. |
| Masa akses undangan berakhir | Admin diingatkan lewat Telegram untuk mengeluarkan anggota dan menekan **Bebaskan Slot**. Sebelum itu slot tetap terhitung terpakai. |
| Semua host penuh | Varian undangan tampil `Habis` dengan alasan tertulis dan masuk bagian "Sedang Kosong". |
| Pembeli memakai email yang sudah aktif di varian yang sama | Ditolak dengan pesan jelas tanpa membocorkan data pesanan orang lain. |

## 8. Kebutuhan Non-Fungsional

- **Kinerja:** storefront memuat < 2 detik pada koneksi 4G umum. Gambar produk diperkecil dan di-*lazy load* di luar layar awal.
- **Keamanan:** kredensial akun terenkripsi di database. CSRF aktif. Rate limit pada checkout dan pencarian. Upload bukti bayar divalidasi ketat (jenis dan ukuran). Rincian di `TECH_SPEC.md` Bagian 9.
- **Ketersediaan data:** backup database terjadwal (minimal harian).
- **Aksesibilitas:** kontras teks memenuhi WCAG AA, area sentuh ≥ 44px di mobile, fokus keyboard terlihat.
- **Biaya:** seluruh komponen MVP (notifikasi, pembayaran manual) tanpa biaya langganan. Biaya hanya hosting dan domain.

## 9. Metrik Keberhasilan

- Waktu dari buka halaman sampai tombol checkout ditekan < 60 detik.
- Admin menerima notifikasi order < 10 detik setelah order dibuat.
- Tidak pernah ada order `RENT` ke-4 yang lolos pada hari yang sama (tanpa override admin).
- Tidak ada kredensial bocor lewat pencarian atau URL tebakan.

## 10. Di Luar Lingkup MVP (Roadmap)

1. Payment gateway otomatis (Midtrans/Tripay/Xendit) dengan webhook verifikasi.
2. Approve langsung dari tombol di Telegram (webhook bot).
3. Pengiriman kredensial otomatis ke WhatsApp pembeli.
4. Perpanjangan sewa, kupon, dan program referral.
5. Multi-admin dan laporan penjualan.

## 11. Risiko & Catatan

- **Kebijakan platform:** layanan streaming umumnya melarang berbagi atau menjual ulang akun dalam syarat penggunaannya, sehingga akun bisa diblokir sewaktu-waktu. Karena itu aturan garansi/penggantian (Bagian 4.8) harus jelas, dan stok cadangan sebaiknya selalu tersedia.
- **Verifikasi manual** bergantung pada kecepatan admin. Notifikasi dan pengingat `VERIFYING` > 30 menit dirancang untuk memitigasi ini.

## 12. Asumsi & Keputusan Terbuka

Asumsi di bawah dipakai dalam dokumen ini. Ubah jika tidak sesuai:

| # | Asumsi | Alternatif |
| :-- | :-- | :-- |
| A1 | Kuota 3 penyewa bersifat **global** (semua layanan). | Kuota per layanan. |
| A2 | Hari kuota mengikuti **tanggal pembuatan order**. | Mengikuti tanggal mulai sewa. |
| A3 | Satu unit akun hanya dipakai satu pembeli pada satu waktu (unit = satu profil/akun). | Satu akun dibagi ke beberapa profil dengan penghitungan slot. |
| A4 | Admin tunggal. | Multi-admin dengan peran. |
| A5 | Masa sewa mulai saat akun dikirim (approve), bukan saat bayar. | Mulai saat pembeli pertama membuka akun. |