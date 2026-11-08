import React, { ReactNode } from 'react';

interface FormSectionProps {
    id?: string;
    title: string;
    description?: string;
    children: ReactNode;
    headerAction?: ReactNode;
    className?: string;
}

export function FormSection({
    id,
    title,
    description,
    children,
    headerAction,
    className = '',
}: FormSectionProps) {
    return (
        <section
            id={id}
            className={`p-4 sm:p-5 bg-surface border border-border rounded-lg scroll-mt-20 ${className}`}
        >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 pb-3 mb-4 border-b border-border">
                <div>
                    <h2 className="text-[15px] font-semibold text-text tracking-tight">{title}</h2>
                    {description && (
                        <p className="text-xs text-text-2 mt-0.5">{description}</p>
                    )}
                </div>
                {headerAction && (
                    <div className="shrink-0">{headerAction}</div>
                )}
            </div>

            <div className="space-y-4">
                {children}
            </div>
        </section>
    );
}

