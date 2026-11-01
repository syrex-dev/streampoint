# Design System & UI/UX Guidelines (Anti-AI Slop)

**Versi:** 3.0 (menambah mode Terang/Gelap dan struktur halaman bergaya Seakun)
**Konsep Inti:** Utilitarian Digital Storefront / Compact Top-Up Interface
**Referensi Rasa:** Lapakgaming, Codashop, Vercel Dashboard, Raycast UI, dan **struktur halaman** seakun.id
**Filosofi:** Kerapatan informasi tinggi, kontras tajam, nol dekorasi tanpa fungsi, nol teks marketing berbunga-bunga.
**Implementasi:** Tailwind CSS di atas React (Inertia). Komponen primitif (mis. shadcn/ui) boleh dipakai, tetapi tampilan bawaannya **wajib diganti** mengikuti token di dokumen ini.

---

## 0. Cara Memakai Referensi seakun.id

seakun.id dipakai sebagai acuan **pola dan susunan halaman**: urutan seksi, navigasi, filter katalog, alur "Cara Pesan", FAQ, footer, dan tombol bantuan. Aturan penggunaannya:

1. **Ambil pola, bukan aset.** Dilarang menyalin teks, ilustrasi, ikon, logo, nama merek, foto, atau klaim dari seakun.id. Situs itu menyatakan konten dan desainnya dilindungi hak cipta. Semua teks, ikon (`lucide-react`), dan elemen visual di sini dibuat sendiri.
2. **Warna dan tipografi mengikuti dokumen ini**, bukan mengikuti seakun.id.
3. **Yang tidak diambil** dari seakun.id: hero besar berilustrasi, deretan statistik pengguna, testimoni, logo partner, banner promo karusel, banner aplikasi, klaim "legal/resmi/aman", dan peringatan hak cipta. Alasannya: tidak punya data nyata untuk itu, atau bertentangan dengan Bagian 11.
4. **Yang tetap prioritas utama** walau halaman jadi lebih lengkap: bar kuota dan grid produk harus muncul secepat mungkin (Bagian 1).

---

## 1. Prinsip Visual & Tata Letak

1. **Katalog dulu.** Intro di atas katalog hanya selembar pita ringkas (Bagian 6.2). Bar kuota dan baris pertama produk harus terlihat di layar tanpa scroll pada 1366×768, dan bar kuota harus terlihat penuh pada 375×667. Tidak ada hero tinggi atau ilustrasi pembuka.
2. **Urutan seksi di halaman utama** (atas ke bawah):
   1. Header (navigasi, pengalih tema)
   2. Banner pesanan belum selesai (hanya jika ada)
   3. Pita intro ringkas
   4. Bar kuota
   5. Katalog: filter + grid produk
   6. Cara Pesan (5 langkah)
   7. Metode Pembayaran
   8. FAQ (akordeon)
   9. Footer
   10. Tombol bantuan WhatsApp mengambang
3. **Checkout 2 Kolom (Desktop ≥ 1024px).** Kiri (35–40%): logo layanan, deskripsi, syarat sewa/garansi. Kanan (60–65%): 4 langkah, semuanya terlihat.
4. **Mobile (Single Column).** Elemen tersusun vertikal. *Sticky bottom bar* menampilkan total dan tombol checkout di halaman produk.
5. **Satu aksi utama per layar.** Hanya satu tombol berwarna aksen yang dominan dalam satu viewport.
6. **Tidak bergantung pada hover.** Semua fungsi harus bisa dipakai di layar sentuh.

### Wireframe Acuan

**Storefront (Mobile)**

```
┌──────────────────────────────┐
│ NamaToko        [tema] [menu] │  header 56px
├──────────────────────────────┤
│ Sewa & Beli Akun Streaming    │  pita intro (maks 88px)
│ Akun dikirim setelah bayar    │
├──────────────────────────────┤
│ SLOT SEWA HARI INI   2/3 sisa │  QuotaBar
│ ▮▮▯  Reset 00:00 WIB          │
├──────────────────────────────┤
│ [Semua][Sewa][Beli] Kategori ▾│  filter (chip scroll)
│ [Netflix ] [YouTube]          │  grid 2 kolom
│ [Spotify ] [Prime  ]          │
├──────────────────────────────┤
│ Cara Pesan  1→2→3→4→5         │
│ Metode Pembayaran             │
│ FAQ ▸ ▸ ▸                     │
│ Footer                    (WA)│
└──────────────────────────────┘
```

