import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { QuotaData } from '@/types/shop';

interface QuotaBarProps {
    quota: QuotaData;
}

export const QuotaBar: React.FC<QuotaBarProps> = ({ quota }) => {
    const { limit, used, remaining, is_full, resets_at } = quota;
    const isAlmostFull = !is_full && remaining === 1;

    // Countdown toward 00:00 WIB reset when quota is full
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        if (!is_full) return;

        const calculateTimeLeft = () => {
            const target = new Date(resets_at).getTime();
            const now = new Date().getTime();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft('00:00:00');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            const h = String(hours).padStart(2, '0');
            const m = String(minutes).padStart(2, '0');
            const s = String(seconds).padStart(2, '0');

            setTimeLeft(`${h}:${m}:${s}`);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [is_full, resets_at]);

    // Segment indicator: array of boxes based on limit (max 3 by default)
    const segments = Array.from({ length: Math.max(limit, 1) }, (_, i) => i < used);

    if (is_full) {
        return (
            <section
                aria-label="Status Kuota Sewa Harian"
                className="w-full min-h-[48px] sm:min-h-[52px] bg-danger/10 border border-danger/40 rounded-lg px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 transition-colors"
            >
                <div className="flex items-center gap-2 text-danger min-w-0">
                    <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
                    <span className="text-xs sm:text-sm font-semibold truncate">
                        Kuota Sewa Hari Ini Penuh ({used}/{limit}) — Reset 00:00 WIB
                    </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {timeLeft && (
                        <span className="font-mono text-xs sm:text-sm font-bold text-danger tabular-nums">
                            {timeLeft}
                        </span>
                    )}
                    <div className="flex items-center gap-1">
                        {segments.map((_, idx) => (
                            <div
                                key={idx}
                                className="w-3.5 sm:w-4 h-1.5 rounded-[2px] bg-danger"
                            />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section
            aria-label="Status Kuota Sewa Harian"
            className="w-full min-h-[48px] sm:min-h-[52px] bg-surface border border-border rounded-lg px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 transition-colors"
        >
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                        isAlmostFull ? 'bg-warning animate-pulse' : 'bg-accent'
                    }`}
                />
                <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm min-w-0">
                    <span className="text-text font-medium truncate">Slot sewa hari ini:</span>
                    <span
                        className={`font-mono font-semibold tabular-nums ${
                            isAlmostFull ? 'text-warning' : 'text-accent-text'
                        }`}
                    >
                        {remaining}/{limit} tersisa
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1">
                    {segments.map((isUsed, idx) => (
                        <div
                            key={idx}
                            className={`w-3.5 sm:w-4 h-1.5 rounded-[2px] transition-colors ${
                                isUsed
                                    ? 'bg-border-strong'
                                    : isAlmostFull
                                    ? 'bg-warning'
                                    : 'bg-accent'
                            }`}
                        />
                    ))}
                </div>
                <span className="text-xs text-text-2 hidden sm:inline-block">
                    Reset 00:00 WIB
                </span>
            </div>
        </section>
    );
};

export default QuotaBar;
