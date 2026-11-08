# Design System & UI/UX Guidelines (Anti-AI Slop)

**Versi:** 3.3 (mode Terang/Gelap, struktur Seakun, katalog marketplace ala Orvaki, dan Tampilan Premium: hero fungsional, stepper status, halaman layanan v2)
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
5. **Tingkat keramaian visual: Opsi A (hangat tapi rapi).** Logo layanan lebih besar dengan tint warna merek, banner yang dapat diedit admin, seksi keunggulan, identitas toko (nama, logo, preset warna aksen). **Opsi A+ (katalog bergaya marketplace):** kartu produk dengan gambar sampul, pencarian dan pengurutan katalog, bar pengumuman, bagian "Sedang Kosong", ajakan pesanan custom, dan footer yang lebih lengkap. **Opsi B** (hero ilustratif buatan sendiri, statistik dari data nyata, testimoni dan rating asli) belum berlaku dan dikerjakan belakangan.
6. **Referensi tambahan: orvaki.com (pola saja).** Yang diambil: kartu produk bergambar, pencarian, badge "Baru", pembagian produk tersedia dan "Sedang Kosong", ajakan pesanan custom, footer berisi tautan sosial, jam kerja, dan metode pembayaran. **Tidak diambil:** akun masuk/daftar, leaderboard, rating, jumlah dilihat, dan jumlah terjual yang tidak nyata, serta semua teks, gambar, dan tagline mereka. Angka seperti "terjual" hanya boleh tampil jika dihitung dari data nyata (6.6).
7. **Tampilan Premium (Fase 7).** Hero fungsional berisi data nyata (bukan ilustrasi tempelan), stepper status pesanan, halaman layanan dan invoice yang lebih kaya, statistik yang hanya tampil bila datanya nyata dan memenuhi ambang, serta gerak halus yang fungsional. Semua tetap mematuhi aturan bahasa visual (satu aksen, tanpa gradien, glow, atau klaim karangan). Ulasan dan rating asli menyusul di Fase 8.

---

## 1. Prinsip Visual & Tata Letak

1. **Katalog dulu.** Di atas katalog hanya ada bar pengumuman opsional (6.29), satu banner ringkas (6.26) atau, bila belum ada banner aktif, pita intro (6.2). Bar kuota harus terlihat penuh pada 375×667, dan bar kuota + baris produk pertama harus terlihat penuh pada 1366×768, **dengan bar pengumuman dan banner aktif bersamaan** (kasus terburuk). Ukur lewat DOM (`getBoundingClientRect`), bukan perkiraan visual. Tidak ada hero setinggi layar.
2. **Urutan seksi di halaman utama** (atas ke bawah):
   1. Bar pengumuman (opsional, di atas header, ikut tergulir)
   2. Header (BrandMark, navigasi, pengalih tema)
   3. Banner pesanan belum selesai (hanya jika ada)
   4. Banner slider, atau Hero Fungsional bila tidak ada banner aktif
   5. Bar kuota
   6. Toolbar katalog: cari, tipe, kategori, urutkan
   7. Grid "Semua Layanan"
   8. "Sedang Kosong" (layanan yang stoknya habis, dipisah dari grid utama)
   9. Kenapa Beli di Sini (kartu keunggulan)
   10. Cara Pesan (5 langkah)
   11. Strip Bantuan (tombol yang membuka modal Tanya Jawab)
   12. Ajakan pesanan custom (opsional)
   13. Footer (termasuk logo metode pembayaran)
   14. Tombol bantuan WhatsApp mengambang
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
| `--text-muted` | `#8E8E93` | `#666670` | Placeholder, keterangan sekunder, label langkah yang belum aktif. Kontras ≥ 4.5:1 di atas `--bg`, `--surface`, `--surface-2`, dan `--surface-hover` di kedua mode. |
| `--accent` | `#10B981` | `#10B981` | Latar tombol utama, opsi terpilih, indikator tersedia |
| `--accent-hover` | `#34D399` | `#059669` | Hover tombol utama |
| `--accent-text` | `#10B981` | `#047857` | **Teks/ikon** berwarna aksen (kontras aman di kedua mode) |
| `--on-accent` | `#09090B` | `#09090B` | Teks di atas latar `--accent` (selalu gelap) |
| `--warning` | `#F59E0B` | `#B45309` | Teks/ikon peringatan. Latar badge memakai `--warning` pada opasitas 10–12%. |
| `--danger` | `#EF4444` | `#B91C1C` | Kuota/stok habis, error, `CANCELLED` (5.89:1 di atas `--surface-2` terang) |
| `--danger-solid` | `#DC2626` | `#DC2626` | Latar tombol destruktif berisi penuh. Hover `--danger-solid-hover` `#B91C1C`. |
| `--on-danger` | `#FFFFFF` | `#FFFFFF` | Teks di atas `--danger-solid` (4.83:1; di atas hover 6.47:1). Jangan memakai `--danger` (`#EF4444` di mode gelap) sebagai latar teks putih: hanya 3.76:1. |
| `--on-warning` | `#09090B` | `#FFFFFF` | Teks di atas latar `--warning` berisi penuh (9.26:1 gelap, 5.02:1 terang). |
| `--success` | `#10B981` | `#047857` | Teks dan ikon berhasil (7.84:1 gelap, 5.25:1 terang di atas `--bg`). |
| `--info` | `#38BDF8` | `#0369A1` | Hanya badge `VERIFYING` |
| `--overlay` | `rgba(0,0,0,0.6)` | `rgba(0,0,0,0.4)` | Latar modal |

**Aturan warna (berlaku di kedua mode):**

