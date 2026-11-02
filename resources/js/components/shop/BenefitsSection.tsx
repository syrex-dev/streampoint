import React from 'react';
import { 
    ShieldCheck, 
    Users, 
    LifeBuoy, 
    Receipt, 
    KeyRound, 
    SearchCheck 
} from 'lucide-react';
import { benefits, BenefitItem } from '@/data/benefits';

export function BenefitsSection() {
    const renderIcon = (iconName: BenefitItem['icon']) => {
        switch (iconName) {
            case 'ShieldCheck':
                return <ShieldCheck className="w-5 h-5 text-accent-text" />;
            case 'Users':
                return <Users className="w-5 h-5 text-accent-text" />;
            case 'LifeBuoy':
                return <LifeBuoy className="w-5 h-5 text-accent-text" />;
            case 'Receipt':
                return <Receipt className="w-5 h-5 text-accent-text" />;
            case 'KeyRound':
                return <KeyRound className="w-5 h-5 text-accent-text" />;
            case 'SearchCheck':
                return <SearchCheck className="w-5 h-5 text-accent-text" />;
            default:
                return <ShieldCheck className="w-5 h-5 text-accent-text" />;
        }
    };

    return (
        <section id="kenapa-kami" aria-label="Kenapa Beli di Sini" className="space-y-4 pt-4">
            <div>
                <h2 className="text-base font-semibold text-text tracking-tight">
                    Kenapa Beli di Sini
                </h2>
                <p className="text-xs text-text-2 mt-0.5">
                    Standar transparansi dan keandalan layanan sewa & beli akun streaming kami.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {benefits.slice(0, 6).map((item) => (
                    <div
                        key={item.id}
                        className="bg-surface border border-border rounded-lg p-3.5 flex items-start gap-3 min-h-[76px] max-h-[96px] transition-colors"
                    >
                        <div className="w-9 h-9 rounded-md bg-surface-2 border border-border flex items-center justify-center shrink-0">
                            {renderIcon(item.icon)}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                            <h3 className="text-sm font-semibold text-text truncate">
                                {item.title}
                            </h3>
                            <p className="text-[13px] text-text-2 leading-snug line-clamp-2">
                                {item.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default BenefitsSection;
