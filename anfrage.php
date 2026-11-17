<?php
// Anfrageformular von Elektro Lüdorf: prüft die Eingaben und sendet sie samt Fotos per E-Mail.
// Läuft mit PHP 7.4 oder neuer und der Standardfunktion mail() des Hosters.
// Antwortet mit JSON, wenn das Formular per JavaScript gesendet wird, sonst mit einer Weiterleitung.
declare(strict_types=1);

// ---------- Einstellungen (vor Livegang ausfüllen) ----------
$config = [
    'empfaenger'   => 'elektro-luedorf@gmx.de',
    // Achtung: Über mail() des Hosters stellt Gmail Mails mit einem @gmail.com-Absender in der Regel
    // nicht zu (fehlende SPF/DKIM-Freigabe). Für den Livegang eine Adresse auf der eigenen Domain nehmen.
    'absender'     => 'pkochlacher@gmail.com',
    'absenderName' => 'Website Elektro Lüdorf',
    'maxDateien'   => 5,
    'maxBytes'     => 15 * 1024 * 1024,
    // Muss zu den Themen in kontakt.html passen
    'anliegen'     => [
        'Steckdosen & Leitungen',
        'Licht & Beleuchtung',
        'Störung & Reparatur',
        'Sicherungskasten',
        'Smart Home & Netzwerk',
        'Wallbox',
        'Photovoltaik-Anschluss',
        'Etwas anderes',
    ],
    'erreichbar'   => ['Egal', 'Vormittags', 'Nachmittags', 'Abends'],
];

$json = strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function antwort(bool $ok, string $ziel, string $fehler = ''): void
{
    global $json;
    if ($json) {
        http_response_code($ok ? 200 : ($fehler === 'nicht-eingerichtet' ? 503 : 422));
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'fehler' => $fehler ?: null]);
        exit;
    }
    header('Location: ' . $ziel, true, 303);
    exit;
}

function feld(string $name, int $max): string
{
    $wert = isset($_POST[$name]) && is_string($_POST[$name]) ? trim($_POST[$name]) : '';
    $wert = str_replace("\0", '', $wert);
    return mb_substr($wert, 0, $max, 'UTF-8');
}

function einzeilig(string $wert): string
{
    return trim((string) preg_replace('/[\r\n\t]+/', ' ', $wert));
}

function kopfzeile(string $text): string
{
    return '=?UTF-8?B?' . base64_encode($text) . '?=';
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: kontakt.html', true, 303);
    exit;
}

// Unsichtbares Feld: Bots füllen es aus, Menschen nicht. Bots bekommen eine scheinbare Bestätigung.
if (feld('website', 200) !== '') {
    antwort(true, 'danke.html');
}

// Zu schnell abgeschickt (unter 3 Sekunden nach dem Laden): sehr wahrscheinlich ein Bot.
$zeit = feld('zeit', 20);
if ($zeit !== '' && ctype_digit($zeit) && (microtime(true) * 1000 - (float) $zeit) < 3000) {
    antwort(true, 'danke.html');
}

if ($config['empfaenger'] === '' || $config['absender'] === '') {
    antwort(false, 'fehler.html', 'nicht-eingerichtet');
}

$anliegen   = einzeilig(feld('anliegen', 120));
$nachricht  = feld('nachricht', 4000);
$name       = einzeilig(feld('name', 100));
$telefon    = einzeilig(feld('telefon', 40));
$email      = einzeilig(feld('email', 200));
$ort        = einzeilig(feld('ort', 100));
$erreichbar = einzeilig(feld('erreichbar', 60));

$fehler = [];
if (!in_array($anliegen, $config['anliegen'], true)) $fehler[] = 'anliegen';
if ($nachricht === '') $fehler[] = 'nachricht';
if ($name === '') $fehler[] = 'name';
if (preg_match_all('/\d/', $telefon) < 6) $fehler[] = 'telefon';
if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) === false) $fehler[] = 'email';
if (!in_array($erreichbar, $config['erreichbar'], true)) $erreichbar = '';
if (preg_match_all('~https?://~i', $nachricht) > 3) antwort(true, 'danke.html');

$anhaenge = [];
if (isset($_FILES['fotos']['name']) && is_array($_FILES['fotos']['name'])) {
    $erlaubt = [
        'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp',
        'image/heic' => 'heic', 'image/heif' => 'heif', 'application/pdf' => 'pdf',
    ];
    $gesamt = 0;
    $finfo = class_exists('finfo') ? new finfo(FILEINFO_MIME_TYPE) : null;
    foreach ($_FILES['fotos']['error'] as $i => $status) {
        if ($status === UPLOAD_ERR_NO_FILE) continue;
        $tmp = $_FILES['fotos']['tmp_name'][$i];
        if ($status !== UPLOAD_ERR_OK || !is_uploaded_file($tmp) || $finfo === null || count($anhaenge) >= $config['maxDateien']) {
            $fehler[] = 'fotos';
            break;
        }
        $gesamt += (int) filesize($tmp);
        $typ = (string) $finfo->file($tmp);
        if ($gesamt > $config['maxBytes'] || !isset($erlaubt[$typ])) {
            $fehler[] = 'fotos';
            break;
        }
        $anhaenge[] = [
            'name'  => 'anhang-' . (count($anhaenge) + 1) . '.' . $erlaubt[$typ],
            'typ'   => $typ,
            'daten' => (string) file_get_contents($tmp),
        ];
    }
}

if ($fehler) {
    antwort(false, 'fehler.html', implode(',', array_unique($fehler)));
}

$text = "Neue Anfrage über die Website\n\n"
    . "Thema: {$anliegen}\n"
    . "Name: {$name}\n"
    . "Telefon: {$telefon}\n"
    . 'E-Mail: ' . ($email !== '' ? $email : '-') . "\n"
    . 'Einsatzort: ' . ($ort !== '' ? $ort : '-') . "\n"
    . 'Erreichbar: ' . ($erreichbar !== '' ? $erreichbar : '-') . "\n"
    . 'Anhänge: ' . count($anhaenge) . "\n\n"
    . "Beschreibung:\n{$nachricht}\n";

$kopf = [
    'From: ' . kopfzeile($config['absenderName']) . ' <' . $config['absender'] . '>',
    'MIME-Version: 1.0',
];
if ($email !== '') {
    // filter_var hat die Adresse geprüft; sie enthält keine Zeilenumbrüche.
    $kopf[] = 'Reply-To: ' . $email;
}

if ($anhaenge) {
    $grenze = 'grenze-' . bin2hex(random_bytes(12));
    $kopf[] = 'Content-Type: multipart/mixed; boundary="' . $grenze . '"';
    $koerper = "--{$grenze}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($text));
    foreach ($anhaenge as $anhang) {
        $koerper .= "--{$grenze}\r\nContent-Type: {$anhang['typ']}; name=\"{$anhang['name']}\"\r\n"
            . "Content-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"{$anhang['name']}\"\r\n\r\n"
            . chunk_split(base64_encode($anhang['daten']));
    }
    $koerper .= "--{$grenze}--\r\n";
} else {
    $kopf[] = 'Content-Type: text/plain; charset=UTF-8';
    $kopf[] = 'Content-Transfer-Encoding: base64';
    $koerper = chunk_split(base64_encode($text));
}

$betreff = kopfzeile('Neue Anfrage: ' . $anliegen . ' (' . $name . ')');
$gesendet = mail($config['empfaenger'], $betreff, $koerper, implode("\r\n", $kopf), '-f' . $config['absender']);

antwort($gesendet, $gesendet ? 'danke.html' : 'fehler.html', $gesendet ? '' : 'versand');
