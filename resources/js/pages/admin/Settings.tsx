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
    Phone
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
    };
    overrides: QuotaOverride[];
    telegramConfigured: boolean;
}

export default function AdminSettings({ settings, overrides, telegramConfigured }: SettingsProps) {
    // General Settings Form state
    const [generalData, setGeneralData] = useState({
        max_daily_rent_quota: settings.max_daily_rent_quota || 3,
        admin_whatsapp: settings.admin_whatsapp || '',
        business_hours: settings.business_hours || '',
    });
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

    const handleSaveGeneral = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingGeneral(true);
        router.post('/admin/settings', generalData, {
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
                        Konfigurasi kuota sewa harian, jam kerja toko, nomor kontak, dan integrasi notifikasi bot Telegram.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Column 1: General Settings */}
                    <div className="space-y-6">
                        <div className="bg-surface border border-border rounded-md p-4 space-y-4">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-text-2 border-b border-border pb-2 flex items-center gap-1.5">
                                <SettingsIcon className="w-3.5 h-3.5 text-text-2" />
                                <span>Konfigurasi Umum & Kuota</span>
                            </h2>

                            <form onSubmit={handleSaveGeneral} className="space-y-4 text-xs">
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
                                        className="px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                        {isSavingGeneral ? 'Menyimpan...' : 'Simpan Pengaturan'}
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
                                    disabled={isTestingTelegram}
                                    className="px-3.5 py-2 bg-surface-2 hover:bg-surface-hover text-text border border-border text-xs font-semibold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <Send className="w-3.5 h-3.5 text-accent-text" />
                                    <span>{isTestingTelegram ? 'Mengirim Notifikasi...' : 'Tes Notifikasi Telegram'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Daily Quota Overrides */}
                    <div className="space-y-4">
                        <div className="bg-surface border border-border rounded-md p-4 space-y-4">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-text-2 border-b border-border pb-2 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-text-2" />
                                <span>Override Kuota Per Tanggal</span>
                            </h2>

                            <p className="text-xs text-text-2">
                                Atur kuota khusus untuk tanggal tertentu. Masukkan nilai <strong className="text-text font-mono">0</strong> untuk menutup sewa pada tanggal tersebut.
                            </p>

                            {/* Form Add Override */}
                            <form onSubmit={handleSaveOverride} className="p-3 bg-surface-2/60 border border-border rounded space-y-3 text-xs">
                                <div className="font-semibold text-text flex items-center gap-1">
                                    <Plus className="w-3.5 h-3.5 text-accent-text" />
                                    <span>Tambah / Ubah Override Tanggal</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="text-[11px] text-text-2 block mb-1">
                                            Tanggal (YYYY-MM-DD):
                                        </label>
                                        <input
                                            type="date"
                                            value={overrideData.date}
                                            onChange={(e) => setOverrideData({ ...overrideData, date: e.target.value })}
                                            className="w-full h-8 px-2.5 bg-surface border border-border rounded text-text focus:outline-none focus:border-accent font-mono text-xs"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] text-text-2 block mb-1">
                                            Batas Kuota (0 = Tutup Sewa):
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={overrideData.max_quota}
                                            onChange={(e) => setOverrideData({ ...overrideData, max_quota: Number(e.target.value) })}
                                            className="w-full h-8 px-2.5 bg-surface border border-border rounded text-text focus:outline-none focus:border-accent font-mono text-xs"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] text-text-2 block mb-1">
                                        Catatan (Opsional):
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Libur nasional, Promo weekend..."
                                        value={overrideData.note}
                                        onChange={(e) => setOverrideData({ ...overrideData, note: e.target.value })}
                                        className="w-full h-8 px-2.5 bg-surface border border-border rounded text-text focus:outline-none focus:border-accent text-xs"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSavingOverride || !overrideData.date}
                                    className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    {isSavingOverride ? 'Menyimpan...' : 'Simpan Override'}
                                </button>
                            </form>

                            {/* Table of Overrides */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold text-text">Daftar Override Aktif ({overrides.length})</h3>

                                {overrides.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-text-2 italic bg-surface-2/30 rounded border border-border">
                                        Belum ada override tanggal yang diatur.
                                    </div>
                                ) : (
                                    <div className="border border-border rounded overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-border bg-surface-2 text-text-2 uppercase text-[10px]">
                                                    <th className="py-2 px-3">Tanggal</th>
                                                    <th className="py-2 px-3">Kuota</th>
                                                    <th className="py-2 px-3">Catatan</th>
                                                    <th className="py-2 px-3 text-right">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {overrides.map((item) => (
                                                    <tr key={item.id} className="hover:bg-surface-hover">
                                                        <td className="py-2 px-3 font-mono font-medium text-text">
                                                            {item.date}
                                                        </td>
                                                        <td className="py-2 px-3">
                                                            {item.max_quota === 0 ? (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-danger/10 text-danger border border-danger/30">
                                                                    0 (Tutup Sewa)
                                                                </span>
                                                            ) : (
                                                                <span className="font-mono font-semibold text-text">
                                                                    {item.max_quota} slot
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-2 px-3 text-text-2 text-[11px]">
                                                            {item.note || '-'}
                                                        </td>
                                                        <td className="py-2 px-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteOverride(item.id)}
                                                                className="p-1 rounded text-text-2 hover:text-danger hover:bg-surface-hover transition-colors cursor-pointer"
                                                                title="Hapus override"
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
