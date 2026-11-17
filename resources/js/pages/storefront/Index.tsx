import React, { useEffect, useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Clock,
    ShieldCheck,
    MessageCircle,
    MousePointerClick,
    Wallet,
    CheckCheck,
    KeyRound,
    RotateCcw,
    Send,
    HelpCircle,
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { QuotaBar } from '@/components/shop/QuotaBar';
import { ProductCard } from '@/components/shop/ProductCard';
import { BannerSlider } from '@/components/shop/BannerSlider';
import { BenefitsSection } from '@/components/shop/BenefitsSection';
import { Hero } from '@/components/shop/Hero';
import { SectionHeading } from '@/components/shop/SectionHeading';
import { CatalogToolbar, CatalogTypeFilter, CatalogSortOption } from '@/components/shop/CatalogToolbar';
import { Button } from '@/components/ui/button';
import { FaqModal } from '@/components/shop/FaqModal';
import { ProductCatalogItem, QuotaData, BannerData } from '@/types/shop';

interface PaymentMethodSummary {
    id: number;
    type: string;
    label: string;
    logo_url?: string | null;
}

interface StorefrontProps {
    storeName?: string;
    storeLogo?: string | null;
    storeTagline?: string | null;
    deliveryEta?: string | null;
    announcement?: { text: string; url?: string | null } | null;
    socialLinks?: Record<string, string | null> | null;
    businessHours?: string | null;
    adminWhatsapp?: string | null;
    customRequest?: {
        enabled: boolean;
        adminWhatsapp?: string | null;
    };
    quota: QuotaData;
    banners?: BannerData[];
    available_services_count?: number | null;
    availableServicesCount?: number | null;
    verification_median_minutes?: number | null;
    verificationMedianMinutes?: number | null;
    stats?: {
        completed_orders?: number | null;
        active_services?: number | null;
    } | null;
    products: ProductCatalogItem[];
    outOfStockProducts?: ProductCatalogItem[];
    categories?: string[];
    paymentMethods?: PaymentMethodSummary[];
}

export default function StorefrontIndex({
    storeName = 'StreamPoint',
    storeLogo,
    storeTagline,
    deliveryEta,
    announcement,
    socialLinks,
    businessHours,
    adminWhatsapp,
    customRequest,
    quota,
    banners = [],
    available_services_count,
    availableServicesCount,
    verification_median_minutes,
    verificationMedianMinutes,
    stats,
    products = [],
    outOfStockProducts = [],
    categories = [],
    paymentMethods = [],
}: StorefrontProps) {
    // 30s Quota polling without flicker
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (document.visibilityState === 'visible') {
                router.reload({
                    only: ['quota'],
                });
            }
        }, 30000);

        return () => clearInterval(intervalId);
    }, []);

    // Toolbar states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<CatalogTypeFilter>('ALL');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedSort, setSelectedSort] = useState<CatalogSortOption>('default');

    // FAQ Modal state (Clean on-demand dialog, avoids cluttering the homepage)
    const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);

    useEffect(() => {
        const checkHash = () => {
            if (typeof window !== 'undefined' && window.location.hash === '#faq') {
                setIsFaqModalOpen(true);
            }
        };
        checkHash();
        window.addEventListener('hashchange', checkHash);
        return () => window.removeEventListener('hashchange', checkHash);
    }, []);

    // Check if bestseller sort option should be shown (>= 3 services with real sold_count)
    const showBestsellerSort = useMemo(() => {
        const allItems = [...products, ...outOfStockProducts];
        return allItems.filter((p) => typeof p.sold_count === 'number' && p.sold_count > 0).length >= 3;
    }, [products, outOfStockProducts]);

    // Client-side filtering and sorting for main products
    const filteredProducts = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        const filtered = products.filter((p) => {
            // Search query matching name and category
            if (query) {
                const matchName = p.name.toLowerCase().includes(query);
                const matchCategory = p.category.toLowerCase().includes(query);
                if (!matchName && !matchCategory) {
                    return false;
                }
            }

            // Type filter
            if (selectedType === 'RENT' && p.has_rent === false) {
                return false;
            }
            if (selectedType === 'BUY' && p.has_buy === false) {
                return false;
            }

            // Category filter
            if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
                return false;
            }

            return true;
        });

        // Sorting
        return filtered.sort((a, b) => {
            if (selectedSort === 'bestseller') {
                return (b.sold_count ?? 0) - (a.sold_count ?? 0);
            }
            if (selectedSort === 'newest') {
                return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0);
            }
            if (selectedSort === 'price_asc') {
                return a.min_price - b.min_price;
            }
            return 0; // 'default' maintains server sort_order
        });
    }, [products, searchQuery, selectedType, selectedCategory, selectedSort]);

    const handleResetFilter = () => {
        setSearchQuery('');
        setSelectedType('ALL');
        setSelectedCategory('ALL');
        setSelectedSort('default');
    };

    // 5 Steps for "Cara Pesan"
    const orderSteps = [
        {
            num: 1,
            title: 'Pilih paket',
            desc: 'Pilih layanan, tipe, dan durasi.',
            icon: <MousePointerClick className="w-4 h-4 text-accent-text" />,
        },
        {
            num: 2,
            title: 'Bayar',
            desc: 'Transfer sesuai nominal sampai digit terakhir.',
            icon: <Wallet className="w-4 h-4 text-accent-text" />,
        },
        {
            num: 3,
            title: 'Konfirmasi',
            desc: 'Tekan "Saya Sudah Bayar" setelah transfer.',
            icon: <CheckCheck className="w-4 h-4 text-accent-text" />,
        },
        {
            num: 4,
            title: 'Verifikasi',
            desc: 'Admin memeriksa pembayaran.',
            icon: <ShieldCheck className="w-4 h-4 text-accent-text" />,
        },
        {
            num: 5,
            title: 'Akun dikirim',
            desc: deliveryEta
                ? `Kredensial akun dikirim via WhatsApp ${deliveryEta}.`
                : 'Detail akun tampil di halaman invoice setelah diverifikasi admin.',
            icon: <KeyRound className="w-4 h-4 text-accent-text" />,
        },
    ];

    let cleanAdminPhone = adminWhatsapp ? adminWhatsapp.replace(/\D/g, '') : '';
    if (cleanAdminPhone.startsWith('0')) {
        cleanAdminPhone = '62' + cleanAdminPhone.slice(1);
    }

    return (
        <PublicLayout storeName={storeName} paymentMethods={paymentMethods}>
            <Head title={`Sewa & Beli Akun Streaming - ${storeName}`} />

            <div className="w-full space-y-6 sm:space-y-7 pb-16 sm:pb-8">
                {/* Above-the-fold Top Area: Banner/Hero + Quota Bar */}
                <div className="space-y-2.5 sm:space-y-3">
                    {/* 1. Banner Slider (DESIGN_SYSTEM 6.26) atau Hero Fungsional (6.2) */}
                    {banners && banners.length > 0 ? (
                        <BannerSlider banners={banners} />
                    ) : (
                        <Hero
                            quota={quota}
                            availableServicesCount={availableServicesCount ?? available_services_count}
                            verificationMedianMinutes={verificationMedianMinutes ?? verification_median_minutes}
                            deliveryEta={deliveryEta}
                            products={products}
                        />
                    )}

                    {/* 2. Bar Kuota (Above the Fold) */}
                    <QuotaBar quota={quota} />
                </div>

                {/* 3. Toolbar Katalog & Grid Layanan */}
                <section id="katalog" aria-label="Katalog Layanan Streaming" className="scroll-mt-20">
                    <SectionHeading
                        eyebrow="KATALOG LAYANAN"
                        title="Pilihan Layanan Streaming"
                    />

                    <div className="space-y-2.5 sm:space-y-3">
                        <CatalogToolbar
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            selectedType={selectedType}
                            onTypeChange={setSelectedType}
                            categories={categories}
                            selectedCategory={selectedCategory}
                            onCategoryChange={setSelectedCategory}
                            selectedSort={selectedSort}
                            onSortChange={setSelectedSort}
                            showBestsellerSort={showBestsellerSort}
                        />

                        {/* Grid Semua Layanan */}
                        {filteredProducts.length === 0 ? (
                            <div className="bg-surface border border-border rounded-lg p-8 sm:p-12 text-center space-y-3">
                                <p className="text-xs sm:text-sm text-text-2">
                                    Tidak ada layanan yang cocok dengan filter yang dipilih.
                                </p>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleResetFilter}
                                    className="inline-flex items-center gap-1.5"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reset Filter</span>
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
                                {filteredProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* 4. Bagian "Sedang Kosong" (DESIGN_SYSTEM 6.31) */}
                {outOfStockProducts && outOfStockProducts.length > 0 && (
                    <section aria-labelledby="sedang-kosong-title" className="pt-4 border-t border-border/80">
                        <SectionHeading
                            eyebrow="RESTOCK SEGERA"
                            title="Sedang Kosong"
                        />

                        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
                            {outOfStockProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </section>
                )}

                {/* 5. Kenapa Beli di Sini (Keunggulan Toko - DESIGN_SYSTEM 6.27 & 6.38) */}
                <BenefitsSection
                    stats={stats}
                    verificationMedianMinutes={verificationMedianMinutes ?? verification_median_minutes}
                />

                {/* 6. Cara Pesan (Panduan Pembelian - DESIGN_SYSTEM 6.7 & 6.34) */}
                <section id="cara-pesan" aria-labelledby="cara-pesan-title" className="scroll-mt-20">
                    <SectionHeading
                        eyebrow="PANDUAN PEMBELIAN"
                        title="Cara Pemesanan 5 Langkah Mudah"
                    />

                    {/* Mobile View: 1 Unified Clean Timeline Card */}
                    <div className="md:hidden bg-surface border border-border rounded-xl p-4 shadow-2xs">
                        <div className="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-border">
                            {orderSteps.map((step) => (
                                <div key={step.num} className="relative flex items-start gap-3">
                                    <span className="absolute -left-6 top-0.5 w-4.5 h-4.5 rounded-full bg-surface border border-accent text-accent-text text-[10px] font-mono font-bold flex items-center justify-center shadow-xs">
                                        {step.num}
                                    </span>
                                    <div className="min-w-0">
                                        <div className="text-xs font-semibold text-text">
                                            {step.title}
                                        </div>
                                        <p className="text-[11px] text-text-2 leading-tight mt-0.5">
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Desktop View: 5 Cards Grid */}
                    <div className="hidden md:grid md:grid-cols-5 gap-3">
                        {orderSteps.map((step) => (
                            <div
                                key={step.num}
                                className="bg-surface border border-border rounded-lg p-4 space-y-2 relative shadow-2xs"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="w-8 h-8 rounded-md bg-surface-2 border border-border flex items-center justify-center shrink-0">
                                        {step.icon}
                                    </div>
                                    <span className="font-mono text-xs font-bold text-text-muted">
                                        0{step.num}
                                    </span>
                                </div>

                                <h3 className="text-xs sm:text-sm font-semibold text-text">
                                    {step.title}
                                </h3>
                                <p className="text-xs text-text-2 leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 7. Pusat Bantuan & Layanan Khusus (Unified Card) */}
                <section id="faq" aria-label="Tanya Jawab dan Bantuan" className="scroll-mt-20">
                    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-surface-2 border border-border flex items-center justify-center shrink-0 mt-0.5">
                                    <HelpCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-accent-text" />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="text-xs sm:text-sm font-semibold text-text">
                                        Pusat Bantuan & Layanan Khusus
                                    </h3>
                                    <p className="text-[11px] sm:text-xs text-text-2 leading-relaxed">
                                        Pelajari garansi & tata cara sewa di FAQ, atau tanyakan ketersediaan durasi/layanan khusus ke admin.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1 sm:pt-0">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setIsFaqModalOpen(true)}
                                    className="text-xs font-semibold gap-1.5 flex-1 sm:flex-none justify-center h-8.5 px-3.5 cursor-pointer"
                                >
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    <span>Buka FAQ</span>
                                </Button>
                                {customRequest?.enabled && adminWhatsapp && (
                                    <a
                                        href={`https://wa.me/${cleanAdminPhone}?text=${encodeURIComponent(
                                            'Halo Admin StreamPoint, saya ingin menanyakan ketersediaan layanan khusus...'
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-1.5 px-3.5 h-8.5 text-xs font-semibold rounded-md bg-accent text-on-accent hover:bg-accent-hover transition-colors flex-1 sm:flex-none shadow-xs"
                                    >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        <span>Tanya Admin</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Modal Dialog (Opens cleanly on demand without bloating the homepage) */}
                <FaqModal
                    open={isFaqModalOpen}
                    onOpenChange={setIsFaqModalOpen}
                    adminWhatsapp={adminWhatsapp}
                />
            </div>
        </PublicLayout>
    );
}
