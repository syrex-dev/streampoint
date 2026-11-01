import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useAppearance, Appearance } from '@/hooks/use-appearance';

export function ThemeToggle({ className = '' }: { className?: string }) {
    const { appearance, resolvedAppearance, updateAppearance } = useAppearance();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside or Esc
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const options: { value: Appearance; label: string; icon: React.ReactNode }[] = [
        { value: 'light', label: 'Terang', icon: <Sun className="w-3.5 h-3.5" /> },
        { value: 'dark', label: 'Gelap', icon: <Moon className="w-3.5 h-3.5" /> },
        { value: 'system', label: 'Sistem', icon: <Monitor className="w-3.5 h-3.5" /> },
    ];

    return (
        <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Ubah tema"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                className="w-9 h-9 rounded-md border border-border bg-surface hover:bg-surface-hover text-text flex items-center justify-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface cursor-pointer"
            >
                {resolvedAppearance === 'dark' ? (
                    <Moon className="w-4 h-4 text-text" />
                ) : (
                    <Sun className="w-4 h-4 text-text" />
                )}
            </button>

            {isOpen && (
                <div
                    role="menu"
                    aria-label="Pilihan tema"
                    className="absolute right-0 mt-1.5 w-36 rounded-md border border-border bg-surface p-1 shadow-none z-50 focus:outline-none"
                >
                    {options.map((opt) => {
                        const isSelected = appearance === opt.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    updateAppearance(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-sm transition-colors cursor-pointer ${
                                    isSelected
                                        ? 'bg-surface-2 text-text font-semibold'
                                        : 'text-text-2 hover:text-text hover:bg-surface-hover'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    {opt.icon}
                                    <span>{opt.label}</span>
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-accent-text" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ThemeToggle;
