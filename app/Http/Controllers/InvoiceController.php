<?php

namespace App\Http\Controllers;

use App\Actions\Order\ConfirmPayment;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Support\Phone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class InvoiceController extends Controller
{
    /**
     * Display the invoice details.
     * Shows credentials only if authorized via session ownership or phone verification.
     */
    public function show(string $invoiceCode, Request $request): Response
    {
        $order = Order::with(['product', 'variant', 'paymentMethod', 'account', 'review'])
            ->where('invoice_code', $invoiceCode)
            ->firstOrFail();

        $owned = $request->session()->get('owned_invoices', []);
        $isAuthorized = in_array($order->invoice_code, $owned, true);

        // Parse credentials only if authorized and status is PAID
        $credentials = null;
        if ($isAuthorized && $order->status === OrderStatus::PAID && $order->account?->credential) {
            $raw = $order->account->credential;
            $parts = array_map('trim', explode('|', $raw));
            $stockFields = $order->variant?->stock_fields;
            if (is_array($stockFields) && ! empty($stockFields) && is_array($stockFields[0] ?? null) && isset($stockFields[0]['key'])) {
                $stockFields = array_column($stockFields, 'key');
            }

            $isLink = str_starts_with($raw, 'http://') || str_starts_with($raw, 'https://');
            $items = [];

            if ($isLink) {
                $items[] = [
                    'key' => 'link',
                    'label' => 'Tautan Undangan (Link Invite)',
                    'value' => $raw,
                    'is_secret' => false,
                ];
            } elseif (! empty($stockFields)) {
                foreach ($stockFields as $idx => $fieldName) {
                    if (isset($parts[$idx]) && $parts[$idx] !== '') {
                        $label = match (strtolower((string) $fieldName)) {
                            'email' => 'Email Akun',
                            'password' => 'Password Akun',
                            'profile', 'profil' => 'Nomor / Nama Profil',
                            'pin' => 'PIN Profil',
                            'link', 'url' => 'Tautan Undangan',
                            'code', 'voucher', 'kode', 'kode_voucher' => 'Kode Voucher',
                            default => ucfirst(str_replace('_', ' ', (string) $fieldName)),
                        };

                        $items[] = [
                            'key' => (string) $fieldName,
                            'label' => $label,
                            'value' => $parts[$idx],
                            'is_secret' => in_array(strtolower((string) $fieldName), ['password', 'pin', 'secret', 'key'], true),
                        ];
                    }
                }
            } else {
                if (count($parts) >= 2) {
                    $items[] = ['key' => 'email', 'label' => 'Email Akun', 'value' => $parts[0], 'is_secret' => false];
                    $items[] = ['key' => 'password', 'label' => 'Password Akun', 'value' => $parts[1], 'is_secret' => true];
                    if (isset($parts[2]) && $parts[2] !== '') {
                        $items[] = ['key' => 'profile', 'label' => 'Nomor / Nama Profil', 'value' => $parts[2], 'is_secret' => false];
                    }
                    if (isset($parts[3]) && $parts[3] !== '') {
                        $items[] = ['key' => 'pin', 'label' => 'PIN Profil', 'value' => $parts[3], 'is_secret' => true];
                    }
                } elseif (! empty($raw)) {
                    $items[] = ['key' => 'credential', 'label' => 'Kode / Kredensial', 'value' => $raw, 'is_secret' => false];
                }
            }

            $credentials = [
                'email' => $isLink ? '' : ($parts[0] ?? $raw),
                'password' => $parts[1] ?? '',
                'profile' => $parts[2] ?? '',
                'pin' => $parts[3] ?? '',
                'link' => $isLink ? $raw : '',
                'raw' => $raw,
                'items' => $items,
            ];
        }

        // Mask phone number for unauthorized viewers
        $phone = $order->customer_phone;
        if (! $isAuthorized && strlen($phone) > 6) {
            $phone = substr($phone, 0, 4) . '****' . substr($phone, -4);
        }

        $paymentMethod = $order->paymentMethod;
        $setting = \App\Models\Setting::current();

        return Inertia::render('invoice/Show', [
            'storeName' => $setting->store_name ?: config('app.name', 'StreamPoint'),
            'adminWhatsapp' => $setting->admin_whatsapp,
            'admin_whatsapp' => $setting->admin_whatsapp,
            'isAuthorized' => $isAuthorized,
            'serverNow' => now()->toIso8601String(),
            'order' => [
                'invoice_code' => $order->invoice_code,
                'order_type' => $order->order_type->value,
                'status' => $order->status->value,
                'status_label' => $order->status->label(),
                'status_note' => $order->status_note,
                'product' => [
                    'name' => $order->product?->name ?? 'Layanan',
                    'slug' => $order->product?->slug ?? '',
                    'category' => $order->product?->category ?? 'Streaming',
                    'thumbnail_path' => $order->product?->thumbnail_path,
                ],
                'variant' => [
                    'name' => $order->variant?->name ?? 'Paket',
                    'type' => $order->variant?->type?->value ?? $order->order_type->value,
                    'duration_hours' => (int) ($order->variant?->duration_hours ?? 0),
                ],
                'payment_method' => $paymentMethod ? [
                    'type' => $paymentMethod->type->value,
                    'label' => $paymentMethod->label,
                    'account_number' => $paymentMethod->account_number,
                    'account_holder' => $paymentMethod->account_holder,
                    'qris_image_path' => $paymentMethod->qris_image_path,
                    'instructions' => $paymentMethod->instructions,
                ] : [
                    'type' => 'QRIS',
                    'label' => $order->payment_method_label,
                    'account_number' => null,
                    'account_holder' => null,
                    'qris_image_path' => null,
                    'instructions' => null,
                ],
                'base_price' => (int) $order->base_price,
                'unique_code' => (int) $order->unique_code,
                'total_amount' => (int) $order->total_amount,
                'customer_phone' => $phone,
                'customer_note' => $order->customer_note,
                'payment_expires_at' => $order->payment_expires_at->toIso8601String(),
                'access_starts_at' => $order->access_starts_at?->toIso8601String(),
                'access_expires_at' => $order->access_expires_at?->toIso8601String(),
                'has_payment_proof' => ! empty($order->payment_proof_path),
                'credentials' => $credentials,
                'delivery_type' => $order->variant?->delivery_type?->value ?? 'STOCK',
                'fulfillment_status' => $order->fulfillment_status?->value ?? ($order->status === OrderStatus::PAID ? 'DELIVERED' : 'AWAITING_ACTION'),
                'delivery_instructions' => $order->variant?->delivery_instructions,
                'eta_text' => $order->variant?->eta_text,
                'buyer_inputs' => $order->buyer_inputs,
                'delivery_message' => $order->delivery_message,
                'fulfilled_at' => $order->fulfilled_at?->toIso8601String(),
                'created_at' => $order->created_at->toIso8601String(),
            ],
            'userReview' => $order->review ? [
                'rating' => (int) $order->review->rating,
                'comment' => $order->review->comment,
                'created_at' => $order->review->created_at->format('d M Y, H:i'),
            ] : null,
            'canReview' => $isAuthorized && $order->status === OrderStatus::PAID && ! $order->review,
        ]);
    }

    /**
     * Buyer confirms payment ("Saya Sudah Bayar") and optionally uploads proof of payment.
     */
    public function confirm(string $invoiceCode, Request $request, ConfirmPayment $confirmPayment): RedirectResponse
    {
        $request->validate([
            'proof' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
        ], [
            'proof.image' => 'Bukti pembayaran harus berupa gambar.',
            'proof.mimes' => 'Format bukti pembayaran harus JPG, JPEG, PNG, atau WEBP.',
            'proof.max' => 'Ukuran file bukti pembayaran maksimal 3MB.',
        ]);

        $order = Order::where('invoice_code', $invoiceCode)->firstOrFail();

        try {
            $confirmPayment->handle($order, $request->file('proof'));
        } catch (\Throwable $e) {
            return back()->withErrors(['confirm' => $e->getMessage()]);
        }

        // Keep invoice in owned list
        $owned = $request->session()->get('owned_invoices', []);
        if (! in_array($order->invoice_code, $owned, true)) {
            $owned[] = $order->invoice_code;
            $request->session()->put('owned_invoices', $owned);
        }

        return back();
    }

    /**
     * Verify customer WhatsApp phone number to unlock credentials on the invoice page.
     * Throttle: 5/minute per IP.
     */
    public function verify(string $invoiceCode, Request $request): RedirectResponse
    {
        $request->validate([
            'phone' => ['required', 'string'],
        ], [
            'phone.required' => 'Nomor WhatsApp wajib diisi.',
        ]);

        $order = Order::where('invoice_code', $invoiceCode)->firstOrFail();

        try {
            $normalized = Phone::normalize((string) $request->input('phone'));
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['phone' => $e->getMessage()]);
        }

        if ($normalized !== $order->customer_phone) {
            return back()->withErrors(['phone' => 'Nomor WhatsApp tidak cocok dengan data pesanan.']);
        }

        // Authorized: add to session
        $owned = $request->session()->get('owned_invoices', []);
        if (! in_array($order->invoice_code, $owned, true)) {
            $owned[] = $order->invoice_code;
            $request->session()->put('owned_invoices', $owned);
        }

        return back();
    }

    /**
     * Buyer cancels their own PENDING order.
     * Throttle: 5/minute per IP.
     */
    public function cancel(string $invoiceCode, Request $request, \App\Actions\Order\CancelOrderByBuyer $cancelOrder): RedirectResponse
    {
        $order = Order::where('invoice_code', $invoiceCode)->firstOrFail();

        $owned = $request->session()->get('owned_invoices', []);
        if (! in_array($order->invoice_code, $owned, true)) {
            abort(403, 'Kamu tidak memiliki izin untuk membatalkan pesanan ini.');
        }

        try {
            $cancelOrder->handle($order);
        } catch (\Throwable $e) {
            return back()->withErrors(['cancel' => $e->getMessage()]);
        }

        return back()->with('success', 'Pesanan berhasil dibatalkan.');
    }
}
