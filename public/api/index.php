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

    $models = ['gemini-3.8-flash', 'gemini-flash-latest'];

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
// DEFAULT: Route nicht gefunden
// =========================================================================
http_response_code(404);
echo json_encode(['error' => 'Endpoint not found', 'requestedRoute' => $route]);
