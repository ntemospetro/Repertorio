<?php
/**
 * =========================================================================
 * Hostinger Gemini API Konfiguration (homeopilot360.com)
 * =========================================================================
 * 
 * Für die Live-Suche im Internet nach Medikamenten & Fachinformationen:
 * 
 * OPTION 1 (Empfohlen):
 * Trage unten deinen Google Gemini API-Schlüssel direkt in die Variable ein:
 * $GEMINI_API_KEY = 'AIzaSy...DEIN_KEY_HIER...';
 * 
 * OPTION 2:
 * Lege eine .env-Datei im Hauptverzeichnis mit GEMINI_API_KEY=... an
 * oder setze die Umgebungsvariable im Hostinger-Panel.
 */

$GEMINI_API_KEY = ''; // <-- HIER DEINEN GEMINI API SCHLÜSSEL EINTRAGEN

// Automatische Erkennung aus Umgebungsvariablen oder .env, falls oben leer gelassen
if (empty($GEMINI_API_KEY)) {
    $GEMINI_API_KEY = getenv('GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? ($_SERVER['GEMINI_API_KEY'] ?? ''));
}

if (empty($GEMINI_API_KEY)) {
    $env_candidates = [
        __DIR__ . '/.env',
        __DIR__ . '/../.env',
        __DIR__ . '/../../.env'
    ];
    foreach ($env_candidates as $env_file) {
        if (file_exists($env_file) && is_readable($env_file)) {
            $lines = @file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if (is_array($lines)) {
                foreach ($lines as $line) {
                    $trimmed = trim($line);
                    if (strpos($trimmed, 'GEMINI_API_KEY=') === 0) {
                        $GEMINI_API_KEY = trim(substr($trimmed, strlen('GEMINI_API_KEY=')));
                        $GEMINI_API_KEY = trim($GEMINI_API_KEY, '"\'');
                        break 2;
                    }
                }
            }
        }
    }
}

return $GEMINI_API_KEY;
