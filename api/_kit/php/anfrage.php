<?php
// Kontakt- bzw. Reservationsformular → E-Mail an den Kunden via Resend (REST, ohne Bibliotheken).
// Generiert vom Starter-Kit für «__SITE_NAME__».
// Konfiguration AUSSERHALB des Web-Ordners (Vorlage: anfrage-config.example.php), im Ordner «sites/»:
//   sites/anfrage-config.php              gemeinsam für alle Sites (RESEND_API_KEY)
//   sites/anfrage-config-__SITE_DOMAIN__.php   nur diese Site (ANFRAGE_TO, optional ANFRAGE_FROM)

header('Content-Type: application/json; charset=utf-8');

function antwort($code, $data) { http_response_code($code); echo json_encode($data); exit; }
function esc($s) { return htmlspecialchars((string)($s ?? ''), ENT_QUOTES, 'UTF-8'); }
function clip($s, $n) { return mb_substr(trim(is_scalar($s) ? (string)$s : ''), 0, $n, 'UTF-8'); }

$load = function ($f) { if (!is_file($f)) return []; $x = require $f; return is_array($x) ? $x : []; };
$shared = $load(__DIR__ . '/../../anfrage-config.php');
$site = $load(__DIR__ . '/../../anfrage-config-__SITE_DOMAIN__.php');
// Empfänger NUR aus der Site-Konfiguration (die gemeinsame Datei könnte eine fremde Adresse enthalten)
$KEY = $site['RESEND_API_KEY'] ?? $shared['RESEND_API_KEY'] ?? '';
$TO = $site['ANFRAGE_TO'] ?? '__TO_DEFAULT__';
$FROM = $site['ANFRAGE_FROM'] ?? 'Website __SITE_DOMAIN__ <formular@zbinden.online>';
$SITE = '__SITE_NAME__';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') antwort(405, ['error' => 'Method not allowed']);

$b = json_decode(file_get_contents('php://input'), true);
if (!is_array($b)) $b = [];

// Honeypot: Bots füllen das versteckte Feld aus → so tun, als ob alles geklappt hätte
if (clip($b['website'] ?? '', 200) !== '') antwort(200, ['ok' => true]);

$typ = ($b['typ'] ?? '') === 'reservation' ? 'reservation' : 'kontakt';
$d = [
  'name' => clip($b['name'] ?? '', 120),
  'email' => clip($b['email'] ?? '', 200),
  'telefon' => clip($b['telefon'] ?? '', 40),
  'nachricht' => clip($b['nachricht'] ?? '', 4000),
  'datum' => clip($b['datum'] ?? '', 20),
  'zeit' => clip($b['zeit'] ?? '', 10),
  'personen' => clip($b['personen'] ?? '', 4),
];

$emailOk = (bool)preg_match('~^[^\s@]+@[^\s@]+\.[^\s@]+$~', $d['email']);
if ($d['name'] === '' || !$emailOk || ($b['consent'] ?? '') === '') antwort(400, ['error' => 'Invalid input']);
if ($typ === 'kontakt' && $d['nachricht'] === '') antwort(400, ['error' => 'Invalid input']);
if ($typ === 'reservation' && ($d['datum'] === '' || $d['zeit'] === '' || $d['personen'] === '')) antwort(400, ['error' => 'Invalid input']);
if ($KEY === '' || $TO === '') antwort(500, ['error' => 'Mail service not configured']);

// Datum lesbar machen (2026-11-14 → Sa, 14.11.2026)
$datumText = $d['datum'];
if (preg_match('~^(\d{4})-(\d{2})-(\d{2})$~', $d['datum'], $m)) {
  $tage = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  $ts = mktime(12, 0, 0, (int)$m[2], (int)$m[3], (int)$m[1]);
  $datumText = $tage[(int)date('w', $ts)] . ', ' . date('d.m.Y', $ts);
}

$thema = $typ === 'reservation'
  ? "Reservation: {$d['personen']} Pers., $datumText, {$d['zeit']} Uhr"
  : 'Neue Anfrage über die Website';

