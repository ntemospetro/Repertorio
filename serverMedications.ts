import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

export interface SideEffectsByFrequency {
  veryCommon?: string[];   // Sehr häufig (≥ 1/10)
  common?: string[];       // Häufig (≥ 1/100 bis < 1/10)
  uncommon?: string[];     // Gelegentlich (≥ 1/1.000 bis < 1/100)
  rare?: string[];         // Selten (≥ 1/10.000 bis < 1/1.000)
  veryRare?: string[];     // Sehr selten (< 1/10.000)
}

export interface StoredMedication {
  name: string;
  activeSubstance?: string;
  category?: string;
  dosages: string[];
  packageSizes?: string[];
  commonForms?: string[];
  recommendedIntake?: string;
  sideEffectsByFrequency?: SideEffectsByFrequency;
  sideEffects: string[];
  interactions: string[];
  contraindications?: {
    absolute?: string[];
    relative?: string[];
  };
  warnings?: string;
  monographText?: string;
  authoritySource?: string;
  lastUpdated?: string;
  savedAt?: string;
  fromDatabase?: boolean;
}

const DATA_DIR = path.join(process.cwd(), "data");
const MEDICATIONS_DB_FILE = path.join(DATA_DIR, "medications_db.json");

// Core Seed Data according to official BfArM / EMA Fachinformationen
const SEED_MEDICATIONS: StoredMedication[] = [
  {
    name: "Ibuprofen",
    activeSubstance: "Ibuprofen",
    category: "NSAR / Nichtsteroidales Antirheumatikum",
    dosages: ["200 mg", "400 mg", "600 mg", "800 mg"],
    packageSizes: ["N1 (10-20 Stk.)", "N2 (50 Stk.)", "N3 (100 Stk.)"],
    commonForms: ["Filmtablette", "Granulat", "Zäpfchen", "Suspension"],
    recommendedIntake: "1-3x täglich unzerkaut mit einem Glas Wasser nach den Mahlzeiten",
    sideEffectsByFrequency: {
      veryCommon: ["Magen-Darm-Beschwerden wie Sodbrennen, Bauchschmerzen, Übelkeit, Dyspepsie"],
      common: ["Diarrhoe, Erbrechen, Obstipation, Blähungen, geringfügige Magen-Darm-Blutverluste", "Kopfschmerzen, Schwindelgefühl, Müdigkeit"],
      uncommon: ["Magen- oder Zwölffingerdarmgeschwüre (mit Blutungs- oder Perforationsgefahr)", "Ulzerative Stomatitis, Gastritis", "Hautausschläge, Pruritus, Urtikaria"],
      rare: ["Tinnitus, Hörstörungen", "Nierengewebsschädigungen (Papillennekrosen), Hyperurikämie"],
      veryRare: ["Agranulozytose, Thrombozytopenie, Leukopenie", "Schwere Hautreaktionen (Stevens-Johnson-Syndrom, DRESS)", "Herzinsuffizienz, Ödeme, Hypertonie"]
    },
    sideEffects: [
      "Magen-Darm-Beschwerden (Sodbrennen, Bauchschmerzen, Übelkeit)",
      "Erhöhtes Risiko für Magengeschwüre und gastrointestinale Blutungen",
      "Kopfschmerzen, Schwindel, Müdigkeit",
      "Beeinträchtigung der Nierenfunktion bei Dehydrierung oder Dauergebrauch",
      "Allergische Hautreaktionen oder Asthma-Anfälle"
    ],
    interactions: [
      "Andere NSAR und Acetylsalicylsäure (ASS): Stark erhöhtes Risiko für gastrointestinale Ulzera und Blutungen",
      "Antikoagulanzien und Thrombozytenaggregationshemmer (Marcumar, DOAK, ASS): Erhöhte Blutungsgefahr",
      "Antihypertensiva (ACE-Hemmer, Sartane, Betablocker): Wirkungsabschwächung der Blutdrucksenkung",
      "Lithium, Methotrexat, Digoxin: Erhöhte Serumspiegel und Toxizität",
      "Glukokortikoide: Verstärktes Risiko gastrointestinaler Läsionen",
      "Alkohol: Erhöhtes Risiko von Magenschleimhautblutungen"
    ],
    warnings: "Kontraindiziert bei aktiven peptischen Ulzera, schwerer Leber-, Nieren- oder Herzinsuffizienz sowie im 3. Schwangerschaftstrimester.",
    authoritySource: "BfArM / EMA Fachinformation",
    fromDatabase: true
  },
  {
    name: "Paracetamol",
    activeSubstance: "Paracetamol",
    category: "Analgetikum / Antipyretikum",
    dosages: ["125 mg", "250 mg", "500 mg", "1000 mg"],
    packageSizes: ["N1 (10 Stk.)", "N2 (20 Stk.)", "N3 (30 Stk.)"],
    commonForms: ["Tablette", "Brausetablette", "Zäpfchen", "Sirup"],
    recommendedIntake: "Alle 6-8 Stunden bei Schmerzen oder Fieber (Einzeldosis max. 1000 mg, Tageshöchstdosis 4000 mg)",
    sideEffectsByFrequency: {
      rare: ["Leichter Anstieg der Serumtransaminasen", "Hautausschlag, Erythem, Urtikaria"],
      veryRare: ["Thrombozytopenie, Leukopenie, Agranulozytose", "Bronchospasmus bei Analgetika-Asthma", "Schwere kutane Reaktionen (AGEP, TEN, SJS)"]
    },
    sideEffects: [
      "Hepatotoxizität (Leberschäden) bei Überdosierung (> 4 g/Tag)",
      "Selten allergische Hautreaktionen (Exanthem, Urtikaria)",
      "Sehr selten hämatologische Veränderungen (Thrombozytopenie, Leukopenie)"
    ],
    interactions: [
      "Alkohol: Stark erhöhtes Risiko für toxische Leberschäden",
      "Enzyminduktoren (Carbamazepin, Phenytoin, Rifampicin): Erhöhte Bildung lebertoxischer Metaboliten",
      "Cumarin-Antikoagulanzien (Warfarin, Phenprocoumon): Verstärkung der gerinnungshemmenden Wirkung bei Langzeiteinnahme"
    ],
    warnings: "Kontraindiziert bei schwerer Leberfunktionsstörung. Streng auf die maximale Tagesdosis achten.",
    authoritySource: "BfArM / EMA Fachinformation",
    fromDatabase: true
  },
  {
    name: "Ramipril",
    activeSubstance: "Ramipril",
    category: "ACE-Hemmer (Antihypertensivum)",
    dosages: ["1.25 mg", "2.5 mg", "5 mg", "10 mg"],
    packageSizes: ["N1 (20-28 Stk.)", "N2 (50 Stk.)", "N3 (98-100 Stk.)"],
    commonForms: ["Tablette"],
    recommendedIntake: "1x täglich morgens zur gleichen Zeit unabhängig von den Mahlzeiten mit etwas Wasser",
    sideEffectsByFrequency: {
      common: ["Trockener Reizhusten (charakteristischer ACE-Hemmer-Husten)", "Hypotonie, orthostatische Dysregulation, Schwindel", "Kopfschmerzen, Müdigkeit", "Hyperkaliämie (erhöhter Serumkaliumspiegel)"],
      uncommon: ["Gastrointestinale Beschwerden, Bauchschmerzen, Übelkeit", "Pruritus, Exanthem", "Vorübergehende Einschränkung der Nierenfunktion"],
      rare: ["Angioödem (Quincke-Ödem von Gesicht, Lippen, Zunge oder Glottis)", "Leukopenie, Neutropenie", "Cholestatische Gelbsucht"]
    },
    sideEffects: [
      "Trockener Reizhusten (charakteristischer ACE-Hemmer-Husten)",
      "Hypotonie, Schwindel, Müdigkeit",
      "Hyperkaliämie (erhöhter Kaliumspiegel)",
      "Angioödem (selten, aber potenziell lebensbedrohlich)",
      "Verschlechterung der Nierenfunktion"
    ],
    interactions: [
      "Kaliumsparende Diuretika (Spironolacton, Eplerenon) und Kaliumpräparate: Schwere Hyperkaliämie-Gefahr",
      "NSAR (Ibuprofen, Diclofenac): Wirkungsabschwächung und Verschlechterung der Nierenfunktion",
      "Lithium: Verminderte Lithiumausscheidung und erhöhte Toxizität",
      "Andere Antihypertensiva: Additive Blutdrucksenkung"
    ],
    warnings: "Kontraindiziert bei anamnestischem Angioödem, hämodynamisch relevanter Nierenarterienstenose und Schwangerschaft.",
    authoritySource: "BfArM / EMA / EOF Fachinformation",
    fromDatabase: true
  },
  {
    name: "Pantoprazol",
    activeSubstance: "Pantoprazol",
    category: "Protonenpumpeninhibitor (PPI / Magenschutz)",
    dosages: ["20 mg", "40 mg"],
    packageSizes: ["N1 (14-15 Stk.)", "N2 (30 Stk.)", "N3 (60-100 Stk.)"],
    commonForms: ["Magensaftresistente Tablette"],
    recommendedIntake: "1x täglich morgens ca. 30-60 Minuten vor dem Frühstück nüchtern mit Wasser",
    sideEffectsByFrequency: {
      common: ["Magen-Darm-Beschwerden (Bauchschmerzen, Diarrhoe, Obstipation, Flatulenz)", "Kopfschmerzen", "Fundusdrüsenpolypen"],
      uncommon: ["Schlafstörungen, Schwindel", "Hautausschlag, Pruritus", "Übelkeit, Erbrechen", "Leichter Anstieg der Leberenzyme"],
      rare: ["Agranulozytose, Thrombozytopenie", "Geschmacksstörungen, Sehstörungen", "Myalgie, Arthralgie"]
    },
    sideEffects: [
      "Kopfschmerzen, Schwindelgefühl",
      "Gastrointestinale Beschwerden (Durchfall, Verstopfung, Blähungen)",
      "Bei Langzeitanwendung: verminderte Aufnahme von Vitamin B12, Magnesium und Calcium",
      "Erhöhtes Risiko für Clostridioides-difficile-Infektionen"
    ],
    interactions: [
      "Wirkstoffe mit pH-abhängiger Resorption (Ketoconazol, Eisenpräparate, Atazanavir)",
      "Cumarin-Antikoagulanzien (INR-Schwankungen)",
      "Methotrexat: Mögliche Erhöhung des Methotrexat-Spiegels"
    ],
    warnings: "Langzeittherapie regelmäßig auf Indikation überprüfen. Beim Absetzen ausschleichen, um Säurerebound zu verhindern.",
    authoritySource: "BfArM / EMA / EOF Fachinformation",
    fromDatabase: true
  },
  {
    name: "L-Thyroxin",
    activeSubstance: "Levothyroxin-Natrium",
    category: "Schilddrüsenhormon",
    dosages: ["25 µg", "50 µg", "75 µg", "88 µg", "100 µg", "112 µg", "125 µg", "137 µg", "150 µg", "175 µg", "200 µg"],
    packageSizes: ["N1 (28-30 Stk.)", "N2 (50 Stk.)", "N3 (84-100 Stk.)"],
    commonForms: ["Tablette"],
    recommendedIntake: "1x täglich morgens nüchtern mindestens 30 Minuten vor dem Frühstück nur mit Wasser",
    sideEffectsByFrequency: {
      veryCommon: ["Bei Überdosierung: Tachykardie, Palpitationen, Herzrhythmusstörungen, Angina Pectoris"],
      common: ["Kopfschmerzen, Muskelschwäche, Hitzegefühl, Schwitzen, Gewichtsverlust, Diarrhoe", "Innere Unruhe, Tremor, Schlaflosigkeit"]
    },
    sideEffects: [
      "Bei Überdosierung: Herzrasen, Herzrhythmusstörungen, innere Unruhe, Zittern, Schwitzen, Schlafstörungen, Gewichtsabnahme"
    ],
    interactions: [
      "Calcium-, Eisen-, Aluminium- und Magnesiumpräparate: Mindestens 2 Stunden zeitlicher Abstand erforderlich",
      "Sojaprodukte und ballaststoffreiche Nahrungsmittel: Verminderte Levothyroxin-Aufnahme",
      "Cumarin-Derivate: Wirkungsverstärkung der Blutgerinnungshemmung",
      "Antidiabetika: Mögliche Abschwächung der blutzuckersenkenden Wirkung"
    ],
    warnings: "Nicht zur Gewichtsreduktion verwenden. Dosierung regelmäßig durch Serum-TSH-Werte kontrollieren.",
    authoritySource: "BfArM / EMA / EOF Fachinformation",
    fromDatabase: true
  },
  {
    name: "Metformin",
    activeSubstance: "Metforminhydrochlorid",
    category: "Oraler Antidiabetikum (Biguanid)",
    dosages: ["500 mg", "850 mg", "1000 mg"],
    packageSizes: ["N1 (30 Stk.)", "N2 (60-100 Stk.)", "N3 (120-180 Stk.)"],
    commonForms: ["Filmtablette"],
    recommendedIntake: "Mit oder direkt nach den Mahlzeiten einnehmen, um gastrointestinale Nebenwirkungen zu minimieren",
    sideEffectsByFrequency: {
      veryCommon: ["Magen-Darm-Beschwerden (Übelkeit, Erbrechen, Diarrhoe, Bauchschmerzen, Appetitverlust)"],
      common: ["Geschmacksstörungen (metallischer Geschmack)", "Vitamin-B12-Mangel bei Langzeitbehandlung"],
      veryRare: ["Laktatazidose (schwerwiegende metabolische Komplikation)", "Abnorme Leberfunktionswerte, Hepatitis", "Erythem, Pruritus, Urtikaria"]
    },
    sideEffects: [
      "Gastrointestinale Beschwerden (Übelkeit, Diarrhoe, Blähungen, metallischer Geschmack)",
      "Laktatazidose (sehr selten, aber potenziell lebensbedrohlich bei Niereninsuffizienz)",
      "Vitamin-B12-Mangel bei Dauertherapie"
    ],
    interactions: [
      "Jodhaltige Kontrastmittel: Risiko von Laktatazidose und akutem Nierenversagen (Metformin vorab absetzen)",
      "Alkohol: Stark erhöhtes Risiko für Laktatazidose",
      "NSAR und ACE-Hemmer: Risiko einer Nierenfunktionseinschränkung"
    ],
    warnings: "Kontraindiziert bei schwerer Niereninsuffizienz (GFR < 30 ml/min), Dehydratation, Sepsis, Herz- oder Ateminsuffizienz.",
    authoritySource: "BfArM / EMA / EOF Fachinformation",
    fromDatabase: true
  },
  {
    name: "Amlodipin",
    activeSubstance: "Amlodipin",
    category: "Calciumkanalblocker (Dihydropyridin-Typ)",
    dosages: ["5 mg", "10 mg"],
    packageSizes: ["N1 (20-30 Stk.)", "N2 (50 Stk.)", "N3 (98-100 Stk.)"],
    commonForms: ["Tablette"],
    recommendedIntake: "1x täglich morgens unzerkaut mit einem Glas Wasser",
    sideEffectsByFrequency: {
      veryCommon: ["Periphere Ödeme (Knöchelschwellungen)"],
      common: ["Kopfschmerzen, Schwindel, Somnolenz", "Flush (Gesichtsrötung mit Hitzegefühl), Palpitationen", "Bauchschmerzen, Übelkeit, Dyspepsie", "Müdigkeit, Asthenie"],
      uncommon: ["Hypotonie, Synkope, Bradykardie", "Pruritus, Rash, Alopezie", "Muskelkrämpfe, Arthralgien"]
    },
    sideEffects: [
      "Periphere Ödeme (Knöchelschwellungen)",
      "Kopfschmerzen, Schwindel, Flush",
      "Müdigkeit, Palpitationen"
    ],
    interactions: [
      "Grapefruitsaft: Erhöht die Bioverfügbarkeit von Amlodipin und verstärkt hypotensive Wirkung",
      "Simvastatin: Erhöhtes Risiko für Rhabdomyolyse; Simvastatin-Tagesdosis auf max. 20 mg begrenzen",
      "CYP3A4-Inhibitoren (Ketoconazol, Clarithromycin): Verstärkte Amlodipin-Wirkung"
    ],
    warnings: "Vorsicht bei schwerer Aortenstenose und dekompensierter Herzinsuffizienz.",
    authoritySource: "BfArM / EMA / EOF Fachinformation",
    fromDatabase: true
  },
  {
    name: "Bisoprolol",
    activeSubstance: "Bisoprolol",
    category: "Kardioselektiver Betablocker",
    dosages: ["1.25 mg", "2.5 mg", "3.75 mg", "5 mg", "7.5 mg", "10 mg"],
    packageSizes: ["N1 (20-30 Stk.)", "N2 (50 Stk.)", "N3 (98-100 Stk.)"],
    commonForms: ["Tablette"],
    recommendedIntake: "1x täglich morgens mit etwas Flüssigkeit zum Frühstück",
    sideEffectsByFrequency: {
      common: ["Bradykardie (verlangsamter Puls), Blutdruckabfall", "Kältegefühl oder Taubheit in den Extremitäten", "Kopfschmerzen, Schwindelgefühl", "Gastrointestinale Beschwerden, Müdigkeit"],
      uncommon: ["AV-Überleitungsstörungen, Verschlechterung der Herzinsuffizienz", "Bronchospasmus bei Asthma bronchiale", "Muskelschwäche, Krämpfe"]
    },
    sideEffects: [
      "Bradykardie, Hypotonie, Schwindel, Müdigkeit",
      "Kältegefühl in Händen und Füßen",
      "Gastrointestinale Beschwerden",
      "Bronchospasmus bei vorbestehendem Asthma"
    ],
    interactions: [
      "Calciumantagonisten vom Verapamil- oder Diltiazem-Typ: Gefahr schwerer Bradykardie und AV-Block",
      "Antidiabetika / Insulin: Maskierung von Warnsymptomen einer Unterzuckerung (wie Tachykardie)",
      "Digitalisglykoside: Additive Verlangsamung der kardialen Überleitung"
    ],
    warnings: "Niemals abrupt absetzen (Rebound-Phänomen). Schrittweise über mindestens 1-2 Wochen ausschleichen.",
    authoritySource: "BfArM / EMA / EOF Fachinformation",
    fromDatabase: true
  }
];

