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
            desc: 'Tekan "Saya Sudah Bayar", unggah bukti jika ada.',
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

            <div className="w-full space-y-6 sm:space-y-7 pb-8">
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

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {orderSteps.map((step) => (
                            <div
                                key={step.num}
                                className="bg-surface border border-border rounded-lg p-4 space-y-2 relative"
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

                {/* 7. Pusat Bantuan & Tanya Jawab (Q&A Ringkas On-Demand) */}
                <section id="faq" aria-label="Tanya Jawab dan Bantuan" className="scroll-mt-20">
                    <div className="bg-surface border border-border rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3">
                            <div className="w-9 h-9 rounded-md bg-surface-2 border border-border flex items-center justify-center shrink-0">
                                <HelpCircle className="w-4.5 h-4.5 text-accent-text" />
                            </div>
                            <div>
                                <h3 className="text-xs sm:text-sm font-semibold text-text">
                                    Punya Pertanyaan Seputar Pemesanan?
                                </h3>
                                <p className="text-xs text-text-2 mt-0.5">
                                    Pelajari garansi akun, kuota harian, dan cara klaim akun di Pusat Tanya Jawab.
                                </p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsFaqModalOpen(true)}
                            className="shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Buka Tanya Jawab (Q&A)</span>
                        </Button>
                    </div>
                </section>

                {/* 8. Ajakan Pesanan Custom (DESIGN_SYSTEM 6.32) */}
                {customRequest?.enabled && adminWhatsapp && (
                    <section aria-label="Pesanan Khusus">
                        <div className="border border-border rounded-lg p-4 bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-semibold text-text">
                                    Belum menemukan layanan yang kamu cari?
                                </h3>
                                <p className="text-sm text-text-2 mt-0.5">
                                    Punya permintaan akun atau durasi khusus? Tanyakan ketersediaannya langsung ke admin kami.
                                </p>
                            </div>
                            <a
                                href={`https://wa.me/${cleanAdminPhone}?text=${encodeURIComponent(
                                    'Halo Admin StreamPoint, saya ingin menanyakan ketersediaan layanan khusus...'
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md border border-border bg-surface-2 text-text hover:bg-surface-hover hover:border-border-strong shrink-0 transition-colors"
                            >
                                <MessageCircle className="w-4 h-4 text-accent-text" />
                                <span>Tanya Admin via WhatsApp</span>
                            </a>
                        </div>
                    </section>
                )}

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
