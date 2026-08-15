<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('producer_commodities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producer_id')->constrained()->onDelete('cascade');
            $table->foreignId('commodity_id')->constrained()->onDelete('cascade');
            $table->decimal('price_per_kg', 12, 2);
            $table->decimal('capacity_per_day', 10, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producer_commodities');
    }
};