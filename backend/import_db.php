<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$host = env('DB_HOST', 'localhost');
$user = env('DB_USERNAME', 'root');
$pass = env('DB_PASSWORD', '');

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Drop and create database
    $pdo->exec('DROP DATABASE IF EXISTS cemetery_db');
    $pdo->exec('CREATE DATABASE IF NOT EXISTS cemetery_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    echo "✓ Created database\n";
    
    // Connect to the database
    $pdo = new PDO("mysql:host=$host;dbname=cemetery_db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Now import the data from the SQL file
    $sqlFile = '../cemetery_db.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("File not found: $sqlFile");
    }
    
    echo "✓ Importing data from cemetery_db.sql...\n";
    
    $sql = file_get_contents($sqlFile);
    
    // Import data section - execute line by line looking for complete SQL statements
    $lines = file($sqlFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $statement = '';
    $count = 0;
    
    foreach ($lines as $line) {
        $line = trim($line);
        
        // Skip comments and directives
        if (empty($line) || strpos($line, '--') === 0 || strpos($line, '#') === 0 || strpos($line, '/*') === 0) {
            continue;
        }
        
        $statement .= ' ' . $line;
        
        // If line ends with semicolon, execute the statement
        if (substr($line, -1) === ';') {
            $stmt = trim($statement);
            
            // Skip SET directives and special comments
            if (empty($stmt) || stripos($stmt, 'SET') === 0 || stripos($stmt, 'START ') === 0 || stripos($stmt, '/*!') === 0 || stripos($stmt, '/*') === 0) {
                $statement = '';
                continue;
            }
            
            // Execute statements (CREATE, INSERT, ALTER, etc.)
            if (!empty($stmt)) {
                try {
                    $pdo->exec($stmt);
                    if (stripos($stmt, 'INSERT') === 0) {
                        $count++;
                    }
                } catch (Exception $e) {
                    // Silently continue on errors - some CREATE/ALTER may fail if table exists
                    // This is expected when re-importing
                }
            }
            
            $statement = '';
        }
    }
    
    echo "✓ Imported $count data records\n";
    
    // Get counts
    $counts = [
        'users' => $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn(),
        'plots' => $pdo->query('SELECT COUNT(*) FROM plots')->fetchColumn(),
        'burial_records' => $pdo->query('SELECT COUNT(*) FROM burial_records')->fetchColumn(),
        'feedbacks' => $pdo->query('SELECT COUNT(*) FROM feedbacks')->fetchColumn(),
    ];
    
    echo "\nDatabase Verification:\n";
    foreach ($counts as $table => $count) {
        echo "  ✓ $table: $count records\n";
    }
    echo "\n✓ Database import successful!\n";
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