- Dilarang: gradasi ungu-biru neon (*AI purple-cyan glow*), gradien dekoratif, glow, glassmorphism.
- **Satu warna aksen toko** (default emerald, dapat diganti lewat preset di 2.6). Warna aksen berarti "bisa diklik", "terpilih", atau "tersedia". Tidak untuk dekorasi. Satu-satunya tambahan warna adalah tint tipis warna merek layanan pada kotak logo (2.6 B).
- Di mode terang, teks berwarna memakai `--accent-text` (bukan `--accent`) karena `#10B981` di atas putih kontrasnya kurang dari 4.5:1. Latar tombol tetap `--accent` dengan teks `--on-accent` (kontras ≈ 8:1 di kedua mode).
- Status tidak boleh dikomunikasikan hanya lewat warna. Selalu sertakan label teks atau ikon.
- **Hanya token.** Dilarang memakai kelas palet Tailwind langsung (`red-600`, `green-600`, `neutral-100`, `zinc-*`, `bg-white`, `bg-black`, `text-black`) atau hex di komponen. Pengecualian terdokumentasi hanya tiga: kotak QRIS/QR berlatar putih (`.qris-box`, 6.21), **plat logo berlatar putih (`.logo-plate`)** untuk logo pihak ketiga yang diunggah admin (logo metode pembayaran, logo layanan bila perlu), dan overlay modal (`--overlay`). Plat logo tetap putih di kedua mode karena banyak logo dirancang untuk latar putih dan akan tak terlihat di atas permukaan gelap. Setiap kelas warna yang dipakai (`text-text-3`, `bg-success`, dan seterusnya) **wajib terdaftar di `@theme`**: kelas yang tidak terdaftar tidak menghasilkan warna sama sekali dan bisa membuat teks tak terlihat.
- **Pasangan latar dan teks penuh** memakai token pasangannya: `--accent` + `--on-accent`, `--warning` + `--on-warning`, `--danger-solid` + `--on-danger`. Jangan menebak "teks hitam" atau "teks putih" per kasus.

### 2.2 Token CSS

```css
:root {
  color-scheme: light;
  --bg: #FAFAFA; --surface: #FFFFFF; --surface-2: #F4F4F5; --surface-hover: #EEEEF0;
  --border: #E4E4E7; --border-strong: #D4D4D8;
  --text: #09090B; --text-2: #52525B; --text-muted: #666670;
  --accent: #10B981; --accent-hover: #059669; --accent-text: #047857; --on-accent: #09090B;
  --warning: #B45309; --danger: #B91C1C; --info: #0369A1;
  --danger-solid: #DC2626; --danger-solid-hover: #B91C1C; --on-danger: #FFFFFF;
  --on-warning: #FFFFFF; --success: #047857;
  --overlay: rgba(0,0,0,0.4);
}
.dark {
  color-scheme: dark;
  --bg: #09090B; --surface: #121215; --surface-2: #18181B; --surface-hover: #1F1F23;
  --border: #27272A; --border-strong: #3F3F46;
  --text: #FAFAFA; --text-2: #A1A1AA; --text-muted: #8E8E93;
  --accent: #10B981; --accent-hover: #34D399; --accent-text: #10B981; --on-accent: #09090B;
  --warning: #F59E0B; --danger: #EF4444; --info: #38BDF8;
  --danger-solid: #DC2626; --danger-solid-hover: #B91C1C; --on-danger: #FFFFFF;
  --on-warning: #09090B; --success: #10B981;
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

### 2.6 Aksen Toko dan Warna Merek Layanan

**A. Aksen toko (preset).** Pemilik memilih satu preset di Pengaturan (default **Emerald**). Preset hanya mengganti token aksen, tidak menyentuh warna status (warning, danger, info). Diterapkan lewat atribut `data-accent` pada `<html>` yang ditetapkan **server-side sebelum render** (tanpa kedipan) dan berlaku di kedua mode.

| Preset | `--accent` | `--accent-hover` (Gelap / Terang) | `--accent-text` (Gelap / Terang) | `--on-accent` |
| :-- | :-- | :-- | :-- | :-- |
| `emerald` | `#10B981` | `#34D399` / `#059669` | `#10B981` / `#047857` | `#09090B` |
| `teal` | `#14B8A6` | `#2DD4BF` / `#0D9488` | `#14B8A6` / `#0F766E` | `#09090B` |
| `blue` | `#3B82F6` | `#60A5FA` / `#60A5FA` | `#60A5FA` / `#1D4ED8` | `#09090B` |
| `mono` | Gelap `#FAFAFA`, Terang `#18181B` | `#E4E4E7` / `#3F3F46` | `#FAFAFA` / `#18181B` | Gelap `#09090B`, Terang `#FAFAFA` |

Aturan preset: kontras `--accent-text` terhadap `--bg` dan `--surface` harus ≥ 4.5:1, dan `--on-accent` terhadap `--accent` **dan** `--accent-hover` ≥ 4.5:1, di kedua mode. (Catatan: `--accent-hover` yang lebih gelap dari `--accent` dengan teks gelap bisa gagal, mis. `#2563EB` dengan `#09090B` hanya 3.85:1. Untuk preset `blue` mode terang, hover memakai warna yang lebih terang.) Hitung dengan rumus kontras WCAG dan sesuaikan nilai bila ada yang kurang. Preset `blue` mendekati warna `--info` (badge `VERIFYING`), jadi badge status selalu memakai label teks. Nilai preset divalidasi dengan daftar putih (bukan input bebas).

**B. Warna merek layanan (tint).** Admin boleh mengisi `brand_color` (hex `#RRGGBB`) per layanan. Dipakai **hanya** sebagai tint kotak logo:

- latar: `color-mix(in srgb, var(--brand) 14%, var(--surface))` (mode gelap 18%)
- border: `color-mix(in srgb, var(--brand) 30%, var(--border))`

