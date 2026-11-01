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
    QrCode,
    Building2,
    ChevronDown,
    RotateCcw,
    Sparkles,
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { QuotaBar } from '@/components/shop/QuotaBar';
import { ProductCard } from '@/components/shop/ProductCard';
import { Button } from '@/components/ui/button';
import { faqData } from '@/data/faq';
import { ProductCatalogItem, QuotaData } from '@/types/shop';

interface PaymentMethodSummary {
    id: number;
    type: string;
    label: string;
}

interface StorefrontProps {
    storeName?: string;
    quota: QuotaData;
    products: ProductCatalogItem[];
    categories?: string[];
    paymentMethods?: PaymentMethodSummary[];
}

export default function StorefrontIndex({
    storeName = 'NamaToko',
    quota,
    products = [],
    categories = [],
    paymentMethods = [],
}: StorefrontProps) {
    // 30s Quota polling without flicker (reload only: ['quota'])
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

    // Filter states
    const [selectedType, setSelectedType] = useState<'ALL' | 'RENT' | 'BUY'>('ALL');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

    // FAQ Accordion open states (multiple items can be open)
    const [openFaqs, setOpenFaqs] = useState<Record<string, boolean>>({
        'faq-1': true, // First FAQ open by default
    });

    const toggleFaq = (id: string) => {
        setOpenFaqs((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    // Client-side filtering
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
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
    }, [products, selectedType, selectedCategory]);

    const handleResetFilter = () => {
        setSelectedType('ALL');
        setSelectedCategory('ALL');
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
            desc: 'Detail akun tampil di halaman invoice.',
            icon: <KeyRound className="w-4 h-4 text-accent-text" />,
        },
    ];

    const getPaymentIcon = (type: string) => {
        switch (type) {
            case 'QRIS':
                return <QrCode className="w-4 h-4 text-accent-text" />;
            case 'BANK':
                return <Building2 className="w-4 h-4 text-info" />;
            case 'EWALLET':
            default:
                return <Wallet className="w-4 h-4 text-warning" />;
        }
    };

    return (
        <PublicLayout storeName={storeName}>
            <Head title={`Sewa & Beli Akun Streaming - ${storeName}`} />

            <div className="w-full space-y-8 sm:space-y-12">
                {/* 1. Pita Intro Ringkas (DESIGN_SYSTEM 6.2, maks 88px di mobile) */}
                <section aria-label="Pengenalan Toko" className="space-y-2 pt-1 sm:pt-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-text tracking-tight">
                                Sewa & Beli Akun Streaming
                            </h1>
                            <p className="text-xs sm:text-sm text-text-2 mt-0.5">
                                Bayar, konfirmasi, akun dikirim setelah diverifikasi admin.
                            </p>
                        </div>

                        {/* 3 Factual Chips on Desktop */}
                        <div className="hidden lg:flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-surface-2 text-[11px] text-text-2">
                                <Clock className="w-3.5 h-3.5 text-text-muted" />
                                <span>Slot sewa terbatas per hari</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-surface-2 text-[11px] text-text-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-accent-text" />
                                <span>Garansi selama masa aktif</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-surface-2 text-[11px] text-text-2">
                                <MessageCircle className="w-3.5 h-3.5 text-text-muted" />
                                <span>Verifikasi via WhatsApp</span>
                            </span>
                        </div>
                    </div>
                </section>

                {/* 2. Bar Kuota (Above the Fold) */}
                <QuotaBar quota={quota} />

                {/* 3. Katalog: Filter + Grid Produk */}
                <section id="katalog" aria-label="Katalog Layanan Streaming" className="scroll-mt-20 space-y-3.5">
                    {/* Header Katalog & Filter Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border/60">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm sm:text-base font-bold text-text tracking-tight">
                                Katalog Layanan
                            </h2>
                            <span className="text-xs text-text-2 font-mono tabular-nums">
                                ({filteredProducts.length}/{products.length})
                            </span>
                        </div>

                        {/* Filter Bar (Horizontal scroll on mobile) */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                            {/* Segment Tipe: Semua / Sewa / Beli */}
                            <div className="inline-flex items-center p-0.5 rounded-md border border-border bg-surface-2 shrink-0" role="tablist" aria-label="Filter Tipe">
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={selectedType === 'ALL'}
                                    onClick={() => setSelectedType('ALL')}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
                                        selectedType === 'ALL'
                                            ? 'bg-surface text-text font-semibold border border-border-strong'
                                            : 'text-text-2 hover:text-text'
                                    }`}
                                >
                                    Semua
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={selectedType === 'RENT'}
                                    onClick={() => setSelectedType('RENT')}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
                                        selectedType === 'RENT'
                                            ? 'bg-surface text-text font-semibold border border-border-strong'
                                            : 'text-text-2 hover:text-text'
                                    }`}
                                >
                                    Sewa
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={selectedType === 'BUY'}
                                    onClick={() => setSelectedType('BUY')}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
                                        selectedType === 'BUY'
                                            ? 'bg-surface text-text font-semibold border border-border-strong'
                                            : 'text-text-2 hover:text-text'
                                    }`}
                                >
                                    Beli
                                </button>
                            </div>

                            {/* Dropdown Kategori (only if > 1 category) */}
                            {categories.length > 1 && (
                                <div className="shrink-0">
                                    <label htmlFor="category-filter" className="sr-only">
                                        Kategori Layanan
                                    </label>
                                    <select
                                        id="category-filter"
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="h-8 px-2.5 text-xs font-medium rounded-md border border-border bg-surface text-text outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
                                    >
                                        <option value="ALL">Semua Kategori</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Products Grid */}
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
                        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </section>

                {/* 4. Cara Pesan (DESIGN_SYSTEM 6.7) */}
                <section id="cara-pesan" aria-labelledby="cara-pesan-title" className="scroll-mt-20 space-y-4">
                    <div>
                        <h2 id="cara-pesan-title" className="text-base font-bold text-text tracking-tight">
                            Cara Pesan
                        </h2>
                        <p className="text-xs text-text-2 mt-0.5">
                            5 langkah mudah memesan akun streaming langsung aktif.
                        </p>
                    </div>

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

                {/* 5. Metode Pembayaran (DESIGN_SYSTEM 6.8) */}
                {paymentMethods.length > 0 && (
                    <section aria-labelledby="metode-bayar-title" className="space-y-3">
                        <div>
                            <h2 id="metode-bayar-title" className="text-base font-bold text-text tracking-tight">
                                Metode Pembayaran
                            </h2>
                            <p className="text-xs text-text-2 mt-0.5">
                                Seluruh pembayaran diverifikasi secara manual oleh admin.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                            {paymentMethods.map((pm) => (
                                <div
                                    key={pm.id}
                                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-border bg-surface text-xs font-semibold text-text"
                                >
                                    <div className="w-6 h-6 rounded bg-surface-2 border border-border flex items-center justify-center shrink-0">
                                        {getPaymentIcon(pm.type)}
                                    </div>
                                    <span>{pm.label}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 6. FAQ (Akordeon, DESIGN_SYSTEM 6.9 & PRD 5.6) */}
                <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 space-y-3.5">
                    <div>
                        <h2 id="faq-title" className="text-base font-bold text-text tracking-tight">
                            Pertanyaan Umum (FAQ)
                        </h2>
                        <p className="text-xs text-text-2 mt-0.5">
                            Jawaban atas pertanyaan seputar pemesanan, kuota harian, dan garansi.
                        </p>
                    </div>

                    <div className="bg-surface border border-border rounded-lg divide-y divide-border overflow-hidden">
                        {faqData.map((faq) => {
                            const isOpen = !!openFaqs[faq.id];
                            return (
                                <div key={faq.id} className="transition-colors">
                                    <button
                                        type="button"
                                        id={`faq-btn-${faq.id}`}
                                        aria-expanded={isOpen}
                                        aria-controls={`faq-panel-${faq.id}`}
                                        onClick={() => toggleFaq(faq.id)}
                                        className="w-full min-h-[48px] px-4 py-3.5 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-medium text-text hover:bg-surface-hover transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset cursor-pointer"
                                    >
                                        <span className="font-semibold">{faq.question}</span>
                                        <ChevronDown
                                            className={`w-4 h-4 text-text-2 shrink-0 transition-transform duration-150 ${
                                                isOpen ? 'rotate-180 text-text' : ''
                                            }`}
                                        />
                                    </button>

                                    {isOpen && (
                                        <div
                                            id={`faq-panel-${faq.id}`}
                                            role="region"
                                            aria-labelledby={`faq-btn-${faq.id}`}
                                            className="px-4 pb-4 pt-1 text-xs text-text-2 leading-relaxed"
                                        >
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
