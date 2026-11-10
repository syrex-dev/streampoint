import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/admin/PageHeader';
import { 
    ArrowLeft, 
    Check, 
    X, 
    AlertTriangle, 
    RefreshCw, 
    Clock, 
    Copy, 
    Eye, 
    EyeOff, 
    Image as ImageIcon,
    User,
    Calendar,
    CreditCard,
    Key,
    History,
    ShieldAlert
} from 'lucide-react';

interface AccountUnit {
    id: number;
    credential: Record<string, string> | string;
    status: string;
    note?: string | null;
}

interface OrderEvent {
    id: number;
    from_status?: string | null;
    to_status: string;
    actor: string;
    note?: string | null;
    created_at: string;
}

interface OrderDetail {
    id: number;
    invoice_code: string;
    product_id: number;
    product_name: string;
    product_icon?: string | null;
    variant_id: number;
    variant_name: string;
    order_type: string;
    duration_hours?: number | null;
    customer_phone: string;
    customer_note?: string | null;
    payment_method_label: string;
    base_price: number;
    unique_code: number;
    total_amount: number;
    has_proof: boolean;
    status: string;
    status_label: string;
    status_note?: string | null;
    payment_expires_at?: string | null;
    access_starts_at?: string | null;
    access_expires_at?: string | null;
    paid_at?: string | null;
    quota_date?: string | null;
    created_at: string;
    account?: AccountUnit | null;
    events: OrderEvent[];
}

interface ShowProps {
    order: OrderDetail;
    availableAccounts: { id: number; credential: any; note?: string | null; created_at: string }[];
}

