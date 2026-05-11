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

    return $letters ?: 'H';
}

function selectAlias(?string $column, string $alias): ?string
{
    return $column ? qi($column) . ' AS ' . qi($alias) : null;
}

function qi(string $identifier): string
{
    return '`' . str_replace('`', '``', $identifier) . '`';
}

$username = trim($_POST['username'] ?? $_GET['username'] ?? '');
$normalizedUsername = preg_replace('/\D+/', '', $username);
$password = trim($_POST['password'] ?? '');

if ($username === '') {
    jsonError('Telefon veya kullanıcı adı boş olamaz.');
}

if (!tableExists($pdo, 'personel')) {
    jsonError('personel tablosu bulunamadı.', 500);
}

if (!tableExists($pdo, 'uyeler')) {
    jsonError('uyeler tablosu bulunamadı.', 500);
}

if (!tableExists($pdo, 'antrenman_programi')) {
    jsonError('antrenman_programi tablosu bulunamadı.', 500);
}

$coachIdColumn = firstColumn($pdo, 'personel', ['id', 'per_id', 'perid', 'personel_id', 'hoca_id']);
$coachNameColumn = firstColumn($pdo, 'personel', ['adsoyad', 'ad_soyad', 'isim', 'ad', 'personel_adi', 'hoca_adi']);
$coachPhoneColumn = firstColumn($pdo, 'personel', ['telefon', 'telno', 'tel', 'phone']);
$coachUsernameColumn = firstColumn($pdo, 'personel', ['kullanici_adi', 'username', 'email']);
$coachPasswordColumn = firstColumn($pdo, 'personel', ['sifre', 'password']);

if (!$coachIdColumn || !$coachNameColumn) {
    jsonError('personel tablosunda hoca id ve ad bilgisi için uygun kolon bulunamadı.', 500);
}

$where = [];
$params = [];

if ($coachPhoneColumn) {
    $where[] = qi($coachPhoneColumn) . " = ?";
    $params[] = $username;

    if ($normalizedUsername !== '') {
        $where[] = "REPLACE(REPLACE(REPLACE(REPLACE(" . qi($coachPhoneColumn) . ", ' ', ''), '-', ''), '(', ''), ')', '') = ?";
        $params[] = $normalizedUsername;
    }
}

if ($coachUsernameColumn) {
    $where[] = qi($coachUsernameColumn) . " = ?";
    $params[] = $username;
}

if (!$where) {
    jsonError('personel tablosunda telefon veya kullanıcı adı kolonu bulunamadı.', 500);
}

$statement = $pdo->prepare('SELECT * FROM ' . qi('personel') . ' WHERE (' . implode(' OR ', $where) . ') LIMIT 1');
$statement->execute($params);
$coach = $statement->fetch();

if (!$coach) {
    jsonError('Hoca bulunamadı.', 404);
}

if ($coachPasswordColumn && $password !== '' && (string) $coach[$coachPasswordColumn] !== $password) {
    jsonError('Şifre hatalı.', 401);
}

$coachId = $coach[$coachIdColumn];
$coachName = (string) $coach[$coachNameColumn];

$programCoachColumn = firstColumn($pdo, 'antrenman_programi', ['per_id', 'perid', 'hoca_id', 'personel_id', 'coach_id', 'egitmen_id']);
$programMemberColumn = firstColumn($pdo, 'antrenman_programi', ['uyeid', 'uye_id', 'uyeler_id', 'member_id']);
$programIdColumn = firstColumn($pdo, 'antrenman_programi', ['ant_id', 'antid', 'id', 'program_id']);
$programTitleColumn = firstColumn($pdo, 'antrenman_programi', ['program_adi', 'baslik', 'program', 'program_tipi']);
$programTextColumn = firstColumn($pdo, 'antrenman_programi', ['program_detayi', 'program_detay', 'programdetayi', 'aciklama', 'detay', 'icerik']);
$programDayColumn = firstColumn($pdo, 'antrenman_programi', ['gun_sayisi', 'haftalik_gun', 'program_gunu']);
$programDateColumn = firstColumn($pdo, 'antrenman_programi', ['bas_tarih', 'tarih', 'program_tarihi', 'created_at']);
$programOrderColumn = firstColumn($pdo, 'antrenman_programi', ['bas_tarih', 'tarih', 'program_tarihi', 'created_at', 'ant_id', 'antid', 'id']);

if (!$programCoachColumn || !$programMemberColumn) {
    jsonError('antrenman_programi tablosunda hoca ve üye ilişkisi için uygun kolon bulunamadı.', 500);
}

$memberIdColumn = firstColumn($pdo, 'uyeler', ['id', 'uyeid', 'uye_id', 'uyeno']);
$memberNameColumn = firstColumn($pdo, 'uyeler', ['adsoyad', 'ad_soyad', 'isim', 'ad', 'uye_adi']);
$memberPhoneColumn = firstColumn($pdo, 'uyeler', ['telefon', 'telno', 'tel', 'phone']);

