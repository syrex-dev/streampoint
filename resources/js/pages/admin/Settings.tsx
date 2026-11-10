import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/admin/PageHeader';
import { ImageGuideCard } from '@/components/admin/ImageGuideCard';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { 
    Calendar, 
    Send, 
    Trash2, 
    Plus, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    Phone, 
    Store, 
    Check, 
    Palette, 
    X, 
    Megaphone, 
    ShoppingBag, 
    Share2,
    Save,
    AlertTriangle,
    Eye,
    EyeOff,
    RefreshCw,
    Upload,
    Bell
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
        announcement_text?: string | null;
        announcement_url?: string | null;
        announcement_active?: boolean;
        store_tagline?: string | null;
        delivery_eta?: string | null;
        min_sold_display?: number;
        stats_min_orders?: number;
        custom_request_enabled?: boolean;
        social_links?: {
            telegram?: string | null;
            instagram?: string | null;
            threads?: string | null;
            tiktok?: string | null;
        } | null;
        telegram_active?: boolean;
        telegram_has_token?: boolean;
        telegram_token_masked?: string;
        telegram_chat_id?: string;
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

type SettingsTab = 'brand' | 'operational' | 'contact' | 'appearance' | 'telegram';

export default function AdminSettings({ settings, overrides, telegramConfigured }: SettingsProps) {
    const [activeTab, setActiveTab] = useState<SettingsTab>('brand');

    const [generalData, setGeneralData] = useState<{
        max_daily_rent_quota: number;
        admin_whatsapp: string;
        business_hours: string;
        store_name: string;
        store_tagline: string;
        delivery_eta: string;
        min_sold_display: number;
        stats_min_orders: number;
        custom_request_enabled: boolean;
        announcement_text: string;
        announcement_url: string;
        announcement_active: boolean;
        social_links: {
            telegram: string;
            instagram: string;
            threads: string;
            tiktok: string;
        };
        accent_preset: 'emerald' | 'teal' | 'blue' | 'mono';
        store_logo: File | null;
        remove_logo: boolean;
        telegram_active: boolean;
        telegram_bot_token: string;
        telegram_chat_id: string;
    }>({
        max_daily_rent_quota: settings.max_daily_rent_quota || 3,
        admin_whatsapp: settings.admin_whatsapp || '',
        business_hours: settings.business_hours || '',
        store_name: settings.store_name || '',
        store_tagline: settings.store_tagline || '',
        delivery_eta: settings.delivery_eta || '',
        min_sold_display: settings.min_sold_display ?? 5,
        stats_min_orders: settings.stats_min_orders ?? 20,
        custom_request_enabled: Boolean(settings.custom_request_enabled),
        announcement_text: settings.announcement_text || '',
        announcement_url: settings.announcement_url || '',
        announcement_active: Boolean(settings.announcement_active),
        social_links: {
            telegram: settings.social_links?.telegram || '',
            instagram: settings.social_links?.instagram || '',
            threads: settings.social_links?.threads || '',
            tiktok: settings.social_links?.tiktok || '',
        },
        accent_preset: settings.accent_preset || 'emerald',
        store_logo: null,
        remove_logo: false,
        telegram_active: Boolean(settings.telegram_active),
        telegram_bot_token: settings.telegram_token_masked || '',
        telegram_chat_id: settings.telegram_chat_id || '',
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

    // Telegram Test & Detect state
    const [isTestingTelegram, setIsTestingTelegram] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [isDetectingChatId, setIsDetectingChatId] = useState(false);
    const [detectedChats, setDetectedChats] = useState<Array<{ id: string; name: string; username?: string | null; type: string }>>([]);
    const [detectFeedback, setDetectFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [testFeedback, setTestFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

    const handleSaveGeneral = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSavingGeneral(true);

        const payload: Record<string, any> = {
            max_daily_rent_quota: generalData.max_daily_rent_quota,
            admin_whatsapp: generalData.admin_whatsapp,
            business_hours: generalData.business_hours,
            store_name: generalData.store_name,
            store_tagline: generalData.store_tagline,
            delivery_eta: generalData.delivery_eta,
            min_sold_display: generalData.min_sold_display,
            stats_min_orders: generalData.stats_min_orders,
            custom_request_enabled: generalData.custom_request_enabled ? 1 : 0,
            announcement_text: generalData.announcement_text,
            announcement_url: generalData.announcement_url,
            announcement_active: generalData.announcement_active ? 1 : 0,
            social_links: generalData.social_links,
            accent_preset: generalData.accent_preset,
            remove_logo: generalData.remove_logo ? 1 : 0,
            telegram_active: generalData.telegram_active ? 1 : 0,
            telegram_chat_id: generalData.telegram_chat_id,
        };

        if (generalData.telegram_bot_token && !generalData.telegram_bot_token.includes('•')) {
            payload.telegram_bot_token = generalData.telegram_bot_token;
        }

        if (generalData.store_logo) {
            payload.store_logo = generalData.store_logo;
        }

        router.post('/admin/settings', payload, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setIsSavingGeneral(false),
        });
    };

    const handleSaveOverride = (e: React.FormEvent) => {
        e.preventDefault();
        if (!overrideData.date) return;
        setIsSavingOverride(true);
        router.post('/admin/settings/overrides', overrideData, {
            preserveScroll: true,
            onSuccess: () => {
                setOverrideData({ date: '', max_quota: 3, note: '' });
            },
            onFinish: () => setIsSavingOverride(false),
        });
    };

    const handleDeleteOverride = (overrideId: number) => {
        if (!confirm('Hapus override kuota untuk tanggal ini?')) return;
        router.delete(`/admin/settings/overrides/${overrideId}`, {
            preserveScroll: true,
        });
    };

    const getCsrfToken = (): string => {
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        if (meta?.content) return meta.content;
        const match = document.cookie.match(new RegExp('(^|;\\s*)XSRF-TOKEN=([^;]*)'));
        return match ? decodeURIComponent(match[2]) : '';
    };

    const handleDetectChatId = async () => {
        setIsDetectingChatId(true);
        setDetectFeedback(null);
        try {
            const res = await fetch('/admin/settings/detect-telegram-chat-id', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    bot_token: generalData.telegram_bot_token,
                }),
            });

            const data = await res.json();
            if (data.success && Array.isArray(data.chats) && data.chats.length > 0) {
                setDetectedChats(data.chats);
                if (data.chats.length === 1) {
                    setGeneralData((prev) => ({ ...prev, telegram_chat_id: String(data.chats[0].id) }));
                    setDetectFeedback({
                        type: 'success',
                        message: `Berhasil mendeteksi Chat ID: ${data.chats[0].id} (${data.chats[0].name}). Otomatis dimasukkan ke kolom.`,
                    });
                } else {
                    setDetectFeedback({
                        type: 'success',
                        message: `Ditemukan ${data.chats.length} obrolan. Silakan klik "Gunakan" pada obrolan yang sesuai di bawah:`,
                    });
                }
            } else {
                setDetectFeedback({
                    type: 'error',
                    message: data.message || 'Tidak ada obrolan terbaru. Pastikan Anda sudah membuka bot di Telegram dan klik /start atau kirim pesan "halo".',
                });
            }
        } catch {
            setDetectFeedback({
                type: 'error',
                message: 'Gagal menghubungi server untuk deteksi Telegram Chat ID.',
            });
        } finally {
            setIsDetectingChatId(false);
        }
    };

    const handleTestTelegram = async () => {
        setIsTestingTelegram(true);
        setTestFeedback(null);
        try {
            const res = await fetch('/admin/settings/test-telegram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    bot_token: generalData.telegram_bot_token,
                    chat_id: generalData.telegram_chat_id,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setTestFeedback({
                    type: 'success',
                    message: data.message || 'Pesan uji coba berhasil terkirim ke Telegram Anda!',
                });
            } else {
                setTestFeedback({
                    type: 'error',
                    message: data.message || 'Gagal mengirim pesan uji coba.',
                });
            }
        } catch {
            setTestFeedback({
                type: 'error',
                message: 'Terjadi kesalahan jaringan saat mencoba mengirim pesan tes.',
            });
        } finally {
            setIsTestingTelegram(false);
        }
    };

    // Synemax Style Tabs List
    const tabs = [
        { id: 'brand' as const, num: '1', label: 'Identitas & Brand', icon: Store },
        { id: 'operational' as const, num: '2', label: 'Operasional & Kuota', icon: Clock },
        { id: 'contact' as const, num: '3', label: 'Kontak & CS', icon: Phone },
        { id: 'appearance' as const, num: '4', label: 'Tampilan & Banner', icon: Palette },
        { id: 'telegram' as const, num: '5', label: 'Notifikasi Telegram', icon: Send },
    ];

    return (
        <AdminLayout>
            <Head title="Pengaturan Toko - Admin" />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header Synemax Style */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <span className="text-[11px] font-bold text-accent-text tracking-wider uppercase">
                            Konfigurasi Sistem
                        </span>
                        <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight mt-0.5">
                            Pengaturan Toko & Layanan
                        </h1>
                        <p className="text-xs sm:text-sm text-text-2 mt-1">
                            Kelola identitas merek, jam operasional, kuota sewa, kontak WhatsApp, dan notifikasi otomatis.
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={() => handleSaveGeneral()}
                        disabled={isSavingGeneral}
                        loading={isSavingGeneral}
                        className="shrink-0 cursor-pointer"
                    >
                        <Save className="w-4 h-4 mr-1.5" />
                        <span>Simpan Pengaturan</span>
                    </Button>
                </div>

                {/* Synemax Horizontal Pill Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 border-b border-border">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                    isActive
                                        ? 'bg-accent text-on-accent shadow-xs'
                                        : 'bg-surface border border-border text-text-2 hover:text-text hover:bg-surface-hover'
                                }`}
                            >
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold ${
                                    isActive ? 'bg-black/20 text-on-accent' : 'bg-surface-2 text-text-2'
                                }`}>
                                    {tab.num}
                                </span>
                                <Icon className="w-3.5 h-3.5 shrink-0" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* TAB 1: IDENTITAS & BRAND */}
                {activeTab === 'brand' && (
                    <div className="space-y-6">
                        {/* 1. Identitas Toko Card */}
                        <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
                            <div className="border-b border-border pb-3">
                                <h2 className="text-sm font-bold text-text flex items-center gap-2">
                                    <Store className="w-4 h-4 text-accent-text" />
                                    <span>Identitas & Branding Toko</span>
                                </h2>
                                <p className="text-xs text-text-3 mt-0.5">
                                    Nama dan slogan toko yang tampil di navbar, tab browser, dan invoice pelanggan.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text block">
                                        Nama Toko / Brand <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={generalData.store_name}
                                        onChange={(e) => setGeneralData({ ...generalData, store_name: e.target.value })}
                                        className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                                        placeholder="StreamPoint"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text block">
                                        Tagline / Slogan Toko
                                    </label>
                                    <input
                                        type="text"
                                        value={generalData.store_tagline}
                                        onChange={(e) => setGeneralData({ ...generalData, store_tagline: e.target.value })}
                                        className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                                        placeholder="Sewa & Beli Akun Streaming Instan & Terpercaya"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Warna Aksen Toko */}
                        <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
                            <div className="border-b border-border pb-3">
                                <h2 className="text-sm font-bold text-text flex items-center gap-2">
                                    <Palette className="w-4 h-4 text-accent-text" />
                                    <span>Warna Aksen Etalase</span>
                                </h2>
                                <p className="text-xs text-text-3 mt-0.5">
                                    Pilih palet warna aksen tombol, badge, dan highlight etalase publik.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {ACCENT_PRESETS.map((preset) => {
                                    const isSelected = generalData.accent_preset === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => setGeneralData({ ...generalData, accent_preset: preset.id })}
                                            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'border-accent bg-accent/10 shadow-xs'
                                                    : 'border-border bg-surface-2 hover:bg-surface-hover'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div
                                                    className="w-5 h-5 rounded-full shadow-xs"
                                                    style={{ backgroundColor: preset.color }}
                                                />
                                                {isSelected && <Check className="w-4 h-4 text-accent-text" />}
                                            </div>
                                            <div className="text-xs font-bold text-text">{preset.label}</div>
                                            <div className="text-[11px] text-text-3 mt-0.5">{preset.desc}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. Logo Toko */}
                        <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
                            <div className="border-b border-border pb-3">
                                <h2 className="text-sm font-bold text-text flex items-center gap-2">
                                    <Upload className="w-4 h-4 text-accent-text" />
                                    <span>Logo Toko</span>
                                </h2>
                                <p className="text-xs text-text-3 mt-0.5">
                                    Format JPG, PNG, atau WebP. Maksimal 5MB (dikonversi ke WebP otomatis).
                                </p>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-xl border border-border bg-surface-2 overflow-hidden flex items-center justify-center shrink-0">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo Toko" className="w-full h-full object-contain p-1" />
                                    ) : (
                                        <Store className="w-6 h-6 text-text-3" />
                                    )}
                                </div>

                                <div className="space-y-2 flex-1">
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={handleLogoFileChange}
                                        className="block w-full text-xs text-text-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-border file:text-xs file:font-semibold file:bg-surface-2 file:text-text hover:file:bg-surface-hover cursor-pointer"
                                    />
                                    {logoPreview && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveLogo}
                                            className="text-xs text-danger hover:underline inline-flex items-center gap-1 cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Hapus Logo</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: OPERASIONAL & KUOTA */}
                {activeTab === 'operational' && (
                    <div className="space-y-6">
                        {/* Jam Operasional & Batas Default */}
                        <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
                            <div className="border-b border-border pb-3">
                                <h2 className="text-sm font-bold text-text flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-accent-text" />
                                    <span>Operasional & Kuota Sewa Harian</span>
                                </h2>
                                <p className="text-xs text-text-3 mt-0.5">
                                    Atur jam kerja layanan toko dan batasi pesanan sewa per hari agar operasional admin tetap terkendali.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text block">
                                        Jam Operasional Admin
                                    </label>
                                    <input
                                        type="text"
                                        value={generalData.business_hours}
                                        onChange={(e) => setGeneralData({ ...generalData, business_hours: e.target.value })}
                                        className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                                        placeholder="08:00 - 22:00 WIB"
                                    />
                                    <span className="text-[11px] text-text-3 block">Ditampilkan di header dan footer etalase toko.</span>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text block">
                                        Batas Kuota Sewa Harian Default
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={999}
                                        value={generalData.max_daily_rent_quota}
                                        onChange={(e) => setGeneralData({ ...generalData, max_daily_rent_quota: Number(e.target.value) })}
                                        className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text focus:outline-none focus:border-accent font-mono"
                                    />
                                    <span className="text-[11px] text-text-3 block">Maksimal slot sewa yang bisa dipesan per hari secara global.</span>
                                </div>
                            </div>
                        </div>

                        {/* Override Kuota Tanggal Tertentu */}
                        <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
                            <div className="border-b border-border pb-3">
                                <h2 className="text-sm font-bold text-text flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-accent-text" />
                                    <span>Override Kuota Tanggal Tertentu</span>
                                </h2>
                                <p className="text-xs text-text-3 mt-0.5">
                                    Sesuaikan kuota khusus untuk hari libur, tanggal merah, atau promo khusus.
                                </p>
                            </div>

                            <form onSubmit={handleSaveOverride} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end p-4 bg-surface-2 rounded-xl border border-border">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-text block">Tanggal Override</label>
                                    <input
                                        type="date"
                                        value={overrideData.date}
                                        onChange={(e) => setOverrideData({ ...overrideData, date: e.target.value })}
                                        required
                                        className="w-full h-9 px-3 text-xs bg-surface border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-text block">Kuota Khusus</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={999}
                                        value={overrideData.max_quota}
                                        onChange={(e) => setOverrideData({ ...overrideData, max_quota: Number(e.target.value) })}
                                        required
                                        className="w-full h-9 px-3 text-xs bg-surface border border-border rounded-lg text-text focus:outline-none focus:border-accent font-mono"
                                    />
                                </div>

                                <div>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={isSavingOverride || !overrideData.date}
                                        loading={isSavingOverride}
                                        className="w-full h-9 cursor-pointer"
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        <span>Tambah Override</span>
                                    </Button>
                                </div>
                            </form>

                            {/* Daftar Override */}
                            <div className="space-y-2">
                                {overrides.length === 0 ? (
                                    <p className="text-xs text-text-3 text-center py-4">Belum ada tanggal override kuota yang ditetapkan.</p>
                                ) : (
                                    <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                                        {overrides.map((item) => (
                                            <div key={item.id} className="p-3 bg-surface flex items-center justify-between gap-3 text-xs">
                                                <div>
                                                    <span className="font-semibold text-text">{item.date}</span>
                                                    <span className="text-text-3 ml-2 font-mono">({item.max_quota} slot)</span>
                                                    {item.note && <span className="text-text-2 text-[11px] block">{item.note}</span>}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteOverride(item.id)}
                                                    className="p-1.5 text-text-3 hover:text-danger rounded-md transition-colors cursor-pointer"
                                                    title="Hapus tanggal"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: KONTAK & CS */}
                {activeTab === 'contact' && (
                    <div className="space-y-6">
                        {/* WhatsApp Admin */}
                        <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
                            <div className="border-b border-border pb-3">
                                <h2 className="text-sm font-bold text-text flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-accent-text" />
                                    <span>Kontak WhatsApp Pelanggan</span>
                                </h2>
                                <p className="text-xs text-text-3 mt-0.5">
                                    Nomor WhatsApp admin yang digunakan untuk bantuan live chat pelanggan dan tombol konfirmasi transfer.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5 max-w-md">
                                    <label className="text-xs font-semibold text-text block">
                                        Nomor WhatsApp Admin (Format 08... atau 62...)
                                    </label>
                                    <input
                                        type="tel"
                                        value={generalData.admin_whatsapp}
                                        onChange={(e) => setGeneralData({ ...generalData, admin_whatsapp: e.target.value })}
                                        className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text focus:outline-none focus:border-accent font-mono"
                                        placeholder="081234567890"
                                    />
                                </div>

                                <div className="pt-2 border-t border-border flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold text-text block">Layanan Custom Request</span>
                                        <span className="text-[11px] text-text-3">Tampilkan tombol pesanan khusus bagi akun yang belum tersedia di katalog.</span>
                                    </div>
                                    <Switch
                                        checked={generalData.custom_request_enabled}
                                        onCheckedChange={(checked) => setGeneralData({ ...generalData, custom_request_enabled: checked })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Media Sosial Toko */}
                        <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
                            <div className="border-b border-border pb-3">
                                <h2 className="text-sm font-bold text-text flex items-center gap-2">
                                    <Share2 className="w-4 h-4 text-accent-text" />
                                    <span>Tautan Media Sosial Toko</span>
                                </h2>
                                <p className="text-xs text-text-3 mt-0.5">
                                    Ditampilkan pada footer etalase toko untuk meningkatkan kepercayaan pembeli.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text block">Username / Link Telegram</label>
                                    <input
                                        type="text"
                                        value={generalData.social_links.telegram}
                                        onChange={(e) => setGeneralData({
                                            ...generalData,
                                            social_links: { ...generalData.social_links, telegram: e.target.value }
                                        })}
                                        className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                                        placeholder="t.me/streampoint"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text block">Username / Link Instagram</label>
                                    <input
                                        type="text"
                                        value={generalData.social_links.instagram}
                                        onChange={(e) => setGeneralData({
                                            ...generalData,
                                            social_links: { ...generalData.social_links, instagram: e.target.value }
                                        })}
                                        className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                                        placeholder="instagram.com/streampoint"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text block">Username / Link Threads</label>
                                    <input
                                        type="text"
                                        value={generalData.social_links.threads}
                                        onChange={(e) => setGeneralData({
                                            ...generalData,
                                            social_links: { ...generalData.social_links, threads: e.target.value }
                                        })}
                                        className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                                        placeholder="threads.net/@streampoint"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text block">Username / Link TikTok</label>
                                    <input
                                        type="text"
                                        value={generalData.social_links.tiktok}
                                        onChange={(e) => setGeneralData({
                                            ...generalData,
                                            social_links: { ...generalData.social_links, tiktok: e.target.value }
                                        })}
                                        className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                                        placeholder="tiktok.com/@streampoint"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: TAMPILAN & BANNER */}
                {activeTab === 'appearance' && (
                    <div className="space-y-6">
                        {/* Pengumuman Toko */}
                        <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
                            <div className="border-b border-border pb-3 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-text flex items-center gap-2">
                                        <Megaphone className="w-4 h-4 text-accent-text" />
                                        <span>Banner Pengumuman (Top Bar)</span>
                                    </h2>
                                    <p className="text-xs text-text-3 mt-0.5">
                                        Banner kecil di bagian paling atas etalase untuk promo atau info penting.
                                    </p>
                                </div>
                                <Switch
                                    checked={generalData.announcement_active}
                                    onCheckedChange={(checked) => setGeneralData({ ...generalData, announcement_active: checked })}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text block">Teks Pengumuman</label>
                                    <input
                                        type="text"
                                        value={generalData.announcement_text}
                                        onChange={(e) => setGeneralData({ ...generalData, announcement_text: e.target.value })}
                                        className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                                        placeholder="Promo Spesial Akhir Pekan! Diskon 20% untuk semua akun Netflix."
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text block">Tautan / Link Tujuan (Opsional)</label>
                                    <input
                                        type="url"
                                        value={generalData.announcement_url}
                                        onChange={(e) => setGeneralData({ ...generalData, announcement_url: e.target.value })}
                                        className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Estimasi & Statistik */}
                        <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
                            <div className="border-b border-border pb-3">
                                <h2 className="text-sm font-bold text-text flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-accent-text" />
                                    <span>Estimasi Pengiriman & Angka Terjual</span>
                                </h2>
                                <p className="text-xs text-text-3 mt-0.5">
                                    Atur perkiraan waktu proses pesanan dan angka minimal tampilan penjualan produk.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text block">
                                        Estimasi Waktu Pengiriman
                                    </label>
                                    <input
                                        type="text"
                                        value={generalData.delivery_eta}
                                        onChange={(e) => setGeneralData({ ...generalData, delivery_eta: e.target.value })}
                                        className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                                        placeholder="10 - 30 Menit"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text block">
                                        Minimal Angka Penjualan Ditampilkan (Min Sold)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={generalData.min_sold_display}
                                        onChange={(e) => setGeneralData({ ...generalData, min_sold_display: Number(e.target.value) })}
                                        className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text focus:outline-none focus:border-accent font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Panduan Ukuran Gambar */}
                        <ImageGuideCard />
                    </div>
                )}

                {/* TAB 5: NOTIFIKASI TELEGRAM */}
                {activeTab === 'telegram' && (
                    <div className="space-y-6">
                        <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
                            <div className="border-b border-border pb-3 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-text flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-accent-text" />
                                        <span>Integrasi Notifikasi Bot Telegram</span>
                                    </h2>
                                    <p className="text-xs text-text-3 mt-0.5">
                                        Terima notifikasi instan di Telegram saat ada pesanan masuk, konfirmasi pembayaran, atau stok menipis.
                                    </p>
                                </div>
                                <Switch
                                    checked={generalData.telegram_active}
                                    onCheckedChange={(checked) => setGeneralData({ ...generalData, telegram_active: checked })}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-text block">
                                        Telegram Bot Token
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showToken ? 'text' : 'password'}
                                            value={generalData.telegram_bot_token}
                                            onChange={(e) => setGeneralData({ ...generalData, telegram_bot_token: e.target.value })}
                                            className="w-full h-9 px-3 pr-10 text-xs bg-surface-2 border border-border rounded-lg text-text focus:outline-none focus:border-accent font-mono"
                                            placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowToken(!showToken)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-3 hover:text-text cursor-pointer"
                                        >
                                            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <span className="text-[11px] text-text-3 block">Dapatkan token dengan membuat bot via @BotFather di Telegram.</span>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-text block">
                                            Telegram Chat ID
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleDetectChatId}
                                            disabled={isDetectingChatId || !generalData.telegram_bot_token}
                                            className="text-xs text-accent-text font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${isDetectingChatId ? 'animate-spin' : ''}`} />
                                            <span>{isDetectingChatId ? 'Mendeteksi...' : 'Deteksi Chat ID Otomatis'}</span>
                                        </button>
                                    </div>

                                    <input
                                        type="text"
                                        value={generalData.telegram_chat_id}
                                        onChange={(e) => setGeneralData({ ...generalData, telegram_chat_id: e.target.value })}
                                        className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text focus:outline-none focus:border-accent font-mono"
                                        placeholder="123456789 atau -1001234567890"
                                    />

                                    {detectFeedback && (
                                        <div className={`p-2.5 rounded-lg text-xs mt-1.5 flex items-start gap-2 ${
                                            detectFeedback.type === 'success'
                                                ? 'bg-accent/10 border border-accent/30 text-accent-text'
                                                : 'bg-danger/10 border border-danger/30 text-danger'
                                        }`}>
                                            {detectFeedback.type === 'success' ? <Check className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                                            <span>{detectFeedback.message}</span>
                                        </div>
                                    )}

                                    {detectedChats.length > 1 && (
                                        <div className="p-3 bg-surface-2 border border-border rounded-xl space-y-2 mt-2">
                                            <span className="text-xs font-bold text-text block">Pilih Obrolan:</span>
                                            {detectedChats.map((c) => (
                                                <div key={c.id} className="flex items-center justify-between text-xs p-2 bg-surface rounded-lg border border-border">
                                                    <div>
                                                        <span className="font-semibold text-text">{c.name}</span>
                                                        <span className="text-text-3 font-mono ml-2">({c.id})</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => {
                                                            setGeneralData((prev) => ({ ...prev, telegram_chat_id: String(c.id) }));
                                                            setDetectedChats([]);
                                                        }}
                                                    >
                                                        Gunakan
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleTestTelegram}
                                        disabled={isTestingTelegram || !generalData.telegram_bot_token || !generalData.telegram_chat_id}
                                        loading={isTestingTelegram}
                                        className="cursor-pointer"
                                    >
                                        <Send className="w-3.5 h-3.5 mr-1.5" />
                                        <span>Kirim Pesan Uji Coba</span>
                                    </Button>

                                    {testFeedback && (
                                        <div className={`text-xs flex items-center gap-1.5 ${
                                            testFeedback.type === 'success' ? 'text-accent-text' : 'text-danger'
                                        }`}>
                                            {testFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                                            <span>{testFeedback.message}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom Action Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-surface border border-border rounded-xl shadow-xs">
                    <span className="text-xs text-text-3 text-center sm:text-left">
                        Klik tombol di samping untuk menyimpan seluruh perubahan pengaturan toko.
                    </span>
                    <Button
                        type="button"
                        onClick={() => handleSaveGeneral()}
                        disabled={isSavingGeneral}
                        loading={isSavingGeneral}
                        className="w-full sm:w-auto cursor-pointer"
                    >
                        <Save className="w-4 h-4 mr-1.5" />
                        <span>Simpan Pengaturan</span>
                    </Button>
                </div>
            </div>
        </AdminLayout>
    );
}
