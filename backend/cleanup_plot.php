<?php
require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';

// Bootstrap the application to register services
$kernel = $app->make('Illuminate\Contracts\Http\Kernel');
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Delete soft-deleted PLT-0081 permanently
$deleted = DB::delete("DELETE FROM plots WHERE plot_number = ? AND deleted_at IS NOT NULL", ['PLT-0081']);

if ($deleted > 0) {
    echo "✓ Soft-deleted PLT-0081 permanently removed from database.\n";
} else {
    echo "ℹ  No soft-deleted PLT-0081 found in database.\n";
}