// Helper to ensure data directory and database file exist
export function ensureMedicationsDatabase(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(MEDICATIONS_DB_FILE)) {
      fs.writeFileSync(MEDICATIONS_DB_FILE, JSON.stringify(SEED_MEDICATIONS, null, 2), "utf-8");
      console.log(`[MedicationAssistant] Initialized medications database with ${SEED_MEDICATIONS.length} core items.`);
    }
  } catch (err) {
    console.error("[MedicationAssistant] Failed to initialize database file:", err);
  }
}

// -----------------------------------------------------------------------------------
// Schritt 1 (Datenbank prüfen):
// Schau zuerst in unserer eigenen Datenbank über das Werkzeug search_database(medikament_name) nach.
// Wenn das Medikament dort vollständig gefunden wird: Verwende ausschließlich diese Daten.
// -----------------------------------------------------------------------------------
export function search_database(medikament_name: string): {
  found: boolean;
  isComplete: boolean;
  matches: StoredMedication[];
  bestMatch?: StoredMedication;
} {
  try {
    ensureMedicationsDatabase();
    if (!fs.existsSync(MEDICATIONS_DB_FILE)) {
      return { found: false, isComplete: false, matches: [] };
    }

    const raw = fs.readFileSync(MEDICATIONS_DB_FILE, "utf-8");
    const db: StoredMedication[] = JSON.parse(raw);
    if (!Array.isArray(db)) {
      return { found: false, isComplete: false, matches: [] };
    }

    const q = (medikament_name || "").toLowerCase().trim();
    if (!q) return { found: false, isComplete: false, matches: [] };

    // Exact or prefix matching
    const exactMatches = db.filter((m) => {
      const name = (m.name || "").toLowerCase().trim();
      const active = (m.activeSubstance || "").toLowerCase().trim();
      return name === q || active === q;
    });

    const partialMatches = db.filter((m) => {
      const name = (m.name || "").toLowerCase().trim();
      const active = (m.activeSubstance || "").toLowerCase().trim();
      const cat = (m.category || "").toLowerCase().trim();
      return (
        name.includes(q) ||
        active.includes(q) ||
        cat.includes(q) ||
        q.includes(name) ||
        (active && q.includes(active))
      );
    });

    const allMatches = exactMatches.length > 0 ? exactMatches : partialMatches;

    if (allMatches.length === 0) {
      return { found: false, isComplete: false, matches: [] };
    }

    // Check if best match is complete (has dosages, packageSizes or sideEffects)
    const best = allMatches[0];
    const isComplete = Boolean(
      best.name &&
      Array.isArray(best.dosages) &&
      best.dosages.length > 0 &&
      (best.sideEffects?.length || best.sideEffectsByFrequency)
    );

    return {
      found: true,
      isComplete,
      matches: allMatches,
      bestMatch: best
    };
  } catch (err) {
    console.error("[MedicationAssistant] search_database error:", err);
    return { found: false, isComplete: false, matches: [] };
  }
}

