import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
    checked: boolean;
    onCheckedChange?: (checked: boolean) => void;
    showStateLabel?: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
}

export function Switch({
    checked,
    onCheckedChange,
    showStateLabel = true,
    activeLabel = "Aktif",
    inactiveLabel = "Nonaktif",
    disabled = false,
    className,
    id,
    ...props
}: SwitchProps) {
    const handleClick = () => {
        if (!disabled && onCheckedChange) {
            onCheckedChange(!checked);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (disabled) return;
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleClick();
        }
    };

    return (
        <div className="inline-flex items-center gap-2.5 min-h-[44px] select-none">
            <button
                id={id}
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                    "outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    checked
                        ? "bg-accent border border-accent"
                        : "bg-surface-2 border border-text-muted",
                    className
                )}
                {...props}
            >
                <span
                    className={cn(
                        "pointer-events-none block h-4 w-4 rounded-full transition-transform",
                        checked
                            ? "translate-x-6 bg-on-accent"
                            : "translate-x-1 bg-text-2"
                    )}
                />
            </button>
            {showStateLabel && (
                <span className="text-xs font-semibold text-text tabular-nums">
                    {checked ? activeLabel : inactiveLabel}
                </span>
            )}
        </div>
    );
}

export default Switch;

