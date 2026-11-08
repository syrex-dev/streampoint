import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface FlashBannerProps {
    success?: string | null;
    error?: string | null;
    status?: string | null;
    onDismiss?: () => void;
    className?: string;
}

export function FlashBanner({
    success,
    error,
    status,
    onDismiss,
    className = '',
}: FlashBannerProps) {
    const successMsg = success || status;

    if (!successMsg && !error) {
        return null;
    }

    if (error) {
        return (
            <div
                role="alert"
                aria-live="assertive"
                className={`flex items-start gap-3 p-3.5 bg-danger/10 text-danger border border-danger/30 border-l-4 border-l-danger rounded-md text-xs sm:text-sm font-medium ${className}`}
            >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{error}</div>
                {onDismiss && (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="text-danger hover:opacity-80 p-0.5 rounded cursor-pointer"
                        aria-label="Tutup pesan error"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div
            role="status"
            aria-live="polite"
            className={`flex items-start gap-3 p-3.5 bg-surface-2 text-text border border-border border-l-4 border-l-accent rounded-md text-xs sm:text-sm font-medium ${className}`}
        >
            <CheckCircle2 className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed text-text">{successMsg}</div>
            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    className="text-text-2 hover:text-text p-0.5 rounded cursor-pointer"
                    aria-label="Tutup pesan status"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}

