import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

interface AnnouncementBarProps {
    announcement?: {
        text: string;
        url?: string | null;
    } | null;
}

export function AnnouncementBar({ announcement }: AnnouncementBarProps) {
    if (!announcement || !announcement.text) {
        return null;
    }

    const isExternal = announcement.url?.startsWith('http');
    const content = (
        <div
            role="region"
            aria-label="Pengumuman"
            data-testid="announcement-bar"
            className="h-8 bg-surface-2 border-b border-border text-xs font-medium text-text px-4 flex items-center justify-center gap-1.5 transition-colors"
        >
            <span className="truncate max-w-full text-center">{announcement.text}</span>
            {announcement.url && (
                <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" strokeWidth={2} />
            )}
        </div>
    );

    if (announcement.url) {
        if (isExternal) {
            return (
                <a
                    href={announcement.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                >
                    {content}
                </a>
            );
        }

        return (
            <Link
                href={announcement.url}
                className="block hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
                {content}
            </Link>
        );
    }

    return content;
}
