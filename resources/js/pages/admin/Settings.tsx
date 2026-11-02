import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { 
    Settings as SettingsIcon, 
    Calendar, 
    Send, 
    Trash2, 
    Plus, 
    CheckCircle2, 
    AlertCircle, 
    HelpCircle,
    Clock,
    Phone,
    Store,
    Upload,
    Check,
    Palette,
    X
} from 'lucide-react';

interface QuotaOverride {
    id: number;
    date: string;
    max_quota: number;
    note?: string | null;
}

interface SettingsProps {
    settings: {
        max_daily_rent_quota: number;
        admin_whatsapp?: string | null;
        business_hours?: string | null;
        store_name?: string | null;
        store_logo_path?: string | null;
        accent_preset?: 'emerald' | 'teal' | 'blue' | 'mono';
    };
    overrides: QuotaOverride[];
    telegramConfigured: boolean;
}

const ACCENT_PRESETS = [
    {
        id: 'emerald',
        label: 'Emerald',
        color: '#10B981',
        desc: 'Default aksen hijau natural',
    },
    {
        id: 'teal',
        label: 'Teal',
        color: '#14B8A6',
        desc: 'Aksen hijau kebiruan toska',
    },
    {
        id: 'blue',
        label: 'Blue',
        color: '#3B82F6',
        desc: 'Aksen biru modern & presisi',
    },
    {
        id: 'mono',
        label: 'Monochrome',
        color: '#71717A',
        desc: 'Hitam/Putih kontras tinggi',
    },
] as const;

