import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/admin/PageHeader';
import { 
    Search, 
    Filter, 
    ChevronLeft, 
    ChevronRight, 
    Image as ImageIcon,
    ArrowRight,
    X
} from 'lucide-react';

interface OrderItem {
    id: number;
    invoice_code: string;
    product?: { name: string } | null;
    variant?: { name: string; type: string } | null;
    order_type: string;
    customer_phone: string;
    total_amount: number;
    status: string;
    payment_proof_path: string | null;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface OrdersIndexProps {
    orders: {
        data: OrderItem[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        status: string;
        q: string;
    };
    statuses: { value: string; label: string }[];
}

export default function OrdersIndex({ orders, filters, statuses }: OrdersIndexProps) {
    const [search, setSearch] = useState(filters.q || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/orders', {
            q: search,
            status: selectedStatus,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleStatusFilter = (statusVal: string) => {
        setSelectedStatus(statusVal);
        router.get('/admin/orders', {
            q: search,
            status: statusVal,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleClearFilters = () => {
        setSearch('');
        setSelectedStatus('');
        router.get('/admin/orders', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const formatRupiah = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-warning/10 text-warning border border-warning/30">
                        Menunggu Bayar
                    </span>
                );
            case 'VERIFYING':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-info/10 text-info border border-info/30">
                        Diverifikasi
                    </span>
                );
            case 'PAID':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-accent/10 text-accent-text border border-accent/35">
                        Lunas
                    </span>
                );
            case 'EXPIRED':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-2 text-text-2 border border-border">
                        Kedaluwarsa
                    </span>
                );
            case 'CANCELLED':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-danger/10 text-danger border border-danger/30">
                        Dibatalkan
                    </span>
                );
            default:
                return <span>{status}</span>;
        }
    };

    return (
        <AdminLayout>
            <Head title="Kelola Order - Admin" />

            <div className="space-y-4">
                <PageHeader
                    title="Daftar Pesanan"
                    description={`Total ${orders.total} pesanan tercatat. Pesanan menunggu verifikasi diprioritaskan di atas.`}
                />

                {/* Filters & Search */}
                <div className="bg-surface border border-border rounded-md p-3 space-y-3">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-text-2 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari kode invoice (INV-...) atau nomor WhatsApp..."
                                className="w-full h-9 pl-9 pr-8 text-xs bg-surface-2 border border-border rounded text-text placeholder:text-text-2 focus:outline-none focus:border-accent"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        router.get('/admin/orders', { status: selectedStatus });
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-2 hover:text-text"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="px-3.5 py-2 bg-surface-2 hover:bg-surface-hover text-text text-xs font-semibold rounded border border-border transition-colors cursor-pointer"
                        >
                            Cari
                        </button>
                    </form>

                    {/* Status Tabs/Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/60">
                        <span className="text-[11px] text-text-2 mr-1">Status:</span>
                        <button
                            type="button"
                            onClick={() => handleStatusFilter('')}
                            className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                                selectedStatus === ''
                                    ? 'bg-surface-2 text-text font-semibold border border-border-strong'
                                    : 'text-text-2 hover:text-text hover:bg-surface-hover'
                            }`}
                        >
                            Semua
                        </button>
                        {statuses.map((s) => (
                            <button
                                key={s.value}
                                type="button"
                                onClick={() => handleStatusFilter(s.value)}
                                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                                    selectedStatus === s.value
                                        ? 'bg-surface-2 text-text font-semibold border border-border-strong'
                                        : 'text-text-2 hover:text-text hover:bg-surface-hover'
                                }`}
                            >
                                {s.label}
                            </button>
                        ))}

                        {(search || selectedStatus) && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="ml-auto text-[11px] text-text-2 hover:text-danger underline"
                            >
                                Reset Filter
                            </button>
                        )}
                    </div>
                </div>

                {/* Orders Content */}
                <div className="bg-surface border border-border rounded-md overflow-hidden">
                    {orders.data.length === 0 ? (
                        <div className="p-12 text-center text-xs text-text-2 space-y-2">
                            <p>Tidak ada pesanan yang sesuai dengan filter pencarian.</p>
                            {(search || selectedStatus) && (
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="px-3 py-1.5 text-xs bg-surface-2 text-text rounded border border-border hover:bg-surface-hover cursor-pointer"
                                >
                                    Tampilkan Semua Pesanan
                                </button>
                            )}
                        </div>
                    ) : (
                        <div>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-border bg-surface-2/40 text-text-2 uppercase text-[10px] tracking-wider">
                                            <th className="py-2.5 px-3">Invoice</th>
                                            <th className="py-2.5 px-3">Layanan</th>
                                            <th className="py-2.5 px-3">WhatsApp</th>
                                            <th className="py-2.5 px-3">Total</th>
                                            <th className="py-2.5 px-3">Status</th>
                                            <th className="py-2.5 px-3">Bukti</th>
                                            <th className="py-2.5 px-3">Tanggal</th>
                                            <th className="py-2.5 px-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {orders.data.map((order) => {
                                            const isVerifying = order.status === 'VERIFYING';
                                            return (
                                                <tr
                                                    key={order.id}
                                                    className={`hover:bg-surface-hover transition-colors ${
                                                        isVerifying ? 'border-l-2 border-l-info bg-info/5' : ''
                                                    }`}
                                                >
                                                    <td className="py-3 px-3 font-mono font-semibold text-text">
                                                        <Link
                                                            href={`/admin/orders/${order.id}`}
                                                            className="hover:text-accent-text"
                                                        >
                                                            {order.invoice_code}
                                                        </Link>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <div className="font-medium text-text">
                                                            {order.product?.name ?? '-'}
                                                        </div>
                                                        <div className="text-[11px] text-text-2">
                                                            {order.variant?.name ?? '-'} ({order.order_type})
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 font-mono text-text-2">
                                                        {order.customer_phone}
                                                    </td>
                                                    <td className="py-3 px-3 font-mono font-semibold text-text">
                                                        {formatRupiah(order.total_amount)}
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        {renderStatusBadge(order.status)}
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        {order.payment_proof_path ? (
                                                            <a
                                                                href={`/admin/orders/${order.id}/proof`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-[11px] text-accent-text hover:underline"
                                                            >
                                                                <ImageIcon className="w-3 h-3" />
                                                                <span>Lihat</span>
                                                            </a>
                                                        ) : (
                                                            <span className="text-[11px] text-text-2">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 text-[11px] text-text-2">
                                                        {formatDate(order.created_at)}
                                                    </td>
                                                    <td className="py-3 px-3 text-right">
                                                        <Link
                                                            href={`/admin/orders/${order.id}`}
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded transition-colors ${
                                                                isVerifying
                                                                    ? 'bg-accent text-on-accent font-semibold hover:bg-accent-hover'
                                                                    : 'bg-surface-2 text-text border border-border hover:bg-surface-hover'
                                                            }`}
                                                        >
                                                            <span>Detail</span>
                                                            <ArrowRight className="w-3 h-3" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards View */}
                            <div className="md:hidden divide-y divide-border">
                                {orders.data.map((order) => {
                                    const isVerifying = order.status === 'VERIFYING';
                                    return (
                                        <div
                                            key={order.id}
                                            className={`p-3.5 space-y-2 bg-surface hover:bg-surface-hover ${
                                                isVerifying ? 'border-l-2 border-l-info bg-info/5' : ''
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono font-bold text-xs text-text">
                                                    {order.invoice_code}
                                                </span>
                                                {renderStatusBadge(order.status)}
                                            </div>

                                            <div className="text-xs">
                                                <div className="font-medium text-text">
                                                    {order.product?.name ?? '-'}
                                                </div>
                                                <div className="text-[11px] text-text-2">
                                                    {order.variant?.name ?? '-'} ({order.order_type})
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-xs pt-1">
                                                <span className="font-mono font-bold text-text">
                                                    {formatRupiah(order.total_amount)}
                                                </span>
                                                <span className="font-mono text-text-2 text-[11px]">
                                                    {order.customer_phone}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                                                <span className="text-[10px] text-text-2">
                                                    {formatDate(order.created_at)}
                                                </span>
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded transition-colors ${
                                                        isVerifying
                                                            ? 'bg-accent text-on-accent font-semibold hover:bg-accent-hover'
                                                            : 'bg-surface-2 text-text border border-border hover:bg-surface-hover'
                                                    }`}
                                                >
                                                    <span>Lihat Detail</span>
                                                    <ArrowRight className="w-3 h-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {orders.last_page > 1 && (
                                <div className="px-4 py-3 border-t border-border bg-surface-2/30 flex items-center justify-between text-xs">
                                    <div className="text-text-2">
                                        Halaman <span className="font-semibold text-text">{orders.current_page}</span> dari{' '}
                                        <span className="font-semibold text-text">{orders.last_page}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {orders.links.map((link, idx) => {
                                            const isPrev = idx === 0 || link.label.toLowerCase().includes('prev') || link.label.includes('&laquo;') || link.label.includes('pagination.previous');
                                            const isNext = idx === orders.links.length - 1 || link.label.toLowerCase().includes('next') || link.label.includes('&raquo;') || link.label.includes('pagination.next');

                                            if (isPrev) {
                                                return link.url ? (
                                                    <Link
                                                        key={idx}
                                                        href={link.url}
                                                        preserveScroll
                                                        className="p-1.5 px-2 rounded bg-surface border border-border text-text hover:bg-surface-hover inline-flex items-center gap-1 text-xs font-medium transition-colors"
                                                        title="Halaman Sebelumnya"
                                                        aria-label="Sebelumnya"
                                                    >
                                                        <ChevronLeft className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">Prev</span>
                                                    </Link>
                                                ) : (
                                                    <span
                                                        key={idx}
                                                        className="p-1.5 px-2 rounded bg-surface-2 border border-border text-text-3 opacity-40 select-none inline-flex items-center gap-1 text-xs cursor-not-allowed"
                                                        aria-disabled="true"
                                                    >
                                                        <ChevronLeft className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">Prev</span>
                                                    </span>
                                                );
                                            }

                                            if (isNext) {
                                                return link.url ? (
                                                    <Link
                                                        key={idx}
                                                        href={link.url}
                                                        preserveScroll
                                                        className="p-1.5 px-2 rounded bg-surface border border-border text-text hover:bg-surface-hover inline-flex items-center gap-1 text-xs font-medium transition-colors"
                                                        title="Halaman Selanjutnya"
                                                        aria-label="Selanjutnya"
                                                    >
                                                        <span className="hidden sm:inline">Next</span>
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    </Link>
                                                ) : (
                                                    <span
                                                        key={idx}
                                                        className="p-1.5 px-2 rounded bg-surface-2 border border-border text-text-3 opacity-40 select-none inline-flex items-center gap-1 text-xs cursor-not-allowed"
                                                        aria-disabled="true"
                                                    >
                                                        <span className="hidden sm:inline">Next</span>
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    </span>
                                                );
                                            }

                                            return link.url ? (
                                                <Link
                                                    key={idx}
                                                    href={link.url}
                                                    preserveScroll
                                                    className={`min-w-7 h-7 px-2 flex items-center justify-center rounded text-xs transition-colors font-medium ${
                                                        link.active
                                                            ? 'bg-accent text-on-accent font-semibold'
                                                            : 'bg-surface border border-border text-text hover:bg-surface-hover'
                                                    }`}
                                                >
                                                    {link.label}
                                                </Link>
                                            ) : (
                                                <span
                                                    key={idx}
                                                    className="min-w-7 h-7 px-1 flex items-center justify-center rounded text-xs text-text-3 opacity-50 select-none"
                                                >
                                                    {link.label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
