import { createInertiaApp } from '@inertiajs/react';
import type React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { initializeTheme } from '@/hooks/use-appearance';

const appName = typeof window !== 'undefined' && (window as any).__initialStoreName
    ? (window as any).__initialStoreName
    : (import.meta.env.VITE_APP_NAME || 'StreamPoint');

void createInertiaApp({
    title: (title) => {
        const store = typeof window !== 'undefined' && (window as any).__initialStoreName
            ? (window as any).__initialStoreName
            : appName;
        return title ? `${title} - ${store}` : store;
    },
    resolve: async (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx');
        const pagePromise = pages[`./pages/${name}.tsx`];
        if (!pagePromise) {
            throw new Error(`Page not found: ${name}`);
        }
        const module = (await pagePromise()) as any;
        const page = module.default ?? module;

        const layoutProps = (typeof page.layout === 'object' && page.layout !== null && !Array.isArray(page.layout))
            ? page.layout
            : {};

        if (typeof page.layout !== 'function' && !Array.isArray(page.layout)) {
            if (name.startsWith('auth/')) {
                const { default: AuthLayout } = await import('@/layouts/auth-layout');
                page.layout = (children: React.ReactNode) => (
                    <AuthLayout {...layoutProps}>{children}</AuthLayout>
                );
            } else if (name.startsWith('settings/')) {
                const [{ AdminLayout }, { default: SettingsLayout }] = await Promise.all([
                    import('@/layouts/AdminLayout'),
                    import('@/layouts/settings/layout'),
                ]);
                page.layout = (children: React.ReactNode) => (
                    <AdminLayout>
                        <SettingsLayout>{children}</SettingsLayout>
                    </AdminLayout>
                );
            } else if (name === 'dashboard') {
                const { AdminLayout } = await import('@/layouts/AdminLayout');
                page.layout = (children: React.ReactNode) => (
                    <AdminLayout>{children}</AdminLayout>
                );
            }
        }

        return page;
    },
    strictMode: true,
    withApp(app) {
        return (
            <>
                {app}
                <Toaster />
            </>
        );
    },
    progress: {
        color: '#10B981',
    },
});

// This will set light / dark mode on load...
initializeTheme();

