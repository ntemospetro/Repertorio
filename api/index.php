<?php
/**
 * =========================================================================
 * Hostinger PHP API Bridge für Live-Medikamentensuche (homeopilot360.com)
 * =========================================================================
 */

// Fehler abfangen & sauberes JSON statt Apache 500 HTML-Fehlerseite ausgeben
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
            header('Access-Control-Allow-Origin: *');
        }
        echo json_encode([
            'status' => 'error',
            'error' => $error['message'],
            'file' => basename($error['file']),
            'line' => $error['line']
        ]);
        exit;
    }
});

ini_set('display_errors', '0');
error_reporting(0);

// Header für JSON & CORS setzen
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Preflight OPTIONS Request direkt beantworten
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// -------------------------------------------------------------------------
// Pfad-Helfer für Datenbank- und Konfigurationsdateien
// -------------------------------------------------------------------------
function getMedicationsDbPath() {
    $candidates = [
        __DIR__ . '/../data/medications_db.json',
        __DIR__ . '/data/medications_db.json',
        __DIR__ . '/../../data/medications_db.json'
    ];
    foreach ($candidates as $c) {
        if (file_exists($c)) return $c;
    }
    $defaultDir = __DIR__ . '/../data';
    if (!is_dir($defaultDir)) {
        @mkdir($defaultDir, 0755, true);
    }
    return $defaultDir . '/medications_db.json';
}

function getTranslationsDbPath() {
    $candidates = [
        __DIR__ . '/../data/medication_translations.json',
        __DIR__ . '/data/medication_translations.json',
        __DIR__ . '/../../data/medication_translations.json'
    ];
    foreach ($candidates as $c) {
        if (file_exists($c)) return $c;
    }
    $defaultDir = __DIR__ . '/../data';
    if (!is_dir($defaultDir)) {
        @mkdir($defaultDir, 0755, true);
    }
    return $defaultDir . '/medication_translations.json';
}

function loadMedicationsDatabase() {
    $file = getMedicationsDbPath();
    if (!file_exists($file)) return [];
    $raw = @file_get_contents($file);
    if (!$raw) return [];
    $data = @json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function saveToMedicationsDatabase($items) {
    if (empty($items) || !is_array($items)) return 0;
    
    if (isset($items['name'])) {
        $items = [$items];
    }

    $file = getMedicationsDbPath();
    $db = loadMedicationsDatabase();

    $now = date('c');
    $count = 0;

    foreach ($items as $item) {
        if (empty($item['name'])) continue;
        $normName = strtolower(trim($item['name']));
        $item['lastUpdated'] = $now;
        $item['savedAt'] = !empty($item['savedAt']) ? $item['savedAt'] : $now;
        $item['fromDatabase'] = true;

        $foundIdx = -1;
        foreach ($db as $idx => $m) {
            if (isset($m['name']) && strtolower(trim($m['name'])) === $normName) {
                $foundIdx = $idx;
                break;
            }
        }

        if ($foundIdx >= 0) {
            $db[$foundIdx] = array_merge($db[$foundIdx], $item);
        } else {
            $db[] = $item;
        }
        $count++;
    }

    $json = json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if ($json && is_writable(dirname($file))) {
        @file_put_contents($file, $json, LOCK_EX);
    }

    return $count;
}

function loadMedicationTranslations() {
    $file = getTranslationsDbPath();
    if (!file_exists($file)) return [];
    $raw = @file_get_contents($file);
    if (!$raw) return [];
    $data = @json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function saveMedicationTranslation($key, $text) {
    if (empty($key) || empty($text)) return;
    $file = getTranslationsDbPath();
    $trans = loadMedicationTranslations();
    $trans[$key] = $text;
    $json = json_encode($trans, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if ($json && is_writable(dirname($file))) {
        @file_put_contents($file, $json, LOCK_EX);
    }
}

function getGeminiKey() {
    $configFile = __DIR__ . '/config.php';
    if (file_exists($configFile)) {
        $key = @include $configFile;
        if (!empty($key) && is_string($key)) return trim($key);
    }
    return getenv('GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? ($_SERVER['GEMINI_API_KEY'] ?? ''));
}

// -------------------------------------------------------------------------
// Gemini REST API Aufruf
// -------------------------------------------------------------------------
function callGeminiApi($prompt, $withSearch = false) {
    $apiKey = getGeminiKey();
    if (empty($apiKey)) return null;

    $model = 'gemini-2.5-flash';
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($apiKey);

    $payload = [
        'contents' => [
            [
                'parts' => [
                    ['text' => $prompt]
                ]
            ]
        ]
    ];

    if ($withSearch) {
        $payload['tools'] = [
            ['googleSearch' => (object)[]]
        ];
    }

    $jsonPayload = json_encode($payload);

    $response = null;
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Content-Length: ' . strlen($jsonPayload)
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
        curl_setopt($ch, CURLOPT_TIMEOUT, 25);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        // Falls mit googleSearch ein Fehler auftrat, Fallback ohne Tool
        if (($httpCode < 200 || $httpCode >= 300) && $withSearch) {
            unset($payload['tools']);
            $jsonPayload = json_encode($payload);
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Content-Length: ' . strlen($jsonPayload)
            ]);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
            curl_setopt($ch, CURLOPT_TIMEOUT, 25);
            $response = curl_exec($ch);
            curl_close($ch);
        }
    } else {
        $opts = [
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\n",
                'content' => $jsonPayload,
                'timeout' => 25
            ]
        ];
        $context = stream_context_create($opts);
        $response = @file_get_contents($url, false, $context);
    }

    if (!$response) return null;
    $decoded = @json_decode($response, true);
    if (!isset($decoded['candidates'][0]['content']['parts'][0]['text'])) {
        return null;
    }
    return trim($decoded['candidates'][0]['content']['parts'][0]['text']);
}

