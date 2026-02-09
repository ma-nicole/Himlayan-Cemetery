<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('invitation_sent_at')->nullable()->after('remember_token');
            $table->timestamp('invitation_expires_at')->nullable()->after('invitation_sent_at');
            $table->string('invitation_token')->nullable()->unique()->after('invitation_expires_at');
            $table->boolean('invitation_accepted')->default(false)->after('invitation_token');
            $table->boolean('must_change_password')->default(false)->after('invitation_accepted');
            $table->timestamp('last_password_change')->nullable()->after('must_change_password');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'invitation_sent_at',
                'invitation_expires_at',
                'invitation_token',
                'invitation_accepted',
                'must_change_password',
                'last_password_change'
            ]);
        });
    }
};
