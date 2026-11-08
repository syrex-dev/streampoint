import React from 'react';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/format';
import { SharedPendingOrder } from '@/types/shop';

interface StickyBottomBarProps {
    totalPrice: number | null;
    isReadyToSubmit: boolean;
    isSubmitting: boolean;
    buttonLabel?: string;
    pendingOrder?: SharedPendingOrder | null;
    onSubmit: () => void;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
    totalPrice,
    isReadyToSubmit,
    isSubmitting,
    buttonLabel = 'Sewa Sekarang',
    pendingOrder,
    onSubmit,
}) => {
    const hasActiveOrder = Boolean(pendingOrder);

    return (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-surface px-4 py-2.5 z-40 lg:hidden shadow-none pb-[calc(0.625rem+env(safe-area-inset-bottom))] space-y-2">
            {hasActiveOrder && (
                <div className="text-[11px] text-text-2 bg-warning/10 border border-warning/30 rounded px-2.5 py-1.5 flex items-center justify-between gap-2">
                    <span className="truncate">
                        {pendingOrder?.status === 'VERIFYING'
                            ? 'Pembayaran sedang diverifikasi.'
                            : `Selesaikan ${pendingOrder?.invoice_code} dulu.`}
                    </span>
                    {pendingOrder?.status === 'PENDING' && (
                        <a
                            href={`/invoice/${pendingOrder.invoice_code}`}
                            className="font-semibold text-accent-text hover:underline shrink-0"
                        >
                            Lanjutkan &rarr;
                        </a>
                    )}
                </div>
            )}
            <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col min-w-0 pr-2">
                    <span className="text-[10px] text-text-2">Total Biaya</span>
                    {totalPrice !== null ? (
                        <span className="font-mono text-sm sm:text-base font-bold text-text tabular-nums truncate">
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
                    disabled={!isReadyToSubmit || isSubmitting || hasActiveOrder}
                    loading={isSubmitting}
                    onClick={onSubmit}
                    className="h-10 px-4 text-xs sm:text-sm font-semibold shrink-0"
                >
                    {buttonLabel}
                </Button>
            </div>
        </div>
    );
};

export default StickyBottomBar;