// -------------------------------------------------------------------------
// JSON-Parser für LLM-Antworten
// -------------------------------------------------------------------------
function extractJsonFromText($text) {
    if (empty($text)) return null;
    $clean = trim($text);
    if (strpos($clean, '```json') !== false) {
        $clean = preg_replace('/^```json\s*/i', '', $clean);
        $clean = preg_replace('/\s*```$/', '', $clean);
        $clean = trim($clean);
    } elseif (strpos($clean, '```') !== false) {
        $clean = preg_replace('/^```\s*/i', '', $clean);
        $clean = preg_replace('/\s*```$/', '', $clean);
        $clean = trim($clean);
    }

    $parsed = @json_decode($clean, true);
    if ($parsed !== null) return $parsed;

    $firstBracket = strpos($clean, '[');
    $lastBracket = strrpos($clean, ']');
    if ($firstBracket !== false && $lastBracket !== false && $lastBracket > $firstBracket) {
        $sub = substr($clean, $firstBracket, $lastBracket - $firstBracket + 1);
        $parsed = @json_decode($sub, true);
        if ($parsed !== null) return $parsed;
    }

    $firstBrace = strpos($clean, '{');
    $lastBrace = strrpos($clean, '}');
    if ($firstBrace !== false && $lastBrace !== false && $lastBrace > $firstBrace) {
        $sub = substr($clean, $firstBrace, $lastBrace - $firstBrace + 1);
        $parsed = @json_decode($sub, true);
        if ($parsed !== null) return $parsed;
    }

    return null;
}

function getBaseMedName($name) {
    if (empty($name)) return 'text';
    $n = strtolower($name);
    $n = preg_replace('/\b\d+(\s*,\s*\d+)?\s*(mg|g|µg|ug|ml|ie)\b/i', '', $n);
    $n = preg_replace('/\b(al|ratiopharm|1a pharma|heumann|hexal|stada|pfizer|bayer|novartis|teva)\b/i', '', $n);
    $n = preg_replace('/[®™]/u', '', $n);
    return trim($n);
}