**Detail Layanan (Desktop)**

```
┌────────────────────┬───────────────────────────────────┐
│ [logo] Netflix     │ 1  Pilih Paket                    │
│ Deskripsi singkat  │    [Sewa Harian][Beli Akun]       │
│                    │    ( ) 12 Jam    Rp  8.000        │
│ Syarat & Garansi   │    ( ) 1 Hari    Rp 15.000        │
│  - ...             │ 2  Data Penerima                  │
│                    │    No. WhatsApp [____________]    │
│                    │ 3  Pembayaran                     │
│                    │    ( ) QRIS  ( ) DANA  ( ) BCA    │
│                    │ 4  Ringkasan                      │
│                    │    Total Rp 15.123 [Sewa Sekarang]│
└────────────────────┴───────────────────────────────────┘
```

**Invoice (PENDING)**

```
┌──────────────────────────────┐
│ INV-20261101-K7P2QX  [MENUNGGU]│
│ Sisa waktu bayar   14:32      │
├──────────────────────────────┤
│ Total Transfer                │
│ Rp 15.123            [Salin]  │
├──────────────────────────────┤
│ [ gambar QRIS ]               │
│ atau  BCA 1234567890  [Salin] │
├──────────────────────────────┤
│ [Upload Bukti]  (opsional)    │
│ [      Saya Sudah Bayar     ] │
└──────────────────────────────┘
```

---

## 2. Mode Tampilan: Gelap dan Terang

Aplikasi mendukung **tiga pilihan**: **Terang**, **Gelap**, dan **Sistem** (mengikuti pengaturan perangkat). Default: **Sistem**. Pilihan disimpan di browser pengunjung. Kedua mode memakai struktur, jarak, dan komponen yang sama. Yang berbeda hanya nilai token.

### 2.1 Token Warna

Semua warna dipakai lewat CSS variables. **Dilarang menulis hex langsung di komponen** dan dilarang membuat varian `dark:` per komponen untuk warna yang sudah punya token.

| Token | Gelap | Terang | Peran |
| :-- | :-- | :-- | :-- |
| `--bg` | `#09090B` | `#FAFAFA` | Latar halaman |
| `--surface` | `#121215` | `#FFFFFF` | Kartu, panel form, modal |
| `--surface-2` | `#18181B` | `#F4F4F5` | Input, badge latar, tab non-aktif |
| `--surface-hover` | `#1F1F23` | `#EEEEF0` | Hover baris/kartu/opsi |
| `--border` | `#27272A` | `#E4E4E7` | Garis `1px` kartu dan pemisah |
| `--border-strong` | `#3F3F46` | `#D4D4D8` | Hover input, divider penting |
| `--text` | `#FAFAFA` | `#09090B` | Judul, harga, label utama |
| `--text-2` | `#A1A1AA` | `#52525B` | Deskripsi, label sekunder |
| `--text-muted` | `#71717A` | `#71717A` | Placeholder, disabled. Bukan untuk informasi penting. |
| `--accent` | `#10B981` | `#10B981` | Latar tombol utama, opsi terpilih, indikator tersedia |
| `--accent-hover` | `#34D399` | `#059669` | Hover tombol utama |
| `--accent-text` | `#10B981` | `#047857` | **Teks/ikon** berwarna aksen (kontras aman di kedua mode) |
| `--on-accent` | `#09090B` | `#09090B` | Teks di atas latar `--accent` (selalu gelap) |
| `--warning` | `#F59E0B` | `#B45309` | Teks/ikon peringatan. Latar badge memakai `--warning` pada opasitas 10–12%. |
| `--danger` | `#EF4444` | `#DC2626` | Kuota/stok habis, error, `CANCELLED` |
| `--info` | `#38BDF8` | `#0369A1` | Hanya badge `VERIFYING` |
| `--overlay` | `rgba(0,0,0,0.6)` | `rgba(0,0,0,0.4)` | Latar modal |

**Aturan warna (berlaku di kedua mode):**

