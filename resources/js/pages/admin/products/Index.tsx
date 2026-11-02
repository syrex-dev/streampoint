import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { 
    Package, 
    Plus, 
    Edit2, 
    Trash2, 
    AlertCircle, 
    Layers, 
    KeyRound, 
    ShoppingBag, 
    ExternalLink 
} from 'lucide-react';

interface ProductItem {
    id: number;
    name: string;
    slug: string;
    category: string;
    thumbnail_path: string | null;
    is_active: boolean;
    sort_order: number;
    variants_count: number;
    accounts_count: number;
    orders_count: number;
    has_orders: boolean;
}

interface IndexProps {
    products: ProductItem[];
}

export default function ProductsIndex({ products }: IndexProps) {
    const [deleteModalProduct, setDeleteModalProduct] = useState<ProductItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        if (!deleteModalProduct) return;
        setIsDeleting(true);
        router.delete(`/admin/products/${deleteModalProduct.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalProduct(null);
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Kelola Produk - Admin" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
                            <Package className="w-5 h-5 text-accent-text" />
                            <span>Kelola Produk & Layanan</span>
                        </h1>
                        <p className="text-xs text-text-2 mt-0.5">
                            Daftar semua layanan langganan streaming, paket varian, dan aturan garansi.
                        </p>
                    </div>

                    <Link
                        href="/admin/products/create"
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded transition-colors self-start sm:self-auto cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Produk Baru</span>
                    </Link>
                </div>

                {/* Products List */}
                {products.length === 0 ? (
                    <div className="bg-surface border border-border rounded-lg p-10 text-center space-y-3">
                        <Package className="w-10 h-10 text-text-3 mx-auto opacity-50" />
                        <h3 className="text-sm font-semibold text-text">Belum ada produk</h3>
                        <p className="text-xs text-text-2 max-w-sm mx-auto">
                            Mulai dengan menambahkan produk pertama Anda untuk mulai menjual paket langganan.
                        </p>
                        <Link
                            href="/admin/products/create"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Produk</span>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-surface border border-border rounded-lg overflow-hidden">
                        {/* Table for Desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-surface-2 border-b border-border text-text-2 uppercase text-[10px] tracking-wider font-semibold">
                                    <tr>
                                        <th className="px-4 py-3">Produk</th>
                                        <th className="px-4 py-3">Kategori</th>
                                        <th className="px-4 py-3 text-center">Urutan</th>
                                        <th className="px-4 py-3 text-center">Varian</th>
                                        <th className="px-4 py-3 text-center">Stok Unit</th>
                                        <th className="px-4 py-3 text-center">Total Order</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {products.map((p) => (
                                        <tr key={p.id} className="hover:bg-surface-hover/60 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded bg-surface-2 border border-border flex items-center justify-center shrink-0 overflow-hidden font-bold text-xs text-text">
                                                        {p.thumbnail_path ? (
                                                            <img
                                                                src={p.thumbnail_path}
                                                                alt={p.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span>{p.name.substring(0, 2).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-text flex items-center gap-1.5">
                                                            <span>{p.name}</span>
                                                            <Link
                                                                href={`/p/${p.slug}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-text-3 hover:text-accent-text"
                                                                title="Buka halaman etalase publik"
                                                            >
                                                                <ExternalLink className="w-3 h-3" />
                                                            </Link>
                                                        </div>
                                                        <div className="text-[11px] text-text-3 font-mono">
                                                            /{p.slug}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-text-2">
                                                <span className="px-2 py-0.5 rounded bg-surface-2 border border-border text-[11px]">
                                                    {p.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-mono text-text-2">
                                                {p.sort_order}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center gap-1 font-mono text-text">
                                                    <Layers className="w-3 h-3 text-text-3" />
                                                    {p.variants_count}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center gap-1 font-mono text-text">
                                                    <KeyRound className="w-3 h-3 text-text-3" />
                                                    {p.accounts_count}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center gap-1 font-mono text-text">
                                                    <ShoppingBag className="w-3 h-3 text-text-3" />
                                                    {p.orders_count}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {p.is_active ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success/15 text-success border border-success/30">
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-2 text-text-3 border border-border">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={`/admin/products/${p.id}/edit`}
                                                        className="p-1.5 rounded hover:bg-surface-2 text-text-2 hover:text-text transition-colors"
                                                        title="Edit Produk & Varian"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </Link>

                                                    {p.has_orders ? (
                                                        <button
                                                            type="button"
                                                            disabled
                                                            className="p-1.5 rounded text-text-3 opacity-40 cursor-not-allowed"
                                                            title="Tidak dapat dihapus karena sudah memiliki riwayat pesanan. Anda hanya dapat menonaktifkannya."
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteModalProduct(p)}
                                                            className="p-1.5 rounded hover:bg-danger/10 text-danger hover:text-danger transition-colors cursor-pointer"
                                                            title="Hapus Produk"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Cards for Mobile (375px friendly) */}
                        <div className="md:hidden divide-y divide-border">
                            {products.map((p) => (
                                <div key={p.id} className="p-3.5 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded bg-surface-2 border border-border flex items-center justify-center shrink-0 overflow-hidden font-bold text-xs text-text">
                                                {p.thumbnail_path ? (
                                                    <img
                                                        src={p.thumbnail_path}
                                                        alt={p.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span>{p.name.substring(0, 2).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-xs text-text flex items-center gap-1.5">
                                                    <span>{p.name}</span>
                                                    <Link
                                                        href={`/p/${p.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-text-3 hover:text-accent-text"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                </div>
                                                <div className="text-[11px] text-text-3 font-mono">
                                                    /{p.slug}
                                                </div>
                                            </div>
                                        </div>

                                        {p.is_active ? (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/15 text-success border border-success/30">
                                                Aktif
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-2 text-text-3 border border-border">
                                                Nonaktif
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-text-2 bg-surface-2/60 p-2 rounded border border-border/50">
                                        <div>
                                            <span className="text-[10px] text-text-3 block uppercase">Kategori</span>
                                            <span className="font-medium text-text">{p.category}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[10px] text-text-3 block uppercase">Varian</span>
                                            <span className="font-mono text-text">{p.variants_count}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[10px] text-text-3 block uppercase">Stok</span>
                                            <span className="font-mono text-text">{p.accounts_count}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-text-3 block uppercase">Order</span>
                                            <span className="font-mono text-text">{p.orders_count}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <div className="text-[11px] text-text-3">
                                            Urutan: <span className="font-mono text-text-2">{p.sort_order}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/admin/products/${p.id}/edit`}
                                                className="px-2.5 py-1 text-xs font-semibold bg-surface-2 hover:bg-surface-hover text-text border border-border rounded flex items-center gap-1"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                                <span>Edit</span>
                                            </Link>

                                            {p.has_orders ? (
                                                <span 
                                                    className="text-[11px] text-text-3 italic cursor-help"
                                                    title="Sudah ada pesanan, tidak bisa dihapus."
                                                >
                                                    Terkunci (Ada order)
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteModalProduct(p)}
                                                    className="px-2.5 py-1 text-xs font-semibold text-danger border border-danger/40 hover:bg-danger/10 rounded flex items-center gap-1"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    <span>Hapus</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Konfirmasi Hapus Produk */}
            {deleteModalProduct && (
                <div 
                    className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4"
                    onClick={() => setDeleteModalProduct(null)}
                >
                    <div 
                        className="w-full max-w-sm bg-surface border border-border-strong rounded-md p-5 shadow-xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-sm font-bold text-danger flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            <span>Hapus Produk</span>
                        </h3>
                        <p className="text-xs text-text-2">
                            Apakah Anda yakin ingin menghapus produk <strong className="text-text font-semibold">{deleteModalProduct.name}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                            <button
                                type="button"
                                onClick={() => setDeleteModalProduct(null)}
                                className="px-3 py-1.5 text-xs text-text-2 hover:text-text rounded cursor-pointer"
                                disabled={isDeleting}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-1.5 bg-danger text-white text-xs font-semibold rounded hover:bg-danger/90 transition-colors cursor-pointer"
                            >
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
