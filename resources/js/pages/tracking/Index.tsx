import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Search, FileText, ArrowRight, AlertCircle, Clock } from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabItem } from '@/components/ui/tabs';
import { OrderStepper, OrderStepStatus } from '@/components/shop/OrderStepper';
import { TrackingOrderItem, OrderStatusType } from '@/types/shop';

interface TrackingIndexProps {
    storeName?: string;
    orders: TrackingOrderItem[] | null;
    searched: boolean;
    errors?: Record<string, string>;
}

export default function TrackingIndex({
    storeName = 'NamaToko',
    orders,
    searched,
    errors = {},
}: TrackingIndexProps) {
    const [searchMode, setSearchMode] = useState<'invoice' | 'phone'>('invoice');

    // Form 1: Invoice + Phone
    const [invoiceCode, setInvoiceCode] = useState('');
    const [phoneForInvoice, setPhoneForInvoice] = useState('');

    // Form 2: Phone only
    const [phoneOnly, setPhoneOnly] = useState('');

    const [isSearching, setIsSearching] = useState(false);
    const [clientError, setClientError] = useState<string | null>(null);

    // Local device history
    const [localHistory, setLocalHistory] = useState<Array<{
        invoice_code: string;
        product_name?: string;
        variant_name?: string;
        total_amount?: number;
        status?: OrderStatusType;
        created_at?: string;
    }>>([]);

    React.useEffect(() => {
        try {
            const raw = localStorage.getItem('streampoint_order_history');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    setLocalHistory(parsed);
                }
            }
        } catch {
            // Ignore storage error
        }
    }, []);

    const handleClearHistory = () => {
        try {
            localStorage.removeItem('streampoint_order_history');
            setLocalHistory([]);
        } catch {
            // Ignore
        }
    };

    const tabs: TabItem[] = [
        { id: 'invoice', label: 'Kode Invoice + WA' },
        { id: 'phone', label: 'Cari via Nomor WA' },
    ];

    const handleSearchInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        setClientError(null);

        if (!invoiceCode.trim()) {
            setClientError('Kode invoice wajib diisi.');
            return;
        }
        if (!phoneForInvoice.trim()) {
            setClientError('Nomor WhatsApp wajib diisi.');
            return;
        }

        setIsSearching(true);
        router.post(
            '/cek-pesanan',
            {
                mode: 'invoice',
                invoice_code: invoiceCode.trim(),
                phone: phoneForInvoice.trim(),
            },
            {
                preserveScroll: true,
                onFinish: () => setIsSearching(false),
            }
        );
    };

    const handleSearchPhone = (e: React.FormEvent) => {
        e.preventDefault();
        setClientError(null);

        if (!phoneOnly.trim()) {
            setClientError('Nomor WhatsApp wajib diisi.');
            return;
        }

        setIsSearching(true);
        router.post(
            '/cek-pesanan',
            {
                mode: 'phone',
                phone: phoneOnly.trim(),
            },
            {
                preserveScroll: true,
                onFinish: () => setIsSearching(false),
            }
        );
    };

    const getBadgeVariant = (st: OrderStatusType) => {
        switch (st) {
            case 'PENDING':
                return 'warning';
            case 'VERIFYING':
                return 'info';
            case 'PAID':
                return 'accent';
            case 'EXPIRED':
            case 'CANCELLED':
            default:
                return 'danger';
        }
    };

    return (
        <PublicLayout storeName={storeName}>
            <Head title={`Cek Pesanan - ${storeName}`} />

            <div className="w-full max-w-2xl mx-auto pb-20 pt-4 space-y-6">
                {/* Header */}
                <div className="space-y-1.5 text-center sm:text-left">
                    <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
                        <Search className="w-5 h-5 text-accent-text" />
                        <span>Riwayat & Cek Status Pesanan</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-text-2 leading-relaxed">
                        Pantau status pesanan kamu secara real-time, bayar tagihan sewa, atau buka kredensial akun streaming yang telah aktif.
                    </p>
                </div>

                {/* Local Device Order History */}
                {localHistory.length > 0 && (
                    <div className="bg-surface border border-accent/30 rounded-xl p-4 sm:p-5 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-accent-text" />
                                <h2 className="text-xs sm:text-sm font-bold text-text">
                                    Pesanan Terakhir di Perangkat Ini ({localHistory.length})
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleClearHistory}
                                className="text-[11px] text-text-3 hover:text-danger transition-colors cursor-pointer"
                            >
                                Hapus Riwayat
                            </button>
                        </div>

                        <div className="space-y-2">
                            {localHistory.map((item) => (
                                <Link
                                    key={item.invoice_code}
                                    href={`/invoice/${item.invoice_code}`}
                                    className="p-3 bg-surface-2 hover:bg-surface-hover border border-border hover:border-accent/50 rounded-lg flex items-center justify-between gap-3 transition-colors group block"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="font-mono text-xs font-bold text-text">
                                                {item.invoice_code}
                                            </span>
                                            {item.status && (
                                                <Badge variant={getBadgeVariant(item.status)}>
                                                    {item.status}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-text-2 truncate">
                                            {item.product_name ? `${item.product_name} - ${item.variant_name || ''}` : 'Pesanan Streaming'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {typeof item.total_amount === 'number' && (
                                            <span className="font-mono text-xs font-semibold text-text hidden sm:inline">
                                                Rp {new Intl.NumberFormat('id-ID').format(item.total_amount)}
                                            </span>
                                        )}
                                        <ArrowRight className="w-4 h-4 text-text-3 group-hover:text-accent-text group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search Box */}
                <div className="bg-surface border border-border rounded-lg p-4 sm:p-6 space-y-5">
                    {/* Tabs */}
                    <Tabs
                        items={tabs}
                        activeTab={searchMode}
                        onChange={(id) => {
                            setSearchMode(id as 'invoice' | 'phone');
                            setClientError(null);
                        }}
                    />

                    {/* Error Alerts */}
                    {(clientError || errors.search || errors.phone || errors.invoice_code) && (
                        <div className="p-3 rounded-md bg-danger/10 border border-danger/30 text-xs text-danger flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>
                                {clientError ||
                                    errors.search ||
                                    errors.phone ||
                                    errors.invoice_code}
                            </span>
                        </div>
                    )}

                    {/* Mode 1: Invoice + Phone */}
                    {searchMode === 'invoice' && (
                        <form onSubmit={handleSearchInvoice} className="space-y-3.5">
                            <div>
                                <label
                                    htmlFor="invoice-code-input"
                                    className="block text-xs font-medium text-text-2 mb-1.5"
                                >
                                    Kode Invoice <span className="text-danger">*</span>
                                </label>
                                <Input
                                    id="invoice-code-input"
                                    type="text"
                                    value={invoiceCode}
                                    onChange={(e) => setInvoiceCode(e.target.value)}
                                    placeholder="Contoh: INV-20261101-ABCD"
                                    className="font-mono text-sm uppercase"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="invoice-phone-input"
                                    className="block text-xs font-medium text-text-2 mb-1.5"
                                >
                                    Nomor WhatsApp <span className="text-danger">*</span>
                                </label>
                                <Input
                                    id="invoice-phone-input"
                                    type="tel"
                                    inputMode="tel"
                                    value={phoneForInvoice}
                                    onChange={(e) => setPhoneForInvoice(e.target.value)}
                                    placeholder="Contoh: 081234567890"
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                loading={isSearching}
                                disabled={isSearching}
                                className="w-full h-11 text-sm font-semibold mt-2"
                            >
                                Buka Invoice Pesanan
                            </Button>
                        </form>
                    )}

                    {/* Mode 2: Phone Only */}
                    {searchMode === 'phone' && (
                        <form onSubmit={handleSearchPhone} className="space-y-3.5">
                            <div>
                                <label
                                    htmlFor="phone-only-input"
                                    className="block text-xs font-medium text-text-2 mb-1.5"
                                >
                                    Nomor WhatsApp <span className="text-danger">*</span>
                                </label>
                                <Input
                                    id="phone-only-input"
                                    type="tel"
                                    inputMode="tel"
                                    value={phoneOnly}
                                    onChange={(e) => setPhoneOnly(e.target.value)}
                                    placeholder="Contoh: 081234567890"
                                />
                                <p className="text-[11px] text-text-muted mt-1">
                                    Menampilkan daftar ringkasan pesanan aktif yang terdaftar dengan nomor ini.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                loading={isSearching}
                                disabled={isSearching}
                                className="w-full h-11 text-sm font-semibold mt-2"
                            >
                                Cari Pesanan
                            </Button>
                        </form>
                    )}
                </div>

                {/* Search Results (Phone Mode) */}
                {searched && orders && (
                    <div className="space-y-3" aria-live="polite">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-sm font-bold text-text">
                                Hasil Pencarian ({orders.length})
                            </h2>
                            <span className="text-xs text-text-2">
                                10 pesanan terakhir
                            </span>
                        </div>

                        {orders.length === 0 ? (
                            <div className="bg-surface border border-border rounded-lg p-6 text-center text-xs text-text-2 space-y-2">
                                <p>Tidak ada pesanan yang ditemukan untuk nomor WhatsApp ini.</p>
                                <Link
                                    href="/"
                                    className="inline-block text-xs font-semibold text-accent-text hover:underline"
                                >
                                    Lihat Katalog Layanan &rarr;
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {orders.map((item) => (
                                    <div
                                        key={item.invoice_code}
                                        className="bg-surface border border-border rounded-lg p-4 hover:border-border-strong transition-colors space-y-3"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-text">
                                                        #{item.invoice_code}
                                                    </span>
                                                    <Badge variant={getBadgeVariant(item.status)}>
                                                        {item.status_label}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-text-2">
                                                    <span className="font-semibold text-text">
                                                        {item.service_name}
                                                    </span>{' '}
                                                    &bull; {item.package_name}
                                                </div>
                                                <div className="text-[11px] text-text-muted flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{item.created_at}</span>
                                                </div>
                                            </div>

                                            <div className="shrink-0 flex items-center justify-end">
                                                <Link
                                                    href={`/invoice/${item.invoice_code}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-surface-2 hover:bg-surface-hover text-text border border-border transition-colors focus-visible:ring-2 focus-visible:ring-accent"
                                                >
                                                    <span>Lihat Invoice</span>
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-border/60">
                                            <OrderStepper status={item.status as OrderStepStatus} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