- Dilarang: gradasi ungu-biru neon (*AI purple-cyan glow*), gradien dekoratif, glow, glassmorphism.
- **Satu warna aksen: emerald.** Hijau berarti "bisa diklik" atau "berhasil/tersedia". Tidak untuk dekorasi.
- Di mode terang, teks berwarna memakai `--accent-text` (bukan `--accent`) karena `#10B981` di atas putih kontrasnya kurang dari 4.5:1. Latar tombol tetap `--accent` dengan teks `--on-accent` (kontras ≈ 8:1 di kedua mode).
- Status tidak boleh dikomunikasikan hanya lewat warna. Selalu sertakan label teks atau ikon.

### 2.2 Token CSS

```css
:root {
  color-scheme: light;
  --bg: #FAFAFA; --surface: #FFFFFF; --surface-2: #F4F4F5; --surface-hover: #EEEEF0;
  --border: #E4E4E7; --border-strong: #D4D4D8;
  --text: #09090B; --text-2: #52525B; --text-muted: #71717A;
  --accent: #10B981; --accent-hover: #059669; --accent-text: #047857; --on-accent: #09090B;
  --warning: #B45309; --danger: #DC2626; --info: #0369A1;
  --overlay: rgba(0,0,0,0.4);
}
.dark {
  color-scheme: dark;
  --bg: #09090B; --surface: #121215; --surface-2: #18181B; --surface-hover: #1F1F23;
  --border: #27272A; --border-strong: #3F3F46;
  --text: #FAFAFA; --text-2: #A1A1AA; --text-muted: #71717A;
  --accent: #10B981; --accent-hover: #34D399; --accent-text: #10B981; --on-accent: #09090B;
  --warning: #F59E0B; --danger: #EF4444; --info: #38BDF8;
  --overlay: rgba(0,0,0,0.6);
}
```

Petakan token ke tema Tailwind (`bg-bg`, `bg-surface`, `text-text-2`, `border-border`, `text-accent-text`, dst.). Class `dark` dipasang pada `<html>`.

### 2.3 Mekanisme Pengalih Tema

- **ThemeToggle** di header: tombol ikon 36×36px (ikon `Sun` saat mode terang aktif, `Moon` saat gelap). Menu kecil tiga pilihan: Terang, Gelap, Sistem (ikon `Sun`, `Moon`, `Monitor`). `aria-label="Ubah tema"`.
- Pakai mekanisme `appearance` yang sudah ada di starter kit (`use-appearance.tsx`) bila memadai. Pastikan **tidak ada kedipan tema** saat halaman dimuat: skrip kecil inline di `<head>` (`app.blade.php`) menentukan class `dark` **sebelum** render, berdasarkan pilihan tersimpan atau `prefers-color-scheme`.
- Pilihan juga berlaku untuk halaman admin, invoice, dan Cek Pesanan.
- Transisi tema: tidak ada animasi (perpindahan langsung).

### 2.4 Hal yang Wajib Diperiksa di Kedua Mode

- Kontras teks ≥ 4.5:1 (teks kecil) dan ≥ 3:1 untuk batas komponen penting (input, tombol sekunder).
- Badge status, bar kuota, countdown, dan kotak kredensial terbaca jelas di kedua mode.
- Gambar/logo layanan tidak "hilang" pada latar tertentu. Kotak logo selalu punya latar `--surface-2` dan border `--border`.
- Gambar QRIS selalu ditaruh di atas latar **putih** (kotak padding 12px) di kedua mode agar bisa dipindai.
- Tidak ada elemen yang memakai warna tetap hitam/putih di luar token (kecuali kotak QRIS).

### 2.5 Peta Status Order

| Status | Label UI | Warna Teks | Latar Badge | Border Badge |
| :-- | :-- | :-- | :-- | :-- |
| `PENDING` | Menunggu Bayar | `--warning` | `--warning` 12% | `--warning` 30% |
| `VERIFYING` | Diverifikasi | `--info` | `--info` 12% | `--info` 30% |
| `PAID` | Lunas | `--accent-text` | `--accent` 12% | `--accent` 35% |
| `EXPIRED` | Kedaluwarsa | `--text-2` | `--surface-2` | `--border-strong` |
| `CANCELLED` | Dibatalkan | `--danger` | `--danger` 12% | `--danger` 30% |

---

## 3. Tipografi

| Peran | Font | Catatan |
| :-- | :-- | :-- |
| **UI & Teks** | **Inter** (variable) | Self-host lewat `@fontsource-variable/inter`. Fallback: `ui-sans-serif, system-ui, sans-serif`. |
| **Angka teknis** | **JetBrains Mono** | Kode invoice, nominal, nomor rekening, countdown, kredensial. |

