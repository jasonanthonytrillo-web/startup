<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Drop any CHECK constraint on orders.status that prevents 'cancelled'.
     * Queries pg_constraint to find the actual constraint name(s).
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            // Dynamically find all check constraints on orders.status
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

            // Safety net: try the common default name
            DB::statement('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Intentionally left empty — the constraint is no longer needed
    }
};
