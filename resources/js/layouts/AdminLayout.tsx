import React, { ReactNode, useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    ShoppingBag, 
    Settings as SettingsIcon, 
    LogOut, 
    Menu, 
    X, 
    ExternalLink,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { ThemeToggle } from '@/components/shop/ThemeToggle';

interface AdminLayoutProps {
    title?: string;
    children: ReactNode;
}

export function AdminLayout({ title, children }: AdminLayoutProps) {
    const { url } = usePage();
    const { auth, flash, errors } = usePage<{
        auth: { user: { name: string; email: string } | null };
        flash?: { success?: string; error?: string };
        errors: Record<string, string>;
    }>().props;

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    const navItems = [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
        { label: 'Order', href: '/admin/orders', icon: ShoppingBag, exact: false },
        { label: 'Pengaturan', href: '/admin/settings', icon: SettingsIcon, exact: false },
    ];

    const isActive = (href: string, exact: boolean) => {
        if (exact) {
            return url === href;
        }
        return url.startsWith(href);
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="min-h-screen bg-bg text-text flex flex-col antialiased selection:bg-accent selection:text-on-accent transition-colors">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 w-full h-12 bg-surface border-b border-border">
                <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
                    {/* Left: Brand & Desktop Nav */}
                    <div className="flex items-center gap-6">
                        <Link 
                            href="/admin" 
                            className="flex items-center gap-2 font-bold tracking-tight text-text hover:text-accent-text text-sm transition-colors"
                        >
                            <span className="w-6 h-6 rounded bg-accent text-on-accent flex items-center justify-center text-xs font-mono font-bold">
                                SP
                            </span>
                            <span>StreamPoint <span className="text-xs px-1.5 py-0.5 rounded bg-surface-2 text-text-2 border border-border font-normal">Admin</span></span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => {
                                const active = isActive(item.href, item.exact);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                            active
                                                ? 'bg-surface-2 text-text font-semibold border border-border-strong'
                                                : 'text-text-2 hover:text-text hover:bg-surface-hover'
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        <Link
                            href="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs text-text-2 hover:text-text hover:bg-surface-hover rounded transition-colors"
                            title="Buka Toko Publik"
                        >
                            <span>Toko</span>
                            <ExternalLink className="w-3 h-3" />
                        </Link>

                        <ThemeToggle />

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs text-text-2 hover:text-danger hover:bg-surface-hover rounded transition-colors cursor-pointer"
                            title="Keluar"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Keluar</span>
                        </button>

                        {/* Mobile Menu Button */}
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
                            className="md:hidden p-1.5 rounded text-text-2 hover:text-text hover:bg-surface-hover cursor-pointer"
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Drawer Navigation */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 z-50 md:hidden bg-overlay flex flex-col justify-start"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    <div 
                        className="bg-surface border-b border-border p-4 shadow-lg flex flex-col gap-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                            <div className="text-xs font-semibold text-text-2 uppercase">Menu Navigasi</div>
                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-1 rounded text-text-2 hover:text-text"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <nav className="flex flex-col gap-1">
                            {navItems.map((item) => {
                                const active = isActive(item.href, item.exact);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                            active
                                                ? 'bg-surface-2 text-text font-semibold border border-border-strong'
                                                : 'text-text-2 hover:text-text hover:bg-surface-hover'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}

                            <Link
                                href="/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text-2 hover:text-text hover:bg-surface-hover"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>Buka Toko Publik</span>
                            </Link>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    handleLogout();
                                }}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-danger hover:bg-surface-hover text-left cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Keluar</span>
                            </button>
                        </nav>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-5">
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="mb-4 p-3 bg-surface border border-success/40 text-text rounded-md flex items-center gap-2.5 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {(flash?.error || errors?.action) && (
                    <div className="mb-4 p-3 bg-surface border border-danger/40 text-text rounded-md flex items-center gap-2.5 text-xs">
                        <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                        <span>{flash?.error || errors?.action}</span>
                    </div>
                )}

                {children}
            </main>
        </div>
    );
}

export default AdminLayout;
