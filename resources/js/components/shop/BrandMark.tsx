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
    logoClassName = 'w-7 h-7 object-contain shrink-0',
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
                            className={`dark:hidden ${logoClassName}`}
                        />
                        <img
                            src={storeLogoDark}
                            alt={storeName}
                            className={`hidden dark:block ${logoClassName}`}
                        />
                    </>
                );
            }
            return (
                <img
                    src={storeLogo}
                    alt={storeName}
                    className={logoClassName}
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

    // Icon only
    if (variant === 'icon-only') {
        return (
            <span className={`inline-flex items-center ${className}`}>
                <img
                    src="/brand/logo-icon-light.svg"
                    alt={storeName}
                    className={`dark:hidden ${logoClassName}`}
                    width={28}
                    height={28}
                />
                <img
                    src="/brand/logo-icon-dark.svg"
                    alt={storeName}
                    className={`hidden dark:block ${logoClassName}`}
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
                        className={`dark:hidden ${logoClassName}`}
                        width={28}
                        height={28}
                    />
                    <img
                        src="/brand/logo-icon-dark.svg"
                        alt={storeName}
                        className={`hidden dark:block ${logoClassName}`}
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
