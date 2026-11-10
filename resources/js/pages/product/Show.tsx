import React, { useMemo, useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ShieldCheck, Clock, Check, Sparkles, Zap, AlertCircle } from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabItem } from '@/components/ui/tabs';
import { PackageOption } from '@/components/shop/PackageOption';
import { CheckoutModal } from '@/components/shop/CheckoutModal';
import { ProductReviews } from '@/components/shop/ProductReviews';
import { formatRupiah } from '@/lib/format';
import { validatePhone } from '@/lib/phone';
import { PaymentMethodItem, ProductDetail, ProductVariantData, QuotaData, SharedPendingOrder, ProductReviewsData } from '@/types/shop';

interface ProductShowProps {
    storeName?: string;
    deliveryEta?: string | null;
    product: ProductDetail;
    variants: ProductVariantData[];
    quota: QuotaData;
    paymentMethods: PaymentMethodItem[];
    reviewsData?: ProductReviewsData;
}

export default function ProductShow({
    storeName = 'NamaToko',
    deliveryEta,
    product,
    variants = [],
    quota,
    paymentMethods = [],
    reviewsData = {
        average_rating: 0,
        total_reviews: 0,
        breakdown: [
            { stars: 5, count: 0, percentage: 0 },
            { stars: 4, count: 0, percentage: 0 },
            { stars: 3, count: 0, percentage: 0 },
            { stars: 2, count: 0, percentage: 0 },
            { stars: 1, count: 0, percentage: 0 },
        ],
        reviews: [],
    },
}: ProductShowProps) {
    const { pendingOrder } = usePage<{ pendingOrder?: SharedPendingOrder }>().props;
    const hasActiveOrder = Boolean(pendingOrder);

    // 1. Tab state: RENT or BUY
    const [selectedTab, setSelectedTab] = useState<'RENT' | 'BUY'>('RENT');

    // 2. Selected Variant
    const [selectedVariant, setSelectedVariant] = useState<ProductVariantData | null>(null);

    // 3. Checkout Modal visibility
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);

    // 4. Customer Info
    const [rawPhone, setRawPhone] = useState<string>('');
    const [phoneTouched, setPhoneTouched] = useState<boolean>(false);
    const [customerNote, setCustomerNote] = useState<string>('');

    // 5. Payment Method (default null to ensure step-by-step selection)
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);

    // 6. Checkout & Anti-Bot state
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [honeypot, setHoneypot] = useState<string>('');
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

    const idempotencyKey = useMemo(() => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'idemp_' + Math.random().toString(36).substring(2) + Date.now();
    }, []);

    // Filter variants based on active tab
    const tabVariants = useMemo(() => {
        return variants.filter((v) => v.type === selectedTab);
    }, [variants, selectedTab]);

    // Active rent variants and lowest daily rate calculation
    const rentVariants = useMemo(() => {
        return variants.filter((v) => v.type === 'RENT');
    }, [variants]);

    const lowestDailyRate = useMemo(() => {
        if (rentVariants.length < 2) return null;
        let min = Infinity;
        for (const v of rentVariants) {
            if (v.duration_hours > 0) {
                const rate = Math.round(v.price / (v.duration_hours / 24));
                if (rate < min) min = rate;
            }
        }
        return min === Infinity ? null : min;
    }, [rentVariants]);

    // Auto-select first variant on initial load or tab change if available
    useEffect(() => {
        if (tabVariants.length > 0 && !selectedVariant) {
            const firstAvailable = tabVariants.find((v) => {
                if (v.type === 'RENT') {
                    return !quota.is_full && product.available_rent_stock > 0;
                }
                return product.available_buy_stock > 0;
            }) || tabVariants[0];
            setSelectedVariant(firstAvailable);
        }
    }, [selectedTab, tabVariants]);

    // Stock availability badge
    const totalStock = product.available_rent_stock + product.available_buy_stock;
    const availabilityBadge = useMemo(() => {
        if (totalStock === 0) {
            return { label: 'Habis', class: 'bg-danger/10 text-danger border-danger/30' };
        }
        if (totalStock <= 2) {
            return { label: 'Stok Menipis', class: 'bg-warning/10 text-warning border-warning/30' };
        }
        return { label: 'Tersedia', class: 'bg-accent/10 text-accent-text border-accent/30' };
    }, [totalStock]);

    // Validation
    const phoneValidation = useMemo(() => {
        return validatePhone(rawPhone);
    }, [rawPhone]);

    const isReadyToSubmit = useMemo(() => {
        return (
            selectedVariant !== null &&
            phoneValidation.isValid &&
            selectedPaymentMethodId !== null
        );
    }, [selectedVariant, phoneValidation.isValid, selectedPaymentMethodId]);

    // Generate initials for fallback logo
    const initials = product.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');

    // Tabs configuration
    const tabItems: TabItem[] = [
        {
            id: 'RENT',
            label: 'Sewa Harian',
            badge: quota.is_full ? 'Penuh' : `${quota.remaining}/${quota.limit}`,
            badgeVariant: quota.is_full ? 'danger' : 'accent',
        },
        {
            id: 'BUY',
            label: 'Beli Akun',
            badge: product.available_buy_stock > 0 ? `${product.available_buy_stock} unit` : 'Habis',
            badgeVariant: product.available_buy_stock > 0 ? 'accent' : 'danger',
        },
    ];

    const handleTabChange = (tabId: string) => {
        setSelectedTab(tabId as 'RENT' | 'BUY');
        setSelectedVariant(null);
        setServerErrors({});
    };

    // Auto-dismiss safety timer for submitting state
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (isSubmitting) {
            timer = setTimeout(() => {
                setIsSubmitting(false);
            }, 8000);
        }
        return () => clearTimeout(timer);
    }, [isSubmitting]);

    const handleOpenCheckout = () => {
        if (!selectedVariant && tabVariants.length > 0) {
            const available = tabVariants.find((v) => {
                if (v.type === 'RENT') {
                    return !quota.is_full && product.available_rent_stock > 0;
                }
                return product.available_buy_stock > 0;
            }) || tabVariants[0];
            setSelectedVariant(available);
        }
        setIsCheckoutModalOpen(true);
    };

    const handleSubmit = () => {
        if (!isReadyToSubmit || isSubmitting || !selectedVariant || !selectedPaymentMethodId) return;

        setServerErrors({});
        setIsSubmitting(true);

        router.post(
            '/checkout',
            {
                variant_id: selectedVariant.id,
                customer_phone: rawPhone,
                payment_method_id: selectedPaymentMethodId,
                customer_note: customerNote,
                idempotency_key: idempotencyKey,
                hp_website: honeypot,
            },
            {
                preserveScroll: false,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setIsCheckoutModalOpen(false);
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    setServerErrors(errors);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    // Current active variant for price display
    const activeVariant = selectedVariant || tabVariants[0] || null;
    const isOutOfStock = selectedTab === 'RENT'
        ? (quota.is_full || product.available_rent_stock === 0)
        : product.available_buy_stock === 0;

    return (
        <PublicLayout storeName={storeName} isProductPage={true}>
            <Head title={`${product.name} - Sewa & Beli`} />

            <div className="w-full pb-28 lg:pb-16">
                {/* Back to Catalog Link */}
                <div className="mb-4 sm:mb-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-text-2 hover:text-text transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Katalog Layanan</span>
                    </Link>
                </div>

                {/* Active Order Notice if customer has an unfinished order */}
                {hasActiveOrder && (
                    <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/30 text-xs sm:text-sm text-text flex items-start gap-3 shadow-2xs">
                        <Clock className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1">
                            <h4 className="font-bold text-text">Pesanan Belum Selesai</h4>
                            <p className="text-text-2 text-xs">
                                {pendingOrder?.status === 'VERIFYING' ? (
                                    'Pembayaran pesanan sebelumnya sedang diverifikasi oleh admin.'
                                ) : (
                                    <>
                                        Kamu memiliki pesanan aktif <span className="font-mono font-bold text-text">#{pendingOrder?.invoice_code}</span> yang belum diselesaikan.
                                    </>
                                )}
                            </p>
                            <div className="pt-1">
                                <Link
                                    href={`/invoice/${pendingOrder?.invoice_code}`}
                                    className="font-bold text-xs text-accent-text hover:underline inline-flex items-center gap-1"
                                >
                                    Lanjutkan ke Invoice Pesanan &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2 Columns Layout: Left = Product Info & Rules, Right = Packages & Action */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    {/* Left Column: Product Banner, Identity, Description & Rules (5 Cols) */}
                    <div className="lg:col-span-5 space-y-5">
                        {/* Service Card */}
                        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xs">
                            {/* Cover Banner */}
                            <div className="w-full h-[140px] sm:h-[180px] bg-surface-2 relative overflow-hidden">
                                {product.cover_path ? (
                                    <img
                                        src={product.cover_path}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div
                                        className="w-full h-full flex items-center justify-center bg-surface-2"
                                        style={{
                                            backgroundColor: product.brand_color && /^#[0-9A-Fa-f]{6}$/.test(product.brand_color)
                                                ? `${product.brand_color}18`
                                                : undefined,
                                        }}
                                    />
                                )}
                            </div>

                            {/* Info Container */}
                            <div className="p-4 sm:p-5 pt-0">
                                {/* Logo Avatar Overlap */}
                                <div className="flex items-end justify-between -mt-8 mb-3.5 relative z-10">
                                    <div
                                        className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 border-surface bg-surface shadow-md p-1.5 flex items-center justify-center overflow-hidden shrink-0"
                                        style={{
                                            borderColor: product.brand_color && /^#[0-9A-Fa-f]{6}$/.test(product.brand_color)
                                                ? `${product.brand_color}40`
                                                : undefined,
                                        }}
                                    >
                                        {product.thumbnail_path ? (
                                            <img
                                                src={product.thumbnail_path}
                                                alt={product.name}
                                                className="w-full h-full object-contain"
                                                width={64}
                                                height={64}
                                            />
                                        ) : (
                                            <span className="font-mono text-xl font-bold text-text">
                                                {initials}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Title, Category & Badges */}
                                <div className="space-y-2.5">
                                    <div>
                                        <h1 className="text-lg sm:text-xl font-bold text-text tracking-tight">
                                            {product.name}
                                        </h1>
                                        <span className="text-xs text-text-2 font-medium">
                                            {product.category}
                                        </span>
                                    </div>

                                    {/* Status Badges */}
                                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                        {product.has_warranty && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-accent/10 text-accent-text border border-accent/30">
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                                <span>Garansi Aktif</span>
                                            </span>
                                        )}

                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${availabilityBadge.class}`}>
                                            <span>{availabilityBadge.label}</span>
                                        </span>

                                        {deliveryEta && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-surface-2 text-text-2 border border-border">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{deliveryEta}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                {product.description && (
                                    <p className="text-xs sm:text-sm text-text-2 leading-relaxed mt-4 pt-4 border-t border-border/70">
                                        {product.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Rental Rules & Warranty Card */}
                        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                            <div className="flex items-center gap-2 text-text">
                                <ShieldCheck className="w-4 h-4 text-accent-text shrink-0" />
                                <h2 className="text-sm font-bold tracking-tight">
                                    Syarat Sewa & Garansi
                                </h2>
                            </div>

                            <div className="text-xs text-text-2 leading-relaxed space-y-2 whitespace-pre-line">
                                {product.rules || (
                                    <>
                                        <p>• Akun hanya untuk digunakan secara pribadi sesuai profil yang ditentukan.</p>
                                        <p>• Dilarang mengubah email, password, PIN, atau data profil akun.</p>
                                        <p>• Durasi sewa dihitung sejak kredensial akun diberikan kepada pembeli.</p>
                                        <p>• Garansi berlaku penuh selama masa sewa sesuai ketentuan.</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Package Selection & Desktop Summary (7 Cols) */}
                    <div className="lg:col-span-7 space-y-5">
                        {/* Package Selection Card */}
                        <section
                            aria-labelledby="package-section-title"
                            className="bg-surface border border-border rounded-2xl p-4 sm:p-6 shadow-2xs"
                        >
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <div>
                                    <h2 id="package-section-title" className="text-sm sm:text-base font-bold text-text">
                                        Pilih Paket Layanan
                                    </h2>
                                    <p className="text-xs text-text-2 mt-0.5">
                                        Pilih durasi atau tipe paket yang Anda inginkan
                                    </p>
                                </div>
                            </div>

                            {/* Tabs: Sewa Harian vs Beli Akun */}
                            <div className="mb-4">
                                <Tabs
                                    items={tabItems}
                                    activeTab={selectedTab}
                                    onChange={handleTabChange}
                                />
                            </div>

                            {/* Package Options Grid */}
                            <div
                                id={`tabpanel-${selectedTab}`}
                                role="tabpanel"
                                aria-labelledby={`tab-${selectedTab}`}
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Pilihan Paket">
                                    {tabVariants.length === 0 ? (
                                        <div className="col-span-full p-6 rounded-xl bg-surface-2 text-center text-xs text-text-2">
                                            Tidak ada paket yang tersedia untuk kategori ini saat ini.
                                        </div>
                                    ) : (
                                        tabVariants.map((variant) => {
                                            const isRent = variant.type === 'RENT';
                                            let isDisabled = false;
                                            let disabledReason = '';

                                            if (isRent) {
                                                if (quota.is_full) {
                                                    isDisabled = true;
                                                    disabledReason = 'Kuota sewa hari ini penuh';
                                                } else if (product.available_rent_stock === 0) {
                                                    isDisabled = true;
                                                    disabledReason = 'Stok akun sewa habis';
                                                }
                                            } else {
                                                if (product.available_buy_stock === 0) {
                                                    isDisabled = true;
                                                    disabledReason = 'Stok akun habis';
                                                }
                                            }

                                            const isSelected = selectedVariant?.id === variant.id;
                                            const dailyRate = isRent && variant.duration_hours > 0
                                                ? Math.round(variant.price / (variant.duration_hours / 24))
                                                : null;
                                            const isLowest = isRent && lowestDailyRate !== null && dailyRate === lowestDailyRate;

                                            return (
                                                <PackageOption
                                                    key={variant.id}
                                                    variant={variant}
                                                    isSelected={isSelected}
                                                    isDisabled={isDisabled}
                                                    disabledReason={disabledReason}
                                                    isLowestDailyRate={isLowest}
                                                    showSavingsBadge={rentVariants.length >= 2}
                                                    onSelect={(v) => setSelectedVariant(v)}
                                                />
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Desktop Order Action Box (Hidden on Mobile) */}
                        <div className="hidden lg:block bg-surface border border-border rounded-2xl p-6 shadow-2xs space-y-4">
                            <div className="flex items-center justify-between pb-4 border-b border-border">
                                <div>
                                    <span className="text-xs text-text-2 font-medium">Paket Terpilih:</span>
                                    <h3 className="text-sm font-bold text-text mt-0.5">
                                        {activeVariant ? activeVariant.name : 'Pilih paket di atas'}
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-text-2 font-medium block">Total Biaya:</span>
                                    <span className="font-mono text-xl font-bold text-accent-text tabular-nums">
                                        {activeVariant ? formatRupiah(activeVariant.price) : 'Rp 0'}
                                    </span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="primary"
                                size="lg"
                                disabled={isOutOfStock || !activeVariant}
                                onClick={handleOpenCheckout}
                                className="w-full h-12 text-sm font-bold shadow-xs cursor-pointer"
                            >
                                {isOutOfStock
                                    ? 'Stok Tidak Tersedia'
                                    : selectedTab === 'RENT'
                                    ? 'Sewa Sekarang'
                                    : 'Beli Sekarang'}
                            </Button>

                            <div className="flex items-center justify-center gap-4 text-xs text-text-2 pt-1">
                                <span className="flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5 text-accent-text" />
                                    <span>Proses Instan</span>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-accent-text" />
                                    <span>Garansi Penuh</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Penilaian & Ulasan Pembeli (Orvaki Style) */}
                <div className="mt-10 pt-8 border-t border-border">
                    <ProductReviews
                        reviewsData={reviewsData}
                        storeName={storeName}
                        productName={product.name}
                    />
                </div>

                {/* Mobile Floating Sticky Bottom Bar (Only 1 Clean Action Button) */}
                <div className="fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur-md border-t border-border p-3 sm:p-4 lg:hidden shadow-lg">
                    <div className="max-w-md mx-auto flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <span className="text-[11px] text-text-2 block truncate">
                                {activeVariant ? activeVariant.name : 'Pilih Paket'}
                            </span>
                            <span className="font-mono text-base font-bold text-accent-text tabular-nums">
                                {activeVariant ? formatRupiah(activeVariant.price) : 'Rp 0'}
                            </span>
                        </div>

                        <Button
                            type="button"
                            variant="primary"
                            size="default"
                            disabled={isOutOfStock || !activeVariant}
                            onClick={handleOpenCheckout}
                            className="px-5 font-bold text-xs h-10 shadow-xs cursor-pointer shrink-0"
                        >
                            {isOutOfStock
                                ? 'Habis'
                                : selectedTab === 'RENT'
                                ? 'Sewa Sekarang'
                                : 'Beli Sekarang'}
                        </Button>
                    </div>
                </div>

                {/* Honeypot field for anti-bot */}
                <input
                    type="text"
                    name="hp_website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    className="sr-only opacity-0 absolute -z-10 pointer-events-none"
                    aria-hidden="true"
                />

                {/* Orvaki-Style Checkout Modal / Bottom Sheet */}
                <CheckoutModal
                    isOpen={isCheckoutModalOpen}
                    onClose={() => setIsCheckoutModalOpen(false)}
                    product={product}
                    variant={activeVariant}
                    paymentMethods={paymentMethods}
                    selectedPaymentMethodId={selectedPaymentMethodId}
                    onSelectPaymentMethod={(id) => {
                        setSelectedPaymentMethodId(id);
                        if (serverErrors.payment_method_id) {
                            setServerErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.payment_method_id;
                                return copy;
                            });
                        }
                    }}
                    phone={rawPhone}
                    onPhoneChange={(val) => {
                        setRawPhone(val);
                        if (!phoneTouched) setPhoneTouched(true);
                        if (serverErrors.customer_phone) {
                            setServerErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.customer_phone;
                                return copy;
                            });
                        }
                    }}
                    phoneError={phoneTouched && !phoneValidation.isValid ? phoneValidation.error : null}
                    note={customerNote}
                    onNoteChange={setCustomerNote}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    serverErrors={serverErrors}
                />
            </div>
        </PublicLayout>
    );
}
