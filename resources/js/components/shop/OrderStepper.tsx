import React from 'react';
import { Check, X } from 'lucide-react';

export type OrderStepStatus = 'PENDING' | 'VERIFYING' | 'PAID' | 'EXPIRED' | 'CANCELLED';

interface OrderStepperProps {
    status: OrderStepStatus;
    className?: string;
}

export function OrderStepper({ status, className = '' }: OrderStepperProps) {
    // 4 standard steps: Dibuat -> Dibayar -> Verifikasi -> Selesai
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
        { id: 3, key: 'verifying', label: 'Verifikasi' },
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
            aria-label="Langkah status pesanan"
            className={`w-full bg-surface border border-border rounded-xl p-3.5 sm:p-5 shadow-2xs ${className}`}
        >
            <ol className="flex items-start w-full relative">
                {steps.map((step, idx) => {
                    const state = getStepState(step.id);
                    const isLast = idx === steps.length - 1;
                    const isActive = state === 'active';
                    const isCompleted = state === 'completed';
                    const isFailed = state === 'failed';
                    const nextStep = !isLast ? steps[idx + 1] : null;
                    const nextStepState = nextStep ? getStepState(nextStep.id) : 'upcoming';

                    return (
                        <li
                            key={step.id}
                            aria-current={isActive ? 'step' : undefined}
                            className="relative flex-1 flex flex-col items-center group"
                        >
                            {/* Connecting Line to Next Step */}
                            {!isLast && (
                                <div
                                    aria-hidden="true"
                                    className="absolute top-3.5 sm:top-4 left-1/2 w-full h-[2px] -translate-y-1/2 z-0 px-2 sm:px-3 pointer-events-none"
                                >
                                    <div
                                        className={`w-full h-full transition-colors duration-300 rounded-full ${
                                            isCompleted && (nextStepState === 'completed' || nextStepState === 'active')
                                                ? 'bg-accent'
                                                : isFailed
                                                ? 'bg-danger/40'
                                                : 'bg-border'
                                        }`}
                                    />
                                </div>
                            )}

                            {/* Step Indicator Node (Circle) */}
                            <div
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 relative z-10 ${
                                    isCompleted
                                        ? 'bg-accent text-on-accent shadow-xs'
                                        : isActive
                                        ? 'border-2 border-accent bg-surface text-accent ring-4 ring-accent/20'
                                        : isFailed
                                        ? 'border-2 border-danger bg-danger/10 text-danger ring-4 ring-danger/20'
                                        : 'border border-border bg-surface-2 text-text-muted'
                                }`}
                            >
                                {isCompleted ? (
                                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                                ) : isActive ? (
                                    <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                                ) : isFailed ? (
                                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                                ) : (
                                    <span className="text-[11px] sm:text-xs font-mono font-medium">{step.id}</span>
                                )}
                            </div>

                            {/* Step Label */}
                            <div className="mt-1.5 sm:mt-2 text-center w-full px-0.5">
                                <span
                                    className={`block text-[11px] sm:text-xs tracking-tight leading-tight select-none ${
                                        isCompleted
                                            ? 'text-text font-semibold'
                                            : isActive
                                            ? 'text-accent-text font-bold'
                                            : isFailed
                                            ? 'text-danger font-semibold'
                                            : 'text-text-muted font-normal'
                                    }`}
                                >
                                    {step.label}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

export default OrderStepper;

