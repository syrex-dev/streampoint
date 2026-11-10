import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Star, Search, Eye, EyeOff, Trash2, CheckCircle2, AlertCircle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface ReviewAdminItem {
    id: number;
    rating: number;
    comment: string | null;
    customer_phone: string;
    customer_name: string;
    is_visible: boolean;
    created_at: string;
    product: {
        id: number;
        name: string;
        slug: string;
    };
    variant_name?: string | null;
    order: {
        invoice_code: string;
    };
}

interface AdminReviewsIndexProps {
    reviews: {
        data: ReviewAdminItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    products: Array<{ id: number; name: string }>;
    filters: {
        product_id: string;
        rating: string;
        search: string;
    };
}

export default function AdminReviewsIndex({
    reviews,
    products,
    filters,
}: AdminReviewsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [productId, setProductId] = useState(filters.product_id || '');
    const [ratingFilter, setRatingFilter] = useState(filters.rating || '');

    const handleFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/admin/reviews',
            {
                search: search || undefined,
                product_id: productId || undefined,
                rating: ratingFilter || undefined,
            },
            { preserveState: true }
        );
    };

    const handleToggleVisibility = (id: number) => {
        router.patch(`/admin/reviews/${id}/visibility`, {}, { preserveScroll: true });
    };

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus ulasan ini secara permanen?')) {
            router.delete(`/admin/reviews/${id}`, { preserveScroll: true });
        }
    };

    return (
        <AdminLayout title="Moderasi Ulasan Pembeli">
            <Head title="Moderasi Ulasan Pembeli - Admin" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight">
                            Moderasi Ulasan Pembeli
                        </h1>
                        <p className="text-xs sm:text-sm text-text-2 mt-0.5">
                            Kelola dan pantau ulasan otentik dari pembeli yang telah menyelesaikan transaksi
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface border border-border text-text">
                            Total {reviews.total} Ulasan
                        </span>
                    </div>
                </div>

                {/* Filters */}
                <form
                    onSubmit={handleFilter}
                    className="p-4 rounded-xl bg-surface border border-border grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                >
                    <div className="sm:col-span-5 relative">
                        <Search className="w-4 h-4 text-text-2 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                            type="text"
                            placeholder="Cari kode invoice, no WhatsApp, ulasan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9 text-xs"
                        />
                    </div>

                    <div className="sm:col-span-3">
                        <select
                            value={productId}
                            onChange={(e) => {
                                setProductId(e.target.value);
                            }}
                            className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-md text-text outline-none focus:border-accent"
                        >
                            <option value="">Semua Layanan</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:col-span-2">
                        <select
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value)}
                            className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-md text-text outline-none focus:border-accent"
                        >
                            <option value="">Semua Bintang</option>
                            <option value="5">5 Bintang</option>
                            <option value="4">4 Bintang</option>
                            <option value="3">3 Bintang</option>
                            <option value="2">2 Bintang</option>
                            <option value="1">1 Bintang</option>
                        </select>
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-2">
                        <Button type="submit" variant="primary" size="sm" className="w-full text-xs h-9">
                            Filter
                        </Button>
                    </div>
                </form>

                {/* Review Table / Cards */}
                {reviews.data.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl bg-surface border border-border space-y-2">
                        <AlertCircle className="w-8 h-8 text-text-2 mx-auto" />
                        <h3 className="text-sm font-bold text-text">Belum Ada Ulasan</h3>
                        <p className="text-xs text-text-2">
                            Tidak ada ulasan pembeli yang sesuai dengan filter yang dipilih.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reviews.data.map((item) => (
                            <div
                                key={item.id}
                                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                                    item.is_visible
                                        ? 'bg-surface border-border'
                                        : 'bg-surface/50 border-danger/30 opacity-75'
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        {/* Product & Variant */}
                                        <div className="flex items-center gap-2 flex-wrap text-xs">
                                            <span className="font-bold text-text text-sm">
                                                {item.product.name}
                                            </span>
                                            {item.variant_name && (
                                                <span className="px-2 py-0.5 rounded bg-surface-2 text-text-2 border border-border text-[11px]">
                                                    {item.variant_name}
                                                </span>
                                            )}
                                            <Link
                                                href={`/admin/orders`}
                                                className="font-mono text-[11px] text-accent-text hover:underline"
                                            >
                                                #{item.order.invoice_code}
                                            </Link>
                                        </div>

                                        {/* Customer & Rating */}
                                        <div className="flex items-center gap-3 text-xs text-text-2 flex-wrap">
                                            <span className="font-mono">{item.customer_phone}</span>
                                            <span>•</span>
                                            <div className="flex items-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star
                                                        key={s}
                                                        className={`w-3.5 h-3.5 ${
                                                            item.rating >= s
                                                                ? 'fill-amber-400 text-amber-400'
                                                                : 'text-border fill-transparent'
                                                        }`}
                                                    />
                                                ))}
                                                <span className="font-bold text-text ml-1 text-xs">
                                                    {item.rating}/5
                                                </span>
                                            </div>
                                            <span>•</span>
                                            <span>{item.created_at}</span>
                                        </div>

                                        {/* Comment text */}
                                        {item.comment ? (
                                            <p className="text-xs sm:text-sm text-text bg-surface-2/60 p-3 rounded-xl border border-border mt-2 leading-relaxed">
                                                "{item.comment}"
                                            </p>
                                        ) : (
                                            <p className="text-xs text-text-2 italic mt-1">
                                                (Tanpa ulasan teks, hanya bintang penilaian)
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 shrink-0 pt-1">
                                        <Button
                                            type="button"
                                            variant={item.is_visible ? 'secondary' : 'primary'}
                                            size="sm"
                                            onClick={() => handleToggleVisibility(item.id)}
                                            className="text-xs h-8 cursor-pointer"
                                            title={item.is_visible ? 'Sembunyikan dari publik' : 'Tampilkan ke publik'}
                                        >
                                            {item.is_visible ? (
                                                <>
                                                    <EyeOff className="w-3.5 h-3.5 mr-1" />
                                                    <span>Sembunyikan</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Eye className="w-3.5 h-3.5 mr-1" />
                                                    <span>Tampilkan</span>
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDelete(item.id)}
                                            className="text-xs h-8 cursor-pointer"
                                            title="Hapus permanen"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {reviews.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pt-4">
                        {reviews.links.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                preserveScroll
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                                    link.active
                                        ? 'bg-accent text-on-accent'
                                        : link.url
                                        ? 'bg-surface text-text hover:bg-surface-hover border border-border'
                                        : 'text-text-muted pointer-events-none'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
