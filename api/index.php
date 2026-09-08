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

    $models = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];

    foreach ($models as $model) {
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
            curl_setopt($ch, CURLOPT_TIMEOUT, 35);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            // Falls mit googleSearch fehlschlägt, Fallback ohne Tool
            if (($httpCode < 200 || $httpCode >= 300) && $withSearch) {
                unset($payload['tools']);
                $jsonPayloadNoSearch = json_encode($payload);
                $ch = curl_init($url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Content-Type: application/json',
                    'Content-Length: ' . strlen($jsonPayloadNoSearch)
                ]);
                curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayloadNoSearch);
                curl_setopt($ch, CURLOPT_TIMEOUT, 30);
                $response = curl_exec($ch);
                curl_close($ch);
            }
        } else {
            $opts = [
                'http' => [
                    'method' => 'POST',
                    'header' => "Content-Type: application/json\r\n",
                    'content' => $jsonPayload,
                    'timeout' => 35
                ]
            ];
            $context = stream_context_create($opts);
            $response = @file_get_contents($url, false, $context);
        }

        if ($response) {
            $decoded = @json_decode($response, true);
            if (isset($decoded['candidates'][0]['content']['parts'][0]['text'])) {
                $text = trim($decoded['candidates'][0]['content']['parts'][0]['text']);
                if (!empty($text)) {
                    return $text;
                }
            }
        }
    }

    return null;
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
    $lang = isset($_GET['lang']) ? trim($_GET['lang']) : (isset($body['lang']) ? trim($body['lang']) : 'de');

    if (empty($q)) {
        echo json_encode(['results' => [], 'fromDatabase' => false, 'totalInDb' => count(loadMedicationsDatabase())]);
        exit;
    }

    $force = (isset($_GET['force']) && ($_GET['force'] === '1' || $_GET['force'] === 'true'))
        || (isset($body['force']) && ($body['force'] === true || $body['force'] === 1 || $body['force'] === '1'));

    $db = loadMedicationsDatabase();
    $normQ = strtolower($q);

    // Schritt 1: Lokale Datenbank durchsuchen
    $exactMatches = [];
    $partialMatches = [];
    foreach ($db as $item) {
        $name = strtolower($item['name'] ?? '');
        $sub = strtolower($item['activeSubstance'] ?? '');
        $cat = strtolower($item['category'] ?? '');
        if ($name === $normQ || $sub === $normQ) {
            $item['fromDatabase'] = true;
            $exactMatches[] = $item;
        } elseif (strpos($name, $normQ) !== false || strpos($sub, $normQ) !== false || strpos($cat, $normQ) !== false) {
            $item['fromDatabase'] = true;
            $partialMatches[] = $item;
        }
    }

    $allMatches = array_merge($exactMatches, $partialMatches);

    // TURBO-SPEED: Wenn NICHT forciert -> Sofortige Antwort aus der Datenbank in < 5ms!
    // Dadurch friert die Eingabe beim Tippen niemals ein.
    if (!$force) {
        echo json_encode([
            'results' => $allMatches,
            'fromDatabase' => true,
            'stepExecuted' => 'database_match',
            'totalInDb' => count($db)
        ]);
        exit;
    }

    // Schritt 2: Live-Internet-Recherche über Gemini (nur wenn explizit forciert mit force=1)
    $apiKey = getGeminiKey();
    if (!empty($apiKey)) {
        $langNames = [
            'de' => 'German (Deutsch)',
            'en' => 'English',
            'el' => 'Greek (Ελληνικά)',
            'es' => 'Spanish (Español)',
            'fr' => 'French (Français)',
            'it' => 'Italian (Italiano)',
            'ru' => 'Russian (Русский)'
        ];
        $targetLangName = $langNames[$lang] ?? 'German (Deutsch)';

        $prompt = "Du bist ein schnelles pharmazeutisches Suchsystem.
Finde das Medikament bzw. den Wirkstoff: \"{$q}\".
Ermittle schnell:
1. name: Offizieller Handelsname
2. activeSubstance: Wirkstoff (INN in {$targetLangName})
3. category: Wirkstoffgruppe in {$targetLangName}
4. dosages: Liste aller handelsüblichen Dosierungen (z.B. [\"20 mg\", \"40 mg\", \"80 mg\"])
5. commonForms: Darreichungsformen in {$targetLangName} (z.B. [\"Tabletten\", \"Kapseln\"])
6. recommendedIntake: Typische Einnahme in {$targetLangName} (z.B. \"1x täglich morgens\")

Antworte AUSSCHLIESSLICH mit einem kompakten JSON-Array:
[
  {
    \"name\": \"Handelsname\",
    \"activeSubstance\": \"Wirkstoff\",
    \"category\": \"Wirkstoffgruppe\",
    \"dosages\": [\"...\"],
    \"commonForms\": [\"...\"],
    \"recommendedIntake\": \"...\"
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

                // Falls eine andere Sprache als Deutsch gewählt war, sichere das Objekt auch im Übersetzungscache
                if ($lang !== 'de') {
                    foreach ($newItems as $item) {
                        if (!empty($item['name'])) {
                            $dKey = strtolower(trim($item['name'])) . "_{$lang}";
                            $bKey = getBaseMedName($item['name']) . "_{$lang}";
                            saveMedicationTranslation($dKey, $item);
                            saveMedicationTranslation($bKey, $item);
                        }
                    }
                }

                // Live gefundene Treffer an den Anfang setzen, danach Teil-Treffer
                $merged = [];
                $seen = [];
                foreach ($newItems as $it) {
                    $key = strtolower($it['name'] ?? '');
                    if (!empty($key) && !isset($seen[$key])) {
                        $seen[$key] = true;
                        $it['fromDatabase'] = false;
                        $merged[] = $it;
                    }
                }
                foreach ($allMatches as $it) {
                    $key = strtolower($it['name'] ?? '');
                    if (!empty($key) && !isset($seen[$key])) {
                        $seen[$key] = true;
                        $it['fromDatabase'] = true;
                        $merged[] = $it;
                    }
                }

                echo json_encode([
                    'results' => $merged,
                    'fromDatabase' => false,
                    'stepExecuted' => 'authority_researched_and_saved',
                    'totalInDb' => count(loadMedicationsDatabase())
                ]);
                exit;
            }
        }
    }

    // Fallback: Datenbank-Treffer zurückgeben
    echo json_encode([
        'results' => $allMatches,
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

    // Falls gar nicht in lokaler DB oder nur Basis-Daten vorhanden, führe vollständige Behördensuche aus
    $isComplete = $found && (!empty($found['monographText']) || !empty($found['sideEffects']));
    if (!$found || !$isComplete) {
        $apiKey = getGeminiKey();
        if (!empty($apiKey)) {
            $langNames = [
                'de' => 'German (Deutsch)',
                'en' => 'English',
                'el' => 'Greek (Ελληνικά)',
                'es' => 'Spanish (Español)',
                'fr' => 'French (Français)',
                'it' => 'Italian (Italiano)',
                'ru' => 'Russian (Русский)'
            ];
            $targetLangName = $langNames[$lang] ?? 'German (Deutsch)';
            $prompt = "Du bist ein pharmazeutisches Informationssystem für klinisches Fachpersonal.
Recherchiere die offizielle behördliche Fachinformation (BfArM, EMA, FDA, EOF, Rote Liste) für: \"{$name}\".
SPRACHVORGABE: Alle Angaben, Beschreibungen, Nebenwirkungen, Wechselwirkungen, Kontraindikationen und die Monographie MÜSSEN zwingend und vollständig in {$targetLangName} formuliert werden!
WICHTIG: Keine Daten erfinden.
Antworte AUSSCHLIESSLICH mit einem validen JSON-Array mit 1 Objekt:
[
  {
    \"name\": \"{$name}\",
    \"activeSubstance\": \"Wirkstoff in {$targetLangName}\",
    \"category\": \"Wirkstoffklasse in {$targetLangName}\",
    \"dosages\": [\"...\"],
    \"packageSizes\": [\"...\"],
    \"commonForms\": [\"...\"],
    \"recommendedIntake\": \"Einnahmeempfehlung in {$targetLangName}\",
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
    \"warnings\": \"Warnhinweise in {$targetLangName}\",
    \"monographText\": \"Ausführliche 5-teilige Fachinformation in {$targetLangName}...\",
    \"authoritySource\": \"Offizielle Fachinformation (BfArM / EMA / EOF)\"
  }
]";
            $aiRes = callGeminiApi($prompt, true);
            if ($aiRes) {
                $parsed = extractJsonFromText($aiRes);
                if (is_array($parsed)) {
                    $item = isset($parsed['name']) ? $parsed : ($parsed[0] ?? null);
                    if ($item && !empty($item['name'])) {
                        saveToMedicationsDatabase([$item]);
                        $found = is_array($found) ? array_merge($found, $item) : $item;
                    }
                }
            }
        }
    }

    if ($found) {
        // Mehrsprachigkeit: Übersetzung aller Felder & dauerhafte Speicherung
        if ($lang !== 'de') {
            $directKey = strtolower(trim($found['name'])) . "_{$lang}";
            $baseKey = getBaseMedName($found['name']) . "_{$lang}";
            $transCache = loadMedicationTranslations();

            $cachedEntry = $transCache[$directKey] ?? ($transCache[$baseKey] ?? null);

            if (!empty($cachedEntry)) {
                // Sofort aus dem permanenten Übersetzungscache laden (0 Millisekunden!)
                if (is_array($cachedEntry)) {
                    $found = array_merge($found, $cachedEntry);
                } elseif (is_string($cachedEntry)) {
                    $found['monographText'] = $cachedEntry;
                }
            } else {
                // Noch nicht in dieser Sprache übersetzt: Vollständige Übersetzung per Gemini durchführen
                // und dauerhaft in medication_translations.json sichern
                $apiKey = getGeminiKey();
                if (!empty($apiKey)) {
                    $langNames = [
                        'de' => 'German (Deutsch)',
                        'en' => 'English',
                        'el' => 'Greek (Ελληνικά)',
                        'es' => 'Spanish (Español)',
                        'fr' => 'French (Français)',
                        'it' => 'Italian (Italiano)',
                        'ru' => 'Russian (Русский)'
                    ];
                    $targetLangName = $langNames[$lang] ?? 'English';

                    $toTranslate = [
                        'activeSubstance' => $found['activeSubstance'] ?? '',
                        'category' => $found['category'] ?? '',
                        'recommendedIntake' => $found['recommendedIntake'] ?? '',
                        'sideEffectsByFrequency' => $found['sideEffectsByFrequency'] ?? null,
                        'sideEffects' => $found['sideEffects'] ?? [],
                        'interactions' => $found['interactions'] ?? [],
                        'contraindications' => $found['contraindications'] ?? null,
                        'warnings' => $found['warnings'] ?? '',
                        'monographText' => $found['monographText'] ?? ''
                    ];

                    $trPrompt = "You are a licensed clinical and medical translator.
Translate the following medication clinical data accurately into {$targetLangName}.
CRITICAL INSTRUCTIONS:
1. Translate all drug categories, active substance name, side effects, interactions, contraindications, warnings, and the 5-section monograph into {$targetLangName}.
2. Retain the exact JSON key structure.
3. Return ONLY a valid JSON object matching the input keys without any markdown wrappers.

Input JSON:
" . json_encode($toTranslate, JSON_UNESCAPED_UNICODE);

                    $trRes = callGeminiApi($trPrompt, false);
                    if ($trRes) {
                        $translatedObj = extractJsonFromText($trRes);
                        if (is_array($translatedObj) && (!empty($translatedObj['monographText']) || !empty($translatedObj['sideEffects']))) {
                            // Dauerhaft im Dateisystem sichern
                            saveMedicationTranslation($directKey, $translatedObj);
                            saveMedicationTranslation($baseKey, $translatedObj);
                            $found = array_merge($found, $translatedObj);
                        }
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
// ROUTE 5: SITE CONFIG (/api/site/config & /api/site-config)
// =========================================================================
if ($route === 'site/config' || $route === 'site-config') {
    $siteConfigFile = __DIR__ . '/../data/site_config.json';
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $current = [];
        if (file_exists($siteConfigFile)) {
            $raw = @file_get_contents($siteConfigFile);
            $current = @json_decode($raw, true) ?: [];
        }
        $updated = array_merge(is_array($current) ? $current : [], is_array($body) ? $body : []);
        @file_put_contents($siteConfigFile, json_encode($updated, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode($updated);
        exit;
    }
    if (file_exists($siteConfigFile)) {
        $raw = @file_get_contents($siteConfigFile);
        $data = @json_decode($raw, true);
        if (is_array($data)) {
            echo json_encode($data);
            exit;
        }
    }
    echo json_encode(new stdClass());
    exit;
}

// =========================================================================
// ROUTE 6: EMAIL CONFIG (/api/email/config & /api/email-config)
// =========================================================================
if ($route === 'email/config' || $route === 'email-config' || $route === 'email/config/reset' || $route === 'email-config/reset') {
    $emailConfigFile = __DIR__ . '/../data/email_config.json';
    $defaultEmailSettings = [
        'smtpHost' => 'smtp.hostinger.com',
        'smtpPort' => 465,
        'smtpSecure' => 'ssl',
        'smtpUser' => 'therapie@homeopilot360.com',
        'smtpPass' => '',
        'senderEmail' => 'therapie@homeopilot360.com',
        'senderName' => 'HomeoPilot 360',
        'footerText' => 'Automatisch generiert durch HomeoPilot 360.'
    ];

    if (strpos($route, 'reset') !== false && $_SERVER['REQUEST_METHOD'] === 'POST') {
        @file_put_contents($emailConfigFile, json_encode($defaultEmailSettings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode($defaultEmailSettings);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $current = $defaultEmailSettings;
        if (file_exists($emailConfigFile)) {
            $raw = @file_get_contents($emailConfigFile);
            $parsed = @json_decode($raw, true);
            if (is_array($parsed)) $current = array_merge($current, $parsed);
        }
        $updated = array_merge($current, is_array($body) ? $body : []);
        $updated['updatedAt'] = date('c');
        @file_put_contents($emailConfigFile, json_encode($updated, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode($updated);
        exit;
    }

    if (file_exists($emailConfigFile)) {
        $raw = @file_get_contents($emailConfigFile);
        $data = @json_decode($raw, true);
        if (is_array($data)) {
            echo json_encode($data);
            exit;
        }
    }
    echo json_encode($defaultEmailSettings);
    exit;
}

// =========================================================================
// ROUTE 7: ADMIN CREDENTIALS (/api/admin/credentials & /api/admin-credentials)
// =========================================================================
if ($route === 'admin/credentials' || $route === 'admin-credentials') {
    $credsFile = __DIR__ . '/../data/admin_credentials.json';
    $defaultCreds = [
        'username' => 'admin',
        'email' => 'admin@homeopilot360.com',
        'displayName' => 'Praxisleitung',
        'passwordHash' => ''
    ];
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $current = $defaultCreds;
        if (file_exists($credsFile)) {
            $raw = @file_get_contents($credsFile);
            $parsed = @json_decode($raw, true);
            if (is_array($parsed)) $current = array_merge($current, $parsed);
        }
        $updated = array_merge($current, is_array($body) ? $body : []);
        @file_put_contents($credsFile, json_encode($updated, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode($updated);
        exit;
    }
    if (file_exists($credsFile)) {
        $raw = @file_get_contents($credsFile);
        $data = @json_decode($raw, true);
        if (is_array($data)) {
            echo json_encode($data);
            exit;
        }
    }
    echo json_encode($defaultCreds);
    exit;
}

// =========================================================================
// ROUTE 8: MEDICAL RELEVANCE FILTER (/api/check-medical-relevance)
// =========================================================================
if ($route === 'check-medical-relevance') {
    $text = isset($body['text']) ? trim($body['text']) : '';
    if (empty($text)) {
        echo json_encode(['isRelevant' => false, 'reason' => 'empty_text']);
        exit;
    }
    $apiKey = getGeminiKey();
    if (empty($apiKey)) {
        echo json_encode(['isRelevant' => true, 'reason' => 'no_api_key_passthrough']);
        exit;
    }
    $prompt = "Du bist ein strenger medizinischer Relevanzfilter für eine professionelle homöopathische Anamnese.
Prüfe folgende Aussage: \"{$text}\".
Antworte AUSSCHLIESSLICH im JSON-Format: {\"isRelevant\": true, \"reason\": \"Erklärung\"}";
    $aiRes = callGeminiApi($prompt, false);
    $parsed = $aiRes ? extractJsonFromText($aiRes) : null;
    if (is_array($parsed) && isset($parsed['isRelevant'])) {
        echo json_encode($parsed);
        exit;
    }
    echo json_encode(['isRelevant' => true, 'reason' => 'fallback']);
    exit;
}

// =========================================================================
// ROUTE 9: HAHNEMANN ORGANON §§ 83-104 ANAMNESE (/api/hahnemann-analysis)
// =========================================================================
if ($route === 'hahnemann-analysis' || $route === 'hahnemann/analysis') {
    $text = isset($body['text']) ? trim($body['text']) : '';
    if (empty($text)) {
        http_response_code(400);
        echo json_encode(['error' => 'text is required']);
        exit;
    }

    $apiKey = getGeminiKey();
    if (empty($apiKey)) {
        http_response_code(503);
        echo json_encode(['error' => 'GEMINI_API_KEY is not configured']);
        exit;
    }

    $currentMatrix = isset($body['currentMatrix']) && is_array($body['currentMatrix']) ? $body['currentMatrix'] : [];
    $conversationHistory = isset($body['conversationHistory']) && is_array($body['conversationHistory']) ? $body['conversationHistory'] : [];
    $language = isset($body['language']) ? $body['language'] : 'de';
    $forceComplete = !empty($body['forceComplete']);
    $caseType = isset($body['caseType']) ? $body['caseType'] : 'akut';

    $langNames = [
        'de' => 'German (Deutsch)',
        'en' => 'English',
        'el' => 'Greek (Ελληνικά)',
        'es' => 'Spanish (Español)',
        'fr' => 'French (Français)',
        'it' => 'Italian (Italiano)',
        'ru' => 'Russian (Русский)'
    ];
    $targetLanguageName = $langNames[$language] ?? 'German (Deutsch)';

    $currentStepCount = count($conversationHistory) + 1;
    $hasCausa = !empty($currentMatrix['causa']) && $currentMatrix['causa'] !== 'Noch nicht genannt';
    $hasLokalisierung = !empty($currentMatrix['lokalisierung']) && $currentMatrix['lokalisierung'] !== 'Noch nicht genannt';
    $hasEmpfindung = !empty($currentMatrix['empfindung']) && $currentMatrix['empfindung'] !== 'Noch nicht genannt';
    $hasModalitaeten = !empty($currentMatrix['modalitaeten']) && $currentMatrix['modalitaeten'] !== 'Noch nicht genannt';
    $hasBegleitsymptome = !empty($currentMatrix['begleitsymptome']) && is_array($currentMatrix['begleitsymptome']) && count($currentMatrix['begleitsymptome']) > 0;
    $hasGemuet = !empty($currentMatrix['gemuet']) && $currentMatrix['gemuet'] !== 'Noch nicht genannt';

    $all6PillarsFilled = $hasCausa && $hasLokalisierung && $hasEmpfindung && $hasModalitaeten && $hasBegleitsymptome && $hasGemuet;
    $maxStepsReached = count($conversationHistory) >= 7;
    $mustComplete = $forceComplete || $all6PillarsFilled || ($maxStepsReached && $hasGemuet && $hasModalitaeten && $hasEmpfindung && $hasCausa);

    $safeText = str_replace('"', '\"', $text);
    $escapedMatrix = json_encode($currentMatrix, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $escapedHistory = json_encode($conversationHistory, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

    $prompt = "Du bist die zentrale Logik-Engine für eine professionelle homöopathische Anamnese streng nach den Prinzipien von Samuel Hahnemann und den Paragraphen 83 bis 104 des Organon der Heilkunst.

### LEITLINIEN AUS DEM ORGANON DER HEILKUNST (§§ 83–104):
- § 83: Vorurteilslose Beobachtung und treue Aufnahme des Krankheitsbildes ohne Spekulationen.
- § 84: Der Patient schildert seine Beschwerden; die Begleiter berichten. Der Arzt hört aufmerksam zu, ohne zu unterbrechen.
- §§ 85–90: Gezieltes Nachfragen zur Präzisierung. Jedes Einzelsymptom wird isoliert abgefragt. Niemals Suggestivfragen stellen.
- §§ 91–93: Unterscheidung chronische vs. akute Krankheiten.
- § 94: Untersuchung von Lebensweise, Diät, Gemütszustand.
- § 99: Akute Krankheiten: Erfragung des unmittelbaren Anlasses/Auslösers (Causa), des Beginns und des bisherigen Verlaufs.
- §§ 100–102: Zusammenhängende / epidemische Erkrankungen: Erfassung des Gesamtbildes durch Verknüpfung der Symptome.
- §§ 103–104: Vollständiges Fixieren des Krankheitsbildes (Totalität der Symptome als Fundament des Simile).

### STRIKTE ANWEISUNG: BERÜCKSICHTIGUNG DES KONKRETEN PATIENTENSYMPTOMS & EXTRAKTION
1. Analysiere ZUERST die aktuelle Benutzereingabe (\"{$safeText}\") sowie die bestehende Matrix.
2. Wenn der Patient in seiner Eingabe bereits ein Symptom, eine Lokalisation, eine Empfindung, einen Auslöser/Causa oder Modalitäten genannt hat:
   - Extrahiere diese Fakten SOFORT in die entsprechenden Felder von \"wichtige_symptom_fragmente\"!
   - Frage NIEMALS nach einer Säule, die der Patient bereits genannt hat oder die in der bestehenden Matrix bereits vorhanden ist.
3. Die nächste Frage (\"naechste_frage\") MUSS das konkrete Symptom des Patienten IMMER namentlich aufgreifen (z. B. \"Zu Ihren Kopfschmerzen: ...\", in der Zielsprache).
4. Frage immer gezielt nach der nächsten TATSÄCHLICH NOCH FEHLENDEN Säule!

### URSÄCHLICHER ZUSAMMENHANG BEI MEHREREN BESCHWERDEN:
Bei der Aufnahme mehrerer Beschwerden (z. B. Fieber und Halsschmerzen) prüfst du IMMER zuerst, ob ein ursächlicher Zusammenhang besteht. Hinterfrage, ob beide durch denselben Auslöser/Infekt hervorgerufen wurden, um sie als zusammenhängenden Komplex zu erfassen.

Soll jetzt abgeschlossen werden? " . ($mustComplete ? "JA (Abschluss der Organon-Anamnese)" : "NEIN (nächste Frage stellen)") . ".

### AUSGABE-FORMAT (Strikte JSON-Struktur):
Antworte AUSSCHLIESSLICH mit validem JSON in genau diesem Format (ohne Markdown, ohne Text davor oder danach):
{
  \"analyse_status\": \"" . ($mustComplete ? "completed" : "in_progress") . "\",
  \"wichtige_symptom_fragmente\": {
    \"causa\": null,
    \"lokalisierung\": null,
    \"empfindung\": null,
    \"modalitaeten\": null,
    \"begleitsymptome\": [],
    \"gemuet\": null,
    \"strahlungsoptionen\": null,
    \"ursaechlicher_zusammenhang\": null,
    \"fruehere_behandlungen_und_historie\": null
  },
  \"falltyp\": \"{$caseType}\",
  \"mehrere_symptome_erkannt\": false,
  \"symptomkomplex_bestaetigt\": false,
  \"ignorierte_daten\": [],
  \"kontroll_und_nachfrage_logik\": \"Begründung nach Organon §§ 83-104\",
  \"naechste_frage\": \"" . ($mustComplete ? "" : "Hier steht genau eine gezielte Einzelfrage zur fehlenden Säule") . "\",
  \"auswahl_optionen\": " . ($mustComplete ? "[]" : '["Option 1", "Option 2", "Option 3", "Option 4"]') . ",
  \"auswahl_typ\": \"multiple\",
  \"aktuelle_mittel_differenzierung\": [\"Aconitum napellus\", \"Belladonna\", \"Bryonia alba\"],
  \"end_analyse_zusammenfassung\": " . ($mustComplete ? '"Zusammenfassung für den Therapeuten: ..."' : "null") . ",
  \"sich_ergebende_fragen\": []
}

Bestehende Matrix:
{$escapedMatrix}

Bisheriger Verlauf:
{$escapedHistory}

Aktuelle Benutzereingabe:
\"{$safeText}\"

SPRACHE: Alle Fragen, Optionen und Zusammenfassungen in {$targetLanguageName} formulieren. Arzneimittelnamen stets in offiziellem Latein.";

    $aiRes = callGeminiApi($prompt, false);
    if ($aiRes) {
        $parsed = extractJsonFromText($aiRes);
        if (is_array($parsed) && isset($parsed['wichtige_symptom_fragmente'])) {
            if ($mustComplete) {
                $parsed['analyse_status'] = 'completed';
                $parsed['naechste_frage'] = '';
                $parsed['auswahl_optionen'] = [];
            }
            echo json_encode(['result' => $parsed]);
            exit;
        }
    }

    http_response_code(500);
    echo json_encode(['error' => 'Failed to perform Hahnemann analysis via AI']);
    exit;
}

// =========================================================================
// ROUTE 10: 5-SCHRITTE-AKUT-REPERTORISATION (/api/acute-repertorise)
// =========================================================================
if ($route === 'acute-repertorise' || $route === 'acute/repertorise') {
    $symptomText = isset($body['symptomText']) ? trim($body['symptomText']) : '';
    if (empty($symptomText)) {
        http_response_code(400);
        echo json_encode(['error' => 'symptomText is required']);
        exit;
    }

    $apiKey = getGeminiKey();
    if (empty($apiKey)) {
        http_response_code(503);
        echo json_encode(['error' => 'GEMINI_API_KEY is not configured']);
        exit;
    }

    $language = isset($body['language']) ? $body['language'] : 'de';
    $langNames = [
        'de' => 'German (Deutsch)',
        'en' => 'English',
        'el' => 'Greek (Ελληνικά)',
        'es' => 'Spanish (Español)',
        'fr' => 'French (Français)',
        'it' => 'Italian (Italiano)',
        'ru' => 'Russian (Русский)'
    ];
    $targetLanguageName = $langNames[$language] ?? 'German (Deutsch)';
    $safeSymptom = str_replace('"', '\"', $symptomText);

    $prompt = "Du bist das logische Hintergrund-Modul (Backend-Engine) einer bestehenden Homöopathie-App zur hochpräzisen, unvoreingenommenen Akutanalyse nach Hahnemanns Organon §§ 83–104 und Kent.
Eingabetext: \"{$safeSymptom}\"
Zielsprache: {$targetLanguageName}

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt (ohne Markdown, ohne Fließtext):
{
  \"extraktion\": {
    \"hauptbeschwerde\": \"Leitsymptom\",
    \"causa\": \"Causa oder Unbekannt (Bitte erfragen)\",
    \"modalitaeten\": \"Modalitäten oder Unbekannt (Bitte erfragen)\",
    \"begleitsymptome\": \"Begleitsymptome oder Unbekannt (Bitte erfragen)\"
  },
  \"app_layout_daten\": {
    \"optimales_simile\": \"Name des Hauptmittels in Latein oder Fehlende Daten für Empfehlung\",
    \"begruendung\": \"Kurze Begründung\"
  },
  \"diagnose_fragen_fuer_therapeut\": {
    \"frage_1\": \"Leitfrage zu Modalitäten ODER eigene freie Beschreibung des Patienten (Originalworte)\",
    \"frage_2\": \"Leitfrage zu Begleitsymptomen ODER eigene freie Beschreibung des Patienten (Originalworte)\"
  },
  \"baumstruktur_popup_daten\": {
    \"start_knoten\": \"Ausgangssymptom\",
    \"haupt_differenzierungs_frage\": \"Differenzierungsfrage\",
    \"pfad_ja\": {
      \"bedingung\": \"Wenn ja\",
      \"folge_frage\": \"Nächste Frage\",
      \"ergebnis_ja\": \"Mittel\",
      \"ergebnis_nein\": \"Unvollständig\"
    },
    \"pfad_nein\": {
      \"bedingung\": \"Wenn nein\",
      \"folge_frage\": \"Warte auf Eingabe\",
      \"ergebnis_ja\": \"Unvollständig\",
      \"ergebnis_nein\": \"Unvollständig\"
    }
  }
}";

    $aiRes = callGeminiApi($prompt, false);
    if ($aiRes) {
        $raw = extractJsonFromText($aiRes);
        if (is_array($raw)) {
            $extraktion = $raw['extraktion'] ?? [
                'hauptbeschwerde' => $symptomText,
                'causa' => 'Unbekannt (Bitte erfragen)',
                'modalitaeten' => 'Unbekannt (Bitte erfragen)',
                'begleitsymptome' => 'Unbekannt (Bitte erfragen)'
            ];
            $app_layout_daten = $raw['app_layout_daten'] ?? [
                'optimales_simile' => 'Fehlende Daten für Empfehlung',
                'begruendung' => 'Informationen zur Differenzierung erforderlich.'
            ];
            $normalizedResult = [
                'extraktion' => $extraktion,
                'app_layout_daten' => $app_layout_daten,
                'diagnose_fragen_fuer_therapeut' => $raw['diagnose_fragen_fuer_therapeut'] ?? [
                    'frage_1' => 'Welche Modalitäten liegen vor?',
                    'frage_2' => 'Gibt es Begleitsymptome?'
                ],
                'baumstruktur_popup_daten' => $raw['baumstruktur_popup_daten'] ?? null,
                'extractedAnalysis' => $extraktion,
                'recommendedSimile' => [
                    'remedyName' => $app_layout_daten['optimales_simile'] ?? 'Fehlende Daten für Empfehlung',
                    'rationale' => $app_layout_daten['begruendung'] ?? ''
                ]
            ];
            echo json_encode(['result' => $normalizedResult]);
            exit;
        }
    }

    http_response_code(500);
    echo json_encode(['error' => 'Failed to repertorise via AI']);
    exit;
}

// =========================================================================
// DEFAULT: Route nicht gefunden
// =========================================================================
http_response_code(404);
echo json_encode(['error' => 'Endpoint not found', 'requestedRoute' => $route]);