export default function OrderShow({ order, availableAccounts }: ShowProps) {
    // Modal states
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('');
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [isReactivateOpen, setIsReactivateOpen] = useState(false);
    const [isReplaceAccountOpen, setIsReplaceAccountOpen] = useState(false);
    const [replaceReason, setReplaceReason] = useState('');
    const [selectedReplaceAccountId, setSelectedReplaceAccountId] = useState<number | ''>('');

    // Credential visibility toggle
    const [showPassword, setShowPassword] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Loading states
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Escape listener for modals
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsApproveOpen(false);
                setIsRejectOpen(false);
                setIsReactivateOpen(false);
                setIsReplaceAccountOpen(false);
            }
        };

        if (isApproveOpen || isRejectOpen || isReactivateOpen || isReplaceAccountOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isApproveOpen, isRejectOpen, isReactivateOpen, isReplaceAccountOpen]);

    const formatRupiah = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(label);
        setTimeout(() => setCopiedField(null), 1500);
    };

    const handleApprove = () => {
        setIsSubmitting(true);
        router.post(`/admin/orders/${order.id}/approve`, {
            account_id: selectedAccountId || undefined,
        }, {
            onFinish: () => {
                setIsSubmitting(false);
                setIsApproveOpen(false);
            },
        });
    };

    const handleReject = () => {
        if (!rejectReason.trim()) return;
        setIsSubmitting(true);
        router.post(`/admin/orders/${order.id}/reject`, {
            reason: rejectReason,
        }, {
            onFinish: () => {
                setIsSubmitting(false);
                setIsRejectOpen(false);
            },
        });
    };

    const handleReactivate = () => {
        setIsSubmitting(true);
        router.post(`/admin/orders/${order.id}/reactivate`, {}, {
            onFinish: () => {
                setIsSubmitting(false);
                setIsReactivateOpen(false);
            },
        });
    };

    const handleReplaceAccount = () => {
        if (!replaceReason.trim() || replaceReason.trim().length < 3) return;
        setIsSubmitting(true);
        router.post(`/admin/orders/${order.id}/replace-account`, {
            reason: replaceReason.trim(),
            new_account_id: selectedReplaceAccountId || undefined,
        }, {
            onFinish: () => {
                setIsSubmitting(false);
                setIsReplaceAccountOpen(false);
                setReplaceReason('');
                setSelectedReplaceAccountId('');
            },
        });
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-warning/10 text-warning border border-warning/30">
                        Menunggu Bayar
                    </span>
                );
            case 'VERIFYING':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-info/10 text-info border border-info/30">
                        Diverifikasi
                    </span>
                );
            case 'PAID':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-accent/10 text-accent-text border border-accent/35">
                        Lunas
                    </span>
                );
            case 'EXPIRED':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-surface-2 text-text-2 border border-border">
                        Kedaluwarsa
                    </span>
                );
            case 'CANCELLED':
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-danger/10 text-danger border border-danger/30">
                        Dibatalkan
                    </span>
                );
            default:
                return <span>{status}</span>;
        }
    };

    // Parse credential object or string
    const credentialData = typeof order.account?.credential === 'string'
        ? (() => {
            try {
                return JSON.parse(order.account.credential);
            } catch {
                return { Akun: order.account.credential };
            }
        })()
        : (order.account?.credential || {});

    return (
        <AdminLayout>
            <Head title={`Order ${order.invoice_code} - Admin`} />

            <div className="space-y-6">
                {/* Top Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/orders"
                            className="p-1.5 rounded-md bg-surface border border-border hover:bg-surface-hover text-text-2 hover:text-text transition-colors"
                            title="Kembali ke daftar pesanan"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold font-mono tracking-tight text-text">
                                    {order.invoice_code}
                                </h1>
                                {renderStatusBadge(order.status)}
                            </div>
                            <p className="text-xs text-text-2">
                                Dibuat pada {formatDate(order.created_at)}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons always prominent */}
                    <div className="flex flex-wrap items-center gap-2">
                        {order.status === 'VERIFYING' && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedAccountId(order.account?.id || '');
                                        setIsApproveOpen(true);
                                    }}
                                    className="px-3.5 py-2 bg-accent text-on-accent hover:bg-accent-hover text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Approve (Kirim Akun)</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsRejectOpen(true)}
                                    className="px-3.5 py-2 bg-transparent text-danger border border-danger hover:bg-danger/10 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Reject (Tolak)</span>
                                </button>
                            </>
                        )}

                        {order.status === 'PENDING' && (
                            <button
                                type="button"
                                onClick={() => setIsRejectOpen(true)}
                                className="px-3.5 py-2 bg-transparent text-danger border border-danger hover:bg-danger/10 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                                <span>Batalkan Pesanan</span>
                            </button>
                        )}

                        {order.status === 'EXPIRED' && (
                            <button
                                type="button"
                                onClick={() => setIsReactivateOpen(true)}
                                className="px-3.5 py-2 bg-surface-2 hover:bg-surface-hover text-text border border-border text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <RefreshCw className="w-4 h-4 text-accent-text" />
                                <span>Aktifkan Kembali</span>
                            </button>
                        )}

                        {order.status === 'PAID' && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedReplaceAccountId('');
                                    setIsReplaceAccountOpen(true);
                                }}
                                className="px-3.5 py-2 bg-surface-2 hover:bg-surface-hover text-text border border-border text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <RefreshCw className="w-4 h-4 text-warning" />
                                <span>Ganti Akun (Garansi)</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Main 2-Column Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Columns: Order Details */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Status Note Banner if Rejected/Cancelled */}
                        {order.status_note && (
                            <div className="p-3.5 rounded-md bg-danger/10 border border-danger/30 text-xs text-text space-y-1">
                                <div className="font-semibold text-danger flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>Catatan Penolakan / Pembatalan:</span>
                                </div>
                                <p className="text-text-2 pl-5.5">{order.status_note}</p>
                            </div>
                        )}

                        {/* Customer & Package Info Card */}
                        <div className="bg-surface border border-border rounded-md p-4 space-y-4">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-text-2 border-b border-border pb-2">
                                Data Pembeli & Paket
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="text-text-2 block mb-1">Nomor WhatsApp:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-semibold text-text text-sm">
                                            {order.customer_phone}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(order.customer_phone, 'phone')}
                                            className="p-1 rounded text-text-2 hover:text-text hover:bg-surface-hover"
                                            title="Salin nomor"
                                        >
                                            {copiedField === 'phone' ? (
                                                <Check className="w-3.5 h-3.5 text-accent-text" />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                    <a
                                        href={`https://wa.me/${order.customer_phone}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] text-accent-text hover:underline mt-0.5 inline-block"
                                    >
                                        Buka WhatsApp Pembeli &rarr;
                                    </a>
                                </div>

                                <div>
                                    <span className="text-text-2 block mb-1">Catatan Pembeli:</span>
                                    <p className="text-text italic">
                                        {order.customer_note || '(Tanpa catatan)'}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-text-2 block mb-1">Layanan & Tipe:</span>
                                    <div className="font-semibold text-text">
                                        {order.product_name}
                                    </div>
                                    <div className="text-text-2 text-[11px]">
                                        Tipe {order.order_type === 'RENT' ? 'Sewa Harian' : 'Beli Akun'}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-text-2 block mb-1">Varian & Durasi:</span>
                                    <div className="font-semibold text-text">
                                        {order.variant_name}
                                    </div>
                                    <div className="text-text-2 text-[11px]">
                                        {order.duration_hours ? `${order.duration_hours} Jam Masa Aktif` : '-'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Breakdown Card */}
                        <div className="bg-surface border border-border rounded-md p-4 space-y-4">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-text-2 border-b border-border pb-2">
                                Rincian Pembayaran
                            </h2>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div>
                                    <span className="text-text-2 block mb-0.5">Metode:</span>
                                    <span className="font-medium text-text">{order.payment_method_label}</span>
                                </div>
                                <div>
                                    <span className="text-text-2 block mb-0.5">Harga Pokok:</span>
                                    <span className="font-mono text-text">{formatRupiah(order.base_price)}</span>
                                </div>
                                {order.unique_code > 0 && (
                                    <div>
                                        <span className="text-text-2 block mb-0.5">Kode Unik:</span>
                                        <span className="font-mono text-accent-text font-bold">+{order.unique_code}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-text-2 block mb-0.5">Total Transfer:</span>
                                    <span className="font-mono font-bold text-sm text-text">
                                        {formatRupiah(order.total_amount)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/60 text-xs">
                                <div>
                                    <span className="text-text-2 block mb-0.5">Batas Bayar:</span>
                                    <span className="font-mono text-text">{formatDate(order.payment_expires_at)}</span>
                                </div>
                                <div>
                                    <span className="text-text-2 block mb-0.5">Waktu Lunas (Paid At):</span>
                                    <span className="font-mono text-text">{formatDate(order.paid_at)}</span>
                                </div>
                                <div>
                                    <span className="text-text-2 block mb-0.5">Masa Berlaku Akun:</span>
                                    <span className="font-mono text-text">
                                        {order.access_expires_at ? formatDate(order.access_expires_at) : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Assigned Account Unit */}
                        <div className="bg-surface border border-border rounded-md p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-border pb-2">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-text-2 flex items-center gap-1.5">
                                    <Key className="w-3.5 h-3.5 text-accent-text" />
                                    <span>Unit Akun yang Di-Assign</span>
                                </h2>
                                {order.account && (
                                    <span className="text-[11px] font-mono text-text-2">
                                        Unit ID #{order.account.id} ({order.account.status})
                                    </span>
                                )}
                            </div>

                            {!order.account ? (
                                <div className="p-4 text-center text-xs text-text-2 italic">
                                    Belum ada unit akun yang terhubung ke pesanan ini.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="bg-surface-2 p-3 rounded-md space-y-2 border border-border">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-text">Kredensial Akun:</span>
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="text-xs text-text-2 hover:text-text flex items-center gap-1 cursor-pointer"
                                            >
                                                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                <span>{showPassword ? 'Sembunyikan' : 'Tampilkan'}</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                            {Object.entries(credentialData).map(([key, val]) => {
                                                const strVal = String(val);
                                                const isSecret = key.toLowerCase().includes('pass') || key.toLowerCase().includes('pin');
                                                const displayVal = isSecret && !showPassword ? '••••••••' : strVal;

                                                return (
                                                    <div key={key} className="bg-surface p-2 rounded border border-border flex items-center justify-between">
                                                        <div>
                                                            <span className="text-[10px] uppercase text-text-2 block">{key}:</span>
                                                            <span className="font-mono font-medium text-text">{displayVal}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(strVal, key)}
                                                            className="p-1 rounded text-text-2 hover:text-text hover:bg-surface-hover"
                                                            title={`Salin ${key}`}
                                                        >
                                                            {copiedField === key ? (
                                                                <Check className="w-3.5 h-3.5 text-accent-text" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment Proof Section */}
                        <div className="bg-surface border border-border rounded-md p-4 space-y-3">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-text-2 border-b border-border pb-2 flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5 text-text-2" />
                                <span>Bukti Transfer Pembeli</span>
                            </h2>

                            {order.has_proof ? (
                                <div className="space-y-3">
                                    <div className="max-w-xs border border-border rounded-md overflow-hidden bg-surface-2 p-1">
                                        <img
                                            src={`/admin/orders/${order.id}/proof`}
                                            alt="Bukti Transfer"
                                            className="w-full h-auto max-h-72 object-contain rounded"
                                        />
                                    </div>
                                    <div>
                                        <a
                                            href={`/admin/orders/${order.id}/proof`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface-2 hover:bg-surface-hover text-text border border-border rounded transition-colors"
                                        >
                                            <ImageIcon className="w-3.5 h-3.5" />
                                            <span>Buka Gambar Ukuran Penuh</span>
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 text-center text-xs text-text-2 italic bg-surface-2/30 rounded border border-border">
                                    Pembeli tidak mengunggah gambar bukti transfer saat konfirmasi.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Order Events Audit Trail */}
                    <div className="space-y-4">
                        <div className="bg-surface border border-border rounded-md p-4 space-y-3">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-text-2 border-b border-border pb-2 flex items-center gap-1.5">
                                <History className="w-3.5 h-3.5 text-text-2" />
                                <span>Riwayat Audit (Order Events)</span>
                            </h2>

                            <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                                {order.events.map((evt) => (
                                    <div key={evt.id} className="relative text-xs space-y-1">
                                        {/* Timeline bullet */}
                                        <span className="absolute -left-4 top-1.5 w-2 h-2 rounded-full bg-accent" />
                                        
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-text">
                                                {evt.from_status ? `${evt.from_status} → ${evt.to_status}` : evt.to_status}
                                            </span>
                                            <span className="text-[10px] text-text-2 font-mono">
                                                {formatDate(evt.created_at)}
                                            </span>
                                        </div>

                                        <div className="text-[11px] text-text-2">
                                            Aktor: <span className="font-mono text-text">{evt.actor}</span>
                                        </div>

                                        {evt.note && (
                                            <p className="text-[11px] text-text bg-surface-2 p-1.5 rounded border border-border/60">
                                                {evt.note}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Approve Order */}
            {isApproveOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4"
                    onClick={() => setIsApproveOpen(false)}
                >
                    <div 
                        className="w-full max-w-md bg-surface border border-border-strong rounded-md p-5 shadow-xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-sm font-bold text-text">
                            Konfirmasi Approve & Kirim Akun
                        </h3>
                        <p className="text-xs text-text-2">
                            Pembayaran untuk pesanan <strong className="text-text font-mono">{order.invoice_code}</strong> akan ditandai Lunas (PAID). Kredensial akun akan diaktifkan dan dikirim ke pembeli.
                        </p>

                        {/* Unit selector for swap */}
                        <div className="space-y-1.5 text-xs">
                            <label className="font-medium text-text block">
                                Unit Akun yang Diberikan:
                            </label>
                            {availableAccounts.length === 0 ? (
                                <p className="text-text-2 italic text-[11px]">
                                    Tetap memakai unit #{order.account?.id} (tidak ada unit alternatif yang tersedia).
                                </p>
                            ) : (
                                <select
                                    value={selectedAccountId}
                                    onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                                    className="w-full h-9 px-2.5 text-xs bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                >
                                    {order.account && (
                                        <option value={order.account.id}>
                                            Unit Saat Ini #{order.account.id}
                                        </option>
                                    )}
                                    {availableAccounts
                                        .filter((a) => a.id !== order.account?.id)
                                        .map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                Ganti ke Unit #{acc.id} {acc.note ? `(${acc.note})` : ''}
                                            </option>
                                        ))}
                                </select>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                            <button
                                type="button"
                                onClick={() => setIsApproveOpen(false)}
                                className="px-3 py-1.5 text-xs text-text-2 hover:text-text rounded cursor-pointer"
                                disabled={isSubmitting}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleApprove}
                                disabled={isSubmitting}
                                className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded transition-colors cursor-pointer"
                            >
                                {isSubmitting ? 'Memproses...' : 'Setujui & Kirim Akun'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Reject Order */}
            {isRejectOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4"
                    onClick={() => setIsRejectOpen(false)}
                >
                    <div 
                        className="w-full max-w-md bg-surface border border-border-strong rounded-md p-5 shadow-xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-sm font-bold text-danger flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4" />
                            <span>Tolak Pesanan</span>
                        </h3>
                        <p className="text-xs text-text-2">
                            Status pesanan akan diubah menjadi <strong className="text-text font-mono">CANCELLED</strong>. Unit akun yang direservasi akan otomatis dilepaskan kembali menjadi AVAILABLE.
                        </p>

                        <div className="space-y-1.5 text-xs">
                            <label className="font-medium text-text block">
                                Alasan Penolakan <span className="text-danger">*</span>:
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={3}
                                placeholder="Contoh: Bukti transfer palsu atau mutasi tidak ditemukan..."
                                className="w-full p-2.5 text-xs bg-surface-2 border border-border rounded text-text placeholder:text-text-2 focus:outline-none focus:border-danger resize-none"
                            />
                            {rejectReason.trim().length > 0 && rejectReason.trim().length < 3 && (
                                <span className="text-[11px] text-danger">Alasan minimal 3 karakter.</span>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                            <button
                                type="button"
                                onClick={() => setIsRejectOpen(false)}
                                className="px-3 py-1.5 text-xs text-text-2 hover:text-text rounded cursor-pointer"
                                disabled={isSubmitting}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleReject}
                                disabled={isSubmitting || rejectReason.trim().length < 3}
                                className="px-4 py-1.5 bg-danger-solid text-on-danger text-xs font-semibold rounded hover:bg-danger-solid-hover transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                {isSubmitting ? 'Memproses...' : 'Tolak Pesanan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Reactivate Order */}
            {isReactivateOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4"
                    onClick={() => setIsReactivateOpen(false)}
                >
                    <div 
                        className="w-full max-w-md bg-surface border border-border-strong rounded-md p-5 shadow-xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-sm font-bold text-text flex items-center gap-1.5">
                            <RefreshCw className="w-4 h-4 text-accent-text" />
                            <span>Aktifkan Kembali Pesanan</span>
                        </h3>
                        <p className="text-xs text-text-2">
                            Pesanan yang kedaluwarsa akan diaktifkan kembali. Sistem akan memverifikasi ketersediaan kuota sewa dan ketersediaan unit akun, memperbarui batas bayar 15 menit, serta memastikan nominal total tetap unik.
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                            <button
                                type="button"
                                onClick={() => setIsReactivateOpen(false)}
                                className="px-3 py-1.5 text-xs text-text-2 hover:text-text rounded cursor-pointer"
                                disabled={isSubmitting}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleReactivate}
                                disabled={isSubmitting}
                                className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded transition-colors cursor-pointer"
                            >
                                {isSubmitting ? 'Memproses...' : 'Aktifkan Kembali'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Replace Account (Garansi) */}
            {isReplaceAccountOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4"
                    onClick={() => setIsReplaceAccountOpen(false)}
                >
                    <div 
                        className="w-full max-w-md bg-surface border border-border-strong rounded-md p-5 shadow-xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-sm font-bold text-text flex items-center gap-1.5">
                            <RefreshCw className="w-4 h-4 text-warning" />
                            <span>Ganti Akun (Garansi)</span>
                        </h3>
                        <p className="text-xs text-text-2">
                            Unit akun lama akan dinonaktifkan (<strong className="text-text font-mono">DISABLED</strong>). Unit baru berstatus <strong className="text-text font-mono">AVAILABLE</strong> dengan produk dan jenis yang sama akan dipasangkan. Batas akses pembeli (<code className="text-text font-mono">access_expires_at</code>) tetap dipertahankan.
                        </p>

                        <div className="space-y-1.5 text-xs">
                            <label className="font-medium text-text block">
                                Unit Pengganti:
                            </label>
                            <select
                                value={selectedReplaceAccountId}
                                onChange={(e) => setSelectedReplaceAccountId(e.target.value ? Number(e.target.value) : '')}
                                className="w-full h-9 px-2.5 text-xs bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                            >
                                <option value="">Otomatis (Pilih unit pertama yang tersedia)</option>
                                {availableAccounts
                                    .filter((a) => a.id !== order.account?.id)
                                    .map((acc) => (
                                        <option key={acc.id} value={acc.id}>
                                            Unit #{acc.id} {acc.note ? `(${acc.note})` : ''}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="space-y-1.5 text-xs">
                            <label className="font-medium text-text block">
                                Alasan Penggantian (Wajib) <span className="text-danger">*</span>:
                            </label>
                            <textarea
                                value={replaceReason}
                                onChange={(e) => setReplaceReason(e.target.value)}
                                rows={3}
                                placeholder="Contoh: Akun terkena limit screen / password salah..."
                                className="w-full p-2.5 text-xs bg-surface-2 border border-border rounded text-text placeholder:text-text-2 focus:outline-none focus:border-accent resize-none"
                            />
                            {replaceReason.trim().length > 0 && replaceReason.trim().length < 3 && (
                                <span className="text-[11px] text-danger">Alasan minimal 3 karakter.</span>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                            <button
                                type="button"
                                onClick={() => setIsReplaceAccountOpen(false)}
                                className="px-3 py-1.5 text-xs text-text-2 hover:text-text rounded cursor-pointer"
                                disabled={isSubmitting}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleReplaceAccount}
                                disabled={isSubmitting || replaceReason.trim().length < 3}
                                className="px-4 py-1.5 bg-warning text-on-warning text-xs font-semibold rounded hover:bg-warning/90 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                            >
                                {isSubmitting ? 'Memproses...' : 'Ganti Akun Sekarang'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