Teks tidak pernah diletakkan di atas warna merek mentah. Warna merek tidak dipakai untuk tombol, status, atau teks. Tanpa `brand_color`, kotak memakai `--surface-2`. Nilai wajib lolos validasi server (`^#[0-9A-Fa-f]{6}$`) sebelum dimasukkan ke atribut `style`, agar tidak bisa disisipi CSS.

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
- Gambar sampul layanan (6.6): rasio 16:10 (disarankan 800×500), diunggah admin, opsional. Logo layanan: kotak 24px (di badan kartu), 56px (fallback tanpa sampul), atau 64×64 (detail), radius 8px, latar tint warna merek (2.6 B) atau `--surface-2`, border sesuai tint. Logo ditampilkan `object-contain` dengan padding 8px. Jika belum ada gambar: kotak inisial (mono, 18px/600). Gambar diperkecil, `loading="lazy"` di luar layar awal, `width`/`height` eksplisit.
- Tanpa ilustrasi dekoratif tempelan, stock photo, atau pola latar di kode. Gambar yang boleh ada: sampul dan logo layanan, logo metode pembayaran, dan gambar banner yang **diunggah admin** (6.26). Semua unggahan **diperkecil dan dikonversi ke WebP otomatis** di server (sampul ≤ 800px lebar, banner ≤ 1200px, logo ≤ 256px) agar halaman ringan, terutama untuk server rumahan dengan upload terbatas. Elemen "Cara Pesan" dan "Kenapa Beli di Sini" memakai ikon Lucide, bukan ilustrasi. Gambar yang diunggah tidak boleh berupa SVG (risiko skrip).

---

## 6. Spesifikasi Komponen

### 6.1 Header (sticky)

Tinggi 56px (mobile) / 56px (desktop), latar `--bg`, border bawah 1px, `position: sticky; top: 0`.

- **Desktop:** kiri nama toko. Tengah/kanan tautan jangkar: **Layanan**, **Cara Pesan**, **FAQ**, lalu **Cek Pesanan** (ikon `Search` + teks), dan **ThemeToggle** di paling kanan.
- **Mobile:** kiri nama toko, kanan ThemeToggle dan tombol **menu** (ikon `Menu`). Menu membuka panel dari atas/samping berisi tautan yang sama dalam daftar vertikal (tinggi baris 48px), `Esc` dan tap di luar untuk menutup, fokus terkunci di panel.
- **Kiri:** BrandMark (6.28), bukan teks polos bila logo toko diunggah.
- Tautan jangkar menggulir ke seksi terkait (`scroll-margin-top` 72px). Di halaman selain beranda, tautan menuju `/#id-seksi`.

### 6.2 Hero Fungsional

Menggantikan pita intro lama. **Hanya tampil bila tidak ada banner aktif** (6.26). Bila ada banner, hero disembunyikan agar tinggi atas halaman tidak bertambah. Tinggi tetap: **160px (desktop ≥ 1024px)**, **maks 140px (mobile)**. Kartu dengan border 1px, radius 8px, latar `--surface`.

**Desktop, dua kolom:**

- **Kiri:** judul 24px/600 (mis. "Sewa & Beli Akun Streaming", ditulis sendiri oleh pemilik toko), satu kalimat 14px `--text-2`, dua tombol: **Lihat Layanan** (Primary, menggulir ke katalog) dan **Cek Pesanan** (Secondary).
- **Kanan, panel status (3 baris, 13px, ikon Lucide 16px, angka mono/tabular):**
  1. `Slot sewa hari ini` + `2/3 tersisa` (dari `QuotaService`, sama dengan bar kuota).
  2. `Layanan tersedia` + jumlah layanan yang punya paket dipesan (nyata).
  3. `Verifikasi biasanya` + `± 10 menit` **hanya jika** median waktu verifikasi nyata tersedia (≥ 10 sampel, 30 hari terakhir), atau teks `delivery_eta` bila diisi pemilik. Jika keduanya kosong, baris ini tidak tampil.
- **Mosaik logo** (maks 6 layanan, kotak 40px, tint merek flat, tanpa rotasi, tanpa gradien) di sisi kanan panel. Tanpa logo layanan, mosaik disembunyikan.

**Mobile:** judul 20px/600 satu atau dua baris, subjudul 13px satu baris, lalu baris chip status yang dapat digulir horizontal (slot sewa, layanan tersedia, estimasi verifikasi). Tombol Cek Pesanan disembunyikan (sudah ada di header).

Semua angka berasal dari data nyata. Jika sebuah data null, barisnya tidak tampil. Tidak ada angka karangan.

### 6.3 Banner Pesanan Belum Selesai

Muncul di bawah header pada semua halaman publik (kecuali halaman invoice yang bersangkutan) jika sesi pengunjung memiliki order `PENDING`/`VERIFYING`. Satu baris: ikon `Clock`, teks "Pesanan INV-… belum selesai" + status, dan tautan **Lanjutkan** ke invoice. Gaya: latar `--warning` 10%, border `--warning` 30%, tinggi 40px. Hilang otomatis saat order selesai atau expired.

**Penguncian checkout saat ada pesanan aktif.** Jika sesi memegang pesanan `PENDING`/`VERIFYING`, di halaman layanan: tombol checkout (termasuk sticky bar mobile) dinonaktifkan dan diganti keterangan tertulis di atas tombol: "Selesaikan pesanan INV-… terlebih dahulu" dengan tautan **Lanjutkan Pembayaran** (untuk `VERIFYING`: "Pembayaran sedang diverifikasi. Kamu bisa memesan lagi setelah selesai."). Pemilihan paket tetap boleh dilihat. Pesan error dari server (jika tetap ditolak) tampil sebagai banner error inline pada Langkah 4, dengan teks yang sama. Server selalu menjadi penentu akhir.

**Batalkan Pesanan (invoice `PENDING`):** tombol Danger kecil (tinggi 36px) di bawah tombol "Saya Sudah Bayar", dengan modal konfirmasi: "Batalkan pesanan ini? Kuota dan akun akan dilepas." Tidak tampil untuk `VERIFYING`/`PAID`.

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

### 6.6 ProductCard (v3, bergambar sampul)

Grid: 2 kolom pada mobile (≥ 360px; di bawahnya 1 kolom), 3 kolom ≥ 768px, 4 kolom ≥ 1024px. Seluruh kartu adalah tautan. Kartu berlatar `--surface`, border 1px, radius 8px, tanpa padding luar (sampul penuh di atas).

