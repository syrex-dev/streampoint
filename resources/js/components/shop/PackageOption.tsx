import React from 'react';
import { Lock, Clock, CalendarDays, Check } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import { ProductVariantData } from '@/types/shop';

interface PackageOptionProps {
    variant: ProductVariantData;
    isSelected: boolean;
    isDisabled: boolean;
    disabledReason?: string;
    isLowestDailyRate?: boolean;
    showSavingsBadge?: boolean;
    onSelect: (variant: ProductVariantData) => void;
}

export const PackageOption: React.FC<PackageOptionProps> = ({
    variant,
    isSelected,
    isDisabled,
    disabledReason,
    isLowestDailyRate = false,
    showSavingsBadge = false,
    onSelect,
}) => {
    const isRent = variant.type === 'RENT';
    const DurationIcon = isRent ? Clock : CalendarDays;

    // Calculate daily rate: price / (duration_hours / 24)
    const dailyRate = isRent && variant.duration_hours > 0
        ? Math.round(variant.price / (variant.duration_hours / 24))
        : null;

    return (
        <button
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={isDisabled}
            onClick={() => !isDisabled && onSelect(variant)}
            className={`w-full min-h-[72px] rounded-lg border text-left p-3.5 flex flex-col justify-between gap-2 transition-all outline-none select-none relative ${
                isDisabled
                    ? 'border-border bg-surface-2 cursor-not-allowed'
                    : isSelected
                    ? 'border-accent bg-accent/10 shadow-xs ring-1 ring-accent cursor-pointer'
                    : 'border-border bg-surface hover:bg-surface-hover hover:border-border-strong cursor-pointer'
            }`}
        >
            <div className="flex items-start justify-between gap-2 w-full">
                {/* Header: Duration Icon, Name, and Radio indicator */}
                <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                        isSelected 
                            ? 'bg-accent text-on-accent' 
                            : 'bg-surface-2 text-text-2 border border-border'
                    }`}>
                        <DurationIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                        <span className={`text-xs font-semibold truncate block ${isDisabled ? 'text-text-2' : 'text-text'}`}>
                            {variant.name}
                        </span>
                        <span className="text-[11px] text-text-2 block">
                            {variant.duration_hours >= 24
                                ? `${Math.round(variant.duration_hours / 24)} Hari`
                                : `${variant.duration_hours} Jam`}
                        </span>
                    </div>
                </div>

                {/* Savings Badge */}
                {isRent && isLowestDailyRate && showSavingsBadge && !isDisabled && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent/15 text-accent-text border border-accent/30 shrink-0">
                        Paling hemat per hari
                    </span>
                )}
            </div>

            {/* Bottom Row: Disabled reason or daily rate + Price */}
            <div className="flex items-end justify-between gap-2 pt-1 border-t border-border/40 w-full mt-1">
                <div className="min-w-0">
                    {isDisabled && disabledReason ? (
                        <span className="text-[11px] text-danger font-medium flex items-center gap-1 truncate">
                            <Lock className="w-3 h-3 shrink-0" />
                            <span>{disabledReason}</span>
                        </span>
                    ) : dailyRate !== null ? (
                        <span className="text-[11px] text-text-2 font-mono">
                            ≈ {formatRupiah(dailyRate)}/hari
                        </span>
                    ) : (
                        <span className="text-[11px] text-text-2">
                            Beli Akun
                        </span>
                    )}
                </div>

                <div className="shrink-0 text-right">
                    <span className={`font-mono text-base font-semibold tabular-nums ${
                        isDisabled ? 'text-text-muted' : isSelected ? 'text-accent-text' : 'text-text'
                    }`}>
                        {formatRupiah(variant.price)}
                    </span>
                </div>
            </div>
        </button>
    );
};

export default PackageOption;
