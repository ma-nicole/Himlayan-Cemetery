<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE service_requests MODIFY COLUMN status ENUM('pending','approved','rejected','completed','cancelled') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE service_requests MODIFY COLUMN status ENUM('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending'");
    }
};
