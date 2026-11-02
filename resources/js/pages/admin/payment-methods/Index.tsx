import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { 
    CreditCard, 
    Plus, 
    Edit2, 
    Trash2, 
    QrCode, 
    Check, 
    X, 
    AlertCircle, 
    Upload, 
    Image as ImageIcon,
    ExternalLink
} from 'lucide-react';

interface PaymentMethodItem {
    id: number;
    type: 'QRIS' | 'BANK' | 'EWALLET';
    type_label: string;
    label: string;
    account_number?: string | null;
    account_holder?: string | null;
    instructions?: string | null;
    qris_image_path?: string | null;
    is_active: boolean;
    sort_order: number;
    orders_count: number;
    has_orders: boolean;
}

interface IndexProps {
    paymentMethods: PaymentMethodItem[];
    types: { value: string; label: string }[];
}

export default function PaymentMethodsIndex({ paymentMethods, types }: IndexProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethodItem | null>(null);
    const [deleteModalMethod, setDeleteModalMethod] = useState<PaymentMethodItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [previewQrUrl, setPreviewQrUrl] = useState<string | null>(null);

    const form = useForm<{
        _method?: string;
        type: 'QRIS' | 'BANK' | 'EWALLET';
        label: string;
        account_number: string;
        account_holder: string;
        instructions: string;
        is_active: boolean;
        sort_order: number;
        qris_image: File | null;
    }>({
        type: 'QRIS',
        label: '',
        account_number: '',
        account_holder: '',
        instructions: '',
        is_active: true,
        sort_order: 0,
        qris_image: null,
    });

    const openCreateModal = () => {
        setEditingMethod(null);
        form.reset();
        form.setData({
            type: 'QRIS',
            label: '',
            account_number: '',
            account_holder: '',
            instructions: '',
            is_active: true,
            sort_order: paymentMethods.length,
            qris_image: null,
        });
        setPreviewQrUrl(null);
        setIsModalOpen(true);
    };

    const openEditModal = (pm: PaymentMethodItem) => {
        setEditingMethod(pm);
        form.setData({
            _method: 'put',
            type: pm.type,
            label: pm.label,
            account_number: pm.account_number || '',
            account_holder: pm.account_holder || '',
            instructions: pm.instructions || '',
            is_active: pm.is_active,
            sort_order: pm.sort_order,
            qris_image: null,
        });
        setPreviewQrUrl(pm.qris_image_path || null);
        setIsModalOpen(true);
    };

    const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setData('qris_image', file);
            setPreviewQrUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingMethod) {
            form.post(`/admin/payment-methods/${editingMethod.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    form.reset();
                },
            });
        } else {
            form.post('/admin/payment-methods', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    form.reset();
                },
            });
        }
    };

    const handleDelete = () => {
        if (!deleteModalMethod) return;
        setIsDeleting(true);
        router.delete(`/admin/payment-methods/${deleteModalMethod.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalMethod(null);
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Metode Pembayaran - Admin" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-accent-text" />
                            <span>Metode Pembayaran</span>
                        </h1>
                        <p className="text-xs text-text-2 mt-0.5">
                            Kelola channel pembayaran manual (QRIS statis, Bank Transfer, E-Wallet).
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded transition-colors self-start sm:self-auto cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Metode Pembayaran</span>
                    </button>
                </div>

                {/* List */}
                <div className="bg-surface border border-border rounded-lg overflow-hidden">
                    {paymentMethods.length === 0 ? (
                        <div className="p-8 text-center text-xs text-text-2 space-y-2">
                            <CreditCard className="w-8 h-8 text-text-3 mx-auto opacity-50" />
                            <p>Belum ada metode pembayaran yang terdaftar.</p>
                        </div>
                    ) : (
                        <>
                            {/* Table for Desktop */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-surface-2 border-b border-border text-text-2 uppercase text-[10px] tracking-wider font-semibold">
                                        <tr>
                                            <th className="px-4 py-3">Tipe</th>
                                            <th className="px-4 py-3">Label & Rekening</th>
                                            <th className="px-4 py-3 text-center">Gambar QRIS</th>
                                            <th className="px-4 py-3 text-center">Urutan</th>
                                            <th className="px-4 py-3 text-center">Dipakai Order</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                            <th className="px-4 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {paymentMethods.map((pm) => (
                                            <tr key={pm.id} className="hover:bg-surface-hover/60 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                                                        pm.type === 'QRIS'
                                                            ? 'bg-accent/15 text-accent-text border border-accent/30'
                                                            : pm.type === 'BANK'
                                                            ? 'bg-info/15 text-info border border-info/30'
                                                            : 'bg-warning/15 text-warning border border-warning/30'
                                                    }`}>
                                                        {pm.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-text">{pm.label}</div>
                                                    {pm.account_number && (
                                                        <div className="text-[11px] text-text-2 font-mono">
                                                            {pm.account_number} {pm.account_holder ? `(${pm.account_holder})` : ''}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {pm.qris_image_path ? (
                                                        <a 
                                                            href={pm.qris_image_path} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="inline-block w-8 h-8 rounded border border-border overflow-hidden hover:opacity-80 transition-opacity"
                                                            title="Lihat Gambar QRIS"
                                                        >
                                                            <img
                                                                src={pm.qris_image_path}
                                                                alt="QRIS"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </a>
                                                    ) : (
                                                        <span className="text-text-3 font-mono">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center font-mono text-text-2">
                                                    {pm.sort_order}
                                                </td>
                                                <td className="px-4 py-3 text-center font-mono text-text-2">
                                                    {pm.orders_count}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {pm.is_active ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/15 text-success border border-success/30">
                                                            Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-2 text-text-3 border border-border">
                                                            Nonaktif
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(pm)}
                                                            className="p-1.5 rounded hover:bg-surface-2 text-text-2 hover:text-text cursor-pointer"
                                                            title="Edit Metode"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>

                                                        {pm.has_orders ? (
                                                            <button
                                                                type="button"
                                                                disabled
                                                                className="p-1.5 rounded text-text-3 opacity-30 cursor-not-allowed"
                                                                title="Sudah digunakan oleh pesanan, tidak dapat dihapus (hanya dinonaktifkan)."
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleteModalMethod(pm)}
                                                                className="p-1.5 rounded hover:bg-danger/10 text-danger cursor-pointer"
                                                                title="Hapus Metode"
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

                            {/* Mobile Cards (375px) */}
                            <div className="md:hidden divide-y divide-border">
                                {paymentMethods.map((pm) => (
                                    <div key={pm.id} className="p-3.5 space-y-2.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                                        pm.type === 'QRIS'
                                                            ? 'bg-accent/15 text-accent-text border border-accent/30'
                                                            : pm.type === 'BANK'
                                                            ? 'bg-info/15 text-info border border-info/30'
                                                            : 'bg-warning/15 text-warning border border-warning/30'
                                                    }`}>
                                                        {pm.type}
                                                    </span>
                                                    <h3 className="font-semibold text-xs text-text">{pm.label}</h3>
                                                </div>
                                                {pm.account_number && (
                                                    <div className="text-[11px] text-text-2 font-mono">
                                                        {pm.account_number} {pm.account_holder ? `(${pm.account_holder})` : ''}
                                                    </div>
                                                )}
                                            </div>

                                            {pm.is_active ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/15 text-success border border-success/30">
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-2 text-text-3 border border-border">
                                                    Nonaktif
                                                </span>
                                            )}
                                        </div>

                                        {pm.qris_image_path && (
                                            <div className="flex items-center gap-2 text-xs text-text-2 bg-surface-2/60 p-2 rounded border border-border/50">
                                                <img src={pm.qris_image_path} alt="QRIS" className="w-8 h-8 rounded border border-border object-cover" />
                                                <span className="text-[11px]">QRIS Gambar Terunggah</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-xs text-text-3 pt-1">
                                            <div>
                                                Urutan: <span className="font-mono text-text-2">{pm.sort_order}</span> &bull; Order: <span className="font-mono text-text-2">{pm.orders_count}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(pm)}
                                                    className="px-2.5 py-1 text-xs font-semibold bg-surface-2 hover:bg-surface-hover text-text border border-border rounded"
                                                >
                                                    Edit
                                                </button>

                                                {pm.has_orders ? (
                                                    <span className="text-[11px] text-text-3 italic cursor-help" title="Sudah ada pesanan, tidak bisa dihapus.">
                                                        Terkunci
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteModalMethod(pm)}
                                                        className="px-2.5 py-1 text-xs font-semibold text-danger border border-danger/40 hover:bg-danger/10 rounded"
                                                    >
                                                        Hapus
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modal Tambah / Edit Metode Pembayaran */}
            {isModalOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div 
                        className="w-full max-w-md bg-surface border border-border-strong rounded-md p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                            <h3 className="text-sm font-bold text-text flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4 text-accent-text" />
                                <span>{editingMethod ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 text-text-2 hover:text-text"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {Object.keys(form.errors).length > 0 && (
                            <div className="p-2.5 bg-danger/10 border border-danger/30 rounded text-xs text-danger flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold block">Gagal menyimpan:</span>
                                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                        {Object.values(form.errors).map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                            {/* Type */}
                            <div className="space-y-1">
                                <label className="font-semibold text-text block">Tipe Pembayaran <span className="text-danger">*</span></label>
                                <select
                                    value={form.data.type}
                                    onChange={(e) => form.setData('type', e.target.value as any)}
                                    required
                                    className="w-full h-8 px-2 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                >
                                    <option value="QRIS">QRIS</option>
                                    <option value="BANK">Transfer Bank</option>
                                    <option value="EWALLET">E-Wallet</option>
                                </select>
                            </div>

                            {/* Label */}
                            <div className="space-y-1">
                                <label className="font-semibold text-text block">Label / Nama Channel <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    value={form.data.label}
                                    onChange={(e) => form.setData('label', e.target.value)}
                                    placeholder="Contoh: QRIS Semua Pembayaran / BCA Transfer / GoPay"
                                    required
                                    className="w-full h-8 px-2.5 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                />
                            </div>

                            {/* Account Number & Holder (for Bank / E-Wallet) */}
                            {form.data.type !== 'QRIS' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="font-semibold text-text block">Nomor Rekening / HP</label>
                                        <input
                                            type="text"
                                            value={form.data.account_number}
                                            onChange={(e) => form.setData('account_number', e.target.value)}
                                            placeholder="1234567890"
                                            className="w-full h-8 px-2.5 font-mono bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="font-semibold text-text block">Atas Nama</label>
                                        <input
                                            type="text"
                                            value={form.data.account_holder}
                                            onChange={(e) => form.setData('account_holder', e.target.value)}
                                            placeholder="Nama Pemilik"
                                            className="w-full h-8 px-2.5 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* QRIS Upload (for QRIS type) */}
                            {form.data.type === 'QRIS' && (
                                <div className="space-y-1.5">
                                    <label className="font-semibold text-text block">
                                        Gambar QR Code QRIS (Maks 2MB, JPG/PNG/WEBP)
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 rounded bg-surface-2 border border-border flex items-center justify-center shrink-0 overflow-hidden font-mono text-xs text-text-3">
                                            {previewQrUrl ? (
                                                <img src={previewQrUrl} alt="QRIS Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <QrCode className="w-5 h-5 text-text-3" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp"
                                                onChange={handleQrFileChange}
                                                className="block w-full text-xs text-text-2 file:mr-2.5 file:py-1 file:px-2.5 file:rounded file:border file:border-border file:text-xs file:font-semibold file:bg-surface-2 file:text-text hover:file:bg-surface-hover cursor-pointer"
                                            />
                                            <span className="text-[10px] text-text-3 block mt-0.5">
                                                Disimpan di disk public.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Instructions */}
                            <div className="space-y-1">
                                <label className="font-semibold text-text block">Instruksi Pembayaran <span className="text-text-3 font-normal">(opsional)</span></label>
                                <textarea
                                    value={form.data.instructions}
                                    onChange={(e) => form.setData('instructions', e.target.value)}
                                    rows={3}
                                    placeholder="Panduan cara transfer atau scan QRIS yang akan tampil di invoice pembeli..."
                                    className="w-full p-2.5 bg-surface-2 border border-border rounded text-text placeholder:text-text-3 focus:outline-none focus:border-accent resize-none"
                                />
                            </div>

                            {/* Sort Order */}
                            <div className="space-y-1">
                                <label className="font-semibold text-text block">Urutan Tampilan</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={form.data.sort_order}
                                    onChange={(e) => form.setData('sort_order', Number(e.target.value))}
                                    className="w-full h-8 px-2.5 font-mono bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                />
                            </div>

                            {/* Status Aktif */}
                            <div className="pt-2 border-t border-border flex items-center justify-between">
                                <span className="font-semibold text-text">Status Aktif</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.data.is_active}
                                        onChange={(e) => form.setData('is_active', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-success border border-border"></div>
                                </label>
                            </div>

                            {/* Submit */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-3 py-1.5 text-text-2 hover:text-text rounded cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-on-accent font-semibold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{form.processing ? 'Menyimpan...' : 'Simpan Metode'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus Metode */}
            {deleteModalMethod && (
                <div 
                    className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4"
                    onClick={() => setDeleteModalMethod(null)}
                >
                    <div 
                        className="w-full max-w-sm bg-surface border border-border-strong rounded-md p-5 shadow-xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-sm font-bold text-danger flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            <span>Hapus Metode Pembayaran</span>
                        </h3>
                        <p className="text-xs text-text-2">
                            Apakah Anda yakin ingin menghapus metode pembayaran <strong className="text-text font-semibold">{deleteModalMethod.label}</strong>?
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                            <button
                                type="button"
                                onClick={() => setDeleteModalMethod(null)}
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
