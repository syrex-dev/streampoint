import React, { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value?: string | number;
    description?: string;
    icon?: LucideIcon;
    isInfo?: boolean;
    isWarning?: boolean;
    badge?: ReactNode;
    children?: ReactNode;
    className?: string;
}

export function StatCard({
    label,
    value,
    description,
    icon: Icon,
    isInfo = false,
    isWarning = false,
    badge,
    children,
    className = '',
}: StatCardProps) {
    const borderClass = isInfo
        ? 'border-info/60 bg-info/5 ring-1 ring-info/20'
        : isWarning
        ? 'border-warning/60 bg-warning/5 ring-1 ring-warning/20'
        : 'border-border bg-surface';

    return (
        <div className={`p-4 rounded-lg border flex flex-col justify-between transition-colors min-h-[110px] ${borderClass} ${className}`}>
            <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs text-text-2 font-medium">{label}</span>
                <div className="flex items-center gap-1.5">
                    {badge}
                    {Icon && <Icon className="w-4 h-4 text-text-2 shrink-0" />}
                </div>
            </div>

            {children ? (
                children
            ) : (
                <div>
                    <div className="text-2xl sm:text-[28px] font-bold font-sans tracking-tight tabular-nums text-text leading-tight">
                        {value}
                    </div>
                    {description && (
                        <div className="text-xs text-text-2 mt-1 leading-normal">
                            {description}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

