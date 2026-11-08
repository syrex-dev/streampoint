import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
    value?: string | number;
    text?: string | number;
    label?: string;
    className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
    value,
    text,
    label = 'Salin',
    className = '',
}) => {
    const copyTarget = value !== undefined ? value : (text !== undefined ? text : '');
    const [copied, setCopied] = useState<boolean>(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(String(copyTarget));
            setCopied(true);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('copy-success'));
            }
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy to clipboard', err);
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Tersalin ke clipboard' : `Salin ${label}`}
            className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium border border-border-strong bg-surface-2 text-text hover:bg-surface-hover active:bg-surface-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface cursor-pointer select-none ${className}`}
        >
            {copied ? (
                <>
                    <Check className="w-3.5 h-3.5 text-accent-text shrink-0" />
                    <span className="text-accent-text font-semibold">Tersalin</span>
                </>
            ) : (
                <>
                    <Copy className="w-3.5 h-3.5 text-text-2 shrink-0" />
                    <span>{label}</span>
                </>
            )}
        </button>
    );
};

export default CopyButton;
