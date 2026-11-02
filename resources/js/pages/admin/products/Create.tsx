import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/AdminLayout';
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
        thumbnail: File | null;
    }>({
        name: '',
        slug: '',
        category: 'Streaming',
        description: '',
        rules: '',
        is_active: true,
        sort_order: 0,
        thumbnail: null,
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/products');
    };

    return (
        <AdminLayout>
            <Head title="Tambah Produk Baru - Admin" />

            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                    <Link
                        href="/admin/products"
                        className="p-1.5 rounded-md bg-surface border border-border hover:bg-surface-hover text-text-2 hover:text-text transition-colors"
                        title="Kembali"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-text flex items-center gap-2">
                            <Package className="w-5 h-5 text-accent-text" />
                            <span>Tambah Produk Baru</span>
                        </h1>
                        <p className="text-xs text-text-2">
                            Isi detail informasi dasar layanan produk sebelum menambahkan varian paket.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-5 space-y-5">
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

                    {/* Thumbnail Upload */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text block">
                            Thumbnail / Logo Produk (Maks 2MB, JPG/PNG/WEBP)
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-lg bg-surface-2 border border-border flex items-center justify-center shrink-0 overflow-hidden font-mono text-xs text-text-3">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Upload className="w-5 h-5 text-text-3" />
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
                                    Disimpan di disk public dengan nama file acak.
                                </span>
                            </div>
                        </div>
                        {errors.thumbnail && <p className="text-[11px] text-danger">{errors.thumbnail}</p>}
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
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-10 h-5 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-success border border-border"></div>
                        </label>
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
            </div>
        </AdminLayout>
    );
}
