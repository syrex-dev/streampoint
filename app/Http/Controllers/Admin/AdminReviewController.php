<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminReviewController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Review::with(['product', 'order', 'variant'])->latest();

        if ($productId = $request->query('product_id')) {
            $query->where('product_id', $productId);
        }

        if ($rating = $request->query('rating')) {
            $query->where('rating', (int) $rating);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('customer_phone', 'like', "%{$search}%")
                  ->orWhere('comment', 'like', "%{$search}%")
                  ->orWhereHas('order', function ($oq) use ($search) {
                      $oq->where('invoice_code', 'like', "%{$search}%");
                  });
            });
        }

        $reviews = $query->paginate(15)->withQueryString()->through(fn ($r) => [
            'id' => $r->id,
            'rating' => $r->rating,
            'comment' => $r->comment,
            'customer_phone' => $r->customer_phone,
            'customer_name' => $r->customer_name,
            'is_visible' => (bool) $r->is_visible,
            'created_at' => $r->created_at->format('d M Y, H:i'),
            'product' => [
                'id' => $r->product->id,
                'name' => $r->product->name,
                'slug' => $r->product->slug,
            ],
            'variant_name' => $r->variant?->name,
            'order' => [
                'invoice_code' => $r->order->invoice_code,
            ],
        ]);

        $products = Product::orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/reviews/Index', [
            'reviews' => $reviews,
            'products' => $products,
            'filters' => [
                'product_id' => $request->query('product_id', ''),
                'rating' => $request->query('rating', ''),
                'search' => $request->query('search', ''),
            ],
        ]);
    }

    public function toggleVisibility(Review $review): RedirectResponse
    {
        $review->update([
            'is_visible' => ! $review->is_visible,
        ]);

        return back()->with('success', 'Status visibilitas ulasan berhasil diubah.');
    }

    public function destroy(Review $review): RedirectResponse
    {
        $review->delete();

        return back()->with('success', 'Ulasan berhasil dihapus.');
    }
}