// -----------------------------------------------------------------------------------
// Schritt 2 (Externe Behördensuche, falls nicht vorhanden):
// Wenn das Medikament nicht in der Datenbank liegt:
// Nutze das Werkzeug search_health_authority(medikament_name). Suche gezielt auf den offiziellen
// Behördenseiten (ema.europa.eu, bfarm.de, eof.gr oder Fachinformationen der Hersteller).
// Extrahiere daraus exakt: Handelsname, Wirkstoff, alle verfügbaren Dosierungen, Packungsgrößen
// und die Nebenwirkungen (gegliedert nach Häufigkeit).
// -----------------------------------------------------------------------------------
export async function search_health_authority(
  medikament_name: string,
  ai: GoogleGenAI,
  extractJsonFn: (text: string) => any
): Promise<StoredMedication[]> {
  const query = medikament_name.trim();
  if (!query) return [];

  const prompt = `Du bist ein pharmazeutischer Assistent für medizinisches und therapeutisches Fachpersonal.
Wenn der Nutzer nach einem Medikament, dessen Dosierungen, Packungsgrößen oder Nebenwirkungen fragt, recherchiere gezielt auf den offiziellen Behördenseiten:
- ema.europa.eu (Europäische Arzneimittel-Agentur)
- bfarm.de (Bundesinstitut für Arzneimittel und Medizinprodukte)
- eof.gr (National Organization for Medicines Greece)
- Offizielle Fachinformationen (SPC) der Hersteller und Rote Liste

Recherchiere das Medikament / den Wirkstoff: "${query}".

WICHTIGSTE VORGABE: Es dürfen KEINE Daten erfunden oder geschätzt werden. Alle Angaben müssen zwingend der behördlichen Fachinformation (BfArM, EMA, Rote Liste, SPC) entsprechen. Wenn zu einem Bereich keine Daten gefunden werden, darf nichts hinzugedacht werden – schreibe dann strikt 'Keine behördlichen Angaben in der Fachinformation hinterlegt'.

Extrahiere daraus exakt:
1. Handelsname (offizieller Präparatename)
2. Wirkstoff (INN)
3. Wirkstoffgruppe / therapeutische Indikation
4. Alle verfügbaren Dosierungen (z.B. ["20 mg", "40 mg", "80 mg"])
5. Packungsgrößen (z.B. ["N1 (14 Stk.)", "N2 (28 Stk.)", "N3 (98 Stk.)", "100 Tabletten"])
6. Darreichungsformen (z.B. ["Filmtabletten", "Kapseln"])
7. Empfohlene Einnahmeart & Dosierungsschema (z.B. "1x täglich morgens nüchtern mit Wasser")
8. Nebenwirkungen gegliedert nach Häufigkeit (streng nach Fachinformations-Kategorien):
   - veryCommon: Sehr häufig (≥ 1/10)
   - common: Häufig (≥ 1/100 bis < 1/10)
   - uncommon: Gelegentlich (≥ 1/1.000 bis < 1/100)
   - rare: Selten (≥ 1/10.000 bis < 1/1.000)
   - veryRare: Sehr selten (< 1/10.000)
9. Relevante Wechselwirkungen mit anderen Arzneimitteln, Nahrungsmitteln oder Alkohol
10. Wichtige Kontraindikationen gegliedert nach "absolute" (Anwendung ausgeschlossen) und "relative" (Besondere Vorsicht)
11. Zusammenfassende Warnhinweise ("warnings")
12. Erzeuge das Feld "monographText": Einen zusammenhängenden, flüssigen Fließtext (keine Tabelle) mit exakt folgender Gliederung und fetten Überschriften:
    Hier ist die komplette Übersicht zu [Handelsname] ([Wirkstoff]) mit allen wichtigen Informationen zu Inhaltsstoffen, Dosierung, Nebenwirkungen, Kontraindikationen und Wechselwirkungen, übersichtlich für dich zusammengefasst.

    📝 1. Wirkstoff und Inhaltsstoffe
    ...
    💊 2. Dosierung & Anwendung
    ...
    ⚠️ 3. Nebenwirkungen
    ...
    🚫 4. Kontraindikationen (Gegenanzeigen)
    ...
    ❌ 5. Gefährliche Wechselwirkungen
    ...

Antworte AUSSCHLIESSLICH mit einem validen JSON-Array (auch wenn nur 1 Medikament gefunden wird, Array verwenden):
[
  {
    "name": "Handelsname",
    "activeSubstance": "Wirkstoff",
    "category": "Wirkstoffklasse",
    "dosages": ["..."],
    "packageSizes": ["..."],
    "commonForms": ["..."],
    "recommendedIntake": "...",
    "sideEffectsByFrequency": {
      "veryCommon": ["..."],
      "common": ["..."],
      "uncommon": ["..."],
      "rare": ["..."],
      "veryRare": ["..."]
    },
    "sideEffects": ["..."],
    "interactions": ["..."],
    "contraindications": {
      "absolute": ["..."],
      "relative": ["..."]
    },
    "warnings": "...",
    "monographText": "...",
    "authoritySource": "Offizielle Fachinformation (BfArM / EMA / EOF)"
  }
]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const parsed = extractJsonFn(response.text || "");
    const list: StoredMedication[] = [];

    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item && item.name) {
          list.push(normalizeMedicationItem(item));
        }
      }
    } else if (parsed && typeof parsed === "object" && parsed.name) {
      list.push(normalizeMedicationItem(parsed));
    }

    return list;
  } catch (err) {
    console.error("[MedicationAssistant] search_health_authority error:", err);
    return [];
  }
}

// -----------------------------------------------------------------------------------
// Schritt 3 (Automatisch Abspeichern):
// Rufe direkt danach das Werkzeug save_to_database(daten_json) auf, um die neu gefundenen
// Daten dauerhaft in unserer Datenbank zu sichern.
// -----------------------------------------------------------------------------------
export function save_to_database(daten_json: StoredMedication | StoredMedication[]): {
  success: boolean;
  savedCount: number;
} {
  try {
    ensureMedicationsDatabase();
    const items = Array.isArray(daten_json) ? daten_json : [daten_json];
    if (items.length === 0) return { success: true, savedCount: 0 };

    let db: StoredMedication[] = [];
    if (fs.existsSync(MEDICATIONS_DB_FILE)) {
      try {
        const raw = fs.readFileSync(MEDICATIONS_DB_FILE, "utf-8");
        db = JSON.parse(raw);
        if (!Array.isArray(db)) db = [];
      } catch (readErr) {
        console.warn("[MedicationAssistant] Could not parse existing DB, resetting:", readErr);
        db = [];
      }
    }

    let count = 0;
    const now = new Date().toISOString();

    for (const item of items) {
      if (!item || !item.name || item.name.trim().length === 0) continue;
      const normalized = normalizeMedicationItem(item);
      normalized.lastUpdated = now;
      normalized.savedAt = normalized.savedAt || now;
      normalized.fromDatabase = true;

      const normName = normalized.name.toLowerCase().trim();
      const existingIdx = db.findIndex(
        (m) => (m.name || "").toLowerCase().trim() === normName
      );

      if (existingIdx >= 0) {
        // Update existing record with richer data
        db[existingIdx] = {
          ...db[existingIdx],
          ...normalized,
          dosages: Array.from(new Set([...(db[existingIdx].dosages || []), ...(normalized.dosages || [])])),
          packageSizes: Array.from(new Set([...(db[existingIdx].packageSizes || []), ...(normalized.packageSizes || [])])),
          commonForms: Array.from(new Set([...(db[existingIdx].commonForms || []), ...(normalized.commonForms || [])])),
          sideEffects: Array.from(new Set([...(db[existingIdx].sideEffects || []), ...(normalized.sideEffects || [])])),
          interactions: Array.from(new Set([...(db[existingIdx].interactions || []), ...(normalized.interactions || [])]))
        };
      } else {
        db.push(normalized);
      }
      count++;
    }

    // Atomic write
    const tempFile = `${MEDICATIONS_DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), "utf-8");
    fs.renameSync(tempFile, MEDICATIONS_DB_FILE);

    console.log(`[MedicationAssistant] Successfully saved ${count} item(s) to permanent database. Total in DB: ${db.length}`);
    return { success: true, savedCount: count };
  } catch (err) {
    console.error("[MedicationAssistant] save_to_database error:", err);
    return { success: false, savedCount: 0 };
  }
}

