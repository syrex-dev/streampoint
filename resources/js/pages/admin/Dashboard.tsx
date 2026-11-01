import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    XCircle, 
    Hourglass, 
    ArrowRight, 
    ExternalLink,
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

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            <div className="space-y-6">
                {/* Page Title */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-text">Dashboard Penjualan</h1>
                        <p className="text-xs text-text-2">Ringkasan transaksi hari ini dan kuota sewa aktif.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/admin/orders"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 hover:bg-surface-hover text-text text-xs font-medium rounded border border-border transition-colors"
                        >
                            <FileText className="w-3.5 h-3.5 text-text-2" />
                            <span>Semua Order</span>
                        </Link>
                    </div>
                </div>

                {/* Quota & Today Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Rental Quota Card */}
                    <div className="col-span-2 sm:col-span-1 p-3.5 bg-surface border border-border rounded-md flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs text-text-2 mb-2">
                            <span className="font-medium">Slot Sewa Hari Ini</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                quota.is_full ? 'bg-danger/10 text-danger border border-danger/30' : 'bg-surface-2 text-text-2'
                            }`}>
                                {quota.is_full ? 'Penuh' : `${quota.remaining} Tersisa`}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-2xl font-bold font-mono tracking-tight text-text">
                                {quota.used}
                            </span>
                            <span className="text-xs text-text-2 font-mono">/ {quota.limit} slot</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-surface-2 h-1.5 rounded-full overflow-hidden border border-border">
                            <div 
                                className={`h-full transition-all ${quota.is_full ? 'bg-danger' : 'bg-accent'}`}
                                style={{ width: `${Math.min(100, (quota.used / Math.max(1, quota.limit)) * 100)}%` }}
                            />
                        </div>
                        <div className="mt-2 text-[10px] text-text-2">
                            Reset pukul 00:00 WIB
                        </div>
                    </div>

                    {/* Verifying Card */}
                    <div className={`p-3.5 bg-surface rounded-md border flex flex-col justify-between ${
                        todayCounts.verifying > 0 ? 'border-info/50 bg-info/5' : 'border-border'
                    }`}>
                        <div className="flex items-center justify-between text-xs text-text-2 mb-1">
                            <span className="font-medium">Perlu Verifikasi</span>
                            <Hourglass className="w-3.5 h-3.5 text-info" />
                        </div>
                        <div className="text-2xl font-bold font-mono text-text">
                            {todayCounts.verifying}
                        </div>
                        <div className="text-[11px] text-text-2">
                            {todayCounts.verifying > 0 ? 'Segera periksa bukti transfer' : 'Tidak ada antrean'}
                        </div>
                    </div>

                    {/* Paid Card */}
                    <div className="p-3.5 bg-surface border border-border rounded-md flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs text-text-2 mb-1">
                            <span className="font-medium">Lunas Hari Ini</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        </div>
                        <div className="text-2xl font-bold font-mono text-text">
                            {todayCounts.paid}
                        </div>
                        <div className="text-[11px] text-text-2">
                            Pesanan berhasil dikirim
                        </div>
                    </div>

                    {/* Pending & Total Card */}
                    <div className="p-3.5 bg-surface border border-border rounded-md flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs text-text-2 mb-1">
                            <span className="font-medium">Menunggu Bayar</span>
                            <Clock className="w-3.5 h-3.5 text-warning" />
                        </div>
                        <div className="text-2xl font-bold font-mono text-text">
                            {todayCounts.pending}
                        </div>
                        <div className="text-[11px] text-text-2">
                            Total {todayCounts.total} pesanan hari ini
                        </div>
                    </div>
                </div>

                {/* Additional status breakdown pill strip */}
                <div className="flex flex-wrap items-center gap-2 p-2.5 bg-surface border border-border rounded-md text-xs">
                    <span className="text-text-2 font-medium">Status hari ini:</span>
                    <span className="px-2 py-0.5 rounded bg-surface-2 text-text font-mono">
                        Menunggu: {todayCounts.pending}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-info/10 text-info font-mono font-medium">
                        Verifikasi: {todayCounts.verifying}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-success/10 text-success font-mono font-medium">
                        Lunas: {todayCounts.paid}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-2 text-text-2 font-mono">
                        Kedaluwarsa: {todayCounts.expired}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-danger/10 text-danger font-mono">
                        Dibatalkan: {todayCounts.cancelled}
                    </span>
                </div>

                {/* Section: Orders Waiting for Verification (Prioritized) */}
                <div className="bg-surface border border-border rounded-md overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface-2/30">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                                Pesanan Menunggu Verifikasi
                            </h2>
                            <span className="px-1.5 py-0.2 bg-info/20 text-info border border-info/30 rounded text-[11px] font-mono font-bold">
                                {verifyingOrders.length}
                            </span>
                        </div>
                        <span className="text-[11px] text-text-2">Prioritas Utama</span>
                    </div>

                    {verifyingOrders.length === 0 ? (
                        <div className="p-8 text-center text-xs text-text-2">
                            Tidak ada pesanan menunggu verifikasi saat ini.
                        </div>
                    ) : (
                        <div>
                            {/* Desktop View Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-border bg-surface-2/50 text-text-2 uppercase text-[10px] tracking-wider">
                                            <th className="py-2.5 px-4">Invoice</th>
                                            <th className="py-2.5 px-4">Layanan / Paket</th>
                                            <th className="py-2.5 px-4">WhatsApp</th>
                                            <th className="py-2.5 px-4">Total</th>
                                            <th className="py-2.5 px-4">Bukti</th>
                                            <th className="py-2.5 px-4">Waktu</th>
                                            <th className="py-2.5 px-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {verifyingOrders.map((order) => (
                                            <tr 
                                                key={order.id} 
                                                className="hover:bg-surface-hover border-l-2 border-l-info transition-colors"
                                            >
                                                <td className="py-3 px-4 font-mono font-semibold text-text">
                                                    <Link 
                                                        href={`/admin/orders/${order.id}`}
                                                        className="hover:text-accent-text"
                                                    >
                                                        {order.invoice_code}
                                                    </Link>
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
                                                        <a
                                                            href={`/admin/orders/${order.id}/proof`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-[11px] text-accent-text hover:underline"
                                                        >
                                                            <ImageIcon className="w-3 h-3" />
                                                            <span>Lihat Bukti</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-[11px] text-text-2">Tanpa Bukti</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-text-2 text-[11px]">
                                                    {order.created_at_human}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <Link
                                                        href={`/admin/orders/${order.id}`}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent text-on-accent hover:bg-accent-hover text-xs font-semibold rounded transition-colors"
                                                    >
                                                        <span>Proses</span>
                                                        <ArrowRight className="w-3 h-3" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View Cards */}
                            <div className="md:hidden divide-y divide-border">
                                {verifyingOrders.map((order) => (
                                    <div 
                                        key={order.id} 
                                        className="p-3.5 space-y-2 border-l-2 border-l-info bg-surface hover:bg-surface-hover"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-bold text-xs text-text">
                                                {order.invoice_code}
                                            </span>
                                            <span className="text-[10px] text-text-2 font-mono">
                                                {order.created_at_human}
                                            </span>
                                        </div>

                                        <div className="text-xs">
                                            <div className="font-medium text-text">{order.product_name}</div>
                                            <div className="text-text-2 text-[11px]">{order.variant_name} ({order.order_type})</div>
                                        </div>

                                        <div className="flex items-center justify-between pt-1 text-xs">
                                            <div className="font-mono font-bold text-text">
                                                {formatRupiah(order.total_amount)}
                                            </div>
                                            <div className="font-mono text-text-2 text-[11px]">
                                                {order.customer_phone}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                            <div>
                                                {order.has_proof ? (
                                                    <a
                                                        href={`/admin/orders/${order.id}/proof`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] text-accent-text hover:underline"
                                                    >
                                                        <ImageIcon className="w-3 h-3" />
                                                        <span>Bukti Bayar</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-[11px] text-text-2">Tanpa Bukti</span>
                                                )}
                                            </div>
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-accent text-on-accent text-xs font-semibold rounded hover:bg-accent-hover transition-colors"
                                            >
                                                <span>Buka Detail</span>
                                                <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