export default function AdminSettings({ settings, overrides, telegramConfigured }: SettingsProps) {
    // General Settings Form state
    const [generalData, setGeneralData] = useState<{
        max_daily_rent_quota: number;
        admin_whatsapp: string;
        business_hours: string;
        store_name: string;
        accent_preset: 'emerald' | 'teal' | 'blue' | 'mono';
        store_logo: File | null;
        remove_logo: boolean;
    }>({
        max_daily_rent_quota: settings.max_daily_rent_quota || 3,
        admin_whatsapp: settings.admin_whatsapp || '',
        business_hours: settings.business_hours || '',
        store_name: settings.store_name || '',
        accent_preset: settings.accent_preset || 'emerald',
        store_logo: null,
        remove_logo: false,
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(settings.store_logo_path || null);
    const [isSavingGeneral, setIsSavingGeneral] = useState(false);

    // Override Form state
    const [overrideData, setOverrideData] = useState({
        date: '',
        max_quota: 3,
        note: '',
    });
    const [isSavingOverride, setIsSavingOverride] = useState(false);

    // Telegram Test state
    const [isTestingTelegram, setIsTestingTelegram] = useState(false);

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setGeneralData({ ...generalData, store_logo: file, remove_logo: false });
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveLogo = () => {
        setGeneralData({ ...generalData, store_logo: null, remove_logo: true });
        setLogoPreview(null);
    };

    const handleSaveGeneral = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingGeneral(true);

        const payload: Record<string, any> = {
            max_daily_rent_quota: generalData.max_daily_rent_quota,
            admin_whatsapp: generalData.admin_whatsapp,
            business_hours: generalData.business_hours,
            store_name: generalData.store_name,
            accent_preset: generalData.accent_preset,
            remove_logo: generalData.remove_logo ? 1 : 0,
        };

        if (generalData.store_logo) {
            payload.store_logo = generalData.store_logo;
        }

        router.post('/admin/settings', payload, {
            forceFormData: true,
            onFinish: () => setIsSavingGeneral(false),
        });
    };

    const handleSaveOverride = (e: React.FormEvent) => {
        e.preventDefault();
        if (!overrideData.date) return;
        setIsSavingOverride(true);
        router.post('/admin/settings/overrides', overrideData, {
            onSuccess: () => {
                setOverrideData({ date: '', max_quota: 3, note: '' });
            },
            onFinish: () => setIsSavingOverride(false),
        });
    };

    const handleDeleteOverride = (overrideId: number) => {
        if (!confirm('Hapus override kuota untuk tanggal ini?')) return;
        router.delete(`/admin/settings/overrides/${overrideId}`);
    };

    const handleTestTelegram = () => {
        setIsTestingTelegram(true);
        router.post('/admin/settings/test-telegram', {}, {
            onFinish: () => setIsTestingTelegram(false),
        });
    };

    return (
        <AdminLayout>
            <Head title="Pengaturan Toko - Admin" />

            <div className="space-y-6">
                {/* Header */}
                <div className="pb-3 border-b border-border">
                    <h1 className="text-lg font-bold tracking-tight text-text">Pengaturan Sistem</h1>
                    <p className="text-xs text-text-2">
                        Konfigurasi identitas toko, warna aksen tema, kuota sewa harian, jam kerja, dan bot Telegram.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Column 1: Store Identity & General Settings */}
                    <div className="space-y-6">
                        <div className="bg-surface border border-border rounded-md p-4 space-y-4">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-text-2 border-b border-border pb-2 flex items-center gap-1.5">
                                <Store className="w-3.5 h-3.5 text-accent-text" />
                                <span>Identitas Toko & Tampilan</span>
                            </h2>

                            <form onSubmit={handleSaveGeneral} className="space-y-4 text-xs">
                                {/* Store Name */}
                                <div>
                                    <label className="font-medium text-text block mb-1">
                                        Nama Toko (BrandMark)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="StreamPoint (kosongkan untuk default dari sistem)"
                                        value={generalData.store_name}
                                        onChange={(e) => setGeneralData({ ...generalData, store_name: e.target.value })}
                                        className="w-full h-9 px-3 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                    />
                                    <span className="text-[11px] text-text-2 mt-1 block">
                                        Tampil pada header, footer, judul tab peramban, dan halaman login.
                                    </span>
                                </div>

                                {/* Store Logo */}
                                <div>
                                    <label className="font-medium text-text block mb-1">
                                        Logo Toko (Maks 1MB, JPG/PNG/WEBP, bukan SVG)
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-md bg-surface-2 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo Toko" className="w-full h-full object-contain p-1" />
                                            ) : (
                                                <Store className="w-5 h-5 text-text-3" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp"
                                                onChange={handleLogoFileChange}
                                                className="block w-full text-xs text-text-2 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border file:border-border file:text-xs file:font-semibold file:bg-surface-2 file:text-text hover:file:bg-surface-hover cursor-pointer"
                                            />
                                            {logoPreview && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveLogo}
                                                    className="text-[11px] text-danger hover:underline inline-flex items-center gap-1"
                                                >
                                                    <X className="w-3 h-3" />
                                                    <span>Hapus logo (gunakan nama teks saja)</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Accent Preset Swatches */}
                                <div>
                                    <label className="font-medium text-text block mb-1 flex items-center gap-1.5">
                                        <Palette className="w-3.5 h-3.5 text-text-2" />
                                        <span>Preset Warna Aksen Toko (Server-Side)</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                                        {ACCENT_PRESETS.map((p) => {
                                            const isSelected = generalData.accent_preset === p.id;
                                            return (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => setGeneralData({ ...generalData, accent_preset: p.id })}
                                                    className={`p-2.5 rounded-lg border text-left transition-colors flex items-start gap-2.5 cursor-pointer ${
                                                        isSelected 
                                                            ? 'border-accent bg-accent/10 ring-1 ring-accent' 
                                                            : 'border-border bg-surface-2 hover:bg-surface-hover'
                                                    }`}
                                                >
                                                    <span 
                                                        className="w-4 h-4 rounded-full shrink-0 mt-0.5 border border-border"
                                                        style={{ backgroundColor: p.color }}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-text text-xs">{p.label}</span>
                                                            {isSelected && <Check className="w-3.5 h-3.5 text-accent-text" />}
                                                        </div>
                                                        <span className="text-[10px] text-text-2 block truncate mt-0.5">{p.desc}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <span className="text-[11px] text-text-2 mt-1.5 block">
                                        Diterapkan server-side via <code className="font-mono text-text">data-accent</code> tanpa kedipan di mode Terang & Gelap.
                                    </span>
                                </div>

                                <div className="pt-2 border-t border-border">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-2 pb-2">
                                        Kuota & Kontak Operasional
                                    </h3>
                                </div>

                                <div>
                                    <label className="font-medium text-text block mb-1">
                                        Batas Kuota Sewa Harian Default
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={generalData.max_daily_rent_quota}
                                        onChange={(e) => setGeneralData({ ...generalData, max_daily_rent_quota: Number(e.target.value) })}
                                        className="w-full h-9 px-3 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent font-mono"
                                        required
                                    />
                                    <span className="text-[11px] text-text-2 mt-1 block">
                                        Jumlah transaksi sewa yang diizinkan per hari (default: 3).
                                    </span>
                                </div>

                                <div>
                                    <label className="font-medium text-text block mb-1 flex items-center gap-1">
                                        <Phone className="w-3.5 h-3.5 text-text-2" />
                                        <span>Nomor WhatsApp Admin (Bantuan)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 6281234567890"
                                        value={generalData.admin_whatsapp}
                                        onChange={(e) => setGeneralData({ ...generalData, admin_whatsapp: e.target.value })}
                                        className="w-full h-9 px-3 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent font-mono"
                                    />
                                    <span className="text-[11px] text-text-2 mt-1 block">
                                        Ditampilkan pada tombol bantuan mengambang, footer, dan detail invoice.
                                    </span>
                                </div>

                                <div>
                                    <label className="font-medium text-text block mb-1 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-text-2" />
                                        <span>Jam Operasional Toko</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Setiap hari, 09.00 - 21.00 WIB"
                                        value={generalData.business_hours}
                                        onChange={(e) => setGeneralData({ ...generalData, business_hours: e.target.value })}
                                        className="w-full h-9 px-3 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                    />
                                    <span className="text-[11px] text-text-2 mt-1 block">
                                        Ditampilkan pada footer semua halaman publik.
                                    </span>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSavingGeneral}
                                        className="px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>{isSavingGeneral ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Telegram Notification Test Card */}
                        <div className="bg-surface border border-border rounded-md p-4 space-y-4">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-text-2 border-b border-border pb-2 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <Send className="w-3.5 h-3.5 text-text-2" />
                                    <span>Notifikasi Bot Telegram</span>
                                </span>
                                {telegramConfigured ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-success/10 text-success border border-success/30 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Terkonfigurasi (.env)</span>
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-danger/10 text-danger border border-danger/30 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>Belum Dikonfigurasi</span>
                                    </span>
                                )}
                            </h2>

                            <p className="text-xs text-text-2">
                                Notifikasi pesanan baru, konfirmasi bayar, dan pengingat dikirim ke bot Telegram via token yang tersimpan di file <code className="text-text font-mono">.env</code>.
                            </p>

                            <div className="pt-1">
                                <button
                                    type="button"
                                    onClick={handleTestTelegram}
                                    disabled={isTestingTelegram || !telegramConfigured}
                                    className="px-3 py-1.5 bg-surface-2 border border-border hover:bg-surface-hover text-text text-xs font-semibold rounded transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Send className="w-3 h-3" />
                                    <span>{isTestingTelegram ? 'Mengirim...' : 'Kirim Pesan Tes Telegram'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Daily Quota Overrides */}
                    <div className="space-y-6">
                        <div className="bg-surface border border-border rounded-md p-4 space-y-4">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-text-2 border-b border-border pb-2 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-text-2" />
                                <span>Override Kuota Harian Tertentu</span>
                            </h2>

                            <p className="text-xs text-text-2">
                                Tetapkan kuota sewa khusus untuk tanggal tertentu (misalnya dinaikkan menjadi 5 saat libur, atau 0 untuk menutup sewa pada tanggal tersebut).
                            </p>

                            {/* Add Override Form */}
                            <form onSubmit={handleSaveOverride} className="p-3 bg-surface-2 border border-border rounded space-y-3 text-xs">
                                <div className="font-semibold text-text flex items-center gap-1">
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Tambah / Ubah Override Tanggal</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="font-medium text-text block mb-1">Tanggal (WIB)</label>
                                        <input
                                            type="date"
                                            value={overrideData.date}
                                            onChange={(e) => setOverrideData({ ...overrideData, date: e.target.value })}
                                            className="w-full h-8 px-2.5 bg-surface border border-border rounded text-text focus:outline-none focus:border-accent font-mono"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="font-medium text-text block mb-1">Kuota (0 = Tutup)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={overrideData.max_quota}
                                            onChange={(e) => setOverrideData({ ...overrideData, max_quota: Number(e.target.value) })}
                                            className="w-full h-8 px-2.5 bg-surface border border-border rounded text-text focus:outline-none focus:border-accent font-mono"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="font-medium text-text block mb-1">Catatan Internal (Opsional)</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Libur nasional, sewa ditutup"
                                        value={overrideData.note}
                                        onChange={(e) => setOverrideData({ ...overrideData, note: e.target.value })}
                                        className="w-full h-8 px-2.5 bg-surface border border-border rounded text-text focus:outline-none focus:border-accent"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSavingOverride}
                                    className="w-full py-1.5 bg-surface hover:bg-surface-hover border border-border text-text font-semibold rounded transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{isSavingOverride ? 'Menyimpan...' : 'Simpan Override Tanggal'}</span>
                                </button>
                            </form>

                            {/* Overrides Table */}
                            <div className="space-y-2 pt-2">
                                <h3 className="text-xs font-semibold text-text">Daftar Tanggal yang Di-override:</h3>
                                {overrides.length === 0 ? (
                                    <p className="text-xs text-text-3 italic">
                                        Belum ada override tanggal khusus. Kuota harian selalu mengikuti nilai default ({settings.max_daily_rent_quota}).
                                    </p>
                                ) : (
                                    <div className="border border-border rounded overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-surface-2 border-b border-border text-text-2 font-semibold">
                                                    <th className="py-2 px-3">Tanggal</th>
                                                    <th className="py-2 px-3 text-center">Kuota</th>
                                                    <th className="py-2 px-3">Catatan</th>
                                                    <th className="py-2 px-3 text-right">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {overrides.map((ov) => (
                                                    <tr key={ov.id} className="hover:bg-surface-hover/50">
                                                        <td className="py-2 px-3 font-mono text-text">
                                                            {ov.date}
                                                        </td>
                                                        <td className="py-2 px-3 text-center font-mono font-bold">
                                                            {ov.max_quota === 0 ? (
                                                                <span className="px-1.5 py-0.5 rounded bg-danger/10 text-danger text-[10px]">
                                                                    TUTUP (0)
                                                                </span>
                                                            ) : (
                                                                <span className="text-accent-text">
                                                                    {ov.max_quota}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-2 px-3 text-text-2 truncate max-w-[120px]">
                                                            {ov.note || '-'}
                                                        </td>
                                                        <td className="py-2 px-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteOverride(ov.id)}
                                                                className="text-text-3 hover:text-danger transition-colors p-1"
                                                                title="Hapus Override"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