function buildServerMedicationMonograph(m: {
  name: string;
  activeSubstance?: string;
  category?: string;
  dosages?: string[];
  commonForms?: string[];
  recommendedIntake?: string;
  sideEffectsByFrequency?: SideEffectsByFrequency;
  sideEffects?: string[];
  interactions?: string[];
  contraindications?: { absolute?: string[]; relative?: string[] };
  warnings?: string;
}): string {
  const name = m.name;
  const activeSub = m.activeSubstance || name;
  const intro = `Hier ist die komplette Übersicht zu ${name} (${activeSub}) mit allen wichtigen Informationen zu Inhaltsstoffen, Dosierung, Nebenwirkungen, Kontraindikationen und Wechselwirkungen, übersichtlich für dich zusammengefasst.`;

  // 1. Wirkstoff und Inhaltsstoffe
  const cat = m.category || 'Fachinformation';
  const forms = Array.isArray(m.commonForms) && m.commonForms.length > 0 ? m.commonForms.join(', ') : 'Tablette';
  const sec1 = `📝 1. Wirkstoff und Inhaltsstoffe\n${name} gehört zur Gruppe: ${cat}.\nHauptwirkstoff: ${activeSub}.\nDarreichungsformen: ${forms}. Hilfsstoffe sind der jeweiligen herstellerspezifischen Packungsbeilage zu entnehmen.`;

  // 2. Dosierung & Anwendung
  const dosages = Array.isArray(m.dosages) && m.dosages.length > 0 ? m.dosages.join(', ') : 'Standard';
  const intake = m.recommendedIntake || 'Nach ärztlicher Anweisung einnehmen.';
  const sec2 = `💊 2. Dosierung & Anwendung\nDie Dosierung von ${name} (${activeSub}) wird von der behandelnden Ärztin oder dem Arzt streng individuell festgelegt. Es gilt der Grundsatz, das Medikament so niedrig dosiert und so kurz bzw. indikationsgerecht wie möglich anzuwenden, um Risiken zu minimieren.\nVerfügbare Dosierungsstärken: ${dosages}.\nEinnahmeempfehlung: ${intake}\nÄltere oder geschwächte Patienten: Bei älteren Personen oder Personen mit eingeschränkter Organfunktion ist eine Dosisanpassung nach ärztlicher Rücksprache essenziell.`;

  // 3. Nebenwirkungen
  let nwContent = '';
  if (m.sideEffectsByFrequency && typeof m.sideEffectsByFrequency === 'object') {
    const parts: string[] = [];
    if (m.sideEffectsByFrequency.veryCommon?.length) parts.push(`Sehr häufig (≥ 1/10): ${m.sideEffectsByFrequency.veryCommon.join(', ')}.`);
    if (m.sideEffectsByFrequency.common?.length) parts.push(`Häufig (≥ 1/100 bis < 1/10): ${m.sideEffectsByFrequency.common.join(', ')}.`);
    if (m.sideEffectsByFrequency.uncommon?.length) parts.push(`Gelegentlich (≥ 1/1.000 bis < 1/100): ${m.sideEffectsByFrequency.uncommon.join(', ')}.`);
    if (m.sideEffectsByFrequency.rare?.length) parts.push(`Selten (≥ 1/10.000 bis < 1/1.000): ${m.sideEffectsByFrequency.rare.join(', ')}.`);
    if (m.sideEffectsByFrequency.veryRare?.length) parts.push(`Sehr selten (< 1/10.000): ${m.sideEffectsByFrequency.veryRare.join(', ')}.`);
    if (parts.length > 0) nwContent = parts.join('\n');
  }
  if (!nwContent && Array.isArray(m.sideEffects) && m.sideEffects.length > 0) {
    nwContent = `Häufige Begleiterscheinungen:\n${m.sideEffects.join('; ')}.`;
  }
  if (!nwContent) {
    nwContent = 'Keine behördlichen Angaben zu Nebenwirkungen in der Fachinformations-Kurzfassung hinterlegt.';
  }
  const risks = m.warnings || 'Keine gesonderten Risikohinweise in der Kurzinformation vermerkt.';
  const sec3 = `⚠️ 3. Nebenwirkungen\n${nwContent}\nBesondere Risiken:\n${risks}`;

  // 4. Kontraindikationen (Gegenanzeigen)
  let sec4 = `🚫 4. Kontraindikationen (Gegenanzeigen)\nUnter bestimmten gesundheitlichen Bedingungen darf ${name} entweder gar nicht oder nur nach strenger ärztlicher Nutzen-Risiko-Abwägung angewendet werden.`;
  if (m.contraindications && (m.contraindications.absolute?.length || m.contraindications.relative?.length)) {
    if (m.contraindications.absolute?.length) {
      sec4 += `\nAbsolute Gegenanzeigen (Anwendung ausgeschlossen):\n${m.contraindications.absolute.join(';\n')}.`;
    }
    if (m.contraindications.relative?.length) {
      sec4 += `\nRelative Gegenanzeigen (Besondere Vorsicht erforderlich):\n${m.contraindications.relative.join(';\n')}.`;
    }
  } else if (m.warnings) {
    sec4 += `\nBehördliche Gegenanzeigen & Vorsichtsmaßnahmen:\n${m.warnings}`;
  } else {
    sec4 += `\nKeine gesonderten behördlichen Gegenanzeigen in den erfassten Daten hinterlegt.`;
  }

  // 5. Gefährliche Wechselwirkungen
  let sec5 = `❌ 5. Gefährliche Wechselwirkungen\nDie Kombination von ${name} mit bestimmten anderen Substanzen kann die Wirkung unvorhersehbar verändern oder unerwünschte Reaktionen hervorrufen.`;
  if (Array.isArray(m.interactions) && m.interactions.length > 0) {
    sec5 += '\n' + m.interactions.map(i => `${i}.`).join('\n');
  } else {
    sec5 += '\nKeine spezifischen Wechselwirkungen in den erfassten behördlichen Daten hinterlegt.';
  }

  return `${intro}\n\n${sec1}\n\n${sec2}\n\n${sec3}\n\n${sec4}\n\n${sec5}`;
}

