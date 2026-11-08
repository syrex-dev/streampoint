import React from 'react';
import { Check, X } from 'lucide-react';

export type OrderStepStatus = 'PENDING' | 'VERIFYING' | 'PAID' | 'EXPIRED' | 'CANCELLED';

interface OrderStepperProps {
    status: OrderStepStatus;
    className?: string;
}

export function OrderStepper({ status, className = '' }: OrderStepperProps) {
    // 4 standard steps: Dibuat -> Dibayar -> Diverifikasi -> Selesai
    const steps = [
        { id: 1, key: 'created', label: 'Dibuat' },
        { 
            id: 2, 
            key: 'paid', 
            label: status === 'EXPIRED' 
                ? 'Kedaluwarsa' 
                : status === 'CANCELLED' 
                    ? 'Dibatalkan' 
                    : 'Dibayar' 
        },
        { id: 3, key: 'verifying', label: 'Diverifikasi' },
        { id: 4, key: 'completed', label: 'Selesai' },
    ];

    // Determine state for each step
    const getStepState = (stepId: number) => {
        if (status === 'PAID') {
            return 'completed';
        }

        if (status === 'VERIFYING') {
            if (stepId <= 2) return 'completed';
            if (stepId === 3) return 'active';
            return 'upcoming';
        }

        if (status === 'PENDING') {
            if (stepId === 1) return 'completed';
            if (stepId === 2) return 'active';
            return 'upcoming';
        }

        if (status === 'EXPIRED' || status === 'CANCELLED') {
            if (stepId === 1) return 'completed';
            if (stepId === 2) return 'failed'; // stopped at step 2
            return 'upcoming';
        }

        return 'upcoming';
    };

    return (
        <div
            aria-label="Langkah pesanan"
            className={`w-full bg-surface border border-border rounded-lg p-3 sm:p-4 ${className}`}
        >
            <ol className="flex flex-col min-[480px]:flex-row items-start min-[480px]:items-center justify-between gap-3 min-[480px]:gap-0 relative">
                {steps.map((step, idx) => {
                    const state = getStepState(step.id);
                    const isLast = idx === steps.length - 1;
                    const isActive = state === 'active' || state === 'failed';

                    return (
                        <li
                            key={step.id}
                            aria-current={isActive ? 'step' : undefined}
                            className="flex items-center min-[480px]:flex-1 w-full min-[480px]:w-auto last:flex-none"
                        >
                            <div className="flex items-center gap-2.5 min-[480px]:flex-col min-[480px]:text-center shrink-0">
                                {/* Step Circle (24px) */}
                                <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                        state === 'completed'
                                            ? 'bg-accent text-on-accent'
                                            : state === 'active'
                                            ? 'border-2 border-accent bg-surface'
                                            : state === 'failed'
                                            ? 'border border-danger bg-danger/10 text-danger'
                                            : 'border border-border-strong bg-surface-2 text-text-muted'
                                    }`}
                                >
                                    {state === 'completed' ? (
                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    ) : state === 'active' ? (
                                        <div className="w-2 h-2 rounded-full bg-accent" />
                                    ) : state === 'failed' ? (
                                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                    ) : (
                                        <span className="text-[11px] font-mono">{step.id}</span>
                                    )}
                                </div>

                                {/* Step Label */}
                                <span
                                    className={`text-xs font-medium ${
                                        state === 'completed'
                                            ? 'text-text font-semibold'
                                            : state === 'active'
                                            ? 'text-accent-text font-semibold'
                                            : state === 'failed'
                                            ? 'text-danger font-semibold'
                                            : 'text-text-muted'
                                    }`}
                                >
                                    {step.label}
                                </span>
                            </div>

                            {/* Connecting Line (Horizontal >= 480px) */}
                            {!isLast && (
                                <div
                                    aria-hidden="true"
                                    className={`hidden min-[480px]:block flex-1 h-0.5 mx-2 min-[480px]:mt-[-16px] transition-colors ${
                                        state === 'completed' ? 'bg-accent' : 'bg-border'
                                    }`}
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

export default OrderStepper;

