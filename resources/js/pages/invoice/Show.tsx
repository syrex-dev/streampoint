import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Clock,
    AlertCircle,
    CheckCircle2,
    XCircle,
    UploadCloud,
    Building2,
    QrCode,
    Wallet,
    ArrowLeft,
    PhoneCall,
    ShieldAlert,
    RefreshCw,
    ExternalLink,
} from 'lucide-react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { CountdownTimer } from '@/components/shop/CountdownTimer';
import { TotalHighlight } from '@/components/shop/TotalHighlight';
import { CopyButton } from '@/components/shop/CopyButton';
import { CredentialBox } from '@/components/shop/CredentialBox';
import { OrderStepper } from '@/components/shop/OrderStepper';
import { formatRupiah, formatDateTimeWIB } from '@/lib/format';
import { OrderInvoiceData } from '@/types/shop';

interface InvoiceShowProps {
    storeName?: string;
    adminWhatsapp?: string | null;
    admin_whatsapp?: string | null;
    isAuthorized: boolean;
    serverNow: string;
    order: OrderInvoiceData;
    errors?: Record<string, string>;
}

export default function InvoiceShow({
    storeName = 'NamaToko',
    adminWhatsapp,
    admin_whatsapp,
    isAuthorized,
    serverNow,
    order,
    errors = {},
}: InvoiceShowProps) {
    // Current status state (can update via polling or countdown expire)
    const [status, setStatus] = useState(order.status);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofPreview, setProofPreview] = useState<string | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmError, setConfirmError] = useState<string | null>(null);

    // Cancel order state
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // Floating copy toast state (DESIGN_SYSTEM 6.37 & 6.39: 2s duration, opacity transition only)
    const [showCopyToast, setShowCopyToast] = useState(false);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handleCopy = () => {
            setShowCopyToast(true);
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
            toastTimerRef.current = setTimeout(() => {
                setShowCopyToast(false);
            }, 2000);
        };

        window.addEventListener('copy-success', handleCopy);
        return () => {
            window.removeEventListener('copy-success', handleCopy);
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, []);

    // Store in localStorage order history so buyer can easily find it later
    useEffect(() => {
        if (order?.invoice_code) {
            try {
                const historyKey = 'streampoint_order_history';
                const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
                const item = {
                    invoice_code: order.invoice_code,
                    product_name: order.product?.name || 'Layanan Streaming',
                    variant_name: order.variant?.name || 'Paket',
                    total_amount: order.total_amount,
                    status: order.status,
                    created_at: order.created_at || new Date().toISOString(),
                };
                const filtered = Array.isArray(existing) ? existing.filter((x: any) => x?.invoice_code !== order.invoice_code) : [];
                localStorage.setItem(historyKey, JSON.stringify([item, ...filtered].slice(0, 20)));
            } catch {
                // Ignore storage error
            }
        }
    }, [order?.invoice_code, order?.status]);

    // Clean admin WhatsApp phone number
    const rawWhatsapp = adminWhatsapp || admin_whatsapp || '';
    let cleanAdminPhone = rawWhatsapp.replace(/\D/g, '');
    if (cleanAdminPhone.startsWith('0')) {
        cleanAdminPhone = '62' + cleanAdminPhone.slice(1);
    }

    const handleCancelOrder = () => {
        setIsCancelling(true);
        setConfirmError(null);

        router.post(`/invoice/${order.invoice_code}/cancel`, {}, {
            preserveScroll: true,
            onFinish: () => {
                setIsCancelling(false);
                setIsCancelModalOpen(false);
            },
            onError: (errs) => {
                if (errs.cancel) {
                    setConfirmError(errs.cancel);
                }
            },
        });
    };

    // Phone verification form state
    const [verifyPhone, setVerifyPhone] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);

    // Sync status from incoming props
    useEffect(() => {
        setStatus(order.status);
    }, [order.status]);

    // Handle Proof selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client check: max 3MB
        if (file.size > 3 * 1024 * 1024) {
            setConfirmError('Ukuran file bukti pembayaran maksimal 3MB.');
            return;
        }

        setConfirmError(null);
        setProofFile(file);
        setProofPreview(URL.createObjectURL(file));
    };

    // Clean up preview blob
    useEffect(() => {
        return () => {
            if (proofPreview) URL.revokeObjectURL(proofPreview);
        };
    }, [proofPreview]);

    // Confirm Payment submission ("Saya Sudah Bayar")
    const handleConfirmPayment = () => {
        setIsConfirming(true);
        setConfirmError(null);

        const formData = new FormData();
        if (proofFile) {
            formData.append('proof', proofFile);
        }

        router.post(`/invoice/${order.invoice_code}/confirm`, formData, {
            preserveScroll: true,
            onFinish: () => {
                setIsConfirming(false);
            },
            onError: (errs) => {
                if (errs.proof) {
                    setConfirmError(errs.proof);
                } else if (errs.confirm) {
                    setConfirmError(errs.confirm);
                } else {
                    setConfirmError('Gagal mengonfirmasi pembayaran. Silakan coba lagi.');
                }
            },
        });
    };

    // Verify WhatsApp number submission
    const handleVerifyPhone = (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifyPhone.trim()) return;

        setIsVerifying(true);
        setVerifyError(null);

        router.post(
            `/invoice/${order.invoice_code}/verify`,
            { phone: verifyPhone },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsVerifying(false);
                },
                onError: (errs) => {
                    setVerifyError(errs.phone || 'Verifikasi gagal. Pastikan nomor WhatsApp sesuai pesanan.');
                },
            }
        );
    };

    // 10s status polling (stops on terminal statuses: PAID, EXPIRED, CANCELLED)
    const isTerminal = status === 'PAID' || status === 'EXPIRED' || status === 'CANCELLED';
    useEffect(() => {
        if (isTerminal) return;

        const intervalId = setInterval(() => {
            if (document.visibilityState === 'visible') {
                router.reload({ only: ['order', 'isAuthorized'] });
            }
        }, 10000);

        return () => clearInterval(intervalId);
    }, [isTerminal, order.invoice_code]);

    // When Countdown expires
    const handleCountdownExpire = () => {
        setStatus('EXPIRED');
    };

    // Status Badge config
    const getBadgeVariant = (st: typeof status) => {
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
        <PublicLayout storeName={storeName} currentInvoiceCode={order.invoice_code}>
            <Head title={`Invoice #${order.invoice_code} - ${storeName}`} />

            <div className="w-full max-w-3xl mx-auto pb-20 pt-2 space-y-5">
                {/* (1) Kode Invoice + Badge Status & Back Link */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 text-xs text-text-2 hover:text-text transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Katalog</span>
                        </Link>
                        <span className="text-border">|</span>
                        <Link
                            href="/cek-pesanan"
                            className="inline-flex items-center gap-1.5 text-xs text-text-2 hover:text-text transition-colors"
                        >
                            <span>Riwayat</span>
                        </Link>
                        <span className="text-border">|</span>
                        <div className="flex items-center gap-1.5">
                            <span className="font-mono text-sm font-bold text-text">
                                #{order.invoice_code}
                            </span>
                            <CopyButton text={order.invoice_code} label="Salin Kode" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-text-2">Status:</span>
                        <Badge variant={getBadgeVariant(status)}>
                            {order.status_label}
                        </Badge>
                    </div>
                </div>

                {/* (2) Stepper Status (DESIGN_SYSTEM 6.35) */}
                <div className="bg-surface border border-border rounded-lg p-3 sm:p-4">
                    <OrderStepper status={status} />
                </div>

                {/* (3) Credential Box for PAID status (moves to position 3 per 6.37) */}
                {status === 'PAID' && (
                    <div className="space-y-4">
                        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 flex items-start gap-3 text-accent-text">
                            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-text">
                                    Pembayaran Berhasil — Akun Aktif
                                </h3>
                                <p className="text-xs text-text-2 leading-relaxed">
                                    Pesanan kamu telah lunas. Kredensial akun streaming dapat dilihat di bawah ini.
                                </p>
                            </div>
                        </div>

                        {isAuthorized ? (
                            <CredentialBox
                                credentials={order.credentials}
                                orderType={order.order_type}
                                accessStartsAt={order.access_starts_at}
                                accessExpiresAt={order.access_expires_at}
                            />
                        ) : (
                            /* Unauthorized Card */
                            <div className="bg-surface border border-warning/40 rounded-lg p-5 space-y-4">
                                <div className="flex items-center gap-2 text-warning">
                                    <ShieldAlert className="w-5 h-5 shrink-0" />
                                    <h3 className="text-sm font-bold text-text">
                                        Kredensial Terlindungi
                                    </h3>
                                </div>
                                <p className="text-xs text-text-2 leading-relaxed">
                                    Kredensial akun disembunyikan untuk menjaga keamanan pembeli. Masukkan nomor WhatsApp yang kamu gunakan saat checkout untuk membuka akses akun.
                                </p>

                                {verifyError && (
                                    <div className="p-3 rounded-md bg-danger/10 border border-danger/30 text-xs text-danger flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{verifyError}</span>
                                    </div>
                                )}

                                <form onSubmit={handleVerifyPhone} className="space-y-3">
                                    <div>
                                        <label
                                            htmlFor="verify-phone"
                                            className="block text-xs font-medium text-text-2 mb-1.5"
                                        >
                                            Nomor WhatsApp Terdaftar
                                        </label>
                                        <Input
                                            id="verify-phone"
                                            type="tel"
                                            inputMode="tel"
                                            value={verifyPhone}
                                            onChange={(e) => setVerifyPhone(e.target.value)}
                                            placeholder="Contoh: 081234567890"
                                            hasError={!!verifyError}
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="default"
                                        loading={isVerifying}
                                        disabled={isVerifying || !verifyPhone.trim()}
                                        className="w-full"
                                    >
                                        Buka Kredensial Akun
                                    </Button>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                {/* VERIFYING Banner */}
                {status === 'VERIFYING' && (
                    <div className="bg-surface border border-info/40 rounded-xl p-5 shadow-xs space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-info/15 text-info flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5 animate-pulse" />
                            </div>
                            <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <h3 className="text-sm font-bold text-text">
                                        Pembayaran Menunggu Verifikasi Admin
                                    </h3>
                                    <Badge variant="info">Status: Menunggu Verifikasi</Badge>
                                </div>
                                <p className="text-xs text-text-2 leading-relaxed">
                                    Konfirmasi pembayaran kamu sudah kami terima dan sedang diperiksa oleh admin. Begitu pesanan disetujui, kredensial akun streaming (Email, Password, Profil, PIN) akan <strong>langsung muncul secara otomatis di halaman ini</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-border flex items-center justify-between flex-wrap gap-2.5">
                            <Link
                                href="/cek-pesanan"
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-2 hover:bg-surface-hover text-text border border-border text-xs font-semibold rounded-md transition-colors"
                            >
                                <span>Cek Riwayat & Detail Pesanan</span>
                                <ExternalLink className="w-3.5 h-3.5 text-text-2" />
                            </Link>

                            <button
                                type="button"
                                onClick={() => router.reload({ only: ['order', 'isAuthorized'] })}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded-md transition-colors cursor-pointer shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Periksa Status Sekarang</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* EXPIRED Banner */}
                {status === 'EXPIRED' && (
                    <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 flex items-start gap-3 text-danger">
                        <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-text">
                                Pesanan Kedaluwarsa
                            </h3>
                            <p className="text-xs text-text-2 leading-relaxed">
                                Batas waktu pembayaran telah habis. Pesanan ini telah dibatalkan secara otomatis oleh sistem. Silakan lakukan pemesanan ulang.
                            </p>
                            <div className="pt-2">
                                <Link href="/" className="inline-block text-xs font-semibold text-accent-text hover:underline">
                                    Pesan Ulang di Katalog &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* CANCELLED Banner */}
                {status === 'CANCELLED' && (
                    <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 flex items-start gap-3 text-danger">
                        <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-text">
                                Pesanan Dibatalkan
                            </h3>
                            <p className="text-xs text-text-2 leading-relaxed">
                                {order.status_note || 'Pesanan ini telah dibatalkan. Jika kamu sudah melakukan transfer, silakan hubungi admin.'}
                            </p>
                            <div className="pt-2">
                                <Link href="/" className="inline-block text-xs font-semibold text-accent-text hover:underline">
                                    Kembali ke Beranda &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* PENDING State Elements: (3) Total Transfer, (4) Countdown, (5) Payment Card, (6) 3 Steps, (7) Action/Cancel, (8) WhatsApp */}
                {status === 'PENDING' && (
                    <div className="space-y-5">
                        {/* (3) Kartu Total Transfer (Paling Menonjol) */}
                        <TotalHighlight
                            totalAmount={order.total_amount}
                            uniqueCode={order.unique_code}
                        />

                        {/* (4) Countdown dengan progress bar waktu 4px */}
                        <CountdownTimer
                            expiresAt={order.payment_expires_at}
                            serverNow={serverNow}
                            onExpire={handleCountdownExpire}
                        />

                        {/* (5) Instruksi Pembayaran: QRIS (kotak putih maks 280px) atau Rekening */}
                        <div className="bg-surface border border-border rounded-lg p-4 sm:p-5 space-y-4">
                            <div className="flex items-center gap-2 pb-3 border-b border-border">
                                {order.payment_method.logo_url ? (
                                    <div className="logo-plate h-6 px-1.5 shrink-0">
                                        <img src={order.payment_method.logo_url} alt="" className="h-4 max-w-[48px] object-contain" />
                                    </div>
                                ) : (
                                    <>
                                        {order.payment_method.type === 'QRIS' && <QrCode className="w-4 h-4 text-accent-text" />}
                                        {order.payment_method.type === 'BANK' && <Building2 className="w-4 h-4 text-info" />}
                                        {order.payment_method.type === 'EWALLET' && <Wallet className="w-4 h-4 text-warning" />}
                                    </>
                                )}
                                <h3 className="text-sm font-bold text-text">
                                    Tujuan Pembayaran: {order.payment_method.label}
                                </h3>
                            </div>

                            {/* QRIS Image if available: max 280px in white box */}
                            {order.payment_method.type === 'QRIS' && order.payment_method.qris_image_path && (
                                <div className="flex flex-col items-center justify-center p-4 bg-surface-2 rounded-lg border border-border space-y-3">
                                    <div className="p-3 qris-box rounded-lg border border-border max-w-[280px] w-full mx-auto shadow-2xs">
                                        <img
                                            src={order.payment_method.qris_image_path}
                                            alt="QRIS Pembayaran"
                                            className="w-full h-auto object-contain aspect-square mx-auto"
                                        />
                                    </div>
                                    <p className="text-xs text-text-2 text-center max-w-xs">
                                        Pindai QRIS di atas memakai aplikasi BCA, Mandiri, GoPay, OVO, Dana, ShopeePay, atau mobile banking kamu.
                                    </p>
                                </div>
                            )}

                            {/* Bank / E-Wallet Account Info */}
                            {order.payment_method.account_number && (
                                <div className="space-y-2.5">
                                    <div className="bg-surface-2 p-3.5 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div>
                                            <div className="text-[11px] text-text-2 font-medium mb-0.5">
                                                Nomor Rekening / E-Wallet
                                            </div>
                                            <div className="font-mono text-base font-bold text-text select-all">
                                                {order.payment_method.account_number}
                                            </div>
                                            {order.payment_method.account_holder && (
                                                <div className="text-xs text-text-2 mt-0.5">
                                                    a.n. {order.payment_method.account_holder}
                                                </div>
                                            )}
                                        </div>
                                        <div className="shrink-0">
                                            <CopyButton text={order.payment_method.account_number} label="Salin Nomor" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Instructions text if present */}
                            {order.payment_method.instructions && (
                                <div className="text-xs text-text-2 leading-relaxed bg-surface-2/60 p-3 rounded-md border border-border/60 whitespace-pre-line">
                                    {order.payment_method.instructions}
                                </div>
                            )}
                        </div>

                        {/* (6) Tiga Langkah Singkat Berangka */}
                        <div className="bg-surface border border-border rounded-lg p-4 sm:p-5 space-y-3">
                            <h4 className="text-xs font-bold text-text tracking-wider uppercase">
                                3 Langkah Pembayaran
                            </h4>
                            <ol className="space-y-2.5 text-xs text-text-2 list-none p-0 m-0">
                                <li className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-surface-2 border border-border-strong text-text font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                        1
                                    </span>
                                    <span className="leading-relaxed">
                                        Transfer sesuai nominal tepat sampai 3 digit terakhir.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-surface-2 border border-border-strong text-text font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                        2
                                    </span>
                                    <span className="leading-relaxed">
                                        Unggah bukti transfer (opsional) di kolom bawah.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-surface-2 border border-border-strong text-text font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                        3
                                    </span>
                                    <span className="leading-relaxed">
                                        Tekan tombol <strong className="text-text font-semibold">Saya Sudah Bayar</strong>.
                                    </span>
                                </li>
                            </ol>
                        </div>

                        {/* (7) Tombol Aksi + Batalkan Pesanan */}
                        <div className="bg-surface border border-border rounded-lg p-4 sm:p-5 space-y-4">
                            <div className="pb-3 border-b border-border">
                                <h3 className="text-sm font-bold text-text">Konfirmasi Pembayaran</h3>
                                <p className="text-xs text-text-2 mt-0.5">
                                    Setelah mentransfer, unggah bukti bayar (opsional) lalu klik tombol konfirmasi di bawah.
                                </p>
                            </div>

                            {/* Error inline */}
                            {confirmError && (
                                <div className="p-3 rounded-md bg-danger/10 border border-danger/30 text-xs text-danger flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{confirmError}</span>
                                </div>
                            )}

                            {/* Upload Area */}
                            <div>
                                <label
                                    htmlFor="proof-upload"
                                    className="block text-xs font-medium text-text-2 mb-2"
                                >
                                    Bukti Transfer <span className="text-text-muted">(JPG, PNG, WEBP, maks 3MB)</span>
                                </label>

                                <div className="border border-dashed border-border-strong rounded-lg p-4 text-center bg-surface-2 hover:bg-surface-hover transition-colors cursor-pointer relative">
                                    <input
                                        id="proof-upload"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                    {proofPreview ? (
                                        <div className="space-y-2">
                                            <img
                                                src={proofPreview}
                                                alt="Preview Bukti"
                                                className="max-h-40 mx-auto rounded border border-border object-contain"
                                            />
                                            <p className="text-xs text-accent-text font-medium">
                                                {proofFile?.name} (klik untuk mengganti)
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                                            <UploadCloud className="w-6 h-6 text-text-muted" />
                                            <span className="text-xs text-text font-medium">
                                                Pilih file foto atau tangkapan layar transfer
                                            </span>
                                            <span className="text-[11px] text-text-2">
                                                Maksimal 3MB
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="primary"
                                size="lg"
                                disabled={isConfirming || isCancelling}
                                loading={isConfirming}
                                onClick={handleConfirmPayment}
                                className="w-full h-11 text-sm font-semibold"
                            >
                                Saya Sudah Bayar
                            </Button>

                            {/* Batalkan Pesanan (DESIGN_SYSTEM 6.3) */}
                            {isAuthorized && (
                                <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
                                    <DialogTrigger asChild>
                                        <button
                                            type="button"
                                            disabled={isConfirming || isCancelling}
                                            className="w-full h-9 rounded-md border border-danger/40 bg-surface text-danger hover:bg-danger/10 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-danger"
                                        >
                                            <XCircle className="w-3.5 h-3.5" />
                                            <span>Batalkan Pesanan</span>
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md bg-surface border-border text-text">
                                        <DialogHeader>
                                            <DialogTitle className="text-base font-semibold text-text">
                                                Batalkan Pesanan?
                                            </DialogTitle>
                                            <DialogDescription className="text-xs text-text-2">
                                                Batalkan pesanan ini? Kuota dan akun akan dilepas.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter className="flex sm:justify-end gap-2 pt-2">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setIsCancelModalOpen(false)}
                                                disabled={isCancelling}
                                            >
                                                Kembali
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                loading={isCancelling}
                                                disabled={isCancelling}
                                                onClick={handleCancelOrder}
                                            >
                                                Ya, Batalkan
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </div>
                )}

                {/* Order Summary & Customer Info Card */}
                <div className="bg-surface border border-border rounded-lg p-4 sm:p-5 space-y-3.5">
                    <div className="pb-3 border-b border-border flex items-center justify-between">
                        <h3 className="text-sm font-bold text-text">Rincian Pesanan</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-text-2">#{order.invoice_code}</span>
                            <CopyButton text={order.invoice_code} label="Salin Kode" />
                        </div>
                    </div>

                    <div className="space-y-2 text-xs text-text-2">
                        <div className="flex justify-between items-center">
                            <span>Layanan</span>
                            <span className="font-semibold text-text">{order.product.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Paket</span>
                            <span className="font-semibold text-text">{order.variant.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Tipe Pesanan</span>
                            <span className="font-semibold text-text">
                                {order.order_type === 'RENT' ? 'Sewa Harian' : 'Beli Akun'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Nomor WhatsApp</span>
                            <span className="font-mono font-medium text-text">{order.customer_phone}</span>
                        </div>
                        {order.customer_note && (
                            <div className="flex justify-between items-start gap-4">
                                <span className="shrink-0">Catatan</span>
                                <span className="text-text text-right">{order.customer_note}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <span>Waktu Pemesanan</span>
                            <span className="font-mono text-text">
                                {formatDateTimeWIB(order.created_at)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Harga Paket</span>
                            <span className="font-mono text-text tabular-nums">
                                {formatRupiah(order.base_price)}
                            </span>
                        </div>
                        {order.unique_code > 0 && (
                            <div className="flex justify-between items-center">
                                <span>Kode Unik</span>
                                <span className="font-mono text-accent-text tabular-nums">
                                    +{order.unique_code}
                                </span>
                            </div>
                        )}
                        <div className="pt-2 border-t border-border flex justify-between items-baseline">
                            <span className="text-sm font-semibold text-text">Total Pembayaran</span>
                            <span className="font-mono text-base font-bold text-accent-text tabular-nums">
                                {formatRupiah(order.total_amount)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* (8) Tautan Hubungi Admin via WhatsApp (Ghost) - disembunyikan bila admin_whatsapp kosong */}
                {cleanAdminPhone && (
                    <div className="pt-2 flex justify-center">
                        <a
                            href={`https://wa.me/${cleanAdminPhone}?text=${encodeURIComponent(`Halo Admin ${storeName}, saya butuh bantuan untuk pesanan #${order.invoice_code}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-semibold text-text-2 hover:text-text py-2 px-3 rounded-md hover:bg-surface-2 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                            <PhoneCall className="w-3.5 h-3.5 text-accent-text" />
                            <span>Hubungi Admin via WhatsApp</span>
                        </a>
                    </div>
                )}
            </div>

            {/* Floating Copy Toast (DESIGN_SYSTEM 6.37 & 6.39) */}
            {showCopyToast && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-text text-surface text-xs font-semibold rounded-md shadow-lg pointer-events-none transition-opacity duration-150"
                >
                    Tersalin
                </div>
            )}
        </PublicLayout>
    );
}