Angka harga dan jumlah memakai `tabular-nums`. Jangan memuat font dari CDN eksternal.

| Gaya | Ukuran / Berat | Pemakaian |
| :-- | :-- | :-- |
| Page title | 20px / 600 | Satu per halaman (pita intro memakainya). Bukan hero. |
| Section title | 15–16px / 600 | Judul seksi (Cara Pesan, FAQ, dst.) dan judul kartu. |
| Body | 14px / 400 | Teks umum. |
| Small | 12px / 400–500 | Label, badge, keterangan. |
| Price (kartu) | 14px / 600 mono | Harga di kartu dan opsi. |
| Total highlight | 28px / 700 mono | Total transfer di invoice. |
| Countdown | 32px / 700 mono | Timer pembayaran. |

Tidak ada teks di atas 32px. Line-height: 1.5 untuk body, 1.25 untuk judul.

---

## 4. Bentuk, Jarak, dan Elevasi

- **Basis jarak:** 4px (4, 8, 12, 16, 24, 32). Jarak antar-kartu 12px. Jarak antar-seksi di halaman utama: 40px (mobile 32px).
- **Radius:** 6px (tombol, input, badge), 8px (kartu, modal). Tidak ada radius > 12px.
- **Border:** `1px solid var(--border)` di semua kartu dan input. Struktur dibentuk oleh border, **bukan bayangan**, di kedua mode.
- **Shadow:** tidak dipakai. **Gradien/glow:** tidak ada.
- **Lebar konten maks:** `max-w-6xl` (1152px), rata tengah, padding horizontal 16px (mobile) / 24px (desktop).

---

## 5. Ikon & Gambar

- Ikon: `lucide-react`, 16px (inline) atau 20px (aksi), `stroke-width` 1.75, warna mengikuti teks.
- **Tanpa emoji** di antarmuka web (emoji hanya boleh di pesan Telegram internal admin).
- Logo layanan: kotak 40×40 (kartu) atau 48×48 (detail), radius 8px, latar `--surface-2`, border `--border`. Jika belum ada gambar: kotak inisial (mono). Gambar diperkecil, `loading="lazy"` di luar layar awal, `width`/`height` eksplisit.
- Tanpa ilustrasi dekoratif, stock photo, atau pola latar. Elemen "Cara Pesan" dan "Manfaat" memakai ikon Lucide, bukan ilustrasi.

---

## 6. Spesifikasi Komponen

### 6.1 Header (sticky)

Tinggi 56px (mobile) / 56px (desktop), latar `--bg`, border bawah 1px, `position: sticky; top: 0`.

- **Desktop:** kiri nama toko. Tengah/kanan tautan jangkar: **Layanan**, **Cara Pesan**, **FAQ**, lalu **Cek Pesanan** (ikon `Search` + teks), dan **ThemeToggle** di paling kanan.
- **Mobile:** kiri nama toko, kanan ThemeToggle dan tombol **menu** (ikon `Menu`). Menu membuka panel dari atas/samping berisi tautan yang sama dalam daftar vertikal (tinggi baris 48px), `Esc` dan tap di luar untuk menutup, fokus terkunci di panel.
- Tautan jangkar menggulir ke seksi terkait (`scroll-margin-top` 72px). Di halaman selain beranda, tautan menuju `/#id-seksi`.

### 6.2 Pita Intro

Satu blok ringkas di atas bar kuota: judul 20px/600 (mis. "Sewa & Beli Akun Streaming"), satu kalimat faktual 14px (mis. "Bayar, konfirmasi, akun dikirim setelah diverifikasi admin."). Tinggi maks 88px di mobile. Desktop boleh menambah **tiga chip faktual** (ikon + teks 12px, mis. "Slot sewa terbatas per hari", "Garansi selama masa sewa", "Notifikasi via WhatsApp") hanya jika benar dan sesuai kebijakan toko. Tanpa tombol CTA besar, tanpa ilustrasi.

### 6.3 Banner Pesanan Belum Selesai

Muncul di bawah header pada semua halaman publik (kecuali halaman invoice yang bersangkutan) jika sesi pengunjung memiliki order `PENDING`/`VERIFYING`. Satu baris: ikon `Clock`, teks "Pesanan INV-… belum selesai" + status, dan tautan **Lanjutkan** ke invoice. Gaya: latar `--warning` 10%, border `--warning` 30%, tinggi 40px. Hilang otomatis saat order selesai atau expired.

