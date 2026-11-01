<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\QuotaService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(Request $request, QuotaService $quotaService): Response
    {
        $today = now()->toDateString();

        // 1. Order counts today per status
        $todayCounts = [
            'pending' => Order::where('quota_date', $today)->where('status', OrderStatus::PENDING)->count(),
            'verifying' => Order::where('quota_date', $today)->where('status', OrderStatus::VERIFYING)->count(),
            'paid' => Order::where('quota_date', $today)->where('status', OrderStatus::PAID)->count(),
            'expired' => Order::where('quota_date', $today)->where('status', OrderStatus::EXPIRED)->count(),
            'cancelled' => Order::where('quota_date', $today)->where('status', OrderStatus::CANCELLED)->count(),
            'total' => Order::where('quota_date', $today)->count(),
        ];

        // 2. Rental quota slots
        $quota = $quotaService->snapshot();

        // 3. Active VERIFYING orders prioritized (newest first)
        $verifyingOrders = Order::with(['product:id,name,icon_url', 'variant:id,name,duration_hours,type'])
            ->where('status', OrderStatus::VERIFYING)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Order $order) => [
                'id' => $order->id,
                'invoice_code' => $order->invoice_code,
                'product_name' => $order->product?->name ?? '-',
                'variant_name' => $order->variant?->name ?? '-',
                'order_type' => $order->order_type->value,
                'customer_phone' => $order->customer_phone,
                'total_amount' => $order->total_amount,
                'has_proof' => ! empty($order->payment_proof_path),
                'created_at' => $order->created_at?->toIso8601String(),
                'created_at_human' => $order->created_at?->diffForHumans(),
            ]);

        return Inertia::render('admin/Dashboard', [
            'todayCounts' => $todayCounts,
            'quota' => $quota,
            'verifyingOrders' => $verifyingOrders,
        ]);
    }
}
