import fs from 'node:fs';

const APP_CSS_PATH = 'resources/css/app.css';

if (!fs.existsSync(APP_CSS_PATH)) {
    console.error(`Error: ${APP_CSS_PATH} not found.`);
    process.exit(1);
}

const appCssContent = fs.readFileSync(APP_CSS_PATH, 'utf8');

// WCAG 2.1 Color contrast calculation helpers
function parseHex(hex) {
    hex = hex.trim().replace(/^#/, '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

function srgbToLinear(val) {
    const s = val / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb) {
    const rLin = srgbToLinear(rgb.r);
    const gLin = srgbToLinear(rgb.g);
    const bLin = srgbToLinear(rgb.b);
    return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

function contrastRatio(hex1, hex2) {
    const lum1 = relativeLuminance(parseHex(hex1));
    const lum2 = relativeLuminance(parseHex(hex2));
    const brighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (brighter + 0.05) / (darker + 0.05);
}

// Parse CSS blocks
function extractBlock(css, selectorRegex) {
    const match = css.match(selectorRegex);
    if (!match) return {};
    const blockContent = match[1];
    const vars = {};
    for (const line of blockContent.split('\n')) {
        const varMatch = line.match(/--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/);
        if (varMatch) {
            vars[varMatch[1].trim()] = varMatch[2].trim();
        }
    }
    return vars;
}

const rootVars = extractBlock(appCssContent, /:root\s*\{([^}]+)\}/);
const darkVars = extractBlock(appCssContent, /\.dark\s*\{([^}]+)\}/);

// Preset blocks
const presets = ['emerald', 'teal', 'blue', 'mono'];
const presetLightVars = {};
const presetDarkVars = {};

for (const p of presets) {
    const lightRegex = new RegExp(`html\\[data-accent="${p}"\\]\\s*\\{([^}]+)\\}`, 's');
    presetLightVars[p] = extractBlock(appCssContent, lightRegex);

    const darkRegex = new RegExp(`html\\[data-accent="${p}"\\]\\.dark[^{]*\\{([^}]+)\\}`, 's');
    presetDarkVars[p] = extractBlock(appCssContent, darkRegex);
}

const checks = [];

function addCheck({ mode, preset = 'default', label, fgVar, bgVar, fgHex, bgHex, minRatio = 4.5, type = 'text' }) {
    if (!fgHex || !bgHex) {
        console.error(`Error: Missing color for check: ${label} (fg: ${fgHex}, bg: ${bgHex})`);
        process.exit(1);
    }
    const ratio = contrastRatio(fgHex, bgHex);
    const passed = ratio >= minRatio;
    checks.push({
        mode,
        preset,
        label,
        fgVar,
        bgVar,
        fgHex,
        bgHex,
        ratio: ratio.toFixed(2),
        minRatio: minRatio.toFixed(1),
        passed,
        type
    });
}

// Helper to run background combinations
const surfaces = ['bg', 'surface', 'surface-2', 'surface-hover'];
const modes = [
    { name: 'light', vars: rootVars },
    { name: 'dark', vars: darkVars }
];

for (const { name: modeName, vars } of modes) {
    // 1. Text tokens on all 4 background surfaces (12 pairs per mode = 24 pairs)
    const textTokens = ['text', 'text-2', 'text-muted'];
    for (const tToken of textTokens) {
        for (const sToken of surfaces) {
            addCheck({
                mode: modeName,
                label: `--${tToken} on --${sToken}`,
                fgVar: `--${tToken}`,
                bgVar: `--${sToken}`,
                fgHex: vars[tToken],
                bgHex: vars[sToken],
                minRatio: 4.5,
                type: 'text'
            });
        }
    }

    // 2. Buttons / Actions
    // on-warning on warning (1 pair per mode = 2 pairs)
    addCheck({
        mode: modeName,
        label: `--on-warning on --warning`,
        fgVar: `--on-warning`,
        bgVar: `--warning`,
        fgHex: vars['on-warning'],
        bgHex: vars['warning'],
        minRatio: 4.5,
        type: 'text'
    });

    // on-danger on danger-solid and danger-solid-hover (2 pairs per mode = 4 pairs)
    addCheck({
        mode: modeName,
        label: `--on-danger on --danger-solid`,
        fgVar: `--on-danger`,
        bgVar: `--danger-solid`,
        fgHex: vars['on-danger'],
        bgHex: vars['danger-solid'],
        minRatio: 4.5,
        type: 'text'
    });
    addCheck({
        mode: modeName,
        label: `--on-danger on --danger-solid-hover`,
        fgVar: `--on-danger`,
        bgVar: `--danger-solid-hover`,
        fgHex: vars['on-danger'],
        bgHex: vars['danger-solid-hover'],
        minRatio: 4.5,
        type: 'text'
    });

    // 3. Status badges: success, warning, danger, info on surface and surface-2 (8 pairs per mode = 16 pairs)
    const statusTokens = ['success', 'warning', 'danger', 'info'];
    const badgeSurfaces = ['surface', 'surface-2'];
    for (const stat of statusTokens) {
        for (const srf of badgeSurfaces) {
            addCheck({
                mode: modeName,
                label: `--${stat} badge on --${srf}`,
                fgVar: `--${stat}`,
                bgVar: `--${srf}`,
                fgHex: vars[stat],
                bgHex: vars[srf],
                minRatio: 4.5,
                type: 'badge'
            });
        }
    }

    // 4. Inactive Switch Border (Non-text UI element: min 3.0:1) (1 pair per mode = 2 pairs)
    addCheck({
        mode: modeName,
        label: `switch border (--text-muted) on --surface-2`,
        fgVar: `--text-muted`,
        bgVar: `--surface-2`,
        fgHex: vars['text-muted'],
        bgHex: vars['surface-2'],
        minRatio: 3.0,
        type: 'ui'
    });

    // 5. Preset Matrix (4 presets x 4 checks per mode = 32 pairs)
    for (const p of presets) {
        const pVars = modeName === 'light' ? presetLightVars[p] : presetDarkVars[p];
        const accent = pVars['accent'] || vars['accent'];
        const accentHover = pVars['accent-hover'] || vars['accent-hover'];
        const accentText = pVars['accent-text'] || vars['accent-text'];
        const onAccent = pVars['on-accent'] || vars['on-accent'];

        // accent-text on bg and surface
        addCheck({
            mode: modeName,
            preset: p,
            label: `--accent-text on --bg (${p})`,
            fgVar: `--accent-text`,
            bgVar: `--bg`,
            fgHex: accentText,
            bgHex: vars['bg'],
            minRatio: 4.5,
            type: 'text'
        });
        addCheck({
            mode: modeName,
            preset: p,
            label: `--accent-text on --surface (${p})`,
            fgVar: `--accent-text`,
            bgVar: `--surface`,
            fgHex: accentText,
            bgHex: vars['surface'],
            minRatio: 4.5,
            type: 'text'
        });

        // on-accent on accent and accent-hover
        addCheck({
            mode: modeName,
            preset: p,
            label: `--on-accent on --accent (${p})`,
            fgVar: `--on-accent`,
            bgVar: `--accent`,
            fgHex: onAccent,
            bgHex: accent,
            minRatio: 4.5,
            type: 'text'
        });
        addCheck({
            mode: modeName,
            preset: p,
            label: `--on-accent on --accent-hover (${p})`,
            fgVar: `--on-accent`,
            bgVar: `--accent-hover`,
            fgHex: onAccent,
            bgHex: accentHover,
            minRatio: 4.5,
            type: 'text'
        });
    }
}

// Print results table
console.log('='.repeat(105));
console.log(`StreamPoint Full WCAG 2.1 Contrast Matrix (${checks.length} Pairs Evaluated)`);
console.log('='.repeat(105));
console.log(
    'Mode'.padEnd(7) +
    'Preset'.padEnd(10) +
    'Element Pair / Check'.padEnd(45) +
    'FG'.padEnd(10) +
    'BG'.padEnd(10) +
    'Ratio'.padEnd(10) +
    'Min'.padEnd(8) +
    'Status'
);
console.log('-'.repeat(105));

let failedCount = 0;
for (const c of checks) {
    const statusText = c.passed ? '[PASS]' : '[FAIL]';
    if (!c.passed) failedCount++;

    console.log(
        c.mode.padEnd(7) +
        c.preset.padEnd(10) +
        c.label.padEnd(45) +
        c.fgHex.padEnd(10) +
        c.bgHex.padEnd(10) +
        `${c.ratio}:1`.padEnd(10) +
        `${c.minRatio}:1`.padEnd(8) +
        statusText
    );
}
console.log('='.repeat(105));

if (failedCount > 0) {
    console.error(`\n[FAIL] ${failedCount} contrast ratio(s) did not meet WCAG requirements.`);
    process.exit(1);
} else {
    console.log(`\n[PASS] All ${checks.length} color contrast pairs meet or exceed WCAG requirements!`);
    process.exit(0);
}
