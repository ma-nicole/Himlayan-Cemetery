<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE users MODIFY phone TEXT NULL');
        DB::statement('ALTER TABLE users MODIFY address TEXT NULL');

        DB::statement('ALTER TABLE burial_records MODIFY contact_phone TEXT NULL');
        DB::statement('ALTER TABLE burial_records MODIFY contact2_phone TEXT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE users MODIFY phone VARCHAR(255) NULL');
        DB::statement('ALTER TABLE users MODIFY address VARCHAR(255) NULL');

        DB::statement('ALTER TABLE burial_records MODIFY contact_phone VARCHAR(255) NULL');
        DB::statement('ALTER TABLE burial_records MODIFY contact2_phone VARCHAR(255) NULL');
    }
};
