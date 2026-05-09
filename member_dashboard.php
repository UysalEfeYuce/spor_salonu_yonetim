<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/db.php';

function columnExists(PDO $pdo, string $table, string $column): bool
{
    $statement = $pdo->prepare(
        'SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
    );
    $statement->execute([$table, $column]);
    return (int) $statement->fetchColumn() > 0;
}

function firstColumn(PDO $pdo, string $table, array $columns): ?string
{
    foreach ($columns as $column) {
        if (columnExists($pdo, $table, $column)) {
            return $column;
        }
    }

    return null;
}

function tableExists(PDO $pdo, string $table): bool
{
    $statement = $pdo->prepare(
        'SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?'
    );
    $statement->execute([$table]);
    return (int) $statement->fetchColumn() > 0;
}

function jsonError(string $message, int $status = 400): void
{
    http_response_code($status);
    echo json_encode(['success' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function formatDateValue(?string $value): ?string
{
    if (!$value) {
        return null;
    }

    $time = strtotime($value);
    return $time ? date('d.m.Y', $time) : $value;
}

function initials(string $name): string
{
    $parts = preg_split('/\s+/', trim($name));
    $letters = '';

    foreach (array_slice($parts ?: [], 0, 2) as $part) {
        $letters .= mb_strtoupper(mb_substr($part, 0, 1, 'UTF-8'), 'UTF-8');
    }

    return $letters ?: 'Ü';
}

$username = trim($_POST['username'] ?? $_GET['username'] ?? '');
$normalizedUsername = preg_replace('/\D+/', '', $username);
$password = trim($_POST['password'] ?? '');

if ($username === '') {
    jsonError('Telefon veya kullanıcı adı boş olamaz.');
}

if (!tableExists($pdo, 'uyeler')) {
    jsonError('uyeler tablosu bulunamadı.', 500);
}

$memberIdColumn = firstColumn($pdo, 'uyeler', ['id', 'uye_id', 'uyeno']);
$nameColumn = firstColumn($pdo, 'uyeler', ['adsoyad', 'ad_soyad', 'isim', 'ad', 'uye_adi']);
$phoneColumn = firstColumn($pdo, 'uyeler', ['telefon', 'telno', 'tel', 'phone']);
$usernameColumn = firstColumn($pdo, 'uyeler', ['kullanici_adi', 'username', 'email']);
$passwordColumn = firstColumn($pdo, 'uyeler', ['sifre', 'password']);

if (!$memberIdColumn || !$nameColumn) {
    jsonError('uyeler tablosunda id ve ad bilgisi için uygun kolon bulunamadı.', 500);
}

$where = [];
$params = [];

if ($phoneColumn) {
    $where[] = "{$phoneColumn} = ?";
    $params[] = $username;

    if ($normalizedUsername !== '') {
        $where[] = "REPLACE(REPLACE(REPLACE(REPLACE({$phoneColumn}, ' ', ''), '-', ''), '(', ''), ')', '') = ?";
        $params[] = $normalizedUsername;
    }
}

if ($usernameColumn) {
    $where[] = "{$usernameColumn} = ?";
    $params[] = $username;
}

if (!$where) {
    jsonError('uyeler tablosunda telefon veya kullanıcı adı kolonu bulunamadı.', 500);
}

$sql = "SELECT * FROM uyeler WHERE (" . implode(' OR ', $where) . ") LIMIT 1";
$statement = $pdo->prepare($sql);
$statement->execute($params);
$member = $statement->fetch();

if (!$member) {
    jsonError('Üye bulunamadı.', 404);
}

if ($passwordColumn && $password !== '' && (string) $member[$passwordColumn] !== $password) {
    jsonError('Şifre hatalı.', 401);
}

$memberId = $member[$memberIdColumn];
$memberName = (string) $member[$nameColumn];

$membershipEnd = null;
if (tableExists($pdo, 'uyelik_takibi')) {
    $membershipMemberColumn = firstColumn($pdo, 'uyelik_takibi', ['uye_id', 'uyeid', 'uyeler_id', 'member_id']);
    $endColumn = firstColumn($pdo, 'uyelik_takibi', ['bitis_tarihi', 'uyelik_bitis_tarihi', 'bitistarihi', 'son_tarih']);

    if ($membershipMemberColumn && $endColumn) {
        $statement = $pdo->prepare(
            "SELECT {$endColumn} FROM uyelik_takibi
             WHERE {$membershipMemberColumn} = ?
             ORDER BY {$endColumn} DESC
             LIMIT 1"
        );
        $statement->execute([$memberId]);
        $membershipEnd = formatDateValue($statement->fetchColumn() ?: null);
    }
}

$lastWeight = null;
if (tableExists($pdo, 'vucut_olculeri')) {
    $measureMemberColumn = firstColumn($pdo, 'vucut_olculeri', ['uye_id', 'uyeid', 'uyeler_id', 'member_id']);
    $weightColumn = firstColumn($pdo, 'vucut_olculeri', ['kilo', 'agirlik', 'weight']);
    $measureDateColumn = firstColumn($pdo, 'vucut_olculeri', ['olcum_tarihi', 'tarih', 'created_at', 'id']);

    if ($measureMemberColumn && $weightColumn) {
        $orderBy = $measureDateColumn ? "ORDER BY {$measureDateColumn} DESC" : '';
        $statement = $pdo->prepare(
            "SELECT {$weightColumn} FROM vucut_olculeri
             WHERE {$measureMemberColumn} = ?
             {$orderBy}
             LIMIT 1"
        );
        $statement->execute([$memberId]);
        $lastWeight = $statement->fetchColumn() ?: null;
    }
}

$programDays = null;
$todayProgram = null;
if (tableExists($pdo, 'antrenman_programi')) {
    $programMemberColumn = firstColumn($pdo, 'antrenman_programi', ['uye_id', 'uyeid', 'uyeler_id', 'member_id']);
    $programTitleColumn = firstColumn($pdo, 'antrenman_programi', ['program_adi', 'baslik', 'program']);
    $programTextColumn = firstColumn($pdo, 'antrenman_programi', ['aciklama', 'detay', 'icerik', 'program_detay', 'program_detayi']);
    $programDayColumn = firstColumn($pdo, 'antrenman_programi', ['gun_sayisi', 'haftalik_gun', 'program_gunu']);
    $programDateColumn = firstColumn($pdo, 'antrenman_programi', ['tarih', 'program_tarihi', 'created_at', 'id']);

    if ($programMemberColumn) {
        $selectColumns = [];

        foreach ([$programTitleColumn, $programTextColumn, $programDayColumn] as $column) {
            if ($column && !in_array($column, $selectColumns, true)) {
                $selectColumns[] = $column;
            }
        }

        if ($selectColumns) {
            $orderBy = $programDateColumn ? "ORDER BY {$programDateColumn} DESC" : '';
            $statement = $pdo->prepare(
                'SELECT ' . implode(', ', $selectColumns) . " FROM antrenman_programi
                 WHERE {$programMemberColumn} = ?
                 {$orderBy}
                 LIMIT 1"
            );
            $statement->execute([$memberId]);
            $program = $statement->fetch() ?: [];

            $programDays = $programDayColumn ? ($program[$programDayColumn] ?? null) : null;
            $title = $programTitleColumn ? ($program[$programTitleColumn] ?? '') : '';
            $text = $programTextColumn ? ($program[$programTextColumn] ?? '') : '';
            $todayProgram = trim($title . ($title && $text ? ' - ' : '') . $text) ?: null;
        }
    }
}

echo json_encode([
    'success' => true,
    'data' => [
        'name' => $memberName,
        'initials' => initials($memberName),
        'membership_end' => $membershipEnd,
        'last_weight' => $lastWeight,
        'program_days' => $programDays,
        'today_program' => $todayProgram,
    ],
], JSON_UNESCAPED_UNICODE);