**Susunan vertikal:**

1. **Sampul** (rasio 16:10, `object-cover`, `loading="lazy"`, `width`/`height` eksplisit). Tanpa sampul: blok tint warna merek (2.6 B) dengan logo 40px di tengah (atau inisial mono 18px/600).
2. **Badge di atas sampul** (kiri atas: `Baru`, `Terlaris`; kanan atas: status stok). Badge berlatar solid `--surface` dengan border dan teks 11px, bukan teks langsung di atas gambar.
3. **Badan** (padding 12px): baris logo 24px + kategori (12px, `--text-2`); nama (14px/600, maks 2 baris); baris harga: `mulai` (12px) + harga (mono 14px/600).
4. **Baris chip** (11px, border `--border`): `Sewa`, `Beli`, dan `Garansi` bila `has_warranty` aktif. Di sebelah kanan: `N terjual` (12px, `--text-2`) **hanya jika angkanya nyata dan ≥ ambang** (`min_sold_display`, default 5).

**Aturan data (tidak boleh dipalsukan):**

- `Baru`: layanan dibuat ≤ 14 hari lalu.
- `Terlaris`: tiga layanan dengan jumlah pesanan `PAID` terbanyak, dan hanya jika masing-masing ≥ `min_sold_display`.
- `N terjual`: jumlah order `PAID` untuk layanan itu (dihitung dengan `withCount`, tanpa N+1).
- Tidak ada rating bintang, jumlah dilihat, atau "stok tinggal sedikit" yang dikarang. `Stok Menipis` hanya muncul dari data stok sebenarnya.

Hover: border `--border-strong` dan latar `--surface-hover`, tanpa transform. Fokus: ring aksen.

Badge status stok: `Tersedia` (aksen), `Stok Menipis` (warning), `Habis` (danger), `Sewa Penuh` (warning, hanya jika layanan punya paket beli aktif). Layanan `Habis` dipindah ke bagian "Sedang Kosong" (6.31).

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

### 6.8 Metode Pembayaran (tanpa seksi tersendiri di beranda)

Metode pembayaran **tidak** punya seksi sendiri di beranda. Informasinya tampil di tiga tempat: **Langkah 3 checkout** (pilihan lengkap, 6.13), **invoice** (instruksi bayar), dan **kolom metode pembayaran di footer** (6.10). Di footer, tiap metode ditampilkan sebagai logo 24px di atas **plat logo putih** (`.logo-plate`: latar putih, padding 4×8px, border `--border`, radius 6px) bila admin mengunggah `logo_path`, selain itu label teks dengan ikon `QrCode`/`Landmark`/`Wallet`. Jangan memakai kata "Resmi" pada judul atau label. Logo merek pihak ketiga hanya yang diunggah admin sendiri.

### 6.9 Tanya Jawab (Strip Bantuan dan Modal)

Beranda **tidak** memuat daftar pertanyaan penuh. Sebagai gantinya ada **Strip Bantuan**: satu kartu ramping (tinggi ≤ 72px, border 1px) berisi ikon `CircleHelp`, teks "Punya pertanyaan seputar pemesanan?", dan tombol Secondary **Buka Tanya Jawab**.

- **Modal Tanya Jawab:** lebar maks 640px, tinggi maks 80vh dengan isi dapat digulir. Isi: kotak cari (filter instan pada pertanyaan dan jawaban), daftar pertanyaan sebagai akordeon (`aria-expanded`, `aria-controls`, boleh beberapa terbuka), dan di bawahnya tautan **Tanya admin via WhatsApp** (disembunyikan bila `admin_whatsapp` kosong). Hasil pencarian kosong menampilkan "Tidak ada pertanyaan yang cocok" dan tombol Reset.
- **Perilaku:** fokus terkunci di dalam modal, `Esc` dan klik di luar menutup, fokus kembali ke tombol pemicu saat ditutup. Tautan `/#faq` (dari footer atau halaman lain) membuka modal saat halaman dimuat; saat ditutup, hash dihapus dengan `history.replaceState` agar tombol Kembali tidak berputar. Isi pertanyaan tetap dari `resources/js/data/faq.ts` (PRD 5.6).

### 6.10 Footer

Border atas 1px, latar `--bg`. Empat kolom (desktop) / bertumpuk (mobile):

1. **Brand:** BrandMark (nama, logo, tagline), satu kalimat deskripsi, dan **tautan sosial** (ikon Lucide `Send` untuk Telegram, `Instagram`, dan seterusnya sesuai yang diisi di Pengaturan; hanya yang terisi yang tampil, dibuka di tab baru dengan `rel="noopener noreferrer"`).
2. **Tautan penting:** Beranda, Katalog, Cek Pesanan, Syarat & Ketentuan, Kebijakan Privasi.
3. **Kontak & jam kerja:** WhatsApp admin (`settings.admin_whatsapp`) dan **Jam Operasional** (`settings.business_hours`).
4. **Metode pembayaran:** logo atau label metode aktif (sama dengan 6.8, ukuran kecil).

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

### 6.26 Banner Slider (dapat diedit admin)

