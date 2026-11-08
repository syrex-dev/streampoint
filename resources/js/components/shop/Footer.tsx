import React from 'react';
import { Link } from '@inertiajs/react';
import { MessageCircle, Clock, Send, Instagram, AtSign, Music2, QrCode, Landmark, Wallet } from 'lucide-react';
import { SharedSettings } from '@/types/shop';
import { BrandMark } from '@/components/shop/BrandMark';

interface FooterProps {
    storeName?: string;
    settings?: SharedSettings | null;
    socialLinks?: {
        telegram?: string | null;
        instagram?: string | null;
        threads?: string | null;
        tiktok?: string | null;
    } | null;
    paymentMethods?: Array<{
        id: number;
        type: string;
        label: string;
        logo_url?: string | null;
    }>;
}

export function Footer({ storeName = 'StreamPoint', settings, socialLinks, paymentMethods = [] }: FooterProps) {
    const currentYear = new Date().getFullYear();
    const adminPhone = settings?.admin_whatsapp;
    const businessHours = settings?.business_hours || 'Setiap hari, 09.00 - 21.00 WIB';
    const social = socialLinks ?? settings?.social_links;

    let cleanPhone = adminPhone ? adminPhone.replace(/\D/g, '') : '';
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.slice(1);
    }

    const socialItems = [
        { key: 'telegram', icon: Send, url: social?.telegram, label: 'Telegram' },
        { key: 'instagram', icon: Instagram, url: social?.instagram, label: 'Instagram' },
        { key: 'threads', icon: AtSign, url: social?.threads, label: 'Threads' },
        { key: 'tiktok', icon: Music2, url: social?.tiktok, label: 'TikTok' },
    ].filter((item) => Boolean(item.url));

    const getPaymentIcon = (type: string) => {
        switch (type) {
            case 'QRIS':
                return <QrCode className="w-3.5 h-3.5 text-text-2" />;
            case 'BANK':
                return <Landmark className="w-3.5 h-3.5 text-text-2" />;
            case 'EWALLET':
            default:
                return <Wallet className="w-3.5 h-3.5 text-text-2" />;
        }
    };

    return (
        <footer className="w-full border-t border-border bg-bg mt-16 sm:mt-24 transition-colors">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-8">
                {/* 4 Columns Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 text-xs">
                    {/* Col 1: Brand (4 cols) */}
                    <div className="md:col-span-4 space-y-3">
                        <Link href="/" className="hover:opacity-90 transition-opacity inline-block">
                            <BrandMark variant="full" showTagline={false} />
                        </Link>
                        <p className="text-text-2 leading-relaxed max-w-sm">
                            Platform sewa harian dan beli akun streaming dengan kuota terkontrol setiap hari dan verifikasi manual.
                        </p>

                        {/* Social Links (only filled ones) */}
                        {socialItems.length > 0 && (
                            <div className="flex items-center gap-2 pt-1">
                                {socialItems.map((item) => {
                                    const IconComponent = item.icon;
                                    return (
                                        <a
                                            key={item.key}
                                            href={item.url!}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={item.label}
                                            className="w-7 h-7 rounded border border-border bg-surface-2 flex items-center justify-center text-text-2 hover:text-text hover:border-border-strong transition-colors"
                                        >
                                            <IconComponent className="w-3.5 h-3.5" />
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Col 2: Tautan Penting (3 cols) */}
                    <div className="md:col-span-3 space-y-2.5">
                        <h4 className="font-semibold text-text uppercase tracking-wider text-[11px]">
                            Tautan Penting
                        </h4>
                        <ul className="space-y-2 text-text-2">
                            <li>
                                <Link href="/" className="hover:text-text transition-colors">
                                    Beranda
                                </Link>
                            </li>
                            <li>
                                <Link href="/#katalog" className="hover:text-text transition-colors">
                                    Katalog Layanan
                                </Link>
                            </li>
                            <li>
                                <Link href="/cek-pesanan" className="hover:text-text transition-colors">
                                    Cek Status Pesanan
                                </Link>
                            </li>
                            <li>
                                <a href="/#faq" className="hover:text-text transition-colors">
                                    Tanya Jawab (FAQ)
                                </a>
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

                    {/* Col 3: Kontak & Jam Kerja (3 cols) */}
                    <div className="md:col-span-3 space-y-2.5">
                        <h4 className="font-semibold text-text uppercase tracking-wider text-[11px]">
                            Kontak & Jam Kerja
                        </h4>
                        <div className="space-y-2.5 text-text-2">
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
                                <Clock className="w-3.5 h-3.5 text-text-2 shrink-0 mt-0.5" />
                                <div>
                                    <span className="block font-medium text-text">Jam Operasional</span>
                                    <span>{businessHours}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Col 4: Metode Pembayaran (2 cols) */}
                    <div className="md:col-span-2 space-y-2.5">
                        <h4 className="font-semibold text-text uppercase tracking-wider text-[11px]">
                            Metode Pembayaran
                        </h4>
                        {paymentMethods.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                                {paymentMethods.map((pm) => (
                                    <div
                                        key={pm.id}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border bg-surface-2 text-[11px] font-medium text-text"
                                    >
                                        {pm.logo_url ? (
                                            <div className="logo-plate shrink-0">
                                                <img
                                                    src={pm.logo_url}
                                                    alt={pm.label}
                                                    className="h-3.5 max-w-[48px] object-contain"
                                                    loading="lazy"
                                                />
                                            </div>
                                        ) : (
                                            getPaymentIcon(pm.type)
                                        )}
                                        <span>{pm.label}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-text-2 text-[11px]">QRIS & Transfer Bank</p>
                        )}
                        <p className="text-[10px] text-text-2 leading-relaxed">
                            Verifikasi manual oleh admin.
                        </p>
                    </div>
                </div>

                {/* Bottom Bar: Copyright & Non-affiliation Disclaimer */}
                <div className="pt-6 border-t border-border space-y-2 text-xs text-text-2 leading-relaxed">
                    <p>
                        &copy; {currentYear} {storeName}. Hak cipta dilindungi.
                    </p>
                    <p className="text-text-2 opacity-80">
                        Situs ini layanan independen dan tidak berafiliasi dengan, didukung, atau terkait dengan Netflix, YouTube, Spotify, atau penyedia layanan lain. Seluruh merek dagang adalah milik pemiliknya masing-masing.
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
