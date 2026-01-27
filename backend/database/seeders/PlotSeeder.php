<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Plot;

class PlotSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Sample cemetery location (Manila Memorial Park coordinates as example)
        $baseLat = 14.5547;
        $baseLng = 121.0244;

        $sections = ['A', 'B', 'C', 'D'];
        $plotNumber = 1;

        foreach ($sections as $sectionIndex => $section) {
            for ($row = 1; $row <= 5; $row++) {
                for ($col = 1; $col <= 4; $col++) {
                    Plot::create([
                        'plot_number' => sprintf('PLT-%04d', $plotNumber),
                        'section' => $section,
                        'row_number' => $row,
                        'column_number' => $col,
                        'latitude' => $baseLat + ($sectionIndex * 0.0005) + ($row * 0.0001),
                        'longitude' => $baseLng + ($col * 0.0001),
                        'status' => $this->getRandomStatus(),
                        'notes' => null,
                    ]);
                    $plotNumber++;
                }
            }
        }
    }

    private function getRandomStatus(): string
    {
        $statuses = ['available', 'occupied', 'reserved', 'available', 'available'];
        return $statuses[array_rand($statuses)];
    }
}