### 6.4 QuotaBar

Satu baris penuh lebar di atas grid, tinggi 44–56px, kartu dengan border.

| Keadaan | Tampilan |
| :-- | :-- |
| Tersedia | `Slot sewa hari ini` + `2/3 tersisa`, indikator segmen 3 kotak, titik aksen kecil, teks sekunder `Reset 00:00 WIB`. |
| Hampir penuh (1 sisa) | Sama, titik dan angka berwarna `--warning`. |
| Penuh | Border dan ikon `--danger`. Teks: **"Kuota Sewa Hari Ini Penuh (3/3) — Reset 00:00 WIB"**. Hitung mundur menuju reset (mono). |

Segmen: tiga kotak 16×6px, radius 2px. Terpakai = `--border-strong` (atau `--danger` saat penuh), sisa = `--accent`.

### 6.5 Filter Katalog

Di atas grid, satu baris:

- **Tipe produk:** kontrol segmen **Semua / Sewa / Beli**.
- **Kategori:** dropdown (mis. Semua, Video, Musik, Lainnya) dari kolom `products.category`. Sembunyikan jika hanya ada satu kategori.
- Mobile: baris dapat digulir horizontal (tanpa wrap), tinggi 40px.
- Filter bekerja di sisi klien (data katalog kecil) tanpa reload halaman, dan keadaan filter tidak disimpan. Saat hasil kosong: teks "Tidak ada layanan untuk filter ini" + tombol **Reset filter**.
- Filter **Sewa** menyembunyikan layanan yang tidak punya varian sewa, begitu juga sebaliknya.

### 6.6 ProductCard

Grid 2 kolom (≥ 480px) hingga 4 kolom (desktop), mobile paling kecil 2 kolom bila muat, selain itu 1 kolom. Isi: logo 40px, nama (14px/600), kategori (12px, `--text-2`), `mulai Rp X` (mono), badge status di pojok kanan atas. Seluruh kartu adalah tautan. Hover: latar `--surface-hover` + border `--border-strong`, tanpa transform.

Badge status: `Tersedia` (aksen), `Stok Menipis` (warning), `Habis` (danger), `Sewa Penuh` (warning, hanya jika layanan punya paket beli aktif). Kartu `Habis`: opacity 60%, tetap terbaca.

### 6.7 Seksi "Cara Pesan"

Judul seksi + 5 langkah bernomor, masing-masing: kotak 32px berisi ikon Lucide, nomor (mono 12px), judul pendek, satu baris keterangan. Isi default:

| # | Judul | Keterangan | Ikon |
| :-- | :-- | :-- | :-- |
| 1 | Pilih paket | Pilih layanan, tipe, dan durasi. | `MousePointerClick` |
| 2 | Bayar | Transfer sesuai nominal sampai digit terakhir. | `Wallet` |
| 3 | Konfirmasi | Tekan "Saya Sudah Bayar", unggah bukti jika ada. | `CheckCheck` |
| 4 | Verifikasi | Admin memeriksa pembayaran. | `ShieldCheck` |
| 5 | Akun dikirim | Detail akun tampil di halaman invoice. | `KeyRound` |

Desktop: 5 kolom sejajar dengan garis penghubung 1px (`--border`). Mobile: daftar vertikal.

### 6.8 Seksi "Metode Pembayaran"

Daftar metode aktif dari `payment_methods` sebagai chip/kartu kecil (label teks, ikon `QrCode`/`Landmark`/`Wallet`). **Tanpa logo merek pihak ketiga** kecuali admin mengunggahnya sendiri. Satu kalimat keterangan: pembayaran diverifikasi manual oleh admin.

### 6.9 Seksi FAQ (Akordeon)

Daftar 6–8 pertanyaan, satu kartu dengan pemisah 1px. Tiap item: tombol selebar baris (tinggi min. 48px) berisi pertanyaan (14px/500) dan ikon `ChevronDown` yang berputar saat terbuka. Boleh beberapa item terbuka sekaligus. `aria-expanded`, `aria-controls`, dapat dioperasikan dengan keyboard. Isi FAQ disimpan di berkas data (`resources/js/data/faq.ts`) dan mengikuti `PRD.md` Bagian 5.6.

