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
        // Create Admin User
        User::create([
            'name' => 'Administrator',
            'email' => 'admin@cemetery.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        // Create Staff User
        User::create([
            'name' => 'Staff Member',
            'email' => 'staff@cemetery.com',
            'password' => Hash::make('password123'),
            'role' => 'staff',
        ]);
    }
}
