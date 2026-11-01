import React, { useState, useMemo } from 'react';
import { Eye, EyeOff, ShieldCheck, Clock, AlertCircle, KeyRound } from 'lucide-react';
import { CopyButton } from '@/components/shop/CopyButton';
import { formatDateTimeWIB } from '@/lib/format';
import { OrderCredentials } from '@/types/shop';

interface CredentialBoxProps {
    credentials: OrderCredentials | null;
    orderType: 'RENT' | 'BUY';
    accessStartsAt: string | null;
    accessExpiresAt: string | null;
}

export function CredentialBox({
    credentials,
    orderType,
    accessStartsAt,
    accessExpiresAt,
}: CredentialBoxProps) {
    const [showPassword, setShowPassword] = useState(false);

    // Calculate whether rental period is expired
    const isExpired = useMemo(() => {
        if (!accessExpiresAt) return false;
        return new Date(accessExpiresAt).getTime() <= Date.now();
    }, [accessExpiresAt]);

    // Format remaining rental time
    const remainingTimeText = useMemo(() => {
        if (!accessExpiresAt) return null;
        const diffMs = new Date(accessExpiresAt).getTime() - Date.now();
        if (diffMs <= 0) return 'Masa sewa berakhir';

        const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (totalHours >= 24) {
            const days = Math.floor(totalHours / 24);
            const remainingHours = totalHours % 24;
            return `${days} hari ${remainingHours} jam`;
        }

        return `${totalHours} jam ${minutes} menit`;
    }, [accessExpiresAt]);

    if (!credentials) {
        return (
            <div className="bg-surface border border-border rounded-lg p-5 text-center text-xs text-text-2">
                Kredensial akun belum tersedia atau sedang diproses.
            </div>
        );
    }

    if (orderType === 'RENT' && isExpired) {
        return (
            <div className="bg-surface border border-danger/40 rounded-lg p-5 space-y-3">
                <div className="flex items-center gap-2 text-danger font-semibold text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Masa Sewa Berakhir</span>
                </div>
                <p className="text-xs text-text-2 leading-relaxed">
                    Masa sewa akun streaming ini telah selesai pada{' '}
                    <span className="font-mono text-text">
                        {accessExpiresAt ? formatDateTimeWIB(accessExpiresAt) : '-'}
                    </span>
                    . Kredensial telah dinonaktifkan secara otomatis.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-surface border border-accent/40 rounded-lg p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2 text-accent-text">
                    <KeyRound className="w-4 h-4 shrink-0" />
                    <h3 className="text-sm font-bold text-text">Kredensial Akun</h3>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent-text font-semibold">
                    {orderType === 'RENT' ? 'Akun Sewa' : 'Akun Milik'}
                </span>
            </div>

            {/* Credential rows */}
            <div className="space-y-2.5 text-xs">
                {/* Email / Username */}
                {credentials.email && (
                    <div className="bg-surface-2 p-3 rounded-md border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                            <div className="text-[11px] text-text-2 font-medium mb-0.5">Email / Username</div>
                            <div className="font-mono text-text font-semibold break-all select-all">
                                {credentials.email}
                            </div>
                        </div>
                        <div className="shrink-0 flex items-center justify-end">
                            <CopyButton text={credentials.email} label="Salin" />
                        </div>
                    </div>
                )}

                {/* Password */}
                {credentials.password && (
                    <div className="bg-surface-2 p-3 rounded-md border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                            <div className="text-[11px] text-text-2 font-medium mb-0.5">Password</div>
                            <div className="font-mono text-text font-semibold break-all select-all">
                                {showPassword ? credentials.password : '••••••••••••'}
                            </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5 justify-end">
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="h-8 px-2.5 rounded-md border border-border bg-surface hover:bg-surface-hover text-text-2 hover:text-text text-xs inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-accent"
                                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                            >
                                {showPassword ? (
                                    <>
                                        <EyeOff className="w-3.5 h-3.5" />
                                        <span>Sembunyikan</span>
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Tampilkan</span>
                                    </>
                                )}
                            </button>
                            <CopyButton text={credentials.password} label="Salin" />
                        </div>
                    </div>
                )}

                {/* Profile */}
                {credentials.profile && (
                    <div className="bg-surface-2 p-3 rounded-md border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                            <div className="text-[11px] text-text-2 font-medium mb-0.5">Profil</div>
                            <div className="font-mono text-text font-semibold select-all">
                                {credentials.profile}
                            </div>
                        </div>
                        <div className="shrink-0 flex items-center justify-end">
                            <CopyButton text={credentials.profile} label="Salin" />
                        </div>
                    </div>
                )}

                {/* PIN */}
                {credentials.pin && (
                    <div className="bg-surface-2 p-3 rounded-md border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                            <div className="text-[11px] text-text-2 font-medium mb-0.5">PIN Profil</div>
                            <div className="font-mono text-text font-semibold select-all">
                                {credentials.pin}
                            </div>
                        </div>
                        <div className="shrink-0 flex items-center justify-end">
                            <CopyButton text={credentials.pin} label="Salin" />
                        </div>
                    </div>
                )}
            </div>

            {/* Rental Duration / Active Info */}
            {orderType === 'RENT' && (
                <div className="pt-3 border-t border-border space-y-1.5 text-xs text-text-2">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-text-muted" />
                            <span>Mulai Sewa:</span>
                        </span>
                        <span className="font-mono text-text">
                            {accessStartsAt ? formatDateTimeWIB(accessStartsAt) : '-'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-text-muted" />
                            <span>Berakhir:</span>
                        </span>
                        <span className="font-mono text-text">
                            {accessExpiresAt ? formatDateTimeWIB(accessExpiresAt) : '-'}
                        </span>
                    </div>
                    {remainingTimeText && (
                        <div className="flex items-center justify-between pt-1">
                            <span>Sisa Waktu:</span>
                            <span className="font-mono font-bold text-accent-text tabular-nums">
                                {remainingTimeText}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {orderType === 'BUY' && (
                <div className="pt-3 border-t border-border flex items-center gap-2 text-xs text-accent-text">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Akun permanen milik pribadi. Segera ubah password untuk keamanan kamu.</span>
                </div>
            )}
        </div>
    );
}
