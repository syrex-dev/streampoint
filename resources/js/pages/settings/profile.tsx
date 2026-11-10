import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PageHeader } from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import { User, Lock, Check, AlertCircle } from 'lucide-react';
import type { Auth } from '@/types';

interface PageProps {
    auth: Auth;
    status?: string;
    [key: string]: unknown;
}

export default function Profile({ status }: { status?: string }) {
    const { auth } = usePage<PageProps>().props;

    // Profile Form
    const profileForm = useForm({
        name: auth?.user?.name || '',
        email: auth?.user?.email || '',
    });

    // Password Form
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        profileForm.patch('/settings/profile', {
            preserveScroll: true,
        });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        passwordForm.put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset();
            },
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <PageHeader
                title="Profil & Keamanan Akun"
                description="Kelola nama, alamat email admin, dan kata sandi masuk untuk mengamankan panel admin StreamPoint."
            />

            {status && (
                <div className="p-3.5 bg-accent/10 border border-accent/30 rounded-lg text-xs text-accent-text flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{status}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Profile Information Card */}
                <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
                    <div className="flex items-center gap-3 pb-3 border-b border-border">
                        <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text shrink-0">
                            <User className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-text">Informasi Akun</h2>
                            <p className="text-xs text-text-3">Perbarui nama tampilan dan email akun admin.</p>
                        </div>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        {profileForm.recentlySuccessful && (
                            <div className="p-2.5 bg-accent/10 border border-accent/30 rounded-md text-xs text-accent-text flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 shrink-0" />
                                <span>Informasi profil berhasil diperbarui.</span>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text block">
                                Nama Lengkap <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                value={profileForm.data.name}
                                onChange={(e) => profileForm.setData('name', e.target.value)}
                                required
                                className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text placeholder:text-text-3 focus:outline-none focus:border-accent"
                                placeholder="Nama Admin"
                            />
                            {profileForm.errors.name && (
                                <p className="text-[11px] text-danger">{profileForm.errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text block">
                                Alamat Email <span className="text-danger">*</span>
                            </label>
                            <input
                                type="email"
                                value={profileForm.data.email}
                                onChange={(e) => profileForm.setData('email', e.target.value)}
                                required
                                className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text placeholder:text-text-3 focus:outline-none focus:border-accent font-mono"
                                placeholder="admin@domain.com"
                            />
                            {profileForm.errors.email && (
                                <p className="text-[11px] text-danger">{profileForm.errors.email}</p>
                            )}
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={profileForm.processing}
                                loading={profileForm.processing}
                                className="w-full sm:w-auto"
                            >
                                Simpan Profil
                            </Button>
                        </div>
                    </form>
                </div>

                {/* 2. Change Password Card */}
                <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
                    <div className="flex items-center gap-3 pb-3 border-b border-border">
                        <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text shrink-0">
                            <Lock className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-text">Kata Sandi Baru</h2>
                            <p className="text-xs text-text-3">Ganti password akun untuk menjaga keamanan toko.</p>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        {passwordForm.recentlySuccessful && (
                            <div className="p-2.5 bg-accent/10 border border-accent/30 rounded-md text-xs text-accent-text flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 shrink-0" />
                                <span>Kata sandi berhasil diubah!</span>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text block">
                                Kata Sandi Saat Ini <span className="text-danger">*</span>
                            </label>
                            <input
                                type="password"
                                value={passwordForm.data.current_password}
                                onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                required
                                autoComplete="current-password"
                                className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text placeholder:text-text-3 focus:outline-none focus:border-accent"
                                placeholder="••••••••"
                            />
                            {passwordForm.errors.current_password && (
                                <p className="text-[11px] text-danger">{passwordForm.errors.current_password}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text block">
                                Kata Sandi Baru <span className="text-danger">*</span>
                            </label>
                            <input
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                required
                                autoComplete="new-password"
                                className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text placeholder:text-text-3 focus:outline-none focus:border-accent"
                                placeholder="Minimal 8 karakter"
                            />
                            {passwordForm.errors.password && (
                                <p className="text-[11px] text-danger">{passwordForm.errors.password}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text block">
                                Konfirmasi Kata Sandi Baru <span className="text-danger">*</span>
                            </label>
                            <input
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                required
                                autoComplete="new-password"
                                className="w-full h-9 px-3 text-xs bg-surface-2 border border-border rounded-lg text-text placeholder:text-text-3 focus:outline-none focus:border-accent"
                                placeholder="Ulangi kata sandi baru"
                            />
                            {passwordForm.errors.password_confirmation && (
                                <p className="text-[11px] text-danger">{passwordForm.errors.password_confirmation}</p>
                            )}
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={passwordForm.processing}
                                loading={passwordForm.processing}
                                className="w-full sm:w-auto"
                            >
                                Perbarui Kata Sandi
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

Profile.layout = (page: React.ReactNode) => (
    <AdminLayout>
        <Head title="Profil & Keamanan - Admin" />
        {page}
    </AdminLayout>
);
