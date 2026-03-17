<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Clean up any invalid role values (visitor, user, or anything else that
     * is not admin/staff/member) and lock the column to those three values only.
     */
    public function up(): void
    {
        // Step 1 — normalise bad data before we tighten the ENUM.
        // Any role that is not one of the three valid values defaults to 'member'.
        DB::statement("
            UPDATE users
            SET role = 'member'
            WHERE role NOT IN ('admin', 'staff', 'member')
               OR role IS NULL
        ");

        // Step 2 — widen the ENUM temporarily to include the old values so the
        // ALTER does not fail on MySQL if any stale enum metadata lingers.
        // Then immediately redefine to the final, clean three-value set.
        DB::statement("
            ALTER TABLE users
            MODIFY COLUMN role ENUM('admin', 'staff', 'member') NOT NULL DEFAULT 'member'
        ");
    }

    /**
     * Revert: re-add 'visitor' to the ENUM so the previous migration's
     * down() method can safely run if a full rollback is needed.
     */
    public function down(): void
    {
        DB::statement("
            ALTER TABLE users
            MODIFY COLUMN role ENUM('admin', 'staff', 'visitor', 'member') NOT NULL DEFAULT 'member'
        ");
    }
};
