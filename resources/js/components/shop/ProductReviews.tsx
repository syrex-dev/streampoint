import React, { useState } from 'react';
import { Star, ShieldCheck, CheckCircle2, MessageSquare, ThumbsUp } from 'lucide-react';
import { ProductReviewsData } from '@/types/shop';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';

interface ProductReviewsProps {
    reviewsData: ProductReviewsData;
    storeName?: string;
    productName: string;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({
    reviewsData,
    storeName = 'StreamPoint',
    productName,
}) => {
    const { average_rating, total_reviews, breakdown, reviews, user_pending_order_for_review } = reviewsData;

    // Review submission state for eligible buyers right from the product page
    const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const formattedRating = average_rating > 0
        ? average_rating.toFixed(1).replace('.', ',')
        : '0,0';

    const handleQuickReviewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user_pending_order_for_review) return;

        setIsSubmitting(true);
        setErrorMsg(null);

        router.post(
            `/invoice/${user_pending_order_for_review.invoice_code}/review`,
            {
                rating,
                comment,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setIsReviewFormOpen(false);
                    setComment('');
                },
                onError: (errs) => {
                    setIsSubmitting(false);
                    setErrorMsg(errs.review || errs.rating || errs.comment || 'Gagal mengirim ulasan.');
                },
            }
        );
    };

    return (
        <section aria-labelledby="reviews-section-title" className="space-y-4">
            {/* Header: Title, Subtitle, and Verified Count */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1">
                <div>
                    <h2 id="reviews-section-title" className="text-base sm:text-lg font-bold text-text tracking-tight">
                        Penilaian & Ulasan Pembeli
                    </h2>
                    <p className="text-xs text-text-2 mt-0.5">
                        Ulasan nyata dari pembeli yang menyelesaikan transaksi di {storeName}
                    </p>
                </div>
                <div className="shrink-0">
                    <span className="text-xs text-text-2 font-medium">
                        Total {total_reviews} ulasan terverifikasi
                    </span>
                </div>
            </div>

            {/* Prompt for verified buyer who hasn't reviewed yet */}
            {user_pending_order_for_review && !isReviewFormOpen && (
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-accent-text shrink-0" />
                        <div>
                            <h4 className="text-xs sm:text-sm font-bold text-text">
                                Kamu telah membeli paket {user_pending_order_for_review.variant_name}!
                            </h4>
                            <p className="text-xs text-text-2">
                                Berikan ulasan nyata untuk membantu pembeli lain.
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => setIsReviewFormOpen(true)}
                        className="text-xs font-semibold px-4 cursor-pointer shrink-0"
                    >
                        Tulis Ulasan Sekarang
                    </Button>
                </div>
            )}

            {/* Quick Review Form Modal / Inline Box */}
            {isReviewFormOpen && user_pending_order_for_review && (
                <form
                    onSubmit={handleQuickReviewSubmit}
                    className="p-4 sm:p-5 rounded-2xl bg-surface border border-accent/40 shadow-xs space-y-3.5 animate-in fade-in"
                >
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                            <h3 className="text-sm font-bold text-text">Beri Penilaian & Ulasan</h3>
                            <p className="text-xs text-text-2">Pesanan #{user_pending_order_for_review.invoice_code} ({user_pending_order_for_review.variant_name})</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsReviewFormOpen(false)}
                            className="text-xs text-text-2 hover:text-text cursor-pointer"
                        >
                            Batal
                        </button>
                    </div>

                    {errorMsg && (
                        <p className="text-xs text-danger font-medium p-2.5 rounded-lg bg-danger/10 border border-danger/30">
                            {errorMsg}
                        </p>
                    )}

                    {/* Interactive Star Picker */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text block">Bintang Penilaian</label>
                        <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-1 text-surface-hover hover:scale-110 transition-transform cursor-pointer"
                                    aria-label={`Beri ${star} bintang`}
                                >
                                    <Star
                                        className={`w-6 h-6 transition-colors ${
                                            (hoverRating || rating) >= star
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'text-border-strong fill-transparent'
                                        }`}
                                    />
                                </button>
                            ))}
                            <span className="text-xs font-bold text-text ml-2">
                                {hoverRating || rating} / 5
                            </span>
                        </div>
                    </div>

                    {/* Comment Area */}
                    <div className="space-y-1.5">
                        <label htmlFor="quick-review-comment" className="text-xs font-semibold text-text block">
                            Ulasan Anda (Opsional)
                        </label>
                        <textarea
                            id="quick-review-comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            maxLength={500}
                            placeholder="Bagikan pengalaman kamu memakai layanan akun streaming ini..."
                            className="w-full p-3 text-xs bg-surface border border-border rounded-xl text-text placeholder:text-text-2 focus:outline-none focus:border-accent transition-colors"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsReviewFormOpen(false)}
                            disabled={isSubmitting}
                            className="text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            loading={isSubmitting}
                            className="text-xs font-semibold px-5"
                        >
                            Kirim Ulasan
                        </Button>
                    </div>
                </form>
            )}

            {/* Summary Rating Box (Matches Screenshot Layout) */}
            <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-2xs">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Left Column: Big Average & Stars */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center text-center md:border-r border-border md:pr-6 py-2">
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl sm:text-5xl font-black text-text tracking-tight font-mono">
                                {formattedRating}
                            </span>
                            <span className="text-sm sm:text-base font-bold text-text-2">
                                /5.0
                            </span>
                        </div>

                        {/* Star Row */}
                        <div className="flex items-center gap-1 my-2.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                        average_rating >= star
                                            ? 'fill-amber-400 text-amber-400'
                                            : average_rating >= star - 0.5
                                            ? 'fill-amber-400/50 text-amber-400'
                                            : 'text-border-strong fill-transparent'
                                    }`}
                                />
                            ))}
                        </div>

                        <span className="text-xs text-text-2 font-medium">
                            Berdasarkan {total_reviews} ulasan nyata pembeli
                        </span>
                    </div>

                    {/* Right Column: Breakdown Bars 5 down to 1 */}
                    <div className="md:col-span-7 space-y-2 py-1">
                        {breakdown.map((item) => (
                            <div key={item.stars} className="flex items-center gap-3 text-xs">
                                <span className="w-6 font-semibold text-text flex items-center gap-1 shrink-0">
                                    <span>{item.stars}</span>
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                                </span>

                                <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden border border-border/60">
                                    <div
                                        className="h-full bg-amber-400 rounded-full transition-all duration-300"
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>

                                <span className="w-14 text-right font-mono text-[11px] text-text-2 shrink-0 tabular-nums">
                                    {item.count} ({item.percentage}%)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Reviews List or Empty State */}
            {total_reviews === 0 ? (
                /* Empty State (Exact Copy of Orvaki Screenshot) */
                <div className="bg-surface border border-border rounded-2xl p-8 sm:p-10 text-center space-y-2 shadow-2xs">
                    <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center mx-auto text-text-2">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-text">
                        Belum Ada Ulasan
                    </h3>
                    <p className="text-xs text-text-2 max-w-sm mx-auto">
                        Beli produk ini dan jadilah pembeli pertama yang memberikan ulasan!
                    </p>
                </div>
            ) : (
                /* Reviews Cards List */
                <div className="space-y-3 pt-1">
                    {reviews.map((rev) => (
                        <div
                            key={rev.id}
                            className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2.5"
                        >
                            {/* Card Top: Customer info, badge, and date */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-xs sm:text-sm text-text">
                                        {rev.customer_name}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent-text border border-accent/30">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Pembeli Terverifikasi</span>
                                    </span>
                                    {rev.variant_name && (
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-surface-2 text-text-2 border border-border">
                                            {rev.variant_name}
                                        </span>
                                    )}
                                </div>

                                <span className="text-[11px] text-text-2">
                                    {rev.created_at}
                                </span>
                            </div>

                            {/* Stars */}
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-3.5 h-3.5 ${
                                            rev.rating >= star
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'text-border fill-transparent'
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Comment */}
                            {rev.comment && (
                                <p className="text-xs sm:text-sm text-text leading-relaxed pt-0.5">
                                    {rev.comment}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Anti-Spam Guarantee Footer Banner */}
            <div className="p-3 rounded-xl bg-surface-2/60 border border-border text-[11px] text-text-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent-text shrink-0" />
                <span>
                    <strong>Anti-Spam Terjamin:</strong> Seluruh ulasan 100% berasal dari pembeli nyata setelah menyelesaikan transaksi pembayaran. Satu transaksi hanya dapat memberikan satu ulasan.
                </span>
            </div>
        </section>
    );
};