- **Tempat:** di atas bar kuota. Jika ada ≥ 1 banner aktif, pita intro (6.2) disembunyikan.
- **Ukuran:** tinggi 120px (mobile) / 160px (≥ 768px), lebar penuh kontainer, radius 8px, border 1px `--border`. Maksimal 5 banner aktif.
- **Isi:** judul (16px/600, maks 2 baris), subjudul opsional (13px, `--text-2`, maks 2 baris), tombol opsional (Secondary kecil, tinggi 32px). Gambar opsional di sisi kanan (lebar ≤ 35%, `object-cover`). **Teks tidak pernah diletakkan di atas gambar** dan tidak ada gradien/scrim. Latar banner mengikuti `tone`: `neutral` (`--surface-2`), `accent` (`--accent` 10%), `warning` (`--warning` 10%).
- **Gerak:** geser manual dengan `scroll-snap` horizontal. **Tanpa autoplay.** Desktop: tombol panah kiri/kanan. Indikator titik (tombol dengan `aria-label` "Banner 2 dari 4"). Satu banner saja = tanpa kontrol. Navigasi keyboard dengan panah kiri/kanan.
- **Jadwal:** banner punya `starts_at`/`ends_at` opsional. Hanya yang aktif dan dalam jadwal dikirim ke publik.
- **Tautan:** `cta_url` hanya path internal yang diawali `/` atau `https://`. Skema lain (mis. `javascript:`) ditolak.
- **Tanggung jawab konten:** form admin menampilkan pengingat "Jangan menulis klaim yang tidak bisa dibuktikan (mis. jumlah pengguna, 'resmi', 'termurah')".

### 6.27 Kartu Keunggulan ("Kenapa Beli di Sini")

Seksi setelah katalog. Judul seksi 16px/600. Grid: 1 kolom (mobile), 2 kolom ≥ 480px, 3 kolom ≥ 1024px. Kartu: kotak ikon 36px (`--surface-2`, ikon Lucide 20px `--accent-text`), judul 14px/600, satu kalimat 13px `--text-2`. Maksimal 6 kartu, tinggi kartu ≤ 96px. Isi disimpan di `resources/js/data/benefits.ts`. Default (tulis dengan kata sendiri, hanya klaim yang benar untuk toko ini, dan **sesuaikan dengan kebijakan nyata pemilik**):

| Judul | Keterangan | Ikon |
| :-- | :-- | :-- |
| Verifikasi manual | Setiap pembayaran dicek admin sebelum akun dikirim. | `ShieldCheck` |
| Kuota sewa terbatas | Maksimal 3 penyewa per hari agar akun tetap lancar. | `Users` |
| Garansi selama masa aktif | Akun bermasalah diganti atau dikompensasi selama masa sewa. | `LifeBuoy` |
| Nominal pasti | Total sudah termasuk kode unik. Transfer sesuai angka di invoice. | `Receipt` |
| Akun di halaman invoice | Detail akun tampil setelah pembayaran diverifikasi. | `KeyRound` |
| Tanpa daftar akun | Cukup nomor WhatsApp. Lacak pesanan kapan saja. | `SearchCheck` |

### 6.28 BrandMark

Nama toko (15px/600) dengan logo opsional 28×28 (radius 6, `object-contain`) di kiri nama, dan **tagline opsional** (12px, `--text-2`, satu baris, maks 60 karakter, ditulis sendiri oleh pemilik toko) di bawah nama pada header desktop dan footer. Pada header mobile tagline disembunyikan. Dipakai di header, footer, dan halaman login. Nama, logo, dan tagline berasal dari Pengaturan (`store_name`, `store_logo_path`, `store_tagline`). Judul tab browser (`<title>`) memakai `store_name`.

### 6.29 Bar Pengumuman

Strip tipis di paling atas halaman publik (di atas header, ikut tergulir, tidak sticky). Tinggi 32px, latar `--surface-2`, border bawah 1px, teks 12px/500 `--text` rata tengah, maksimal satu baris dengan pemotongan (ellipsis). Isi: teks (maks 160 karakter) dan tautan opsional (seluruh strip menjadi tautan, dengan ikon `ChevronRight` kecil di akhir). Diatur di Pengaturan (`announcement_text`, `announcement_url`, `announcement_active`). Tautan: path internal berawalan `/` atau `https://`. Tidak ada tombol tutup, tidak ada animasi. Contoh penggunaan: info jam operasional khusus, stok baru, atau tautan channel Telegram toko. Jangan memuat klaim yang tidak bisa dibuktikan.

### 6.30 Toolbar Katalog

Satu blok di atas grid, tinggi total ≤ 96px di mobile (dua baris) dan 40px di desktop (satu baris):

- **Cari layanan:** input 40px dengan ikon `Search`, placeholder "Cari layanan", tombol hapus (`X`) saat terisi. Pencarian di sisi klien, tidak peka huruf besar/kecil, cocok pada nama dan kategori, debounce 150ms, tanpa reload.
- **Tipe:** kontrol segmen Semua / Sewa / Beli (6.5 sebelumnya).
- **Kategori:** dropdown (disembunyikan bila hanya satu kategori).
- **Urutkan:** dropdown: `Urutan toko` (default), `Terlaris` (hanya jika ada ≥ 3 layanan dengan data terjual nyata), `Terbaru`, `Harga terendah`.
- Hasil kosong: "Tidak ada layanan yang cocok" + tombol **Reset**.
- Mobile: input pencarian satu baris penuh, di bawahnya baris yang dapat digulir horizontal berisi Tipe, Kategori, dan Urutkan.

### 6.31 Bagian "Sedang Kosong"

Layanan yang **seluruh** paketnya tidak bisa dipesan karena stok unit habis dipindah dari grid utama ke bagian tersendiri di bawahnya, dengan judul "Sedang Kosong" (16px/600) dan keterangan satu baris: "Stok sedang kosong. Hubungi admin untuk info restock." Kartu memakai tata letak 6.6 dengan opacity 60% dan badge `Habis`, tetap berupa tautan ke halaman layanan. Bagian ini disembunyikan bila tidak ada layanan kosong. Layanan yang hanya kuota sewanya penuh (tetapi paket beli tersedia) tetap di grid utama dengan badge `Sewa Penuh`.

### 6.32 Ajakan Pesanan Custom (opsional)

Kartu satu baris sebelum footer (border 1px, padding 16px): judul 16px/600 "Belum menemukan layanan yang kamu cari?", satu kalimat 14px `--text-2` yang ditulis sendiri oleh pemilik toko, dan tombol Secondary "Tanya Admin via WhatsApp" yang membuka `https://wa.me/…` dengan teks awal. Tampil hanya jika `custom_request_enabled` aktif dan `admin_whatsapp` terisi. Jangan menjanjikan layanan atau waktu yang tidak bisa dipenuhi.