// Helper to normalize and guarantee complete data shape
function normalizeMedicationItem(raw: any): StoredMedication {
  const name = String(raw.name || "").trim();
  const activeSubstance = raw.activeSubstance ? String(raw.activeSubstance).trim() : undefined;
  const category = raw.category ? String(raw.category).trim() : undefined;
  
  const dosages: string[] = Array.isArray(raw.dosages)
    ? raw.dosages.map((d: any) => String(d).trim()).filter(Boolean)
    : (raw.defaultDosages ? raw.defaultDosages : ["Standard"]);

  const packageSizes: string[] = Array.isArray(raw.packageSizes)
    ? raw.packageSizes.map((p: any) => String(p).trim()).filter(Boolean)
    : [];

  const commonForms: string[] = Array.isArray(raw.commonForms)
    ? raw.commonForms.map((f: any) => String(f).trim()).filter(Boolean)
    : [];

  const recommendedIntake = raw.recommendedIntake ? String(raw.recommendedIntake).trim() : undefined;

  let sideEffectsByFrequency: SideEffectsByFrequency | undefined = undefined;
  if (raw.sideEffectsByFrequency && typeof raw.sideEffectsByFrequency === "object") {
    sideEffectsByFrequency = {
      veryCommon: Array.isArray(raw.sideEffectsByFrequency.veryCommon) ? raw.sideEffectsByFrequency.veryCommon : [],
      common: Array.isArray(raw.sideEffectsByFrequency.common) ? raw.sideEffectsByFrequency.common : [],
      uncommon: Array.isArray(raw.sideEffectsByFrequency.uncommon) ? raw.sideEffectsByFrequency.uncommon : [],
      rare: Array.isArray(raw.sideEffectsByFrequency.rare) ? raw.sideEffectsByFrequency.rare : [],
      veryRare: Array.isArray(raw.sideEffectsByFrequency.veryRare) ? raw.sideEffectsByFrequency.veryRare : []
    };
  }

  // Flatten side effects if not already provided
  let sideEffects: string[] = Array.isArray(raw.sideEffects)
    ? raw.sideEffects.map((s: any) => String(s).trim()).filter(Boolean)
    : [];

  if (sideEffects.length === 0 && sideEffectsByFrequency) {
    const collected = [
      ...(sideEffectsByFrequency.veryCommon || []),
      ...(sideEffectsByFrequency.common || []),
      ...(sideEffectsByFrequency.uncommon || []),
      ...(sideEffectsByFrequency.rare || [])
    ];
    sideEffects = Array.from(new Set(collected));
  }

  const interactions: string[] = Array.isArray(raw.interactions)
    ? raw.interactions.map((i: any) => String(i).trim()).filter(Boolean)
    : [];

  let contraindications: { absolute?: string[]; relative?: string[] } | undefined = undefined;
  if (raw.contraindications && typeof raw.contraindications === "object") {
    contraindications = {
      absolute: Array.isArray(raw.contraindications.absolute) ? raw.contraindications.absolute.map(String) : [],
      relative: Array.isArray(raw.contraindications.relative) ? raw.contraindications.relative.map(String) : []
    };
  }

  const warnings = raw.warnings ? String(raw.warnings).trim() : undefined;
  const authoritySource = raw.authoritySource || "BfArM / EMA / EOF Fachinformation";

  let monographText = raw.monographText && typeof raw.monographText === "string" && raw.monographText.trim().length > 30
    ? raw.monographText.trim()
    : undefined;

  if (!monographText) {
    monographText = buildServerMedicationMonograph({
      name,
      activeSubstance,
      category,
      dosages,
      commonForms,
      recommendedIntake,
      sideEffectsByFrequency,
      sideEffects,
      interactions,
      contraindications,
      warnings
    });
  }

  return {
    name,
    activeSubstance,
    category,
    dosages: dosages.length > 0 ? dosages : ["Standard"],
    packageSizes,
    commonForms,
    recommendedIntake,
    sideEffectsByFrequency,
    sideEffects,
    interactions,
    contraindications,
    warnings,
    monographText,
    authoritySource,
    fromDatabase: true
  };
}

