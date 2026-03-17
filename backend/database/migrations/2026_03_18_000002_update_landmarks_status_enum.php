<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE landmarks MODIFY COLUMN status ENUM('open','closed','n/a','under maintenance','available','unavailable') NOT NULL DEFAULT 'open'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE landmarks MODIFY COLUMN status ENUM('open','closed') NOT NULL DEFAULT 'open'");
    }
};
