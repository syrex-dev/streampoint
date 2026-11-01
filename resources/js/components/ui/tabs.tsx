import * as React from "react"
import { cn } from "@/lib/utils"

export interface TabItem {
    id: string;
    label: string;
    badge?: string;
    badgeVariant?: 'accent' | 'warning' | 'danger' | 'neutral';
    disabled?: boolean;
}

interface TabsProps {
    items: TabItem[];
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ items, activeTab, onChange, className }) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = (index + 1) % items.length;
            const nextTab = items[nextIndex];
            if (nextTab && !nextTab.disabled) {
                onChange(nextTab.id);
            }
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = (index - 1 + items.length) % items.length;
            const prevTab = items[prevIndex];
            if (prevTab && !prevTab.disabled) {
                onChange(prevTab.id);
            }
        }
    };

    return (
        <div
            role="tablist"
            className={cn(
                "flex border-b border-border bg-surface w-full p-1 gap-1 rounded-md",
                className
            )}
        >
            {items.map((tab, idx) => {
                const isActive = tab.id === activeTab;
                return (
                    <button
                        key={tab.id}
                        id={`tab-${tab.id}`}
                        role="tab"
                        type="button"
                        tabIndex={isActive ? 0 : -1}
                        aria-selected={isActive}
                        aria-controls={`tabpanel-${tab.id}`}
                        disabled={tab.disabled}
                        onClick={() => !tab.disabled && onChange(tab.id)}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        className={cn(
                            "flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded transition-colors outline-none",
                            "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                            isActive
                                ? "bg-surface-2 text-text border-b-2 border-accent"
                                : "text-text-2 hover:bg-surface-hover hover:text-text",
                            tab.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-text-2"
                        )}
                    >
                        <span>{tab.label}</span>
                        {tab.badge && (
                            <span
                                className={cn(
                                    "font-mono text-[11px] font-semibold px-1.5 py-0.2 rounded-sm tabular-nums",
                                    tab.badgeVariant === 'danger'
                                        ? "bg-danger/15 text-danger"
                                        : tab.badgeVariant === 'warning'
                                        ? "bg-warning/15 text-warning"
                                        : "bg-accent/15 text-accent-text"
                                )}
                            >
                                {tab.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default Tabs;
