import React from 'react';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/format';

interface StickyBottomBarProps {
    totalPrice: number | null;
    isReadyToSubmit: boolean;
    isSubmitting: boolean;
    buttonLabel?: string;
    onSubmit: () => void;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
    totalPrice,
    isReadyToSubmit,
    isSubmitting,
    buttonLabel = 'Sewa Sekarang',
    onSubmit,
}) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-surface px-4 flex items-center justify-between z-40 lg:hidden shadow-none pb-[env(safe-area-inset-bottom)]">
            <div className="flex flex-col min-w-0 pr-3">
                <span className="text-[11px] text-text-2">Total Biaya</span>
                {totalPrice !== null ? (
                    <span className="font-mono text-base font-bold text-text tabular-nums truncate">
                        {formatRupiah(totalPrice)}
                    </span>
                ) : (
                    <span className="text-xs text-text-muted italic">Pilih paket</span>
                )}
            </div>

            <Button
                type="button"
                variant="primary"
                size="default"
                disabled={!isReadyToSubmit || isSubmitting}
                loading={isSubmitting}
                onClick={onSubmit}
                className="h-11 px-5 text-sm font-semibold shrink-0"
            >
                {buttonLabel}
            </Button>
        </div>
    );
};

export default StickyBottomBar;
