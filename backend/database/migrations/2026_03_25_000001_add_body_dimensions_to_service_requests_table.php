<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->decimal('body_weight', 6, 1)->nullable()->after('contact_number');
            $table->decimal('body_height', 6, 1)->nullable()->after('body_weight');
            $table->decimal('body_width', 6, 1)->nullable()->after('body_height');
        });
    }

    public function down(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->dropColumn(['body_weight', 'body_height', 'body_width']);
        });
    }
};
