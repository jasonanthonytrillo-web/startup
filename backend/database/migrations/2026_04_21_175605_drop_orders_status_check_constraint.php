<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            // Find and drop ALL check constraints on the orders.status column
            // PostgreSQL may name them differently depending on version/method used
            $constraints = DB::select("
                SELECT con.conname
                FROM pg_constraint con
                JOIN pg_class rel ON rel.oid = con.conrelid
                JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
                WHERE rel.relname = 'orders'
                  AND att.attname = 'status'
                  AND con.contype = 'c'
            ");

            foreach ($constraints as $constraint) {
                DB::statement("ALTER TABLE orders DROP CONSTRAINT \"{$constraint->conname}\";");
            }

            // Also try the common default name as a safety net
            DB::statement('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No down migration needed, we want it as a string
    }
};
