import React from 'react';
import { Link } from '@inertiajs/react';
import { Clock, Package, ShieldCheck, ChevronRight } from 'lucide-react';
import { QuotaData } from '@/types/shop';
import { HERO_CONFIG } from '@/data/hero';

interface HeroProps {
    quota: QuotaData | {
        available?: number;
        remaining?: number;
        max?: number;
        limit?: number;
        is_full: boolean;
    };
    availableServicesCount?: number | null;
    verificationMedianMinutes?: number | null;
    deliveryEta?: string | null;
    products?: Array<{
        name: string;
        logo_url?: string | null;
        thumbnail_path?: string | null;
        brand_color?: string | null;
    }>;
}

export function Hero({
    quota,
    availableServicesCount,
    verificationMedianMinutes,
    deliveryEta,
    products = [],
}: HeroProps) {
    const available = 'remaining' in quota && typeof quota.remaining === 'number'
        ? quota.remaining
        : (quota as { available?: number }).available ?? 0;
    const max = 'limit' in quota && typeof quota.limit === 'number'
        ? quota.limit
        : (quota as { max?: number }).max ?? 0;

    const scrollToCatalog = () => {
        const el = document.getElementById('catalog');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Up to 6 products with logos for mosaic
    const mosaicProducts = (products || [])
        .filter((p) => Boolean(p.logo_url || p.thumbnail_path))
        .slice(0, 6);

    const verificationText = typeof verificationMedianMinutes === 'number' && verificationMedianMinutes > 0
        ? `± ${verificationMedianMinutes} menit`
        : deliveryEta || null;

    return (
        <section
            aria-label="Pengenalan Toko"
            data-testid="functional-hero"
            className="w-full bg-surface border border-border rounded-lg h-auto max-h-[140px] lg:max-h-none lg:h-[160px] p-4 lg:p-5 flex flex-col justify-between overflow-hidden shadow-2xs"
        >
            {/* Desktop Layout (>= 1024px) */}
            <div className="hidden lg:flex items-center justify-between gap-6 h-full">
                {/* Left Column: Heading, Subtitle, CTAs */}
                <div className="flex-1 min-w-0 pr-4">
                    <h1 className="text-2xl font-semibold text-text tracking-tight truncate">
                        {HERO_CONFIG.title}
                    </h1>
                    <p className="text-sm text-text-2 mt-1 truncate">
                        {HERO_CONFIG.subtitle}
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                        <button
                            type="button"
                            onClick={scrollToCatalog}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent text-xs font-semibold rounded-md transition-colors cursor-pointer shadow-xs"
                        >
                            <span>{HERO_CONFIG.ctaCatalog}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <Link
                            href="/track"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface-2 hover:bg-surface-hover text-text border border-border text-xs font-semibold rounded-md transition-colors"
                        >
                            <span>{HERO_CONFIG.ctaTrack}</span>
                        </Link>
                    </div>
                </div>

                {/* Right Column: Status Panel + Logo Mosaic */}
                <div className="flex items-center gap-5 shrink-0">
                    {/* Status Panel (3 rows, 13px, tabular numbers) */}
                    <div className="space-y-2 text-[13px] bg-surface-2/60 border border-border/70 rounded-md p-3 min-w-[210px]">
                        <div className="flex items-center justify-between gap-3 text-text">
                            <span className="flex items-center gap-2 text-text-2 text-xs">
                                <Clock className="w-4 h-4 text-text-2 shrink-0" />
                                <span>Slot sewa hari ini</span>
                            </span>
                            <span className="font-mono font-medium text-xs tabular-nums text-text">
                                {available}/{max} tersisa
                            </span>
                        </div>

                        {typeof availableServicesCount === 'number' && (
                            <div className="flex items-center justify-between gap-3 text-text">
                                <span className="flex items-center gap-2 text-text-2 text-xs">
                                    <Package className="w-4 h-4 text-text-2 shrink-0" />
                                    <span>Layanan tersedia</span>
                                </span>
                                <span className="font-mono font-medium text-xs tabular-nums text-text">
                                    {availableServicesCount} layanan
                                </span>
                            </div>
                        )}

                        {verificationText && (
                            <div className="flex items-center justify-between gap-3 text-text">
                                <span className="flex items-center gap-2 text-text-2 text-xs">
                                    <ShieldCheck className="w-4 h-4 text-text-2 shrink-0" />
                                    <span>Verifikasi biasanya</span>
                                </span>
                                <span className="font-mono font-medium text-xs tabular-nums text-text">
                                    {verificationText}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Logo Mosaic (Max 6 services, flat tint, no rotation, no gradient) */}
                    {mosaicProducts.length > 0 && (
                        <div className="grid grid-cols-3 gap-1.5 shrink-0 pl-3 border-l border-border/60">
                            {mosaicProducts.map((p, idx) => (
                                <div
                                    key={idx}
                                    title={p.name}
                                    className="w-10 h-10 rounded-md border border-border bg-surface-2 flex items-center justify-center p-1 overflow-hidden"
                                    style={{
                                        borderColor: p.brand_color ? `${p.brand_color}33` : undefined,
                                    }}
                                >
                                    <img
                                        src={p.logo_url || p.thumbnail_path || ''}
                                        alt={p.name}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Layout (< 1024px) */}
            <div className="flex lg:hidden flex-col justify-between h-full space-y-2">
                <div>
                    <h1 className="text-lg sm:text-xl font-semibold text-text tracking-tight truncate">
                        {HERO_CONFIG.title}
                    </h1>
                    <p className="text-xs text-text-2 truncate mt-0.5">
                        {HERO_CONFIG.subtitle}
                    </p>
                </div>

                {/* Horizontal scrollable status chips */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-surface-2 text-[11px] text-text whitespace-nowrap shrink-0">
                        <Clock className="w-3.5 h-3.5 text-text-2" />
                        <span>
                            Slot sewa: <strong className="font-mono tabular-nums">{available}/{max}</strong>
                        </span>
                    </span>

                    {typeof availableServicesCount === 'number' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-surface-2 text-[11px] text-text whitespace-nowrap shrink-0">
                            <Package className="w-3.5 h-3.5 text-text-2" />
                            <span>
                                <strong className="font-mono tabular-nums">{availableServicesCount}</strong> layanan aktif
                            </span>
                        </span>
                    )}

                    {verificationText && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-surface-2 text-[11px] text-text whitespace-nowrap shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5 text-text-2" />
                            <span>Verifikasi {verificationText}</span>
                        </span>
                    )}
                </div>
            </div>
        </section>
    );
}
