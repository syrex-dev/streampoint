import React from 'react';
import { KeyRound, Mail, Sparkles, Clock, CheckCircle2, Info } from 'lucide-react';
import { CredentialBox } from '@/components/shop/CredentialBox';
import { OrderInvoiceData } from '@/types/shop';

interface DeliveryPanelProps {
    order: OrderInvoiceData;
    isAuthorized: boolean;
}

export function DeliveryPanel({ order, isAuthorized }: DeliveryPanelProps) {
    const deliveryType = order.delivery_type || 'STOCK';
    const isPaid = order.status === 'PAID';

    if (deliveryType === 'STOCK') {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent-text border border-accent/20">
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Dikirim Langsung di Invoice</span>
                        </span>
                    </div>
                    {order.eta_text && (
                        <span className="text-xs text-text-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {order.eta_text}
                        </span>
                    )}
                </div>

                {/* Credential Box */}
                <CredentialBox
                    credentials={order.credentials}
                    orderType={order.order_type}
                    accessStartsAt={order.access_starts_at}
                    accessExpiresAt={order.access_expires_at}
                />

                {/* Delivery Instructions */}
                {isPaid && isAuthorized && order.delivery_instructions && (
                    <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-text">
                            <Info className="w-4 h-4 text-accent-text shrink-0" />
                            <span>Panduan Penggunaan</span>
                        </div>
                        <div className="text-xs text-text-2 whitespace-pre-line leading-relaxed">
                            {order.delivery_instructions}
                        </div>
                    </div>
                )}

                {/* Buyer Inputs Summary if any */}
                {order.buyer_inputs && Object.keys(order.buyer_inputs).length > 0 && (
                    <div className="bg-surface border border-border rounded-lg p-3 text-xs space-y-1.5">
                        <span className="text-text-muted font-medium text-[11px]">Data Pemesan:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(order.buyer_inputs).map(([k, v]) => (
                                <div key={k} className="flex items-center justify-between bg-surface-2 px-2.5 py-1.5 rounded border border-border">
                                    <span className="text-text-muted capitalize">{k.replace('_', ' ')}:</span>
                                    <span className="font-mono text-text font-semibold">{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Fallback for INVITE / MANUAL (Phase 9B & 9C)
    return (
        <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-accent-text">
                <Mail className="w-4 h-4" />
                <h3 className="text-sm font-bold text-text">Pengiriman Pesanan</h3>
            </div>
            <p className="text-xs text-text-2">
                Pesanan sedang diproses. Detail pengiriman akan diperbarui oleh admin di halaman ini.
            </p>
        </div>
    );
}
