<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exchange_rate_logs', function (Blueprint $table) {
            $table->decimal('change_percent', 8, 4)->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('exchange_rate_logs', function (Blueprint $table) {
            $table->dropColumn('change_percent');
        });
    }
};