import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { 
    Clock, 
    CheckCircle2, 
    Hourglass, 
    ArrowRight, 
    FileText,
    Image as ImageIcon
} from 'lucide-react';

interface VerifyingOrder {
    id: number;
    invoice_code: string;
    product_name: string;
    variant_name: string;
    order_type: string;
    customer_phone: string;
    total_amount: number;
    has_proof: boolean;
    created_at: string;
    created_at_human: string;
}

interface DashboardProps {
    todayCounts: {
        pending: number;
        verifying: number;
        paid: number;
        expired: number;
        cancelled: number;
        total: number;
    };
    quota: {
        limit: number;
        used: number;
        remaining: number;
        is_full: boolean;
        resets_at: string;
    };
    verifyingOrders: VerifyingOrder[];
}

export default function Dashboard({ todayCounts, quota, verifyingOrders }: DashboardProps) {
    const formatRupiah = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);
    };

    const isWaitingLong = (createdAtStr: string) => {
        const diffMs = Date.now() - new Date(createdAtStr).getTime();
        return diffMs >= 30 * 60 * 1000;
    };

    return (
        <AdminLayout>
            <Head title="Dashboard - Admin" />

            <div className="space-y-6">
                <PageHeader
                    title="Dashboard"
                    description="Ringkasan operasional toko, kuota sewa harian, dan antrean verifikasi."
                >
                    <Link
                        href="/admin/orders"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 hover:bg-surface-hover text-text text-xs font-medium rounded-md border border-border transition-colors cursor-pointer"
                    >
                        <FileText className="w-3.5 h-3.5 text-text-2" />
                        <span>Semua Pesanan</span>
                    </Link>
                </PageHeader>

                {/* Quota & Today Summary Cards (4 Kolom Desktop, 2 Kolom Mobile) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Kartu Kuota Sewa */}
                    <StatCard
                        label="Slot Sewa Hari Ini"
                        badge={
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                quota.is_full ? 'bg-danger/10 text-danger border border-danger/30' : 'bg-surface-2 text-text-2'
                            }`}>
                                {quota.is_full ? 'Penuh' : `${quota.remaining} Tersisa`}
                            </span>
                        }
                    >
                        <div>
                            <div className="text-xl sm:text-2xl font-bold font-sans tracking-tight tabular-nums text-text leading-tight">
                                Terpakai {quota.used} dari {quota.limit}
                            </div>
                            <div className="w-full bg-surface-2 h-1.5 rounded-full overflow-hidden border border-border mt-2.5">
                                <div 
                                    className={`h-full transition-all ${quota.is_full ? 'bg-danger' : 'bg-accent'}`}
                                    style={{ width: `${Math.min(100, (quota.used / Math.max(1, quota.limit)) * 100)}%` }}
                                />
                            </div>
                            <div className="text-xs text-text-2 mt-2">
                                Reset otomatis pukul 00:00 WIB
                            </div>
                        </div>
                    </StatCard>

                    {/* Kartu Menunggu Bayar */}
                    <StatCard
                        label="Menunggu Bayar"
                        value={todayCounts.pending}
                        description="Belum dibayar, kedaluwarsa dalam 15 menit"
                        icon={Clock}
                    />

                    {/* Kartu Perlu Verifikasi */}
                    <StatCard
                        label="Perlu Verifikasi"
                        value={todayCounts.verifying}
                        description={todayCounts.verifying > 0 ? "Segera periksa mutasi rekening" : "Tidak ada antrean saat ini"}
                        icon={Hourglass}
                        isInfo={todayCounts.verifying > 0}
                    />

                    {/* Kartu Selesai / Lunas */}
                    <StatCard
                        label="Lunas Hari Ini"
                        value={todayCounts.paid}
                        description="Pesanan terverifikasi dan aktif"
                        icon={CheckCircle2}
                    />
                </div>

                {/* Status Sekunder (Hanya memuat status yang tidak ada di kartu) */}
                <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 bg-surface border border-border rounded-lg text-xs text-text-2">
                    <span className="font-medium text-text-2">Status lainnya hari ini:</span>
                    <span className="flex items-center gap-1.5">
                        <span>Kedaluwarsa:</span>
                        <strong className="font-sans font-semibold tabular-nums text-text">{todayCounts.expired}</strong>
                    </span>
                    <span className="text-border">•</span>
                    <span className="flex items-center gap-1.5">
                        <span>Dibatalkan:</span>
                        <strong className="font-sans font-semibold tabular-nums text-text">{todayCounts.cancelled}</strong>
                    </span>
                </div>

                {/* Seksi: Pesanan Menunggu Verifikasi (Prioritas) */}
                <div className="bg-surface border border-border rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface-2/30">
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-text">
                                Pesanan Menunggu Verifikasi
                            </h2>
                            {verifyingOrders.length > 0 && (
                                <span className="px-1.5 py-0.5 bg-info/15 text-info border border-info/30 rounded-full text-[11px] font-mono font-bold">
                                    {verifyingOrders.length}
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-text-2 font-medium">Prioritas Tindakan</span>
                    </div>

                    {verifyingOrders.length === 0 ? (
                        <div className="p-8 text-center text-xs text-text-2">
                            Tidak ada pesanan menunggu verifikasi saat ini.
                        </div>
                    ) : (
                        <div>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-border bg-surface-2/50 text-text-2 uppercase text-[10px] tracking-wider font-semibold">
                                            <th className="py-2.5 px-4">Invoice</th>
                                            <th className="py-2.5 px-4">Layanan / Paket</th>
                                            <th className="py-2.5 px-4">WhatsApp</th>
                                            <th className="py-2.5 px-4">Total</th>
                                            <th className="py-2.5 px-4">Bukti</th>
                                            <th className="py-2.5 px-4">Waktu Tunggu</th>
                                            <th className="py-2.5 px-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {verifyingOrders.map((order) => {
                                            const waitingLong = isWaitingLong(order.created_at);
                                            return (
                                                <tr 
                                                    key={order.id} 
                                                    onClick={() => router.visit(`/admin/orders/${order.id}`)}
                                                    className="hover:bg-surface-hover border-l-2 border-l-info transition-colors cursor-pointer group"
                                                >
                                                    <td className="py-3 px-4 font-mono font-semibold text-text group-hover:text-accent-text">
                                                        {order.invoice_code}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="font-medium text-text">{order.product_name}</div>
                                                        <div className="text-[11px] text-text-2">{order.variant_name} ({order.order_type})</div>
                                                    </td>
                                                    <td className="py-3 px-4 font-mono text-text-2">
                                                        {order.customer_phone}
                                                    </td>
                                                    <td className="py-3 px-4 font-mono font-semibold text-text">
                                                        {formatRupiah(order.total_amount)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {order.has_proof ? (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent-text">
                                                                <ImageIcon className="w-3.5 h-3.5" />
                                                                <span>Ada bukti</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] text-text-2">Tanpa bukti</span>
                                                        )}
                                                    </td>
                                                    <td className={`py-3 px-4 text-[11px] ${waitingLong ? 'text-warning font-semibold' : 'text-text-2'}`}>
                                                        {order.created_at_human}
                                                        {waitingLong && (
                                                            <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-warning/15 text-warning border border-warning/30 font-medium">
                                                                ≥ 30 mnt
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                        <Link
                                                            href={`/admin/orders/${order.id}`}
                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-accent text-on-accent text-xs font-semibold rounded hover:bg-accent-hover transition-colors"
                                                        >
                                                            <span>Periksa</span>
                                                            <ArrowRight className="w-3 h-3" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card List (< 768px) */}
                            <div className="md:hidden divide-y divide-border">
                                {verifyingOrders.map((order) => {
                                    const waitingLong = isWaitingLong(order.created_at);
                                    return (
                                        <div
                                            key={order.id}
                                            onClick={() => router.visit(`/admin/orders/${order.id}`)}
                                            className="p-3.5 space-y-2 bg-surface hover:bg-surface-hover border-l-2 border-l-info transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono font-bold text-xs text-text">
                                                    {order.invoice_code}
                                                </span>
                                                <span className="font-mono font-bold text-xs text-text">
                                                    {formatRupiah(order.total_amount)}
                                                </span>
                                            </div>

                                            <div className="text-xs">
                                                <div className="font-medium text-text">{order.product_name}</div>
                                                <div className="text-[11px] text-text-2">{order.variant_name} ({order.order_type})</div>
                                            </div>

                                            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                                                <span className="font-mono text-text-2 text-[11px]">
                                                    {order.customer_phone}
                                                </span>
                                                {order.has_proof ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent-text">
                                                        <ImageIcon className="w-3 h-3" />
                                                        <span>Ada bukti</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-text-2">Tanpa bukti</span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-1 text-xs">
                                                <span className={`text-[11px] ${waitingLong ? 'text-warning font-semibold' : 'text-text-2'}`}>
                                                    {order.created_at_human} {waitingLong && '(≥ 30 mnt)'}
                                                </span>
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-accent text-on-accent text-xs font-semibold rounded hover:bg-accent-hover transition-colors"
                                                >
                                                    <span>Periksa</span>
                                                    <ArrowRight className="w-3 h-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
