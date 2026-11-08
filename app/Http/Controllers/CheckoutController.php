<?php

namespace App\Http\Controllers;

use App\Actions\Order\CreateOrder;
use App\Actions\Order\CreateOrderData;
use App\Exceptions\ActiveOrderExistsException;
use App\Exceptions\OutOfStockException;
use App\Exceptions\QuotaFullException;
use App\Http\Requests\CheckoutRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    /**
     * Store a newly created order.
     * Throttle: 5/minute per IP.
     */
    public function store(CheckoutRequest $request, CreateOrder $createOrder): RedirectResponse
    {
        $idempotencyKey = (string) $request->validated('idempotency_key');
        $cacheKey = "checkout:idempotency:{$idempotencyKey}";

        // Idempotency: return existing order invoice if already processed
        if ($existingInvoice = Cache::get($cacheKey)) {
            $owned = $request->session()->get('owned_invoices', []);
            if (! in_array($existingInvoice, $owned, true)) {
                $owned[] = $existingInvoice;
                $request->session()->put('owned_invoices', $owned);
            }

            return redirect()->route('invoice.show', $existingInvoice);
        }

        try {
            $order = $createOrder->handle(new CreateOrderData(
                variantId: (int) $request->validated('variant_id'),
                phone: (string) $request->validated('customer_phone'),
                paymentMethodId: (int) $request->validated('payment_method_id'),
                note: $request->validated('customer_note'),
                ownedInvoices: $request->session()->get('owned_invoices', []),
            ));
        } catch (ActiveOrderExistsException $e) {
            if ($e->ownedBySession) {
                $msg = $e->isVerifying
                    ? "Pesanan {$e->invoiceCode} sedang diverifikasi admin. Kamu bisa memesan lagi setelah selesai."
                    : "Kamu masih punya pesanan yang belum selesai ({$e->invoiceCode}). Selesaikan pembayaran atau batalkan dulu.";
            } else {
                $msg = $e->isVerifying
                    ? 'Nomor ini masih punya pesanan yang sedang diverifikasi admin. Tunggu sampai selesai atau gunakan Cek Pesanan.'
                    : 'Nomor ini masih punya pesanan yang belum selesai. Tunggu sampai selesai atau gunakan Cek Pesanan.';
            }

            throw ValidationException::withMessages([
                'customer_phone' => $msg,
            ]);
        } catch (QuotaFullException) {
            throw ValidationException::withMessages([
                'variant_id' => 'Kuota sewa hari ini sudah penuh. Silakan coba lagi besok pukul 00:00 WIB.',
            ]);
        } catch (OutOfStockException) {
            throw ValidationException::withMessages([
                'variant_id' => 'Stok unit akun untuk layanan ini sedang habis.',
            ]);
        }

        // Cache idempotency key for 1 hour
        Cache::put($cacheKey, $order->invoice_code, now()->addHour());

        // Store invoice in session so buyer is authorized to view full details
        $owned = $request->session()->get('owned_invoices', []);
        if (! in_array($order->invoice_code, $owned, true)) {
            $owned[] = $order->invoice_code;
            $request->session()->put('owned_invoices', $owned);
        }

        return redirect()->route('invoice.show', $order->invoice_code);
    }
}
