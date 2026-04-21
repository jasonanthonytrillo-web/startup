<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (\Illuminate\Support\Facades\DB::getDriverName() === 'mysql') {
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'preparing', 'serving', 'completed', 'cancelled') DEFAULT 'pending'");
        } else {
            // PostgreSQL syntax
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE orders ALTER COLUMN status TYPE VARCHAR(255)");
            \Illuminate\Support\Facades\DB::statement("ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            //
        });
    }
};
