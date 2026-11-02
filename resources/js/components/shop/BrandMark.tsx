import React from 'react';
import { usePage } from '@inertiajs/react';

interface BrandMarkProps {
    className?: string;
    logoClassName?: string;
    textClassName?: string;
    showLogo?: boolean;
}

export function BrandMark({ 
    className = '', 
    logoClassName = 'w-7 h-7 rounded-[6px] object-contain shrink-0',
    textClassName = 'text-[15px] font-semibold text-text tracking-tight',
    showLogo = true 
}: BrandMarkProps) {
    const { name, settings } = usePage<{
        name?: string;
        settings?: {
            store_name?: string | null;
            store_logo_path?: string | null;
        };
    }>().props;

    const storeName = settings?.store_name || name || 'StreamPoint';
    const storeLogo = settings?.store_logo_path;

    return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            {showLogo && storeLogo && (
                <img
                    src={storeLogo}
                    alt={storeName}
                    className={logoClassName}
                    width={28}
                    height={28}
                />
            )}
            <span className={textClassName}>{storeName}</span>
        </span>
    );
}