// Vorausgefüllte Antwort per E-Mail / Anruf / WhatsApp
$tel = preg_replace('~^0~', '+41', preg_replace('~[^\d+]~', '', $d['telefon']));
$replySubject = $typ === 'reservation' ? "Ihre Reservation am $datumText" : "Ihre Anfrage an $SITE";
$replyBody = "Guten Tag {$d['name']}\r\n\r\nVielen Dank für Ihre " . ($typ === 'reservation' ? 'Reservationsanfrage' : 'Nachricht') . ".\r\n\r\n\r\n\r\nFreundliche Grüsse\r\n$SITE";
$mailto = 'mailto:' . $d['email'] . '?subject=' . rawurlencode($replySubject) . '&body=' . rawurlencode($replyBody);

$btn = fn($href, $label, $primary) => '<a href="' . esc($href) . '" style="display:inline-block;margin:0 8px 10px 0;padding:12px 20px;border-radius:999px;font-weight:bold;font-size:15px;text-decoration:none;' . ($primary ? 'background:__DARK__;color:#ffffff;border:2px solid __DARK__' : 'background:#ffffff;color:#222222;border:2px solid __DARK__') . '">' . $label . '</a>';
$actions = $btn($mailto, 'Per E-Mail antworten', true)
  . ($d['telefon'] !== '' ? $btn("tel:$tel", 'Anrufen · ' . esc($d['telefon']), false) . $btn('https://wa.me/' . str_replace('+', '', $tel), 'WhatsApp', false) : '');

$label = fn($t) => '<div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:__DARK__;font-weight:bold;margin:0 0 6px">' . $t . '</div>';
$fact = fn($k, $v) => '<td valign="top" style="padding:12px 14px;background:__SURFACE__;border-radius:10px">' . $label($k) . '<div style="font-size:16px;color:#222222">' . esc($v) . '</div></td>';

$facts = '';
if ($typ === 'reservation') {
  $facts = '<tr><td style="padding:18px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="6"><tr>'
    . $fact('Datum', $datumText) . $fact('Zeit', $d['zeit'] . ' Uhr') . $fact('Personen', $d['personen'])
    . '</tr></table></td></tr>';
}

$html = '<div style="margin:0;padding:24px 12px;background:#f2f0ec">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#222222">
  <tr><td style="background:__DARK__;padding:22px 28px">
    <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:__ACCENT__;font-weight:bold">' . esc($SITE) . '</div>
    <div style="font-size:22px;line-height:1.3;color:#ffffff;font-weight:bold;margin-top:8px">' . esc($thema) . '</div>
  </td></tr>
  <tr><td style="height:5px;background:__ACCENT__;font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:24px 28px 4px">
    ' . $label('Kontakt') . '
    <div style="font-size:20px;font-weight:bold">' . esc($d['name']) . '</div>
    <div style="font-size:15px;color:#555555;margin:4px 0 16px">' . implode(' · ', array_map('esc', array_filter([$d['telefon'], $d['email']], 'strlen'))) . '</div>
    ' . $actions . '
  </td></tr>
  ' . $facts . '
  <tr><td style="padding:18px 28px 28px">
    ' . $label($typ === 'reservation' ? 'Bemerkungen' : 'Nachricht') . '
    <div style="padding:14px 18px;border-left:4px solid __DARK__;background:__SURFACE__;border-radius:0 10px 10px 0;font-size:15px;line-height:1.55;white-space:pre-wrap">' . ($d['nachricht'] !== '' ? esc($d['nachricht']) : '–') . '</div>
  </td></tr>
  <tr><td style="padding:14px 28px;background:#f7f5f1;font-size:12px;color:#777777">Gesendet über das Formular auf __SITE_DOMAIN__. Mit «Antworten» schreiben Sie direkt an ' . esc($d['email']) . '.</td></tr>
</table></div>';

$text = "$thema\n\nName: {$d['name']}\nTelefon: {$d['telefon']}\nE-Mail: {$d['email']}\n"
  . ($typ === 'reservation' ? "Datum: $datumText\nZeit: {$d['zeit']}\nPersonen: {$d['personen']}\n" : '')
  . "\n{$d['nachricht']}\n";

$payload = [
  'from' => $FROM,
  'to' => [$TO],
  'reply_to' => $d['email'],
  'subject' => "$thema – {$d['name']}",
  'html' => $html,
  'text' => $text,
];

$ch = curl_init('https://api.resend.com/emails');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT => 20,
  CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $KEY, 'Content-Type: application/json'],
  CURLOPT_POSTFIELDS => json_encode($payload),
]);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($code < 200 || $code >= 300) antwort(502, ['error' => 'Mail failed']);
antwort(200, ['ok' => true]);
