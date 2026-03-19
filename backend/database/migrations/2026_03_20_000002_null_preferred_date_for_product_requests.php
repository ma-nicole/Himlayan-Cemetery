<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Clear the dummy preferred_date that was incorrectly stored for product requests.
        DB::table('service_requests')
            ->whereNotNull('product_type')
            ->update(['preferred_date' => null]);
    }

    public function down(): void
    {
        // No rollback — nulling the date is the correct state.
    }
};
