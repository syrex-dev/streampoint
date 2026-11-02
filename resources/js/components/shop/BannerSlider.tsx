import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { BannerData } from '@/types/shop';

interface BannerSliderProps {
    banners: BannerData[];
}

export function BannerSlider({ banners }: BannerSliderProps) {
    if (!banners || banners.length === 0) {
        return null;
    }

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const total = banners.length;

    // Track scroll position to update current index dot
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, clientWidth } = scrollContainerRef.current;
        if (clientWidth === 0) return;
        const newIndex = Math.round(scrollLeft / clientWidth);
        if (newIndex >= 0 && newIndex < total && newIndex !== currentIndex) {
            setCurrentIndex(newIndex);
        }
    };

    const scrollToIndex = (index: number) => {
        if (!scrollContainerRef.current) return;
        const targetIndex = Math.max(0, Math.min(index, total - 1));
        const clientWidth = scrollContainerRef.current.clientWidth;
        scrollContainerRef.current.scrollTo({
            left: targetIndex * clientWidth,
            behavior: 'smooth',
        });
        setCurrentIndex(targetIndex);
    };

    // Keyboard navigation (ArrowLeft & ArrowRight)
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (total <= 1) return;
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            scrollToIndex(currentIndex - 1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            scrollToIndex(currentIndex + 1);
        }
    };

    const getToneStyle = (tone: BannerData['tone']) => {
        switch (tone) {
            case 'accent':
                return {
                    backgroundColor: 'color-mix(in srgb, var(--accent) 10%, var(--surface))',
                    borderColor: 'color-mix(in srgb, var(--accent) 30%, var(--border))',
                };
            case 'warning':
                return {
                    backgroundColor: 'color-mix(in srgb, var(--warning) 10%, var(--surface))',
                    borderColor: 'color-mix(in srgb, var(--warning) 30%, var(--border))',
                };
            default:
                return {
                    backgroundColor: 'var(--surface-2)',
                    borderColor: 'var(--border)',
                };
        }
    };

    return (
        <section
            aria-label="Banner Pengumuman & Promo"
            data-testid="banner-slider"
            onKeyDown={handleKeyDown}
            tabIndex={0}
            className="relative w-full h-[120px] md:h-[160px] rounded-lg overflow-hidden border border-border outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
            {/* Scrollable Container with horizontal snap */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="h-full w-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {banners.map((banner) => (
                    <div
                        key={banner.id}
                        className="snap-start shrink-0 w-full h-full relative overflow-hidden transition-colors flex items-center justify-between p-3.5 sm:p-4 md:p-6"
                        style={getToneStyle(banner.tone)}
                    >
                        {/* Text and optional button container */}
                        <div className={`space-y-1 sm:space-y-1.5 md:space-y-2 z-10 ${banner.image_path ? 'max-w-[65%] sm:max-w-[70%]' : 'max-w-full'}`}>
                            <h2 className="text-xs sm:text-sm md:text-base font-semibold text-text leading-snug line-clamp-2">
                                {banner.title}
                            </h2>

                            {banner.subtitle && (
                                <p className="text-[11px] sm:text-xs md:text-[13px] text-text-2 leading-tight sm:leading-relaxed line-clamp-2">
                                    {banner.subtitle}
                                </p>
                            )}

                            {banner.cta_label && banner.cta_url && (
                                <div className="pt-0.5 sm:pt-1">
                                    <a
                                        href={banner.cta_url}
                                        className="h-7 sm:h-8 px-2.5 sm:px-3 rounded text-[11px] sm:text-xs font-semibold bg-surface border border-border text-text hover:bg-surface-hover transition-colors inline-flex items-center gap-1.5 shadow-none outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                    >
                                        <span>{banner.cta_label}</span>
                                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-text-2" />
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Optional Right-side Image (max 35% width, object-cover, text NEVER on top) */}
                        {banner.image_path && (
                            <div className="w-[30%] sm:w-[35%] h-full absolute right-0 top-0 bottom-0 overflow-hidden shrink-0 border-l border-border/50">
                                <img
                                    src={banner.image_path}
                                    alt={banner.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Slider Controls (only when total > 1) */}
            {total > 1 && (
                <>
                    {/* Left & Right desktop arrows */}
                    <button
                        type="button"
                        onClick={() => scrollToIndex(currentIndex - 1)}
                        disabled={currentIndex === 0}
                        aria-label="Banner sebelumnya"
                        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-surface/90 hover:bg-surface border border-border items-center justify-center text-text disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs z-20 outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => scrollToIndex(currentIndex + 1)}
                        disabled={currentIndex === total - 1}
                        aria-label="Banner berikutnya"
                        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-surface/90 hover:bg-surface border border-border items-center justify-center text-text disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs z-20 outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Dot indicators positioned inside bottom */}
                    <div className="absolute bottom-1.5 sm:bottom-2 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 z-20 pointer-events-auto">
                        {banners.map((_, dotIdx) => (
                            <button
                                key={dotIdx}
                                type="button"
                                onClick={() => scrollToIndex(dotIdx)}
                                aria-label={`Banner ${dotIdx + 1} dari ${total}`}
                                className={`h-1.5 rounded-full transition-all outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                                    dotIdx === currentIndex
                                        ? 'w-5 bg-accent'
                                        : 'w-1.5 bg-border-strong hover:bg-text-2'
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}

export default BannerSlider;
