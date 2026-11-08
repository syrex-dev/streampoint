import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/admin/PageHeader';
import { FormSection } from '@/components/admin/FormSection';
import { Switch } from '@/components/ui/switch';
import { Package, ArrowLeft, Upload, Check, AlertCircle } from 'lucide-react';

export default function ProductCreate() {
    const { data, setData, post, processing, errors } = useForm<{
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
        name: '',
        slug: '',
        category: 'Streaming',
        description: '',
        rules: '',
        is_active: true,
        sort_order: 0,
        brand_color: '',
        has_warranty: false,
        thumbnail: null,
        cover: null,
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

    // Auto-generate slug from name if slug hasn't been manually diverged
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        const autoSlug = newName
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');

        setData((prev) => ({
            ...prev,
            name: newName,
            slug: prev.slug === '' || prev.slug === prev.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '') 
                ? autoSlug 
                : prev.slug,
        }));
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('thumbnail', file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('cover', file);
            setCoverPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/products');
    };

    return (
        <AdminLayout>
            <Head title="Tambah Produk Baru - Admin" />

            <div className="max-w-3xl mx-auto space-y-6">
                <PageHeader
                    title="Tambah Produk Baru"
                    description="Isi detail informasi dasar layanan produk sebelum menambahkan varian paket."
                >
                    <Link
                        href="/admin/products"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 hover:bg-surface-hover text-text text-xs font-medium rounded-md border border-border transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Kembali</span>
                    </Link>
                </PageHeader>

                {/* Form & Live Preview Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form (2 cols) */}
                    <form onSubmit={handleSubmit} className="lg:col-span-2 bg-surface border border-border rounded-lg p-5 space-y-5 h-fit">
                        {/* General Errors */}
                        {Object.keys(errors).length > 0 && (
                            <div className="p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold block">Terdapat kesalahan pengisian formulir:</span>
                                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                        {Object.values(errors).map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Name & Slug */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-text block">
                                    Nama Produk <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={handleNameChange}
                                    placeholder="Contoh: Netflix Premium UHD"
                                    required
                                    className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded text-text placeholder:text-text-3 focus:outline-none focus:border-accent"
                                />
                                {errors.name && <p className="text-[11px] text-danger">{errors.name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-text block">
                                    Slug URL <span className="text-text-3 font-normal">(otomatis unik)</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    placeholder="netflix-premium-uhd"
                                    className="w-full h-9 px-3 text-xs font-mono bg-surface-2 border border-border rounded text-text placeholder:text-text-3 focus:outline-none focus:border-accent"
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
                                    placeholder="Streaming, Musik, Gaming, dll."
                                    required
                                    className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded text-text placeholder:text-text-3 focus:outline-none focus:border-accent"
                                />
                                {errors.category && <p className="text-[11px] text-danger">{errors.category}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-text block">
                                    Urutan Tampilan (Sort Order)
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

                        {/* Thumbnail / Logo Upload */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text block">
                                Logo / Ikon Produk (Maks 2MB, JPG/PNG/WEBP)
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
                                        <img src={previewUrl} alt="Preview Logo" className="w-full h-full object-contain p-2" />
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
                                placeholder="Deskripsi singkat mengenai layanan atau fitur utama..."
                                className="w-full p-2.5 text-xs bg-surface-2 border border-border rounded text-text placeholder:text-text-3 focus:outline-none focus:border-accent resize-none"
                            />
                            {errors.description && <p className="text-[11px] text-danger">{errors.description}</p>}
                        </div>

                        {/* Rules (Aturan Sewa / Garansi) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text block">
                                Aturan Layanan & Garansi
                            </label>
                            <textarea
                                value={data.rules}
                                onChange={(e) => setData('rules', e.target.value)}
                                rows={4}
                                placeholder="Tuliskan syarat dan ketentuan pemakaian akun, larangan ganti password/profil, garansi akun, dll."
                                className="w-full p-2.5 text-xs bg-surface-2 border border-border rounded text-text placeholder:text-text-3 focus:outline-none focus:border-accent"
                            />
                            {errors.rules && <p className="text-[11px] text-danger">{errors.rules}</p>}
                        </div>

                        {/* Status Aktif */}
                        <div className="pt-2 border-t border-border flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-text block">Status Publikasi</span>
                                <span className="text-[11px] text-text-3">
                                    Layanan nonaktif tidak akan tampil di etalase depan.
                                </span>
                            </div>
                            <Switch
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked)}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                            <Link
                                href="/admin/products"
                                className="px-3.5 py-2 text-xs font-semibold text-text-2 hover:text-text rounded transition-colors"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                <Check className="w-4 h-4" />
                                <span>{processing ? 'Menyimpan...' : 'Simpan & Lanjutkan ke Varian'}</span>
                            </button>
                        </div>
                    </form>

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
                                            Rp 15.000
                                        </span>
                                    </div>
                                </div>

                                {/* Chips */}
                                <div className="pt-2 border-t border-border flex items-center justify-between gap-1 text-[11px]">
                                    <div className="flex items-center gap-1 flex-wrap">
                                        <span className="px-1.5 py-0.5 font-medium rounded border border-border bg-surface-2 text-text-2">
                                            Sewa
                                        </span>
                                        <span className="px-1.5 py-0.5 font-medium rounded border border-border bg-surface-2 text-text-2">
                                            Beli
                                        </span>
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
                            Pratinjau otomatis menyesuaikan dengan warna merek, sampul, logo, dan badge garansi yang Anda tentukan.
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
