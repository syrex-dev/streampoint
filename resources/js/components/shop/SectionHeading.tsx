import React, { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

interface SectionHeadingProps {
    eyebrow: string;
    title: string;
    action?: {
        label: string;
        href: string;
    };
    children?: ReactNode;
}

export function SectionHeading({ eyebrow, title, action, children }: SectionHeadingProps) {
    return (
        <div className="flex items-end justify-between gap-4 mb-2.5 sm:mb-3">
            <div>
                <span className="block text-[10px] sm:text-[11px] font-semibold text-text-2 uppercase tracking-[0.04em] mb-0.5">
                    {eyebrow}
                </span>
                <h2 className="text-base sm:text-lg font-semibold text-text leading-tight">
                    {title}
                </h2>
            </div>
            {action ? (
                <Link
                    href={action.href}
                    className="inline-flex items-center gap-1 text-xs font-medium text-text-2 hover:text-accent-text transition-colors shrink-0"
                >
                    <span>{action.label}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            ) : children}
        </div>
    );
}