### 6.33 Layout Admin

**Satu navigasi saja.** Dilarang menumpuk layout bawaan starter kit (sidebar "Platform/Repository/Documentation") dengan layout admin. Semua halaman yang hanya bisa diakses admin (dashboard, order, produk, stok, banner, metode pembayaran, pengaturan toko, dan pengaturan akun seperti profil, kata sandi, 2FA) memakai **satu** `AdminLayout`. Tidak ada tautan sisa starter kit (Repository, Documentation, logo Laravel). Nama brand di admin mengikuti `store_name`, dengan chip kecil "Admin".

**Desktop (≥ 1024px): sidebar kiri tetap**

- Lebar 240px, tinggi penuh, latar `--surface`, border kanan 1px. Atas: BrandMark + chip "Admin".
- Navigasi bergrup. Judul grup 11px huruf kapital `--text-2`:
  - **Operasional:** Dashboard, Order (lencana jumlah order `VERIFYING`, latar `--info` 12%, teks `--info`)
  - **Katalog:** Produk, Stok Akun, Banner
  - **Toko:** Metode Pembayaran, Pengaturan
- Bawah: **Lihat Toko** (ikon `ExternalLink`, tab baru), **Akun** (nama admin, membuka profil dan keamanan/2FA), **ThemeToggle**, **Keluar**.
- Item menu: tinggi 36px, ikon 16px + teks 14px. Aktif: latar `--surface-2`, garis kiri 2px `--accent`, teks `--text`, `aria-current="page"`. Hover: `--surface-hover`.

**Mobile (< 1024px):** bilah atas 56px (tombol menu, BrandMark, ThemeToggle). Menu membuka laci dari kiri berisi navigasi yang sama (fokus terkunci, `Esc` dan ketuk di luar menutup). Lencana Order tetap tampil. Aplikasi memiliki **satu** tombol menu, bukan dua.

**Area konten:** padding 16px (mobile) / 24px (desktop), lebar maks `max-w-6xl`, rata kiri di samping sidebar. Tautan lompat "Lewati ke konten" di awal.

**PageHeader:** judul 20px/600, subjudul 14px `--text-2`, aksi di kanan (maks 2 tombol, tombol utama Primary), border bawah 1px, jarak bawah 24px. Di mobile aksi turun ke bawah judul.

**StatCard:** tinggi seragam, label 12px `--text-2`, **angka 28px/700 font sans dengan `tabular-nums`** (font mono hanya untuk kode invoice, nominal, nomor rekening), keterangan 12px `--text-2`. Ikon 16px `--text-2`, tanpa warna acak. Hanya kartu yang butuh tindakan (mis. Perlu Verifikasi > 0) yang diberi border `--info`. Kartu kuota menampilkan "Terpakai 1 dari 3" dan progress, tanpa dua angka yang saling tumpang tindih.

**Tidak menduplikasi angka.** Strip status hanya menampilkan status yang tidak sudah ada di kartu (mis. Kedaluwarsa dan Dibatalkan), dengan gaya teks sekunder.

**Tabel dan daftar:** tabel desktop (6.23). Di mobile **semua tabel admin berubah menjadi daftar kartu** dan halaman tidak boleh bergulir horizontal. Order `VERIFYING` yang menunggu ≥ 30 menit: kolom waktu berwarna `--warning`. Baris order dapat diklik. Indikator bukti bayar: "Ada bukti" (teks `--accent-text`) atau "Tanpa bukti" (`--text-2`).

**FormSection:** setiap kelompok field berupa kartu (judul 15px/600 + deskripsi singkat 13px `--text-2`), jarak antar-kartu 16px. Halaman Pengaturan yang panjang dibagi per bagian (Identitas, Kuota, Notifikasi, Tampilan Katalog, Sosial) dengan daftar tautan bagian di sisi kiri (desktop) atau di atas (mobile). Tombol **Simpan** menempel di bawah layar (sticky) saat ada perubahan.

**Pesan umpan balik:** keberhasilan dan kegagalan tampil sebagai banner di atas konten (`role="status"` atau `role="alert"`, ikon + teks, tutup otomatis tidak dipakai), bukan teks kecil di sudut. Aksi destruktif memakai modal konfirmasi (6.24).

### 6.34 Pola Judul Seksi

Setiap seksi beranda memakai pola yang sama: **eyebrow** (11px, huruf kapital, `--text-2`, jarak huruf 0.04em) di atas **judul** (18px/600), dengan tautan sekunder opsional di kanan ("Lihat semua", ikon `ChevronRight`). Ritme jarak antar-seksi: 48px (desktop) dan 32px (mobile); jarak judul ke isi 16px. Tidak ada garis hias atau ikon dekoratif di samping judul.

### 6.35 Stepper Status Pesanan

Dipakai di halaman invoice dan hasil Cek Pesanan. Empat langkah horizontal (vertikal di layar < 480px): **Dibuat → Dibayar → Diverifikasi → Selesai**.

- Petanya: `PENDING` = langkah 1 selesai, langkah 2 aktif; `VERIFYING` = 1 dan 2 selesai, langkah 3 aktif; `PAID` = semua selesai.
- `EXPIRED` dan `CANCELLED`: langkah yang sedang berjalan berhenti dan ditandai ikon `X` dengan label "Kedaluwarsa" atau "Dibatalkan" (warna `--text-2` dan `--danger`), langkah berikutnya redup.
- Tiap langkah: lingkaran 24px (selesai: latar `--accent`, ikon `Check` `--on-accent`; aktif: border `--accent` dan titik aksen; menunggu: border `--border-strong`), label 12px/500. Garis penghubung 2px (`--accent` untuk yang selesai, `--border` untuk sisanya).
- Status tidak boleh hanya berbasis warna: tiap langkah punya label teks dan ikon. `aria-label` pada daftar ("Langkah pesanan"), langkah aktif memakai `aria-current="step"`.

