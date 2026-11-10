import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    ShoppingBag, 
    Package,
    KeyRound,
    CreditCard,
    Image as ImageIcon,
    Settings as SettingsIcon, 
    LogOut, 
    Menu, 
    X, 
    ExternalLink,
    User,
    Star,
    MessageSquare,
} from 'lucide-react';
import { ThemeToggle } from '@/components/shop/ThemeToggle';
import { BrandMark } from '@/components/shop/BrandMark';
import { FlashBanner } from '@/components/admin/FlashBanner';

interface AdminLayoutProps {
    title?: string;
    children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const { url } = usePage();
    const { auth, flash, errors, verifyingCount } = usePage<{
        auth: { user: { name: string; email: string } | null };
        flash?: { success?: string; error?: string; status?: string };
        errors: Record<string, string>;
        verifyingCount?: number;
    }>().props;

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    // Close mobile menu on Escape and manage focus
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
                menuButtonRef.current?.focus();
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
            drawerRef.current?.focus();
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    const navGroups = [
        {
            title: 'Operasional',
            items: [
                {
                    label: 'Dashboard',
                    href: '/admin',
                    icon: LayoutDashboard,
                    exact: true,
                    badge: null,
                },
                {
                    label: 'Order',
                    href: '/admin/orders',
                    icon: ShoppingBag,
                    exact: false,
                    badge: typeof verifyingCount === 'number' && verifyingCount > 0 ? verifyingCount : null,
                },
            ],
        },
        {
            title: 'Katalog',
            items: [
                {
                    label: 'Produk',
                    href: '/admin/products',
                    icon: Package,
                    exact: false,
                    badge: null,
                },
                {
                    label: 'Stok Akun',
                    href: '/admin/accounts',
                    icon: KeyRound,
                    exact: false,
                    badge: null,
                },
                {
                    label: 'Banner',
                    href: '/admin/banners',
                    icon: ImageIcon,
                    exact: false,
                    badge: null,
                },
                {
                    label: 'Ulasan Pembeli',
                    href: '/admin/reviews',
                    icon: Star,
                    exact: false,
                    badge: null,
                },
            ],
        },
        {
            title: 'Toko',
            items: [
                {
                    label: 'Metode Pembayaran',
                    href: '/admin/payment-methods',
                    icon: CreditCard,
                    exact: false,
                    badge: null,
                },
                {
                    label: 'Pengaturan',
                    href: '/admin/settings',
                    icon: SettingsIcon,
                    exact: false,
                    badge: null,
                },
            ],
        },
    ];

    const isActive = (href: string, exact: boolean) => {
        if (exact) {
            return url === href;
        }
        return url.startsWith(href);
    };

    const isOtherActive = url.startsWith('/admin/banners') || 
                          url.startsWith('/admin/payment-methods') || 
                          url.startsWith('/admin/settings') || 
                          url.startsWith('/settings');

    const handleLogout = () => {
        router.post('/logout');
    };