// -------------------------------------------------------------------------
// Ermittlung der Route
// -------------------------------------------------------------------------
$route = '';
if (!empty($_GET['route'])) {
    $route = trim($_GET['route'], '/');
} elseif (!empty($_GET['action'])) {
    $route = trim($_GET['action'], '/');
} elseif (isset($_SERVER['PATH_INFO']) && !empty($_SERVER['PATH_INFO'])) {
    $route = trim($_SERVER['PATH_INFO'], '/');
} else {
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    $cleanUri = preg_replace('#^/api/#', '', $uri);
    $cleanUri = preg_replace('#^api/#', '', $cleanUri);
    $cleanUri = preg_replace('#^index\.php/#', '', $cleanUri);
    $cleanUri = preg_replace('#^.*/api/#', '', $cleanUri);
    $route = trim($cleanUri, '/');
}

// JSON-Body einlesen falls POST
$rawInput = file_get_contents('php://input');
$body = !empty($rawInput) ? @json_decode($rawInput, true) : [];

// =========================================================================
// ROUTE 1: HEALTH / STATUS
// =========================================================================
if ($route === 'health' || $route === 'status' || empty($route)) {
    $db = loadMedicationsDatabase();
    $key = getGeminiKey();
    echo json_encode([
        'status' => 'ok',
        'service' => 'HomeoPilot360 Hostinger Medication Bridge',
        'phpVersion' => PHP_VERSION,
        'geminiKeyConfigured' => !empty($key),
        'databaseMedicationsCount' => count($db),
        'serverTime' => date('c')
    ]);
    exit;
}

// =========================================================================
// ROUTE 2: MEDICATION SEARCH (/api/medications/search)
// =========================================================================
if ($route === 'medications/search' || $route === 'search') {
    $q = isset($_GET['q']) ? trim($_GET['q']) : (isset($body['query']) ? trim($body['query']) : (isset($body['q']) ? trim($body['q']) : ''));
    if (empty($q)) {
        echo json_encode(['results' => [], 'fromDatabase' => false, 'totalInDb' => count(loadMedicationsDatabase())]);
        exit;
    }

    $db = loadMedicationsDatabase();
    $normQ = strtolower($q);

    // Schritt 1: Lokale Datenbank durchsuchen
    $matches = [];
    foreach ($db as $item) {
        $name = strtolower($item['name'] ?? '');
        $sub = strtolower($item['activeSubstance'] ?? '');
        $cat = strtolower($item['category'] ?? '');
        if (strpos($name, $normQ) !== false || strpos($sub, $normQ) !== false || strpos($cat, $normQ) !== false) {
            $item['fromDatabase'] = true;
            $matches[] = $item;
        }
    }

    if (!empty($matches)) {
        echo json_encode([
            'results' => $matches,
            'fromDatabase' => true,
            'stepExecuted' => 'database_match',
            'totalInDb' => count($db)
        ]);
        exit;
    }

    // Schritt 2: Live-Internet-Recherche über Gemini, falls Key vorhanden
    $apiKey = getGeminiKey();
    if (!empty($apiKey)) {
        $prompt = "Du bist ein präzises medizinisches Informationssystem für Fachkreise (Ärztinnen, Ärzte, Apothekerinnen, Apotheker).
Recherchiere die offizielle behördliche Fachinformation (BfArM, EMA, Rote Liste, Gelbe Liste, Fachinfo-Service, EOF) für das folgende Arzneimittel oder den Wirkstoff:
Suchbegriff: \"{$q}\"

WICHTIGSTE VORGABE: Es dürfen KEINE Daten erfunden oder geschätzt werden. Alle Angaben müssen zwingend der behördlichen Fachinformation (BfArM, EMA, Rote Liste, SPC) entsprechen. Wenn zu einem Bereich keine Daten gefunden werden, darf nichts hinzugedacht werden – schreibe dann strikt 'Keine behördlichen Angaben in der Fachinformation hinterlegt'.

Antworte AUSSCHLIESSLICH mit einem validen JSON-Array:
[
  {
    \"name\": \"Handelsname\",
    \"activeSubstance\": \"Wirkstoff\",
    \"category\": \"Wirkstoffklasse\",
    \"dosages\": [\"...\"],
    \"packageSizes\": [\"...\"],
    \"commonForms\": [\"...\"],
    \"recommendedIntake\": \"...\",
    \"sideEffectsByFrequency\": {
      \"veryCommon\": [\"...\"],
      \"common\": [\"...\"],
      \"uncommon\": [\"...\"],
      \"rare\": [\"...\"],
      \"veryRare\": [\"...\"]
    },
    \"sideEffects\": [\"...\"],
    \"interactions\": [\"...\"],
    \"contraindications\": {
      \"absolute\": [\"...\"],
      \"relative\": [\"...\"]
    },
    \"warnings\": \"...\",
    \"monographText\": \"Hier ist die komplette Übersicht zu [Handelsname]...\",
    \"authoritySource\": \"Offizielle Fachinformation (BfArM / EMA / EOF)\"
  }
]";

        $aiResponse = callGeminiApi($prompt, true);
        if ($aiResponse) {
            $parsed = extractJsonFromText($aiResponse);
            $newItems = [];
            if (is_array($parsed)) {
                if (isset($parsed['name'])) {
                    $newItems[] = $parsed;
                } else {
                    foreach ($parsed as $p) {
                        if (is_array($p) && !empty($p['name'])) {
                            $newItems[] = $p;
                        }
                    }
                }
            }

            if (!empty($newItems)) {
                saveToMedicationsDatabase($newItems);
                echo json_encode([
                    'results' => $newItems,
                    'fromDatabase' => false,
                    'stepExecuted' => 'authority_researched_and_saved',
                    'totalInDb' => count(loadMedicationsDatabase())
                ]);
                exit;
            }
        }
    }

    echo json_encode([
        'results' => $matches,
        'fromDatabase' => true,
        'stepExecuted' => 'database_match',
        'totalInDb' => count($db)
    ]);
    exit;
}

