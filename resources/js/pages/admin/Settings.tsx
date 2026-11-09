import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/admin/PageHeader';
import { FormSection } from '@/components/admin/FormSection';
import { ImageGuideCard } from '@/components/admin/ImageGuideCard';
import { Switch } from '@/components/ui/switch';
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
    Image as ImageIcon
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

export default function AdminSettings({ settings, overrides, telegramConfigured }: SettingsProps) {
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
    const [activeSection, setActiveSection] = useState('identitas');

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

    // Track if general form is dirty
    const isDirty = useMemo(() => {
        if (generalData.store_logo !== null || generalData.remove_logo) return true;
        if (generalData.max_daily_rent_quota !== (settings.max_daily_rent_quota || 3)) return true;
        if (generalData.admin_whatsapp !== (settings.admin_whatsapp || '')) return true;
        if (generalData.business_hours !== (settings.business_hours || '')) return true;
        if (generalData.store_name !== (settings.store_name || '')) return true;
        if (generalData.store_tagline !== (settings.store_tagline || '')) return true;
        if (generalData.delivery_eta !== (settings.delivery_eta || '')) return true;
        if (generalData.min_sold_display !== (settings.min_sold_display ?? 5)) return true;
        if (generalData.stats_min_orders !== (settings.stats_min_orders ?? 20)) return true;
        if (generalData.custom_request_enabled !== Boolean(settings.custom_request_enabled)) return true;
        if (generalData.announcement_text !== (settings.announcement_text || '')) return true;
        if (generalData.announcement_url !== (settings.announcement_url || '')) return true;
        if (generalData.announcement_active !== Boolean(settings.announcement_active)) return true;
        if (generalData.accent_preset !== (settings.accent_preset || 'emerald')) return true;
        if (generalData.social_links.telegram !== (settings.social_links?.telegram || '')) return true;
        if (generalData.social_links.instagram !== (settings.social_links?.instagram || '')) return true;
        if (generalData.social_links.threads !== (settings.social_links?.threads || '')) return true;
        if (generalData.social_links.tiktok !== (settings.social_links?.tiktok || '')) return true;
        if (generalData.telegram_active !== Boolean(settings.telegram_active)) return true;
        if (generalData.telegram_chat_id !== (settings.telegram_chat_id || '')) return true;
        if (generalData.telegram_bot_token !== (settings.telegram_token_masked || '') && generalData.telegram_bot_token.trim() !== '') return true;
        return false;
    }, [generalData, settings]);

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
                    handleApplyDetectedChatId(data.chats[0].id);
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
                setDetectedChats([]);
                setDetectFeedback({
                    type: 'error',
                    message: data.message || 'Tidak ditemukan obrolan Telegram baru.',
                });
            }
        } catch (err: any) {
            setDetectFeedback({
                type: 'error',
                message: 'Gagal mendeteksi Chat ID: ' + (err.message || 'Terjadi kesalahan jaringan.'),
            });
        } finally {
            setIsDetectingChatId(false);
        }
    };

    const handleApplyDetectedChatId = (chatId: string) => {
        const current = generalData.telegram_chat_id.trim();
        if (!current) {
            setGeneralData((prev) => ({ ...prev, telegram_chat_id: chatId }));
        } else {
            const list = current.split('\n').map((s) => s.trim()).filter(Boolean);
            if (!list.includes(chatId)) {
                list.push(chatId);
                setGeneralData((prev) => ({ ...prev, telegram_chat_id: list.join('\n') }));
            }
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
                    message: data.message || 'Pesan tes berhasil dikirim ke bot Telegram Anda!',
                });
            } else {
                setTestFeedback({
                    type: 'error',
                    message: data.message || 'Gagal mengirim pesan tes ke Telegram.',
                });
            }
        } catch (err: any) {
            setTestFeedback({
                type: 'error',
                message: 'Gagal mengirim pesan: ' + (err.message || 'Terjadi kesalahan.'),
            });
        } finally {
            setIsTestingTelegram(false);
        }
    };

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const sections = [
        { id: 'identitas', label: 'Identitas Toko', icon: Store },
        { id: 'panduan-gambar', label: 'Panduan Gambar', icon: ImageIcon },
        { id: 'kuota', label: 'Kuota Sewa', icon: Calendar },
        { id: 'notifikasi', label: 'Notifikasi', icon: Send },
        { id: 'katalog', label: 'Tampilan Katalog', icon: ShoppingBag },
        { id: 'sosial', label: 'Media Sosial', icon: Share2 },
    ];

    return (
        <AdminLayout>
            <Head title="Pengaturan Toko - Admin" />

            <div className="space-y-6">
                <PageHeader
                    title="Pengaturan Toko"
                    description="Kelola identitas toko, tema warna, batasan kuota sewa harian, dan integrasi notifikasi."
                >
                    <button
                        type="button"
                        onClick={() => handleSaveGeneral()}
                        disabled={isSavingGeneral}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                            isDirty 
                                ? 'bg-accent text-on-accent hover:bg-accent-hover shadow-sm ring-2 ring-accent/30' 
                                : 'bg-surface-2 text-text-2 border border-border hover:text-text'
                        }`}
                    >
                        <Save className="w-4 h-4" />
                        <span>{isSavingGeneral ? 'Menyimpan...' : isDirty ? 'Simpan Perubahan' : 'Tersimpan'}</span>
                    </button>
                </PageHeader>

                {/* Section Navigation Tabs for Mobile (< 1024px) */}
                <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
                    {sections.map((s) => {
                        const Icon = s.icon;
                        const active = activeSection === s.id;
                        return (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => scrollToSection(s.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                                    active
                                        ? 'bg-accent text-on-accent font-semibold'
                                        : 'bg-surface-2 text-text-2 hover:text-text border border-border'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{s.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Two-Column Grid: Sidebar Links (Desktop) + Form Content */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    {/* Left Sticky Nav for Desktop (>= 1024px) */}
                    <aside className="hidden lg:block w-52 shrink-0 sticky top-20 space-y-1 bg-surface border border-border rounded-lg p-2">
                        <div className="px-3 py-1.5 text-[11px] font-semibold text-text-2 uppercase tracking-wider">
                            Bagian Pengaturan
                        </div>
                        {sections.map((s) => {
                            const Icon = s.icon;
                            const active = activeSection === s.id;
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => scrollToSection(s.id)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors text-left cursor-pointer ${
                                        active
                                            ? 'bg-surface-2 text-text font-semibold border-l-2 border-accent'
                                            : 'text-text-2 hover:text-text hover:bg-surface-hover'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-accent-text' : 'text-text-2'}`} />
                                    <span>{s.label}</span>
                                </button>
                            );
                        })}
                    </aside>

                    {/* Main Settings Sections */}
                    <div className="flex-1 w-full space-y-6">
                        <form onSubmit={handleSaveGeneral} className="space-y-6">
                            {/* 1. BAGIAN IDENTITAS */}
                            <FormSection
                                id="identitas"
                                title="Identitas Toko & BrandMark"
                                description="Nama, logo, dan informasi kontak layanan pelanggan yang tampil di storefront."
                            >
                                {/* Store Name */}
                                <div>
                                    <label className="text-xs font-medium text-text block mb-1">
                                        Nama Toko (BrandMark)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="StreamPoint (kosongkan untuk default sistem)"
                                        value={generalData.store_name}
                                        onChange={(e) => setGeneralData({ ...generalData, store_name: e.target.value })}
                                        className="w-full h-9 px-3 bg-surface-2 border border-border rounded-md text-xs text-text focus:outline-none focus:border-accent"
                                    />
                                    <span className="text-[11px] text-text-2 mt-1 block">
                                        Tampil pada header, footer, judul tab peramban, dan panel admin.
                                    </span>
                                </div>

                                {/* Store Tagline */}
                                <div>
                                    <label className="text-xs font-medium text-text block mb-1">
                                        Tagline Toko (Maks 60 Karakter)
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={60}
                                        placeholder="Contoh: Akun Premium Cepat, Aman & Bergaransi"
                                        value={generalData.store_tagline}
                                        onChange={(e) => setGeneralData({ ...generalData, store_tagline: e.target.value })}
                                        className="w-full h-9 px-3 bg-surface-2 border border-border rounded-md text-xs text-text focus:outline-none focus:border-accent"
                                    />
                                    <span className="text-[11px] text-text-2 mt-1 block">
                                        Tampil di samping BrandMark logo toko pada header desktop dan footer.
                                    </span>
                                </div>

                                {/* WhatsApp Admin */}
                                <div>
                                    <label className="text-xs font-medium text-text block mb-1 flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-text-2" />
                                        <span>Nomor WhatsApp Admin (Bantuan & CS)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 6281234567890"
                                        value={generalData.admin_whatsapp}
                                        onChange={(e) => setGeneralData({ ...generalData, admin_whatsapp: e.target.value })}
                                        className="w-full h-9 px-3 bg-surface-2 border border-border rounded-md text-xs text-text focus:outline-none focus:border-accent font-mono"
                                    />
                                    <span className="text-[11px] text-text-2 mt-1 block">
                                        Digunakan untuk tautan bantuan WhatsApp di invoice, storefront, dan footer.
                                    </span>
                                </div>

                                {/* Business Hours */}
                                <div>
                                    <label className="text-xs font-medium text-text block mb-1 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-text-2" />
                                        <span>Jam Operasional Toko</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Setiap hari, 09.00 - 21.00 WIB"
                                        value={generalData.business_hours}
                                        onChange={(e) => setGeneralData({ ...generalData, business_hours: e.target.value })}
                                        className="w-full h-9 px-3 bg-surface-2 border border-border rounded-md text-xs text-text focus:outline-none focus:border-accent"
                                    />
                                    <span className="text-[11px] text-text-2 mt-1 block">
                                        Ditampilkan pada footer semua halaman publik.
                                    </span>
                                </div>

                                {/* Store Logo */}
                                <div>
                                    <label className="text-xs font-medium text-text block mb-1">
                                        Logo Toko (JPG/PNG/WEBP, Maks 1MB)
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-md bg-surface-2 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo Toko" className="w-full h-full object-contain p-1" />
                                            ) : (
                                                <>
                                                    <img src="/brand/logo-icon-light.svg" alt="StreamPoint" className="dark:hidden w-7 h-7 object-contain" />
                                                    <img src="/brand/logo-icon-dark.svg" alt="StreamPoint" className="hidden dark:block w-7 h-7 object-contain" />
                                                </>
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
                                                    className="text-[11px] text-danger hover:underline inline-flex items-center gap-1 cursor-pointer"
                                                >
                                                    <X className="w-3 h-3" />
                                                    <span>Hapus logo (gunakan teks inisial)</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </FormSection>

                            {/* PANDUAN STANDAR UKURAN GAMBAR */}
                            <div id="panduan-gambar" className="pt-2">
                                <ImageGuideCard />
                            </div>

                            {/* 2. BAGIAN KUOTA SEWA */}
                            <FormSection
                                id="kuota"
                                title="Kuota Sewa Harian Global"
                                description="Aturan batas pesanan harian untuk paket sewa akun di seluruh toko."
                            >
                                <div>
                                    <label className="text-xs font-medium text-text block mb-1">
                                        Kuota Sewa Harian Default
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={generalData.max_daily_rent_quota}
                                        onChange={(e) => setGeneralData({ ...generalData, max_daily_rent_quota: Number(e.target.value) })}
                                        className="w-full max-w-xs h-9 px-3 bg-surface-2 border border-border rounded-md text-xs text-text focus:outline-none focus:border-accent font-mono"
                                        required
                                    />
                                    <span className="text-[11px] text-text-2 mt-1 block">
                                        Batas maksimal pesanan sewa aktif per hari (reset otomatis setiap 00:00 WIB).
                                    </span>
                                </div>
                            </FormSection>

                            {/* 3. BAGIAN NOTIFIKASI */}
                            <div id="notifikasi" className="space-y-4 pt-2">
                                {/* Peringatan Privasi Data Pelanggan */}
                                <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                                    <div className="space-y-1 min-w-0">
                                        <h4 className="text-xs font-bold text-text">Peringatan Privasi Data Pelanggan</h4>
                                        <p className="text-xs text-text-2 leading-relaxed">
                                            Pesan notifikasi memuat rincian transaksi dan data pemesan. Pastikan bot hanya mengirim ke chat pribadi admin atau grup privat internal pengelola toko, jangan hubungkan ke grup atau channel publik.
                                        </p>
                                    </div>
                                </div>

                                {/* Integrasi Bot Telegram Card */}
                                <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-6">
                                    {/* Header: Title + Subtitle on Left, Switch on Right */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                                        <div>
                                            <h3 className="text-base font-bold text-text flex items-center gap-2">
                                                <Send className="w-4 h-4 text-accent-text" />
                                                <span>Integrasi Bot Telegram</span>
                                            </h3>
                                            <p className="text-xs text-text-2 mt-1">
                                                Kirim notifikasi otomatis secara real-time ke Telegram admin tanpa perlu selalu membuka website.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <label htmlFor="telegram_active" className="text-xs font-semibold text-text cursor-pointer select-none">
                                                Aktifkan Notifikasi Telegram
                                            </label>
                                            <Switch
                                                id="telegram_active"
                                                checked={generalData.telegram_active}
                                                onCheckedChange={(checked) => setGeneralData({ ...generalData, telegram_active: checked })}
                                                showStateLabel={false}
                                            />
                                        </div>
                                    </div>

                                    {/* Panduan Menyiapkan Bot Telegram */}
                                    <div className="p-4 bg-surface-2 border border-border rounded-lg space-y-2.5">
                                        <h4 className="text-xs font-bold text-text">Panduan Menyiapkan Bot Telegram:</h4>
                                        <ol className="text-xs text-text-2 space-y-2 list-decimal list-inside leading-relaxed">
                                            <li>
                                                Buka Telegram, cari <span className="font-mono text-accent-text font-semibold">@BotFather</span>, lalu kirim perintah <code className="px-1.5 py-0.5 bg-surface border border-border rounded text-[11px] font-mono text-text">/newbot</code>.
                                            </li>
                                            <li>
                                                Beri nama dan username bot, lalu salin token API yang diberikan dan tempelkan ke kolom <strong>Token Bot Telegram</strong> di bawah.
                                            </li>
                                            <li>
                                                Buka bot baru Anda di Telegram, tekan tombol <strong>Start</strong> (atau kirim <code className="px-1.5 py-0.5 bg-surface border border-border rounded text-[11px] font-mono text-text">/start</code>). Jika untuk grup, masukkan bot ke grup tersebut.
                                            </li>
                                            <li>
                                                Klik tombol <strong>Deteksi Chat ID</strong> di bawah untuk memilih ID obrolan secara instan (dapat digunakan langsung dengan token yang sedang diketik).
                                            </li>
                                            <li>
                                                Tekan tombol <strong>Kirim Pesan Tes ke Telegram</strong> untuk memverifikasi, lalu klik <strong>Simpan Perubahan</strong> di bagian atas halaman.
                                            </li>
                                        </ol>
                                    </div>

                                    {/* Form Fields: 2 Columns */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                                        {/* Kolom 1: TOKEN BOT TELEGRAM */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-text uppercase tracking-wider block">
                                                Token Bot Telegram
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showToken ? 'text' : 'password'}
                                                    value={generalData.telegram_bot_token}
                                                    onChange={(e) => setGeneralData({ ...generalData, telegram_bot_token: e.target.value })}
                                                    placeholder={settings.telegram_has_token ? '••••••••••••••••••••' : 'Contoh: 123456789:ABCdef...'}
                                                    className="w-full h-10 px-3 pr-10 bg-surface-2 border border-border rounded-md text-xs text-text font-mono focus:outline-none focus:border-accent [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowToken(!showToken)}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-2 hover:text-text rounded transition-colors cursor-pointer"
                                                    title={showToken ? 'Sembunyikan token' : 'Tampilkan token'}
                                                    aria-label={showToken ? 'Sembunyikan token' : 'Tampilkan token'}
                                                >
                                                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-text-3 leading-relaxed">
                                                Disimpan secara terenkripsi di server (Crypt/AES). Nilai tersamar tidak ditampilkan ulang untuk keamanan.
                                            </p>
                                        </div>

                                        {/* Kolom 2: CHAT ID TUJUAN */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-text uppercase tracking-wider block">
                                                Chat ID Tujuan
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={generalData.telegram_chat_id}
                                                onChange={(e) => setGeneralData({ ...generalData, telegram_chat_id: e.target.value })}
                                                placeholder="Contoh: 7423806051&#10;-100123456789 (untuk grup)"
                                                className="w-full p-2.5 bg-surface-2 border border-border rounded-md text-xs text-text font-mono focus:outline-none focus:border-accent resize-none leading-relaxed"
                                            />
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
                                                <p className="text-[11px] text-text-3 leading-relaxed">
                                                    Satu atau beberapa Chat ID (pisahkan dengan baris baru). ID grup diawali tanda minus (-).
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={handleDetectChatId}
                                                    disabled={isDetectingChatId}
                                                    className="px-3 py-1.5 bg-surface border border-border hover:bg-surface-hover text-text text-xs font-semibold rounded-md transition-colors disabled:opacity-50 shrink-0 self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
                                                >
                                                    {isDetectingChatId ? (
                                                        <>
                                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                            <span>Mendeteksi...</span>
                                                        </>
                                                    ) : (
                                                        <span>Deteksi Chat ID</span>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Hasil Deteksi Obrolan */}
                                            {detectedChats.length > 0 && (
                                                <div className="mt-2.5 p-3 bg-surface border border-accent/40 rounded-lg space-y-2">
                                                    <div className="flex items-center justify-between text-xs font-semibold text-text">
                                                        <span className="flex items-center gap-1 text-accent-text">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>Obrolan Ditemukan ({detectedChats.length})</span>
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDetectedChats([])}
                                                            className="text-text-3 hover:text-text text-[11px] cursor-pointer"
                                                        >
                                                            Tutup
                                                        </button>
                                                    </div>
                                                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                                                        {detectedChats.map((chat) => (
                                                            <div
                                                                key={chat.id}
                                                                className="flex items-center justify-between p-2 bg-surface-2 hover:bg-surface-hover rounded text-xs transition-colors"
                                                            >
                                                                <div className="min-w-0 pr-2">
                                                                    <div className="font-semibold text-text truncate">
                                                                        {chat.name} {chat.username && <span className="text-text-3 font-normal font-mono">({chat.username})</span>}
                                                                    </div>
                                                                    <div className="text-[11px] font-mono text-text-2">
                                                                        ID: {chat.id} • {chat.type}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleApplyDetectedChatId(chat.id)}
                                                                    className="px-2.5 py-1 bg-accent text-on-accent text-[11px] font-semibold rounded hover:bg-accent-hover transition-colors shrink-0 cursor-pointer"
                                                                >
                                                                    Gunakan
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {detectFeedback && (
                                                <div className={`mt-2 p-2.5 rounded-md text-xs ${
                                                    detectFeedback.type === 'error'
                                                        ? 'bg-danger/10 text-danger border border-danger/30'
                                                        : 'bg-accent/10 text-accent-text border border-accent/30'
                                                }`}>
                                                    {detectFeedback.message}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Bar Bottom: Kirim Pesan Tes ke Telegram */}
                                    <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <button
                                            type="button"
                                            onClick={handleTestTelegram}
                                            disabled={isTestingTelegram}
                                            className="px-4 py-2 bg-surface border border-border hover:bg-surface-hover text-text text-xs font-semibold rounded-md transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer self-start"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            <span>{isTestingTelegram ? 'Mengirim pesan tes...' : 'Kirim Pesan Tes ke Telegram'}</span>
                                        </button>

                                        {testFeedback && (
                                            <div className={`text-xs font-medium px-3 py-1.5 rounded-md ${
                                                testFeedback.type === 'error' 
                                                    ? 'bg-danger/10 text-danger border border-danger/30' 
                                                    : 'bg-accent/10 text-accent-text border border-accent/30'
                                            }`}>
                                                {testFeedback.message}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 4. BAGIAN TAMPILAN KATALOG */}
                            <FormSection
                                id="katalog"
                                title="Tampilan Katalog & Etalase"
                                description="Warna aksen tema, bar pengumuman atas, estimasi pengiriman, dan etalase."
                            >
                                {/* Preset Aksen Warna */}
                                <div>
                                    <label className="text-xs font-medium text-text block mb-1.5 flex items-center gap-1.5">
                                        <Palette className="w-3.5 h-3.5 text-text-2" />
                                        <span>Preset Warna Aksen Toko (WCAG AA Teruji)</span>
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {ACCENT_PRESETS.map((p) => {
                                            const isSelected = generalData.accent_preset === p.id;
                                            return (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => setGeneralData({ ...generalData, accent_preset: p.id })}
                                                    className={`p-3 rounded-lg border text-left transition-colors flex items-start gap-3 cursor-pointer ${
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
                                                            <span className="font-semibold text-text text-xs">{p.label}</span>
                                                            {isSelected && <Check className="w-3.5 h-3.5 text-accent-text" />}
                                                        </div>
                                                        <span className="text-[11px] text-text-2 block truncate mt-0.5">{p.desc}</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Bar Pengumuman */}
                                <div className="p-3.5 bg-surface-2 border border-border rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-text flex items-center gap-1.5">
                                            <Megaphone className="w-3.5 h-3.5 text-accent-text" />
                                            <span>Bar Pengumuman Atas (Announcement Bar)</span>
                                        </span>
                                        <Switch
                                            checked={generalData.announcement_active}
                                            onCheckedChange={(checked) => setGeneralData({ ...generalData, announcement_active: checked })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-text block mb-1">
                                            Teks Pengumuman (Maks 160 Karakter)
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={160}
                                            placeholder="Contoh: Promo Spesial Liburan! Akun dikirim instan 5-10 menit."
                                            value={generalData.announcement_text}
                                            onChange={(e) => setGeneralData({ ...generalData, announcement_text: e.target.value })}
                                            className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs text-text focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-text block mb-1">
                                            Tautan Pengumuman (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={255}
                                            placeholder="Contoh: /p/netflix atau https://t.me/toko"
                                            value={generalData.announcement_url}
                                            onChange={(e) => setGeneralData({ ...generalData, announcement_url: e.target.value })}
                                            className="w-full h-9 px-3 bg-surface border border-border rounded-md text-xs text-text focus:outline-none focus:border-accent font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Ambang Terjual, Ambang Statistik & Estimasi */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-text block mb-1">
                                            Ambang Badge Terlaris
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={1000}
                                            value={generalData.min_sold_display}
                                            onChange={(e) => setGeneralData({ ...generalData, min_sold_display: Number(e.target.value) })}
                                            className="w-full h-9 px-3 bg-surface-2 border border-border rounded-md text-xs text-text focus:outline-none focus:border-accent font-mono"
                                            required
                                        />
                                        <span className="text-[11px] text-text-2 mt-1 block">
                                            Label "N terjual" muncul jika pesanan PAID &ge; ambang.
                                        </span>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-text block mb-1">
                                            Ambang Statistik Pesanan
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={1000}
                                            value={generalData.stats_min_orders}
                                            onChange={(e) => setGeneralData({ ...generalData, stats_min_orders: Number(e.target.value) })}
                                            className="w-full h-9 px-3 bg-surface-2 border border-border rounded-md text-xs text-text focus:outline-none focus:border-accent font-mono"
                                            required
                                        />
                                        <span className="text-[11px] text-text-2 mt-1 block">
                                            Batas minimum pesanan selesai (0 = sembunyikan).
                                        </span>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-text block mb-1">
                                            Estimasi Pengiriman
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={60}
                                            placeholder="Contoh: 5-15 menit setelah bayar"
                                            value={generalData.delivery_eta}
                                            onChange={(e) => setGeneralData({ ...generalData, delivery_eta: e.target.value })}
                                            className="w-full h-9 px-3 bg-surface-2 border border-border rounded-md text-xs text-text focus:outline-none focus:border-accent"
                                        />
                                        <span className="text-[11px] text-text-2 mt-1 block">
                                            Tampil pada ringkasan etalase & halaman detail.
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-border flex items-center justify-between">
                                    <div>
                                        <span className="text-xs font-medium text-text block">Ajakan Pesanan Custom</span>
                                        <span className="text-[11px] text-text-2">
                                            Tampilkan kartu ajakan request layanan custom di atas footer etalase.
                                        </span>
                                    </div>
                                    <Switch
                                        checked={generalData.custom_request_enabled}
                                        onCheckedChange={(checked) => setGeneralData({ ...generalData, custom_request_enabled: checked })}
                                    />
                                </div>
                            </FormSection>

                            {/* 5. BAGIAN SOSIAL */}
                            <FormSection
                                id="sosial"
                                title="Tautan Media Sosial Toko"
                                description="Tautan saluran publik toko pada footer etalase (hanya HTTPS)."
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-text block mb-1">Telegram</label>
                                        <input
                                            type="url"
                                            placeholder="https://t.me/namachannel"
                                            value={generalData.social_links.telegram}
                                            onChange={(e) => setGeneralData({
                                                ...generalData,
                                                social_links: { ...generalData.social_links, telegram: e.target.value },
                                            })}
                                            className="w-full h-9 px-3 bg-surface-2 border border-border rounded-md text-xs text-text focus:outline-none focus:border-accent font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-text block mb-1">Instagram</label>
                                        <input
                                            type="url"
                                            placeholder="https://instagram.com/username"
                                            value={generalData.social_links.instagram}
                                            onChange={(e) => setGeneralData({
                                                ...generalData,
                                                social_links: { ...generalData.social_links, instagram: e.target.value },
                                            })}
                                            className="w-full h-9 px-3 bg-surface-2 border border-border rounded-md text-xs text-text focus:outline-none focus:border-accent font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-text block mb-1">Threads</label>
                                        <input
                                            type="url"
                                            placeholder="https://threads.net/@username"
                                            value={generalData.social_links.threads}
                                            onChange={(e) => setGeneralData({
                                                ...generalData,
                                                social_links: { ...generalData.social_links, threads: e.target.value },
                                            })}
                                            className="w-full h-9 px-3 bg-surface-2 border border-border rounded-md text-xs text-text focus:outline-none focus:border-accent font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-text block mb-1">TikTok</label>
                                        <input
                                            type="url"
                                            placeholder="https://tiktok.com/@username"
                                            value={generalData.social_links.tiktok}
                                            onChange={(e) => setGeneralData({
                                                ...generalData,
                                                social_links: { ...generalData.social_links, tiktok: e.target.value },
                                            })}
                                            className="w-full h-9 px-3 bg-surface-2 border border-border rounded-md text-xs text-text focus:outline-none focus:border-accent font-mono"
                                        />
                                    </div>
                                </div>
                            </FormSection>

                            {/* Tombol Simpan Standar Form */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSavingGeneral}
                                    className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded-md transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{isSavingGeneral ? 'Menyimpan Pengaturan...' : 'Simpan Semua Pengaturan'}</span>
                                </button>
                            </div>
                        </form>

                        {/* Override Kuota Spesifik Per Tanggal */}
                        <FormSection
                            title="Override Kuota Tanggal Tertentu"
                            description="Ubah kuota sewa untuk tanggal tertentu (misalnya dinaikkan saat libur, atau set 0 untuk menutup sewa)."
                        >
                            {/* Form Input Override Baru */}
                            <form onSubmit={handleSaveOverride} className="p-3.5 bg-surface-2 border border-border rounded-lg space-y-3">
                                <div className="text-xs font-semibold text-text flex items-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5 text-accent-text" />
                                    <span>Tambah / Ubah Override Tanggal</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-text block mb-1">Tanggal (WIB)</label>
                                        <input
                                            type="date"
                                            value={overrideData.date}
                                            onChange={(e) => setOverrideData({ ...overrideData, date: e.target.value })}
                                            className="w-full h-8 px-2.5 bg-surface border border-border rounded-md text-xs text-text focus:outline-none focus:border-accent font-mono"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-text block mb-1">Kuota (0 = Tutup)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={overrideData.max_quota}
                                            onChange={(e) => setOverrideData({ ...overrideData, max_quota: Number(e.target.value) })}
                                            className="w-full h-8 px-2.5 bg-surface border border-border rounded-md text-xs text-text focus:outline-none focus:border-accent font-mono"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-text block mb-1">Catatan Internal (Opsional)</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Libur nasional, sewa ditutup"
                                        value={overrideData.note}
                                        onChange={(e) => setOverrideData({ ...overrideData, note: e.target.value })}
                                        className="w-full h-8 px-2.5 bg-surface border border-border rounded-md text-xs text-text focus:outline-none focus:border-accent"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSavingOverride}
                                    className="w-full py-1.5 bg-surface hover:bg-surface-hover border border-border text-text text-xs font-semibold rounded-md transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{isSavingOverride ? 'Menyimpan...' : 'Simpan Override Tanggal'}</span>
                                </button>
                            </form>

                            {/* Daftar Override */}
                            <div className="space-y-2 pt-2">
                                <h3 className="text-xs font-semibold text-text">Daftar Tanggal yang Di-override:</h3>
                                {overrides.length === 0 ? (
                                    <p className="text-xs text-text-2 italic">
                                        Belum ada override tanggal khusus. Kuota harian selalu mengikuti nilai default ({settings.max_daily_rent_quota}).
                                    </p>
                                ) : (
                                    <div className="border border-border rounded-lg overflow-hidden">
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
                                                                className="text-text-2 hover:text-danger transition-colors p-1 cursor-pointer"
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
                        </FormSection>
                    </div>
                </div>

                {/* Sticky Save Bar / Button saat ada perubahan (isDirty) */}
                {isDirty && (
                    <div className="sticky bottom-4 z-40 flex justify-end">
                        <div className="bg-surface/95 backdrop-blur-sm border border-accent p-2 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                            <span className="text-xs text-text font-medium pl-2 hidden sm:inline">
                                Ada perubahan pengaturan yang belum disimpan
                            </span>
                            <button
                                type="button"
                                onClick={() => handleSaveGeneral()}
                                disabled={isSavingGeneral}
                                className="px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                            >
                                <Save className="w-4 h-4" />
                                <span>{isSavingGeneral ? 'Menyimpan...' : 'Simpan Sekarang'}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
