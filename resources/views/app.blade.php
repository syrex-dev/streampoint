@php
    $appSetting = \App\Models\Setting::current();
    $accentPreset = in_array($appSetting->accent_preset, ['emerald', 'teal', 'blue', 'mono']) ? $appSetting->accent_preset : 'emerald';
@endphp
<!DOCTYPE html>
<html lang="id" data-accent="{{ $accentPreset }}" class="{{ request()->cookie('appearance') === 'dark' ? 'dark' : '' }}" style="{{ request()->cookie('appearance') === 'dark' ? 'color-scheme: dark;' : '' }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title inertia>{{ $appSetting->store_name ?: config('app.name', 'StreamPoint') }}</title>
        <script>
            window.__initialStoreName = @json($appSetting->store_name ?: config('app.name', 'StreamPoint'));
        </script>

        <script>
            (function() {
                try {
                    function getCookie(name) {
                        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
                        return match ? decodeURIComponent(match[2]) : null;
                    }
                    var stored = localStorage.getItem('appearance') || getCookie('appearance') || 'system';
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    var isDark = stored === 'dark' || (stored === 'system' && prefersDark);
                    if (isDark) {
                        document.documentElement.classList.add('dark');
                        document.documentElement.style.colorScheme = 'dark';
                    } else {
                        document.documentElement.classList.remove('dark');
                        document.documentElement.style.colorScheme = 'light';
                    }
                } catch (e) {}
            })();
        </script>

        <style>
            html, body {
                background-color: var(--bg);
                color: var(--text);
            }
        </style>

        <link rel="icon" href="/favicon.svg?v=sp2" type="image/svg+xml">
        <link rel="icon" href="/brand/logo-icon-light.svg?v=sp2" type="image/svg+xml" media="(prefers-color-scheme: light)">
        <link rel="icon" href="/brand/logo-icon-dark.svg?v=sp2" type="image/svg+xml" media="(prefers-color-scheme: dark)">
        <link rel="icon" href="/favicon.ico?v=sp2" sizes="any">
        <link rel="shortcut icon" href="/favicon.ico?v=sp2">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=sp2">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="bg-bg text-text font-sans antialiased selection:bg-accent selection:text-on-accent min-h-screen">
        @inertia
    </body>
</html>