// =========================================================================
// ROUTE 3: MEDICATION DETAILS (/api/medications/details)
// =========================================================================
if ($route === 'medications/details' || $route === 'details') {
    $name = isset($_GET['name']) ? trim($_GET['name']) : (isset($body['name']) ? trim($body['name']) : '');
    $lang = isset($_GET['lang']) ? trim($_GET['lang']) : (isset($body['lang']) ? trim($body['lang']) : 'de');

    if (empty($name)) {
        echo json_encode(['details' => null, 'fromDatabase' => false, 'stepExecuted' => 'database_match']);
        exit;
    }

    $db = loadMedicationsDatabase();
    $normName = strtolower($name);

    $found = null;
    foreach ($db as $item) {
        if (isset($item['name']) && strtolower(trim($item['name'])) === $normName) {
            $found = $item;
            break;
        }
    }

    if (!$found) {
        foreach ($db as $item) {
            if (isset($item['name']) && strpos(strtolower($item['name']), $normName) !== false) {
                $found = $item;
                break;
            }
        }
    }

    if (!$found) {
        $apiKey = getGeminiKey();
        if (!empty($apiKey)) {
            $prompt = "Du bist ein präzises medizinisches Informationssystem für Fachkreise. Recherchiere die offizielle behördliche Fachinformation für: {$name}. Antworte ausschließlich mit einem JSON-Array mit 1 Objekt (analog BfArM / EMA / Rote Liste).";
            $aiRes = callGeminiApi($prompt, true);
            if ($aiRes) {
                $parsed = extractJsonFromText($aiRes);
                if (is_array($parsed)) {
                    $item = isset($parsed['name']) ? $parsed : ($parsed[0] ?? null);
                    if ($item && !empty($item['name'])) {
                        saveToMedicationsDatabase([$item]);
                        $found = $item;
                    }
                }
            }
        }
    }

    if ($found) {
        if ($lang !== 'de' && !empty($found['monographText'])) {
            $directKey = strtolower(trim($found['name'])) . "_{$lang}";
            $baseKey = getBaseMedName($found['name']) . "_{$lang}";
            $transCache = loadMedicationTranslations();

            if (!empty($transCache[$directKey])) {
                $found['monographText'] = $transCache[$directKey];
            } elseif (!empty($transCache[$baseKey])) {
                $found['monographText'] = $transCache[$baseKey];
            } else {
                $apiKey = getGeminiKey();
                if (!empty($apiKey)) {
                    $langNames = [
                        'de' => 'German',
                        'en' => 'English',
                        'el' => 'Greek (Ελληνικά)',
                        'es' => 'Spanish (Español)',
                        'fr' => 'French (Français)',
                        'it' => 'Italian (Italiano)',
                        'ru' => 'Russian (Русский)'
                    ];
                    $targetLangName = $langNames[$lang] ?? 'English';
                    $trPrompt = "You are a licensed medical and pharmaceutical translator for clinical staff.\nTranslate the following official medication monograph into {$targetLangName}. Maintain the exact 5-section structure and emoji headers. Output ONLY the translated monograph in {$targetLangName}.\n\n" . $found['monographText'];
                    $trText = callGeminiApi($trPrompt, false);
                    if (!empty($trText) && strlen($trText) > 50) {
                        saveMedicationTranslation($directKey, $trText);
                        saveMedicationTranslation($baseKey, $trText);
                        $found['monographText'] = $trText;
                    }
                }
            }
        }

        echo json_encode([
            'details' => $found,
            'fromDatabase' => true,
            'stepExecuted' => 'database_match'
        ]);
        exit;
    }

    echo json_encode(['details' => null, 'fromDatabase' => false, 'stepExecuted' => 'database_match']);
    exit;
}

