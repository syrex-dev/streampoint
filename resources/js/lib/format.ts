/**
 * Format integer Rupiah into string: "Rp 15.000"
 */
export function formatRupiah(amount: number): string {
    const formatted = new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 0,
    }).format(amount);

    return `Rp ${formatted}`;
}

/**
 * Format ISO datetime string to Indonesian format: "01 Nov 2026, 14:30 WIB"
 */
export function formatDateTimeWIB(isoString: string): string {
    try {
        const date = new Date(isoString);
        const day = String(date.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
    } catch {
        return isoString;
    }
}
