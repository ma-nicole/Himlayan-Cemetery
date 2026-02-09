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
        Schema::table('burial_records', function (Blueprint $table) {
            // Deceased detailed information
            $table->string('deceased_first_name')->nullable()->after('deceased_name');
            $table->string('deceased_middle_initial', 2)->nullable()->after('deceased_first_name');
            $table->string('deceased_last_name')->nullable()->after('deceased_middle_initial');
            $table->string('deceased_nickname')->nullable()->after('deceased_last_name');
            $table->string('deceased_photo_url')->nullable()->after('deceased_nickname');
            $table->string('deceased_gender')->nullable()->after('deceased_photo_url');
            $table->boolean('is_publicly_searchable')->default(true)->after('deceased_gender');
            
            // Primary contact detailed information
            $table->string('contact_first_name')->nullable()->after('contact_name');
            $table->string('contact_middle_initial', 2)->nullable()->after('contact_first_name');
            $table->string('contact_last_name')->nullable()->after('contact_middle_initial');
            $table->string('contact_country_code', 10)->default('+63')->after('contact_last_name');
            
            // Secondary contact information
            $table->string('contact2_first_name')->nullable()->after('contact_email');
            $table->string('contact2_middle_initial', 2)->nullable()->after('contact2_first_name');
            $table->string('contact2_last_name')->nullable()->after('contact2_middle_initial');
            $table->string('contact2_country_code', 10)->default('+63')->after('contact2_last_name');
            $table->string('contact2_phone')->nullable()->after('contact2_country_code');
            $table->string('contact2_email')->nullable()->after('contact2_phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('burial_records', function (Blueprint $table) {
            $table->dropColumn([
                'deceased_first_name',
                'deceased_middle_initial',
                'deceased_last_name',
                'deceased_nickname',
                'deceased_photo_url',
                'deceased_gender',
                'is_publicly_searchable',
                'contact_first_name',
                'contact_middle_initial',
                'contact_last_name',
                'contact_country_code',
                'contact2_first_name',
                'contact2_middle_initial',
                'contact2_last_name',
                'contact2_country_code',
                'contact2_phone',
                'contact2_email'
            ]);
        });
    }
};
