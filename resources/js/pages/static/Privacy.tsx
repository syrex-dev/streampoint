import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Lock } from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';

export default function Privacy({ storeName = 'NamaToko' }: { storeName?: string }) {
    return (
        <PublicLayout storeName={storeName}>
            <Head title={`Kebijakan Privasi - ${storeName}`} />

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
                        <Lock className="w-5 h-5 text-accent-text" />
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                            Kebijakan Privasi
                        </h1>
                    </div>
                    <p className="text-xs text-text-2 mt-1">
                        Terakhir diperbarui: 01 November 2026
                    </p>
                </div>

                <div className="bg-surface border border-border rounded-lg p-5 sm:p-7 space-y-6 text-xs text-text-2 leading-relaxed">
                    <section className="space-y-2">
                        <h2 className="text-sm font-semibold text-text">1. Informasi yang Kami Kumpulkan</h2>
                        <p>
                            Kami hanya mengumpulkan informasi yang esensial untuk memproses pesanan dan meneruskan kredensial akun streaming kepada Anda, yaitu nomor WhatsApp aktif dan catatan pemesanan (opsional). Kami tidak meminta kata sandi pribadi Anda atau data kartu kredit.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-sm font-semibold text-text">2. Penggunaan Informasi</h2>
                        <p>
                            Nomor WhatsApp Anda hanya digunakan untuk verifikasi status pesanan, pencarian riwayat transaksi di halaman Cek Pesanan, serta komunikasi bantuan bila terjadi kendala pada akun yang disewa. Kami tidak pernah menjual atau membagikan data nomor telepon Anda kepada pihak ketiga untuk tujuan pemasaran.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-sm font-semibold text-text">3. Keamanan Bukti Transfer</h2>
                        <p>
                            File bukti transfer pembayaran yang Anda unggah disimpan di direktori privat server kami dengan nama terenkripsi dan tidak dapat diakses secara publik melalui tautan web biasa. Hanya tim admin terotorisasi yang dapat melihat bukti transfer saat proses verifikasi pesanan.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-sm font-semibold text-text">4. Penyimpanan Lokal Browser</h2>
                        <p>
                            Situs ini menggunakan session cookie dan penyimpanan lokal browser (localStorage) semata-mata untuk menyimpan preferensi tampilan (tema Terang/Gelap) dan sesi invoice aktif Anda.
                        </p>
                    </section>

                    <section className="space-y-2">
                        <h2 className="text-sm font-semibold text-text">5. Kontak Privasi</h2>
                        <p>
                            Jika Anda memiliki pertanyaan mengenai kebijakan privasi ini atau ingin meminta penghapusan riwayat transaksi Anda, silakan hubungi admin kami melalui kontak WhatsApp yang tersedia.
                        </p>
                    </section>
                </div>
            </div>
        </PublicLayout>
    );
}
