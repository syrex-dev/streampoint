<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Support\Phone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class TrackingController extends Controller
{
    /**
     * Display the order tracking page.
     */
    public function index(): Response
    {
        return Inertia::render('tracking/Index', [
            'storeName' => config('app.name', 'NamaToko'),
            'orders' => null,
            'searched' => false,
        ]);
    }

    /**
     * Search orders by Invoice Code + WhatsApp or by WhatsApp alone.
     * Throttle: 10/minute per IP.
     */
    public function search(Request $request): Response|RedirectResponse
    {
        $mode = $request->input('mode', 'invoice');

        if ($mode === 'invoice') {
            $request->validate([
                'invoice_code' => ['required', 'string'],
                'phone' => ['required', 'string'],
            ], [
                'invoice_code.required' => 'Kode invoice wajib diisi.',
                'phone.required' => 'Nomor WhatsApp wajib diisi.',
            ]);

            try {
                $normalizedPhone = Phone::normalize((string) $request->input('phone'));
            } catch (InvalidArgumentException $e) {
                return back()->withErrors(['phone' => $e->getMessage()]);
            }

            $order = Order::where('invoice_code', trim((string) $request->input('invoice_code')))
                ->where('customer_phone', $normalizedPhone)
                ->first();

            if (! $order) {
                return back()->withErrors(['search' => 'Pesanan dengan kode invoice dan nomor WhatsApp tersebut tidak ditemukan.']);
            }

            // Authorize session to view this invoice
            $owned = $request->session()->get('owned_invoices', []);
            if (! in_array($order->invoice_code, $owned, true)) {
                $owned[] = $order->invoice_code;
                $request->session()->put('owned_invoices', $owned);
            }

            return redirect()->route('invoice.show', $order->invoice_code);
        }

        // Mode: WhatsApp only
        $request->validate([
            'phone' => ['required', 'string'],
        ], [
            'phone.required' => 'Nomor WhatsApp wajib diisi.',
        ]);

        try {
            $normalizedPhone = Phone::normalize((string) $request->input('phone'));
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['phone' => $e->getMessage()]);
        }

        $orders = Order::with(['product', 'variant'])
            ->where('customer_phone', $normalizedPhone)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn (Order $o) => [
                'invoice_code' => $o->invoice_code,
                'service_name' => $o->product?->name ?? 'Layanan',
                'package_name' => $o->variant?->name ?? 'Paket',
                'status' => $o->status->value,
                'status_label' => $o->status->label(),
                'created_at' => $o->created_at->setTimezone('Asia/Jakarta')->translatedFormat('d M Y, H:i') . ' WIB',
            ]);

        return Inertia::render('tracking/Index', [
            'storeName' => config('app.name', 'NamaToko'),
            'orders' => $orders,
            'searched' => true,
        ]);
    }
}