### 6.36 Halaman Layanan v2

- **Header band** di kolom kiri (atas di mobile): sampul layanan lebar (tinggi 120px mobile / 160px desktop, `object-cover`, atau blok tint merek bila tanpa sampul), logo 64px menumpang di tepi bawah sampul (tepi kiri, border 2px `--surface`), lalu nama layanan (20px/600), kategori, dan baris chip: `Garansi` (bila aktif), ketersediaan (`Tersedia`/`Stok Menipis`), dan `delivery_eta` bila diisi.
- **PackageOption v2:** grid 2 kolom di desktop (1 kolom mobile). Tiap kartu: ikon durasi (`Clock` untuk sewa, `CalendarDays` untuk beli), nama paket, **harga** (mono 16px/600), dan untuk paket sewa baris kecil `≈ Rp X/hari` (hasil `harga ÷ (durasi_jam ÷ 24)`, dibulatkan ke rupiah terdekat, nyata). Badge `Paling hemat per hari` (11px, aksen) hanya pada paket sewa dengan harga per hari terendah, dan hanya bila ada ≥ 2 paket sewa. Aturan keadaan disabled tetap sama (6.13), dengan alasan tertulis.
- **Ringkasan sticky (desktop):** di kolom kanan, kartu Ringkasan (paket, durasi, metode, total, tombol checkout) menempel di bawah header (`position: sticky; top: 72px`). Di mobile tetap memakai sticky bottom bar (6.17).
- **Indikator langkah:** di atas form, empat penanda kecil 1–4 yang berubah menjadi `Check` saat langkah terisi (tidak mengubah fungsi, hanya umpan balik).

### 6.37 Invoice v2

Urutan dari atas: (1) kode invoice + badge status, (2) Stepper (6.35), (3) kartu **Total Transfer** (6.20) paling menonjol, (4) **Countdown** (6.18) dengan **progress bar waktu** tipis (4px, `--accent`, berubah `--warning` ≤ 3 menit dan `--danger` ≤ 1 menit), (5) instruksi pembayaran dalam kartu: gambar QRIS di kotak putih lebih besar (maks 280px) atau nomor rekening dengan tombol Salin, (6) tiga langkah singkat berangka ("Transfer sesuai nominal", "Unggah bukti (opsional)", "Tekan Saya Sudah Bayar"), (7) tombol aksi, lalu Batalkan Pesanan (6.3), (8) tautan **Hubungi Admin via WhatsApp** (Ghost) dengan teks awal berisi kode invoice. Salin berhasil memunculkan toast kecil "Tersalin" (2 detik) di bawah layar, tidak menutup informasi pembayaran. Status `PAID`: kartu kredensial (6.22) naik ke posisi (3).

### 6.38 Statistik Nyata (opsional)

Baris 2 sampai 3 kartu kecil di awal seksi "Kenapa Beli di Sini": `N pesanan selesai`, `N layanan aktif`, `± N menit verifikasi`. **Syarat tampil:** `completed_orders ≥ stats_min_orders` (default 20, 0 = selalu sembunyikan), jumlah layanan aktif ≥ 3, dan median verifikasi hanya bila ≥ 10 sampel. Kartu yang datanya tidak memenuhi syarat tidak ditampilkan, dan jika semuanya tidak memenuhi, baris statistik hilang. Angka tidak pernah dibulatkan naik secara menyesatkan (jumlah selesai ditampilkan apa adanya).

### 6.39 Gerak dan Skeleton

- Token gerak: `--dur-fast: 120ms`, `--dur: 180ms`, easing `ease-out`. Hanya `background-color`, `border-color`, `opacity`, dan `box-shadow` fokus yang bertransisi.
- **Indikator navigasi Inertia:** bilah progres 2px berwarna `--accent` di tepi atas layar saat berpindah halaman.
- **Skeleton** untuk grid katalog dan kartu admin saat data dimuat ulang (pulse halus 1.5 detik). Tidak ada spinner layar penuh.
- Toast salin (6.37) dan banner umpan balik tampil dengan `opacity` saja, tanpa gerak berpindah.
- Semua gerak dimatikan oleh `prefers-reduced-motion`.

### 6.40 Switch (Toggle)

