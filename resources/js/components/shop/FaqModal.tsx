import React, { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, Search, ChevronDown, MessageCircle } from 'lucide-react';
import { faqData, FaqItem } from '@/data/faq';

interface FaqModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    adminWhatsapp?: string | null;
}

export function FaqModal({ open, onOpenChange, adminWhatsapp }: FaqModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [openIds, setOpenIds] = useState<Record<string, boolean>>({
        'faq-1': true,
    });

    const toggleItem = (id: string) => {
        setOpenIds((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const filteredFaqs = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return faqData;
        return faqData.filter(
            (item) =>
                item.question.toLowerCase().includes(query) ||
                item.answer.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    let cleanAdminPhone = adminWhatsapp ? adminWhatsapp.replace(/\D/g, '') : '';
    if (cleanAdminPhone.startsWith('0')) {
        cleanAdminPhone = '62' + cleanAdminPhone.slice(1);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-5 sm:p-6 gap-4">
                <DialogHeader className="space-y-1.5 text-left border-b border-border pb-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-surface-2 border border-border flex items-center justify-center shrink-0">
                            <HelpCircle className="w-4 h-4 text-accent-text" />
                        </div>
                        <div>
                            <DialogTitle className="text-sm sm:text-base font-semibold text-text">
                                Tanya Jawab & Bantuan Pemesanan
                            </DialogTitle>
                            <DialogDescription className="text-xs text-text-2">
                                Jawaban lengkap seputar garansi akun, kuota harian, dan cara klaim pesanan.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Quick Search */}
                <div className="relative shrink-0">
                    <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari pertanyaan atau kata kunci..."
                        className="w-full h-9 pl-9 pr-3 bg-surface-2 border border-border rounded-md text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
                    />
                </div>

                {/* Accordion Questions List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
                    {filteredFaqs.length === 0 ? (
                        <div className="text-center py-8 text-xs text-text-2 bg-surface-2 rounded-lg border border-border">
                            Tidak ditemukan pertanyaan yang cocok dengan "{searchQuery}".
                        </div>
                    ) : (
                        <div className="bg-surface border border-border rounded-lg divide-y divide-border overflow-hidden">
                            {filteredFaqs.map((faq) => {
                                const isOpen = !!openIds[faq.id];
                                return (
                                    <div key={faq.id} className="transition-colors">
                                        <button
                                            type="button"
                                            id={`modal-faq-btn-${faq.id}`}
                                            aria-expanded={isOpen}
                                            aria-controls={`modal-faq-panel-${faq.id}`}
                                            onClick={() => toggleItem(faq.id)}
                                            className="w-full min-h-[44px] px-3.5 py-3 text-left flex items-center justify-between gap-3 text-xs font-semibold text-text hover:bg-surface-hover transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
                                        >
                                            <span>{faq.question}</span>
                                            <ChevronDown
                                                className={`w-3.5 h-3.5 text-text-2 shrink-0 transition-transform duration-150 ${
                                                    isOpen ? 'rotate-180 text-text' : ''
                                                }`}
                                            />
                                        </button>

                                        {isOpen && (
                                            <div
                                                id={`modal-faq-panel-${faq.id}`}
                                                role="region"
                                                aria-labelledby={`modal-faq-btn-${faq.id}`}
                                                className="px-3.5 pb-3 pt-0 text-xs text-text-2 leading-relaxed"
                                            >
                                                {faq.answer}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Dialog Footer */}
                <DialogFooter className="border-t border-border pt-3 flex items-center justify-between gap-3 sm:justify-between shrink-0">
                    {cleanAdminPhone ? (
                        <a
                            href={`https://wa.me/${cleanAdminPhone}?text=${encodeURIComponent(
                                'Halo Admin StreamPoint, saya memiliki pertanyaan seputar layanan...'
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-text-2 hover:text-accent-text transition-colors"
                        >
                            <MessageCircle className="w-3.5 h-3.5 text-accent-text" />
                            <span>Butuh bantuan lain? Chat Admin</span>
                        </a>
                    ) : (
                        <div />
                    )}
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                    >
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default FaqModal;

