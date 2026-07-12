<?php
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// ─────────────────────────────────────────────────────────────────────────────
// AUTH: only a logged-in admin may read visitor logs.
// The admin panel sends its Supabase session token as `Authorization: Bearer …`.
// We verify it by asking Supabase who the token belongs to. No static key,
// nothing secret in the URL, nothing to leak in server/proxy logs.
// ─────────────────────────────────────────────────────────────────────────────

function bearer_token() {
    $hdr = '';
    if (isset($_SERVER['HTTP_AUTHORIZATION']))          $hdr = $_SERVER['HTTP_AUTHORIZATION'];
    elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) $hdr = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    elseif (function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) {
            if (strcasecmp($k, 'Authorization') === 0) { $hdr = $v; break; }
        }
    }
    if (preg_match('/Bearer\s+(.+)/i', $hdr, $m)) return trim($m[1]);
    return '';
}

$config_file = __DIR__ . '/secure-config.php';
if (!file_exists($config_file)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server not configured (missing secure-config.php).']);
    exit;
}
$config = require $config_file;
$token  = bearer_token();

if ($token === '') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Verify the token against Supabase's user endpoint.
$ch = curl_init(rtrim($config['supabase_url'], '/') . '/auth/v1/user');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 8,
    CURLOPT_HTTPHEADER     => [
        'apikey: ' . $config['supabase_anon_key'],
        'Authorization: Bearer ' . $token,
    ],
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$user = json_decode($resp, true);
if ($code !== 200 || empty($user['id'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

// ── Authorized ───────────────────────────────────────────────────────────────
$log_file = __DIR__ . '/hakanrun_panel_log.txt';

if (!file_exists($log_file)) {
    echo json_encode([]);
    exit;
}

// ── 1. Parse every line, oldest first, preserve backward compatibility ───
$raw_entries = [];

foreach (file($log_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $raw) {
    $raw = trim($raw);
    if ($raw === '') {
        continue;
    }

    // JSON format (log_hakanrun.php)
    $e = json_decode($raw, true);
    if (is_array($e)) {
        $raw_entries[] = [
            'ip'           => $e['ip']           ?? '-',
            'date'         => $e['date']         ?? '-',
            'country'      => $e['country']      ?? '-',
            'city'         => $e['city']         ?? '-',
            'device'       => $e['device']       ?? '-',
            'ua_full'      => $e['ua_full']      ?? '-',
            'referrer'     => $e['referrer']     ?? '-',
            'referrer_raw' => $e['referrer_raw'] ?? '',
            'path'         => $e['path']         ?? '-',
        ];
        continue;
    }

    // Pipe-separated format (tracker.php / old log files)
    $parts = array_map('trim', explode('|', $raw));
    $n     = count($parts);

    if ($n >= 7) {
        // old format: STORED_GLOBAL | STORED_DAILY | IP | DATE | COUNTRY | CITY | DEVICE
        $raw_entries[] = [
            'ip'           => $parts[2],
            'date'         => $parts[3],
            'country'      => $parts[4],
            'city'         => $parts[5],
            'device'       => $parts[6],
            'ua_full'      => '-',
            'referrer'     => '-',
            'referrer_raw' => '',
            'path'         => '-',
        ];
    } elseif ($n >= 5) {
        // IP | DATE | COUNTRY | CITY | DEVICE
        $raw_entries[] = [
            'ip'           => $parts[0],
            'date'         => $parts[1],
            'country'      => $parts[2],
            'city'         => $parts[3],
            'device'       => $parts[4],
            'ua_full'      => '-',
            'referrer'     => '-',
            'referrer_raw' => '',
            'path'         => '-',
        ];
    }
}

// ── 2. Build IP counters and enrich each entry with timeline metadata ───
$dateZone = new DateTimeZone('America/Los_Angeles');
$now      = new DateTime('now', $dateZone);
$raw_by_ip = [];

foreach ($raw_entries as $index => $entry) {
    $dateObj = DateTime::createFromFormat('Y-m-d H:i:s', $entry['date'], $dateZone);
    $timestamp = $dateObj ? $dateObj->getTimestamp() : 0;
    $dateKey   = $dateObj ? $dateObj->format('Y-m-d') : substr($entry['date'], 0, 10);

    $raw_entries[$index]['timestamp'] = $timestamp;
    $raw_entries[$index]['date_key']  = $dateKey;

    $ip = $entry['ip'] ?? '-';
    if (!isset($raw_by_ip[$ip])) {
        $raw_by_ip[$ip] = [];
    }
    $raw_by_ip[$ip][] = $raw_entries[$index];
}

$ip_stats = [];
$recentThreshold = $now->getTimestamp() - 600;
$todayKey = $now->format('Y-m-d');

foreach ($raw_by_ip as $ip => $entries_by_ip) {
    $total = count($entries_by_ip);
    $recent = 0;
    $today  = 0;

    foreach ($entries_by_ip as $entry) {
        if ($entry['timestamp'] > 0 && $entry['timestamp'] >= $recentThreshold) {
            $recent++;
        }
        if ($entry['date_key'] === $todayKey) {
            $today++;
        }
    }

    $ip_stats[$ip] = [
        'total_ip_count'  => $total,
        'recent_ip_count' => $recent,
        'today_ip_count'  => $today,
    ];
}

function getFlagLabel($recent, $today, $total) {
    if ($recent >= 5) {
        return 'BOT-LIKE';
    }
    if ($today >= 10) {
        return 'HIGH REPEAT';
    }
    if ($total >= 20) {
        return 'REPEAT';
    }
    return 'OK';
}

$daily_counts = [];
$result = [];

foreach ($raw_entries as $i => $entry) {
    $date_key = substr($entry['date'], 0, 10);
    $daily_counts[$date_key] = ($daily_counts[$date_key] ?? 0) + 1;

    $ip = $entry['ip'] ?? '-';
    $stats = $ip_stats[$ip] ?? ['total_ip_count' => 0, 'recent_ip_count' => 0, 'today_ip_count' => 0];

    $result[] = [
        'global'           => $i + 1,
        'daily'            => $daily_counts[$date_key],
        'ip'               => $entry['ip'] ?? '-',
        'date'             => $entry['date'] ?? '-',
        'country'          => $entry['country'] ?? '-',
        'city'             => $entry['city'] ?? '-',
        'device'           => $entry['device'] ?? '-',
        'ua_full'          => $entry['ua_full'] ?? '-',
        'referrer'         => $entry['referrer'] ?? '-',
        'referrer_raw'     => $entry['referrer_raw'] ?? '',
        'path'             => $entry['path'] ?? '-',
        'total_ip_count'   => $stats['total_ip_count'],
        'recent_ip_count'  => $stats['recent_ip_count'],
        'today_ip_count'   => $stats['today_ip_count'],
        'flag'             => getFlagLabel($stats['recent_ip_count'], $stats['today_ip_count'], $stats['total_ip_count']),
    ];
}

// ── 3. Newest first ───────────────────────────────────────────────────────
echo json_encode(array_reverse($result));
