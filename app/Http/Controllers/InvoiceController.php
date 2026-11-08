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
        $order = Order::with(['product', 'variant', 'paymentMethod', 'account'])
            ->where('invoice_code', $invoiceCode)
            ->firstOrFail();

        $owned = $request->session()->get('owned_invoices', []);
        $isAuthorized = in_array($order->invoice_code, $owned, true);

        // Parse credentials only if authorized and status is PAID
        $credentials = null;
        if ($isAuthorized && $order->status === OrderStatus::PAID && $order->account?->credential) {
            $raw = $order->account->credential;
            $parts = array_map('trim', explode('|', $raw));
            $credentials = [
                'email' => $parts[0] ?? $raw,
                'password' => $parts[1] ?? '',
                'profile' => $parts[2] ?? '',
                'pin' => $parts[3] ?? '',
                'raw' => $raw,
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
                'created_at' => $order->created_at->toIso8601String(),
            ],
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
