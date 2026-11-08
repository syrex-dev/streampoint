import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/admin/PageHeader';
import { FormSection } from '@/components/admin/FormSection';
import { Switch } from '@/components/ui/switch';
import { 
    Package, 
    ArrowLeft, 
    Upload, 
    Check, 
    AlertCircle, 
    Layers, 
    Plus, 
    Edit2, 
    Trash2, 
    X,
    ExternalLink,
    AlertTriangle
} from 'lucide-react';

interface VariantItem {
    id: number;
    name: string;
    type: 'RENT' | 'BUY';
    rent_duration?: string | null;
    duration_hours: number;
    price: number;
    is_active: boolean;
    sort_order: number;
    orders_count: number;
    has_orders: boolean;
}

interface ProductDetail {
    id: number;
    name: string;
    slug: string;
    category: string;
    thumbnail_path: string | null;
    cover_path?: string | null;
    has_warranty?: boolean;
    brand_color?: string | null;
    description?: string | null;
    rules?: string | null;
    is_active: boolean;
    sort_order: number;
    has_orders: boolean;
}

interface EditProps {
    product: ProductDetail;
    variants: VariantItem[];
}

export default function ProductEdit({ product, variants }: EditProps) {
    // Product form state
    const { data, setData, post, processing, errors } = useForm<{
        _method: string;
        name: string;
        slug: string;
        category: string;
        description: string;
        rules: string;
        is_active: boolean;
        sort_order: number;
        brand_color: string;
        has_warranty: boolean;
        thumbnail: File | null;
        cover: File | null;
    }>({
        _method: 'put',
        name: product.name,
        slug: product.slug,
        category: product.category,
        description: product.description || '',
        rules: product.rules || '',
        is_active: product.is_active,
        sort_order: product.sort_order,
        brand_color: product.brand_color || '',
        has_warranty: Boolean(product.has_warranty),
        thumbnail: null,
        cover: null,
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(product.thumbnail_path);
    const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(product.cover_path || null);

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('cover', file);
            setCoverPreviewUrl(URL.createObjectURL(file));
        }
    };

    // Variant modal states
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState<VariantItem | null>(null);
    const [variantForm, setVariantForm] = useState<{
        name: string;
        type: 'RENT' | 'BUY';
        rent_duration: string;
        duration_hours: number;
        price: number;
        is_active: boolean;
        sort_order: number;
    }>({
        name: '',
        type: 'RENT',
        rent_duration: 'ONE_DAY',
        duration_hours: 24,
        price: 15000,
        is_active: true,
        sort_order: 0,
    });
    const [variantError, setVariantError] = useState<string | null>(null);
    const [isVariantSubmitting, setIsVariantSubmitting] = useState(false);

    // Delete variant confirmation modal
    const [deleteModalVariant, setDeleteModalVariant] = useState<VariantItem | null>(null);
    const [isDeletingVariant, setIsDeletingVariant] = useState(false);

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('thumbnail', file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleProductSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/products/${product.id}`);
    };

    const openAddVariant = () => {
        setEditingVariant(null);
        setVariantForm({
            name: '',
            type: 'RENT',
            rent_duration: 'ONE_DAY',
            duration_hours: 24,
            price: 15000,
            is_active: true,
            sort_order: variants.length,
        });
        setVariantError(null);
        setIsVariantModalOpen(true);
    };

    const openEditVariant = (v: VariantItem) => {
        setEditingVariant(v);
        setVariantForm({
            name: v.name,
            type: v.type,
            rent_duration: v.rent_duration || 'ONE_DAY',
            duration_hours: v.duration_hours,
            price: v.price,
            is_active: v.is_active,
            sort_order: v.sort_order,
        });
        setVariantError(null);
        setIsVariantModalOpen(true);
    };

    const handleVariantTypeChange = (newType: 'RENT' | 'BUY') => {
        if (newType === 'RENT') {
            setVariantForm((prev) => ({
                ...prev,
                type: 'RENT',
                rent_duration: 'ONE_DAY',
                duration_hours: 24,
            }));
        } else {
            setVariantForm((prev) => ({
                ...prev,
                type: 'BUY',
                rent_duration: '',
                duration_hours: 720,
            }));
        }
    };

    const handleRentDurationChange = (duration: string) => {
        const hours = duration === 'HALF_DAY' ? 12
            : duration === 'ONE_DAY' ? 24
            : duration === 'TWO_DAYS' ? 48
            : duration === 'THREE_DAYS' ? 72
            : 24;

        setVariantForm((prev) => ({
            ...prev,
            rent_duration: duration,
            duration_hours: hours,
        }));
    };

    const handleVariantSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setVariantError(null);

        // Client-side quick check
        if (!variantForm.name.trim()) {
            setVariantError('Nama varian paket wajib diisi.');
            return;
        }
        if (variantForm.price <= 0) {
            setVariantError('Harga paket harus lebih besar dari 0.');
            return;
        }
        if (variantForm.type === 'RENT' && !variantForm.rent_duration) {
            setVariantError('Durasi sewa wajib dipilih.');
            return;
        }
        if (variantForm.type === 'BUY' && variantForm.duration_hours % 720 !== 0) {
            setVariantError('Durasi tipe Beli harus kelipatan 720 jam (30 hari).');
            return;
        }

        setIsVariantSubmitting(true);

        const payload = {
            name: variantForm.name.trim(),
            type: variantForm.type,
            rent_duration: variantForm.type === 'RENT' ? variantForm.rent_duration : null,
            duration_hours: variantForm.duration_hours,
            price: variantForm.price,
            is_active: variantForm.is_active,
            sort_order: variantForm.sort_order,
        };

        if (editingVariant) {
            router.put(`/admin/products/${product.id}/variants/${editingVariant.id}`, payload, {
                onSuccess: () => setIsVariantModalOpen(false),
                onError: (errs) => setVariantError(Object.values(errs)[0] as string),
                onFinish: () => setIsVariantSubmitting(false),
            });
        } else {
            router.post(`/admin/products/${product.id}/variants`, payload, {
                onSuccess: () => setIsVariantModalOpen(false),
                onError: (errs) => setVariantError(Object.values(errs)[0] as string),
                onFinish: () => setIsVariantSubmitting(false),
            });
        }
    };

    const handleDeleteVariant = () => {
        if (!deleteModalVariant) return;
        setIsDeletingVariant(true);
        router.delete(`/admin/products/${product.id}/variants/${deleteModalVariant.id}`, {
            onFinish: () => {
                setIsDeletingVariant(false);
                setDeleteModalVariant(null);
            },
        });
    };

    const formatRupiah = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(val);
    };

    return (
        <AdminLayout>
            <Head title={`Edit Produk ${product.name} - Admin`} />

            <div className="space-y-8">
                <PageHeader
                    title={`Edit: ${product.name}`}
                    description={`/${product.slug} • Kategori: ${product.category}`}
                >
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/p/${product.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 hover:bg-surface-hover text-text text-xs font-medium rounded-md border border-border transition-colors"
                        >
                            <ExternalLink className="w-3.5 h-3.5 text-text-2" />
                            <span>Lihat di Toko</span>
                        </Link>
                        <Link
                            href="/admin/products"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 hover:bg-surface-hover text-text text-xs font-medium rounded-md border border-border transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Kembali</span>
                        </Link>
                    </div>
                </PageHeader>

                {/* Banner if Product Has Orders */}
                {product.has_orders && (
                    <div className="p-3.5 bg-surface-2 border border-border rounded-lg text-xs text-text-2 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold text-text block">
                                Produk Memiliki Riwayat Pesanan
                            </span>
                            Produk ini sudah memiliki order yang tercatat di sistem sehingga tidak dapat dihapus demi integritas data keuangan dan invoice. Untuk menghentikan penjualan, Anda dapat menonaktifkan status publikasi.
                        </div>
                    </div>
                )}

                {/* Product Detail Form & Live Preview Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form Card (2 cols) */}
                    <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-5 space-y-5 h-fit">
                        <h2 className="text-sm font-bold text-text flex items-center gap-2 pb-2 border-b border-border">
                            <Package className="w-4 h-4 text-accent-text" />
                            <span>Informasi Utama Produk</span>
                        </h2>

                        <form onSubmit={handleProductSubmit} className="space-y-4">
                            {/* Name & Slug */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text block">
                                        Nama Produk <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                    />
                                    {errors.name && <p className="text-[11px] text-danger">{errors.name}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text block">
                                        Slug URL <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        required
                                        className="w-full h-9 px-3 text-xs font-mono bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                    />
                                    {errors.slug && <p className="text-[11px] text-danger">{errors.slug}</p>}
                                </div>
                            </div>

                            {/* Category & Sort Order */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text block">
                                        Kategori <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        required
                                        className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                    />
                                    {errors.category && <p className="text-[11px] text-danger">{errors.category}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text block">
                                        Urutan Tampilan
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={data.sort_order}
                                        onChange={(e) => setData('sort_order', Number(e.target.value))}
                                        className="w-full h-9 px-3 text-xs font-mono bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                    />
                                    {errors.sort_order && <p className="text-[11px] text-danger">{errors.sort_order}</p>}
                                </div>
                            </div>

                            {/* Thumbnail / Logo */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-text block">
                                    Logo / Ikon Produk (Maks 2MB)
                                </label>
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0 overflow-hidden font-mono text-xs"
                                        style={
                                            /^#[0-9A-Fa-f]{6}$/.test(data.brand_color)
                                                ? {
                                                      backgroundColor: `color-mix(in srgb, ${data.brand_color} 14%, var(--surface))`,
                                                      borderColor: `color-mix(in srgb, ${data.brand_color} 30%, var(--border))`,
                                                      borderWidth: '1px',
                                                      borderStyle: 'solid',
                                                  }
                                                : {
                                                      backgroundColor: 'var(--surface-2)',
                                                      borderColor: 'var(--border)',
                                                      borderWidth: '1px',
                                                      borderStyle: 'solid',
                                                  }
                                        }
                                    >
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Thumbnail" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <span className="font-semibold text-base text-text-2">
                                                {data.name.trim() ? data.name.trim().slice(0, 2).toUpperCase() : <Upload className="w-5 h-5 text-text-3" />}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={handleThumbnailChange}
                                            className="block w-full text-xs text-text-2 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-border file:text-xs file:font-semibold file:bg-surface-2 file:text-text hover:file:bg-surface-hover cursor-pointer"
                                        />
                                        <span className="text-[11px] text-text-3 block mt-1">
                                            Dikonversi ke WebP otomatis (maks 256px).
                                        </span>
                                    </div>
                                </div>
                                {errors.thumbnail && <p className="text-[11px] text-danger">{errors.thumbnail}</p>}
                            </div>

                            {/* Sampul Layanan (Cover Image) */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-text block">
                                    Gambar Sampul Layanan (Rasio 16:10, Maks 2MB - Opsional)
                                </label>
                                <div className="flex items-start gap-4">
                                    <div className="w-24 aspect-[16/10] rounded border border-border overflow-hidden bg-surface-2 shrink-0 flex items-center justify-center">
                                        {coverPreviewUrl ? (
                                            <img src={coverPreviewUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] text-text-3 font-mono">16:10</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={handleCoverChange}
                                            className="block w-full text-xs text-text-2 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-border file:text-xs file:font-semibold file:bg-surface-2 file:text-text hover:file:bg-surface-hover cursor-pointer"
                                        />
                                        <span className="text-[11px] text-text-3 block mt-1">
                                            Bila kosong, kartu etalase otomatis menampilkan latar tint warna merek + logo produk.
                                        </span>
                                    </div>
                                </div>
                                {errors.cover && <p className="text-[11px] text-danger">{errors.cover}</p>}
                            </div>

                            {/* Brand Color (Warna Merek Layanan) */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-text block">
                                        Warna Merek Layanan (Hex #RRGGBB - Opsional)
                                    </label>
                                    {data.brand_color && (
                                        <button
                                            type="button"
                                            onClick={() => setData('brand_color', '')}
                                            className="text-[11px] text-danger hover:underline"
                                        >
                                            Kosongkan
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative w-9 h-9 rounded border border-border overflow-hidden shrink-0">
                                        <input
                                            type="color"
                                            value={/^#[0-9A-Fa-f]{6}$/.test(data.brand_color) ? data.brand_color : '#10B981'}
                                            onChange={(e) => setData('brand_color', e.target.value.toUpperCase())}
                                            className="absolute -inset-2 w-14 h-14 cursor-pointer"
                                            title="Pilih warna merek"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="#E50914"
                                        maxLength={7}
                                        value={data.brand_color}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            if (val && !val.startsWith('#')) val = '#' + val;
                                            setData('brand_color', val.toUpperCase());
                                        }}
                                        className="w-32 h-9 px-3 text-xs font-mono bg-surface-2 border border-border rounded text-text uppercase focus:outline-none focus:border-accent"
                                    />
                                    <span className="text-[11px] text-text-2">
                                        Digunakan sebagai tint kartu bila sampul tidak diunggah.
                                    </span>
                                </div>
                                {errors.brand_color && <p className="text-[11px] text-danger">{errors.brand_color}</p>}
                            </div>

                            {/* Garansi Layanan (has_warranty toggle) */}
                            <div className="pt-2 border-t border-border flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold text-text block">Garansi Layanan Aktif</span>
                                    <span className="text-[11px] text-text-3">
                                        Menampilkan chip dan badge Garansi pada kartu etalase serta detail produk.
                                    </span>
                                </div>
                                <Switch
                                    checked={data.has_warranty}
                                    onCheckedChange={(checked) => setData('has_warranty', checked)}
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-text block">
                                    Deskripsi Produk
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full p-2.5 text-xs bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent resize-none"
                                />
                                {errors.description && <p className="text-[11px] text-danger">{errors.description}</p>}
                            </div>

                            {/* Rules */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-text block">
                                    Aturan Layanan & Garansi
                                </label>
                                <textarea
                                    value={data.rules}
                                    onChange={(e) => setData('rules', e.target.value)}
                                    rows={4}
                                    className="w-full p-2.5 text-xs bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                />
                                {errors.rules && <p className="text-[11px] text-danger">{errors.rules}</p>}
                            </div>

                            {/* Status Aktif */}
                            <div className="pt-2 border-t border-border flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold text-text block">Status Publikasi</span>
                                    <span className="text-[11px] text-text-3">
                                        Jika nonaktif, produk tidak akan tampil pada etalase toko.
                                    </span>
                                </div>
                                <Switch
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', checked)}
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex items-center justify-end pt-3 border-t border-border">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>{processing ? 'Menyimpan...' : 'Perbarui Informasi Produk'}</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Live Card Preview (1 col) */}
                    <div className="space-y-3">
                        <div className="text-xs font-bold text-text-2 uppercase tracking-wider flex items-center justify-between">
                            <span>Pratinjau Kartu Etalase</span>
                            <span className="text-[10px] text-accent-text font-semibold">Live v3</span>
                        </div>

                        <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
                            {/* 1. Sampul 16:10 */}
                            <div className="aspect-[16/10] relative w-full overflow-hidden bg-surface-2 shrink-0">
                                {coverPreviewUrl ? (
                                    <img
                                        src={coverPreviewUrl}
                                        alt="Sampul"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div
                                        className="w-full h-full flex items-center justify-center brand-logo-box"
                                        style={
                                            /^#[0-9A-Fa-f]{6}$/.test(data.brand_color)
                                                ? ({ ['--brand' as any]: data.brand_color, backgroundColor: `color-mix(in srgb, ${data.brand_color} 14%, var(--surface))` } as React.CSSProperties)
                                                : { backgroundColor: 'var(--surface-2)' }
                                        }
                                    >
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="Logo"
                                                className="w-12 h-12 rounded-md object-contain p-1"
                                            />
                                        ) : (
                                            <span className="font-mono text-lg font-semibold text-text tracking-wider">
                                                {data.name.trim() ? data.name.trim().slice(0, 2).toUpperCase() : 'SP'}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Badges di atas sampul */}
                                <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                                    <span className="px-1.5 py-0.5 text-[11px] font-medium rounded border border-border bg-surface text-text shadow-sm">
                                        Baru
                                    </span>
                                </div>

                                <div className="absolute top-2 right-2 z-10">
                                    <span className="px-1.5 py-0.5 text-[11px] font-medium rounded border bg-surface text-accent-text border-accent/50 shadow-sm">
                                        Tersedia
                                    </span>
                                </div>
                            </div>

                            {/* 2. Badan kartu */}
                            <div className="p-3 space-y-2.5">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-6 h-6 rounded border flex items-center justify-center shrink-0 overflow-hidden"
                                            style={
                                                /^#[0-9A-Fa-f]{6}$/.test(data.brand_color)
                                                    ? { backgroundColor: `color-mix(in srgb, ${data.brand_color} 14%, var(--surface))`, borderColor: `color-mix(in srgb, ${data.brand_color} 30%, var(--border))` }
                                                    : { backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }
                                            }
                                        >
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="" className="w-full h-full object-contain p-0.5" />
                                            ) : (
                                                <span className="font-mono text-[10px] font-semibold text-text">
                                                    {data.name.trim() ? data.name.trim().slice(0, 1).toUpperCase() : 'S'}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-text-2 truncate">{data.category || 'Kategori'}</span>
                                    </div>

                                    <h3 className="text-sm font-semibold text-text line-clamp-2 leading-snug mt-1">
                                        {data.name || 'Nama Layanan Produk'}
                                    </h3>

                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-xs text-text-2">mulai</span>
                                        <span className="font-mono text-sm font-semibold tabular-nums text-text">
                                            {variants.length > 0 ? formatRupiah(Math.min(...variants.map(v => v.price))) : 'Rp 15.000'}
                                        </span>
                                    </div>
                                </div>

                                {/* Chips */}
                                <div className="pt-2 border-t border-border flex items-center justify-between gap-1 text-[11px]">
                                    <div className="flex items-center gap-1 flex-wrap">
                                        {variants.some(v => v.type === 'RENT') && (
                                            <span className="px-1.5 py-0.5 font-medium rounded border border-border bg-surface-2 text-text-2">
                                                Sewa
                                            </span>
                                        )}
                                        {variants.some(v => v.type === 'BUY') && (
                                            <span className="px-1.5 py-0.5 font-medium rounded border border-border bg-surface-2 text-text-2">
                                                Beli
                                            </span>
                                        )}
                                        {variants.length === 0 && (
                                            <>
                                                <span className="px-1.5 py-0.5 font-medium rounded border border-border bg-surface-2 text-text-2">
                                                    Sewa
                                                </span>
                                                <span className="px-1.5 py-0.5 font-medium rounded border border-border bg-surface-2 text-text-2">
                                                    Beli
                                                </span>
                                            </>
                                        )}
                                        {data.has_warranty && (
                                            <span className="px-1.5 py-0.5 font-medium rounded border border-accent/40 bg-accent/5 text-accent-text">
                                                Garansi
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-text-2 font-mono whitespace-nowrap">
                                        5 terjual
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p className="text-[11px] text-text-3 leading-relaxed">
                            Pratinjau otomatis memperbarui tampilan kartu saat Anda mengganti sampul, logo, warna merek, atau garansi.
                        </p>
                    </div>
                </div>

                {/* Variants Manager Section */}
                <div className="bg-surface border border-border rounded-lg p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                        <div>
                            <h2 className="text-sm font-bold text-text flex items-center gap-2">
                                <Layers className="w-4 h-4 text-accent-text" />
                                <span>Daftar Varian Paket ({variants.length})</span>
                            </h2>
                            <p className="text-xs text-text-2">
                                Atur paket sewa harian (RENT) atau beli durasi panjang (BUY) untuk produk ini.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={openAddVariant}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded transition-colors self-start sm:self-auto cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Varian</span>
                        </button>
                    </div>

                    {variants.length === 0 ? (
                        <div className="p-8 text-center bg-surface-2/40 border border-border/60 rounded-md space-y-2">
                            <Layers className="w-8 h-8 text-text-3 mx-auto opacity-50" />
                            <p className="text-xs text-text-2">
                                Belum ada varian paket untuk produk ini. Tambahkan minimal satu varian agar produk dapat dipesan oleh pembeli.
                            </p>
                            <button
                                type="button"
                                onClick={openAddVariant}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-surface-2 hover:bg-surface-hover text-text border border-border rounded text-xs font-semibold cursor-pointer"
                            >
                                <Plus className="w-3 h-3" />
                                <span>Tambah Varian Pertama</span>
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-surface-2 border-b border-border text-text-2 uppercase text-[10px] tracking-wider font-semibold">
                                    <tr>
                                        <th className="px-3 py-2.5">Nama Varian</th>
                                        <th className="px-3 py-2.5">Tipe</th>
                                        <th className="px-3 py-2.5">Durasi</th>
                                        <th className="px-3 py-2.5">Harga</th>
                                        <th className="px-3 py-2.5 text-center">Urutan</th>
                                        <th className="px-3 py-2.5 text-center">Order</th>
                                        <th className="px-3 py-2.5 text-center">Status</th>
                                        <th className="px-3 py-2.5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {variants.map((v) => (
                                        <tr key={v.id} className="hover:bg-surface-hover/60 transition-colors">
                                            <td className="px-3 py-2.5 font-semibold text-text">
                                                {v.name}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                                                    v.type === 'RENT' 
                                                        ? 'bg-info/15 text-info border border-info/30' 
                                                        : 'bg-accent/15 text-accent-text border border-accent/30'
                                                }`}>
                                                    {v.type}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-text-2">
                                                {v.type === 'RENT' ? (
                                                    <span>{v.rent_duration} ({v.duration_hours} Jam)</span>
                                                ) : (
                                                    <span>{v.duration_hours} Jam ({v.duration_hours / 720} Bulan)</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 font-mono font-semibold text-text">
                                                {formatRupiah(v.price)}
                                            </td>
                                            <td className="px-3 py-2.5 text-center font-mono text-text-2">
                                                {v.sort_order}
                                            </td>
                                            <td className="px-3 py-2.5 text-center font-mono text-text-2">
                                                {v.orders_count}
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                {v.is_active ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent/10 text-accent-text border border-accent/30">
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-2 text-text-muted border border-border">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditVariant(v)}
                                                        className="p-1 rounded hover:bg-surface-2 text-text-2 hover:text-text cursor-pointer"
                                                        title="Edit Varian"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>

                                                    {v.has_orders ? (
                                                        <button
                                                            type="button"
                                                            disabled
                                                            className="p-1 rounded text-text-3 opacity-40 cursor-not-allowed"
                                                            title="Varian sudah memiliki order, tidak dapat dihapus (hanya dinonaktifkan)."
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteModalVariant(v)}
                                                            className="p-1 rounded hover:bg-danger/10 text-danger cursor-pointer"
                                                            title="Hapus Varian"
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
                    )}
                </div>
            </div>

            {/* Modal Tambah / Edit Varian */}
            {isVariantModalOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4"
                    onClick={() => setIsVariantModalOpen(false)}
                >
                    <div 
                        className="w-full max-w-md bg-surface border border-border-strong rounded-md p-5 shadow-xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                            <h3 className="text-sm font-bold text-text flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-accent-text" />
                                <span>{editingVariant ? 'Edit Varian Paket' : 'Tambah Varian Paket'}</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsVariantModalOpen(false)}
                                className="p-1 text-text-2 hover:text-text"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {variantError && (
                            <div className="p-2.5 bg-danger/10 border border-danger/30 rounded text-xs text-danger flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{variantError}</span>
                            </div>
                        )}

                        <form onSubmit={handleVariantSubmit} className="space-y-3.5 text-xs">
                            {/* Type Selector (RENT vs BUY) */}
                            <div className="space-y-1.5">
                                <label className="font-semibold text-text block">
                                    Tipe Paket <span className="text-danger">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleVariantTypeChange('RENT')}
                                        className={`py-2 px-3 rounded text-center font-semibold transition-colors cursor-pointer border ${
                                            variantForm.type === 'RENT'
                                                ? 'bg-info/20 text-info border-info/50'
                                                : 'bg-surface-2 text-text-2 border-border hover:bg-surface-hover'
                                        }`}
                                    >
                                        RENT (Sewa Harian)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleVariantTypeChange('BUY')}
                                        className={`py-2 px-3 rounded text-center font-semibold transition-colors cursor-pointer border ${
                                            variantForm.type === 'BUY'
                                                ? 'bg-accent/20 text-accent-text border-accent/50'
                                                : 'bg-surface-2 text-text-2 border-border hover:bg-surface-hover'
                                        }`}
                                    >
                                        BUY (Beli / Langganan)
                                    </button>
                                </div>
                            </div>

                            {/* Variant Name */}
                            <div className="space-y-1.5">
                                <label className="font-semibold text-text block">
                                    Nama Varian Paket <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={variantForm.name}
                                    onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                                    placeholder={variantForm.type === 'RENT' ? 'Contoh: Sewa 1 Hari (24 Jam)' : 'Contoh: Private 1 Bulan'}
                                    required
                                    className="w-full h-9 px-3 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                />
                            </div>

                            {/* Duration Fields */}
                            {variantForm.type === 'RENT' ? (
                                <div className="space-y-1.5">
                                    <label className="font-semibold text-text block">
                                        Pilihan Durasi Sewa <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        value={variantForm.rent_duration}
                                        onChange={(e) => handleRentDurationChange(e.target.value)}
                                        className="w-full h-9 px-2.5 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                    >
                                        <option value="HALF_DAY">HALF_DAY (12 Jam)</option>
                                        <option value="ONE_DAY">ONE_DAY (24 Jam)</option>
                                        <option value="TWO_DAYS">TWO_DAYS (48 Jam)</option>
                                        <option value="THREE_DAYS">THREE_DAYS (72 Jam)</option>
                                    </select>
                                    <span className="text-[11px] text-text-3 block">
                                        Durasi otomatis diatur ke {variantForm.duration_hours} jam sesuai standar kuota sewa.
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="font-semibold text-text block">
                                        Durasi Jam (Kelipatan 720 Jam / 30 Hari) <span className="text-danger">*</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step={720}
                                            min={720}
                                            value={variantForm.duration_hours}
                                            onChange={(e) => setVariantForm({ ...variantForm, duration_hours: Number(e.target.value) })}
                                            required
                                            className="w-full h-9 px-3 font-mono bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                        />
                                        <span className="text-text-2 shrink-0 font-mono">
                                            = {variantForm.duration_hours / 720} Bulan
                                        </span>
                                    </div>
                                    <div className="flex gap-1.5 pt-1">
                                        {[1, 2, 3, 6, 12].map((months) => (
                                            <button
                                                key={months}
                                                type="button"
                                                onClick={() => setVariantForm({ ...variantForm, duration_hours: months * 720 })}
                                                className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                                                    variantForm.duration_hours === months * 720
                                                        ? 'bg-accent text-on-accent border-accent'
                                                        : 'bg-surface-2 text-text-2 border-border hover:bg-surface-hover'
                                                }`}
                                            >
                                                {months} Bln
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Price (Rupiah) & Sort Order */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="font-semibold text-text block">
                                        Harga (Rupiah) <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={100}
                                        value={variantForm.price}
                                        onChange={(e) => setVariantForm({ ...variantForm, price: Number(e.target.value) })}
                                        required
                                        className="w-full h-9 px-3 font-mono bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="font-semibold text-text block">
                                        Urutan
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={variantForm.sort_order}
                                        onChange={(e) => setVariantForm({ ...variantForm, sort_order: Number(e.target.value) })}
                                        className="w-full h-9 px-3 font-mono bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                    />
                                </div>
                            </div>

                            {/* Is Active */}
                            <div className="pt-2 border-t border-border flex items-center justify-between">
                                <span className="font-semibold text-text">Status Aktif Varian</span>
                                <Switch
                                    checked={variantForm.is_active}
                                    onCheckedChange={(checked) => setVariantForm({ ...variantForm, is_active: checked })}
                                />
                            </div>

                            {/* Submit */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setIsVariantModalOpen(false)}
                                    className="px-3 py-1.5 text-xs text-text-2 hover:text-text rounded cursor-pointer"
                                    disabled={isVariantSubmitting}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isVariantSubmitting}
                                    className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{isVariantSubmitting ? 'Menyimpan...' : 'Simpan Varian'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Hapus Varian */}
            {deleteModalVariant && (
                <div 
                    className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4"
                    onClick={() => setDeleteModalVariant(null)}
                >
                    <div 
                        className="w-full max-w-sm bg-surface border border-border-strong rounded-md p-5 shadow-xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-sm font-bold text-danger flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            <span>Hapus Varian Paket</span>
                        </h3>
                        <p className="text-xs text-text-2">
                            Apakah Anda yakin ingin menghapus varian <strong className="text-text font-semibold">{deleteModalVariant.name}</strong>?
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                            <button
                                type="button"
                                onClick={() => setDeleteModalVariant(null)}
                                className="px-3 py-1.5 text-xs text-text-2 hover:text-text rounded cursor-pointer"
                                disabled={isDeletingVariant}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteVariant}
                                disabled={isDeletingVariant}
                                className="px-4 py-1.5 bg-danger-solid text-on-danger text-xs font-semibold rounded hover:bg-danger-solid-hover transition-colors cursor-pointer"
                            >
                                {isDeletingVariant ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
