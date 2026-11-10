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
Route::post('/invoice/{invoiceCode}/cancel', [InvoiceController::class, 'cancel'])
    ->middleware('throttle:5,1')
    ->name('invoice.cancel');
Route::post('/invoice/{invoiceCode}/verify', [InvoiceController::class, 'verify'])
    ->middleware('throttle:5,1')
    ->name('invoice.verify');

Route::get('/cek-pesanan', [TrackingController::class, 'index'])->name('tracking.index');
Route::redirect('/track', '/cek-pesanan');
Route::redirect('/tracking', '/cek-pesanan');
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
    Route::post('/orders/{order}/replace-account', [\App\Http\Controllers\Admin\AdminOrderController::class, 'replaceAccount'])->name('orders.replace-account');
    Route::post('/orders/{order}/revoke', [\App\Http\Controllers\Admin\AdminOrderController::class, 'revoke'])->name('orders.revoke');

    // Products & Variants
    Route::resource('products', \App\Http\Controllers\Admin\AdminProductController::class);
    Route::post('/products/{product}/variants', [\App\Http\Controllers\Admin\AdminProductVariantController::class, 'store'])->name('products.variants.store');
    Route::put('/products/{product}/variants/{variant}', [\App\Http\Controllers\Admin\AdminProductVariantController::class, 'update'])->name('products.variants.update');
    Route::delete('/products/{product}/variants/{variant}', [\App\Http\Controllers\Admin\AdminProductVariantController::class, 'destroy'])->name('products.variants.destroy');

    // Account Stocks
    Route::get('/accounts', [\App\Http\Controllers\Admin\AdminAccountController::class, 'index'])->name('accounts.index');
    Route::post('/accounts', [\App\Http\Controllers\Admin\AdminAccountController::class, 'store'])->name('accounts.store');
    Route::post('/accounts/bulk', [\App\Http\Controllers\Admin\AdminAccountController::class, 'bulkStore'])->name('accounts.bulk-store');
    Route::patch('/accounts/{account}/status', [\App\Http\Controllers\Admin\AdminAccountController::class, 'updateStatus'])->name('accounts.update-status');
    Route::delete('/accounts/{account}', [\App\Http\Controllers\Admin\AdminAccountController::class, 'destroy'])->name('accounts.destroy');

    // Payment Methods
    Route::get('/payment-methods', [\App\Http\Controllers\Admin\AdminPaymentMethodController::class, 'index'])->name('payment-methods.index');
    Route::post('/payment-methods', [\App\Http\Controllers\Admin\AdminPaymentMethodController::class, 'store'])->name('payment-methods.store');
    Route::match(['put', 'patch', 'post'], '/payment-methods/{paymentMethod}', [\App\Http\Controllers\Admin\AdminPaymentMethodController::class, 'update'])->name('payment-methods.update');
    Route::delete('/payment-methods/{paymentMethod}', [\App\Http\Controllers\Admin\AdminPaymentMethodController::class, 'destroy'])->name('payment-methods.destroy');

    // Banners
    Route::resource('banners', \App\Http\Controllers\Admin\AdminBannerController::class);

    Route::get('/settings', [\App\Http\Controllers\Admin\AdminSettingController::class, 'index'])->name('settings.index');
    Route::post('/settings', [\App\Http\Controllers\Admin\AdminSettingController::class, 'update'])->name('settings.update');
    Route::post('/settings/overrides', [\App\Http\Controllers\Admin\AdminSettingController::class, 'storeOverride'])->name('settings.overrides.store');
    Route::delete('/settings/overrides/{override}', [\App\Http\Controllers\Admin\AdminSettingController::class, 'destroyOverride'])->name('settings.overrides.destroy');
    Route::post('/settings/test-telegram', [\App\Http\Controllers\Admin\AdminSettingController::class, 'testTelegram'])->name('settings.test-telegram');
    Route::post('/settings/detect-telegram-chat-id', [\App\Http\Controllers\Admin\AdminSettingController::class, 'detectTelegramChatId'])->name('settings.detect-telegram-chat-id');
});

require __DIR__.'/settings.php';

