import React from 'react';
import { Image as ImageIcon, Sparkles } from 'lucide-react';

export interface ImageGuideItem {
    component: string;
    ratio: string;
    recommendedDim: string;
    maxSize: string;
    instructions: string;
}

export const imageGuides: ImageGuideItem[] = [
    {
        component: 'Banner Hero Desktop',
        ratio: '2.35:1',
        recommendedDim: '1600 × 680 px',
        maxSize: '3 MB',
        instructions: 'Rasio 2,35:1 (1600 × 680 px), JPG/PNG/WebP, maks 3 MB. Visual murni tanpa teks bertumpuk.',
    },
    {
        component: 'Banner Hero Mobile',
        ratio: '4:3',
        recommendedDim: '1200 × 900 px',
        maxSize: '3 MB',
        instructions: 'Rasio 4:3 (1200 × 900 px), JPG/PNG/WebP, maks 3 MB. Vertikal layar ponsel.',
    },
    {
        component: 'Sampul / Cover Layanan',
        ratio: '16:9',
        recommendedDim: '1200 × 675 px',
        maxSize: '2 MB',
        instructions: 'Rasio 16:9 (1200 × 675 px), JPG/PNG/WebP, maks 2 MB. Header detail paket streaming.',
    },
    {
        component: 'Logo Layanan / Katalog',
        ratio: '1:1',
        recommendedDim: '500 × 500 px',
        maxSize: '1 MB',
        instructions: 'Persegi 1:1 (min 200 × 200 px), PNG transparan atau WebP, maks 1 MB.',
    },
    {
        component: 'Gambar QRIS Pembayaran',
        ratio: '1:1',
        recommendedDim: '500 × 500 px',
        maxSize: '2 MB',
        instructions: 'Persegi 1:1 (min 300 × 300 px), JPG/PNG/WebP, kontras tinggi agar mudah dipindai, maks 2 MB.',
    },
    {
        component: 'Logo Navbar (Mode Terang/Gelap)',
        ratio: '5:1 / Fleksibel',
        recommendedDim: '400 × 80 px',
        maxSize: '1 MB',
        instructions: 'Tinggi tampilan 28-32 px, lebar maks 400 px, PNG/WebP transparan, maks 1 MB.',
    },
    {
        component: 'OG Image (Media Sosial / WA)',
        ratio: '1.91:1',
        recommendedDim: '1200 × 630 px',
        maxSize: '2 MB',
        instructions: 'Preview share link (1200 × 630 px), JPG/PNG/WebP, maks 2 MB.',
    },
    {
        component: 'Favicon Tab Browser',
        ratio: '1:1',
        recommendedDim: '512 × 512 px',
        maxSize: '1 MB',
        instructions: 'Persegi 512 × 512 px, PNG/SVG/ICO, maks 1 MB.',
    },
    {
        component: 'Logo Metode Pembayaran',
        ratio: '3:1 / Fleksibel',
        recommendedDim: '240 × 80 px',
        maxSize: '1 MB',
        instructions: 'Logo bank atau e-wallet (BCA, Mandiri, Dana, GoPay), PNG transparan, maks 1 MB.',
    },
];

export function ImageGuideCard({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-4 ${className}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                    <h3 className="text-base font-bold text-text flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-accent-text" />
                        <span>Panduan Standar Ukuran Gambar</span>
                    </h3>
                    <p className="text-xs text-text-2 mt-0.5">
                        Standar tunggal dimensi, rasio, dan batas ukuran file yang divalidasi sistem.
                    </p>
                </div>
                <div className="shrink-0 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-warning/10 text-warning border border-warning/30 text-[11px] font-semibold">
                        <Sparkles className="w-3 h-3" />
                        <span>Standar Acuan</span>
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto -mx-5 sm:mx-0 px-5 sm:px-0">
                <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                    <thead>
                        <tr className="border-b border-border text-text-2">
                            <th className="py-2.5 font-semibold">Komponen</th>
                            <th className="py-2.5 font-semibold">Rasio</th>
                            <th className="py-2.5 font-semibold">Dimensi Rekomendasi</th>
                            <th className="py-2.5 font-semibold">Batas File</th>
                            <th className="py-2.5 font-semibold">Petunjuk Unggah</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {imageGuides.map((guide, idx) => (
                            <tr key={idx} className="hover:bg-surface-hover/50 transition-colors">
                                <td className="py-3 font-semibold text-text whitespace-nowrap pr-4">
                                    {guide.component}
                                </td>
                                <td className="py-3 font-mono font-medium text-warning whitespace-nowrap pr-4">
                                    {guide.ratio}
                                </td>
                                <td className="py-3 font-mono font-bold text-text whitespace-nowrap pr-4 tabular-nums">
                                    {guide.recommendedDim}
                                </td>
                                <td className="py-3 text-text-2 whitespace-nowrap pr-4">
                                    {guide.maxSize}
                                </td>
                                <td className="py-3 text-text-2 leading-relaxed">
                                    {guide.instructions}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ImageGuideCard;

