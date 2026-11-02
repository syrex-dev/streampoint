import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ShieldCheck, QrCode, Building2, Wallet, AlertCircle } from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabItem } from '@/components/ui/tabs';
import { PackageOption } from '@/components/shop/PackageOption';
import { StickyBottomBar } from '@/components/shop/StickyBottomBar';
import { formatRupiah } from '@/lib/format';
import { validatePhone } from '@/lib/phone';
import { PaymentMethodItem, ProductDetail, ProductVariantData, QuotaData } from '@/types/shop';

interface ProductShowProps {
    storeName?: string;
    product: ProductDetail;
    variants: ProductVariantData[];
    quota: QuotaData;
    paymentMethods: PaymentMethodItem[];
}

export default function ProductShow({
    storeName = 'NamaToko',
    product,
    variants = [],
    quota,
    paymentMethods = [],
}: ProductShowProps) {
    // 1. Tab state: RENT or BUY
    const [selectedTab, setSelectedTab] = useState<'RENT' | 'BUY'>('RENT');

    // 2. Selected Variant
    const [selectedVariant, setSelectedVariant] = useState<ProductVariantData | null>(null);

    // 3. Customer Info
    const [rawPhone, setRawPhone] = useState<string>('');
    const [phoneTouched, setPhoneTouched] = useState<boolean>(false);
    const [customerNote, setCustomerNote] = useState<string>('');

    // 4. Payment Method
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(
        paymentMethods[0]?.id ?? null
    );

    // 5. Checkout & Anti-Bot state
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
                preserveScroll: true,
                onFinish: () => {
                    setIsSubmitting(false);
                },
                onError: (errors) => {
                    setServerErrors(errors);
                },
            }
        );
    };

    const selectedPayment = paymentMethods.find((pm) => pm.id === selectedPaymentMethodId);

    const getPaymentIcon = (type: PaymentMethodItem['type']) => {
        switch (type) {
            case 'QRIS':
                return <QrCode className="w-4 h-4 text-accent-text" />;
            case 'BANK':
                return <Building2 className="w-4 h-4 text-info" />;
            case 'EWALLET':
                return <Wallet className="w-4 h-4 text-warning" />;
            default:
                return null;
        }
    };

    return (
        <PublicLayout storeName={storeName} isProductPage={true}>
            <Head title={`${product.name} - Sewa & Beli`} />

            <div className="w-full pb-24 lg:pb-12">
                {/* Back to Catalog Link */}
                <div className="mb-4">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs text-text-2 hover:text-text transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Katalog Layanan</span>
                    </Link>
                </div>

                {/* 2 Columns on Desktop (38% left, 62% right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
                    {/* Left Column: Service Info & Rental Rules (38%) */}
                    <div className="lg:col-span-5 space-y-4">
                        {/* Service Card */}
                        <div className="bg-surface border border-border rounded-lg p-4 sm:p-5">
                            <div className="flex items-start gap-3.5">
                                <div
                                    className={`w-16 h-16 rounded-lg border flex items-center justify-center shrink-0 overflow-hidden brand-logo-box ${
                                        product.brand_color && /^#[0-9A-Fa-f]{6}$/.test(product.brand_color)
                                            ? 'has-brand-tint'
                                            : ''
                                    }`}
                                    style={
                                        product.brand_color && /^#[0-9A-Fa-f]{6}$/.test(product.brand_color)
                                            ? ({ ['--brand' as any]: product.brand_color } as React.CSSProperties)
                                            : undefined
                                    }
                                >
                                    {product.thumbnail_path ? (
                                        <img
                                            src={product.thumbnail_path}
                                            alt={product.name}
                                            className="w-full h-full object-contain p-2"
                                            width={64}
                                            height={64}
                                        />
                                    ) : (
                                        <span className="font-mono text-xl font-semibold text-text tracking-wider">
                                            {initials}
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-lg sm:text-xl font-bold text-text tracking-tight">
                                        {product.name}
                                    </h1>
                                    <span className="inline-block text-xs text-text-2 mt-0.5">
                                        {product.category}
                                    </span>
                                </div>
                            </div>

                            {product.description && (
                                <p className="text-xs sm:text-sm text-text-2 leading-relaxed mt-4 pt-3.5 border-t border-border/50">
                                    {product.description}
                                </p>
                            )}
                        </div>

                        {/* Rules & Guarantee Card */}
                        <div className="bg-surface border border-border rounded-lg p-4 sm:p-5">
                            <div className="flex items-center gap-2 mb-3 text-text">
                                <ShieldCheck className="w-4 h-4 text-accent-text shrink-0" />
                                <h2 className="text-sm font-semibold tracking-tight">
                                    Syarat Sewa & Garansi
                                </h2>
                            </div>

                            <div className="text-xs text-text-2 leading-relaxed space-y-2 whitespace-pre-line">
                                {product.rules || (
                                    <>
                                        <p>• Akun hanya untuk dipakai sendiri sesuai profil yang diberikan.</p>
                                        <p>• Dilarang mengubah email, password, PIN, atau nama profil.</p>
                                        <p>• Masa sewa dihitung sejak akun dikirim, bukan sejak pembayaran.</p>
                                        <p>• Jika akun bermasalah selama masa sewa/garansi, hubungi admin via WhatsApp dengan menyebut kode invoice.</p>
                                        <p>• Pembayaran yang sudah diverifikasi dan akun yang sudah dikirim tidak dapat dibatalkan.</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: 4-Step Checkout Form (62%) */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Step 1: Select Type & Package */}
                        <section
                            aria-labelledby="step-1-title"
                            className="bg-surface border border-border rounded-lg p-4 sm:p-5"
                        >
                            <div className="flex items-center gap-2.5 mb-4">
                                <span className="w-5 h-5 rounded-full bg-surface-2 border border-border-strong text-text font-mono text-xs font-bold flex items-center justify-center shrink-0">
                                    1
                                </span>
                                <h2 id="step-1-title" className="text-sm font-semibold text-text">
                                    Pilih Tipe & Paket
                                </h2>
                            </div>

                            {/* Tabs: Sewa Harian vs Beli Akun */}
                            <div className="mb-3.5">
                                <Tabs
                                    items={tabItems}
                                    activeTab={selectedTab}
                                    onChange={handleTabChange}
                                />
                            </div>

                            {/* Package Options List */}
                            <div
                                id={`tabpanel-${selectedTab}`}
                                role="tabpanel"
                                aria-labelledby={`tab-${selectedTab}`}
                            >
                                <div className="space-y-2" role="radiogroup" aria-label="Pilihan Paket">
                                    {tabVariants.length === 0 ? (
                                        <div className="p-4 rounded-md bg-surface-2 text-center text-xs text-text-2">
                                            Tidak ada paket yang tersedia untuk kategori ini.
                                        </div>
                                    ) : (
                                        tabVariants.map((variant) => {
                                            const isRent = variant.type === 'RENT';
                                            let isDisabled = false;
                                            let disabledReason = '';

                                            if (isRent) {
                                                if (quota.is_full) {
                                                    isDisabled = true;
                                                    disabledReason = 'Kuota sewa penuh, reset 00:00 WIB';
                                                } else if (product.available_rent_stock === 0) {
                                                    isDisabled = true;
                                                    disabledReason = 'Stok akun sewa habis';
                                                }
                                            } else {
                                                if (product.available_buy_stock === 0) {
                                                    isDisabled = true;
                                                    disabledReason = 'Stok akun beli habis';
                                                }
                                            }

                                            const isSelected = selectedVariant?.id === variant.id;

                                            return (
                                                <PackageOption
                                                    key={variant.id}
                                                    variant={variant}
                                                    isSelected={isSelected}
                                                    isDisabled={isDisabled}
                                                    disabledReason={disabledReason}
                                                    onSelect={(v) => setSelectedVariant(v)}
                                                />
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {serverErrors.variant_id && (
                                <div className="mt-3 p-3 rounded-md bg-danger/10 border border-danger/30 text-xs text-danger flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{serverErrors.variant_id}</span>
                                </div>
                            )}
                        </section>

                        {/* Step 2: Recipient Information */}
                        <section
                            aria-labelledby="step-2-title"
                            className="bg-surface border border-border rounded-lg p-4 sm:p-5"
                        >
                            <div className="flex items-center gap-2.5 mb-4">
                                <span className="w-5 h-5 rounded-full bg-surface-2 border border-border-strong text-text font-mono text-xs font-bold flex items-center justify-center shrink-0">
                                    2
                                </span>
                                <h2 id="step-2-title" className="text-sm font-semibold text-text">
                                    Data Penerima
                                </h2>
                            </div>

                            <div className="space-y-3.5">
                                <div>
                                    <label
                                        htmlFor="customer-phone"
                                        className="block text-xs font-medium text-text-2 mb-1.5"
                                    >
                                        Nomor WhatsApp <span className="text-danger">*</span>
                                    </label>
                                    <div className="relative flex items-center">
                                        <Input
                                            id="customer-phone"
                                            name="phone"
                                            type="tel"
                                            inputMode="tel"
                                            autoComplete="tel"
                                            value={rawPhone}
                                            onChange={(e) => {
                                                setRawPhone(e.target.value);
                                                if (!phoneTouched) setPhoneTouched(true);
                                                if (serverErrors.customer_phone) {
                                                    setServerErrors((prev) => {
                                                        const copy = { ...prev };
                                                        delete copy.customer_phone;
                                                        return copy;
                                                    });
                                                }
                                            }}
                                            onBlur={() => setPhoneTouched(true)}
                                            placeholder="Contoh: 081234567890"
                                            hasError={(phoneTouched && !phoneValidation.isValid) || !!serverErrors.customer_phone}
                                            aria-invalid={(phoneTouched && !phoneValidation.isValid) || !!serverErrors.customer_phone}
                                            aria-describedby={
                                                (phoneTouched && !phoneValidation.isValid) || serverErrors.customer_phone
                                                    ? 'phone-error'
                                                    : undefined
                                            }
                                        />
                                    </div>
                                    {phoneTouched && !phoneValidation.isValid && (
                                        <p
                                            id="phone-error"
                                            className="text-xs text-danger mt-1.5 font-medium"
                                        >
                                            {phoneValidation.error}
                                        </p>
                                    )}
                                    {serverErrors.customer_phone && (
                                        <p
                                            id="phone-error"
                                            className="text-xs text-danger mt-1.5 font-medium flex items-center gap-1.5"
                                        >
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            <span>{serverErrors.customer_phone}</span>
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="customer-note"
                                        className="block text-xs font-medium text-text-2 mb-1.5"
                                    >
                                        Catatan <span className="text-text-muted">(Opsional)</span>
                                    </label>
                                    <Input
                                        id="customer-note"
                                        name="note"
                                        type="text"
                                        value={customerNote}
                                        onChange={(e) => setCustomerNote(e.target.value)}
                                        placeholder="Catatan untuk pesanan kamu"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Step 3: Payment Method */}
                        <section
                            aria-labelledby="step-3-title"
                            className="bg-surface border border-border rounded-lg p-4 sm:p-5"
                        >
                            <div className="flex items-center gap-2.5 mb-4">
                                <span className="w-5 h-5 rounded-full bg-surface-2 border border-border-strong text-text font-mono text-xs font-bold flex items-center justify-center shrink-0">
                                    3
                                </span>
                                <h2 id="step-3-title" className="text-sm font-semibold text-text">
                                    Metode Pembayaran
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Metode Pembayaran">
                                {paymentMethods.map((pm) => {
                                    const isSelected = selectedPaymentMethodId === pm.id;
                                    return (
                                        <button
                                            key={pm.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={isSelected}
                                            onClick={() => {
                                                setSelectedPaymentMethodId(pm.id);
                                                if (serverErrors.payment_method_id) {
                                                    setServerErrors((prev) => {
                                                        const copy = { ...prev };
                                                        delete copy.payment_method_id;
                                                        return copy;
                                                    });
                                                }
                                            }}
                                            className={`p-3 rounded-lg border text-left transition-colors flex items-center justify-between gap-3 outline-none cursor-pointer ${
                                                isSelected
                                                    ? 'border-accent bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
                                                    : 'border-border bg-surface-2 hover:bg-surface-hover hover:border-border-strong focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-md bg-surface border border-border flex items-center justify-center shrink-0">
                                                    {getPaymentIcon(pm.type)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-text truncate">
                                                        {pm.label}
                                                    </div>
                                                    <div className="text-[11px] text-text-2 truncate">
                                                        Verifikasi manual
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                className={`w-3.5 h-3.5 rounded-full border shrink-0 flex items-center justify-center ${
                                                    isSelected
                                                        ? 'border-accent bg-accent'
                                                        : 'border-border-strong bg-surface'
                                                }`}
                                            >
                                                {isSelected && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-on-accent" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {serverErrors.payment_method_id && (
                                <div className="mt-3 p-3 rounded-md bg-danger/10 border border-danger/30 text-xs text-danger flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{serverErrors.payment_method_id}</span>
                                </div>
                            )}
                        </section>

                        {/* Step 4: Summary & Confirmation (Desktop) */}
                        <section
                            aria-labelledby="step-4-title"
                            className="bg-surface border border-border rounded-lg p-4 sm:p-5"
                        >
                            <div className="flex items-center gap-2.5 mb-4">
                                <span className="w-5 h-5 rounded-full bg-surface-2 border border-border-strong text-text font-mono text-xs font-bold flex items-center justify-center shrink-0">
                                    4
                                </span>
                                <h2 id="step-4-title" className="text-sm font-semibold text-text">
                                    Ringkasan & Konfirmasi
                                </h2>
                            </div>

                            {serverErrors.general && (
                                <div className="mb-3.5 p-3 rounded-md bg-danger/10 border border-danger/30 text-xs text-danger flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{serverErrors.general}</span>
                                </div>
                            )}

                            <div className="space-y-2.5 text-xs text-text-2 bg-surface-2 p-3.5 rounded-lg border border-border mb-4">
                                <div className="flex justify-between items-center">
                                    <span>Layanan</span>
                                    <span className="font-semibold text-text">{product.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Paket</span>
                                    <span className="font-semibold text-text">
                                        {selectedVariant ? selectedVariant.name : 'Belum dipilih'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Nomor WhatsApp</span>
                                    <span className="font-mono font-medium text-text">
                                        {phoneValidation.isValid ? phoneValidation.normalized : 'Belum valid'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Metode Bayar</span>
                                    <span className="font-semibold text-text">
                                        {selectedPayment?.label ?? 'Belum dipilih'}
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-border flex justify-between items-baseline">
                                    <span className="text-sm font-medium text-text">Total Perkiraan</span>
                                    <span className="font-mono text-base font-bold text-accent-text tabular-nums">
                                        {selectedVariant ? formatRupiah(selectedVariant.price) : 'Rp 0'}
                                    </span>
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

                            <Button
                                type="button"
                                variant="primary"
                                size="lg"
                                disabled={!isReadyToSubmit || isSubmitting}
                                loading={isSubmitting}
                                onClick={handleSubmit}
                                className="w-full h-11 text-sm font-semibold"
                            >
                                {selectedTab === 'RENT' ? 'Sewa Sekarang' : 'Beli Sekarang'}
                            </Button>
                        </section>
                    </div>
                </div>

                {/* Mobile Sticky Bottom Bar (< 1024px) */}
                <StickyBottomBar
                    totalPrice={selectedVariant?.price ?? null}
                    isReadyToSubmit={isReadyToSubmit}
                    isSubmitting={isSubmitting}
                    buttonLabel={selectedTab === 'RENT' ? 'Sewa Sekarang' : 'Beli Sekarang'}
                    onSubmit={handleSubmit}
                />

            </div>
        </PublicLayout>
    );
}
