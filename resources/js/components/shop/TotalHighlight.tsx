import React from 'react';
import { AlertCircle } from 'lucide-react';
import { CopyButton } from './CopyButton';

interface TotalHighlightProps {
    totalAmount: number;
    uniqueCode: number;
    className?: string;
}

export const TotalHighlight: React.FC<TotalHighlightProps> = ({
    totalAmount,
    uniqueCode,
    className = '',
}) => {
    // Format full rupiah: e.g. "Rp 15.123"
    // Split into prefix and last 3 digits so unique code is highlighted in accent
    const formattedTotal = new Intl.NumberFormat('id-ID').format(totalAmount);
    
    // The last 3 characters of formatted string are the unique digits (e.g., "123")
    const mainPart = formattedTotal.slice(0, -3);
    const uniquePart = formattedTotal.slice(-3);

    return (
        <div
            className={`bg-surface border border-accent/40 rounded-lg p-4 sm:p-5 relative ${className}`}
        >
            <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-xs font-medium text-text-2">
                    Total Transfer
                </span>
                <CopyButton value={totalAmount} label="Salin Nominal" />
            </div>

            <div className="flex items-baseline gap-1 my-1">
                <span className="text-sm font-semibold text-text-2 font-mono">Rp</span>
                <span className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-text tabular-nums">
                    {mainPart}
                    <span className="text-accent-text underline decoration-accent/40 underline-offset-4">
                        {uniquePart}
                    </span>
                </span>
            </div>

            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-text-2">
                <AlertCircle className="w-3.5 h-3.5 text-accent-text shrink-0" />
                <span>Transfer sesuai nominal sampai 3 digit terakhir</span>
            </div>
        </div>
    );
};

export default TotalHighlight;
