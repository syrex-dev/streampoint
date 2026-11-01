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
        ], [
            'max_daily_rent_quota.required' => 'Batas kuota sewa harian wajib diisi.',
            'max_daily_rent_quota.min' => 'Batas kuota sewa minimal 1.',
        ]);

        $setting = Setting::current();
        $setting->update($validated);

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
