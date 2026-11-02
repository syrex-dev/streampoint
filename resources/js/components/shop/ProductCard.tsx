import React from 'react';
import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/format';
import { ProductCatalogItem } from '@/types/shop';

interface ProductCardProps {
    product: ProductCatalogItem;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const isOutOfStock = product.status === 'out_of_stock';

    // Validate brand_color strictly on client
    const isValidHex = typeof product.brand_color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(product.brand_color);

    // Initial box if no image: mono 18px / 600
    const initials = product.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');

    // Badge mapping
    const getBadgeVariant = (status: ProductCatalogItem['status']) => {
        switch (status) {
            case 'available':
                return 'accent';
            case 'low_stock':
            case 'rent_full':
                return 'warning';
            case 'out_of_stock':
                return 'danger';
            default:
                return 'neutral';
        }
    };

    return (
        <Link
            href={`/p/${product.slug}`}
            className={`group flex flex-col justify-between bg-surface border border-border rounded-lg p-3 transition-colors hover:bg-surface-hover hover:border-border-strong relative outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isOutOfStock ? 'opacity-60' : ''
            }`}
        >
            {/* Top row: 56x56 logo box and status badge */}
            <div>
                <div className="flex items-start justify-between gap-2">
                    <div
                        className={`w-14 h-14 rounded-lg border flex items-center justify-center shrink-0 overflow-hidden brand-logo-box ${
                            isValidHex ? 'has-brand-tint' : ''
                        }`}
                        style={isValidHex ? ({ ['--brand' as any]: product.brand_color } as React.CSSProperties) : undefined}
                    >
                        {product.thumbnail_path ? (
                            <img
                                src={product.thumbnail_path}
                                alt={product.name}
                                className="w-full h-full object-contain p-2"
                                loading="lazy"
                                width={56}
                                height={56}
                            />
                        ) : (
                            <span className="font-mono text-lg font-semibold text-text tracking-wider">
                                {initials || 'SP'}
                            </span>
                        )}
                    </div>

                    <Badge variant={getBadgeVariant(product.status)}>
                        {product.status_label}
                    </Badge>
                </div>

                {/* Name & Category */}
                <div className="mt-3 min-w-0">
                    <h3 className="text-sm font-semibold text-text line-clamp-2 leading-snug group-hover:text-accent-text transition-colors">
                        {product.name}
                    </h3>
                    <p className="text-xs text-text-2 truncate mt-0.5">
                        {product.category}
                    </p>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="mt-3.5 pt-2.5 border-t border-border space-y-2">
                <div className="flex items-baseline justify-between gap-1">
                    <span className="text-xs text-text-2">mulai</span>
                    <span className="font-mono text-sm font-semibold tabular-nums text-text">
                        {formatRupiah(product.min_price)}
                    </span>
                </div>

                {/* Available Package Types Chips (11px, border border-border) */}
                {(product.has_rent || product.has_buy) && (
                    <div className="flex items-center gap-1.5 pt-0.5">
                        {product.has_rent && (
                            <span className="px-1.5 py-0.5 text-[11px] font-medium rounded border border-border bg-surface-2 text-text-2">
                                Sewa
                            </span>
                        )}
                        {product.has_buy && (
                            <span className="px-1.5 py-0.5 text-[11px] font-medium rounded border border-border bg-surface-2 text-text-2">
                                Beli
                            </span>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
};

export default ProductCard;
