<?php
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

$log_file  = __DIR__ . '/hakanrun_panel_log.txt';
$rate_dir  = sys_get_temp_dir();
$MAX_LOG   = 5 * 1024 * 1024;  // 5 MB cap — prevents unbounded disk growth
$RATE_SECS = 5;                // min seconds between writes from the same visitor
$MAXLEN    = 300;              // max stored length for UA / path / referrer

// ── Real IP (handles Cloudflare and load-balancers) ───────────────────────
function getRealIP() {
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'] as $key) {
        if (!empty($_SERVER[$key])) {
            $ip = trim(explode(',', $_SERVER[$key])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

// ── Privacy: mask the IP before storing (GDPR/CCPA-friendly) ───────────────
// IPv4  203.0.113.47   → 203.0.113.0
// IPv6  2001:db8:1:2:… → 2001:db8:1::
function maskIP($ip) {
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        $p = explode('.', $ip);
        return "{$p[0]}.{$p[1]}.{$p[2]}.0";
    }
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
        $p = explode(':', $ip);
        return implode(':', array_slice($p, 0, 3)) . '::';
    }
    return 'unknown';
}

// ── Clean a value: strip newlines (no log injection), cap length ───────────
function clean($v, $max) {
    $v = str_replace(["\r", "\n", "\0"], ' ', (string) $v);
    $v = trim($v);
    if ($v === '') return '-';
    return mb_substr($v, 0, $max);
}

// ── Device / browser detection ────────────────────────────────────────────
function detectDevice($ua) {
    $device = preg_match('/Mobile|Android|iPhone|iPad/i', $ua) ? 'Mobile' : 'Desktop';
    if      (preg_match('/Edg\/(\d+)/i',     $ua, $m)) $browser = 'Edge '    . $m[1];
    elseif  (preg_match('/OPR\/(\d+)/i',     $ua, $m)) $browser = 'Opera '   . $m[1];
    elseif  (preg_match('/Chrome\/(\d+)/i',  $ua, $m)) $browser = 'Chrome '  . $m[1];
    elseif  (preg_match('/Firefox\/(\d+)/i', $ua, $m)) $browser = 'Firefox ' . $m[1];
    elseif  (preg_match('/Safari\/(\d+)/i',  $ua, $m)) $browser = 'Safari';
    else    $browser = 'Other';
    return $device . ' / ' . $browser;
}

function normalizeReferrer($ref) {
    $ref = trim((string) $ref);
    if ($ref === '') {
        return ['referrer' => 'Direct', 'referrer_raw' => ''];
    }
    $lower = strtolower($ref);
    if (strpos($lower, 'google') !== false)    return ['referrer' => 'Google',    'referrer_raw' => $ref];
    if (strpos($lower, 'instagram') !== false) return ['referrer' => 'Instagram', 'referrer_raw' => $ref];
    if (strpos($lower, 'linkedin') !== false)  return ['referrer' => 'LinkedIn',  'referrer_raw' => $ref];
    $host = parse_url($ref, PHP_URL_HOST);
    if ($host) return ['referrer' => $host, 'referrer_raw' => $ref];
    return ['referrer' => $ref, 'referrer_raw' => $ref];
}

$realIP   = getRealIP();
$maskedIP = maskIP($realIP);

// ── Rate limit: one write per visitor per $RATE_SECS seconds ───────────────
$rateFile = $rate_dir . '/rate_' . hash('sha256', $maskedIP) . '.tmp';
$last     = @file_exists($rateFile) ? (int) @file_get_contents($rateFile) : 0;
if (time() - $last < $RATE_SECS) {
    http_response_code(429);
    echo json_encode(['status' => 'rate_limited']);
    exit;
}
@file_put_contents($rateFile, (string) time(), LOCK_EX);

// ── Log-size cap: if the file gets too big, keep only the newest half ──────
if (file_exists($log_file) && filesize($log_file) > $MAX_LOG) {
    $lines = file($log_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $lines = array_slice($lines, (int) floor(count($lines) / 2));
    @file_put_contents($log_file, implode("\n", $lines) . "\n", LOCK_EX);
}

$ua      = clean($_SERVER['HTTP_USER_AGENT'] ?? 'unknown', $MAXLEN);
$path    = clean($_GET['path'] ?? ($_POST['path'] ?? '-'), $MAXLEN);
$refRaw  = $_GET['referrer'] ?? ($_POST['referrer'] ?? ($_SERVER['HTTP_REFERER'] ?? ''));
$refInfo = normalizeReferrer($refRaw);

// ── Geo lookup uses the REAL ip, but only the masked ip is stored ──────────
$geo     = @json_decode(@file_get_contents("http://ip-api.com/json/{$realIP}?fields=status,country,city,region"), true);
$country = ($geo && $geo['status'] === 'success') ? $geo['country'] : 'Unknown';
$rawCity = ($geo && $geo['status'] === 'success') ? $geo['city']    : 'Unknown';
$region  = ($geo && $geo['status'] === 'success' && !empty($geo['region'])) ? $geo['region'] : '';
$city    = $region ? $rawCity . ', ' . $region : $rawCity;

date_default_timezone_set('America/Los_Angeles');
$date = date('Y-m-d H:i:s');

$entry = [
    'ip'           => $maskedIP,
    'date'         => $date,
    'country'      => $country,
    'city'         => $city,
    'device'       => detectDevice($ua),
    'ua_full'      => $ua,
    'referrer'     => clean($refInfo['referrer'], $MAXLEN),
    'referrer_raw' => clean($refInfo['referrer_raw'], $MAXLEN),
    'path'         => $path,
];

file_put_contents($log_file, json_encode($entry, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);

echo json_encode(['status' => 'ok']);
