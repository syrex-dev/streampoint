<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ImageOptimizer
{
    public const TYPE_COVER = 'service_cover';
    public const TYPE_BANNER = 'banner';
    public const TYPE_LOGO = 'logo';
    public const TYPE_PAYMENT = 'payment_logo';

    protected array $config = [
        self::TYPE_COVER => [
            'max_width' => 800,
            'max_kb' => 2048,
            'directory' => 'covers',
            'quality' => 80,
            'label' => 'Sampul layanan',
        ],
        self::TYPE_BANNER => [
            'max_width' => 1200,
            'max_kb' => 2048,
            'directory' => 'banners',
            'quality' => 80,
            'label' => 'Gambar banner',
        ],
        self::TYPE_LOGO => [
            'max_width' => 256,
            'max_kb' => 1024,
            'directory' => 'logos',
            'quality' => 85,
            'label' => 'Logo',
        ],
        self::TYPE_PAYMENT => [
            'max_width' => 160,
            'max_kb' => 512,
            'directory' => 'payments',
            'quality' => 85,
            'label' => 'Logo metode pembayaran',
        ],
    ];

    /**
     * Optimasi dan simpan berkas gambar sesuai konfigurasi TECH_SPEC Bagian 15.
     * Mengembalikan jalur penyimpanan relatif pada disk 'public'.
     */
    public function optimize(UploadedFile $file, string $type, ?string $inputName = 'image'): string
    {
        if (! isset($this->config[$type])) {
            throw new \InvalidArgumentException("Tipe optimasi gambar tidak dikenal: {$type}");
        }

        $cfg = $this->config[$type];

        // 1. Validasi ukuran berkas
        $maxBytes = $cfg['max_kb'] * 1024;
        if ($file->getSize() > $maxBytes) {
            throw ValidationException::withMessages([
                $inputName => "Ukuran {$cfg['label']} tidak boleh melebihi " . ($cfg['max_kb'] >= 1024 ? ($cfg['max_kb'] / 1024) . ' MB' : $cfg['max_kb'] . ' KB') . '.',
            ]);
        }

        // 2. Tolak ekstensi SVG secara eksplisit
        $extension = strtolower($file->getClientOriginalExtension());
        if ($extension === 'svg' || str_contains(strtolower($file->getMimeType() ?: ''), 'svg')) {
            throw ValidationException::withMessages([
                $inputName => 'Format berkas SVG tidak diizinkan demi keamanan.',
            ]);
        }

        // 3. Validasi getimagesize (bukan hanya ekstensi berkas)
        $realPath = $file->getRealPath();
        $imageInfo = @getimagesize($realPath);
        if ($imageInfo === false || empty($imageInfo[0]) || empty($imageInfo[1])) {
            throw ValidationException::withMessages([
                $inputName => 'Berkas yang diunggah bukan format gambar yang valid.',
            ]);
        }

        $imageType = $imageInfo[2];
        $origWidth = $imageInfo[0];
        $origHeight = $imageInfo[1];

        $allowedTypes = [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP, IMAGETYPE_GIF];
        if (! in_array($imageType, $allowedTypes, true)) {
            throw ValidationException::withMessages([
                $inputName => 'Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.',
            ]);
        }

        $directory = $cfg['directory'];

        // 4. Fallback jika ekstensi GD atau fungsi imagewebp tidak tersedia
        if (! extension_loaded('gd') || ! function_exists('imagewebp')) {
            Log::warning("Ekstensi PHP GD atau imagewebp tidak tersedia. Menyimpan berkas {$type} asli.");
            $safeExtension = match ($imageType) {
                IMAGETYPE_JPEG => 'jpg',
                IMAGETYPE_PNG => 'png',
                IMAGETYPE_WEBP => 'webp',
                IMAGETYPE_GIF => 'gif',
                default => 'bin',
            };
            $randomName = Str::random(40) . '.' . $safeExtension;
            return $file->storeAs($directory, $randomName, 'public');
        }

        // 5. Muat resource gambar via GD sesuai tipe aslinya
        $sourceImage = match ($imageType) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($realPath),
            IMAGETYPE_PNG => @imagecreatefrompng($realPath),
            IMAGETYPE_WEBP => @imagecreatefromwebp($realPath),
            IMAGETYPE_GIF => @imagecreatefromgif($realPath),
            default => false,
        };

        if ($sourceImage === false) {
            Log::warning("Gagal memproses gambar {$type} dengan GD. Menyimpan berkas asli.");
            $randomName = Str::random(40) . '.' . ($extension ?: 'jpg');
            return $file->storeAs($directory, $randomName, 'public');
        }

        // 6. Hitung dimensi target: jangan memperbesar gambar kecil, jaga proporsi
        $maxWidth = $cfg['max_width'];
        if ($origWidth > $maxWidth) {
            $targetWidth = $maxWidth;
            $targetHeight = (int) max(1, round($origHeight * ($targetWidth / $origWidth)));
        } else {
            $targetWidth = $origWidth;
            $targetHeight = $origHeight;
        }

        // 7. Buat kanvas baru (menghilangkan EXIF/metadata secara alami)
        $canvas = imagecreatetruecolor($targetWidth, $targetHeight);

        // Pertahankan transparansi untuk PNG/WebP/GIF
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        $transparent = imagecolorallocatealpha($canvas, 255, 255, 255, 127);
        imagefilledrectangle($canvas, 0, 0, $targetWidth, $targetHeight, $transparent);

        imagecopyresampled(
            $canvas,
            $sourceImage,
            0,
            0,
            0,
            0,
            $targetWidth,
            $targetHeight,
            $origWidth,
            $origHeight
        );

        // 8. Simpan ke berkas sementara dalam format WebP
        $tempPath = tempnam(sys_get_temp_dir(), 'sp_webp_');
        $quality = $cfg['quality'];
        $saved = imagewebp($canvas, $tempPath, $quality);

        imagedestroy($canvas);
        imagedestroy($sourceImage);

        if (! $saved || ! file_exists($tempPath) || filesize($tempPath) === 0) {
            @unlink($tempPath);
            Log::warning("Gagal mengonversi ke WebP untuk {$type}. Menyimpan berkas asli.");
            $randomName = Str::random(40) . '.' . ($extension ?: 'jpg');
            return $file->storeAs($directory, $randomName, 'public');
        }

        // 9. Simpan ke disk public dengan nama acak berekstensi .webp
        $filename = Str::random(40) . '.webp';
        $storagePath = $directory . '/' . $filename;

        Storage::disk('public')->put($storagePath, file_get_contents($tempPath));
        @unlink($tempPath);

        return $storagePath;
    }

    public function optimizeCover(UploadedFile $file, string $inputName = 'cover'): string
    {
        return $this->optimize($file, self::TYPE_COVER, $inputName);
    }

    public function optimizeBanner(UploadedFile $file, string $inputName = 'image'): string
    {
        return $this->optimize($file, self::TYPE_BANNER, $inputName);
    }

    public function optimizeLogo(UploadedFile $file, string $inputName = 'logo'): string
    {
        return $this->optimize($file, self::TYPE_LOGO, $inputName);
    }

    public function optimizePaymentLogo(UploadedFile $file, string $inputName = 'logo'): string
    {
        return $this->optimize($file, self::TYPE_PAYMENT, $inputName);
    }
}
