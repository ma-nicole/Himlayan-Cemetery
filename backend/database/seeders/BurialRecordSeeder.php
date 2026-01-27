<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BurialRecord;
use App\Models\Plot;
use Carbon\Carbon;

class BurialRecordSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $occupiedPlots = Plot::where('status', 'occupied')->get();

        $sampleDeceased = [
            ['name' => 'Juan Dela Cruz', 'birth' => '1945-03-15', 'death' => '2023-06-20'],
            ['name' => 'Maria Santos', 'birth' => '1952-08-22', 'death' => '2023-09-10'],
            ['name' => 'Pedro Reyes', 'birth' => '1938-01-05', 'death' => '2022-12-15'],
            ['name' => 'Ana Garcia', 'birth' => '1960-11-30', 'death' => '2024-01-05'],
            ['name' => 'Roberto Mendoza', 'birth' => '1955-07-18', 'death' => '2023-11-22'],
        ];

        foreach ($occupiedPlots as $index => $plot) {
            if (isset($sampleDeceased[$index])) {
                $deceased = $sampleDeceased[$index];
                BurialRecord::create([
                    'plot_id' => $plot->id,
                    'deceased_name' => $deceased['name'],
                    'birth_date' => $deceased['birth'],
                    'death_date' => $deceased['death'],
                    'burial_date' => Carbon::parse($deceased['death'])->addDays(3)->format('Y-m-d'),
                    'obituary' => "In loving memory of {$deceased['name']}. A beloved family member who will be dearly missed.",
                    'contact_name' => 'Family Representative',
                    'contact_phone' => '09' . rand(100000000, 999999999),
                ]);
            }
        }
    }
}
