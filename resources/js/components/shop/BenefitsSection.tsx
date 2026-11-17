import React from 'react';
import { 
    ShieldCheck, 
    Users, 
    LifeBuoy, 
    Receipt, 
    KeyRound, 
    SearchCheck,
    ShoppingBag,
    Clock
} from 'lucide-react';
import { benefits, BenefitItem } from '@/data/benefits';
import { SectionHeading } from '@/components/shop/SectionHeading';

interface BenefitsSectionProps {
    stats?: {
        completed_orders?: number | null;
        active_services?: number | null;
    } | null;
    verificationMedianMinutes?: number | null;
}

export function BenefitsSection({ stats, verificationMedianMinutes }: BenefitsSectionProps) {
    const renderIcon = (iconName: BenefitItem['icon']) => {
        const iconClasses = "w-4 h-4 sm:w-5 sm:h-5 text-accent-text";
        switch (iconName) {
            case 'ShieldCheck':
                return <ShieldCheck className={iconClasses} />;
            case 'Users':
                return <Users className={iconClasses} />;
            case 'LifeBuoy':
                return <LifeBuoy className={iconClasses} />;
            case 'Receipt':
                return <Receipt className={iconClasses} />;
            case 'KeyRound':
                return <KeyRound className={iconClasses} />;
            case 'SearchCheck':
                return <SearchCheck className={iconClasses} />;
            default:
                return <ShieldCheck className={iconClasses} />;
        }
    };

    // Real stats items (DESIGN_SYSTEM 6.38)
    const statCards: Array<{ id: string; icon: React.ReactNode; value: string; label: string }> = [];

    if (typeof stats?.completed_orders === 'number' && stats.completed_orders > 0) {
        statCards.push({
            id: 'completed_orders',
            icon: <ShoppingBag className="w-5 h-5 text-accent-text" />,
            value: stats.completed_orders.toLocaleString('id-ID'),
            label: 'Pesanan Selesai',
        });
    }

    if (typeof verificationMedianMinutes === 'number' && verificationMedianMinutes > 0) {
        statCards.push({
            id: 'verification_median',
            icon: <Clock className="w-5 h-5 text-warning" />,
            value: `± ${verificationMedianMinutes} menit`,
            label: 'Rata-rata Verifikasi',
        });
    }

    return (
        <section id="kenapa-kami" aria-label="Kenapa Beli di Sini" className="pt-2">
            <SectionHeading
                eyebrow="KEUNGGULAN TOKO"
                title="Kenapa Beli di Sini"
            />

            {/* Real Statistics Bar (DESIGN_SYSTEM 6.38 - Only rendered if >= 1 card satisfies thresholds) */}
            {statCards.length > 0 && (
                <div 
                    data-testid="real-stats-bar" 
                    className={`grid gap-3 mb-4 ${
                        statCards.length === 1 
                            ? 'grid-cols-1' 
                            : statCards.length === 2 
                                ? 'grid-cols-1 sm:grid-cols-2' 
                                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    }`}
                >
                    {statCards.map((card) => (
                        <div
                            key={card.id}
                            className="bg-surface border border-border rounded-lg p-3.5 flex items-center gap-3.5 shadow-2xs"
                        >
                            <div className="w-9 h-9 rounded-md bg-surface-2 border border-border flex items-center justify-center shrink-0">
                                {card.icon}
                            </div>
                            <div className="min-w-0">
                                <div className="font-mono text-lg font-bold text-text tabular-nums leading-tight">
                                    {card.value}
                                </div>
                                <div className="text-xs text-text-2 mt-0.5">
                                    {card.label}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Benefits Grid - 2 cols on mobile, 3 cols on desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {benefits.slice(0, 6).map((item) => (
                    <div
                        key={item.id}
                        className="bg-surface border border-border rounded-xl p-2.5 sm:p-3.5 flex flex-col sm:flex-row items-start gap-2 sm:gap-3 shadow-2xs hover:border-border-strong transition-colors"
                    >
                        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-md bg-surface-2 border border-border flex items-center justify-center shrink-0">
                            {renderIcon(item.icon)}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-semibold text-text line-clamp-1">
                                {item.title}
                            </h3>
                            <p className="text-[11px] sm:text-xs text-text-2 leading-tight sm:leading-snug mt-0.5 line-clamp-2">
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
