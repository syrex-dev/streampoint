import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Shield } from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';

export default function Terms({ storeName = 'NamaToko' }: { storeName?: string }) {
    return (
        <PublicLayout storeName={storeName}>
            <Head title={`Syarat & Ketentuan - ${storeName}`} />

            <div className="w-full max-w-3xl mx-auto py-4 sm:py-8 space-y-6">
                <div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs text-text-2 hover:text-text transition-colors mb-4"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Kembali ke Beranda</span>
                    </Link>

                    <div className="flex items-center gap-2.5 text-text">
                        <Shield className="w-5 h-5 text-accent-text" />
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                            Syarat & Ketentuan Layanan
                        </h1>
                    </div>
                    <p className="text-xs text-text-2 mt-1">
                        Terakhir diperbarui: 01 November 2026
                    </p>
                </div>

                <div className="bg-surface border border-border rounded-lg p-5 sm:p-7 space-y-6 text-xs text-text-2 leading-relaxed">
                    <section className="space-y-2">
                        <h2 className="text-sm font-semibold text-text">1. Ketentuan Umum</h2>
                        <p>
                            Dengan melakukan pemesanan di {storeName}, Anda menyetujui seluruh syarat dan ketentuan yang berlaku. Layanan kami menyediakan sewa harian akun bersama dan pembelian akun streaming personal.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-sm font-semibold text-text">2. Aturan Penggunaan Akun Sewa</h2>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Akun hanya boleh digunakan pada profil dan PIN yang telah dialokasikan untuk Anda.</li>
                            <li>Dilarang keras mengubah email, kata sandi, profil, atau pengaturan pembayaran akun.</li>
                            <li>Pelanggaran terhadap aturan ini akan mengakibatkan pemutusan akses tanpa pengembalian dana.</li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-sm font-semibold text-text">3. Pembayaran dan Batas Waktu</h2>
                        <p>
                            Setiap pesanan memiliki batas waktu pembayaran selama 15 menit dengan kode unik yang harus ditransfer secara tepat. Pesanan yang tidak dibayar dalam batas waktu tersebut akan dibatalkan otomatis oleh sistem.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-sm font-semibold text-text">4. Garansi dan Penggantian Akun</h2>
                        <p>
                            Garansi berlaku selama masa aktif sewa atau masa garansi beli yang disepakati. Jika akun mengalami gangguan sebelum masa berlaku habis, kami akan melakukan perbaikan atau memberikan akun pengganti.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-sm font-semibold text-text">5. Pernyataan Non-Afiliasi</h2>
                        <p className="text-text-muted">
                            {storeName} adalah penyedia layanan independen dan tidak terafiliasi secara resmi dengan Netflix, YouTube, Spotify, Disney+, atau penyedia platform streaming mana pun. Seluruh merek dagang dan hak cipta merupakan milik dari pemegang lisensi masing-masing.
                        </p>
                    </section>
                </div>
            </div>
        </PublicLayout>
    );
}
