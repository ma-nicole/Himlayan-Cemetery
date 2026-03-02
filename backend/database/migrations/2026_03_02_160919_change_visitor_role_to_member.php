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
        // First, modify the ENUM to include 'member'
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'staff', 'visitor', 'member') DEFAULT 'member'");
        
        // Update all users with 'visitor' role to 'member'
        DB::table('users')
            ->where('role', 'visitor')
            ->update(['role' => 'member']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert 'member' role back to 'visitor'
        DB::table('users')
            ->where('role', 'member')
            ->update(['role' => 'visitor']);
        
        // Restore the original ENUM without 'member'
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'staff', 'visitor') DEFAULT 'visitor'");
    }
};
