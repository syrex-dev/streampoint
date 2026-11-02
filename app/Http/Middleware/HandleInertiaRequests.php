<?php

namespace App\Http\Middleware;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $setting = Setting::current();

        // Pending or verifying order banner for session
        $pendingOrder = null;
        $ownedInvoices = $request->session()->get('owned_invoices', []);
        if (! empty($ownedInvoices) && is_array($ownedInvoices)) {
            $activeOrder = Order::whereIn('invoice_code', $ownedInvoices)
                ->whereIn('status', [OrderStatus::PENDING, OrderStatus::VERIFYING])
                ->where('payment_expires_at', '>', now())
                ->orderByDesc('id')
                ->first(['invoice_code', 'status']);

            if ($activeOrder) {
                $pendingOrder = [
                    'invoice_code' => $activeOrder->invoice_code,
                    'status' => $activeOrder->status->value,
                    'status_label' => $activeOrder->status->label(),
                ];
            }
        }

        $storeName = $setting->store_name ?: config('app.name', 'StreamPoint');

        return [
            ...parent::share($request),
            'name' => $storeName,
            'auth' => [
                'user' => $request->user(),
            ],
            'settings' => [
                'admin_whatsapp' => $setting->admin_whatsapp,
                'business_hours' => $setting->business_hours,
                'store_name' => $storeName,
                'store_logo_path' => $setting->store_logo_path,
                'accent_preset' => $setting->accent_preset ?? 'emerald',
            ],
            'pendingOrder' => $pendingOrder,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
