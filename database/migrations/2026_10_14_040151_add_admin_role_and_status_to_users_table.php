<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // enum diganti string supaya peran baru (admin) bisa dipakai
        DB::statement("ALTER TABLE users MODIFY role VARCHAR(20) NOT NULL DEFAULT 'umkm'");

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('phone');
            $table->foreignId('created_by')->nullable()->after('is_active')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
            $table->dropColumn('is_active');
        });

        DB::statement("ALTER TABLE users MODIFY role ENUM('produsen','kud','umkm') NOT NULL DEFAULT 'umkm'");
    }
};