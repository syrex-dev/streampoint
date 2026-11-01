/**
 * Validation constants matching App\Support\Phone
 */
export const MIN_DIGITS_AFTER_62 = 9;
export const MAX_DIGITS_AFTER_62 = 12;

/**
 * Client-side counterpart to App\Support\Phone::normalize
 */
export function normalizePhone(input: string): string {
    let cleaned = input.replace(/[\s\-\+\.\(\)]+/g, '');

    if (cleaned.startsWith('08')) {
        cleaned = '62' + cleaned.slice(1);
    } else if (cleaned.startsWith('8')) {
        cleaned = '62' + cleaned;
    }

    return cleaned;
}

export function validatePhone(input: string): { isValid: boolean; normalized: string; error?: string } {
    if (!input || input.trim() === '') {
        return { isValid: false, normalized: '', error: 'Nomor WhatsApp wajib diisi.' };
    }

    const normalized = normalizePhone(input);

    if (!/^\d+$/.test(normalized)) {
        return { isValid: false, normalized, error: 'Nomor WhatsApp harus berupa angka.' };
    }

    if (!normalized.startsWith('628')) {
        return { isValid: false, normalized, error: 'Nomor WhatsApp harus diawali dengan 08 atau 628.' };
    }

    const after62 = normalized.slice(2);
    if (after62.length < MIN_DIGITS_AFTER_62 || after62.length > MAX_DIGITS_AFTER_62) {
        return {
            isValid: false,
            normalized,
            error: `Nomor WhatsApp tidak valid (harus ${MIN_DIGITS_AFTER_62}–${MAX_DIGITS_AFTER_62} digit setelah kode 62). Contoh: 081234567890`,
        };
    }

    return { isValid: true, normalized };
}
