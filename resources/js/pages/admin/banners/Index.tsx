import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/admin/PageHeader';
import { 
    Image as ImageIcon, 
    Plus, 
    Edit2, 
    Trash2, 
    AlertCircle, 
    Clock, 
    CheckCircle2, 
    XCircle,
    ExternalLink
} from 'lucide-react';

interface BannerItem {
    id: number;
    title: string;
    subtitle?: string | null;
    cta_label?: string | null;
    cta_url?: string | null;
    image_path?: string | null;
    tone: 'neutral' | 'accent' | 'warning';
    is_active: boolean;
    sort_order: number;
    starts_at?: string | null;
    ends_at?: string | null;
    is_scheduled: boolean;
    is_currently_running: boolean;
}

interface IndexProps {
    banners: BannerItem[];
    activeCount: number;
    maxActive: number;
}

export default function BannerIndex({ banners, activeCount, maxActive }: IndexProps) {
    const [deleteModalBanner, setDeleteModalBanner] = useState<BannerItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        if (!deleteModalBanner) return;
        setIsDeleting(true);
        router.delete(`/admin/banners/${deleteModalBanner.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalBanner(null);
            },
        });
    };

    const getToneBadge = (tone: string) => {
        switch (tone) {
            case 'accent':
                return (
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-accent/15 text-accent-text border border-accent/30">
                        Aksen
                    </span>
                );
            case 'warning':
                return (
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-warning/15 text-warning border border-warning/30">
                        Peringatan
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface-2 text-text-2 border border-border">
                        Netral
                    </span>
                );
        }
    };

    return (
        <AdminLayout>
            <Head title="Manajemen Banner - Admin" />

            <div className="space-y-6">
                <PageHeader
                    title="Banner Slider Toko"
                    description={`Kelola pengumuman & promo di atas bar kuota beranda. Maksimal ${maxActive} banner aktif.`}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-text-2 px-2.5 py-1.5 rounded-md bg-surface border border-border">
                            Aktif: <strong className="text-text font-mono">{activeCount}</strong> / {maxActive}
                        </span>

                        <Link
                            href="/admin/banners/create"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-accent text-on-accent hover:bg-accent-hover transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Banner</span>
                        </Link>
                    </div>
                </PageHeader>

                {/* Table or Empty State */}
                {banners.length === 0 ? (
                    <div className="bg-surface border border-border rounded-lg p-10 text-center space-y-3">
                        <ImageIcon className="w-10 h-10 text-text-3 mx-auto stroke-[1.5]" />
                        <h3 className="text-sm font-semibold text-text">Belum Ada Banner</h3>
                        <p className="text-xs text-text-2 max-w-sm mx-auto">
                            Toko saat ini menampilkan pita intro standar di atas bar kuota. Tambahkan banner untuk menampilkan pengumuman atau promo.
                        </p>
                        <Link
                            href="/admin/banners/create"
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-semibold bg-accent text-on-accent hover:bg-accent-hover transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Buat Banner Pertama</span>
                        </Link>
                    </div>
                ) : (
                    <div className="bg-surface border border-border rounded-lg overflow-hidden">
                        {/* Table for Desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-border bg-surface-2 text-text-2 font-semibold">
                                        <th className="py-2.5 px-3 w-12 text-center">Urutan</th>
                                        <th className="py-2.5 px-3">Pratinjau & Konten</th>
                                        <th className="py-2.5 px-3 w-28">Tone</th>
                                        <th className="py-2.5 px-3 w-36">Jadwal & Status</th>
                                        <th className="py-2.5 px-3 w-24 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {banners.map((b) => (
                                        <tr key={b.id} className="hover:bg-surface-hover/50 transition-colors">
                                            <td className="py-3 px-3 text-center font-mono text-text-2">
                                                {b.sort_order}
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="flex items-start gap-3">
                                                    {b.image_path ? (
                                                        <img
                                                            src={b.image_path}
                                                            alt={b.title}
                                                            className="w-16 h-10 rounded border border-border object-cover shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-10 rounded border border-border bg-surface-2 flex items-center justify-center shrink-0 text-text-3 font-mono text-[10px]">
                                                            Teks
                                                        </div>
                                                    )}
                                                    <div className="space-y-0.5 min-w-0">
                                                        <div className="font-semibold text-text truncate max-w-md">
                                                            {b.title}
                                                        </div>
                                                        {b.subtitle && (
                                                            <div className="text-[11px] text-text-2 line-clamp-1 max-w-md">
                                                                {b.subtitle}
                                                            </div>
                                                        )}
                                                        {b.cta_label && b.cta_url && (
                                                            <div className="text-[10px] text-accent-text flex items-center gap-1 font-mono">
                                                                <span>[{b.cta_label}] &rarr; {b.cta_url}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                {getToneBadge(b.tone)}
                                            </td>
                                            <td className="py-3 px-3 space-y-1">
                                                <div>
                                                    {b.is_currently_running ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent-text">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>Tayang Publik</span>
                                                        </span>
                                                    ) : b.is_active ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>Di Luar Jadwal</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-3">
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            <span>Nonaktif</span>
                                                        </span>
                                                    )}
                                                </div>
                                                {b.is_scheduled && (
                                                    <div className="text-[10px] text-text-3 font-mono">
                                                        {b.starts_at && <div>Mulai: {new Date(b.starts_at).toLocaleDateString('id-ID')}</div>}
                                                        {b.ends_at && <div>Selesai: {new Date(b.ends_at).toLocaleDateString('id-ID')}</div>}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link
                                                        href={`/admin/banners/${b.id}/edit`}
                                                        className="p-1.5 rounded bg-surface border border-border hover:bg-surface-hover text-text-2 hover:text-text transition-colors"
                                                        title="Edit Banner"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteModalBanner(b)}
                                                        className="p-1.5 rounded bg-surface border border-border hover:bg-danger/10 hover:border-danger/30 text-text-2 hover:text-danger transition-colors cursor-pointer"
                                                        title="Hapus Banner"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Cards for Mobile (< 768px) */}
                        <div className="md:hidden divide-y divide-border">
                            {banners.map((b) => (
                                <div key={b.id} className="p-3.5 space-y-2.5">
                                    <div className="flex items-start gap-3">
                                        {b.image_path ? (
                                            <img
                                                src={b.image_path}
                                                alt={b.title}
                                                className="w-16 h-10 rounded border border-border object-cover shrink-0"
                                            />
                                        ) : (
                                            <div className="w-16 h-10 rounded border border-border bg-surface-2 flex items-center justify-center shrink-0 text-text-3 font-mono text-[10px]">
                                                Teks
                                            </div>
                                        )}
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="font-semibold text-xs text-text truncate">{b.title}</h3>
                                                <span className="font-mono text-text-3 text-[10px]">#{b.sort_order}</span>
                                            </div>
                                            {b.subtitle && (
                                                <p className="text-[11px] text-text-2 line-clamp-1">{b.subtitle}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                                        <div>{getToneBadge(b.tone)}</div>
                                        <div>
                                            {b.is_currently_running ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent-text">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    <span>Tayang</span>
                                                </span>
                                            ) : b.is_active ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-warning">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Luar Jadwal</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] text-text-3">
                                                    <XCircle className="w-3 h-3" />
                                                    <span>Nonaktif</span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Link
                                                href={`/admin/banners/${b.id}/edit`}
                                                className="p-1 rounded bg-surface-2 border border-border text-text-2 hover:text-text"
                                                title="Edit Banner"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteModalBanner(b)}
                                                className="p-1 rounded bg-surface-2 border border-border text-danger hover:bg-danger/10 cursor-pointer"
                                                title="Hapus Banner"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Konfirmasi Hapus */}
            {deleteModalBanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-xs">
                    <div className="bg-surface border border-border rounded-lg max-w-sm w-full p-5 space-y-4 shadow-xl">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded bg-danger/10 border border-danger/30 text-danger shrink-0">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-text">Hapus Banner?</h3>
                                <p className="text-xs text-text-2 mt-1">
                                    Banner &ldquo;<strong>{deleteModalBanner.title}</strong>&rdquo; akan dihapus permanen dari sistem.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeleteModalBanner(null)}
                                className="h-8 px-3 rounded text-xs font-semibold bg-surface-2 border border-border hover:bg-surface-hover text-text transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={handleDelete}
                                className="h-8 px-3 rounded text-xs font-semibold bg-danger-solid text-on-danger hover:bg-danger-solid-hover transition-colors"
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
