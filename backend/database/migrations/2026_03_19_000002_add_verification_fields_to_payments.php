<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Stores admin sub-decision: null = normal, 'under_investigation' = flagged
            $table->string('verification_decision')->nullable()->after('verified_at');
            // Mandatory reason text for rejected / under_investigation decisions
            $table->text('admin_reason')->nullable()->after('verification_decision');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['verification_decision', 'admin_reason']);
        });
    }
};