### 6.10 Footer

Border atas 1px, latar `--bg`. Tiga kolom (desktop) / bertumpuk (mobile):

1. **Brand:** nama toko dan satu kalimat deskripsi.
2. **Tautan:** Cek Pesanan, Syarat & Ketentuan, Kebijakan Privasi.
3. **Hubungi Kami:** WhatsApp admin (dari `settings.admin_whatsapp`), **Jam Operasional** (dari `settings.business_hours`, mis. "Setiap hari, 09.00–21.00 WIB").

Baris bawah (12px, `--text-2`): hak cipta toko dan **disclaimer non-afiliasi**: "Situs ini layanan independen dan tidak berafiliasi dengan, didukung, atau terkait dengan Netflix, YouTube, Spotify, atau penyedia layanan lain. Seluruh merek dagang adalah milik pemiliknya masing-masing."

### 6.11 Tombol Bantuan Mengambang

Tombol 48px bulat-persegi (radius 8px), kanan bawah, berisi ikon `MessageCircle` + teks `Bantuan` (teks disembunyikan di layar < 480px, `aria-label` tetap). Membuka WhatsApp admin (`https://wa.me/…`) dengan teks awal. Di halaman produk (mobile) posisikan **di atas** sticky bottom bar (bottom = 64px + 16px) agar tidak menutupinya. Disembunyikan jika `admin_whatsapp` kosong. Gaya: `--surface`, border `--border-strong`, teks `--text` (bukan tombol aksen agar tidak bersaing dengan CTA).

### 6.12 Tab Tipe Paket (Langkah 1)

Dua tab segmen: **Sewa Harian** dan **Beli Akun**. Aktif: latar `--surface-2`, border `--border-strong`, teks `--text`, garis bawah aksen 2px. Tab Sewa menampilkan penanda teks `2/3` atau `Penuh`.

### 6.13 PackageOption

Baris selebar kolom, tinggi min. 56px: radio, nama paket, keterangan durasi, harga (mono, kanan).

| Keadaan | Gaya |
| :-- | :-- |
| Default | Border `--border`, latar `--surface`. |
| Hover | Latar `--surface-hover`. |
| Terpilih | Border `--accent`, latar `--accent` 10%, radio terisi aksen. |
| Disabled | Opacity 50%, `not-allowed`, ikon `Lock`, **alasan tertulis** ("Kuota penuh, reset 00:00 WIB" / "Stok habis"). |

### 6.14 Input

Tinggi 40px, latar `--surface-2`, border `--border`, radius 6px. Fokus: border `--accent` + ring 2px `--accent` 30%. Error: border `--danger`, pesan 12px di bawah field. Label di atas field, 12px/500 `--text-2`. Input WA: `inputmode="tel"`, awalan tetap `+62`.

### 6.15 Tombol

| Varian | Gaya |
| :-- | :-- |
| **Primary** | Latar `--accent`, teks `--on-accent`, 14px/600, tinggi 40px (48px untuk checkout di mobile). Hover `--accent-hover`. |
| **Secondary** | Latar `--surface-2`, border `--border-strong`, teks `--text`. |
| **Ghost** | Tanpa latar, teks `--text-2`, hover `--surface-hover`. |
| **Danger** | Border dan teks `--danger`, latar transparan. Isi penuh hanya untuk konfirmasi destruktif. |

`loading`: spinner 16px di kiri label, tombol nonaktif, lebar tetap. `disabled`: opacity 50%. Tombol checkout wajib `disabled` + `loading` saat request berjalan.

### 6.16 Kartu Langkah Checkout

Header bernomor: lingkaran 20px berisi angka (mono 12px) + judul. Langkah selesai: ringkasan satu baris + ikon `Check` aksen. Semua langkah tetap terlihat. Tanpa animasi transisi.

### 6.17 Sticky Bottom Bar (Mobile)

Tinggi 64px + safe-area, border atas 1px, latar `--surface`. Kiri: `Total` (12px) dan nominal (mono 16px/700). Kanan: tombol Primary `Beli / Sewa Sekarang`. Belum ada paket: tombol disabled dan kiri `Pilih paket`. Konten diberi `padding-bottom` agar tidak tertutup.

### 6.18 CountdownTimer

