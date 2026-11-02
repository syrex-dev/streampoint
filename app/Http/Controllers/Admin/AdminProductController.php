<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProductStoreRequest;
use App\Http\Requests\Admin\ProductUpdateRequest;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminProductController extends Controller
{
    public function index(Request $request): Response
    {
        $products = Product::query()
            ->withCount(['variants', 'accounts', 'orders'])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'category' => $p->category,
                'thumbnail_path' => $p->thumbnail_path,
                'brand_color' => $p->brand_color,
                'is_active' => (bool) $p->is_active,
                'sort_order' => (int) $p->sort_order,
                'variants_count' => (int) $p->variants_count,
                'accounts_count' => (int) $p->accounts_count,
                'orders_count' => (int) $p->orders_count,
                'has_orders' => (bool) ($p->orders_count > 0),
            ]);

        return Inertia::render('admin/products/Index', [
            'products' => $products,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/products/Create');
    }

    public function store(ProductStoreRequest $request): RedirectResponse
    {
        $slug = $request->validated('slug');
        if (empty($slug)) {
            $baseSlug = Str::slug($request->validated('name'));
            $slug = $baseSlug;
            $counter = 1;
            while (Product::where('slug', $slug)->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }
        }

        $thumbnailPath = null;
        if ($request->hasFile('thumbnail')) {
            $path = $request->file('thumbnail')->store('products', 'public');
            $thumbnailPath = '/storage/' . $path;
        }

        $product = Product::create([
            'name' => $request->validated('name'),
            'slug' => $slug,
            'category' => $request->validated('category'),
            'description' => $request->validated('description'),
            'rules' => $request->validated('rules'),
            'is_active' => (bool) $request->validated('is_active'),
            'sort_order' => (int) ($request->validated('sort_order') ?? 0),
            'brand_color' => $request->validated('brand_color'),
            'thumbnail_path' => $thumbnailPath,
        ]);

        return redirect()->route('admin.products.edit', $product)->with('success', "Produk '{$product->name}' berhasil ditambahkan.");
    }

    public function edit(Product $product): Response
    {
        $product->loadCount('orders');

        $variants = $product->variants()
            ->withCount('orders')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($v) => [
                'id' => $v->id,
                'name' => $v->name,
                'type' => $v->type->value,
                'rent_duration' => $v->rent_duration?->value,
                'duration_hours' => (int) $v->duration_hours,
                'price' => (int) $v->price,
                'is_active' => (bool) $v->is_active,
                'sort_order' => (int) $v->sort_order,
                'orders_count' => (int) $v->orders_count,
                'has_orders' => (bool) ($v->orders_count > 0),
            ]);

        return Inertia::render('admin/products/Edit', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'category' => $product->category,
                'thumbnail_path' => $product->thumbnail_path,
                'brand_color' => $product->brand_color,
                'description' => $product->description,
                'rules' => $product->rules,
                'is_active' => (bool) $product->is_active,
                'sort_order' => (int) $product->sort_order,
                'has_orders' => (bool) ($product->orders_count > 0),
            ],
            'variants' => $variants,
        ]);
    }

    public function update(ProductUpdateRequest $request, Product $product): RedirectResponse
    {
        $data = [
            'name' => $request->validated('name'),
            'slug' => $request->validated('slug'),
            'category' => $request->validated('category'),
            'description' => $request->validated('description'),
            'rules' => $request->validated('rules'),
            'is_active' => (bool) $request->validated('is_active'),
            'sort_order' => (int) ($request->validated('sort_order') ?? 0),
            'brand_color' => $request->validated('brand_color'),
        ];

        if ($request->hasFile('thumbnail')) {
            // Delete old file if present in public disk
            if ($product->thumbnail_path && Str::startsWith($product->thumbnail_path, '/storage/')) {
                $oldPath = Str::after($product->thumbnail_path, '/storage/');
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('thumbnail')->store('products', 'public');
            $data['thumbnail_path'] = '/storage/' . $path;
        }

        $product->update($data);

        return back()->with('success', "Produk '{$product->name}' berhasil diperbarui.");
    }

    public function destroy(Product $product): RedirectResponse
    {
        if ($product->orders()->exists()) {
            return back()->withErrors(['action' => "Produk '{$product->name}' tidak dapat dihapus karena sudah memiliki riwayat pesanan. Anda dapat menonaktifkannya."]);
        }

        if ($product->thumbnail_path && Str::startsWith($product->thumbnail_path, '/storage/')) {
            $oldPath = Str::after($product->thumbnail_path, '/storage/');
            Storage::disk('public')->delete($oldPath);
        }

        $productName = $product->name;
        $product->delete();

        return redirect()->route('admin.products.index')->with('success', "Produk '{$productName}' berhasil dihapus.");
    }
}
