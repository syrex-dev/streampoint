import React, { ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { ThemeToggle } from '@/components/shop/ThemeToggle';
import { PendingOrderBanner } from '@/components/shop/PendingOrderBanner';
import { Footer } from '@/components/shop/Footer';
import { FloatingWhatsApp } from '@/components/shop/FloatingWhatsApp';
import { MobileBottomNav } from '@/components/shop/MobileBottomNav';
import { SharedSettings, SharedPendingOrder } from '@/types/shop';

import { BrandMark } from '@/components/shop/BrandMark';
import { AnnouncementBar } from '@/components/shop/AnnouncementBar';

interface PublicLayoutProps {
    storeName?: string;
    currentInvoiceCode?: string;
    isProductPage?: boolean;
    paymentMethods?: Array<{
        id: number;
        type: string;
        label: string;
        logo_url?: string | null;
    }>;
    children: ReactNode;
}

export function PublicLayout({
    storeName,
    currentInvoiceCode,
    isProductPage = false,
    paymentMethods = [],
    children,
}: PublicLayoutProps) {
    const { settings, pendingOrder, announcement, socialLinks } = usePage<{
        settings?: SharedSettings;
        pendingOrder?: SharedPendingOrder;
        announcement?: { text: string; url?: string | null } | null;
        socialLinks?: {
            telegram?: string | null;
            instagram?: string | null;
            threads?: string | null;
            tiktok?: string | null;
        } | null;
    }>().props;

    const navLinks = [
        { label: 'Layanan', href: '/#katalog' },
        { label: 'Cara Pesan', href: '/#cara-pesan' },
        { label: 'FAQ', href: '/#faq' },
    ];

    return (
        <div className="min-h-screen bg-bg text-text flex flex-col antialiased selection:bg-accent selection:text-on-accent transition-colors">
            {/* Skip to Content accessible link */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3.5 focus:py-2 focus:bg-surface focus:text-text focus:border focus:border-border-strong focus:rounded-md focus:text-xs focus:font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
            >
                Lewati ke konten
            </a>

            {/* Announcement Bar (32px, above header, scrolls with page) */}
            <AnnouncementBar announcement={announcement ?? settings?.announcement} />

            {/* Sticky Header 56px */}
            <header className="h-14 border-b border-border bg-bg/95 backdrop-blur-none shrink-0 z-30 sticky top-0 transition-colors">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
                    {/* Brand / Logo */}
                    <div className="flex items-center gap-6">
                        <Link
                            href="/"
                            className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent inline-flex items-center"
                        >
                            <BrandMark variant="full" />
                        </Link>

                        {/* Desktop Anchor Navigation */}
                        <nav className="hidden md:flex items-center gap-5 text-xs text-text-2">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className="hover:text-text transition-colors py-1 outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </nav>
                    </div>

                    {/* Right Action Bar */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Riwayat & Cek Pesanan (Desktop & Tablet) */}
                        <Link
                            href="/cek-pesanan"
                            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-text hover:text-accent-text px-2.5 py-1.5 rounded-md hover:bg-surface-hover transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            title="Riwayat & Cek Status Pesanan"
                        >
                            <Search className="w-3.5 h-3.5 text-text-2 shrink-0" />
                            <span>Riwayat Pesanan</span>
                        </Link>

                        {/* Theme Toggle Button */}
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Pending Order Notification Banner */}
            <PendingOrderBanner order={pendingOrder} currentInvoiceCode={currentInvoiceCode} />

            {/* Main Content Area */}
            <main id="main-content" className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 pb-20 md:pb-6">
                {children}
            </main>

            {/* Footer (Hidden on Mobile) */}
            <Footer storeName={storeName} settings={settings} socialLinks={socialLinks} paymentMethods={paymentMethods} />

            {/* Mobile Bottom Navigation Bar (Active on Mobile, Replaces Hamburger & Footer) */}
            <MobileBottomNav adminWhatsapp={settings?.admin_whatsapp} isProductPage={isProductPage} />

            {/* Floating WhatsApp Help Button (Only on Desktop, or Mobile Product Page) */}
            <FloatingWhatsApp phone={settings?.admin_whatsapp} isProductPage={isProductPage} />
        </div>
    );
}

export default PublicLayout;
