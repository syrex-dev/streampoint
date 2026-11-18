export interface FaqItem {
    id: string;
    question: string;
    answer: string;
}

export const faqData: FaqItem[] = [
    {
        id: 'faq-1',
        question: 'Apakah saya perlu mendaftar akun terlebih dahulu?',
        answer: 'Tidak perlu mendaftar atau mengingat kata sandi baru. Cukup gunakan nomor WhatsApp aktif saat pemesanan. Kamu bisa memantau status pesanan kapan saja melalui menu Cek Pesanan.',
    },
    {
        id: 'faq-2',
        question: 'Kapan durasi sewa atau masa aktif produk mulai dihitung?',
        answer: 'Masa aktif mulai dihitung tepat saat pembayaran diverifikasi admin dan kredensial/akses produk digital diterbitkan ke halaman invoice kamu, bukan sejak waktu transfer.',
    },
    {
        id: 'faq-3',
        question: 'Bagaimana ketersediaan stok produk digital dan aplikasi?',
        answer: 'Seluruh stok akun, link invite, voucher, dan lisensi dipantau secara real-time. Kamu dapat langsung memesan produk digital yang berstatus tersedia di katalog tanpa antrean.',
    },
    {
        id: 'faq-4',
        question: 'Berapa lama batas waktu untuk menyelesaikan transfer?',
        answer: 'Batas waktu pembayaran adalah 15 menit sejak pesanan dibuat. Jika melewati batas waktu tersebut tanpa konfirmasi pembayaran, sistem akan membatalkan pesanan secara otomatis.',
    },
    {
        id: 'faq-5',
        question: 'Bagaimana jika saya sudah transfer tetapi pesanan telanjur kedaluwarsa?',
        answer: 'Jangan khawatir. Segera hubungi admin via WhatsApp dengan menyertakan kode invoice dan bukti transfer. Pesanan kamu dapat diaktifkan kembali oleh admin.',
    },
    {
        id: 'faq-6',
        question: 'Apa saja metode pembayaran yang didukung?',
        answer: 'Kami menerima pembayaran melalui QRIS (dapat dipindai dari BCA, Mandiri, GoPay, OVO, Dana, dll.), transfer rekening bank, serta e-wallet sesuai opsi aktif di halaman checkout.',
    },
    {
        id: 'faq-7',
        question: 'Apa yang harus dilakukan jika produk atau akun mengalami kendala?',
        answer: 'Hubungi admin melalui WhatsApp dengan menyebutkan kode invoice kamu. Kami memberikan garansi penuh selama durasi sewa atau masa garansi beli berupa penggantian unit atau perbaikan akses.',
    },
    {
        id: 'faq-8',
        question: 'Bagaimana aturan penggunaan akun bersama atau lisensi?',
        answer: 'Untuk paket akun profil bersama, dilarang mengubah email, password, PIN, atau profil. Untuk produk berupa voucher atau lisensi pribadi, kamu mendapatkan hak akses penuh sesuai instruksi.',
    },
];
