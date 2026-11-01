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

    // Generate 1-2 letter initial for fallback logo
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
            className={`group block bg-surface border border-border rounded-lg p-3 sm:p-3.5 transition-colors hover:bg-surface-hover hover:border-border-strong relative outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                isOutOfStock ? 'opacity-60' : ''
            }`}
        >
            <div className="flex items-start justify-between gap-2 mb-2.5">
                {/* Logo 40x40px */}
                <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border/60 flex items-center justify-center shrink-0 overflow-hidden">
                    {product.thumbnail_path ? (
                        <img
                            src={product.thumbnail_path}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            width={40}
                            height={40}
                        />
                    ) : (
                        <span className="font-mono text-xs font-bold text-text tracking-wider">
                            {initials}
                        </span>
                    )}
                </div>

                {/* Status Badge */}
                <Badge variant={getBadgeVariant(product.status)}>
                    {product.status_label}
                </Badge>
            </div>

            {/* Title & Category */}
            <div className="min-w-0">
                <h3 className="text-sm font-semibold text-text truncate group-hover:text-accent-text transition-colors">
                    {product.name}
                </h3>
                <p className="text-xs text-text-2 truncate mt-0.5">
                    {product.category}
                </p>
            </div>

            {/* Price Row */}
            <div className="mt-3 pt-2.5 border-t border-border/40 flex items-baseline justify-between">
                <span className="text-[11px] text-text-2">Mulai</span>
                <span className="font-mono text-xs font-semibold tabular-nums text-text">
                    {formatRupiah(product.min_price)}
                </span>
            </div>
        </Link>
    );
};

export default ProductCard;