Ukuran 44×24px, radius penuh, area sentuh ≥ 44px. **Mati:** latar `--surface-2`, border 1px `--text-muted` (agar batas komponen terlihat, ≥ 3:1), kenop `--text-2`. **Hidup:** latar `--accent`, kenop `--on-accent`. Fokus: ring aksen 2px. Selalu disertai **label teks keadaan** ("Aktif" atau "Nonaktif") di sampingnya, karena keadaan tidak boleh bergantung pada warna atau posisi kenop saja. Gunakan `role="switch"` dan `aria-checked`.

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
2. Hero setinggi layar, headline raksasa, karusel otomatis, ilustrasi dekoratif tempelan. (Banner admin dengan tinggi terbatas dan gambar unggahan admin diperbolehkan, lihat 6.26.)
3. Emoji di antarmuka web.
4. Kartu "fitur" generik berisi klaim kosong, testimoni palsu, statistik karangan, logo partner yang tidak benar-benar partner.
5. Menyalin teks, aset, atau ilustrasi dari situs referensi (seakun.id atau lainnya).
6. Radius besar (> 12px), pil raksasa untuk aksi utama.
7. Animasi masuk/hover berlebihan (scale, bounce, float), karusel otomatis.
8. Lebih dari satu warna aksen toko, atau aksen untuk dekorasi. Pengecualian terbatas: tint warna merek layanan pada kotak logo (2.6 B).
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
- [ ] Kartu produk memakai logo 56px dengan tint merek, dan tetap rapi tanpa logo (kotak inisial).
- [ ] Banner slider: manual (tanpa autoplay), teks tidak di atas gambar, pita intro tersembunyi saat ada banner, dan fallback ke pita intro saat tidak ada.
- [ ] Seksi "Kenapa Beli di Sini" tampil setelah katalog dengan isi yang sesuai kebijakan toko.
- [ ] Empat preset aksen (emerald, teal, blue, mono) diperiksa di kedua mode: kontras `--accent-text` dan `--on-accent` ≥ 4.5:1 (hasil hitung dilaporkan).
- [ ] Tinggi area atas diukur lewat DOM: bar kuota penuh di 375×667, bar kuota + baris produk pertama di 1366×768, dengan banner aktif.
- [ ] `brand_color`, `cta_url`, dan `accent_preset` divalidasi server (tidak bisa menyisipkan CSS/skrip).
- [ ] Kartu produk v3: sampul 16:10 (atau blok tint + logo bila tanpa sampul), badge di atas sampul memakai latar solid, chip Sewa/Beli/Garansi, dan `N terjual` hanya dari data nyata (≥ ambang).
- [ ] Tidak ada rating, jumlah dilihat, atau angka terjual yang dikarang. Badge `Terlaris` dan `Baru` mengikuti aturan data di 6.6.
- [ ] Toolbar katalog: pencarian, tipe, kategori, dan urutkan bekerja bersamaan, dengan keadaan kosong dan Reset.
- [ ] Layanan stok habis muncul di bagian "Sedang Kosong", bukan di grid utama.
- [ ] Bar pengumuman 32px (opsional) dan ajakan pesanan custom hanya tampil bila diaktifkan dan terisi.
- [ ] Footer memuat tautan sosial (hanya yang terisi), jam kerja, kontak, dan metode pembayaran. Logo pembayaran di atas latar putih.
- [ ] Semua gambar unggahan diperkecil dan dikonversi ke WebP di server. Ukuran total transfer beranda dilaporkan.
- [ ] Dengan bar pengumuman + banner aktif bersamaan: bar kuota penuh di 375×667, dan bar kuota + baris produk pertama penuh di 1366×768.
- [ ] Saat ada pesanan aktif: tombol checkout nonaktif dengan alasan tertulis dan tautan Lanjutkan Pembayaran (halaman layanan dan sticky bar mobile).
- [ ] Invoice `PENDING` punya tombol Batalkan Pesanan dengan modal konfirmasi. Tidak tampil untuk `VERIFYING`/`PAID`.
- [ ] Pesan penolakan tidak menampilkan kode invoice milik orang lain.
- [ ] Panel admin hanya memiliki **satu** layout dan satu navigasi (sidebar desktop, laci mobile). Tidak ada sisa starter kit ("Repository", "Documentation", "Platform", logo Laravel).
- [ ] Brand admin memakai `store_name`. Tidak ada nama campuran (mis. "StreamPoint" dan "NamaToko") dalam satu layar.
- [ ] Dashboard: angka statistik berfont sans + tabular, tidak ada angka yang diulang antara kartu dan strip status, VERIFYING yang lama berwarna peringatan.
- [ ] Semua halaman admin diperiksa di 375px (tanpa scroll horizontal, tabel jadi kartu) dan 1366px, di mode terang dan gelap.
- [ ] Hero Fungsional tampil saat tidak ada banner aktif (tinggi 160px desktop, maks 140px mobile) dan hanya memuat data nyata. Baris yang datanya null tidak tampil.
- [ ] Stepper status benar untuk `PENDING`, `VERIFYING`, `PAID`, `EXPIRED`, dan `CANCELLED` (label teks dan ikon, bukan hanya warna).
- [ ] Halaman layanan v2: header band bersampul, harga per hari yang dihitung benar, badge `Paling hemat per hari` hanya bila ≥ 2 paket sewa, ringkasan sticky di desktop.
- [ ] Invoice v2: urutan elemen sesuai 6.37, progress bar waktu berwarna sesuai ambang, toast Tersalin tidak menutup info pembayaran.
- [ ] Statistik hanya tampil bila memenuhi ambang (tidak ada angka kecil yang memalukan atau karangan).
- [ ] Bilah progres navigasi dan skeleton aktif, dan mati pada `prefers-reduced-motion`.
- [ ] Dengan bar pengumuman dan hero aktif bersamaan: bar kuota penuh di 375×667, dan bar kuota + baris produk pertama penuh di 1366×768 (diukur lewat DOM).
- [ ] Tidak ada kelas palet Tailwind langsung atau hex di komponen (kecuali kotak QRIS dan overlay). `npm run check:tokens` bersih.
- [ ] Setiap kelas warna yang dipakai terdaftar di `@theme` (tidak ada kelas tanpa definisi).
- [ ] `npm run check:contrast` bersih: semua pasangan token ≥ 4.5:1 di kedua mode dan keempat preset, termasuk `--text-muted` di atas `--surface-2` dan `--surface-hover`.
- [ ] Tombol destruktif memakai `--danger-solid` + `--on-danger`. Tombol penuh warning memakai `--warning` + `--on-warning`.
- [ ] Switch mengikuti 6.40 (border terlihat saat mati, label teks keadaan, `role="switch"`).
- [ ] Metode pembayaran tidak punya seksi sendiri di beranda; logo di footer berada di atas plat putih (`.logo-plate`) dan terbaca di kedua mode, termasuk logo gelap di mode gelap.
- [ ] Strip Bantuan membuka modal Tanya Jawab yang mengunci fokus, menutup dengan `Esc`, mengembalikan fokus ke pemicu, dan terbuka otomatis lewat `/#faq`.
- [ ] Tidak ada kata klaim terlarang di string UI: "resmi", "legal", "terpercaya", "terbaik", "termurah", "100%". `npm run check:copy` bersih.
- [ ] `npm run check:contrast` mencakup matriks penuh (teks pada empat permukaan, accent-text pada bg dan surface, on-accent pada accent dan hover untuk keempat preset, warna status pada surface dan surface-2), dengan jumlah pasangan dilaporkan.
