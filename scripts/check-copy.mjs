import fs from 'node:fs';
import path from 'node:path';

const DIRS_TO_SCAN = ['resources/js', 'resources/views'];

// Banned claim terms (regex with word boundary, case-insensitive)
const BANNED_PATTERNS = [
    { name: 'resmi', regex: /\bresmi\b/i },
    { name: 'legal', regex: /\blegal\b/i },
    { name: 'terpercaya', regex: /\bterpercaya\b/i },
    { name: 'terbaik', regex: /\bterbaik\b/i },
    { name: 'termurah', regex: /\btermurah\b/i },
    { name: '100%', regex: /\b100%/i },
    { name: 'nomor 1', regex: /\b(nomor|no\.?)\s*1\b/i },
];

// Documented Allowlist for legally required disclaimers and admin educational hint instructions
const ALLOWLIST = [
    {
        filePath: 'resources/js/pages/static/Terms.tsx',
        term: 'resmi',
        context: 'tidak terafiliasi secara resmi',
        reason: 'Legal non-affiliation disclaimer required by DESIGN_SYSTEM 6.10'
    },
    {
        filePath: 'resources/js/pages/admin/banners/Create.tsx',
        term: 'resmi/legal/termurah',
        context: 'Jangan menulis klaim yang tidak bisa dibuktikan',
        reason: 'Admin helper guideline explaining copy restrictions'
    },
    {
        filePath: 'resources/js/pages/admin/banners/Edit.tsx',
        term: 'resmi/legal/termurah',
        context: 'Jangan menulis klaim yang tidak bisa dibuktikan',
        reason: 'Admin helper guideline explaining copy restrictions'
    }
];

function isAllowlisted(normalizedPath, lineText) {
    for (const item of ALLOWLIST) {
        if (normalizedPath.endsWith(item.filePath.replace(/\\/g, '/'))) {
            if (lineText.includes(item.context)) {
                return true;
            }
        }
    }
    return false;
}

function getFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    let results = [];
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            results.push(...getFiles(fullPath));
        } else if (/\.(tsx?|jsx?|php)$/.test(item.name)) {
            results.push(fullPath);
        }
    }
    return results;
}

const files = DIRS_TO_SCAN.flatMap(getFiles);
const violations = [];

for (const filePath of files) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((lineText, lineIdx) => {
        const lineNum = lineIdx + 1;

        if (isAllowlisted(normalizedPath, lineText)) {
            return;
        }

        for (const pattern of BANNED_PATTERNS) {
            if (pattern.name === '100%') {
                // Ignore CSS/SVG dimension percentages like calc(100%...), width="100%", height="100%"
                if (/["'`=]\s*100%["'`]|calc\([^)]*100%|width="100%"|height="100%"/.test(lineText)) {
                    continue;
                }
            }
            if (pattern.regex.test(lineText)) {
                violations.push({
                    file: normalizedPath,
                    line: lineNum,
                    term: pattern.name,
                    snippet: lineText.trim()
                });
            }
        }
    });
}

// Print results
console.log('='.repeat(80));
console.log('StreamPoint Copy & Claim Compliance Audit (check:copy)');
console.log('='.repeat(80));
console.log(`Banned Terms: ${BANNED_PATTERNS.map(p => p.name).join(', ')}`);
console.log(`Documented Allowlist Entries: ${ALLOWLIST.length}`);
console.log(`Files Scanned: ${files.length}`);

if (violations.length === 0) {
    console.log('\n[PASS] All UI strings adhere to DESIGN_SYSTEM 9. No unauthorized claim words found.');
    process.exit(0);
} else {
    console.error(`\n[FAIL] Found ${violations.length} banned claim violation(s):\n`);
    for (const v of violations) {
        console.error(`  - ${v.file}:${v.line} [Term: "${v.term}"]`);
        console.error(`    Text: "${v.snippet}"\n`);
    }
    process.exit(1);
}

