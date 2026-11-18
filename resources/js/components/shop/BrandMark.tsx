import React from 'react';
import { usePage } from '@inertiajs/react';
import { SharedSettings } from '@/types/shop';

export interface BrandMarkProps {
    className?: string;
    logoClassName?: string;
    textClassName?: string;
    taglineClassName?: string;
    showLogo?: boolean;
    showTagline?: boolean;
    alwaysShowTagline?: boolean;
    variant?: 'auto' | 'full' | 'icon-text' | 'icon-only';
}

export function BrandMark({ 
    className = '', 
    logoClassName,
    textClassName = 'text-[15px] font-semibold text-text tracking-tight leading-none',
    taglineClassName = 'text-xs text-muted-foreground truncate max-w-[260px] leading-tight mt-0.5',
    showLogo = true,
    showTagline = false,
    alwaysShowTagline = false,
    variant = 'auto',
}: BrandMarkProps) {
    const { name, settings, storeTagline: propTagline } = usePage<{
        name?: string;
        settings?: SharedSettings;
        storeTagline?: string | null;
    }>().props;

    const storeName = settings?.store_name || name || 'StreamPoint';
    const storeLogo = settings?.store_logo_path;
    const storeLogoDark = settings?.store_logo_dark_path;
    const brandFormat = settings?.navbar_brand_format ?? 'logo_only';
    const storeTagline = propTagline ?? settings?.store_tagline;

    const isLogoOnly = brandFormat === 'logo_only' || variant === 'full';
    const effectiveLogoClass = isLogoOnly
        ? (logoClassName && !logoClassName.includes('w-6') && !logoClassName.includes('w-7')
            ? logoClassName
            : 'h-8 sm:h-9 max-h-10 w-auto max-w-[190px] sm:max-w-[240px] object-contain shrink-0')
        : (logoClassName || 'h-7 sm:h-8 w-auto max-w-[140px] object-contain shrink-0');

    // 1. Text only format chosen by admin
    if (brandFormat === 'text_only') {
        return (
            <span className={`inline-flex items-center ${className}`}>
                <span className="flex flex-col min-w-0">
                    <span className={textClassName}>{storeName}</span>
                    {showTagline && storeTagline && (
                        <span className={`${alwaysShowTagline ? 'block' : 'hidden sm:block'} ${taglineClassName}`}>
                            {storeTagline}
                        </span>
                    )}
                </span>
            </span>
        );
    }

    // 2. Custom uploaded logo takes precedence if uploaded by admin
    if (storeLogo && showLogo) {
        const renderLogoImg = () => {
            if (storeLogoDark) {
                return (
                    <>
                        <img
                            src={storeLogo}
                            alt={storeName}
                            className={`dark:hidden ${effectiveLogoClass}`}
                        />
                        <img
                            src={storeLogoDark}
                            alt={storeName}
                            className={`hidden dark:block ${effectiveLogoClass}`}
                        />
                    </>
                );
            }
            return (
                <img
                    src={storeLogo}
                    alt={storeName}
                    className={effectiveLogoClass}
                />
            );
        };

        if (brandFormat === 'logo_only') {
            return (
                <span className={`inline-flex items-center ${className}`}>
                    {renderLogoImg()}
                </span>
            );
        }

        return (
            <span className={`inline-flex items-center gap-2.5 ${className}`}>
                {renderLogoImg()}
                <span className="flex flex-col min-w-0">
                    <span className={textClassName}>{storeName}</span>
                    {showTagline && storeTagline && (
                        <span className={`${alwaysShowTagline ? 'block' : 'hidden sm:block'} ${taglineClassName}`}>
                            {storeTagline}
                        </span>
                    )}
                </span>
            </span>
        );
    }

    const isDefaultBrand = !settings?.store_name || settings?.store_name === 'StreamPoint';

    // Full horizontal vector logo - clean, pure logo with no text underneath
    if (variant === 'full' || (variant === 'auto' && isDefaultBrand && !showTagline)) {
        return (
            <span className={`inline-flex items-center ${className}`}>
                <img
                    src="/brand/logo-light.svg"
                    alt={storeName}
                    className="dark:hidden h-7 sm:h-8 w-auto object-contain shrink-0"
                    width={116}
                    height={32}
                />
                <img
                    src="/brand/logo-dark.svg"
                    alt={storeName}
                    className="hidden dark:block h-7 sm:h-8 w-auto object-contain shrink-0"
                    width={116}
                    height={32}
                />
            </span>
        );
    }

    const fallbackIconClass = logoClassName || 'w-7 h-7 object-contain shrink-0';

    // Icon only
    if (variant === 'icon-only') {
        return (
            <span className={`inline-flex items-center ${className}`}>
                <img
                    src="/brand/logo-icon-light.svg"
                    alt={storeName}
                    className={`dark:hidden ${fallbackIconClass}`}
                    width={28}
                    height={28}
                />
                <img
                    src="/brand/logo-icon-dark.svg"
                    alt={storeName}
                    className={`hidden dark:block ${fallbackIconClass}`}
                    width={28}
                    height={28}
                />
            </span>
        );
    }

    // Default icon + store name (and tagline only if explicitly requested)
    return (
        <span className={`inline-flex items-center gap-2.5 ${className}`}>
            {showLogo && (
                <span className="shrink-0 inline-flex items-center">
                    <img
                        src="/brand/logo-icon-light.svg"
                        alt={storeName}
                        className={`dark:hidden ${fallbackIconClass}`}
                        width={28}
                        height={28}
                    />
                    <img
                        src="/brand/logo-icon-dark.svg"
                        alt={storeName}
                        className={`hidden dark:block ${fallbackIconClass}`}
                        width={28}
                        height={28}
                    />
                </span>
            )}
            <span className="flex flex-col min-w-0">
                <span className={textClassName}>{storeName}</span>
                {showTagline && storeTagline && (
                    <span className={`${alwaysShowTagline ? 'block' : 'hidden sm:block'} ${taglineClassName}`}>
                        {storeTagline}
                    </span>
                )}
            </span>
        </span>
    );
}
