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
        question: 'Kapan masa sewa akun mulai dihitung?',
        answer: 'Masa sewa mulai dihitung tepat saat admin menyetujui pembayaran dan kredensial akun diterbitkan ke halaman invoice kamu, bukan sejak waktu transfer.',
    },
    {
        id: 'faq-3',
        question: 'Mengapa slot sewa dibatasi per hari?',
        answer: 'Kami menerapkan kuota sewa harian untuk menjaga stabilitas dan kualitas akun agar tidak terjadi pemakaian berlebih. Kuota akan otomatis direset setiap pukul 00:00 WIB, atau terbuka kembali jika ada pesanan tertunda yang kedaluwarsa.',
    },
    {
        id: 'faq-4',
        question: 'Berapa lama batas waktu untuk menyelesaikan transfer?',
        answer: 'Batas waktu pembayaran adalah 15 menit sejak pesanan dibuat. Jika melewati batas waktu tersebut tanpa konfirmasi pembayaran, sistem akan membatalkan pesanan secara otomatis.',
    },
    {
        id: 'faq-5',
        question: 'Bagaimana jika saya sudah transfer tetapi pesanan telanjur kedaluwarsa?',
        answer: 'Jangan khawatir. Segera hubungi admin via WhatsApp dengan menyertakan kode invoice dan bukti transfer. Selama slot kuota masih tersedia, pesanan kamu dapat diaktifkan kembali oleh admin.',
    },
    {
        id: 'faq-6',
        question: 'Apa saja metode pembayaran yang didukung?',
        answer: 'Kami menerima pembayaran melalui QRIS (dapat dipindai dari BCA, Mandiri, GoPay, OVO, Dana, dll.), transfer rekening bank, serta e-wallet sesuai opsi aktif di halaman checkout. Seluruh transaksi diverifikasi secara manual oleh admin.',
    },
    {
        id: 'faq-7',
        question: 'Apa yang harus dilakukan jika akun mengalami kendala saat dipakai?',
        answer: 'Hubungi admin melalui WhatsApp dengan menyebutkan kode invoice kamu. Kami memberikan garansi penuh selama masa sewa atau garansi beli berupa penggantian akun atau penyesuaian masa aktif.',
    },
    {
        id: 'faq-8',
        question: 'Apakah pembeli boleh mengubah password, email, atau profil akun?',
        answer: 'Dilarang keras mengubah email, password, PIN profil, maupun nama profil yang telah dialokasikan. Pelanggaran terhadap aturan ini akan membatalkan garansi secara sepihak demi kenyamanan bersama.',
    },
];