// =========================================================================
// ROUTE 4: MEDICATION TRANSLATE (/api/medications/translate)
// =========================================================================
if ($route === 'medications/translate' || $route === 'translate') {
    $text = isset($body['text']) ? $body['text'] : '';
    $targetLang = isset($body['targetLang']) ? $body['targetLang'] : 'de';
    $medName = isset($body['medName']) ? $body['medName'] : 'text';

    if (empty($text) || !is_string($text)) {
        http_response_code(400);
        echo json_encode(['error' => 'text is required']);
        exit;
    }

    if ($targetLang === 'de') {
        echo json_encode(['translatedText' => $text, 'targetLang' => 'de', 'cached' => true]);
        exit;
    }

    $directKey = strtolower(trim($medName)) . "_{$targetLang}";
    $baseKey = getBaseMedName($medName) . "_{$targetLang}";
    $cache = loadMedicationTranslations();

    if (!empty($cache[$directKey])) {
        echo json_encode(['translatedText' => $cache[$directKey], 'targetLang' => $targetLang, 'cached' => true]);
        exit;
    }
    if (!empty($cache[$baseKey])) {
        echo json_encode(['translatedText' => $cache[$baseKey], 'targetLang' => $targetLang, 'cached' => true]);
        exit;
    }

    $apiKey = getGeminiKey();
    if (empty($apiKey)) {
        http_response_code(503);
        echo json_encode(['error' => 'GEMINI_API_KEY is not configured in api/config.php']);
        exit;
    }

    $langNames = [
        'de' => 'German',
        'en' => 'English',
        'el' => 'Greek (Ελληνικά)',
        'es' => 'Spanish (Español)',
        'fr' => 'French (Français)',
        'it' => 'Italian (Italiano)',
        'ru' => 'Russian (Русский)'
    ];
    $targetLangName = $langNames[$targetLang] ?? 'English';

    $trPrompt = "You are a licensed medical and pharmaceutical translator for clinical staff.\nTranslate the following official medication monograph into {$targetLangName}.\nCRITICAL: Maintain the exact 5-section structure and emoji headers. Output ONLY the translated monograph in {$targetLangName}.\n\n{$text}";

    $translated = callGeminiApi($trPrompt, false);
    if (!empty($translated) && strlen($translated) > 50) {
        saveMedicationTranslation($directKey, $translated);
        saveMedicationTranslation($baseKey, $translated);
        echo json_encode(['translatedText' => $translated, 'targetLang' => $targetLang, 'cached' => false]);
        exit;
    }

    echo json_encode(['translatedText' => $text, 'targetLang' => $targetLang, 'cached' => false]);
    exit;
}

// =========================================================================
// DEFAULT: Route nicht gefunden
// =========================================================================
http_response_code(404);
echo json_encode(['error' => 'Endpoint not found', 'requestedRoute' => $route]);
