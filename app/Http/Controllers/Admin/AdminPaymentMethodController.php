<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PaymentMethodType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PaymentMethodStoreRequest;
use App\Http\Requests\Admin\PaymentMethodUpdateRequest;
use App\Models\PaymentMethod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminPaymentMethodController extends Controller
{
    public function index(Request $request): Response
    {
        $paymentMethods = PaymentMethod::withCount('orders')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (PaymentMethod $pm) => [
                'id' => $pm->id,
                'type' => $pm->type->value,
                'type_label' => $pm->type->label(),
                'label' => $pm->label,
                'account_number' => $pm->account_number,
                'account_holder' => $pm->account_holder,
                'instructions' => $pm->instructions,
                'qris_image_path' => $pm->qris_image_path,
                'is_active' => (bool) $pm->is_active,
                'sort_order' => (int) $pm->sort_order,
                'orders_count' => (int) $pm->orders_count,
                'has_orders' => (bool) ($pm->orders_count > 0),
            ]);

        return Inertia::render('admin/payment-methods/Index', [
            'paymentMethods' => $paymentMethods,
            'types' => collect(PaymentMethodType::cases())->map(fn ($t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
        ]);
    }

    public function store(PaymentMethodStoreRequest $request): RedirectResponse
    {
        $qrisImagePath = null;
        if ($request->hasFile('qris_image')) {
            $path = $request->file('qris_image')->store('qris', 'public');
            $qrisImagePath = '/storage/' . $path;
        }

        $paymentMethod = PaymentMethod::create([
            'type' => PaymentMethodType::from($request->validated('type')),
            'label' => $request->validated('label'),
            'account_number' => $request->validated('account_number'),
            'account_holder' => $request->validated('account_holder'),
            'instructions' => $request->validated('instructions'),
            'is_active' => (bool) $request->validated('is_active'),
            'sort_order' => (int) ($request->validated('sort_order') ?? 0),
            'qris_image_path' => $qrisImagePath,
        ]);

        return back()->with('success', "Metode pembayaran '{$paymentMethod->label}' berhasil ditambahkan.");
    }

    public function update(PaymentMethodUpdateRequest $request, PaymentMethod $paymentMethod): RedirectResponse
    {
        $data = [
            'type' => PaymentMethodType::from($request->validated('type')),
            'label' => $request->validated('label'),
            'account_number' => $request->validated('account_number'),
            'account_holder' => $request->validated('account_holder'),
            'instructions' => $request->validated('instructions'),
            'is_active' => (bool) $request->validated('is_active'),
            'sort_order' => (int) ($request->validated('sort_order') ?? 0),
        ];

        if ($request->hasFile('qris_image')) {
            if ($paymentMethod->qris_image_path && Str::startsWith($paymentMethod->qris_image_path, '/storage/')) {
                $oldPath = Str::after($paymentMethod->qris_image_path, '/storage/');
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('qris_image')->store('qris', 'public');
            $data['qris_image_path'] = '/storage/' . $path;
        }

        $paymentMethod->update($data);

        return back()->with('success', "Metode pembayaran '{$paymentMethod->label}' berhasil diperbarui.");
    }

    public function destroy(PaymentMethod $paymentMethod): RedirectResponse
    {
        if ($paymentMethod->orders()->exists()) {
            return back()->withErrors([
                'action' => "Metode pembayaran '{$paymentMethod->label}' tidak dapat dihapus karena sudah memiliki riwayat pesanan. Anda dapat menonaktifkannya.",
            ]);
        }

        if ($paymentMethod->qris_image_path && Str::startsWith($paymentMethod->qris_image_path, '/storage/')) {
            $oldPath = Str::after($paymentMethod->qris_image_path, '/storage/');
            Storage::disk('public')->delete($oldPath);
        }

        $label = $paymentMethod->label;
        $paymentMethod->delete();

        return back()->with('success', "Metode pembayaran '{$label}' berhasil dihapus.");
    }
}