// -----------------------------------------------------------------------------------
// Full 3-Step Coordinator:
// 1. search_database
// 2. If missing/incomplete -> search_health_authority
// 3. save_to_database
// 4. Return final response
// -----------------------------------------------------------------------------------
export async function run3StepMedicationSearch(
  query: string,
  ai: GoogleGenAI | null,
  extractJsonFn: (text: string) => any
): Promise<{
  results: StoredMedication[];
  fromDatabase: boolean;
  stepExecuted: "database_match" | "authority_researched_and_saved";
  totalInDb: number;
}> {
  ensureMedicationsDatabase();
  const trimmed = query.trim();
  if (!trimmed) {
    return { results: [], fromDatabase: false, stepExecuted: "database_match", totalInDb: 0 };
  }

  // SCHRITT 1: Datenbank prüfen
  const dbCheck = search_database(trimmed);
  if (dbCheck.found && dbCheck.isComplete && dbCheck.matches.length > 0) {
    // Liegt vollständig in der Datenbank vor: Verwende ausschließlich diese Daten!
    return {
      results: dbCheck.matches,
      fromDatabase: true,
      stepExecuted: "database_match",
      totalInDb: getDatabaseCount()
    };
  }

  // SCHRITT 2: Externe Behördensuche (falls nicht oder unvollständig in der Datenbank)
  if (!ai) {
    // Falls keine KI-Verbindung, gib vorhandene Teil-Treffer aus der DB zurück
    return {
      results: dbCheck.matches,
      fromDatabase: true,
      stepExecuted: "database_match",
      totalInDb: getDatabaseCount()
    };
  }

  console.log(`[MedicationAssistant] Step 2: Medication "${trimmed}" not complete in local DB. Searching health authorities (BfArM, EMA, EOF)...`);
  const authorityResults = await search_health_authority(trimmed, ai, extractJsonFn);

  if (authorityResults.length > 0) {
    // SCHRITT 3: Automatisch Abspeichern in eigener Datenbank
    console.log(`[MedicationAssistant] Step 3: Automatically saving ${authorityResults.length} researched medication(s) to permanent DB...`);
    save_to_database(authorityResults);

    return {
      results: authorityResults,
      fromDatabase: false,
      stepExecuted: "authority_researched_and_saved",
      totalInDb: getDatabaseCount()
    };
  }

  // Fallback: Return whatever we have in DB
  return {
    results: dbCheck.matches,
    fromDatabase: true,
    stepExecuted: "database_match",
    totalInDb: getDatabaseCount()
  };
}

