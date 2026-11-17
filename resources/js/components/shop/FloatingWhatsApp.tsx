import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface FloatingWhatsAppProps {
    phone: string | null | undefined;
    isProductPage?: boolean;
}

export function FloatingWhatsApp({ phone, isProductPage = false }: FloatingWhatsAppProps) {
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        try {
            if (sessionStorage.getItem('streampoint_wa_dismissed') === '1') {
                setIsDismissed(true);
            }
        } catch {
            // Ignore storage errors
        }
    }, []);

    const handleDismiss = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDismissed(true);
        try {
            sessionStorage.setItem('streampoint_wa_dismissed', '1');
        } catch {
            // Ignore storage errors
        }
    };

    if (!phone || !phone.trim() || isDismissed) {
        return null;
    }

    // Clean phone number (strip non-digits, replace leading 0 with 62)
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
        clean = '62' + clean.slice(1);
    }

    const waUrl = `https://wa.me/${clean}?text=${encodeURIComponent('Halo Admin, saya butuh bantuan terkait layanan StreamPoint.')}`;

    return (
        <div
            className={`fixed right-3 sm:right-5 z-40 flex items-center bg-surface/95 backdrop-blur-md border border-border-strong rounded-full shadow-lg transition-all duration-300 animate-in fade-in select-none ${
                isProductPage ? 'bottom-20 lg:bottom-6' : 'bottom-[4.25rem] md:bottom-6'
            }`}
        >
            {/* Clickable WhatsApp Action */}
            <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Hubungi Admin WhatsApp"
                className="flex items-center gap-2 py-2 pl-3 pr-1 text-text hover:text-accent-text transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-l-full"
            >
                <div className="relative flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-500 fill-emerald-500/10 shrink-0" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <span className="text-xs font-semibold tracking-tight whitespace-nowrap">
                    Chat Admin
                </span>
            </a>

            {/* Close / Dismiss Button */}
            <button
                type="button"
                onClick={handleDismiss}
                aria-label="Tutup gelembung bantuan"
                className="p-1.5 mr-1.5 text-text-muted hover:text-text rounded-full hover:bg-surface-2 transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-accent"
                title="Tutup"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

export default FloatingWhatsApp;
