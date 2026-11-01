import React, { useEffect, useState, useRef } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
    expiresAt: string; // ISO 8601 string
    serverNow?: string; // ISO 8601 string from server
    onExpire?: () => void;
    className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
    expiresAt,
    serverNow,
    onExpire,
    className = '',
}) => {
    // Calculate client vs server clock offset
    const serverOffsetRef = useRef<number>(
        serverNow ? new Date(serverNow).getTime() - Date.now() : 0
    );

    const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
        const targetTime = new Date(expiresAt).getTime();
        const currentEstimatedTime = Date.now() + serverOffsetRef.current;
        return Math.max(0, Math.floor((targetTime - currentEstimatedTime) / 1000));
    });

    const [announcedThreshold, setAnnouncedThreshold] = useState<string>('');
    const hasExpiredRef = useRef<boolean>(false);

    useEffect(() => {
        const updateTimer = () => {
            const targetTime = new Date(expiresAt).getTime();
            const currentEstimatedTime = Date.now() + serverOffsetRef.current;
            const diff = Math.max(0, Math.floor((targetTime - currentEstimatedTime) / 1000));

            setSecondsRemaining(diff);

            // aria-live announcement on specific thresholds (3 mins, 1 min, 0)
            if (diff <= 180 && diff > 60 && announcedThreshold !== '3min') {
                setAnnouncedThreshold('3min');
            } else if (diff <= 60 && diff > 0 && announcedThreshold !== '1min') {
                setAnnouncedThreshold('1min');
            } else if (diff === 0 && !hasExpiredRef.current) {
                hasExpiredRef.current = true;
                setAnnouncedThreshold('expired');
                onExpire?.();
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [expiresAt, onExpire, announcedThreshold]);

    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    // Color logic: text (> 3 min), warning (<= 3 min), danger (<= 1 min)
    let colorClass = 'text-text';
    let borderClass = 'border-border';
    if (secondsRemaining <= 60) {
        colorClass = 'text-danger';
        borderClass = 'border-danger/40';
    } else if (secondsRemaining <= 180) {
        colorClass = 'text-warning';
        borderClass = 'border-warning/40';
    }

    return (
        <div
            className={`bg-surface border ${borderClass} rounded-lg p-4 sm:p-5 text-center transition-colors ${className}`}
        >
            <div className="flex items-center justify-center gap-1.5 text-xs text-text-2 mb-2 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Batas Waktu Pembayaran</span>
            </div>

            <div
                className={`font-mono text-3xl sm:text-4xl font-bold tracking-tight tabular-nums ${colorClass}`}
                aria-label={`Sisa waktu pembayaran ${minutes} menit ${seconds} detik`}
            >
                {formattedMinutes}:{formattedSeconds}
            </div>

            <p className="text-xs text-text-muted mt-2">
                Pesanan dibatalkan otomatis jika tidak dibayar
            </p>

            {/* Screen reader live announcement at key thresholds */}
            <div className="sr-only" aria-live="polite">
                {announcedThreshold === '3min' && 'Perhatian: Sisa waktu pembayaran 3 menit.'}
                {announcedThreshold === '1min' && 'Peringatan: Sisa waktu pembayaran kurang dari 1 menit.'}
                {announcedThreshold === 'expired' && 'Waktu pembayaran telah habis. Pesanan dibatalkan otomatis.'}
            </div>
        </div>
    );
};

export default CountdownTimer;
