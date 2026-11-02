import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { 
    Image as ImageIcon, 
    ArrowLeft, 
    Upload, 
    AlertCircle, 
    AlertTriangle, 
    Check, 
    ExternalLink 
} from 'lucide-react';

export default function BannerCreate() {
    const { data, setData, post, processing, errors } = useForm<{
        title: string;
        subtitle: string;
        cta_label: string;
        cta_url: string;
        tone: 'neutral' | 'accent' | 'warning';
        is_active: boolean;
        sort_order: number;
        starts_at: string;
        ends_at: string;
        image: File | null;
    }>({
        title: '',
        subtitle: '',
        cta_label: '',
        cta_url: '',
        tone: 'neutral',
        is_active: true,
        sort_order: 0,
        starts_at: '',
        ends_at: '',
        image: null,
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/banners');
    };

    const getToneBgStyle = () => {
        switch (data.tone) {
            case 'accent':
                return {
                    backgroundColor: 'color-mix(in srgb, var(--accent) 10%, var(--surface))',
                    borderColor: 'color-mix(in srgb, var(--accent) 30%, var(--border))',
                };
            case 'warning':
                return {
                    backgroundColor: 'color-mix(in srgb, var(--warning) 10%, var(--surface))',
                    borderColor: 'color-mix(in srgb, var(--warning) 30%, var(--border))',
                };
            default:
                return {
                    backgroundColor: 'var(--surface-2)',
                    borderColor: 'var(--border)',
                };
        }
    };

    return (
        <AdminLayout>
            <Head title="Tambah Banner Baru - Admin" />

            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                    <Link
                        href="/admin/banners"
                        className="p-1.5 rounded-md bg-surface border border-border hover:bg-surface-hover text-text-2 hover:text-text transition-colors"
                        title="Kembali"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-text flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-accent-text" />
                            <span>Tambah Banner Baru</span>
                        </h1>
                        <p className="text-xs text-text-2">
                            Banner akan tampil di atas bar kuota beranda storefront.
                        </p>
                    </div>
                </div>

                {/* Content Disclaimer Warning */}
                <div className="p-3.5 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-3 text-xs text-warning">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                        <strong className="font-semibold block text-text">Pedoman Konten Toko (Anti-AI Slop):</strong>
                        <p className="text-text-2">
                            Jangan menulis klaim yang tidak bisa dibuktikan (misalnya jumlah pengguna fiktif, kata &lsquo;resmi/legal&rsquo;, atau &lsquo;termurah se-Indonesia&rsquo;). Tuliskan fakta spesifik promo atau instruksi operasional.
                        </p>
                    </div>
                </div>

                {/* Live Preview Box */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-text block">
                        Pratinjau Banner Publik:
                    </label>
                    <div 
                        className="relative rounded-lg border overflow-hidden p-4 sm:p-5 flex items-center justify-between min-h-[120px] sm:min-h-[140px] transition-colors"
                        style={getToneBgStyle()}
                    >
                        <div className="space-y-2 max-w-lg z-10">
                            <h3 className="text-sm sm:text-base font-bold text-text leading-snug line-clamp-2">
                                {data.title.trim() || 'Judul Banner Akan Tampil di Sini'}
                            </h3>
                            {data.subtitle.trim() && (
                                <p className="text-xs text-text-2 line-clamp-2">
                                    {data.subtitle}
                                </p>
                            )}
                            {data.cta_label.trim() && (
                                <div className="pt-1">
                                    <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-semibold bg-surface border border-border text-text shadow-xs">
                                        <span>{data.cta_label}</span>
                                        <ExternalLink className="w-3 h-3 text-text-2" />
                                    </span>
                                </div>
                            )}
                        </div>

                        {previewUrl && (
                            <div className="w-[30%] sm:w-[35%] h-full absolute right-0 top-0 bottom-0 overflow-hidden shrink-0 border-l border-border/40">
                                <img
                                    src={previewUrl}
                                    alt="Preview banner"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-5 space-y-5">
                    {Object.keys(errors).length > 0 && (
                        <div className="p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold block">Terdapat kesalahan validasi:</span>
                                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                    {Object.values(errors).map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-text block">
                                Judul Banner <span className="text-danger">*</span>
                            </label>
                            <span className="text-[11px] font-mono text-text-3">
                                {data.title.length}/80
                            </span>
                        </div>
                        <input
                            type="text"
                            maxLength={80}
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Contoh: Sewa Netflix 1 Hari Mulai Rp 15.000"
                            required
                            className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                        />
                        {errors.title && <p className="text-[11px] text-danger">{errors.title}</p>}
                    </div>

                    {/* Subtitle */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-text block">
                                Subjudul / Keterangan (Opsional)
                            </label>
                            <span className="text-[11px] font-mono text-text-3">
                                {data.subtitle.length}/160
                            </span>
                        </div>
                        <input
                            type="text"
                            maxLength={160}
                            value={data.subtitle}
                            onChange={(e) => setData('subtitle', e.target.value)}
                            placeholder="Contoh: Nikmati streaming tanpa langganan sebulan penuh. Slot terbatas per hari."
                            className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                        />
                        {errors.subtitle && <p className="text-[11px] text-danger">{errors.subtitle}</p>}
                    </div>

                    {/* CTA Label & URL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text block">
                                Label Tombol (Opsional)
                            </label>
                            <input
                                type="text"
                                maxLength={30}
                                value={data.cta_label}
                                onChange={(e) => setData('cta_label', e.target.value)}
                                placeholder="Contoh: Lihat Katalog"
                                className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                            />
                            {errors.cta_label && <p className="text-[11px] text-danger">{errors.cta_label}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text block">
                                Tautan URL Tombol (Hanya / atau https://)
                            </label>
                            <input
                                type="text"
                                value={data.cta_url}
                                onChange={(e) => setData('cta_url', e.target.value)}
                                placeholder="Contoh: /#katalog atau https://wa.me/..."
                                className="w-full h-9 px-3 text-xs font-mono bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                            />
                            {errors.cta_url && <p className="text-[11px] text-danger">{errors.cta_url}</p>}
                        </div>
                    </div>

                    {/* Tone & Sort Order */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text block">
                                Tone Warna Latar
                            </label>
                            <select
                                value={data.tone}
                                onChange={(e) => setData('tone', e.target.value as 'neutral' | 'accent' | 'warning')}
                                className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                            >
                                <option value="neutral">Netral (--surface-2)</option>
                                <option value="accent">Aksen Toko (10% tint aksen)</option>
                                <option value="warning">Peringatan / Penting (10% tint warning)</option>
                            </select>
                            {errors.tone && <p className="text-[11px] text-danger">{errors.tone}</p>}
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

                    {/* Image Upload */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text block">
                            Gambar Ilustrasi Banner (Maks 2MB, JPG/PNG/WEBP, bukan SVG)
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-12 rounded bg-surface-2 border border-border flex items-center justify-center shrink-0 overflow-hidden font-mono text-xs text-text-3">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Upload className="w-4 h-4 text-text-3" />
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={handleImageChange}
                                    className="block w-full text-xs text-text-2 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-border file:text-xs file:font-semibold file:bg-surface-2 file:text-text hover:file:bg-surface-hover cursor-pointer"
                                />
                                <span className="text-[11px] text-text-3 block mt-1">
                                    Gambar akan diletakkan di sisi kanan banner (maksimal 35% lebar).
                                </span>
                            </div>
                        </div>
                        {errors.image && <p className="text-[11px] text-danger">{errors.image}</p>}
                    </div>

                    {/* Schedule (starts_at & ends_at) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text block">
                                Mulai Tayang (Opsional)
                            </label>
                            <input
                                type="datetime-local"
                                value={data.starts_at}
                                onChange={(e) => setData('starts_at', e.target.value)}
                                className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent font-mono"
                            />
                            <span className="text-[11px] text-text-3 block">
                                Kosongkan jika ingin langsung tayang.
                            </span>
                            {errors.starts_at && <p className="text-[11px] text-danger">{errors.starts_at}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text block">
                                Selesai Tayang (Opsional)
                            </label>
                            <input
                                type="datetime-local"
                                value={data.ends_at}
                                onChange={(e) => setData('ends_at', e.target.value)}
                                className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent font-mono"
                            />
                            <span className="text-[11px] text-text-3 block">
                                Kosongkan jika tayang tanpa batas waktu.
                            </span>
                            {errors.ends_at && <p className="text-[11px] text-danger">{errors.ends_at}</p>}
                        </div>
                    </div>

                    {/* Active toggle */}
                    <div className="pt-2 border-t border-border flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-text block">Status Banner</span>
                            <span className="text-[11px] text-text-2">
                                Aktifkan banner agar muncul di storefront (maksimal 5 banner aktif).
                            </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-2 peer-checked:after:bg-on-accent after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent border border-border"></div>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                        <Link
                            href="/admin/banners"
                            className="h-8 px-4 rounded text-xs font-semibold bg-surface-2 border border-border hover:bg-surface-hover text-text transition-colors flex items-center"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="h-8 px-4 rounded text-xs font-semibold bg-accent text-on-accent hover:bg-accent-hover transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <Check className="w-3.5 h-3.5" />
                            <span>{processing ? 'Menyimpan...' : 'Simpan Banner'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