if (!$memberIdColumn || !$memberNameColumn) {
    jsonError('uyeler tablosunda id ve ad bilgisi için uygun kolon bulunamadı.', 500);
}

$programSelect = array_filter([
    selectAlias($programIdColumn, 'program_id'),
    selectAlias($programMemberColumn, 'program_member_id'),
    selectAlias($programTitleColumn, 'program_title'),
    selectAlias($programTextColumn, 'program_details'),
    selectAlias($programDayColumn, 'program_days'),
    selectAlias($programDateColumn, 'program_date'),
]);

if (!$programSelect) {
    $programSelect[] = qi($programMemberColumn) . ' AS ' . qi('program_member_id');
}

$orderBy = $programOrderColumn ? 'ORDER BY ap.' . qi($programOrderColumn) . ' DESC' : '';
$statement = $pdo->prepare(
    'SELECT u.*, ap.' . implode(', ap.', $programSelect) . '
     FROM ' . qi('antrenman_programi') . ' ap
     INNER JOIN ' . qi('uyeler') . ' u ON u.' . qi($memberIdColumn) . ' = ap.' . qi($programMemberColumn) . '
     WHERE ap.' . qi($programCoachColumn) . " = ?
     {$orderBy}"
);
$statement->execute([$coachId]);
$programRows = $statement->fetchAll();

$members = [];

foreach ($programRows as $row) {
    $memberId = (string) $row[$memberIdColumn];

    if (!isset($members[$memberId])) {
        $members[$memberId] = [
            'id' => $row[$memberIdColumn],
            'name' => (string) $row[$memberNameColumn],
            'phone' => $memberPhoneColumn ? ($row[$memberPhoneColumn] ?? null) : null,
            'programs' => [],
            'progress' => [],
        ];
    }

    $members[$memberId]['programs'][] = [
        'id' => $row['program_id'] ?? null,
        'title' => $row['program_title'] ?? 'Program',
        'details' => $row['program_details'] ?? null,
        'days' => $row['program_days'] ?? null,
        'date' => formatDateValue(isset($row['program_date']) ? (string) $row['program_date'] : null),
    ];
}

$progressTable = tableExists($pdo, 'gelisim_takibi') ? 'gelisim_takibi' : (tableExists($pdo, 'vucut_olculeri') ? 'vucut_olculeri' : null);

if ($progressTable) {
    $progressMemberColumn = firstColumn($pdo, $progressTable, ['uye_id', 'uyeid', 'uyeler_id', 'member_id']);
    $progressDateColumn = firstColumn($pdo, $progressTable, ['olcum_tarihi', 'tarih', 'gelisim_tarihi', 'created_at']);
    $progressOrderColumn = firstColumn($pdo, $progressTable, ['olcum_tarihi', 'tarih', 'gelisim_tarihi', 'created_at', 'id']);
    $weightColumn = firstColumn($pdo, $progressTable, ['kilo', 'agirlik', 'weight']);
    $bodyFatColumn = firstColumn($pdo, $progressTable, ['yag_orani', 'yag', 'body_fat', 'vucut_yag_orani']);
    $heightColumn = firstColumn($pdo, $progressTable, ['boy', 'height']);
    $noteColumn = firstColumn($pdo, $progressTable, ['not', 'notlar', 'aciklama', 'yorum', 'note']);

    if ($progressMemberColumn) {
        $progressSelect = array_filter([
            selectAlias($progressDateColumn, 'progress_date'),
            selectAlias($weightColumn, 'progress_weight'),
            selectAlias($bodyFatColumn, 'progress_body_fat'),
            selectAlias($heightColumn, 'progress_height'),
            selectAlias($noteColumn, 'progress_note'),
        ]);

        foreach ($members as $memberId => $member) {
            if (!$progressSelect) {
                continue;
            }

            $progressOrderBy = $progressOrderColumn ? 'ORDER BY ' . qi($progressOrderColumn) . ' DESC' : '';
            $statement = $pdo->prepare(
                'SELECT ' . implode(', ', $progressSelect) . ' FROM ' . qi($progressTable) . '
                 WHERE ' . qi($progressMemberColumn) . " = ?
                 {$progressOrderBy}
                 LIMIT 10"
            );
            $statement->execute([$member['id']]);
            $progressRows = $statement->fetchAll();

            foreach ($progressRows as $progressRow) {
                $members[$memberId]['progress'][] = [
                    'date' => formatDateValue(isset($progressRow['progress_date']) ? (string) $progressRow['progress_date'] : null),
                    'weight' => $progressRow['progress_weight'] ?? null,
                    'body_fat' => $progressRow['progress_body_fat'] ?? null,
                    'height' => $progressRow['progress_height'] ?? null,
                    'note' => $progressRow['progress_note'] ?? null,
                ];
            }
        }
    }
}

echo json_encode([
    'success' => true,
    'data' => [
        'coach' => [
            'id' => $coachId,
            'name' => $coachName,
            'initials' => initials($coachName),
        ],
        'assigned_members' => array_values($members),
    ],
], JSON_UNESCAPED_UNICODE);
