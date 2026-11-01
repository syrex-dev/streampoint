import React from 'react';
import { Link } from '@inertiajs/react';
import { Clock, ArrowRight } from 'lucide-react';
import { SharedPendingOrder } from '@/types/shop';

interface PendingOrderBannerProps {
    order: SharedPendingOrder | null | undefined;
    currentInvoiceCode?: string;
}

export function PendingOrderBanner({ order, currentInvoiceCode }: PendingOrderBannerProps) {
    if (!order) return null;

    // Do not show on the invoice page for this same order
    if (currentInvoiceCode && currentInvoiceCode === order.invoice_code) {
        return null;
    }

    return (
        <aside
            aria-label="Notifikasi pesanan belum selesai"
            className="w-full bg-warning/10 border-b border-warning/30 text-warning px-4 py-2 sm:py-2.5 transition-colors"
        >
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-4 h-4 shrink-0 text-warning" />
                    <span className="truncate text-text font-medium">
                        Pesanan <strong className="font-mono text-warning">#{order.invoice_code}</strong> ({order.status_label}) belum selesai.
                    </span>
                </div>

                <Link
                    href={`/invoice/${order.invoice_code}`}
                    className="shrink-0 inline-flex items-center gap-1 font-semibold text-warning hover:underline outline-none focus-visible:ring-1 focus-visible:ring-warning rounded-sm"
                >
                    <span>Lanjutkan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </aside>
    );
}

export default PendingOrderBanner;
