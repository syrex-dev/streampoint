import React, { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: ReactNode;
    className?: string;
}

export function PageHeader({ title, description, children, className = '' }: PageHeaderProps) {
    return (
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-6 border-b border-border ${className}`}>
            <div>
                <h1 className="text-xl font-semibold tracking-tight text-text">{title}</h1>
                {description && (
                    <p className="text-sm text-text-2 mt-0.5">{description}</p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {children}
                </div>
            )}
        </div>
    );
}

