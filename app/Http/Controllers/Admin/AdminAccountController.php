<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AccountStatus;
use App\Enums\OrderType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AccountBulkStoreRequest;
use App\Http\Requests\Admin\AccountStoreRequest;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class AdminAccountController extends Controller
{
    /**
     * Self-healing: Ensure variant_id column exists on product_accounts table even if migration was not run yet.
     */
    protected function ensureVariantColumnExists(): void
    {
        try {
            if (! Schema::hasColumn('product_accounts', 'variant_id')) {
                Schema::table('product_accounts', function (\Illuminate\Database\Schema\Blueprint $table) {
                    $table->unsignedBigInteger('variant_id')->nullable()->after('product_id')->index();
                });
            }
        } catch (\Throwable $e) {
            Log::warning('Self-healing schema for product_accounts.variant_id skipped: ' . $e->getMessage());
        }
    }

    public function index(Request $request): Response
    {
        $this->ensureVariantColumnExists();

        try {
            $productId = $request->query('product_id');
            $variantId = $request->query('variant_id');
            $kind = $request->query('kind');
            $status = $request->query('status');

            $hasVariantCol = Schema::hasColumn('product_accounts', 'variant_id');
            $withRelations = ['product'];
            if ($hasVariantCol) {
                $withRelations[] = 'variant';
            }

            $query = ProductAccount::with($withRelations)->latest('id');

            if ($productId) {
                $query->where('product_id', $productId);
            }
            if ($hasVariantCol && $variantId) {
                $query->where('variant_id', $variantId);
            }
            if ($kind) {
                $query->where('kind', $kind);
            }
            if ($status) {
                $query->where('status', $status);
            }

            $accounts = $query->paginate(25)->withQueryString()->through(fn (ProductAccount $acc) => [
                'id' => $acc->id,
                'product_id' => $acc->product_id,
                'product_name' => $acc->product?->name ?? '-',
                'variant_id' => $hasVariantCol ? $acc->variant_id : null,
                'variant_name' => ($hasVariantCol && $acc->variant) ? ($acc->variant->name ?? 'Semua Varian') : 'Semua Varian',
                'kind' => $acc->kind instanceof OrderType ? $acc->kind->value : (string) ($acc->kind ?? 'RENT'),
                'credential' => (string) ($acc->credential ?? ''),
                'status' => $acc->status instanceof AccountStatus ? $acc->status->value : (string) ($acc->status ?? 'AVAILABLE'),
                'status_label' => $acc->status instanceof AccountStatus ? $acc->status->label() : (string) ($acc->status ?? 'AVAILABLE'),
                'order_id' => $acc->order_id,
                'rented_until' => $acc->rented_until?->toIso8601String(),
                'note' => $acc->note,
                'created_at' => $acc->created_at?->toIso8601String(),
                'can_edit_status' => in_array($acc->status, [AccountStatus::AVAILABLE, AccountStatus::DISABLED], true),
                'can_delete' => in_array($acc->status, [AccountStatus::AVAILABLE, AccountStatus::DISABLED], true) && empty($acc->order_id),
            ]);

            // Stock summary per product (AVAILABLE per kind)
            $summary = Product::orderBy('sort_order')
                ->withCount([
                    'accounts as available_rent' => fn ($q) => $q
                        ->where('kind', OrderType::RENT)
                        ->where('status', AccountStatus::AVAILABLE),
                    'accounts as available_buy' => fn ($q) => $q
                        ->where('kind', OrderType::BUY)
                        ->where('status', AccountStatus::AVAILABLE),
                ])
                ->get()
                ->map(fn (Product $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'available_rent' => (int) $p->available_rent,
                    'available_buy' => (int) $p->available_buy,
                ]);

            $products = Product::with(['variants' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')])
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'variants' => $p->variants->map(fn ($v) => [
                        'id' => $v->id,
                        'name' => $v->name,
                        'type' => $v->type instanceof OrderType ? $v->type->value : (string) ($v->type ?? 'RENT'),
                    ]),
                ]);

            return Inertia::render('admin/accounts/Index', [
                'accounts' => $accounts,
                'summary' => $summary,
                'products' => $products,
                'filters' => [
                    'product_id' => $productId ? (int) $productId : '',
                    'variant_id' => $variantId ? (int) $variantId : '',
                    'kind' => $kind ?? '',
                    'status' => $status ?? '',
                ],
                'statuses' => collect(AccountStatus::cases())->map(fn ($s) => [
                    'value' => $s->value,
                    'label' => $s->label(),
                ]),
            ]);
        } catch (\Throwable $e) {
            Log::error('AdminAccountController@index failed: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            return Inertia::render('admin/accounts/Index', [
                'accounts' => [
                    'data' => [],
                    'links' => [],
                    'current_page' => 1,
                    'last_page' => 1,
                    'total' => 0,
                ],
                'summary' => [],
                'products' => [],
                'filters' => [
                    'product_id' => '',
                    'variant_id' => '',
                    'kind' => '',
                    'status' => '',
                ],
                'statuses' => collect(AccountStatus::cases())->map(fn ($s) => [
                    'value' => $s->value,
                    'label' => $s->label(),
                ]),
                'error_message' => 'Terjadi kendala saat memuat data: ' . $e->getMessage(),
            ]);
        }
    }

    public function store(AccountStoreRequest $request): RedirectResponse
    {
        $this->ensureVariantColumnExists();
        try {
            $email = trim($request->validated('email'));
            $password = trim($request->validated('password'));
            $profile = $request->filled('profile') ? trim($request->validated('profile')) : '';
            $pin = $request->filled('pin') ? trim($request->validated('pin')) : '';

            $credentialParts = [$email, $password];
            if (! empty($profile) || ! empty($pin)) {
                $credentialParts[] = $profile;
            }
            if (! empty($pin)) {
                $credentialParts[] = $pin;
            }

            $credential = implode('|', $credentialParts);

            $data = [
                'product_id' => (int) $request->validated('product_id'),
                'kind' => OrderType::from($request->validated('kind')),
                'credential' => $credential,
                'status' => AccountStatus::AVAILABLE,
                'note' => $request->validated('note'),
            ];

            if (Schema::hasColumn('product_accounts', 'variant_id')) {
                $data['variant_id'] = $request->filled('variant_id') ? (int) $request->validated('variant_id') : null;
            }

            ProductAccount::create($data);

            return back()->with('success', 'Unit akun berhasil ditambahkan ke stok.');
        } catch (\Throwable $e) {
            Log::error('AdminAccountController@store failed: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            return back()->withErrors([
                'general' => 'Gagal menyimpan unit akun: ' . $e->getMessage(),
            ]);
        }
    }

    public function bulkStore(AccountBulkStoreRequest $request): RedirectResponse
    {
        $this->ensureVariantColumnExists();

        try {
            $productId = (int) $request->validated('product_id');
            $hasVariantCol = Schema::hasColumn('product_accounts', 'variant_id');
            $variantId = $request->filled('variant_id') ? (int) $request->validated('variant_id') : null;
            $kind = OrderType::from($request->validated('kind'));
            $lines = preg_split('/\r\n|\r|\n/', trim($request->validated('items_text')));

            $successCount = 0;
            $invalidLines = [];

            foreach ($lines as $index => $line) {
                $lineNumber = $index + 1;
                $trimmed = trim($line);

                if (empty($trimmed)) {
                    $invalidLines[] = $lineNumber;
                    continue;
                }

                $parts = explode('|', $trimmed);
                if (count($parts) < 2) {
                    $invalidLines[] = $lineNumber;
                    continue;
                }

                $email = trim($parts[0]);
                $password = trim($parts[1]);

                if (empty($email) || ! filter_var($email, FILTER_VALIDATE_EMAIL) || empty($password)) {
                    $invalidLines[] = $lineNumber;
                    continue;
                }

                $profile = isset($parts[2]) ? trim($parts[2]) : '';
                $pin = isset($parts[3]) ? trim($parts[3]) : '';

                $credentialParts = [$email, $password];
                if (! empty($profile) || ! empty($pin)) {
                    $credentialParts[] = $profile;
                }
                if (! empty($pin)) {
                    $credentialParts[] = $pin;
                }
                $credential = implode('|', $credentialParts);

                $data = [
                    'product_id' => $productId,
                    'kind' => $kind,
                    'credential' => $credential,
                    'status' => AccountStatus::AVAILABLE,
                ];

                if ($hasVariantCol) {
                    $data['variant_id'] = $variantId;
                }

                ProductAccount::create($data);

                $successCount++;
            }

            if ($successCount === 0) {
                return back()->withErrors([
                    'items_text' => 'Tidak ada baris valid yang berhasil diimpor. Baris tidak valid: ' . implode(', ', $invalidLines),
                ]);
            }

            $message = "Berhasil mengimpor {$successCount} unit akun.";
            if (! empty($invalidLines)) {
                $message .= ' Baris tidak valid dilewati: nomor ' . implode(', ', $invalidLines) . '.';
            }

            return back()->with('success', $message);
        } catch (\Throwable $e) {
            Log::error('AdminAccountController@bulkStore failed: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            return back()->withErrors([
                'general' => 'Gagal mengimpor unit akun: ' . $e->getMessage(),
            ]);
        }
    }

    public function updateStatus(Request $request, ProductAccount $account): RedirectResponse
    {
        $targetStatus = $request->input('status');

        if (in_array($account->status, [AccountStatus::RESERVED, AccountStatus::SOLD, AccountStatus::RENTED], true)) {
            return back()->withErrors([
                'action' => 'Status unit yang sedang dipesan, disewa, atau terjual tidak dapat diubah secara manual.',
            ]);
        }

        if (! in_array($targetStatus, [AccountStatus::AVAILABLE->value, AccountStatus::DISABLED->value], true)) {
            return back()->withErrors([
                'action' => 'Status unit hanya dapat diubah antara Tersedia (AVAILABLE) dan Dinonaktifkan (DISABLED).',
            ]);
        }

        $account->update([
            'status' => AccountStatus::from($targetStatus),
        ]);

        return back()->with('success', "Status unit #{$account->id} berhasil diubah.");
    }

    public function destroy(ProductAccount $account): RedirectResponse
    {
        if (
            in_array($account->status, [AccountStatus::RESERVED, AccountStatus::SOLD, AccountStatus::RENTED], true)
            || ! empty($account->order_id)
            || Order::where('account_id', $account->id)->exists()
        ) {
            return back()->withErrors([
                'action' => 'Unit akun yang memiliki riwayat pesanan atau sedang digunakan tidak dapat dihapus.',
            ]);
        }

        $unitId = $account->id;
        $account->delete();

        return back()->with('success', "Unit akun #{$unitId} berhasil dihapus.");
    }
}
