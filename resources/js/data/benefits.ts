export interface BenefitItem {
    id: string;
    title: string;
    description: string;
    icon: 'ShieldCheck' | 'Users' | 'LifeBuoy' | 'Receipt' | 'KeyRound' | 'SearchCheck';
}

export const benefits: BenefitItem[] = [
    {
        id: 'verification',
        title: 'Verifikasi manual',
        description: 'Setiap pembayaran dicek admin sebelum akun dikirim.',
        icon: 'ShieldCheck',
    },
    {
        id: 'quota',
        title: 'Kuota sewa terbatas',
        description: 'Maksimal penyewa dibatasi per hari agar akun tetap lancar.',
        icon: 'Users',
    },
    {
        id: 'warranty',
        title: 'Garansi selama masa aktif',
        description: 'Akun bermasalah diganti atau dikompensasi selama masa sewa.',
        icon: 'LifeBuoy',
    },
    {
        id: 'exact-amount',
        title: 'Nominal pasti',
        description: 'Total sudah termasuk kode unik. Transfer sesuai angka di invoice.',
        icon: 'Receipt',
    },
    {
        id: 'invoice-access',
        title: 'Akun di halaman invoice',
        description: 'Detail akun tampil setelah pembayaran diverifikasi.',
        icon: 'KeyRound',
    },
    {
        id: 'no-register',
        title: 'Tanpa daftar akun',
        description: 'Cukup nomor WhatsApp. Lacak pesanan kapan saja.',
        icon: 'SearchCheck',
    },
];
