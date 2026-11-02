<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderType;
use App\Enums\RentDuration;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductVariantStoreRequest;
use App\Http\Requests\Admin\ProductVariantUpdateRequest;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\RedirectResponse;

class AdminProductVariantController extends Controller
{
    public function store(ProductVariantStoreRequest $request, Product $product): RedirectResponse
    {
        $type = OrderType::from($request->validated('type'));
        $rentDuration = $type === OrderType::RENT && $request->filled('rent_duration')
            ? RentDuration::from($request->validated('rent_duration'))
            : null;

        $product->variants()->create([
            'name' => $request->validated('name'),
            'type' => $type,
            'rent_duration' => $rentDuration,
            'duration_hours' => (int) $request->validated('duration_hours'),
            'price' => (int) $request->validated('price'),
            'is_active' => (bool) $request->validated('is_active'),
            'sort_order' => (int) ($request->validated('sort_order') ?? 0),
        ]);

        return back()->with('success', 'Varian paket berhasil ditambahkan.');
    }

    public function update(ProductVariantUpdateRequest $request, Product $product, ProductVariant $variant): RedirectResponse
    {
        $type = OrderType::from($request->validated('type'));
        $rentDuration = $type === OrderType::RENT && $request->filled('rent_duration')
            ? RentDuration::from($request->validated('rent_duration'))
            : null;

        $variant->update([
            'name' => $request->validated('name'),
            'type' => $type,
            'rent_duration' => $rentDuration,
            'duration_hours' => (int) $request->validated('duration_hours'),
            'price' => (int) $request->validated('price'),
            'is_active' => (bool) $request->validated('is_active'),
            'sort_order' => (int) ($request->validated('sort_order') ?? 0),
        ]);

        return back()->with('success', 'Varian paket berhasil diperbarui.');
    }

    public function destroy(Product $product, ProductVariant $variant): RedirectResponse
    {
        if ($variant->orders()->exists()) {
            return back()->withErrors(['action' => "Varian '{$variant->name}' tidak dapat dihapus karena sudah memiliki riwayat pesanan. Anda dapat menonaktifkannya."]);
        }

        $variantName = $variant->name;
        $variant->delete();

        return back()->with('success', "Varian '{$variantName}' berhasil dihapus.");
    }
}
