import React from 'react';
import { Link } from '@inertiajs/react';
import { formatRupiah } from '@/lib/format';
import { ProductCatalogItem } from '@/types/shop';

interface ProductCardProps {
    product: ProductCatalogItem;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const isOutOfStock = product.status === 'out_of_stock';
    const isValidHex = typeof product.brand_color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(product.brand_color);

    const initials = product.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');

    const logoSrc = product.logo_url || product.thumbnail_path;

    const getStatusBadgeStyle = (status: ProductCatalogItem['status']) => {
        switch (status) {
            case 'available':
                return 'border-accent/50 text-accent-text';
            case 'low_stock':
            case 'rent_full':
                return 'border-warning/50 text-warning';
            case 'out_of_stock':
                return 'border-danger/50 text-danger';
            default:
                return 'border-border text-text-2';
        }
    };

    return (
        <Link
            href={`/p/${product.slug}`}
            className={`group flex flex-col justify-between bg-surface border border-border rounded-lg overflow-hidden transition-colors hover:bg-surface-hover hover:border-border-strong relative outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isOutOfStock ? 'opacity-60' : ''
            }`}
        >
            {/* 1. Sampul (rasio 16:10, object-cover) */}
            <div className="aspect-[16/10] relative w-full overflow-hidden bg-surface-2 shrink-0">
                {product.cover_url ? (
                    <img
                        src={product.cover_url}
                        alt={product.name}
                        width={400}
                        height={250}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                ) : (
                    <div
                        className={`w-full h-full flex items-center justify-center brand-logo-box ${
                            isValidHex ? 'has-brand-tint' : 'bg-surface-2'
                        }`}
                        style={isValidHex ? ({ ['--brand' as any]: product.brand_color } as React.CSSProperties) : undefined}
                    >
                        {logoSrc ? (
                            <img
                                src={logoSrc}
                                alt={product.name}
                                width={48}
                                height={48}
                                loading="lazy"
                                className="w-12 h-12 rounded-md object-contain p-1"
                            />
                        ) : (
                            <span className="font-mono text-lg font-semibold text-text tracking-wider">
                                {initials || 'SP'}
                            </span>
                        )}
                    </div>
                )}

                {/* 2. Badge di atas sampul (latar solid --surface, border 1px, 11px) */}
                <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                    {product.is_new && (
                        <span className="px-1.5 py-0.5 text-[11px] font-medium rounded border border-border bg-surface text-text shadow-sm">
                            Baru
                        </span>
                    )}
                    {product.is_bestseller && (
                        <span className="px-1.5 py-0.5 text-[11px] font-semibold rounded border border-accent/40 bg-surface text-accent-text shadow-sm">
                            Terlaris
                        </span>
                    )}
                </div>

                <div className="absolute top-2 right-2 z-10">
                    <span className={`px-1.5 py-0.5 text-[11px] font-medium rounded border bg-surface shadow-sm ${getStatusBadgeStyle(product.status)}`}>
                        {product.status_label}
                    </span>
                </div>
            </div>

            {/* 3. Badan kartu (padding 12px) */}
            <div className="p-3 flex flex-col flex-1 justify-between gap-2.5">
                <div>
                    {/* Baris logo 24px + kategori */}
                    <div className="flex items-center gap-2">
                        {logoSrc ? (
                            <div
                                className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 overflow-hidden brand-logo-box ${
                                    isValidHex ? 'has-brand-tint' : 'bg-surface-2'
                                }`}
                                style={isValidHex ? ({ ['--brand' as any]: product.brand_color } as React.CSSProperties) : undefined}
                            >
                                <img
                                    src={logoSrc}
                                    alt=""
                                    width={24}
                                    height={24}
                                    loading="lazy"
                                    className="w-full h-full object-contain p-0.5"
                                />
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded border border-border bg-surface-2 flex items-center justify-center shrink-0">
                                <span className="font-mono text-[10px] font-semibold text-text">
                                    {initials.slice(0, 1)}
                                </span>
                            </div>
                        )}
                        <span className="text-xs text-text-2 truncate">{product.category}</span>
                    </div>

                    {/* Nama (14px/600, maks 2 baris) */}
                    <h3 className="text-sm font-semibold text-text line-clamp-2 leading-snug group-hover:text-accent-text transition-colors mt-1">
                        {product.name}
                    </h3>

                    {/* Baris harga: mulai + harga mono */}
                    <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xs text-text-2">mulai</span>
                        <span className="font-mono text-sm font-semibold tabular-nums text-text">
                            {formatRupiah(product.min_price)}
                        </span>
                    </div>
                </div>

                {/* 4. Baris chip (11px, border --border) + N terjual */}
                <div className="pt-2 border-t border-border flex items-center justify-between gap-1 text-[11px]">
                    <div className="flex items-center gap-1 flex-wrap">
                        {product.has_rent && (
                            <span className="px-1.5 py-0.5 font-medium rounded border border-border bg-surface-2 text-text-2">
                                Sewa
                            </span>
                        )}
                        {product.has_buy && (
                            <span className="px-1.5 py-0.5 font-medium rounded border border-border bg-surface-2 text-text-2">
                                Beli
                            </span>
                        )}
                        {product.has_warranty && (
                            <span className="px-1.5 py-0.5 font-medium rounded border border-accent/40 bg-accent/5 text-accent-text">
                                Garansi
                            </span>
                        )}
                    </div>

                    {product.sold_count !== null && product.sold_count !== undefined && (
                        <span className="text-xs text-text-2 font-mono whitespace-nowrap">
                            {product.sold_count} terjual
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
