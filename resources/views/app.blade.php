<!DOCTYPE html>
<html lang="id" class="{{ request()->cookie('appearance') === 'dark' ? 'dark' : '' }}" style="{{ request()->cookie('appearance') === 'dark' ? 'color-scheme: dark;' : '' }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

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

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="bg-bg text-text font-sans antialiased selection:bg-accent selection:text-on-accent min-h-screen">
        @inertia
    </body>
</html>
