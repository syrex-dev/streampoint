import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/admin/PageHeader';
import { 
    KeyRound, 
    Plus, 
    Upload, 
    Filter, 
    Eye, 
    EyeOff, 
    Trash2, 
    Check, 
    X, 
    AlertCircle, 
    Layers, 
    ChevronLeft, 
    ChevronRight,
    Copy,
    CheckCheck,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';

interface VariantSummary {
    id: number;
    name: string;
    type: 'RENT' | 'BUY';
}

interface ProductItem {
    id: number;
    name: string;
    variants: VariantSummary[];
}

interface AccountItem {
    id: number;
    product_id: number;
    product_name: string;
    variant_id: number | null;
    variant_name: string;
    kind: 'RENT' | 'BUY';
    credential: string;
    status: string;
    status_label: string;
    order_id: number | null;
    rented_until: string | null;
    note: string | null;
    created_at: string;
    can_edit_status: boolean;
    can_delete: boolean;
}

interface ProductSummary {
    id: number;
    name: string;
    available_rent: number;
    available_buy: number;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface AccountsIndexProps {
    accounts: {
        data: AccountItem[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    summary: ProductSummary[];
    products: ProductItem[];
    filters: {
        product_id: number | '';
        variant_id: number | '';
        kind: string;
        status: string;
    };
    statuses: { value: string; label: string }[];
}

export default function AccountsIndex({ accounts, summary, products, filters, statuses }: AccountsIndexProps) {
    const [selectedProductId, setSelectedProductId] = useState<number | ''>(filters.product_id);
    const [selectedVariantId, setSelectedVariantId] = useState<number | ''>(filters.variant_id);
    const [selectedKind, setSelectedKind] = useState(filters.kind);
    const [selectedStatus, setSelectedStatus] = useState(filters.status);

    // Credential visibility toggle per unit id
    const [visibleCredentials, setVisibleCredentials] = useState<Record<number, boolean>>({});
    const [copiedId, setCopiedId] = useState<number | null>(null);

    // Modal states
    const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [deleteModalAccount, setDeleteModalAccount] = useState<AccountItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Single account form
    const singleForm = useForm({
        product_id: products[0]?.id || '',
        variant_id: '' as number | '',
        kind: 'RENT',
        email: '',
        password: '',
        profile: '',
        pin: '',
        note: '',
    });

    // Bulk account form
    const bulkForm = useForm({
        product_id: products[0]?.id || '',
        variant_id: '' as number | '',
        kind: 'RENT',
        items_text: '',
    });

    const selectedProduct = React.useMemo(
        () => products.find((p) => p.id === selectedProductId),
        [products, selectedProductId]
    );

    const activeSingleProduct = React.useMemo(
        () => products.find((p) => p.id === Number(singleForm.data.product_id)),
        [products, singleForm.data.product_id]
    );

    const activeBulkProduct = React.useMemo(
        () => products.find((p) => p.id === Number(bulkForm.data.product_id)),
        [products, bulkForm.data.product_id]
    );

    const handleFilterChange = (
        newProduct: number | '',
        newVariant: number | '',
        newKind: string,
        newStatus: string
    ) => {
        router.get('/admin/accounts', {
            product_id: newProduct || undefined,
            variant_id: newVariant || undefined,
            kind: newKind || undefined,
            status: newStatus || undefined,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSingleProductChange = (productId: number) => {
        singleForm.setData((data) => ({
            ...data,
            product_id: productId,
            variant_id: '',
        }));
    };

    const handleSingleVariantChange = (variantId: number | '') => {
        const variant = activeSingleProduct?.variants.find((v) => v.id === variantId);
        singleForm.setData((data) => ({
            ...data,
            variant_id: variantId,
            kind: variant ? variant.type : data.kind,
        }));
    };

    const handleBulkProductChange = (productId: number) => {
        bulkForm.setData((data) => ({
            ...data,
            product_id: productId,
            variant_id: '',
        }));
    };

    const handleBulkVariantChange = (variantId: number | '') => {
        const variant = activeBulkProduct?.variants.find((v) => v.id === variantId);
        bulkForm.setData((data) => ({
            ...data,
            variant_id: variantId,
            kind: variant ? variant.type : data.kind,
        }));
    };

    const toggleVisibility = (id: number) => {
        setVisibleCredentials((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const copyToClipboard = (id: number, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleToggleStatus = (account: AccountItem) => {
        if (!account.can_edit_status) return;
        const targetStatus = account.status === 'AVAILABLE' ? 'DISABLED' : 'AVAILABLE';
        router.patch(`/admin/accounts/${account.id}/status`, {
            status: targetStatus,
        }, {
            preserveScroll: true,
        });
    };

    const handleDeleteAccount = () => {
        if (!deleteModalAccount) return;
        setIsDeleting(true);
        router.delete(`/admin/accounts/${deleteModalAccount.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalAccount(null);
            },
        });
    };

    const handleSingleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        singleForm.post('/admin/accounts', {
            onSuccess: () => {
                setIsSingleModalOpen(false);
                singleForm.reset('email', 'password', 'profile', 'pin', 'note');
            },
        });
    };

    const handleBulkSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        bulkForm.post('/admin/accounts/bulk', {
            onSuccess: () => {
                setIsBulkModalOpen(false);
                bulkForm.reset('items_text');
            },
        });
    };

    const renderStatusBadge = (status: string, label: string) => {
        switch (status) {
            case 'AVAILABLE':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/10 text-accent-text border border-accent/30">
                        {label}
                    </span>
                );
            case 'RESERVED':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/10 text-warning border border-warning/30">
                        {label}
                    </span>
                );
            case 'SOLD':
            case 'RENTED':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-info/10 text-info border border-info/30">
                        {label}
                    </span>
                );
            case 'DISABLED':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-2 text-text-muted border border-border">
                        {label}
                    </span>
                );
            default:
                return <span>{label}</span>;
        }
    };

    return (
        <AdminLayout>
            <Head title="Stok Akun - Admin" />

            <div className="space-y-6">
                <PageHeader
                    title="Stok Unit Akun"
                    description="Manajemen inventaris kredensial akun streaming (Sewa & Beli)."
                >
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsSingleModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 hover:bg-surface-hover text-text border border-border text-xs font-semibold rounded-md transition-colors cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-accent-text" />
                            <span>Tambah Satuan</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsBulkModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded-md transition-colors cursor-pointer"
                        >
                            <Upload className="w-4 h-4" />
                            <span>Impor Massal</span>
                        </button>
                    </div>
                </PageHeader>

                {/* Stock Summary per Product */}
                <div className="space-y-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-text-2">
                        Ringkasan Stok Tersedia (AVAILABLE)
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {summary.map((s) => (
                            <div 
                                key={s.id} 
                                onClick={() => {
                                    setSelectedProductId(s.id);
                                    setSelectedVariantId('');
                                    handleFilterChange(s.id, '', selectedKind, selectedStatus);
                                }}
                                className={`p-3 bg-surface border rounded-lg transition-colors cursor-pointer ${
                                    selectedProductId === s.id ? 'border-accent bg-surface-hover/80' : 'border-border hover:bg-surface-hover/50'
                                }`}
                            >
                                <div className="font-semibold text-xs text-text truncate mb-2">
                                    {s.name}
                                </div>
                                <div className="flex items-center justify-between text-xs font-mono">
                                    <div className="flex items-center gap-1 text-info">
                                        <span className="text-[10px] uppercase font-sans font-medium text-text-3">Sewa:</span>
                                        <span className="font-bold">{s.available_rent}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-accent-text">
                                        <span className="text-[10px] uppercase font-sans font-medium text-text-3">Beli:</span>
                                        <span className="font-bold">{s.available_buy}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="p-3.5 bg-surface border border-border rounded-lg flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-text-2 font-medium">
                        <Filter className="w-4 h-4 text-text-3" />
                        <span>Filter:</span>
                    </div>

                    {/* Filter Produk */}
                    <select
                        value={selectedProductId}
                        onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : '';
                            setSelectedProductId(val);
                            setSelectedVariantId('');
                            handleFilterChange(val, '', selectedKind, selectedStatus);
                        }}
                        className="h-8 px-2.5 text-xs bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                    >
                        <option value="">Semua Produk</option>
                        {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    {/* Filter Varian (aktif jika produk dipilih) */}
                    {selectedProduct && selectedProduct.variants.length > 0 && (
                        <select
                            value={selectedVariantId}
                            onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : '';
                                setSelectedVariantId(val);
                                handleFilterChange(selectedProductId, val, selectedKind, selectedStatus);
                            }}
                            className="h-8 px-2.5 text-xs bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                        >
                            <option value="">Semua Varian</option>
                            {selectedProduct.variants.map((v) => (
                                <option key={v.id} value={v.id}>{v.name} ({v.type})</option>
                            ))}
                        </select>
                    )}

                    {/* Filter Kind */}
                    <select
                        value={selectedKind}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSelectedKind(val);
                            handleFilterChange(selectedProductId, selectedVariantId, val, selectedStatus);
                        }}
                        className="h-8 px-2.5 text-xs bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                    >
                        <option value="">Semua Kategori (RENT / BUY)</option>
                        <option value="RENT">RENT (Sewa)</option>
                        <option value="BUY">BUY (Beli)</option>
                    </select>

                    {/* Filter Status */}
                    <select
                        value={selectedStatus}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSelectedStatus(val);
                            handleFilterChange(selectedProductId, selectedVariantId, selectedKind, val);
                        }}
                        className="h-8 px-2.5 text-xs bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                    >
                        <option value="">Semua Status</option>
                        {statuses.map((st) => (
                            <option key={st.value} value={st.value}>{st.label}</option>
                        ))}
                    </select>

                    {(selectedProductId !== '' || selectedVariantId !== '' || selectedKind !== '' || selectedStatus !== '') && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedProductId('');
                                setSelectedVariantId('');
                                setSelectedKind('');
                                setSelectedStatus('');
                                handleFilterChange('', '', '', '');
                            }}
                            className="text-xs text-danger hover:underline ml-auto"
                        >
                            Reset Filter
                        </button>
                    )}
                </div>

                {/* Units List */}
                <div className="bg-surface border border-border rounded-lg overflow-hidden">
                    {accounts.data.length === 0 ? (
                        <div className="p-8 text-center text-xs text-text-2 space-y-2">
                            <KeyRound className="w-8 h-8 text-text-3 mx-auto opacity-50" />
                            <p>Tidak ada unit akun yang sesuai dengan filter.</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-surface-2 border-b border-border text-text-2 uppercase text-[10px] tracking-wider font-semibold">
                                        <tr>
                                            <th className="px-4 py-3">ID & Produk</th>
                                            <th className="px-4 py-3">Jenis</th>
                                            <th className="px-4 py-3">Kredensial Akun</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                            <th className="px-4 py-3">Tautan Order</th>
                                            <th className="px-4 py-3">Catatan</th>
                                            <th className="px-4 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {accounts.data.map((acc) => {
                                            const isVisible = !!visibleCredentials[acc.id];
                                            return (
                                                <tr key={acc.id} className="hover:bg-surface-hover/60 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="font-mono text-text-3 text-[11px]">#{acc.id}</div>
                                                        <div className="font-semibold text-text">{acc.product_name}</div>
                                                        <div className="mt-0.5">
                                                            {acc.variant_id ? (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-2 text-accent-text border border-accent/20">
                                                                    {acc.variant_name}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-text-3 font-normal bg-surface-2/60 border border-border">
                                                                    Semua Varian
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                                                            acc.kind === 'RENT'
                                                                ? 'bg-info/15 text-info border border-info/30'
                                                                : 'bg-accent/15 text-accent-text border border-accent/30'
                                                        }`}>
                                                            {acc.kind}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2 font-mono">
                                                            {isVisible ? (
                                                                <span className="text-text font-medium select-all break-all">
                                                                    {acc.credential}
                                                                </span>
                                                            ) : (
                                                                <span className="text-text-3 tracking-widest select-none">
                                                                    ••••••••••••••••••••
                                                                </span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleVisibility(acc.id)}
                                                                className="p-1 rounded text-text-2 hover:text-text hover:bg-surface-2 cursor-pointer shrink-0"
                                                                title={isVisible ? 'Sembunyikan' : 'Tampilkan'}
                                                            >
                                                                {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                            </button>
                                                            {isVisible && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copyToClipboard(acc.id, acc.credential)}
                                                                    className="p-1 rounded text-text-2 hover:text-text hover:bg-surface-2 cursor-pointer shrink-0"
                                                                    title="Salin Kredensial"
                                                                >
                                                                    {copiedId === acc.id ? <CheckCheck className="w-3.5 h-3.5 text-accent-text" /> : <Copy className="w-3.5 h-3.5" />}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {renderStatusBadge(acc.status, acc.status_label)}
                                                    </td>
                                                    <td className="px-4 py-3 text-text-2">
                                                        {acc.order_id ? (
                                                            <Link
                                                                href={`/admin/orders/${acc.order_id}`}
                                                                className="font-mono text-accent-text hover:underline"
                                                            >
                                                                Order #{acc.order_id}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-text-3">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-text-3 text-[11px] max-w-xs truncate">
                                                        {acc.note || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {acc.can_edit_status ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleStatus(acc)}
                                                                    className={`px-2 py-1 rounded text-[11px] font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                                                                        acc.status === 'AVAILABLE'
                                                                            ? 'bg-surface-2 hover:bg-danger/10 text-text-2 hover:text-danger border-border'
                                                                            : 'bg-accent/15 text-accent-text border-accent/30 hover:bg-accent/25'
                                                                    }`}
                                                                    title={acc.status === 'AVAILABLE' ? 'Nonaktifkan unit' : 'Aktifkan kembali unit'}
                                                                >
                                                                    {acc.status === 'AVAILABLE' ? (
                                                                        <>
                                                                            <ToggleLeft className="w-3.5 h-3.5" />
                                                                            <span>Nonaktifkan</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <ToggleRight className="w-3.5 h-3.5" />
                                                                            <span>Aktifkan</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            ) : (
                                                                <span 
                                                                    className="text-[11px] text-text-3 italic cursor-help"
                                                                    title="Status unit yang sedang dipesan, disewa, atau terjual tidak dapat diubah secara manual."
                                                                >
                                                                    Terkunci
                                                                </span>
                                                            )}

                                                            {acc.can_delete ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDeleteModalAccount(acc)}
                                                                    className="p-1.5 rounded hover:bg-danger/10 text-danger cursor-pointer"
                                                                    title="Hapus Unit"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    disabled
                                                                    className="p-1.5 rounded text-text-3 opacity-30 cursor-not-allowed"
                                                                    title="Unit tidak dapat dihapus karena memiliki riwayat pesanan atau sedang digunakan."
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards (375px) */}
                            <div className="lg:hidden divide-y divide-border">
                                {accounts.data.map((acc) => {
                                    const isVisible = !!visibleCredentials[acc.id];
                                    return (
                                        <div key={acc.id} className="p-3.5 space-y-2.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="font-mono text-text-3 text-[10px]">#{acc.id}</span>
                                                    <h3 className="font-semibold text-xs text-text">{acc.product_name}</h3>
                                                    <div className="mt-0.5">
                                                        {acc.variant_id ? (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-2 text-accent-text border border-accent/20">
                                                                {acc.variant_name}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-text-3 font-normal bg-surface-2/60 border border-border">
                                                                Semua Varian
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                                        acc.kind === 'RENT'
                                                            ? 'bg-info/15 text-info border border-info/30'
                                                            : 'bg-accent/15 text-accent-text border border-accent/30'
                                                    }`}>
                                                        {acc.kind}
                                                    </span>
                                                    {renderStatusBadge(acc.status, acc.status_label)}
                                                </div>
                                            </div>

                                            {/* Credential Box */}
                                            <div className="p-2.5 bg-surface-2 rounded border border-border space-y-1.5">
                                                <div className="flex items-center justify-between text-[11px] text-text-3">
                                                    <span>Kredensial Akun:</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleVisibility(acc.id)}
                                                        className="text-accent-text font-medium flex items-center gap-1"
                                                    >
                                                        {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                        <span>{isVisible ? 'Sembunyikan' : 'Tampilkan'}</span>
                                                    </button>
                                                </div>
                                                <div className="font-mono text-xs break-all">
                                                    {isVisible ? (
                                                        <div className="flex items-center justify-between gap-2 text-text font-medium select-all">
                                                            <span>{acc.credential}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(acc.id, acc.credential)}
                                                                className="p-1 rounded text-text-2 hover:text-text shrink-0"
                                                            >
                                                                {copiedId === acc.id ? <CheckCheck className="w-3 h-3 text-accent-text" /> : <Copy className="w-3 h-3" />}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-text-3 tracking-widest select-none">
                                                            ••••••••••••••••••••
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Order Link & Note */}
                                            {(acc.order_id || acc.note) && (
                                                <div className="flex items-center justify-between text-[11px] text-text-2">
                                                    {acc.order_id ? (
                                                        <Link
                                                            href={`/admin/orders/${acc.order_id}`}
                                                            className="font-mono text-accent-text hover:underline"
                                                        >
                                                            Terkait: Order #{acc.order_id}
                                                        </Link>
                                                    ) : <span />}
                                                    {acc.note && (
                                                        <span className="text-text-3 italic">{acc.note}</span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex items-center justify-end gap-2 pt-1">
                                                {acc.can_edit_status ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(acc)}
                                                        className="px-2.5 py-1 text-xs font-semibold bg-surface-2 hover:bg-surface-hover text-text border border-border rounded"
                                                    >
                                                        {acc.status === 'AVAILABLE' ? 'Nonaktifkan' : 'Aktifkan'}
                                                    </button>
                                                ) : (
                                                    <span className="text-[11px] text-text-3 italic">Status Terkunci</span>
                                                )}

                                                {acc.can_delete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteModalAccount(acc)}
                                                        className="px-2.5 py-1 text-xs font-semibold text-danger border border-danger/40 hover:bg-danger/10 rounded"
                                                    >
                                                        Hapus
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {accounts.links.length > 3 && (
                                <div className="p-3 bg-surface border-t border-border flex items-center justify-between text-xs">
                                    <span className="text-text-3">
                                        Halaman <span className="font-semibold text-text">{accounts.current_page}</span> dari <span className="font-semibold text-text">{accounts.last_page}</span> ({accounts.total} unit)
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {accounts.links.map((link, idx) => {
                                            const isPrev = idx === 0 || link.label.toLowerCase().includes('prev') || link.label.includes('&laquo;') || link.label.includes('pagination.previous');
                                            const isNext = idx === accounts.links.length - 1 || link.label.toLowerCase().includes('next') || link.label.includes('&raquo;') || link.label.includes('pagination.next');

                                            if (isPrev) {
                                                return link.url ? (
                                                    <Link
                                                        key={idx}
                                                        href={link.url}
                                                        preserveScroll
                                                        className="p-1.5 px-2 rounded bg-surface border border-border text-text hover:bg-surface-hover inline-flex items-center gap-1 text-xs font-medium transition-colors"
                                                        title="Halaman Sebelumnya"
                                                        aria-label="Sebelumnya"
                                                    >
                                                        <ChevronLeft className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">Prev</span>
                                                    </Link>
                                                ) : (
                                                    <span
                                                        key={idx}
                                                        className="p-1.5 px-2 rounded bg-surface-2 border border-border text-text-3 opacity-40 select-none inline-flex items-center gap-1 text-xs cursor-not-allowed"
                                                        aria-disabled="true"
                                                    >
                                                        <ChevronLeft className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">Prev</span>
                                                    </span>
                                                );
                                            }

                                            if (isNext) {
                                                return link.url ? (
                                                    <Link
                                                        key={idx}
                                                        href={link.url}
                                                        preserveScroll
                                                        className="p-1.5 px-2 rounded bg-surface border border-border text-text hover:bg-surface-hover inline-flex items-center gap-1 text-xs font-medium transition-colors"
                                                        title="Halaman Selanjutnya"
                                                        aria-label="Selanjutnya"
                                                    >
                                                        <span className="hidden sm:inline">Next</span>
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    </Link>
                                                ) : (
                                                    <span
                                                        key={idx}
                                                        className="p-1.5 px-2 rounded bg-surface-2 border border-border text-text-3 opacity-40 select-none inline-flex items-center gap-1 text-xs cursor-not-allowed"
                                                        aria-disabled="true"
                                                    >
                                                        <span className="hidden sm:inline">Next</span>
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    </span>
                                                );
                                            }

                                            return link.url ? (
                                                <Link
                                                    key={idx}
                                                    href={link.url}
                                                    preserveScroll
                                                    className={`min-w-7 h-7 px-2 flex items-center justify-center rounded text-xs transition-colors font-medium ${
                                                        link.active
                                                            ? 'bg-accent text-on-accent font-semibold'
                                                            : 'bg-surface border border-border text-text hover:bg-surface-hover'
                                                    }`}
                                                >
                                                    {link.label}
                                                </Link>
                                            ) : (
                                                <span
                                                    key={idx}
                                                    className="min-w-7 h-7 px-1 flex items-center justify-center rounded text-xs text-text-3 opacity-50 select-none"
                                                >
                                                    {link.label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal Tambah Satuan */}
            {isSingleModalOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4"
                    onClick={() => setIsSingleModalOpen(false)}
                >
                    <div 
                        className="w-full max-w-md bg-surface border border-border-strong rounded-md p-5 shadow-xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                            <h3 className="text-sm font-bold text-text flex items-center gap-1.5">
                                <Plus className="w-4 h-4 text-accent-text" />
                                <span>Tambah Unit Akun Satuan</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsSingleModalOpen(false)}
                                className="p-1 text-text-2 hover:text-text"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSingleSubmit} className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-semibold text-text block">Produk <span className="text-danger">*</span></label>
                                    <select
                                        value={singleForm.data.product_id}
                                        onChange={(e) => handleSingleProductChange(Number(e.target.value))}
                                        required
                                        className="w-full h-8 px-2 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                    >
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    {singleForm.errors.product_id && <p className="text-[11px] text-danger">{singleForm.errors.product_id}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="font-semibold text-text block">Varian Paket <span className="text-text-3 font-normal">(opsional)</span></label>
                                    <select
                                        value={singleForm.data.variant_id}
                                        onChange={(e) => handleSingleVariantChange(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full h-8 px-2 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                    >
                                        <option value="">Semua Varian (Stok Global)</option>
                                        {activeSingleProduct?.variants.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.name} ({v.type})
                                            </option>
                                        ))}
                                    </select>
                                    {singleForm.errors.variant_id && <p className="text-[11px] text-danger">{singleForm.errors.variant_id}</p>}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-text block">Kategori <span className="text-danger">*</span></label>
                                <select
                                    value={singleForm.data.kind}
                                    onChange={(e) => singleForm.setData('kind', e.target.value)}
                                    required
                                    className="w-full h-8 px-2 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                >
                                    <option value="RENT">RENT (Sewa Harian)</option>
                                    <option value="BUY">BUY (Beli / Langganan)</option>
                                </select>
                                {singleForm.errors.kind && <p className="text-[11px] text-danger">{singleForm.errors.kind}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-text block">Email Akun <span className="text-danger">*</span></label>
                                <input
                                    type="email"
                                    value={singleForm.data.email}
                                    onChange={(e) => singleForm.setData('email', e.target.value)}
                                    placeholder="user@example.com"
                                    required
                                    className="w-full h-8 px-2.5 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                />
                                {singleForm.errors.email && <p className="text-[11px] text-danger">{singleForm.errors.email}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-text block">Password Akun <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    value={singleForm.data.password}
                                    onChange={(e) => singleForm.setData('password', e.target.value)}
                                    placeholder="Password123"
                                    required
                                    className="w-full h-8 px-2.5 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent font-mono"
                                />
                                {singleForm.errors.password && <p className="text-[11px] text-danger">{singleForm.errors.password}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-semibold text-text block">Profil / Screen <span className="text-text-3 font-normal">(opsional)</span></label>
                                    <input
                                        type="text"
                                        value={singleForm.data.profile}
                                        onChange={(e) => singleForm.setData('profile', e.target.value)}
                                        placeholder="Profil 1"
                                        className="w-full h-8 px-2.5 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="font-semibold text-text block">PIN Profil <span className="text-text-3 font-normal">(opsional)</span></label>
                                    <input
                                        type="text"
                                        value={singleForm.data.pin}
                                        onChange={(e) => singleForm.setData('pin', e.target.value)}
                                        placeholder="1234"
                                        className="w-full h-8 px-2.5 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent font-mono"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-text block">Catatan Internal <span className="text-text-3 font-normal">(opsional)</span></label>
                                <input
                                    type="text"
                                    value={singleForm.data.note}
                                    onChange={(e) => singleForm.setData('note', e.target.value)}
                                    placeholder="Contoh: Batch 1 / Expired 2026-12"
                                    className="w-full h-8 px-2.5 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setIsSingleModalOpen(false)}
                                    className="px-3 py-1.5 text-text-2 hover:text-text rounded cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={singleForm.processing}
                                    className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-on-accent font-semibold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{singleForm.processing ? 'Menyimpan...' : 'Simpan Unit'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Impor Massal */}
            {isBulkModalOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4"
                    onClick={() => setIsBulkModalOpen(false)}
                >
                    <div 
                        className="w-full max-w-lg bg-surface border border-border-strong rounded-md p-5 shadow-xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                            <h3 className="text-sm font-bold text-text flex items-center gap-1.5">
                                <Upload className="w-4 h-4 text-accent-text" />
                                <span>Impor Stok Akun Massal</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsBulkModalOpen(false)}
                                className="p-1 text-text-2 hover:text-text"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-xs text-text-2">
                            Masukkan data akun satu baris per unit dengan format: <br />
                            <code className="text-accent-text font-mono bg-surface-2 px-1 py-0.5 rounded">email|password|profil|pin</code> (profil & pin opsional).
                        </p>

                        <form onSubmit={handleBulkSubmit} className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="font-semibold text-text block">Produk <span className="text-danger">*</span></label>
                                    <select
                                        value={bulkForm.data.product_id}
                                        onChange={(e) => handleBulkProductChange(Number(e.target.value))}
                                        required
                                        className="w-full h-8 px-2 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                    >
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    {bulkForm.errors.product_id && <p className="text-[11px] text-danger">{bulkForm.errors.product_id}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="font-semibold text-text block">Varian Paket <span className="text-text-3 font-normal">(opsional)</span></label>
                                    <select
                                        value={bulkForm.data.variant_id}
                                        onChange={(e) => handleBulkVariantChange(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full h-8 px-2 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                    >
                                        <option value="">Semua Varian (Stok Global)</option>
                                        {activeBulkProduct?.variants.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.name} ({v.type})
                                            </option>
                                        ))}
                                    </select>
                                    {bulkForm.errors.variant_id && <p className="text-[11px] text-danger">{bulkForm.errors.variant_id}</p>}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-text block">Kategori <span className="text-danger">*</span></label>
                                <select
                                    value={bulkForm.data.kind}
                                    onChange={(e) => bulkForm.setData('kind', e.target.value)}
                                    required
                                    className="w-full h-8 px-2 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent"
                                >
                                    <option value="RENT">RENT (Sewa Harian)</option>
                                    <option value="BUY">BUY (Beli / Langganan)</option>
                                </select>
                                {bulkForm.errors.kind && <p className="text-[11px] text-danger">{bulkForm.errors.kind}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="font-semibold text-text block">
                                    Daftar Unit (Maksimal 200 baris) <span className="text-danger">*</span>
                                </label>
                                <textarea
                                    value={bulkForm.data.items_text}
                                    onChange={(e) => bulkForm.setData('items_text', e.target.value)}
                                    rows={8}
                                    placeholder="user1@mail.com|pass123|Profil 1|1234&#10;user2@mail.com|pass456&#10;user3@mail.com|pass789|Profil 2"
                                    required
                                    className="w-full p-2.5 font-mono text-[11px] bg-surface-2 border border-border rounded text-text placeholder:text-text-3 focus:outline-none focus:border-accent"
                                />
                                {bulkForm.errors.items_text && (
                                    <p className="text-[11px] text-danger">{bulkForm.errors.items_text}</p>
                                )}
                            </div>

                            <div className="p-2.5 bg-surface-2/60 rounded border border-border text-[11px] text-text-3">
                                <strong>Catatan:</strong> Baris tidak valid (format salah atau email kosong) akan dilewati dan dilaporkan nomor barisnya tanpa membatalkan baris yang valid. Semua kredensial disimpan terenkripsi di database.
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setIsBulkModalOpen(false)}
                                    className="px-3 py-1.5 text-text-2 hover:text-text rounded cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={bulkForm.processing}
                                    className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-on-accent font-semibold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>{bulkForm.processing ? 'Mengimpor...' : 'Mulai Impor'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus Unit */}
            {deleteModalAccount && (
                <div 
                    className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4"
                    onClick={() => setDeleteModalAccount(null)}
                >
                    <div 
                        className="w-full max-w-sm bg-surface border border-border-strong rounded-md p-5 shadow-xl space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-sm font-bold text-danger flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            <span>Hapus Unit Akun</span>
                        </h3>
                        <p className="text-xs text-text-2">
                            Apakah Anda yakin ingin menghapus unit akun <strong className="text-text font-mono">#{deleteModalAccount.id}</strong> ({deleteModalAccount.product_name})?
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                            <button
                                type="button"
                                onClick={() => setDeleteModalAccount(null)}
                                className="px-3 py-1.5 text-xs text-text-2 hover:text-text rounded cursor-pointer"
                                disabled={isDeleting}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                className="px-4 py-1.5 bg-danger-solid text-on-danger text-xs font-semibold rounded hover:bg-danger-solid-hover transition-colors cursor-pointer"
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
