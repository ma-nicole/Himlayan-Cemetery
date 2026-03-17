<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Admin User (skip if already exists)
        User::firstOrCreate(
            ['email' => 'admin@cemetery.com'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password123'),
                'role' => 'admin',
            ]
        );

        // Create Staff User (skip if already exists)
        User::firstOrCreate(
            ['email' => 'staff@cemetery.com'],
            [
                'name' => 'Staff Member',
                'password' => Hash::make('password123'),
                'role' => 'staff',
            ]
        );
    }
}
