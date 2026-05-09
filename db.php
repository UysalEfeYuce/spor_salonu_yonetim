<?php
declare(strict_types=1);

$dbHost = '127.0.0.1';
$dbName = 'spor_salonu';
$dbUser = 'root';
$dbPass = '';

try {
    $pdo = new PDO(
        "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4",
        $dbUser,
        $dbPass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $exception) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Veritabanı bağlantısı kurulamadı. db.php içindeki ayarları kontrol edin.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
