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
    ToggleRight,
    ExternalLink,
    Tv,
    UserCheck,
    Link2,
    Ticket,
    Package
} from 'lucide-react';

export type CredentialFormatType = 'STREAMING_PROFILE' | 'STANDARD_ACCOUNT' | 'INVITE_LINK' | 'VOUCHER' | 'CUSTOM';

interface VariantSummary {
    id: number;
    name: string;
    type: 'RENT' | 'BUY';
    delivery_type?: 'STOCK' | 'INVITE' | 'MANUAL';
    stock_fields?: string[] | null;
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
    credential_type?: string;
    is_link?: boolean;
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
    error_message?: string;
}

export default function AccountsIndex({ accounts, summary, products, filters, statuses, error_message }: AccountsIndexProps) {
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

    const detectFormat = (product?: ProductItem, variant?: VariantSummary): CredentialFormatType => {
        if (variant?.stock_fields && variant.stock_fields.length > 0) {
            const fields = variant.stock_fields.map((f) => String(f).toLowerCase());
            if (fields.includes('link') || fields.includes('url') || fields.includes('invite') || fields.includes('tautan')) {
                return 'INVITE_LINK';
            }
            if (fields.includes('code') || fields.includes('voucher') || fields.includes('kode') || fields.includes('kode_voucher') || fields.includes('key')) {
                return 'VOUCHER';
            }
            if (fields.includes('profil') || fields.includes('profile') || fields.includes('pin')) {
                return 'STREAMING_PROFILE';
            }
            if (fields.includes('email') && fields.includes('password')) {
                return 'STANDARD_ACCOUNT';
            }
            return 'CUSTOM';
        }

        if (variant?.delivery_type === 'INVITE') {
            return 'INVITE_LINK';
        }

        const pName = (product?.name || '').toLowerCase();
        const vName = (variant?.name || '').toLowerCase();

        if (pName.includes('netflix') || pName.includes('disney') || pName.includes('vidio') || pName.includes('prime')) {
            return 'STREAMING_PROFILE';
        }
        if (pName.includes('family') || pName.includes('invite') || vName.includes('family') || vName.includes('link')) {
            return 'INVITE_LINK';
        }
        if (pName.includes('voucher') || pName.includes('redeem') || vName.includes('voucher')) {
            return 'VOUCHER';
        }

        return 'STANDARD_ACCOUNT';
    };

    const initialProduct = products[0];
    const initialVariant = initialProduct?.variants[0];
    const initialFormat = detectFormat(initialProduct, initialVariant);

    const [singleFormatType, setSingleFormatType] = useState<CredentialFormatType>(initialFormat);
    const [bulkFormatType, setBulkFormatType] = useState<CredentialFormatType | 'AUTO'>('AUTO');

    // Single account form
    const singleForm = useForm({
        product_id: initialProduct?.id || '',
        variant_id: '' as number | '',
        kind: 'RENT',
        credential_type: initialFormat as CredentialFormatType,
        email: '',
        password: '',
        profile: '',
        pin: '',
        link: '',
        code: '',
        custom_credential: '',
        note: '',
    });

    // Bulk account form
    const bulkForm = useForm({
        product_id: initialProduct?.id || '',
        variant_id: '' as number | '',
        kind: 'RENT',
        format_type: 'AUTO' as CredentialFormatType | 'AUTO',
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
        const p = products.find((prod) => prod.id === productId);
        const firstVariant = p?.variants[0];
        const newFormat = detectFormat(p, firstVariant);
        setSingleFormatType(newFormat);

        singleForm.setData((data) => ({
            ...data,
            product_id: productId,
            variant_id: '',
            credential_type: newFormat,
        }));
    };

    const handleSingleVariantChange = (variantId: number | '') => {
        const variant = activeSingleProduct?.variants.find((v) => v.id === variantId);
        const newFormat = detectFormat(activeSingleProduct, variant);
        setSingleFormatType(newFormat);

        singleForm.setData((data) => ({
            ...data,
            variant_id: variantId,
            kind: variant ? variant.type : data.kind,
            credential_type: newFormat,
        }));
    };

    const handleBulkProductChange = (productId: number) => {
        const p = products.find((prod) => prod.id === productId);
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
        singleForm.transform((data) => ({
            ...data,
            credential_type: singleFormatType,
        }));
        singleForm.post('/admin/accounts', {
            onSuccess: () => {
                setIsSingleModalOpen(false);
                singleForm.reset('email', 'password', 'profile', 'pin', 'link', 'code', 'custom_credential', 'note');
            },
        });
    };

    const handleBulkSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        bulkForm.transform((data) => ({
            ...data,
            format_type: bulkFormatType,
        }));
        bulkForm.post('/admin/accounts/bulk', {
            onSuccess: () => {
                setIsBulkModalOpen(false);
                bulkForm.reset('items_text');
            },
        });
    };

    const renderCredentialContent = (acc: AccountItem, isVisible: boolean) => {
        const raw = acc.credential;
        const isLink = acc.is_link || raw.startsWith('http://') || raw.startsWith('https://');
        const parts = raw.split('|');

        if (isLink) {
            return (
                <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-info/10 text-info border border-info/20">
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>Link Invite</span>
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                        {isVisible ? (
                            <a
                                href={raw}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent-text hover:underline truncate max-w-[200px] sm:max-w-xs block font-medium"
                                title={raw}
                            >
                                {raw}
                            </a>
                        ) : (
                            <span className="text-text-3 tracking-widest select-none">
                                ••••••••••••••••••••
                            </span>
                        )}
                    </div>
                </div>
            );
        }

        if (parts.length >= 3) {
            return (
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-2 text-text-2 border border-border">
                            <Tv className="w-2.5 h-2.5 text-accent-text" />
                            <span>Profil</span>
                        </span>
                        {parts[2] && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent/10 text-accent-text border border-accent/20">
                                {parts[2]}
                            </span>
                        )}
                        {parts[3] && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-2 text-text-3 border border-border">
                                PIN: {parts[3]}
                            </span>
                        )}
                    </div>
                    <div className="font-mono text-xs">
                        {isVisible ? (
                            <div className="text-text font-medium select-all break-all">
                                <span>{parts[0]}</span>
                                <span className="text-text-3 mx-1">|</span>
                                <span>{parts[1]}</span>
                            </div>
                        ) : (
                            <span className="text-text-3 tracking-widest select-none">
                                ••••••••••••••••••••
                            </span>
                        )}
                    </div>
                </div>
            );
        }

        if (parts.length === 2) {
            return (
                <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-2 text-text-2 border border-border">
                        <UserCheck className="w-2.5 h-2.5 text-accent-text" />
                        <span>Akun Private</span>
                    </span>
                    <div className="font-mono text-xs">
                        {isVisible ? (
                            <div className="text-text font-medium select-all break-all">
                                <span>{parts[0]}</span>
                                <span className="text-text-3 mx-1">|</span>
                                <span>{parts[1]}</span>
                            </div>
                        ) : (
                            <span className="text-text-3 tracking-widest select-none">
                                ••••••••••••••••••••
                            </span>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-2 text-text-2 border border-border">
                    <Ticket className="w-2.5 h-2.5 text-warning" />
                    <span>Voucher / Kode</span>
                </span>
                <div className="font-mono text-xs">
                    {isVisible ? (
                        <div className="text-text font-medium select-all break-all">
                            {raw}
                        </div>
                    ) : (
                        <span className="text-text-3 tracking-widest select-none">
                            ••••••••••••••••••••
                        </span>
                    )}
                </div>
            </div>
        );
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

                {error_message && (
                    <div className="p-3.5 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error_message}</span>
                    </div>
                )}

                {/* Stock Summary per Product */}
                <div className="space-y-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-text-2">
                        Ringkasan Stok Tersedia (AVAILABLE)
                    </h2>
                    {summary.length === 0 ? (
                        <div className="p-5 bg-surface border border-border rounded-lg text-center space-y-2">
                            <Package className="w-8 h-8 text-text-3 mx-auto opacity-50" />
                            <p className="text-xs text-text-2">
                                Belum ada ringkasan stok. Buat produk baru di menu Produk untuk mulai mengelola unit akun.
                            </p>
                        </div>
                    ) : (
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
                    )}
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
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0 flex-1">
                                                                {renderCredentialContent(acc, isVisible)}
                                                            </div>
                                                            <div className="flex items-center gap-1 shrink-0 pt-0.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleVisibility(acc.id)}
                                                                    className="p-1 rounded text-text-2 hover:text-text hover:bg-surface-2 cursor-pointer"
                                                                    title={isVisible ? 'Sembunyikan' : 'Tampilkan'}
                                                                >
                                                                    {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                                </button>
                                                                {isVisible && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => copyToClipboard(acc.id, acc.credential)}
                                                                        className="p-1 rounded text-text-2 hover:text-text hover:bg-surface-2 cursor-pointer"
                                                                        title="Salin Kredensial"
                                                                    >
                                                                        {copiedId === acc.id ? <CheckCheck className="w-3.5 h-3.5 text-accent-text" /> : <Copy className="w-3.5 h-3.5" />}
                                                                    </button>
                                                                )}
                                                            </div>
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
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleVisibility(acc.id)}
                                                            className="text-accent-text font-medium flex items-center gap-1 cursor-pointer"
                                                        >
                                                            {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                            <span>{isVisible ? 'Sembunyikan' : 'Tampilkan'}</span>
                                                        </button>
                                                        {isVisible && (
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(acc.id, acc.credential)}
                                                                className="text-text-2 hover:text-text cursor-pointer"
                                                                title="Salin Kredensial"
                                                            >
                                                                {copiedId === acc.id ? <CheckCheck className="w-3 h-3 text-accent-text" /> : <Copy className="w-3 h-3" />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="pt-0.5">
                                                    {renderCredentialContent(acc, isVisible)}
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

                        {products.length === 0 ? (
                            <div className="py-6 px-4 bg-surface-2/60 border border-border rounded-md text-center space-y-3">
                                <Package className="w-8 h-8 text-text-3 mx-auto opacity-50" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-semibold text-text">Belum Ada Produk di Katalog</h4>
                                    <p className="text-[11px] text-text-2 max-w-xs mx-auto">
                                        Silakan buat produk terlebih dahulu sebelum menambahkan unit stok akun.
                                    </p>
                                </div>
                                <Link
                                    href="/admin/products/create"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Buat Produk Sekarang</span>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSingleSubmit} className="space-y-3.5 text-xs">
                                {(singleForm.errors as Record<string, string | undefined>).general && (
                                    <div className="p-2.5 rounded bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{(singleForm.errors as Record<string, string | undefined>).general}</span>
                                    </div>
                                )}
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

                                {/* Format Kredensial Platform Pills */}
                                <div className="space-y-1.5 p-2.5 bg-surface-2/60 border border-border rounded-md">
                                    <label className="font-semibold text-text text-[11px] block">
                                        Format Kredensial Platform <span className="text-danger">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSingleFormatType('STREAMING_PROFILE');
                                                singleForm.setData('credential_type', 'STREAMING_PROFILE');
                                            }}
                                            className={`p-2.5 rounded-md border text-left cursor-pointer transition-all ${
                                                singleFormatType === 'STREAMING_PROFILE'
                                                    ? 'bg-accent/15 border-accent text-accent-text font-bold ring-1 ring-accent/30'
                                                    : 'bg-surface border-border hover:bg-surface-hover text-text'
                                            }`}
                                        >
                                            <div className="text-xs font-semibold flex items-center gap-1.5">
                                                <Tv className="w-3.5 h-3.5 text-accent-text shrink-0" />
                                                <span>Akun Profil / Sharing</span>
                                            </div>
                                            <p className="text-[10px] text-text-3 font-normal mt-0.5">Netflix, Disney+, Prime, Vidio</p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSingleFormatType('STANDARD_ACCOUNT');
                                                singleForm.setData('credential_type', 'STANDARD_ACCOUNT');
                                            }}
                                            className={`p-2.5 rounded-md border text-left cursor-pointer transition-all ${
                                                singleFormatType === 'STANDARD_ACCOUNT'
                                                    ? 'bg-accent/15 border-accent text-accent-text font-bold ring-1 ring-accent/30'
                                                    : 'bg-surface border-border hover:bg-surface-hover text-text'
                                            }`}
                                        >
                                            <div className="text-xs font-semibold flex items-center gap-1.5">
                                                <UserCheck className="w-3.5 h-3.5 text-accent-text shrink-0" />
                                                <span>Akun Private / Standar</span>
                                            </div>
                                            <p className="text-[10px] text-text-3 font-normal mt-0.5">Spotify, ChatGPT, Canva</p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSingleFormatType('INVITE_LINK');
                                                singleForm.setData('credential_type', 'INVITE_LINK');
                                            }}
                                            className={`p-2.5 rounded-md border text-left cursor-pointer transition-all ${
                                                singleFormatType === 'INVITE_LINK'
                                                    ? 'bg-accent/15 border-accent text-accent-text font-bold ring-1 ring-accent/30'
                                                    : 'bg-surface border-border hover:bg-surface-hover text-text'
                                            }`}
                                        >
                                            <div className="text-xs font-semibold flex items-center gap-1.5">
                                                <Link2 className="w-3.5 h-3.5 text-info shrink-0" />
                                                <span>Link Invite / Undangan</span>
                                            </div>
                                            <p className="text-[10px] text-text-3 font-normal mt-0.5">YouTube Family, Canva Team</p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSingleFormatType('VOUCHER');
                                                singleForm.setData('credential_type', 'VOUCHER');
                                            }}
                                            className={`p-2.5 rounded-md border text-left cursor-pointer transition-all ${
                                                singleFormatType === 'VOUCHER'
                                                    ? 'bg-accent/15 border-accent text-accent-text font-bold ring-1 ring-accent/30'
                                                    : 'bg-surface border-border hover:bg-surface-hover text-text'
                                            }`}
                                        >
                                            <div className="text-xs font-semibold flex items-center gap-1.5">
                                                <Ticket className="w-3.5 h-3.5 text-warning shrink-0" />
                                                <span>Kode Voucher / Lisensi</span>
                                            </div>
                                            <p className="text-[10px] text-text-3 font-normal mt-0.5">Kode Redeem, Lisensi Game/App</p>
                                        </button>
                                    </div>
                                </div>

                            {/* Dynamic Inputs Based on Format */}
                            {singleFormatType === 'INVITE_LINK' && (
                                <div className="space-y-1">
                                    <label className="font-semibold text-text block">
                                        Tautan Undangan (Link Invite) <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="url"
                                        value={singleForm.data.link}
                                        onChange={(e) => singleForm.setData('link', e.target.value)}
                                        placeholder="https://families.google.com/join/... atau https://canva.com/brand/join?..."
                                        required
                                        className="w-full h-8 px-2.5 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent font-mono text-[11px]"
                                    />
                                    <p className="text-[10px] text-text-3">
                                        Link ini akan langsung ditampilkan kepada pembeli di invoice untuk bergabung ke grup/keluarga.
                                    </p>
                                    {singleForm.errors.link && <p className="text-[11px] text-danger">{singleForm.errors.link}</p>}
                                </div>
                            )}

                            {singleFormatType === 'VOUCHER' && (
                                <div className="space-y-1">
                                    <label className="font-semibold text-text block">
                                        Kode Voucher / Lisensi <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={singleForm.data.code}
                                        onChange={(e) => singleForm.setData('code', e.target.value)}
                                        placeholder="Contoh: SPOTIFY-3M-A1B2C3D4 atau KEY-XXXX-YYYY"
                                        required
                                        className="w-full h-8 px-2.5 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent font-mono text-xs uppercase"
                                    />
                                    <p className="text-[10px] text-text-3">
                                        Kode ini akan ditampilkan di invoice dengan tombol salin otomatis bagi pembeli.
                                    </p>
                                    {singleForm.errors.code && <p className="text-[11px] text-danger">{singleForm.errors.code}</p>}
                                </div>
                            )}

                            {singleFormatType === 'STANDARD_ACCOUNT' && (
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="font-semibold text-text block">Email / Username Akun <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            value={singleForm.data.email}
                                            onChange={(e) => singleForm.setData('email', e.target.value)}
                                            placeholder="user@example.com atau username"
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
                                </div>
                            )}

                            {singleFormatType === 'STREAMING_PROFILE' && (
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="font-semibold text-text block">Email Akun <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            value={singleForm.data.email}
                                            onChange={(e) => singleForm.setData('email', e.target.value)}
                                            placeholder="user@netflix.com"
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
                                </div>
                            )}

                            {singleFormatType === 'CUSTOM' && (
                                <div className="space-y-1">
                                    <label className="font-semibold text-text block">
                                        Kredensial Kustom <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={singleForm.data.custom_credential}
                                        onChange={(e) => singleForm.setData('custom_credential', e.target.value)}
                                        placeholder="Contoh: token_api|secret_key atau data akun lainnya..."
                                        required
                                        className="w-full p-2 bg-surface-2 border border-border rounded text-text focus:outline-none focus:border-accent font-mono text-xs"
                                    />
                                    {singleForm.errors.custom_credential && <p className="text-[11px] text-danger">{singleForm.errors.custom_credential}</p>}
                                </div>
                            )}

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
                    )}
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

                        {products.length === 0 ? (
                            <div className="py-6 px-4 bg-surface-2/60 border border-border rounded-md text-center space-y-3">
                                <Package className="w-8 h-8 text-text-3 mx-auto opacity-50" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-semibold text-text">Belum Ada Produk di Katalog</h4>
                                    <p className="text-[11px] text-text-2 max-w-xs mx-auto">
                                        Silakan buat produk terlebih dahulu sebelum mengimpor stok akun massal.
                                    </p>
                                </div>
                                <Link
                                    href="/admin/products/create"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Buat Produk Sekarang</span>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="font-semibold text-text text-[11px] block">
                                        Pilihan Format Impor
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[
                                            { id: 'AUTO', label: 'Sesuai Varian', icon: Layers },
                                            { id: 'STREAMING_PROFILE', label: 'Netflix / Profil', icon: Tv },
                                            { id: 'STANDARD_ACCOUNT', label: 'Akun Private', icon: UserCheck },
                                            { id: 'INVITE_LINK', label: 'Link Invite', icon: Link2 },
                                            { id: 'VOUCHER', label: 'Voucher / Lisensi', icon: Ticket },
                                        ].map((tab) => {
                                            const IconComp = tab.icon;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    type="button"
                                                    onClick={() => setBulkFormatType(tab.id as any)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border cursor-pointer transition-colors ${
                                                        bulkFormatType === tab.id
                                                            ? 'bg-accent/20 border-accent text-accent-text font-semibold'
                                                            : 'bg-surface-2 border-border hover:bg-surface-hover text-text-2'
                                                    }`}
                                                >
                                                    <IconComp className="w-3 h-3 shrink-0" />
                                                    <span>{tab.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="p-2.5 bg-surface-2 rounded border border-border text-xs text-text-2">
                                    {bulkFormatType === 'INVITE_LINK' ? (
                                        <span>Masukkan <strong>1 tautan undangan per baris</strong>. Contoh: <code className="text-accent-text font-mono bg-surface px-1 py-0.5 rounded">https://families.google.com/join/...</code></span>
                                    ) : bulkFormatType === 'VOUCHER' ? (
                                        <span>Masukkan <strong>1 kode voucher per baris</strong>. Contoh: <code className="text-accent-text font-mono bg-surface px-1 py-0.5 rounded">VOUCHER-XXXX-YYYY</code></span>
                                    ) : bulkFormatType === 'STANDARD_ACCOUNT' ? (
                                        <span>Format per baris: <code className="text-accent-text font-mono bg-surface px-1 py-0.5 rounded">email|password</code></span>
                                    ) : (
                                        <span>Format per baris: <code className="text-accent-text font-mono bg-surface px-1 py-0.5 rounded">email|password|profil|pin</code> (profil & pin opsional).</span>
                                    )}
                                </div>

                                <form onSubmit={handleBulkSubmit} className="space-y-3 text-xs">
                            {(bulkForm.errors as Record<string, string | undefined>).general && (
                                <div className="p-2.5 rounded bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{(bulkForm.errors as Record<string, string | undefined>).general}</span>
                                </div>
                            )}
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
                                    placeholder={
                                        bulkFormatType === 'INVITE_LINK'
                                            ? 'https://families.google.com/join/ABC123\nhttps://families.google.com/join/DEF456'
                                            : bulkFormatType === 'VOUCHER'
                                            ? 'SPOTIFY-3M-A1B2C3D4\nSPOTIFY-3M-E5F6G7H8'
                                            : bulkFormatType === 'STANDARD_ACCOUNT'
                                            ? 'user1@spotify.com|Pass123\nuser2@spotify.com|Pass456'
                                            : 'user1@netflix.com|Pass123|Profil 1|1234\nuser2@netflix.com|Pass456|Profil 2|5678'
                                    }
                                    required
                                    className="w-full p-2.5 font-mono text-[11px] bg-surface-2 border border-border rounded text-text placeholder:text-text-3 focus:outline-none focus:border-accent"
                                />
                                {bulkForm.errors.items_text && (
                                    <p className="text-[11px] text-danger">{bulkForm.errors.items_text}</p>
                                )}
                            </div>

                            <div className="p-2.5 bg-surface-2/60 rounded border border-border text-[11px] text-text-3">
                                <strong>Catatan:</strong> Baris tidak valid akan dilewati dan dilaporkan nomor barisnya tanpa membatalkan baris yang valid. Semua data kredensial disimpan terenkripsi secara aman.
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
                    </>
                )}
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
