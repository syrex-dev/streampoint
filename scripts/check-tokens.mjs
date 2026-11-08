import fs from 'node:fs';
import path from 'node:path';

const APP_CSS_PATH = 'resources/css/app.css';
const JS_DIR = 'resources/js';
const CSS_DIR = 'resources/css';

// 1. Read app.css and parse @theme tokens
if (!fs.existsSync(APP_CSS_PATH)) {
    console.error(`Error: ${APP_CSS_PATH} not found.`);
    process.exit(1);
}

const appCssContent = fs.readFileSync(APP_CSS_PATH, 'utf8');

// Extract @theme block
const themeMatch = appCssContent.match(/@theme\s*\{([^}]+)\}/s);
if (!themeMatch) {
    console.error('Error: Could not find @theme block in ' + APP_CSS_PATH);
    process.exit(1);
}

const registeredColors = new Set(['transparent', 'current', 'inherit']);
for (const match of themeMatch[1].matchAll(/--color-([a-zA-Z0-9_-]+):/g)) {
    registeredColors.add(match[1]);
}

// Direct palette names that are strictly banned as direct Tailwind classes
const BANNED_PALETTES = new Set([
    'red', 'green', 'emerald', 'amber', 'yellow', 'orange',
    'sky', 'blue', 'teal', 'rose', 'neutral', 'zinc', 'gray',
    'slate', 'stone', 'white', 'black', 'indigo', 'purple',
    'violet', 'fuchsia', 'pink', 'cyan', 'lime'
]);

// Non-color utilities starting with color-like prefixes
const NON_COLOR_UTILITIES = new Set([
    // text
    'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl',
    'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl',
    'text-left', 'text-center', 'text-right', 'text-justify', 'text-start', 'text-end',
    'text-wrap', 'text-nowrap', 'text-balance', 'text-ellipsis', 'text-clip',
    // border
    'border', 'border-0', 'border-2', 'border-4', 'border-8',
    'border-t', 'border-b', 'border-l', 'border-r', 'border-x', 'border-y',
    'border-t-0', 'border-b-0', 'border-l-0', 'border-r-0', 'border-x-0', 'border-y-0',
    'border-t-2', 'border-b-2', 'border-l-2', 'border-r-2', 'border-t-4', 'border-b-4',
    'border-solid', 'border-dashed', 'border-dotted', 'border-double', 'border-hidden', 'border-none',
    'border-collapse', 'border-separate',
    // bg
    'bg-bottom', 'bg-center', 'bg-left', 'bg-left-bottom', 'bg-left-top', 'bg-right', 'bg-right-bottom', 'bg-right-top', 'bg-top',
    'bg-repeat', 'bg-no-repeat', 'bg-repeat-x', 'bg-repeat-y', 'bg-repeat-round', 'bg-repeat-space',
    'bg-auto', 'bg-cover', 'bg-contain', 'bg-fixed', 'bg-local', 'bg-scroll',
    'bg-clip-border', 'bg-clip-padding', 'bg-clip-content', 'bg-clip-text',
    'bg-origin-border', 'bg-origin-padding', 'bg-origin-content',
    // ring
    'ring', 'ring-0', 'ring-1', 'ring-2', 'ring-4', 'ring-8', 'ring-inset',
    'ring-offset-0', 'ring-offset-1', 'ring-offset-2', 'ring-offset-4', 'ring-offset-8',
    // fill & stroke
    'fill-none', 'stroke-none', 'stroke-0', 'stroke-1', 'stroke-2', 'stroke-3',
    // divide
    'divide-x', 'divide-y', 'divide-x-0', 'divide-y-0', 'divide-x-2', 'divide-y-2', 'divide-x-4', 'divide-y-4',
    'divide-x-reverse', 'divide-y-reverse', 'divide-solid', 'divide-dashed', 'divide-dotted', 'divide-none',
    // outline
    'outline', 'outline-none', 'outline-hidden', 'outline-0', 'outline-1', 'outline-2', 'outline-4', 'outline-8',
    'outline-solid', 'outline-dashed', 'outline-dotted', 'outline-double',
    'outline-offset-0', 'outline-offset-1', 'outline-offset-2', 'outline-offset-4',
    // shadow
    'shadow', 'shadow-none', 'shadow-2xs', 'shadow-xs', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl', 'shadow-inner',
    // decoration
    'decoration-solid', 'decoration-double', 'decoration-dotted', 'decoration-dashed', 'decoration-wavy',
    'decoration-auto', 'decoration-from-font', 'decoration-0', 'decoration-1', 'decoration-2', 'decoration-4', 'decoration-8'
]);

const COLOR_PREFIXES = [
    'bg', 'text', 'border', 'ring', 'fill', 'stroke',
    'placeholder', 'divide', 'outline', 'shadow', 'decoration',
    'caret', 'from', 'via', 'to'
];

function isNumericUtility(util) {
    // Dynamic text size e.g. text-[11px], text-[10px]
    if (/^text-\[\d+(\.\d+)?(px|rem|em|%)?\]$/.test(util)) return true;
    // Dynamic stroke width e.g. stroke-[1.5], stroke-[2]
    if (/^stroke-\[\d+(\.\d+)?(px)?\]$/.test(util)) return true;
    // Dynamic ring width e.g. ring-[3px]
    if (/^ring-\[\d+(\.\d+)?(px)?\]$/.test(util)) return true;
    // Dynamic border width e.g. border-[1px], border-t-[2px]
    if (/^border(-[tblrxy])?-\[\d+(\.\d+)?(px)?\]$/.test(util)) return true;
    // Dynamic divide width e.g. divide-[xy]-\[\d+px\]
    if (/^divide-[xy]-\[\d+(\.\d+)?(px)?\]$/.test(util)) return true;
    return false;
}

function getFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    let results = [];
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            results.push(...getFiles(fullPath));
        } else if (/\.(tsx?|jsx?|css)$/.test(item.name)) {
            results.push(fullPath);
        }
    }
    return results;
}

const files = [...getFiles(JS_DIR), ...getFiles(CSS_DIR)];

const violations = [];

for (const filePath of files) {
    const isAppCss = filePath.replace(/\\/g, '/').endsWith('resources/css/app.css');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((lineText, lineIdx) => {
        const lineNum = lineIdx + 1;

        // In app.css:
        // Allow variable declarations like `--bg: #...`, `--overlay: rgba(...)`, and `.qris-box`
        if (isAppCss) {
            const trimmed = lineText.trim();
            if (trimmed.startsWith('--') || trimmed.includes('.qris-box') || trimmed.includes('.logo-plate') || trimmed.includes('/*') || trimmed.includes('*')) {
                return;
            }
        }

        // Check for direct palette classes or unauthorized color tokens
        // Extract string tokens
        const stringMatches = lineText.matchAll(/["'`{]([^"'`}]*)["'`}]/g);
        for (const strMatch of stringMatches) {
            const classString = strMatch[1];
            const tokens = classString.trim().split(/\s+/);

            for (const rawToken of tokens) {
                if (!rawToken) continue;

                // Strip leading/trailing exclamation (important modifier)
                let token = rawToken.replace(/^!|!$/g, '');

                // Strip state/responsive prefixes (e.g. hover:, dark:, md:, peer-checked:, group-hover:, data-[...]:)
                const parts = token.split(':');
                const baseClass = parts[parts.length - 1];

                // Strip opacity modifier (e.g. text-text-muted/60 -> text-text-muted)
                const baseWithoutOpacity = baseClass.replace(/\/\d+$/, '');

                // Skip dynamic text sizes or stroke/ring widths
                if (isNumericUtility(baseWithoutOpacity)) continue;

                // Skip known non-color utilities
                if (NON_COLOR_UTILITIES.has(baseWithoutOpacity)) continue;

                // Check for arbitrary hex or rgb classes like bg-[#123] or text-[rgb(...)]
                if (/(?:bg|text|border|ring|fill|stroke|placeholder|divide|outline|decoration|shadow)-\[(?:#|rgb|hsl)/.test(baseWithoutOpacity)) {
                    violations.push({
                        file: filePath,
                        line: lineNum,
                        token: rawToken,
                        reason: 'Arbitrary hex/rgb class not permitted outside allowlist'
                    });
                    continue;
                }

                // Check directional borders / divides / ring-offsets
                let prefix = null;
                let colorCandidate = null;

                if (baseWithoutOpacity.startsWith('border-t-') || baseWithoutOpacity.startsWith('border-b-') ||
                    baseWithoutOpacity.startsWith('border-l-') || baseWithoutOpacity.startsWith('border-r-') ||
                    baseWithoutOpacity.startsWith('border-x-') || baseWithoutOpacity.startsWith('border-y-')) {
                    prefix = 'border';
                    colorCandidate = baseWithoutOpacity.slice(9);
                } else if (baseWithoutOpacity.startsWith('divide-x-') || baseWithoutOpacity.startsWith('divide-y-')) {
                    prefix = 'divide';
                    colorCandidate = baseWithoutOpacity.slice(9);
                } else if (baseWithoutOpacity.startsWith('ring-offset-')) {
                    prefix = 'ring-offset';
                    colorCandidate = baseWithoutOpacity.slice(12);
                } else {
                    for (const p of COLOR_PREFIXES) {
                        if (baseWithoutOpacity.startsWith(p + '-')) {
                            prefix = p;
                            colorCandidate = baseWithoutOpacity.slice(p.length + 1);
                            break;
                        }
                    }
                }

                if (!prefix || !colorCandidate) continue;

                // Check if colorCandidate starts with a banned palette name (e.g. red-500, green-600, zinc-200, white, black)
                const candidateRoot = colorCandidate.split('-')[0];
                if (BANNED_PALETTES.has(candidateRoot)) {
                    violations.push({
                        file: filePath,
                        line: lineNum,
                        token: rawToken,
                        reason: `Direct palette class "${colorCandidate}" is banned. Use semantic tokens instead.`
                    });
                    continue;
                }

                // Check if colorCandidate is registered in @theme
                if (!registeredColors.has(colorCandidate)) {
                    violations.push({
                        file: filePath,
                        line: lineNum,
                        token: rawToken,
                        reason: `Color token "${colorCandidate}" is not registered in @theme in app.css.`
                    });
                }
            }
        }
    });
}

// Print results
console.log('='.repeat(70));
console.log('StreamPoint Token & Color Audit (check:tokens)');
console.log('='.repeat(70));
console.log(`Registered Theme Colors: ${Array.from(registeredColors).sort().join(', ')}`);
console.log(`Files Scanned: ${files.length}`);

if (violations.length === 0) {
    console.log('\n[PASS] No token violations found! All colors adhere to DESIGN_SYSTEM tokens.');
    process.exit(0);
} else {
    console.error(`\n[FAIL] Found ${violations.length} token violation(s):\n`);
    for (const v of violations) {
        console.error(`  - ${v.file}:${v.line} -> "${v.token}"`);
        console.error(`    Reason: ${v.reason}\n`);
    }
    process.exit(1);
}
