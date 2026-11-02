import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

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
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name.startsWith('storefront/'):
            case name.startsWith('product/'):
            case name.startsWith('invoice/'):
            case name.startsWith('tracking/'):
            case name.startsWith('static/'):
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#10B981',
    },
});

// This will set light / dark mode on load...
initializeTheme();