`MM:SS`, mono 32px/700, kartu tersendiri. Warna: `--text` (> 3 menit), `--warning` (≤ 3 menit), `--danger` (≤ 1 menit). Teks 12px di bawahnya: "Pesanan dibatalkan otomatis jika tidak dibayar". Saat nol, ganti ke tampilan `EXPIRED` tanpa reload. `aria-live="polite"` hanya pada ambang (3 menit, 1 menit, habis).

### 6.19 CopyButton

Tombol 32px, ikon `Copy` + `Salin`. Setelah ditekan: `Check` + `Tersalin` selama 1.5 detik. Wajib pada: total transfer, nomor rekening/e-wallet, setiap kolom kredensial.

### 6.20 Total Highlight (Invoice)

Kartu dengan border `--accent` 1px. `Total Transfer` (12px), nominal mono 28px/700 dengan **3 digit terakhir (kode unik) berwarna `--accent-text`**. Peringatan 12px: "Transfer sesuai nominal sampai digit terakhir".

### 6.21 Kotak QRIS

Gambar QRIS di dalam kotak berlatar **putih** dengan padding 12px, border `--border`, lebar maks 260px, rata tengah, di kedua mode.

### 6.22 CredentialBox (status PAID)

Baris label-nilai: Email/Username, Password, Profil, PIN. Nilai mono, masing-masing dengan CopyButton. Password tersembunyi default dengan tombol `Tampilkan` (`Eye`). Di bawahnya: Mulai, Berakhir, sisa waktu (mono). Jika sewa berakhir: "Masa sewa berakhir" dan kredensial disembunyikan.

### 6.23 Tabel Admin

Baris 40px, header 12px uppercase `--text-2`, border bawah per baris, hover `--surface-hover`. Mobile: daftar kartu. Order `VERIFYING` di atas dengan garis `--info` 2px di kiri. Aksi Approve (Primary) dan Reject (Danger) selalu terlihat.

### 6.24 Modal Konfirmasi

Lebar maks 420px, latar `--surface`, border `--border-strong`, overlay `--overlay`. Judul, satu paragraf, dua tombol (Batal = Ghost, Konfirmasi = Primary/Danger). Reject wajib alasan. Fokus terkunci, `Esc` menutup.

### 6.25 Empty, Loading, Error

- **Loading:** skeleton `--surface-2` dengan pulse halus 1.5 detik.
- **Empty:** satu baris teks `--text-2` dan, bila relevan, satu tautan aksi.
- **Error inline:** banner satu baris dengan ikon `AlertCircle`, border dan teks `--danger`.
- **404/500:** kode (mono), satu kalimat, tombol kembali.

---

## 7. Responsivitas

| Breakpoint | Perilaku |
| :-- | :-- |
| < 480px | Grid produk 2 kolom (kartu ringkas) atau 1 kolom bila nama panjang. Header dengan menu hamburger. Sticky bar aktif di halaman produk. |
| 480–767px | Grid 2 kolom. Sticky bar aktif. |
| 768–1023px | Grid 3 kolom. Nav tertaut tampil penuh bila muat. Checkout masih satu kolom. |
| ≥ 1024px | Checkout 2 kolom (38/62). Sticky bar mobile nonaktif. Grid 4 kolom. "Cara Pesan" 5 kolom. |

Mobile-first. Target sentuh ≥ 44×44px. Tidak ada scroll horizontal pada halaman (kecuali baris filter dan tabel admin di wadah `overflow-x-auto`).

---

## 8. Aksesibilitas

- Kontras WCAG AA di **kedua mode** (lihat 2.4).
- Fokus keyboard selalu terlihat (ring `--accent` 2px, offset 2px; di mode terang pakai `--accent-text` bila ring tidak cukup kontras terhadap latar).
- `role="radiogroup"`, `role="tablist"`, akordeon dengan `aria-expanded`, menu mobile dengan fokus terkunci.
- Setiap input punya `label` terhubung, error lewat `aria-describedby`.
- Hormati `prefers-reduced-motion` dan `prefers-color-scheme`.
- `lang="id"` pada `<html>`.
- Tautan lompat "Lewati ke konten" di awal halaman (terlihat saat fokus).

---

## 9. Aturan Copywriting (Bahasa Indonesia)

Gaya: singkat, langsung, informatif. Sapaan "kamu" atau netral. Tanpa kalimat promosi.

