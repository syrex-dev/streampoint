<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            if (! Schema::hasColumn('settings', 'store_logo_dark_path')) {
                $table->string('store_logo_dark_path')->nullable()->after('store_logo_path');
            }
            if (! Schema::hasColumn('settings', 'store_favicon_path')) {
                $table->string('store_favicon_path')->nullable()->after('store_logo_dark_path');
            }
            if (! Schema::hasColumn('settings', 'navbar_brand_format')) {
                $table->string('navbar_brand_format', 20)->default('logo_only')->after('store_favicon_path');
            }
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $cols = [];
            if (Schema::hasColumn('settings', 'store_logo_dark_path')) {
                $cols[] = 'store_logo_dark_path';
            }
            if (Schema::hasColumn('settings', 'store_favicon_path')) {
                $cols[] = 'store_favicon_path';
            }
            if (Schema::hasColumn('settings', 'navbar_brand_format')) {
                $cols[] = 'navbar_brand_format';
            }
            if (! empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
