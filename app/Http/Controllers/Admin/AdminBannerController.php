<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BannerStoreRequest;
use App\Http\Requests\Admin\BannerUpdateRequest;
use App\Models\Banner;
use App\Services\ImageOptimizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminBannerController extends Controller
{
    public function index(): Response
    {
        $banners = Banner::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (Banner $b) => [
                'id' => $b->id,
                'title' => $b->title,
                'subtitle' => $b->subtitle,
                'cta_label' => $b->cta_label,
                'cta_url' => $b->cta_url,
                'image_path' => $b->image_path,
                'tone' => $b->tone,
                'is_active' => (bool) $b->is_active,
                'sort_order' => (int) $b->sort_order,
                'starts_at' => $b->starts_at?->toIso8601String(),
                'ends_at' => $b->ends_at?->toIso8601String(),
                'is_scheduled' => $b->starts_at !== null || $b->ends_at !== null,
                'is_currently_running' => $b->is_active && ($b->starts_at === null || $b->starts_at <= now()) && ($b->ends_at === null || $b->ends_at >= now()),
            ]);

        $activeCount = Banner::where('is_active', true)->count();

        return Inertia::render('admin/banners/Index', [
            'banners' => $banners,
            'activeCount' => $activeCount,
            'maxActive' => 5,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/banners/Create');
    }

    public function store(BannerStoreRequest $request, ImageOptimizer $optimizer): RedirectResponse
    {
        $imagePath = null;
        if ($request->hasFile('image')) {
            $path = $optimizer->optimizeBanner($request->file('image'), 'image');
            $imagePath = '/storage/' . $path;
        }

        Banner::create([
            'title' => $request->validated('title'),
            'subtitle' => $request->validated('subtitle'),
            'cta_label' => $request->validated('cta_label'),
            'cta_url' => $request->validated('cta_url'),
            'tone' => $request->validated('tone'),
            'is_active' => (bool) $request->validated('is_active'),
            'sort_order' => (int) ($request->validated('sort_order') ?? 0),
            'starts_at' => $request->validated('starts_at'),
            'ends_at' => $request->validated('ends_at'),
            'image_path' => $imagePath,
        ]);

        return redirect()->route('admin.banners.index')->with('success', 'Banner berhasil ditambahkan.');
    }

    public function edit(Banner $banner): Response
    {
        return Inertia::render('admin/banners/Edit', [
            'banner' => [
                'id' => $banner->id,
                'title' => $banner->title,
                'subtitle' => $banner->subtitle,
                'cta_label' => $banner->cta_label,
                'cta_url' => $banner->cta_url,
                'image_path' => $banner->image_path,
                'tone' => $banner->tone,
                'is_active' => (bool) $banner->is_active,
                'sort_order' => (int) $banner->sort_order,
                'starts_at' => $banner->starts_at?->format('Y-m-d\TH:i'),
                'ends_at' => $banner->ends_at?->format('Y-m-d\TH:i'),
            ],
        ]);
    }

    public function update(BannerUpdateRequest $request, Banner $banner, ImageOptimizer $optimizer): RedirectResponse
    {
        $data = [
            'title' => $request->validated('title'),
            'subtitle' => $request->validated('subtitle'),
            'cta_label' => $request->validated('cta_label'),
            'cta_url' => $request->validated('cta_url'),
            'tone' => $request->validated('tone'),
            'is_active' => (bool) $request->validated('is_active'),
            'sort_order' => (int) ($request->validated('sort_order') ?? 0),
            'starts_at' => $request->validated('starts_at'),
            'ends_at' => $request->validated('ends_at'),
        ];

        if ($request->hasFile('image')) {
            if ($banner->image_path && Str::startsWith($banner->image_path, '/storage/')) {
                $oldPath = Str::after($banner->image_path, '/storage/');
                Storage::disk('public')->delete($oldPath);
            }
            $path = $optimizer->optimizeBanner($request->file('image'), 'image');
            $data['image_path'] = '/storage/' . $path;
        }

        $banner->update($data);

        return redirect()->route('admin.banners.index')->with('success', 'Banner berhasil diperbarui.');
    }

    public function destroy(Banner $banner): RedirectResponse
    {
        if ($banner->image_path && Str::startsWith($banner->image_path, '/storage/')) {
            $oldPath = Str::after($banner->image_path, '/storage/');
            Storage::disk('public')->delete($oldPath);
        }

        $banner->delete();

        return redirect()->route('admin.banners.index')->with('success', 'Banner berhasil dihapus.');
    }
}