| Pakai | Jangan Pakai |
| :-- | :-- |
| `Sewa Sekarang`, `Beli Sekarang`, `Saya Sudah Bayar`, `Salin`, `Cek Pesanan` | "Mulai Perjalanan Streaming Anda", "Nikmati pengalaman terbaik" |
| `Transfer sesuai nominal sampai digit terakhir` | "Pembayaran aman dan terpercaya 100%" |
| `Kuota Sewa Hari Ini Penuh (3/3) — Reset 00:00 WIB` | "Ups! Kamu kehabisan slot" |
| Error spesifik: `Nomor WhatsApp tidak valid. Contoh: 081234567890` | "Terjadi kesalahan. Silakan coba lagi." |

Aturan tambahan: tanpa emoji, tanpa tanda seru berlebihan, tanpa superlatif ("terbaik", "termurah"). **Dilarang klaim yang tidak bisa dibuktikan** ("legal", "resmi", "hemat hingga 70%", "komunitas terbesar", jumlah pengguna). Format uang `Rp 15.000`. Waktu `01 Nov 2026, 14:30 WIB`. Durasi `12 Jam`, `1 Hari`, `2 Hari`, `3 Hari`.

---

## 10. Interaksi & Gerak

- Transisi hanya untuk perubahan keadaan fungsional: `150ms ease-out` pada `background-color`, `border-color`, `opacity`. Pengalih tema tanpa transisi.
- Gulir ke jangkar boleh halus (`scroll-behavior: smooth`), nonaktif pada `prefers-reduced-motion`.
- Tidak ada parallax, animasi masuk saat scroll, karusel otomatis, atau elemen bergerak sendiri selain countdown dan skeleton.
- Pembaruan kuota/status (polling) **tanpa kedipan**: ganti nilai di tempat.

---

## 11. Larangan Mutlak (Anti-AI Slop)

1. Gradien apa pun (terutama ungu-biru/cyan neon), glow, bayangan berwarna, glassmorphism.
2. Hero tinggi, headline raksasa, ilustrasi dekoratif.
3. Emoji di antarmuka web.
4. Kartu "fitur" generik berisi klaim kosong, testimoni palsu, statistik karangan, logo partner yang tidak benar-benar partner.
5. Menyalin teks, aset, atau ilustrasi dari situs referensi (seakun.id atau lainnya).
6. Radius besar (> 12px), pil raksasa untuk aksi utama.
7. Animasi masuk/hover berlebihan (scale, bounce, float), karusel otomatis.
8. Lebih dari satu warna aksen, atau aksen untuk dekorasi.
9. Warna hex langsung di komponen (wajib lewat token), dan warna tetap yang rusak di salah satu mode.
10. Lorem ipsum atau data palsu tersisa di produksi.
11. Toast/popup yang menutup informasi pembayaran.

---

## 12. Checklist Akhir

- [ ] Bar kuota terlihat penuh tanpa scroll di 375×667, dan bar kuota + baris produk pertama terlihat di 1366×768.
- [ ] Mode Terang, Gelap, dan Sistem berfungsi, dan pilihan bertahan setelah reload tanpa kedipan.
- [ ] Setiap halaman (beranda, produk, invoice semua status, cek pesanan, login admin) diperiksa di **kedua mode** pada 375px dan 1366px.
- [ ] Tidak ada hex langsung di komponen. Semua warna lewat token.
- [ ] Teks berwarna aksen di mode terang memakai `--accent-text`.
- [ ] QRIS tampil di kotak putih di kedua mode.
- [ ] Seksi beranda lengkap: Cara Pesan, Metode Pembayaran, FAQ, Footer (dengan disclaimer non-afiliasi dan jam operasional), tombol bantuan WA.
- [ ] Filter katalog (Tipe, Kategori) berfungsi, ada keadaan kosong dengan Reset filter.
- [ ] Menu mobile dapat dipakai dengan keyboard dan menutup dengan `Esc`.
- [ ] Tidak ada gradien, glow, shadow dekoratif, emoji, atau klaim yang tak bisa dibuktikan.
- [ ] Hanya satu warna aksen. Angka uang/kode memakai mono + tabular.
- [ ] Paket terkunci selalu menampilkan alasan tertulis. Total, rekening, dan kredensial punya tombol Salin.
- [ ] Fokus keyboard terlihat, kontras AA di kedua mode, `prefers-reduced-motion` dihormati.
- [ ] Teks UI dalam Bahasa Indonesia sesuai aturan copywriting.
