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

        $telegramConfigured = ! empty(config('notify.telegram.bot_token'))
            && ! empty(config('notify.telegram.chat_id'));

        return Inertia::render('admin/Settings', [
            'settings' => [
                'max_daily_rent_quota' => $setting->max_daily_rent_quota,
                'admin_whatsapp' => $setting->admin_whatsapp,
                'business_hours' => $setting->business_hours,
                'store_name' => $setting->store_name,
                'store_logo_path' => $setting->store_logo_path,
                'accent_preset' => $setting->accent_preset ?? 'emerald',
            ],
            'overrides' => $overrides,
            'telegramConfigured' => $telegramConfigured,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'max_daily_rent_quota' => ['required', 'integer', 'min:1', 'max:100'],
            'admin_whatsapp' => ['nullable', 'string', 'max:20'],
            'business_hours' => ['nullable', 'string', 'max:100'],
            'store_name' => ['nullable', 'string', 'max:100'],
            'accent_preset' => ['required', 'string', \Illuminate\Validation\Rule::in(['emerald', 'teal', 'blue', 'mono'])],
            'store_logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:1024'],
            'remove_logo' => ['nullable', 'boolean'],
        ], [
            'max_daily_rent_quota.required' => 'Batas kuota sewa harian wajib diisi.',
            'max_daily_rent_quota.min' => 'Batas kuota sewa minimal 1.',
            'accent_preset.required' => 'Preset warna aksen wajib dipilih.',
            'accent_preset.in' => 'Preset aksen tidak valid. Pilihan: emerald, teal, blue, mono.',
            'store_logo.image' => 'File logo toko harus berupa gambar.',
            'store_logo.mimes' => 'Format logo toko yang didukung: JPG, PNG, WEBP (SVG tidak diizinkan).',
            'store_logo.max' => 'Ukuran file logo toko maksimal 1MB.',
        ]);

        $setting = Setting::current();

        $updateData = [
            'max_daily_rent_quota' => $validated['max_daily_rent_quota'],
            'admin_whatsapp' => $validated['admin_whatsapp'] ?? null,
            'business_hours' => $validated['business_hours'] ?? null,
            'store_name' => $validated['store_name'] ?? null,
            'accent_preset' => $validated['accent_preset'],
        ];

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
            $path = $request->file('store_logo')->store('store', 'public');
            $updateData['store_logo_path'] = '/storage/' . $path;
        }

        $setting->update($updateData);

        return back()->with('success', 'Pengaturan berhasil diperbarui.');
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

    public function testTelegram(TelegramChannel $telegramChannel): RedirectResponse
    {
        $token = config('notify.telegram.bot_token');
        $chatId = config('notify.telegram.chat_id');

        if (empty($token) || empty($chatId)) {
            return back()->withErrors([
                'telegram' => 'TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID belum diatur pada file .env.',
            ]);
        }

        try {
            $telegramChannel->send("🔔 <b>Tes Notifikasi StreamPoint</b>\nNotifikasi bot Telegram berhasil terhubung dan siap digunakan!");
            return back()->with('success', 'Tes notifikasi Telegram berhasil dikirim ke bot.');
        } catch (Throwable $e) {
            return back()->withErrors([
                'telegram' => 'Gagal mengirim notifikasi: ' . $e->getMessage(),
            ]);
        }
    }
}
