import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, BookOpen, Clock, MessageCircle } from 'lucide-react';

interface MobileBottomNavProps {
    adminWhatsapp?: string | null;
    isProductPage?: boolean;
}

export function MobileBottomNav({ adminWhatsapp, isProductPage = false }: MobileBottomNavProps) {
    const { url } = usePage();

    // Hide mobile bottom nav on product page (where product sticky checkout button bar is active)
    if (isProductPage) {
        return null;
    }

    let cleanPhone = adminWhatsapp ? adminWhatsapp.replace(/\D/g, '') : '';
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.slice(1);
    }

    const isCaraPesanActive = typeof window !== 'undefined' && window.location.hash === '#cara-pesan';
    const isOrdersActive = url.startsWith('/cek-pesanan') || url.startsWith('/invoice');
    const isCatalogActive = !isOrdersActive && !isCaraPesanActive && (url === '/' || url.startsWith('/#') || url.startsWith('/p/'));

    const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Halo Admin, saya butuh bantuan terkait pemesanan di StreamPoint.')}`
        : '/#faq';

    return (
        <nav
            aria-label="Navigasi Bawah Mobile"
            className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around px-1 pb-[env(safe-area-inset-bottom)] transition-colors shadow-2xs"
        >
            {/* 1. Katalog */}
            <Link
                href="/#katalog"
                className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-[10px] transition-colors select-none ${
                    isCatalogActive
                        ? 'text-accent-text font-bold'
                        : 'text-text-2 hover:text-text font-medium'
                }`}
            >
                {isCatalogActive && (
                    <span className="absolute top-0 w-8 h-0.5 bg-accent rounded-full" />
                )}
                <LayoutGrid className="w-5 h-5 shrink-0" />
                <span className="truncate">Katalog</span>
            </Link>

            {/* 2. Cara Pesan */}
            <a
                href="/#cara-pesan"
                className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-[10px] transition-colors select-none ${
                    isCaraPesanActive
                        ? 'text-accent-text font-bold'
                        : 'text-text-2 hover:text-text font-medium'
                }`}
            >
                {isCaraPesanActive && (
                    <span className="absolute top-0 w-8 h-0.5 bg-accent rounded-full" />
                )}
                <BookOpen className="w-5 h-5 shrink-0" />
                <span className="truncate">Cara Pesan</span>
            </a>

            {/* 3. Riwayat / Pesanan */}
            <Link
                href="/cek-pesanan"
                className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-[10px] transition-colors select-none ${
                    isOrdersActive
                        ? 'text-accent-text font-bold'
                        : 'text-text-2 hover:text-text font-medium'
                }`}
            >
                {isOrdersActive && (
                    <span className="absolute top-0 w-8 h-0.5 bg-accent rounded-full" />
                )}
                <Clock className="w-5 h-5 shrink-0" />
                <span className="truncate">Pesanan</span>
            </Link>

            {/* 4. Bantuan (WhatsApp / FAQ) */}
            <a
                href={waUrl}
                target={cleanPhone ? '_blank' : '_self'}
                rel={cleanPhone ? 'noopener noreferrer' : undefined}
                className="relative flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-[10px] text-text-2 hover:text-text font-medium transition-colors select-none"
            >
                <MessageCircle className="w-5 h-5 shrink-0 text-accent-text" />
                <span className="truncate">Bantuan</span>
            </a>
        </nav>
    );
}

export default MobileBottomNav;
