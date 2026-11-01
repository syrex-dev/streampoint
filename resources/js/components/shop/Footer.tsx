import React from 'react';
import { Link } from '@inertiajs/react';
import { MessageCircle, Clock, ShieldCheck } from 'lucide-react';
import { SharedSettings } from '@/types/shop';

interface FooterProps {
    storeName?: string;
    settings?: SharedSettings | null;
}

export function Footer({ storeName = 'NamaToko', settings }: FooterProps) {
    const currentYear = new Date().getFullYear();
    const adminPhone = settings?.admin_whatsapp;
    const businessHours = settings?.business_hours || 'Setiap hari, 09.00 - 21.00 WIB';

    let cleanPhone = adminPhone ? adminPhone.replace(/\D/g, '') : '';
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.slice(1);
    }

    return (
        <footer className="w-full border-t border-border bg-bg mt-16 sm:mt-24 transition-colors">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-8">
                {/* 3 Columns Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-xs">
                    {/* Col 1: Brand (5 cols) */}
                    <div className="md:col-span-5 space-y-2.5">
                        <Link href="/" className="text-sm font-bold tracking-tight text-text hover:text-accent-text transition-colors">
                            {storeName}
                        </Link>
                        <p className="text-text-2 leading-relaxed max-w-sm">
                            Platform sewa harian dan beli akun streaming terpercaya dengan kuota terbatas setiap hari dan verifikasi manual yang cepat.
                        </p>
                    </div>

                    {/* Col 2: Navigation Links (3 cols) */}
                    <div className="md:col-span-3 space-y-2.5">
                        <h4 className="font-semibold text-text uppercase tracking-wider text-[11px]">
                            Navigasi
                        </h4>
                        <ul className="space-y-2 text-text-2">
                            <li>
                                <Link href="/cek-pesanan" className="hover:text-text transition-colors">
                                    Cek Status Pesanan
                                </Link>
                            </li>
                            <li>
                                <Link href="/syarat-ketentuan" className="hover:text-text transition-colors">
                                    Syarat & Ketentuan
                                </Link>
                            </li>
                            <li>
                                <Link href="/kebijakan-privasi" className="hover:text-text transition-colors">
                                    Kebijakan Privasi
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Col 3: Contact & Hours (4 cols) */}
                    <div className="md:col-span-4 space-y-2.5">
                        <h4 className="font-semibold text-text uppercase tracking-wider text-[11px]">
                            Hubungi Kami
                        </h4>
                        <div className="space-y-2 text-text-2">
                            {adminPhone && (
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="w-3.5 h-3.5 text-accent-text shrink-0" />
                                    <a
                                        href={`https://wa.me/${cleanPhone}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-text hover:text-accent-text transition-colors"
                                    >
                                        +{cleanPhone}
                                    </a>
                                </div>
                            )}

                            <div className="flex items-start gap-2">
                                <Clock className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                                <div>
                                    <span className="block font-medium text-text">Jam Operasional</span>
                                    <span>{businessHours}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar: Copyright & Non-affiliation Disclaimer */}
                <div className="pt-6 border-t border-border space-y-2.5 text-[11px] text-text-2 leading-relaxed">
                    <p>
                        &copy; {currentYear} {storeName}. Hak cipta dilindungi.
                    </p>
                    <p className="text-text-muted">
                        Situs ini layanan independen dan tidak berafiliasi dengan, didukung, atau terkait dengan Netflix, YouTube, Spotify, atau penyedia layanan lain. Seluruh merek dagang adalah milik pemiliknya masing-masing.
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
