<?php

use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StorefrontController;
use App\Http\Controllers\TrackingController;
use Illuminate\Support\Facades\Route;

Route::get('/', [StorefrontController::class, 'index'])->name('home');
Route::get('/p/{slug}', [ProductController::class, 'show'])->name('product.show');

Route::post('/checkout', [CheckoutController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('checkout.store');

Route::get('/invoice/{invoiceCode}', [InvoiceController::class, 'show'])->name('invoice.show');
Route::post('/invoice/{invoiceCode}/confirm', [InvoiceController::class, 'confirm'])->name('invoice.confirm');
Route::post('/invoice/{invoiceCode}/verify', [InvoiceController::class, 'verify'])
    ->middleware('throttle:5,1')
    ->name('invoice.verify');

Route::get('/cek-pesanan', [TrackingController::class, 'index'])->name('tracking.index');
Route::post('/cek-pesanan', [TrackingController::class, 'search'])
    ->middleware('throttle:10,1')
    ->name('tracking.search');

Route::inertia('/syarat-ketentuan', 'static/Terms')->name('terms');
Route::inertia('/kebijakan-privasi', 'static/Privacy')->name('privacy');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function (\Illuminate\Http\Request $request) {
        if ($request->user()?->is_admin) {
            return redirect()->route('admin.dashboard');
        }
        return \Inertia\Inertia::render('dashboard');
    })->name('dashboard');
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'index'])->name('dashboard');

    Route::get('/orders', [\App\Http\Controllers\Admin\AdminOrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [\App\Http\Controllers\Admin\AdminOrderController::class, 'show'])->name('orders.show');
    Route::get('/orders/{order}/proof', [\App\Http\Controllers\Admin\AdminOrderController::class, 'proof'])->name('orders.proof');
    Route::post('/orders/{order}/approve', [\App\Http\Controllers\Admin\AdminOrderController::class, 'approve'])->name('orders.approve');
    Route::post('/orders/{order}/reject', [\App\Http\Controllers\Admin\AdminOrderController::class, 'reject'])->name('orders.reject');
    Route::post('/orders/{order}/reactivate', [\App\Http\Controllers\Admin\AdminOrderController::class, 'reactivate'])->name('orders.reactivate');

    Route::get('/settings', [\App\Http\Controllers\Admin\AdminSettingController::class, 'index'])->name('settings.index');
    Route::post('/settings', [\App\Http\Controllers\Admin\AdminSettingController::class, 'update'])->name('settings.update');
    Route::post('/settings/overrides', [\App\Http\Controllers\Admin\AdminSettingController::class, 'storeOverride'])->name('settings.overrides.store');
    Route::delete('/settings/overrides/{override}', [\App\Http\Controllers\Admin\AdminSettingController::class, 'destroyOverride'])->name('settings.overrides.destroy');
    Route::post('/settings/test-telegram', [\App\Http\Controllers\Admin\AdminSettingController::class, 'testTelegram'])->name('settings.test-telegram');
});

require __DIR__.'/settings.php';

