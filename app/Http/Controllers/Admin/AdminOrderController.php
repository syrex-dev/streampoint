<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Order\ApproveOrder;
use App\Actions\Order\ReactivateOrder;
use App\Actions\Order\RejectOrder;
use App\Actions\Order\ReplaceAccount;
use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\ProductAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->query('status');
        $search = trim((string) $request->query('q', ''));

        $query = Order::with(['product:id,name', 'variant:id,name,duration_hours,type']);

        if (! empty($status) && in_array($status, array_column(OrderStatus::cases(), 'value'), true)) {
            $query->where('status', $status);
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_code', 'like', "%{$search}%")
                  ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        // VERIFYING orders on top, then newest first
        $orders = $query
            ->orderByRaw("CASE WHEN status = 'VERIFYING' THEN 0 ELSE 1 END")
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/orders/Index', [
            'orders' => $orders,
            'filters' => [
                'status' => $status ?? '',
                'q' => $search,
            ],
            'statuses' => array_map(fn (OrderStatus $s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ], OrderStatus::cases()),
        ]);
    }

    public function show(Order $order): Response
    {
        $order->load([
            'product',
            'variant',
            'account',
            'paymentMethod',
            'events' => fn ($q) => $q->orderBy('created_at', 'asc'),
        ]);

        // Available alternative units for potential swap
        $availableAccounts = ProductAccount::where('product_id', $order->product_id)
            ->where('kind', $order->order_type->value)
            ->where('status', AccountStatus::AVAILABLE)
            ->get(['id', 'credential', 'note', 'created_at']);

        return Inertia::render('admin/orders/Show', [
            'order' => [
                'id' => $order->id,
                'invoice_code' => $order->invoice_code,
                'product_id' => $order->product_id,
                'product_name' => $order->product?->name ?? '-',
                'product_icon' => $order->product?->thumbnail_path,
                'variant_id' => $order->variant_id,
                'variant_name' => $order->variant?->name ?? '-',
                'order_type' => $order->order_type->value,
                'duration_hours' => $order->variant?->duration_hours,
                'customer_phone' => $order->customer_phone,
                'customer_note' => $order->customer_note,
                'payment_method_label' => $order->payment_method_label,
                'base_price' => $order->base_price,
                'unique_code' => $order->unique_code,
                'total_amount' => $order->total_amount,
                'has_proof' => ! empty($order->payment_proof_path),
                'status' => $order->status->value,
                'status_label' => $order->status->label(),
                'status_note' => $order->status_note,
                'payment_expires_at' => $order->payment_expires_at?->toIso8601String(),
                'access_starts_at' => $order->access_starts_at?->toIso8601String(),
                'access_expires_at' => $order->access_expires_at?->toIso8601String(),
                'paid_at' => $order->paid_at?->toIso8601String(),
                'quota_date' => $order->quota_date?->toDateString(),
                'created_at' => $order->created_at?->toIso8601String(),
                'account' => $order->account ? [
                    'id' => $order->account->id,
                    'credential' => $order->account->credential,
                    'status' => $order->account->status->value,
                    'note' => $order->account->note,
                ] : null,
                'events' => $order->events->map(fn ($e) => [
                    'id' => $e->id,
                    'from_status' => $e->from_status?->value,
                    'to_status' => $e->to_status->value,
                    'actor' => $e->actor,
                    'note' => $e->note,
                    'created_at' => $e->created_at?->toIso8601String(),
                ]),
            ],
            'availableAccounts' => $availableAccounts,
        ]);
    }

    /**
     * Stream payment proof image securely from private disk.
     */
    public function proof(Order $order): StreamedResponse
    {
        if (empty($order->payment_proof_path) || ! Storage::disk('private')->exists($order->payment_proof_path)) {
            abort(404, 'Bukti transfer tidak ditemukan.');
        }

        return Storage::disk('private')->response($order->payment_proof_path);
    }

    public function approve(Request $request, Order $order, ApproveOrder $action): RedirectResponse
    {
        $newAccountId = $request->input('account_id') ? (int) $request->input('account_id') : null;
        $actor = 'admin:' . $request->user()->id;

        try {
            $action->handle($order, $newAccountId, $actor);
            return back()->with('success', "Pesanan {$order->invoice_code} berhasil disetujui.");
        } catch (\Throwable $e) {
            return back()->withErrors(['action' => $e->getMessage()]);
        }
    }

    public function reject(Request $request, Order $order, RejectOrder $action): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:500'],
        ], [
            'reason.required' => 'Alasan penolakan pesanan wajib diisi.',
            'reason.min' => 'Alasan penolakan minimal 3 karakter.',
        ]);

        $actor = 'admin:' . $request->user()->id;

        try {
            $action->handle($order, $validated['reason'], $actor);
            return back()->with('success', "Pesanan {$order->invoice_code} telah ditolak.");
        } catch (\Throwable $e) {
            return back()->withErrors(['action' => $e->getMessage()]);
        }
    }

    public function reactivate(Request $request, Order $order, ReactivateOrder $action): RedirectResponse
    {
        $actor = 'admin:' . $request->user()->id;

        try {
            $action->handle($order, $actor);
            return back()->with('success', "Pesanan {$order->invoice_code} berhasil diaktifkan kembali.");
        } catch (\Throwable $e) {
            return back()->withErrors(['action' => $e->getMessage()]);
        }
    }

    public function replaceAccount(Request $request, Order $order, ReplaceAccount $action): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:500'],
            'new_account_id' => ['nullable', 'integer', 'exists:product_accounts,id'],
        ], [
            'reason.required' => 'Alasan penggantian akun wajib diisi.',
            'reason.min' => 'Alasan penggantian minimal 3 karakter.',
        ]);

        $actor = 'admin:' . $request->user()->id;

        try {
            $newAccountId = ! empty($validated['new_account_id']) ? (int) $validated['new_account_id'] : null;
            $action->handle($order, $validated['reason'], $newAccountId, $actor);

            return back()->with('success', "Akun untuk pesanan {$order->invoice_code} berhasil diganti (Garansi).");
        } catch (\Throwable $e) {
            return back()->withErrors(['action' => $e->getMessage()]);
        }
    }

    public function revoke(Request $request, Order $order, \App\Actions\Order\RevokeAccess $action): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:500'],
            'release_stock' => ['nullable', 'boolean'],
        ], [
            'reason.required' => 'Alasan pencabutan akses wajib diisi.',
            'reason.min' => 'Alasan minimal 3 karakter.',
            'reason.max' => 'Alasan maksimal 500 karakter.',
        ]);

        $actor = 'admin:' . $request->user()->id;

        try {
            $releaseStock = (bool) ($request->input('release_stock', true));
            $action->handle($order, $validated['reason'], $releaseStock, $actor);

            return back()->with('success', "Akses pesanan {$order->invoice_code} berhasil dicabut karena pelanggaran.");
        } catch (\Throwable $e) {
            return back()->withErrors(['action' => $e->getMessage()]);
        }
    }
}

