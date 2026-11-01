import React from 'react';
import { MessageCircle } from 'lucide-react';

interface FloatingWhatsAppProps {
    phone: string | null | undefined;
    isProductPage?: boolean;
}

export function FloatingWhatsApp({ phone, isProductPage = false }: FloatingWhatsAppProps) {
    if (!phone || !phone.trim()) return null;

    // Clean phone number (strip non-digits, replace leading 0 with 62)
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
        clean = '62' + clean.slice(1);
    }

    const waUrl = `https://wa.me/${clean}?text=${encodeURIComponent('Halo Admin, saya butuh bantuan terkait layanan StreamPoint.')}`;

    return (
        <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Hubungi Admin WhatsApp"
            className={`fixed right-4 z-40 h-12 px-3.5 rounded-lg border border-border-strong bg-surface hover:bg-surface-hover text-text transition-all flex items-center gap-2 shadow-none outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isProductPage ? 'bottom-20 lg:bottom-4' : 'bottom-4'
            }`}
        >
            <MessageCircle className="w-5 h-5 text-accent-text shrink-0" />
            <span className="hidden sm:inline text-xs font-semibold tracking-tight">
                Bantuan
            </span>
        </a>
    );
}

export default FloatingWhatsApp;