    // Render Navigation Links
    const renderNav = (closeOnClick = false) => (
        <nav aria-label="Navigasi Admin" className="flex-1 space-y-5 px-3 py-4 overflow-y-auto">
            {navGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                    <div className="text-[11px] font-semibold tracking-wider text-text-2 uppercase px-3 py-1">
                        {group.title}
                    </div>
                    <div className="space-y-0.5">
                        {group.items.map((item) => {
                            const active = isActive(item.href, item.exact);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={active ? 'page' : undefined}
                                    onClick={() => {
                                        if (closeOnClick) setIsMobileMenuOpen(false);
                                    }}
                                    className={`group flex items-center justify-between h-9 px-3 rounded-md text-sm font-medium transition-colors ${
                                        active
                                            ? 'bg-surface-2 text-text font-semibold border-l-2 border-accent shadow-xs'
                                            : 'text-text-2 hover:text-text hover:bg-surface-hover'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                                            active ? 'text-accent-text' : 'text-text-2 group-hover:text-text'
                                        }`} />
                                        <span className="truncate">{item.label}</span>
                                    </div>
                                    {item.badge !== null && (
                                        <span
                                            className="px-1.5 py-0.5 text-[11px] font-mono font-semibold rounded-full bg-info/15 text-info border border-info/30"
                                            title={`${item.badge} order menunggu verifikasi`}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </nav>
    );

    return (
        <div className="min-h-screen bg-bg text-text flex flex-col lg:flex-row antialiased selection:bg-accent selection:text-on-accent transition-colors">
            {/* Tautan Lompat ke Konten (Aksesibilitas) */}
            <a
                href="#admin-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-surface focus:text-text focus:border focus:border-border focus:rounded-md focus:shadow-md text-xs font-semibold"
            >
                Lewati ke konten
            </a>

            {/* Mobile Top Bar (56px) */}
            <header className="lg:hidden sticky top-0 z-30 w-full h-14 bg-surface border-b border-border flex items-center justify-between px-4">
                <Link href="/admin" className="flex items-center gap-2 min-w-0">
                    <BrandMark
                        variant="icon-text"
                        showTagline={false}
                        logoClassName="w-6 h-6 object-contain shrink-0"
                        textClassName="text-sm font-bold text-text truncate tracking-tight"
                    />
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-2 text-text-2 border border-border shrink-0">
                        Admin
                    </span>
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-text-2 hover:text-text hover:bg-surface-hover rounded-md border border-border transition-colors"
                        title="Buka etalase toko"
                    >
                        <span>Toko</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <ThemeToggle />
                </div>
            </header>

            {/* Mobile Drawer Navigation (<1024px) */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-overlay backdrop-blur-xs transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Drawer Panel */}
                    <div
                        ref={drawerRef}
                        tabIndex={-1}
                        className="relative w-72 max-w-[85vw] bg-surface border-r border-border h-full flex flex-col z-50 shadow-2xl outline-none"
                    >
                        {/* Drawer Header */}
                        <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0">
                            <Link
                                href="/admin"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-2 min-w-0"
                            >
                                <BrandMark
                                    showTagline={false}
                                    logoClassName="w-6 h-6 rounded-[6px] object-contain shrink-0"
                                    textClassName="text-sm font-bold text-text truncate tracking-tight"
                                />
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-2 text-text-2 border border-border shrink-0">
                                    Admin
                                </span>
                            </Link>

                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-1.5 text-text-2 hover:text-text hover:bg-surface-hover rounded-md transition-colors cursor-pointer"
                                aria-label="Tutup navigasi"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Nav Items */}
                        {renderNav(true)}

                        {/* Drawer Footer */}
                        <div className="p-3 border-t border-border bg-surface-2/40 space-y-1 shrink-0">
                            <Link
                                href="/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between h-9 px-3 text-xs font-medium text-text-2 hover:text-text hover:bg-surface-hover rounded-md transition-colors"
                            >
                                <span>Lihat Toko</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <Link
                                href="/settings/profile"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-2 h-9 px-3 text-xs font-medium text-text-2 hover:text-text hover:bg-surface-hover rounded-md transition-colors"
                            >
                                <User className="w-4 h-4 text-text-2" />
                                <span className="truncate">{auth?.user?.name || 'Akun Admin'}</span>
                            </Link>
                            <div className="pt-2 border-t border-border/50 flex items-center justify-between px-3">
                                <ThemeToggle />
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 text-xs text-text-2 hover:text-danger p-1.5 rounded transition-colors cursor-pointer"
                                    title="Keluar dari akun admin"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Keluar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Fixed Sidebar (240px = w-60) */}
            <aside className="hidden lg:flex flex-col w-60 h-screen sticky top-0 bg-surface border-r border-border shrink-0">
                {/* Brand Header */}
                <div className="h-14 px-4 border-b border-border flex items-center shrink-0">
                    <Link href="/admin" className="flex items-center gap-2 min-w-0 w-full">
                        <BrandMark
                            variant="icon-text"
                            showTagline={false}
                            logoClassName="w-6 h-6 object-contain shrink-0"
                            textClassName="text-sm font-bold text-text truncate tracking-tight"
                        />
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-2 text-text-2 border border-border shrink-0">
                            Admin
                        </span>
                    </Link>
                </div>

                {/* Nav Items */}
                {renderNav(false)}

                {/* Desktop Sidebar Footer */}
                <div className="p-3 border-t border-border bg-surface-2/30 space-y-1 shrink-0">
                    <Link
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between h-9 px-3 text-xs font-medium text-text-2 hover:text-text hover:bg-surface-hover rounded-md transition-colors"
                        title="Buka etalase toko di tab baru"
                    >
                        <span>Lihat Toko</span>
                        <ExternalLink className="w-3.5 h-3.5 text-text-2" />
                    </Link>
                    <Link
                        href="/settings/profile"
                        className={`flex items-center gap-2 h-9 px-3 text-xs font-medium rounded-md transition-colors ${
                            url.startsWith('/settings')
                                ? 'bg-surface-2 text-text font-semibold border border-border-strong'
                                : 'text-text-2 hover:text-text hover:bg-surface-hover'
                        }`}
                        title="Pengaturan akun & keamanan"
                    >
                        <User className="w-4 h-4 text-text-2 shrink-0" />
                        <span className="truncate">{auth?.user?.name || 'Akun Admin'}</span>
                    </Link>
                    <div className="pt-2 border-t border-border/50 flex items-center justify-between px-2">
                        <ThemeToggle />
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 text-xs text-text-2 hover:text-danger p-1.5 rounded transition-colors cursor-pointer"
                            title="Keluar dari sesi admin"
                        >
                            <LogOut className="w-4 h-4 shrink-0" />
                            <span>Keluar</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main id="admin-content" className="flex-1 min-w-0 p-4 lg:p-6 max-w-6xl w-full mx-auto space-y-6 pb-24 lg:pb-6">
                {/* Flash Banner for feedback alerts */}
                <FlashBanner
                    success={flash?.success}
                    error={flash?.error || (errors && Object.keys(errors).length > 0 ? Object.values(errors)[0] : null)}
                    status={flash?.status}
                />

                {children}
            </main>

            {/* Mobile Bottom Bar Navigation (<1024px) */}
            <nav
                aria-label="Navigasi Bawah Admin"
                className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around px-1 pb-[env(safe-area-inset-bottom)]"
            >
                {/* 1. Dashboard */}
                <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-[11px] transition-colors ${
                        url === '/admin'
                            ? 'text-accent-text font-semibold'
                            : 'text-text-3 hover:text-text'
                    }`}
                >
                    <LayoutDashboard className="w-5 h-5 shrink-0" />
                    <span className="truncate">Dashboard</span>
                    {url === '/admin' && (
                        <span className="absolute top-0 w-8 h-0.5 bg-accent rounded-full" />
                    )}
                </Link>

                {/* 2. Order */}
                <Link
                    href="/admin/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-[11px] transition-colors ${
                        url.startsWith('/admin/orders')
                            ? 'text-accent-text font-semibold'
                            : 'text-text-3 hover:text-text'
                    }`}
                >
                    <div className="relative">
                        <ShoppingBag className="w-5 h-5 shrink-0" />
                        {typeof verifyingCount === 'number' && verifyingCount > 0 && (
                            <span className="absolute -top-1.5 -right-2 px-1 min-w-4 h-4 text-[9px] font-mono font-bold rounded-full bg-info text-white flex items-center justify-center shadow-xs">
                                {verifyingCount > 99 ? '99+' : verifyingCount}
                            </span>
                        )}
                    </div>
                    <span className="truncate">Order</span>
                    {url.startsWith('/admin/orders') && (
                        <span className="absolute top-0 w-8 h-0.5 bg-accent rounded-full" />
                    )}
                </Link>

                {/* 3. Produk */}
                <Link
                    href="/admin/products"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-[11px] transition-colors ${
                        url.startsWith('/admin/products')
                            ? 'text-accent-text font-semibold'
                            : 'text-text-3 hover:text-text'
                    }`}
                >
                    <Package className="w-5 h-5 shrink-0" />
                    <span className="truncate">Produk</span>
                    {url.startsWith('/admin/products') && (
                        <span className="absolute top-0 w-8 h-0.5 bg-accent rounded-full" />
                    )}
                </Link>

                {/* 4. Stok Akun */}
                <Link
                    href="/admin/accounts"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-[11px] transition-colors ${
                        url.startsWith('/admin/accounts')
                            ? 'text-accent-text font-semibold'
                            : 'text-text-3 hover:text-text'
                    }`}
                >
                    <KeyRound className="w-5 h-5 shrink-0" />
                    <span className="truncate">Stok</span>
                    {url.startsWith('/admin/accounts') && (
                        <span className="absolute top-0 w-8 h-0.5 bg-accent rounded-full" />
                    )}
                </Link>

                {/* 5. Menu Lainnya (Drawer Toggle) */}
                <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                    className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-[11px] transition-colors cursor-pointer ${
                        isOtherActive || isMobileMenuOpen
                            ? 'text-accent-text font-semibold'
                            : 'text-text-3 hover:text-text'
                    }`}
                    aria-label="Buka menu navigasi lainnya"
                    aria-expanded={isMobileMenuOpen}
                >
                    <Menu className="w-5 h-5 shrink-0" />
                    <span className="truncate">Menu</span>
                    {(isOtherActive || isMobileMenuOpen) && (
                        <span className="absolute top-0 w-8 h-0.5 bg-accent rounded-full" />
                    )}
                </button>
            </nav>
        </div>
    );
}
