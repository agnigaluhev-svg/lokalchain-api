<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('producers', function (Blueprint $table) {
            $table->string('producer_type')->nullable()->after('name');
            $table->boolean('is_validated')->default(true)->after('producer_type');
        });

        Schema::table('producer_commodities', function (Blueprint $table) {
            $table->string('product_label')->nullable()->after('commodity_id');
        });

        Schema::table('commodities', function (Blueprint $table) {
            $table->decimal('import_price_reference', 12, 2)->nullable()->after('unit');
        });
    }

    public function down(): void
    {
        Schema::table('producers', function (Blueprint $table) {
            $table->dropColumn(['producer_type', 'is_validated']);
        });

        Schema::table('producer_commodities', function (Blueprint $table) {
            $table->dropColumn('product_label');
        });

        Schema::table('commodities', function (Blueprint $table) {
            $table->dropColumn('import_price_reference');
        });
    }
};