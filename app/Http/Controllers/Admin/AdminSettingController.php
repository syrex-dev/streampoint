<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DailyQuotaOverride;
use App\Models\Setting;
use App\Services\Notification\TelegramChannel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AdminSettingController extends Controller
{
    public function index(): Response
    {
        $setting = Setting::current();
        $overrides = DailyQuotaOverride::orderByDesc('date')->get();

        $hasDbToken = ! empty($setting->telegram_bot_token);
        $hasEnvToken = ! empty(config('notify.telegram.bot_token'));
        $hasToken = $hasDbToken || $hasEnvToken;

        $rawToken = $setting->telegram_bot_token ?: config('notify.telegram.bot_token');
        $tokenMasked = '';
        if ($rawToken) {
            $len = strlen($rawToken);
            if ($len > 10) {
                $tokenMasked = substr($rawToken, 0, 5) . str_repeat('•', max(10, $len - 9)) . substr($rawToken, -4);
            } else {
                $tokenMasked = str_repeat('•', 16);
            }
        }

        $chatId = $setting->telegram_chat_id ?? (config('notify.telegram.chat_id') ?: '');
        $telegramConfigured = $hasToken && ! empty($chatId);

        return Inertia::render('admin/Settings', [
            'settings' => [
                'max_daily_rent_quota' => $setting->max_daily_rent_quota,
                'admin_whatsapp' => $setting->admin_whatsapp,
                'business_hours' => $setting->business_hours,
                'store_name' => $setting->store_name,
                'store_logo_path' => $setting->store_logo_path,
                'accent_preset' => $setting->accent_preset ?? 'emerald',
                'announcement_text' => $setting->announcement_text,
                'announcement_url' => $setting->announcement_url,
                'announcement_active' => (bool) $setting->announcement_active,
                'store_tagline' => $setting->store_tagline,
                'delivery_eta' => $setting->delivery_eta,
                'min_sold_display' => $setting->min_sold_display ?? 5,
                'stats_min_orders' => (int) ($setting->stats_min_orders ?? 20),
                'custom_request_enabled' => (bool) $setting->custom_request_enabled,
                'social_links' => $setting->social_links ?? [
                    'telegram' => '',
                    'instagram' => '',
                    'threads' => '',
                    'tiktok' => '',
                ],
                'telegram_active' => (bool) $setting->telegram_active,
                'telegram_has_token' => $hasToken,
                'telegram_token_masked' => $tokenMasked,
                'telegram_chat_id' => $chatId,
            ],
            'overrides' => $overrides,
            'telegramConfigured' => $telegramConfigured,
        ]);
    }

    public function update(Request $request, \App\Services\ImageOptimizer $optimizer): RedirectResponse
    {
        $validated = $request->validate([
            'max_daily_rent_quota' => ['required', 'integer', 'min:1', 'max:100'],
            'admin_whatsapp' => ['nullable', 'string', 'max:20'],
            'business_hours' => ['nullable', 'string', 'max:100'],
            'store_name' => ['nullable', 'string', 'max:100'],
            'accent_preset' => ['required', 'string', \Illuminate\Validation\Rule::in(['emerald', 'teal', 'blue', 'mono'])],
            'store_logo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:1024'],
            'remove_logo' => ['nullable', 'boolean'],
            'announcement_text' => ['nullable', 'string', 'max:160'],
            'announcement_url' => [
                'nullable',
                'string',
                'max:255',
                function ($attribute, $value, $fail) {
                    if (empty($value)) return;
                    if (str_starts_with($value, '/')) return;
                    if (str_starts_with($value, 'https://') && parse_url($value, PHP_URL_HOST)) return;
                    $fail('Tautan pengumuman harus berupa path internal (diawali /) atau URL https://.');
                },
            ],
            'announcement_active' => ['nullable', 'boolean'],
            'store_tagline' => ['nullable', 'string', 'max:60'],
            'delivery_eta' => ['nullable', 'string', 'max:60'],
            'min_sold_display' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:1000'],
            'stats_min_orders' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:1000'],
            'custom_request_enabled' => ['nullable', 'boolean'],
            'social_links' => ['nullable', 'array'],
            'social_links.telegram' => ['nullable', 'string', 'max:255', fn ($a, $v, $f) => $this->validateSocialUrl($v, 'telegram', $f)],
            'social_links.instagram' => ['nullable', 'string', 'max:255', fn ($a, $v, $f) => $this->validateSocialUrl($v, 'instagram', $f)],
            'social_links.threads' => ['nullable', 'string', 'max:255', fn ($a, $v, $f) => $this->validateSocialUrl($v, 'threads', $f)],
            'social_links.tiktok' => ['nullable', 'string', 'max:255', fn ($a, $v, $f) => $this->validateSocialUrl($v, 'tiktok', $f)],
            'telegram_active' => ['nullable', 'boolean'],
            'telegram_bot_token' => ['nullable', 'string', 'max:255'],
            'telegram_chat_id' => ['nullable', 'string', 'max:1000'],
        ], [
            'max_daily_rent_quota.required' => 'Batas kuota sewa harian wajib diisi.',
            'max_daily_rent_quota.min' => 'Batas kuota sewa minimal 1.',
            'accent_preset.required' => 'Preset warna aksen wajib dipilih.',
            'accent_preset.in' => 'Preset aksen tidak valid. Pilihan: emerald, teal, blue, mono.',
            'store_logo.mimes' => 'Format logo toko yang didukung: JPG, PNG, WEBP (SVG tidak diizinkan).',
            'store_logo.max' => 'Ukuran file logo toko maksimal 1MB.',
        ]);

        $setting = Setting::current();

        $socialLinks = [
            'telegram' => ! empty($validated['social_links']['telegram']) ? trim($validated['social_links']['telegram']) : null,
            'instagram' => ! empty($validated['social_links']['instagram']) ? trim($validated['social_links']['instagram']) : null,
            'threads' => ! empty($validated['social_links']['threads']) ? trim($validated['social_links']['threads']) : null,
            'tiktok' => ! empty($validated['social_links']['tiktok']) ? trim($validated['social_links']['tiktok']) : null,
        ];

        $updateData = [
            'max_daily_rent_quota' => $validated['max_daily_rent_quota'],
            'admin_whatsapp' => $validated['admin_whatsapp'] ?? null,
            'business_hours' => $validated['business_hours'] ?? null,
            'store_name' => $validated['store_name'] ?? null,
            'accent_preset' => $validated['accent_preset'],
            'announcement_text' => $validated['announcement_text'] ?? null,
            'announcement_url' => $validated['announcement_url'] ?? null,
            'announcement_active' => (bool) ($validated['announcement_active'] ?? false),
            'store_tagline' => $validated['store_tagline'] ?? null,
            'delivery_eta' => $validated['delivery_eta'] ?? null,
            'min_sold_display' => (int) ($validated['min_sold_display'] ?? $setting->min_sold_display ?? 5),
            'stats_min_orders' => (int) ($validated['stats_min_orders'] ?? $setting->stats_min_orders ?? 20),
            'custom_request_enabled' => (bool) ($validated['custom_request_enabled'] ?? false),
            'social_links' => $socialLinks,
            'telegram_active' => (bool) ($validated['telegram_active'] ?? false),
            'telegram_chat_id' => ! empty($validated['telegram_chat_id']) ? trim($validated['telegram_chat_id']) : null,
        ];

        if (! empty($validated['telegram_bot_token']) && ! str_contains($validated['telegram_bot_token'], '•')) {
            $updateData['telegram_bot_token'] = trim($validated['telegram_bot_token']);
        }

        if ($request->boolean('remove_logo')) {
            if ($setting->store_logo_path && \Illuminate\Support\Str::startsWith($setting->store_logo_path, '/storage/')) {
                $oldPath = \Illuminate\Support\Str::after($setting->store_logo_path, '/storage/');
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
            }
            $updateData['store_logo_path'] = null;
        } elseif ($request->hasFile('store_logo')) {
            if ($setting->store_logo_path && \Illuminate\Support\Str::startsWith($setting->store_logo_path, '/storage/')) {
                $oldPath = \Illuminate\Support\Str::after($setting->store_logo_path, '/storage/');
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
            }
            $path = $optimizer->optimizeLogo($request->file('store_logo'), 'store_logo');
            $updateData['store_logo_path'] = '/storage/' . $path;
        }

        $setting->update($updateData);
        Setting::clearCurrentInstance();

        return back()->with('success', 'Pengaturan berhasil diperbarui.');
    }

    protected function validateSocialUrl(?string $url, string $platform, callable $fail): void
    {
        if (empty($url)) {
            return;
        }

        if (! str_starts_with($url, 'https://')) {
            $fail("Tautan {$platform} wajib diawali dengan https:// (protokol tidak aman atau skrip ditolak).");
            return;
        }

        $host = strtolower(parse_url($url, PHP_URL_HOST) ?? '');
        if (str_starts_with($host, 'www.')) {
            $host = substr($host, 4);
        }

        $allowedHosts = match ($platform) {
            'telegram' => ['t.me', 'telegram.me'],
            'instagram' => ['instagram.com'],
            'threads' => ['threads.net', 'threads.com'],
            'tiktok' => ['tiktok.com'],
            default => [],
        };

        if (! in_array($host, $allowedHosts, true)) {
            $fail("Domain tautan {$platform} ('{$host}') tidak diizinkan. Gunakan domain resmi platform.");
        }
    }

    public function storeOverride(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'max_quota' => ['required', 'integer', 'min:0', 'max:100'],
            'note' => ['nullable', 'string', 'max:255'],
        ], [
            'date.required' => 'Tanggal override wajib diisi.',
            'date.date_format' => 'Format tanggal harus YYYY-MM-DD.',
            'max_quota.required' => 'Batas kuota wajib diisi (0 untuk menutup sewa).',
            'max_quota.min' => 'Kuota minimal 0.',
        ]);

        DailyQuotaOverride::updateOrCreate(
            ['date' => $validated['date']],
            [
                'max_quota' => $validated['max_quota'],
                'note' => $validated['note'] ?? null,
            ]
        );

        return back()->with('success', 'Override kuota harian berhasil disimpan.');
    }

    public function destroyOverride(DailyQuotaOverride $override): RedirectResponse
    {
        $override->delete();

        return back()->with('success', 'Override kuota berhasil dihapus.');
    }

    public function testTelegram(Request $request, TelegramChannel $telegramChannel)
    {
        $setting = Setting::current();

        $inputToken = $request->input('bot_token');
        $inputChatId = $request->input('chat_id');

        $token = (! empty($inputToken) && ! str_contains($inputToken, '•'))
            ? trim($inputToken)
            : ($setting->telegram_bot_token ?: config('notify.telegram.bot_token'));

        $chatIdRaw = ! empty($inputChatId)
            ? trim($inputChatId)
            : ($setting->telegram_chat_id ?: config('notify.telegram.chat_id'));

        if (empty($token) || empty($chatIdRaw)) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token Bot dan Chat ID Telegram wajib diisi sebelum mengirim pesan tes.',
                ], 422);
            }
            return back()->withErrors([
                'telegram' => 'Token Bot dan Chat ID Telegram wajib diisi sebelum mengirim pesan tes.',
            ]);
        }

        $chatIds = array_filter(array_map('trim', preg_split('/[\r\n,]+/', (string) $chatIdRaw)));
        if (empty($chatIds)) {
            $chatIds = [trim((string) $chatIdRaw)];
        }

        $testMsg = "🔔 <b>Tes Notifikasi StreamPoint</b>\nNotifikasi bot Telegram berhasil terhubung dan siap digunakan!";

        $failedCount = 0;
        $lastError = '';

        foreach ($chatIds as $cid) {
            try {
                $res = \Illuminate\Support\Facades\Http::timeout(8)->post("https://api.telegram.org/bot{$token}/sendMessage", [
                    'chat_id' => $cid,
                    'text' => $testMsg,
                    'parse_mode' => 'HTML',
                ]);

                if (! $res->successful()) {
                    $failedCount++;
                    $lastError = $res->json('description', 'HTTP ' . $res->status());
                }
            } catch (Throwable $e) {
                $failedCount++;
                $lastError = $e->getMessage();
            }
        }

        if ($failedCount >= count($chatIds)) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal mengirim pesan tes ke Telegram: ' . $lastError,
                ], 400);
            }
            return back()->withErrors([
                'telegram' => 'Gagal mengirim pesan tes ke Telegram: ' . $lastError,
            ]);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Tes notifikasi Telegram berhasil dikirim ke bot!',
            ]);
        }

        return back()->with('success', 'Tes notifikasi Telegram berhasil dikirim ke bot.');
    }

    public function detectTelegramChatId(Request $request): \Illuminate\Http\JsonResponse
    {
        $setting = Setting::current();

        $inputToken = $request->input('bot_token');
        $token = (! empty($inputToken) && ! str_contains($inputToken, '•'))
            ? trim($inputToken)
            : ($setting->telegram_bot_token ?: config('notify.telegram.bot_token'));

        if (empty($token)) {
            return response()->json([
                'success' => false,
                'message' => 'Token Bot Telegram belum diisi. Masukkan token bot dari @BotFather terlebih dahulu.',
                'chats' => [],
            ], 422);
        }

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(10)->get("https://api.telegram.org/bot{$token}/getUpdates");

            if (! $response->successful()) {
                $desc = $response->json('description', 'Gagal menghubungi server Telegram.');
                return response()->json([
                    'success' => false,
                    'message' => 'Telegram API Error: ' . $desc,
                    'chats' => [],
                ], 400);
            }

            $updates = $response->json('result', []);
            $detectedChats = [];

            foreach ($updates as $update) {
                $chat = $update['message']['chat']
                    ?? $update['my_chat_member']['chat']
                    ?? $update['channel_post']['chat']
                    ?? null;

                if ($chat && isset($chat['id'])) {
                    $chatId = (string) $chat['id'];
                    $title = $chat['title'] ?? null;
                    $firstName = $chat['first_name'] ?? '';
                    $lastName = $chat['last_name'] ?? '';
                    $fullName = trim("{$firstName} {$lastName}");
                    $name = $title ?: ($fullName ?: 'Pengguna Telegram');
                    $username = isset($chat['username']) ? '@' . $chat['username'] : null;
                    $type = $chat['type'] ?? 'private';

                    $detectedChats[$chatId] = [
                        'id' => $chatId,
                        'name' => $name,
                        'username' => $username,
                        'type' => $type,
                    ];
                }
            }

            if (empty($detectedChats)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak ditemukan obrolan baru. Pastikan Anda sudah membuka bot di Telegram dan menekan tombol Start (/start) atau menambahkan bot ke grup, lalu coba lagi.',
                    'chats' => [],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Berhasil mendeteksi obrolan Telegram.',
                'chats' => array_values($detectedChats),
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan koneksi ke Telegram: ' . $e->getMessage(),
                'chats' => [],
            ], 500);
        }
    }
}
