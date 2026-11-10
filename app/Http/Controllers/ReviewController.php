<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Review;
use App\Support\Phone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class ReviewController extends Controller
{
    /**
     * Submit a review for a completed order.
     * Anti-Spam:
     * 1. Only PAID orders can review.
     * 2. Exactly 1 review per order (unique constraint on order_id).
     * 3. Must be verified order owner (session or phone verification).
     * 4. Honeypot check.
     * 5. Sanitized text and rate-limited.
     */
    public function store(string $invoiceCode, Request $request): RedirectResponse
    {
        // Anti-bot honeypot check
        if ($request->filled('hp_website')) {
            return back();
        }

        $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'min:3', 'max:500'],
            'phone' => ['nullable', 'string'],
        ], [
            'rating.required' => 'Pilih bintang penilaian 1 hingga 5.',
            'rating.min' => 'Penilaian minimal 1 bintang.',
            'rating.max' => 'Penilaian maksimal 5 bintang.',
            'comment.min' => 'Ulasan minimal 3 karakter.',
            'comment.max' => 'Ulasan maksimal 500 karakter.',
        ]);

        $order = Order::where('invoice_code', $invoiceCode)->firstOrFail();

        // Anti-Spam 1: Order must be paid
        if ($order->status !== OrderStatus::PAID) {
            throw ValidationException::withMessages([
                'review' => 'Ulasan hanya dapat diberikan setelah pesanan lunas dan akun telah aktif.',
            ]);
        }

        // Anti-Spam 2: Exactly 1 review per order
        if ($order->review()->exists()) {
            throw ValidationException::withMessages([
                'review' => 'Pesanan ini sudah pernah memberikan ulasan. Setiap transaksi hanya dapat diulas 1 kali.',
            ]);
        }

        // Anti-Spam 3: Customer authorization check
        $owned = $request->session()->get('owned_invoices', []);
        $isAuthorized = in_array($order->invoice_code, $owned, true);

        if (! $isAuthorized) {
            $phoneInput = (string) $request->input('phone', '');
            if (empty($phoneInput)) {
                throw ValidationException::withMessages([
                    'phone' => 'Verifikasi nomor WhatsApp diperlukan sebelum mengirimkan ulasan.',
                ]);
            }

            try {
                $normalized = Phone::normalize($phoneInput);
            } catch (InvalidArgumentException $e) {
                throw ValidationException::withMessages([
                    'phone' => $e->getMessage(),
                ]);
            }

            if ($normalized !== $order->customer_phone) {
                throw ValidationException::withMessages([
                    'phone' => 'Nomor WhatsApp tidak cocok dengan data pemesanan.',
                ]);
            }

            // Remember in session
            $owned[] = $order->invoice_code;
            $request->session()->put('owned_invoices', $owned);
        }

        // Sanitize comment
        $comment = $request->input('comment');
        if ($comment !== null) {
            $comment = trim(strip_tags((string) $comment));
            if ($comment === '') {
                $comment = null;
            }
        }

        $phone = $order->customer_phone;
        $maskedPhone = strlen($phone) > 6
            ? substr($phone, 0, 4) . '****' . substr($phone, -4)
            : 'Pembeli Terverifikasi';

        Review::create([
            'product_id' => $order->product_id,
            'order_id' => $order->id,
            'variant_id' => $order->variant_id,
            'customer_phone' => $order->customer_phone,
            'customer_name' => $maskedPhone,
            'rating' => (int) $request->input('rating'),
            'comment' => $comment,
            'is_visible' => true,
        ]);

        return back()->with('success', 'Ulasan Anda berhasil dikirim! Terima kasih atas penilaiannya.');
    }
}
