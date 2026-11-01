import React from 'react';
import { Lock } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import { ProductVariantData } from '@/types/shop';

interface PackageOptionProps {
    variant: ProductVariantData;
    isSelected: boolean;
    isDisabled: boolean;
    disabledReason?: string;
    onSelect: (variant: ProductVariantData) => void;
}

export const PackageOption: React.FC<PackageOptionProps> = ({
    variant,
    isSelected,
    isDisabled,
    disabledReason,
    onSelect,
}) => {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={isDisabled}
            onClick={() => !isDisabled && onSelect(variant)}
            className={`w-full min-h-[56px] rounded-lg border text-left p-3.5 flex items-center justify-between gap-3 transition-colors outline-none cursor-pointer select-none ${
                isDisabled
                    ? 'border-border bg-surface-2/50 opacity-50 cursor-not-allowed'
                    : isSelected
                    ? 'border-accent bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
                    : 'border-border bg-surface hover:bg-surface-hover hover:border-border-strong focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
            }`}
        >
            <div className="flex items-center gap-3 min-w-0">
                {/* Radio Circle */}
                <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isDisabled
                            ? 'border-border-strong bg-surface-2'
                            : isSelected
                            ? 'border-accent bg-accent'
                            : 'border-border-strong bg-surface-2'
                    }`}
                >
                    {isSelected && !isDisabled && (
                        <div className="w-1.5 h-1.5 rounded-full bg-on-accent" />
                    )}
                </div>

                {/* Variant Name & Duration or Disabled Reason */}
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-text truncate">
                        {variant.name}
                    </div>
                    {isDisabled && disabledReason ? (
                        <div className="text-xs text-danger flex items-center gap-1 mt-0.5 font-medium">
                            <Lock className="w-3 h-3 shrink-0" />
                            <span className="truncate">{disabledReason}</span>
                        </div>
                    ) : (
                        <div className="text-xs text-text-2 truncate mt-0.5">
                            Durasi {variant.duration_hours >= 24 ? `${variant.duration_hours / 24} Hari` : `${variant.duration_hours} Jam`}
                        </div>
                    )}
                </div>
            </div>

            {/* Price */}
            <div className="shrink-0 text-right">
                <span className={`font-mono text-sm font-semibold tabular-nums ${
                    isSelected ? 'text-accent-text' : 'text-text'
                }`}>
                    {formatRupiah(variant.price)}
                </span>
            </div>
        </button>
    );
};

export default PackageOption;