export async function run3StepMedicationDetails(
  name: string,
  ai: GoogleGenAI | null,
  extractJsonFn: (text: string) => any
): Promise<{
  details: StoredMedication | null;
  fromDatabase: boolean;
  stepExecuted: "database_match" | "authority_researched_and_saved";
}> {
  ensureMedicationsDatabase();
  const trimmed = name.trim();
  if (!trimmed) {
    return { details: null, fromDatabase: false, stepExecuted: "database_match" };
  }

  // SCHRITT 1: Datenbank prüfen
  const dbCheck = search_database(trimmed);
  if (dbCheck.found && dbCheck.isComplete && dbCheck.bestMatch) {
    return {
      details: dbCheck.bestMatch,
      fromDatabase: true,
      stepExecuted: "database_match"
    };
  }

  // SCHRITT 2: Externe Behördensuche
  if (!ai) {
    return {
      details: dbCheck.bestMatch || null,
      fromDatabase: Boolean(dbCheck.bestMatch),
      stepExecuted: "database_match"
    };
  }

  console.log(`[MedicationAssistant] Step 2: Querying health authorities for details on "${trimmed}"...`);
  const authorityResults = await search_health_authority(trimmed, ai, extractJsonFn);

  if (authorityResults.length > 0) {
    const item = authorityResults[0];
    // SCHRITT 3: Automatisch Abspeichern
    save_to_database(item);

    return {
      details: item,
      fromDatabase: false,
      stepExecuted: "authority_researched_and_saved"
    };
  }

  return {
    details: dbCheck.bestMatch || null,
    fromDatabase: Boolean(dbCheck.bestMatch),
    stepExecuted: "database_match"
  };
}

export function getDatabaseCount(): number {
  try {
    ensureMedicationsDatabase();
    if (!fs.existsSync(MEDICATIONS_DB_FILE)) return 0;
    const raw = fs.readFileSync(MEDICATIONS_DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}
