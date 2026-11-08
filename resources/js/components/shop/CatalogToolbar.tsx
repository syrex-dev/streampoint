import React, { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

export type CatalogTypeFilter = 'ALL' | 'RENT' | 'BUY';
export type CatalogSortOption = 'default' | 'bestseller' | 'newest' | 'price_asc';

interface CatalogToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedType: CatalogTypeFilter;
    onTypeChange: (type: CatalogTypeFilter) => void;
    categories: string[];
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    selectedSort: CatalogSortOption;
    onSortChange: (sort: CatalogSortOption) => void;
    showBestsellerSort: boolean;
}

export function CatalogToolbar({
    searchQuery,
    onSearchChange,
    selectedType,
    onTypeChange,
    categories,
    selectedCategory,
    onCategoryChange,
    selectedSort,
    onSortChange,
    showBestsellerSort,
}: CatalogToolbarProps) {
    const [localQuery, setLocalQuery] = useState(searchQuery);

    // Sync from parent if reset
    useEffect(() => {
        setLocalQuery(searchQuery);
    }, [searchQuery]);

    // 150ms debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            if (localQuery !== searchQuery) {
                onSearchChange(localQuery);
            }
        }, 150);

        return () => clearTimeout(handler);
    }, [localQuery, searchQuery, onSearchChange]);

    const handleClearSearch = () => {
        setLocalQuery('');
        onSearchChange('');
    };

    const typeSegments: { value: CatalogTypeFilter; label: string }[] = [
        { value: 'ALL', label: 'Semua' },
        { value: 'RENT', label: 'Sewa' },
        { value: 'BUY', label: 'Beli' },
    ];

    const sortOptions: { value: CatalogSortOption; label: string }[] = [
        { value: 'default', label: 'Urutan Toko' },
        ...(showBestsellerSort ? [{ value: 'bestseller' as const, label: 'Terlaris' }] : []),
        { value: 'newest', label: 'Terbaru' },
        { value: 'price_asc', label: 'Harga Terendah' },
    ];

    return (
        <div className="w-full flex flex-col md:flex-row items-stretch md:items-center gap-2 md:h-9">
            {/* Search Input (36px / 40px) */}
            <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-text-2 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                    type="text"
                    value={localQuery}
                    onChange={(e) => setLocalQuery(e.target.value)}
                    placeholder="Cari layanan..."
                    className="w-full h-9 pl-9 pr-8 text-xs bg-surface border border-border rounded-lg text-text placeholder:text-text-2 focus:outline-none focus:ring-2 focus:ring-accent focus:border-border-strong transition-colors"
                />
                {localQuery && (
                    <button
                        type="button"
                        onClick={handleClearSearch}
                        aria-label="Hapus pencarian"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-2 hover:text-text p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Filter & Sort Controls Row (scrollable on mobile) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 md:pb-0 scrollbar-none shrink-0">
                {/* Type Segment Control */}
                <div className="h-8 md:h-9 p-0.5 bg-surface-2 border border-border rounded-lg inline-flex items-center shrink-0">
                    {typeSegments.map((seg) => {
                        const isActive = selectedType === seg.value;
                        return (
                            <button
                                key={seg.value}
                                type="button"
                                onClick={() => onTypeChange(seg.value)}
                                className={`h-full px-2.5 sm:px-3 text-xs font-medium rounded-md transition-all ${
                                    isActive
                                        ? 'bg-surface text-text shadow-sm border border-border/50'
                                        : 'text-text-2 hover:text-text'
                                }`}
                            >
                                {seg.label}
                            </button>
                        );
                    })}
                </div>

                {/* Category Dropdown (hidden if <= 1 category) */}
                {categories.length > 1 && (
                    <div className="relative shrink-0">
                        <select
                            value={selectedCategory}
                            onChange={(e) => onCategoryChange(e.target.value)}
                            aria-label="Pilih kategori"
                            className="h-9 md:h-10 pl-3 pr-8 text-xs font-medium bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer appearance-none"
                        >
                            <option value="ALL">Semua Kategori</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-2 text-[10px]">
                            ▼
                        </span>
                    </div>
                )}

                {/* Sort Dropdown */}
                <div className="relative shrink-0">
                    <select
                        value={selectedSort}
                        onChange={(e) => onSortChange(e.target.value as CatalogSortOption)}
                        aria-label="Urutkan katalog"
                        className="h-9 md:h-10 pl-3 pr-8 text-xs font-medium bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer appearance-none"
                    >
                        {sortOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-2 text-[10px]">
                        ▼
                    </span>
                </div>
            </div>
        </div>
    );
}
