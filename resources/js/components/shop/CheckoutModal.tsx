import React, { useEffect, useRef } from 'react';
import { X, Check, QrCode, Building2, Wallet, AlertCircle, ShieldCheck } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import { PaymentMethodItem, ProductDetail, ProductVariantData } from '@/types/shop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ProductDetail;
    variant: ProductVariantData | null;
    paymentMethods: PaymentMethodItem[];
    selectedPaymentMethodId: number | null;
    onSelectPaymentMethod: (id: number) => void;
    phone: string;
    onPhoneChange: (val: string) => void;
    phoneError?: string | null;
    note: string;
    onNoteChange: (val: string) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    serverErrors: Record<string, string>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
    isOpen,
    onClose,
    product,
    variant,
    paymentMethods,
    selectedPaymentMethodId,
    onSelectPaymentMethod,
    phone,
    onPhoneChange,
    phoneError,
    note,
    onNoteChange,
    onSubmit,
    isSubmitting,
    serverErrors,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !variant) return null;

    const getPaymentIcon = (type: PaymentMethodItem['type']) => {
        switch (type) {
            case 'QRIS':
                return <QrCode className="w-4 h-4 text-accent-text" />;
            case 'BANK':
                return <Building2 className="w-4 h-4 text-info" />;
            case 'EWALLET':
                return <Wallet className="w-4 h-4 text-warning" />;
            default:
                return <Wallet className="w-4 h-4 text-text-2" />;
        }
    };

    const isReady = Boolean(phone.trim().length >= 9 && !phoneError && selectedPaymentMethodId);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-overlay backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
            {/* Backdrop click */}
            <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

            {/* Modal Box (Bottom Sheet on Mobile, Centered Dialog on Desktop) */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="checkout-modal-title"
                className="relative w-full max-w-lg bg-surface border-t sm:border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] z-10 overflow-hidden outline-none"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0 bg-surface">
                    <div>
                        <h2 id="checkout-modal-title" className="text-base sm:text-lg font-bold text-text tracking-tight">
                            Checkout Pesanan
                        </h2>
                        <p className="text-xs text-text-2 mt-0.5">
                            Konfirmasi detail sebelum melanjutkan ke pembayaran
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-text-2 hover:text-text hover:bg-surface-hover rounded-full transition-colors cursor-pointer"
                        aria-label="Tutup"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
                    {/* 1. Item Preview Card (Orvaki Style) */}
                    <div className="bg-surface-2/60 border border-border rounded-xl p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            {product.thumbnail_path ? (
                                <img
                                    src={product.thumbnail_path}
                                    alt={product.name}
                                    className="w-12 h-12 rounded-lg object-contain bg-surface border border-border p-1 shrink-0"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-lg bg-surface border border-border flex items-center justify-center font-bold text-text shrink-0">
                                    SP
                                </div>
                            )}
                            <div className="min-w-0">
                                <h3 className="font-bold text-sm text-text truncate">
                                    {product.name}
                                </h3>
                                <p className="text-xs text-text-2 truncate mt-0.5">
                                    Varian: {variant.name} {variant.duration_hours > 0 ? `(${Math.round(variant.duration_hours / 24)} Hari)` : ''}
                                </p>
                            </div>
                        </div>

                        <div className="text-right shrink-0">
                            <span className="font-mono text-base sm:text-lg font-bold text-accent-text tabular-nums">
                                {formatRupiah(variant.price)}
                            </span>
                        </div>
                    </div>

                    {/* Server error general banner */}
                    {serverErrors.general && (
                        <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-xs text-danger flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{serverErrors.general}</span>
                        </div>
                    )}

                    {/* 2. Varian Tag Info (Orvaki Style) */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text">Varian Pesanan</label>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border">
                            <span className="font-medium text-text text-xs sm:text-sm">
                                {variant.name} {variant.duration_hours > 0 ? `• ${Math.round(variant.duration_hours / 24)} Hari` : ''}
                            </span>
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/15 text-accent-text border border-accent/30 uppercase tracking-wide">
                                OTOMATIS
                            </span>
                        </div>
                    </div>

                    {/* 3. Input Nomor WhatsApp */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label htmlFor="checkout-wa" className="text-xs font-semibold text-text">
                                Nomor WhatsApp (Wajib) <span className="text-danger">*</span>
                            </label>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-text-2 border border-border">
                                Pembeli
                            </span>
                        </div>
                        <Input
                            id="checkout-wa"
                            type="tel"
                            inputMode="tel"
                            value={phone}
                            onChange={(e) => onPhoneChange(e.target.value)}
                            placeholder="Contoh: 081234567890"
                            hasError={Boolean(phoneError || serverErrors.customer_phone)}
                            className="h-10 text-xs sm:text-sm font-mono"
                        />
                        {phoneError ? (
                            <p className="text-[11px] text-danger">{phoneError}</p>
                        ) : serverErrors.customer_phone ? (
                            <div className="space-y-1 p-2.5 rounded-lg bg-danger/10 border border-danger/30 text-[11px] text-danger">
                                <p>{serverErrors.customer_phone}</p>
                                {serverErrors.customer_phone.includes('INV-') && (
                                    <div className="pt-0.5">
                                        <a
                                            href={`/invoice/${serverErrors.customer_phone.match(/INV-[A-Za-z0-9-]+/)?.[0] || ''}`}
                                            className="font-bold underline inline-flex items-center gap-1 hover:opacity-80"
                                        >
                                            Lanjutkan ke Invoice Pesanan Ini &rarr;
                                        </a>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-[11px] text-text-2">
                                Kredensial akun dan konfirmasi invoice akan terhubung dengan nomor ini. Gunakan angka saja.
                            </p>
                        )}
                    </div>

                    {/* 4. Catatan Pesanan (Opsional) */}
                    <div className="space-y-1.5">
                        <label htmlFor="checkout-note" className="text-xs font-semibold text-text">
                            Catatan Pesanan (Opsional)
                        </label>
                        <textarea
                            id="checkout-note"
                            value={note}
                            onChange={(e) => onNoteChange(e.target.value)}
                            rows={2}
                            maxLength={500}
                            placeholder="Tuliskan catatan atau permintaan khusus jika ada..."
                            className="w-full p-2.5 text-xs bg-surface border border-border rounded-lg text-text placeholder:text-text-2 focus:outline-none focus:border-accent resize-none transition-colors"
                        />
                    </div>

                    {/* 5. Metode Pembayaran */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-text block">
                            Pilih Metode Pembayaran <span className="text-danger">*</span>
                        </label>
                        {serverErrors.payment_method_id && (
                            <p className="text-[11px] text-danger">{serverErrors.payment_method_id}</p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {paymentMethods.map((pm) => {
                                const isSelected = selectedPaymentMethodId === pm.id;
                                return (
                                    <button
                                        key={pm.id}
                                        type="button"
                                        onClick={() => onSelectPaymentMethod(pm.id)}
                                        className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-accent/10 border-accent text-text ring-1 ring-accent shadow-xs'
                                                : 'bg-surface border-border text-text-2 hover:text-text hover:bg-surface-hover hover:border-border-strong'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {pm.logo_url ? (
                                                <div className="w-8 h-8 rounded border border-border bg-surface flex items-center justify-center p-1 shrink-0 overflow-hidden">
                                                    <img src={pm.logo_url} alt={pm.label} className="w-full h-full object-contain" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded border border-border bg-surface-2 flex items-center justify-center shrink-0">
                                                    {getPaymentIcon(pm.type)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className={`text-xs font-semibold truncate ${isSelected ? 'text-text' : 'text-text'}`}>
                                                    {pm.label}
                                                </div>
                                                <div className="text-[10px] text-text-2 truncate">
                                                    {pm.type === 'QRIS' ? 'QRIS Otomatis' : 'Transfer Manual'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                            isSelected ? 'border-accent bg-accent text-on-accent' : 'border-border bg-surface'
                                        }`}>
                                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Syarat singkat */}
                    <div className="p-3 rounded-lg bg-surface-2/40 border border-border text-[11px] text-text-2 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-accent-text shrink-0" />
                        <span>Transaksi terlindungi. Garansi akun aktif sesuai durasi paket.</span>
                    </div>
                </div>

                {/* Footer Action Bar */}
                <div className="p-4 sm:p-5 border-t border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div>
                        <span className="text-[11px] text-text-2 block">Total Pembayaran:</span>
                        <span className="font-mono text-lg sm:text-xl font-bold text-accent-text tabular-nums">
                            {formatRupiah(variant.price)}
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                        {!selectedPaymentMethodId && phone.trim().length >= 9 && !phoneError && (
                            <span className="text-[11px] text-warning text-center sm:text-right font-medium">
                                Pilih salah satu metode pembayaran di atas
                            </span>
                        )}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={onSubmit}
                                disabled={!isReady || isSubmitting}
                                loading={isSubmitting}
                                className="flex-2 sm:flex-none text-xs font-semibold px-6 shadow-xs"
                            >
                                {isSubmitting ? 'Menyiapkan Pembayaran...' : 'Bayar Sekarang →'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
