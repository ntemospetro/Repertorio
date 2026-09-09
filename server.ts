import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import {
  run3StepMedicationSearch,
  run3StepMedicationDetails,
  search_database,
  save_to_database,
  getDatabaseCount,
  ensureMedicationsDatabase
} from "./serverMedications";
import {
  getRawStripeConfig,
  saveStripeConfig,
  maskKey,
  getStripeClient,
  getStoredBalances,
  getTherapistBalanceRecord,
  deductUsageFromBalance,
  creditDepositToBalance,
  updateTherapistBalanceConfig,
  getPaymentLogs,
  addPaymentLog,
} from "./serverStripe";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({
    limit: "50mb",
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Country & Language Detection Endpoint (GET, POST, OPTIONS, HEAD with or without trailing slash)
  app.all(["/api/detect-country", "/api/detect-country/"], (req, res) => {
    const cfCountry = req.headers["cf-ipcountry"] || req.headers["x-country-code"] || req.headers["x-appengine-country"];
    let detectedCountry = typeof cfCountry === "string" ? cfCountry.toUpperCase() : "";

    if (!detectedCountry) {
      const acceptLang = req.headers["accept-language"] || "";
      if (acceptLang.includes("el") || acceptLang.includes("gr")) detectedCountry = "GR";
      else if (acceptLang.includes("de")) detectedCountry = "DE";
      else if (acceptLang.includes("fr")) detectedCountry = "FR";
      else if (acceptLang.includes("es")) detectedCountry = "ES";
      else if (acceptLang.includes("it")) detectedCountry = "IT";
      else if (acceptLang.includes("ru")) detectedCountry = "RU";
      else if (acceptLang.includes("en")) detectedCountry = "GB";
    }

    const COUNTRY_LANG_MAP: Record<string, string> = {
      GR: "el", CY: "el",
      DE: "de", AT: "de", CH: "de", LI: "de",
      FR: "fr", BE: "fr", MC: "fr", LU: "fr",
      ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es",
      IT: "it", SM: "it", VA: "it",
      RU: "ru", BY: "ru", KZ: "ru",
      GB: "en", US: "en", CA: "en", AU: "en", IE: "en",
    };

    const finalCountry = detectedCountry || "DE";
    const finalLanguage = COUNTRY_LANG_MAP[finalCountry] || "de";

    res.json({
      countryCode: finalCountry,
      language: finalLanguage,
    });
  });

  // Persistent Data Directory & File Paths
  const DATA_DIR = path.join(process.cwd(), 'data');
  const ADMIN_CONFIG_FILE = path.join(DATA_DIR, 'admin_config.json');
  const SITE_CONFIG_FILE = path.join(DATA_DIR, 'site_config.json');
  const EMAIL_CONFIG_FILE = path.join(DATA_DIR, 'email_config.json');
  const TOKEN_USAGE_FILE = path.join(DATA_DIR, 'token_usage_logs.json');
  const TOKEN_RATES_FILE = path.join(DATA_DIR, 'token_rates.json');
  const MEDICATION_TRANSLATIONS_FILE = path.join(DATA_DIR, 'medication_translations.json');

  const getMedicationTranslations = (): Record<string, any> => {
    ensureDataDir();
    if (fs.existsSync(MEDICATION_TRANSLATIONS_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(MEDICATION_TRANSLATIONS_FILE, 'utf-8'));
      } catch {}
    }
    return {};
  };

  const saveMedicationTranslation = (key: string, data: any) => {
    try {
      ensureDataDir();
      const map = getMedicationTranslations();
      map[key] = data;
      fs.writeFileSync(MEDICATION_TRANSLATIONS_FILE, JSON.stringify(map, null, 2), 'utf-8');
    } catch (err) {
      console.error("Error saving medication translation:", err);
    }
  };

  const DEFAULT_TOKEN_RATES = {
    inputPerMillionEur: 0.69,
    outputPerMillionEur: 3.45,
    cachedPerMillionEur: 0.069,
    currency: '€',
    modelTiers: [
      {
        modelId: 'gemini-3.8-flash',
        modelName: 'Gemini 3.8 Flash (Klinische Fallanalysen & Repertorisation)',
        purpose: 'Hauptmodell: Vollständige Repertorisation, Miasmen & Toxikologie',
        costInputPerMillionEur: 0.69,
        costOutputPerMillionEur: 3.45,
        costCachedPerMillionEur: 0.069,
        costInput2027PerMillionEur: 1.38,
        costOutput2027PerMillionEur: 6.90,
        costCached2027PerMillionEur: 0.138,
        customerInputPerMillionEur: 1.50,
        customerOutputPerMillionEur: 7.50,
        customerCachedPerMillionEur: 0.20,
      },
      {
        modelId: 'gemini-2.5-flash',
        modelName: 'Gemini 2.5 Flash (Mehrsprachige Lokalisierung & Recherche)',
        purpose: 'Standard-Recherche, Monographien & Übersetzungen in 7 Sprachen',
        costInputPerMillionEur: 0.14,
        costOutputPerMillionEur: 0.55,
        costCachedPerMillionEur: 0.035,
        costInput2027PerMillionEur: 0.14,
        costOutput2027PerMillionEur: 0.55,
        costCached2027PerMillionEur: 0.035,
        customerInputPerMillionEur: 0.50,
        customerOutputPerMillionEur: 2.00,
        customerCachedPerMillionEur: 0.10,
      },
      {
        modelId: 'gemini-2.5-flash-lite',
        modelName: 'Gemini 2.5 Flash-Lite (Sofort-Klassifizierung)',
        purpose: 'Relevanz-Vorprüfung, Symptom-Extraktion & Schnell-Validierung',
        costInputPerMillionEur: 0.09,
        costOutputPerMillionEur: 0.37,
        costCachedPerMillionEur: 0.023,
        costInput2027PerMillionEur: 0.09,
        costOutput2027PerMillionEur: 0.37,
        costCached2027PerMillionEur: 0.023,
        customerInputPerMillionEur: 0.25,
        customerOutputPerMillionEur: 1.00,
        customerCachedPerMillionEur: 0.05,
      },
      {
        modelId: 'gemini-3.1-pro',
        modelName: 'Gemini 3.1 Pro (Flagship Reasoning)',
        purpose: 'Tiefen-Differentialdiagnostik & toxikologische Kreuzanalysen',
        costInputPerMillionEur: 1.84,
        costOutputPerMillionEur: 11.04,
        costCachedPerMillionEur: 0.184,
        costInput2027PerMillionEur: 1.84,
        costOutput2027PerMillionEur: 11.04,
        costCached2027PerMillionEur: 0.184,
        customerInputPerMillionEur: 3.50,
        customerOutputPerMillionEur: 20.00,
        customerCachedPerMillionEur: 0.50,
      },
    ]
  };

  const ensureDataDir = () => {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error("Failed to create data dir:", err);
      }
    }
  };

  const THERAPIST_LOOKUP: Record<string, { name: string; email: string; praxis: string; tarif: string }> = {
    'th-101': { name: 'Katharina Lindemann', email: 'k.lindemann@naturheilpraxis-berlin.de', praxis: 'Naturheilpraxis Lindemann', tarif: 'Kostenloser Test-Tarif' },
    'th-102': { name: 'Dr. med. Markus Vogel', email: 'praxis@dr-vogel-muenchen.de', praxis: 'Ganzheitliche Medizin Vogel', tarif: 'Kostenloser Test-Tarif' },
    'th-103': { name: 'Sophie Brunner', email: 'sophie.brunner@homoeopathie-zuerich.ch', praxis: 'Klassische Homöopathie Zürich', tarif: 'Pro Unbegrenzt (Praxis-Flatrate)' },
  };

  const getTokenRates = () => {
    ensureDataDir();
    if (fs.existsSync(TOKEN_RATES_FILE)) {
      try {
        return { ...DEFAULT_TOKEN_RATES, ...JSON.parse(fs.readFileSync(TOKEN_RATES_FILE, 'utf-8')) };
      } catch {}
    }
    return DEFAULT_TOKEN_RATES;
  };

  const getSeedTokenLogs = () => {
    return [
      {
        id: 'tok-seed-101',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        therapistId: 'th-103',
        therapistName: 'Sophie Brunner',
        therapistEmail: 'sophie.brunner@homoeopathie-zuerich.ch',
        endpoint: '/api/analyze',
        actionName: 'Große klinische Fallanalyse & Repertorisation',
        model: 'gemini-3.8-flash',
        promptTokens: 2540,
        candidatesTokens: 1890,
        cachedTokens: 1200,
        totalTokens: 4430,
        costEur: 0.00835
      },
      {
        id: 'tok-seed-102',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        therapistId: 'th-103',
        therapistName: 'Sophie Brunner',
        therapistEmail: 'sophie.brunner@homoeopathie-zuerich.ch',
        endpoint: '/api/acute-repertorise',
        actionName: '5-Schritte-Akut-Repertorisation',
        model: 'gemini-3.8-flash',
        promptTokens: 1210,
        candidatesTokens: 840,
        cachedTokens: 650,
        totalTokens: 2050,
        costEur: 0.00378
      },
      {
        id: 'tok-seed-103',
        timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
        therapistId: 'th-103',
        therapistName: 'Sophie Brunner',
        therapistEmail: 'sophie.brunner@homoeopathie-zuerich.ch',
        endpoint: '/api/check-medical-relevance',
        actionName: 'Medizinischer Relevanz-Check',
        model: 'gemini-2.5-flash-lite',
        promptTokens: 215,
        candidatesTokens: 32,
        cachedTokens: 0,
        totalTokens: 247,
        costEur: 0.00003
      },
      {
        id: 'tok-seed-201',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        therapistId: 'th-102',
        therapistName: 'Dr. med. Markus Vogel',
        therapistEmail: 'praxis@dr-vogel-muenchen.de',
        endpoint: '/api/analyze',
        actionName: 'Große klinische Fallanalyse',
        model: 'gemini-3.8-flash',
        promptTokens: 2610,
        candidatesTokens: 1950,
        cachedTokens: 1400,
        totalTokens: 4560,
        costEur: 0.00863
      },
      {
        id: 'tok-seed-202',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        therapistId: 'th-102',
        therapistName: 'Dr. med. Markus Vogel',
        therapistEmail: 'praxis@dr-vogel-muenchen.de',
        endpoint: '/api/acute-repertorise',
        actionName: '5-Schritte-Akut-Repertorisation',
        model: 'gemini-3.8-flash',
        promptTokens: 1180,
        candidatesTokens: 810,
        cachedTokens: 500,
        totalTokens: 1990,
        costEur: 0.00364
      },
      {
        id: 'tok-seed-301',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        therapistId: 'th-101',
        therapistName: 'Katharina Lindemann',
        therapistEmail: 'k.lindemann@naturheilpraxis-berlin.de',
        endpoint: '/api/analyze',
        actionName: 'Große klinische Fallanalyse',
        model: 'gemini-3.8-flash',
        promptTokens: 2430,
        candidatesTokens: 1810,
        cachedTokens: 1100,
        totalTokens: 4240,
        costEur: 0.00799
      },
      {
        id: 'tok-seed-302',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
        therapistId: 'th-101',
        therapistName: 'Katharina Lindemann',
        therapistEmail: 'k.lindemann@naturheilpraxis-berlin.de',
        endpoint: '/api/check-medical-relevance',
        actionName: 'Medizinischer Relevanz-Check',
        model: 'gemini-2.5-flash-lite',
        promptTokens: 195,
        candidatesTokens: 28,
        cachedTokens: 0,
        totalTokens: 223,
        costEur: 0.00003
      }
    ];
  };

  const getStoredTokenLogs = (): any[] => {
    ensureDataDir();
    if (fs.existsSync(TOKEN_USAGE_FILE)) {
      try {
        const raw = fs.readFileSync(TOKEN_USAGE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    const seeds = getSeedTokenLogs();
    try {
      fs.writeFileSync(TOKEN_USAGE_FILE, JSON.stringify(seeds, null, 2), 'utf-8');
    } catch {}
    return seeds;
  };

  const recordTokenUsage = (params: {
    therapistId?: string;
    therapistName?: string;
    therapistEmail?: string;
    endpoint: string;
    actionName: string;
    model: string;
    promptTokens: number;
    candidatesTokens: number;
    cachedTokens?: number;
  }) => {
    try {
      ensureDataDir();
      const rates = getTokenRates();
      const promptTokens = Math.max(0, Math.round(params.promptTokens || 0));
      const candidatesTokens = Math.max(0, Math.round(params.candidatesTokens || 0));
      const cachedTokens = Math.max(0, Math.round(params.cachedTokens || 0));
      const totalTokens = promptTokens + candidatesTokens;
      
      const inputCost = (promptTokens / 1_000_000) * (rates.inputPerMillionEur || 0.69);
      const outputCost = (candidatesTokens / 1_000_000) * (rates.outputPerMillionEur || 3.45);
      const cachedCost = (cachedTokens / 1_000_000) * (rates.cachedPerMillionEur || 0.069);
      const costEur = Math.round((inputCost + outputCost + cachedCost) * 100000) / 100000;

      // Calculate customer price based on admin configured pricing matrix
      const matchingTier = (rates.modelTiers && Array.isArray(rates.modelTiers))
        ? rates.modelTiers.find((t: any) => t.modelId === params.model) || rates.modelTiers[0]
        : null;

      const custInputRate = matchingTier ? (matchingTier.customerInputPerMillionEur ?? 1.50) : 1.50;
      const custOutputRate = matchingTier ? (matchingTier.customerOutputPerMillionEur ?? 7.50) : 7.50;
      const custCachedRate = matchingTier ? (matchingTier.customerCachedPerMillionEur ?? 0.20) : 0.20;

      const custInput = (promptTokens / 1_000_000) * custInputRate;
      const custOutput = (candidatesTokens / 1_000_000) * custOutputRate;
      const custCached = (cachedTokens / 1_000_000) * custCachedRate;
      const customerCostEur = Math.round((custInput + custOutput + custCached) * 100000) / 100000;

      const logs = getStoredTokenLogs();
      const resolvedTherapistId = params.therapistId || 'th-101';
      const meta = THERAPIST_LOOKUP[resolvedTherapistId] as { name?: string; email?: string; praxis?: string; tarif?: string } | undefined;

      // Deduct from therapist's real balance
      try {
        deductUsageFromBalance(resolvedTherapistId, customerCostEur);
      } catch (balErr) {
        console.warn("[Stripe] Failed to deduct token usage from balance:", balErr);
      }

      const newRecord = {
        id: 'tok-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toISOString(),
        therapistId: resolvedTherapistId,
        therapistName: params.therapistName || meta?.name || 'Unbekannter Therapeut',
        therapistEmail: params.therapistEmail || meta?.email || '',
        endpoint: params.endpoint,
        actionName: params.actionName,
        model: params.model,
        promptTokens,
        candidatesTokens,
        cachedTokens,
        totalTokens,
        costEur,
        customerCostEur
      };

      logs.unshift(newRecord);
      const trimmedLogs = logs.slice(0, 3000);
      fs.writeFileSync(TOKEN_USAGE_FILE, JSON.stringify(trimmedLogs, null, 2), 'utf-8');
      return newRecord;
    } catch (err) {
      console.error("Error recording token usage:", err);
    }
  };

  // Helper to safely extract Gemini API key from various common environment variable names
  const getGeminiApiKey = (): string | undefined => {
    return (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.VITE_GOOGLE_API_KEY
    );
  };

  // API Routes
  app.post("/api/analyze", async (req, res) => {
    try {
      const { caseData, language = "de" } = req.body;

      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        return res.status(503).json({ error: "GEMINI_API_KEY is not configured" });
      }

      const langNames: Record<string, string> = {
        de: "German (Deutsch)",
        en: "English",
        el: "Greek (Ελληνικά)",
        es: "Spanish (Español)",
        fr: "French (Français)",
        it: "Italian (Italiano)",
        ru: "Russian (Русский)"
      };
      const targetLanguageName = langNames[language] || "German (Deutsch)";
      
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
Du bist ein medizinischer Analyseassistent und homöopathischer Experte.
Werte den gesamten übergebenen Patientenfall systematisch, professionell und vollständig aus.

WICHTIG / IMPORTANT:
Generiere alle Inhalte, Texte, Beurteilungen, Warnungen, Differenzialdiagnosen, Begründungen, Empfehlungen und homöopathischen Analysen vollständig in der Zielsprache: ${targetLanguageName}.
(Halte die JSON-Schlüssel exakt wie im Schema vorgegeben, aber alle Werte und Textinhalte MÜSSEN in ${targetLanguageName} verfasst sein).

Fall-Daten:
${JSON.stringify(caseData, null, 2)}

Antworte AUSSCHLIESSLICH mit einem gültigen JSON-Objekt im folgenden Format (ohne Markdown Code-Blöcke):
{
  "symptomatik": {
    "leitsymptome": ["Leitsymptom 1", "Leitsymptom 2"],
    "begleitsymptome": ["Begleitsymptom 1", "Begleitsymptom 2"],
    "modalitaetenBesser": ["Besser durch Ruhe", "Besser durch Wärme"],
    "modalitaetenSchlechter": ["Schlechter durch Stress", "Schlechter durch Kälte"],
    "zeitverlauf": ["Beginn...", "Verlauf..."],
    "psychischVegetativ": ["Innere Unruhe...", "Schlaf..."]
  },
  "redFlags": {
    "warnings": [
      {
        "text": "Warnhinweis Text mit Begründung",
        "severity": "WARNUNG",
        "status": "vorhanden",
        "abklaerung": "Empfohlene medizinische Abklärung"
      }
    ],
    "gesamtbewertung": "Eine zeitnahe ärztliche Abklärung wird empfohlen.",
    "empfohleneFachrichtung": "Bitte besprechen Sie die Beschwerden zunächst mit Ihrem Hausarzt / Ihrer Hausärztin bzw. einer allgemeinmedizinischen Praxis.",
    "dringlichkeit": "Zeitnahe ärztliche Abklärung sinnvoll"
  },
  "differentialdiagnostik": {
    "dringlichkeitHeader": "ZEITNAHE MEDIZINISCHE ABKLÄRUNG",
    "items": [
      {
        "title": "Spannungskopfschmerz mit muskulärer Nackenbeteiligung",
        "pro": [
          "Beidseitiger dumpf-drückender Schmerz an den Schläfen...",
          "Zusammenhang mit Stress, langem Sitzen, Bildschirmarbeit..."
        ],
        "contra": [
          "Die Häufigkeit von zwei bis drei Episoden pro Woche..."
        ],
        "offeneFragen": [
          "Wurden Blutdruck, neurologischer Status bereits durchgeführt?",
          "Wie ergonomisch ist der Arbeitsplatz?"
        ],
        "diagnostik": "Neurologischer Status, HWS-Untersuchung"
      }
    ]
  },
  "arztfallEntscheidung": {
    "status": "Ja",
    "begruendung": "Begründung, warum eine hausärztliche Untersuchung sinnvoll/erforderlich ist."
  },
  "medikamente": {
    "zusammenfassung": "Zusammenfassung der eingenommenen Medikamente und Wechselwirkungen.",
    "warnhinweis": "Alle Angaben beschreiben mögliche, keine gesicherten Zusammenhänge und ersetzen keine ärztliche oder pharmazeutische Beratung.",
    "details": [
      {
        "name": "Ibuprofen 400",
        "wirkstoff": "Ibuprofen",
        "dosierung": "400 mg pro gelegentlicher Einnahme",
        "einnahme": "Gelegentlich bei Schmerzen",
        "wirkung": "Teilweise bis gute Besserung",
        "nebenwirkungen": [
          "Magen-Darm-Beschwerden wie Dyspepsie, Bauchschmerzen...",
          "Seltenere Risiken wie Magenschleimhautläsionen..."
        ],
        "zusammenhaenge": [
          "Aus den vorliegenden Angaben ergibt sich kein Hinweis auf eine akute Dosierungsauffälligkeit."
        ],
        "wechselwirkungen": ["Alkohol verstärkt Schleimhautreizung"],
        "risiken": "Vorsicht bei Nierenerkrankungen und Magenulzera",
        "uebergebrauchBeurteilung": "Kein Anhalt für Medikamentenübergebrauch bei seltener Einnahme."
      }
    ],
    "ibuprofenSpezifisch": {
      "dosierungEinnahme": "400 mg pro gelegentlicher Einnahme",
      "wirkung": "Schmerzlinderung",
      "risiken": ["Gastrointestinale Reizung", "Nierenperfusion"],
      "uebergebrauch": "Unter 10 Tagen/Monat"
    }
  },
  "fehlendeInformationen": [
    "Aktuelle Blutdruckwerte",
    "Neurologischer Status",
    "Genaue Schmerztagebuch-Dokumentation"
  ],
  "homoeopathie": {
    "summary": "Traditionelle homöopathische Fallauswertung als komplementäre Betrachtung.",
    "symptomHierarchie": {
      "leitsymptome": ["Charakteristischstes Symptom"],
      "allgemeinsymptome": ["Wärme/Kälte, Schlaf"],
      "gemuetsymptome": ["Pflichtbewusst, verschlossen"],
      "lokalsymptome": ["Schläfenschmerz rechts"],
      "modalitaeten": ["Besser: Ruhe, Kälte / Schlechter: Sonne, Trost"],
      "begleitsymptome": ["Durst auf kaltes Wasser"]
    },
    "mittel": [
      {
        "name": "Natrium muriaticum (Nat-m)",
        "passungSymptome": ["Kopfschmerz nach Belastung", "Verschlossenheit"],
        "modalitaeten": ["Besser durch Liegen im Dunkeln", "Schlechter vormittags"],
        "contraNichtPassend": ["Keine starken Hitzewallungen"],
        "fehlendeInfos": ["Genaue Sonnenreaktion"],
        "rangBegruendung": "Höchste Deckung mit Gemüt und Modalitäten.",
        "dosierungPotenz": "C30",
        "potenz": "C30",
        "tagesdosis": "1 bis 2 Gaben à 3–5 Globuli",
        "haeufigkeit": "1- bis 2-mal täglich (z. B. morgens und bei Bedarf abends)",
        "anwendungsdauer": "3 bis maximal 5 Tage (nach Hahnemann: bei spürbarer Besserung sofort pausieren)",
        "zeitraum": "Akut- und Initialphase (1. bis 2. Behandlungswoche)",
        "einnahmehinweis": "Globuli langsam sublingual unter der Zunge zergehen lassen. Mindestens 15 Minuten Abstand zu Mahlzeiten, Kaffee, Zähneputzen und mentholhaltigen Produkten."
      }
    ],
    "trennung": {
      "medizinisch": ["Ärztliche Untersuchung und Diagnostik"],
      "komplementaer": ["Ergonomie, Bewegung, Entspannung"],
      "homoeopathisch": ["Repertorisation zur Unterstützung der Selbstregulation"]
    }
  },
  "gesamtAuswertung": {
    "medizinischeEinschaetzung": "Verdacht auf primär funktionell-muskuläre Genese unter Belastung.",
    "dringlichkeit": "Zeitnahe ärztliche Abklärung sinnvoll",
    "medikamentenBewertung": "Bedarfsmedikation adäquat, Übergebrauch beachten.",
    "redFlags": "Keine akuten Notfall-Red-Flags dokumentiert.",
    "homoeopathie": "Homöopathische Begleitung möglich.",
    "naechsteSchritte": [
      "1. Hausärztliche Untersuchung durchführen",
      "2. Kopfschmerztagebuch führen",
      "3. Ergonomie optimieren",
      "4. Entspannungsmethoden etablieren",
      "5. Zahnärztliche Kontrolle bei Zähneknirschen"
    ]
  }
}

Beachte alle Details aus den Fall-Daten. Keine Daten erfinden, fehlende Daten als fehlend benennen. Alle Text-Antworten in ${targetLanguageName} ausgeben.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

      const usage = (response as any).usageMetadata || {};
      recordTokenUsage({
        therapistId: req.body?.therapistId,
        therapistName: req.body?.therapistName,
        therapistEmail: req.body?.therapistEmail,
        endpoint: "/api/analyze",
        actionName: "Große klinische Fallanalyse",
        model: "gemini-3.8-flash",
        promptTokens: usage.promptTokenCount || Math.ceil(prompt.length / 4),
        candidatesTokens: usage.candidatesTokenCount || Math.ceil((response.text || "").length / 4),
      });

      res.json({ analysis: JSON.parse(response.text || '{}') });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Failed to generate analysis." });
    }
  });

  // 5-Schritte Homöopathischer Experten-Repertorisations-Endpunkt
  app.post("/api/acute-repertorise", async (req, res) => {
    try {
      const { symptomText, language = "de" } = req.body;
      if (!symptomText || typeof symptomText !== "string" || !symptomText.trim()) {
        return res.status(400).json({ error: "symptomText is required" });
      }

      const langNames: Record<string, string> = {
        de: "German (Deutsch)",
        en: "English",
        el: "Greek (Ελληνικά)",
        es: "Spanish (Español)",
        fr: "French (Français)",
        it: "Italian (Italiano)",
        ru: "Russian (Русский)"
      };
      const targetLanguageName = langNames[language] || "German (Deutsch)";

      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        return res.status(503).json({ error: "GEMINI_API_KEY is not configured" });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
Du bist das logische Hintergrund-Modul (Backend-Engine) einer bestehenden Homöopathie-App zur hochpräzisen, unvoreingenommenen Akutanalyse.
Deine Aufgabe ist es, den eingegebenen Patienten-Freitext (via Sprache oder Text) methodisch nach den Grundsätzen von Hahnemanns Organon §§ 83–104 und der differenzialdiagnostischen Wertigkeitslehre von James Tyler Kent zu analysieren und ein lückenloses, homöopathisches Ausschlussverfahren (Repertorisation) im Hintergrund zu berechnen.

METHODISCHE GRUNDSÄTZE DER FALLAUFNAHME (Organon §§ 83–104):
1. STRIKTE TRENNUNG & FREITEXT-PRIORITÄT (Organon § 84):
   - Trenne strikt zwischen:
     * dem, was der Patient tatsächlich gesagt hat (Originalworte und unverfälschte Phänomene sind immer die Primärquelle),
     * der gezielten, offenen Nachfrage zur Präzisierung,
     * der strukturierten Erfassung,
     * und jeder späteren medizinischen oder homöopathischen Interpretation.
   - Der freie Patiententext hat stets absoluten Vorrang vor jeder vorgegebenen Kategorie.

2. KEINE ERFINDUNG ODER ABLEITUNG:
   - Du darfst NIEMALS ein Symptom, eine Empfindung, eine Modalität, eine Ursache oder einen Gemütszustand hinzufügen, unterstellen oder voraussetzen, den der Patient nicht selbst angegeben hat.
   - Beispiel: Sagt der Patient „Ich habe starken Durst“, darfst du NICHT ableiten „Möchte große Mengen kaltes Wasser“. Diese Information muss ausdrücklich erfragt werden.
   - Wenn der Patient nur „Fieber“ schreibt, darfst du daraus nicht automatisch Durst, Schüttelfrost, Schwitzen, Kopfschmerzen, Unruhe, Angst, bestimmte Trinktemperaturen oder Modalitäten ableiten.
   - „Nicht angegeben“ bedeutet niemals „Nein“: Wenn eine Information fehlt, markiere sie ausnahmslos als "Unbekannt (Bitte erfragen)". Niemals als "keine".

3. CAUSA / AUSLÖSER vs. ZEITLICHER BEGINN (Organon §§ 86, 99):
   - Eine Causa darf nur erfasst werden, wenn der Patient selbst einen echten Auslöser genannt hat (z. B. Durchnässung, kalter Wind, Sonnenstich, Schock, Ärger, Verkühlung).
   - Ein bloßer zeitlicher Beginn („Seit gestern habe ich Fieber“) ist KEINE Causa!

4. MODALITÄTEN & GEMÜTSZUSTAND (Organon §§ 86, 90):
   - Modalitäten (Besserung/Verschlimmerung) dürfen nur erfasst werden, wenn der Patient sie selbst genannt hat. Fehlen sie: "Unbekannt (Bitte erfragen)".
   - Der Gemütszustand darf niemals aus physischer Erschöpfung oder Schmerzen vorausgesetzt oder geraten werden.

5. FRAGEN FÜR DEN THERAPEUTEN (ORIENTIERUNG MIT ODER-OPTION):
   - In "diagnose_fragen_fuer_therapeut" erstellst du höchstens zwei präzise Leitfragen.
   - Zur praktischen Orientierung des Behandlers nennst du die entscheidenden homöopathischen Polaritäten/Differenzierungs-Vorgaben mit Arzneihinweisen (z. B. bei Durst: große Mengen selten [Bryonia] vs. kleine Schlucke häufig [Arsenicum] vs. durstlos [Pulsatilla/Apis]), ABER IMMER mit der ausdrücklichen Alternative einer freien Patientenaussage: „ODER eigene freie Beschreibung des Patienten (Originalworte)“.

6. HOMÖOPATHISCHE AUSWERTUNG & ENTSCHEIDUNGSBAUM (Organon § 104, Kent):
   - Keine erfundenen Auffang-Mittel zur künstlichen Überbrückung fehlender Daten!
   - Wenn die Daten für einen Verzweigungspfad nicht ausreichen, stoppt der Pfad ehrlich bei: "Unvollständig (Warte auf Eingabe der fehlenden Daten)".
   - Nur wenn die Daten tatsächlich vorliegen, führt der Pfad zu einem exakten Simile.

7. KLINISCHE SICHERHEIT & RED FLAGS:
   - Die homöopathische Anamnese ersetzt keine medizinische Untersuchung oder Notfallabklärung.
   - Bei bedrohlichen Warnzeichen (z. B. Bewusstseinsstörung/Verwirrtheit, schwere Atemnot, Kreislaufversagen, Nackensteifigkeit/Meningismus, Petechien/Purpura, Sepsiszeichen, akutes Abdomen) MUSS im Feld "begruendung" an erster Stelle zur sofortigen ärztlichen Notfall-Abklärung geraten werden!

8. KEINE ÄNDERUNG DER APP-SCHNITTSTELLE:
   - Du darfst kein UI-Layout, kein HTML und keine visuellen Formatierungen generieren.
   - Behalte exakt die bestehenden JSON-Bereiche und Schlüssel bei.

Befolge bei JEDER Eingabe exakt diesen 5-Schritte-Algorithmus:

1. SCHRITT: SYMPTOM-EXTRAKTION (Tokenisierung nach Organon §§ 83–104)
Analysiere den Text und ordne die Aussagen ausschließlich in diese vier Variablen ein. Wenn eine Information im Text nicht genannt wird, schreibe strikt "Unbekannt (Bitte erfragen)":
- [Leitsymptom] = Was genau ist die körperliche Hauptbeschwerde?
- [Causa] = Was war der Auslöser/die Ursache (Wetter, Emotion, Unfall, Genussmittel)?
- [Modalitäten] = Was verschlimmert (>) oder verbessert (<) den Zustand (Kälte, Wärme, Tageszeit, Bewegung)?
- [Begleitsymptome] = Welche zusätzlichen Symptome oder Gemütszustände liegen vor?

2. SCHRITT: PRIMÄR-FILTER (Arznei-Pool)
Suche in deiner homöopathischen Datenbank nach allen Arzneimitteln, die eine hohe Wertigkeit für die tatsächlich genannten Symptome besitzen. Dies ist dein "Start-Pool".

3. SCHRITT: BINÄRE DIFFERENZIERUNG (Der Entscheidungsbaum)
Erstelle einen logischen Ja/Nein-Entscheidungsbaum, um die Mittel aus dem Start-Pool systematisch voneinander abzugrenzen. Nutze dafür die [Modalitäten] und [Begleitsymptome]. Jede Verzweigung MUSS auf einer klaren Differenzierungsfrage basieren. Wenn die Daten fehlen, bleibt der Pfad bei "Unvollständig (Warte auf Eingabe der fehlenden Daten)".

4. SCHRITT: HOMÖOPATHISCHES FAZIT (Keine Auffang-Mittel)
Erfinde keine Daten. Ein Simile wird nur empfohlen, wenn die tatsächlich vorliegenden Symptome es eindeutig tragen. Andernfalls heißt es 'Fehlende Daten für Empfehlung' mit Erläuterung der noch benötigten Angaben.

5. SCHRITT: STRUKTURIERTE JSON-AUSGABE FÜR DIE APP
Gib das Ergebnis als reines Datenobjekt (Schlüssel-Wert-Paare) ohne jeglichen Fließtext davor oder danach in folgendem Format aus:

Eingabetext des Patienten/Therapeuten:
"${symptomText.replace(/"/g, '\\"')}"

WICHTIG / SPRACHVORGABE:
Verfasse alle Texte, Beschreibungen, Fragen und Begründungen in der Zielsprache: ${targetLanguageName}.
Behalte für die Arzneimittel die international etablierten lateinischen Bezeichnungen (z. B. Lycopodium clavatum, Chelidonium majus, Sanguinaria canadensis, Nux vomica, Belladonna, Aconitum napellus, etc.).

Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt im folgenden Format (ohne Code-Block-Ummantelung):
{
  "extraktion": {
    "hauptbeschwerde": "Inhalt von Leitsymptom",
    "causa": "Inhalt von Causa oder 'Unbekannt (Bitte erfragen)'",
    "modalitaeten": "Inhalt von Modalitäten oder 'Unbekannt (Bitte erfragen)'",
    "begleitsymptome": "Inhalt von Begleitsymptome oder 'Unbekannt (Bitte erfragen)'"
  },
  "app_layout_daten": {
    "optimales_simile": "Name des ermittelten Hauptmittels oder 'Fehlende Daten für Empfehlung'",
    "begruendung": "Kurze Begründung, warum das Mittel passt ODER Erklärung, welche Kern-Informationen noch benötigt werden (bei Red Flags stets mit ärztlichem Notfallhinweis an 1. Stelle)"
  },
  "diagnose_fragen_fuer_therapeut": {
    "frage_1": "Gezielte Frage zur fehlenden Modalität mit differenzialdiagnostischen Orientierungsbeispielen für den Behandler UND ausdrücklicher Option 'ODER eigene freie Beschreibung des Patienten (Originalworte)'",
    "frage_2": "Gezielte Frage zum fehlenden Begleitsymptom/Gemüt mit differenzialdiagnostischen Orientierungsbeispielen für den Behandler UND ausdrücklicher Option 'ODER eigene freie Beschreibung des Patienten (Originalworte)'"
  },
  "baumstruktur_popup_daten": {
    "start_knoten": "Ausgangssymptom und Ursache",
    "haupt_differenzierungs_frage": "Die erste große Ja/Nein-Frage zur Differenzierung der möglichen Mittel",
    "pfad_ja": {
      "bedingung": "Wenn zutreffend",
      "folge_frage": "Nächste Frage oder 'Warte auf Eingabe der fehlenden Daten'",
      "ergebnis_ja": "Mittelname bei JA oder 'Unvollständig'",
      "ergebnis_nein": "Mittelname bei NEIN oder 'Unvollständig'"
    },
    "pfad_nein": {
      "bedingung": "Wenn nicht zutreffend",
      "folge_frage": "Nächste Frage oder 'Warte auf Eingabe der fehlenden Daten'",
      "ergebnis_ja": "Mittelname bei JA oder 'Unvollständig'",
      "ergebnis_nein": "Mittelname bei NEIN oder 'Unvollständig'"
    }
  }
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      const usage = (response as any).usageMetadata || {};
      recordTokenUsage({
        therapistId: req.body?.therapistId,
        therapistName: req.body?.therapistName,
        therapistEmail: req.body?.therapistEmail,
        endpoint: "/api/acute-repertorise",
        actionName: "5-Schritte-Akut-Repertorisation",
        model: "gemini-3.8-flash",
        promptTokens: usage.promptTokenCount || Math.ceil(prompt.length / 4),
        candidatesTokens: usage.candidatesTokenCount || Math.ceil((response.text || "").length / 4),
      });

      const rawParsed = JSON.parse(response.text || "{}");
      
      // Ensure strict adherence to both new 5-step schema and normalized compatibility fields
      const extraktion = rawParsed.extraktion || {
        hauptbeschwerde: rawParsed.extractedAnalysis?.hauptbeschwerde || symptomText,
        causa: rawParsed.extractedAnalysis?.causa || "Unbekannt (Bitte erfragen)",
        modalitaeten: rawParsed.extractedAnalysis?.modalitaeten || "Unbekannt (Bitte erfragen)",
        begleitsymptome: rawParsed.extractedAnalysis?.begleitsymptome || "Unbekannt (Bitte erfragen)"
      };

      const app_layout_daten = rawParsed.app_layout_daten || {
        optimales_simile: rawParsed.recommendedSimile?.remedyName || "Fehlende Daten für Empfehlung",
        begruendung: rawParsed.recommendedSimile?.rationale || "Informationen zur vollständigen Differenzierung erforderlich."
      };

      const diagnose_fragen_fuer_therapeut = rawParsed.diagnose_fragen_fuer_therapeut || {
        frage_1: Array.isArray(rawParsed.diagnosticQuestions) && rawParsed.diagnosticQuestions[0] ? rawParsed.diagnosticQuestions[0] : "Welche Einflüsse verschlimmern oder verbessern die Beschwerden?",
        frage_2: Array.isArray(rawParsed.diagnosticQuestions) && rawParsed.diagnosticQuestions[1] ? rawParsed.diagnosticQuestions[1] : "Gibt es auffällige Begleitsymptome oder Gemütsveränderungen?"
      };

      const baumstruktur_popup_daten = rawParsed.baumstruktur_popup_daten || {
        start_knoten: `${extraktion.hauptbeschwerde} (${extraktion.causa})`,
        haupt_differenzierungs_frage: "Liegen spezifische Modalitäten vor?",
        pfad_ja: {
          bedingung: "Modalitäten und Begleitsymptome bestätigt",
          folge_frage: "Zustand verschlimmert durch Kälte oder Wärme?",
          ergebnis_ja: app_layout_daten.optimales_simile !== "Fehlende Daten für Empfehlung" ? app_layout_daten.optimales_simile : "Unvollständig",
          ergebnis_nein: "Ferrum phosphoricum"
        },
        pfad_nein: {
          bedingung: "Keine Verschlimmerung durch Umweltreize",
          folge_frage: "Warte auf Eingabe der fehlenden Daten",
          ergebnis_ja: "Unvollständig",
          ergebnis_nein: "Unvollständig"
        }
      };

      const normalizedResult = {
        extraktion,
        app_layout_daten,
        diagnose_fragen_fuer_therapeut,
        baumstruktur_popup_daten,
        // Legacy/compatibility fields:
        extractedAnalysis: {
          hauptbeschwerde: extraktion.hauptbeschwerde,
          causa: extraktion.causa,
          modalitaeten: extraktion.modalitaeten,
          begleitsymptome: extraktion.begleitsymptome
        },
        recommendedSimile: {
          remedyName: app_layout_daten.optimales_simile,
          rationale: app_layout_daten.begruendung
        },
        diagnosticQuestions: [
          diagnose_fragen_fuer_therapeut.frage_1,
          diagnose_fragen_fuer_therapeut.frage_2
        ].filter(Boolean),
        decisionTree: rawParsed.decisionTree || {
          header: `[ ${extraktion.hauptbeschwerde.toUpperCase()} ]`,
          rootQuestion: baumstruktur_popup_daten.haupt_differenzierungs_frage,
          branches: [
            {
              id: "branch_ja",
              branchLabel: "[ JA: BESTÄTIGT ]",
              subQuestion: baumstruktur_popup_daten.pfad_ja.folge_frage,
              yesRemedy: {
                name: baumstruktur_popup_daten.pfad_ja.ergebnis_ja,
                rationale: app_layout_daten.begruendung
              },
              noRemedy: {
                name: baumstruktur_popup_daten.pfad_ja.ergebnis_nein,
                rationale: "Klassisches Auffang-Mittel bei Ausschluss der Primärreaktion."
              }
            },
            {
              id: "branch_nein",
              branchLabel: "[ NEIN: AUSGESCHLOSSEN ]",
              subQuestion: baumstruktur_popup_daten.pfad_nein.folge_frage,
              yesRemedy: {
                name: baumstruktur_popup_daten.pfad_nein.ergebnis_ja,
                rationale: "Alternativer Pfad"
              },
              noRemedy: {
                name: baumstruktur_popup_daten.pfad_nein.ergebnis_nein,
                rationale: "Auffang-Mittel oder unvollständig"
              }
            }
          ],
          textFlowchart: `[${extraktion.hauptbeschwerde} | Ursache: ${extraktion.causa}]
  │
  ▼
[ ${baumstruktur_popup_daten.haupt_differenzierungs_frage} ]
  ├── JA  ──> ${baumstruktur_popup_daten.pfad_ja.folge_frage}
  │            ├── JA  ──> ${baumstruktur_popup_daten.pfad_ja.ergebnis_ja}
  │            └── NEIN ──> ${baumstruktur_popup_daten.pfad_ja.ergebnis_nein}
  │
  └── NEIN ──> ${baumstruktur_popup_daten.pfad_nein.folge_frage}
               ├── JA  ──> ${baumstruktur_popup_daten.pfad_nein.ergebnis_ja}
               └── NEIN ──> ${baumstruktur_popup_daten.pfad_nein.ergebnis_nein}`
        }
      };

      res.json({ result: normalizedResult });
    } catch (error) {
      console.error("Acute Repertorise Gemini Error:", error);
      res.status(500).json({ error: "Failed to generate acute repertorisation." });
    }
  });

  // Hahnemann & Bönninghausen Analyse-Engine nach Organon der Heilkunst §§ 83–104
  const getLocalizedOrganonSummary = (m: any, lang: string): string => {
    if (lang === 'en') {
      return `Classical Synthesis according to Samuel Hahnemann (Organon §§ 83–104):\n• Causa (Trigger / Onset): ${m.causa || 'No specific trigger identified'}\n• Localization & Radiation: ${m.lokalisierung || 'Systemic'}\n• Sensation (Quality): ${m.empfindung || 'Not further specified'}\n• Modalities (Better / Worse): ${m.modalitaeten || 'No specific modalities'}\n• Concomitants: ${Array.isArray(m.begleitsymptome) && m.begleitsymptome.length > 0 ? m.begleitsymptome.join(', ') : 'No prominent concomitants'}\n• Mind (Mental State): ${m.gemuet || 'Equable / balanced'}\n• Symptom Complex: ${m.ursaechlicher_zusammenhang || 'Unified symptom complex'}`;
    }
    if (lang === 'es') {
      return `Síntesis clásica según Samuel Hahnemann (Organon §§ 83–104):\n• Causa (Desencadenante / Inicio): ${m.causa || 'Sin causa específica identificada'}\n• Localización y Radiación: ${m.lokalisierung || 'Sistémica'}\n• Sensación (Calidad): ${m.empfindung || 'No especificada'}\n• Modalidades (Mejoría / Empeoramiento): ${m.modalitaeten || 'Sin modalidades específicas'}\n• Síntomas concomitantes: ${Array.isArray(m.begleitsymptome) && m.begleitsymptome.length > 0 ? m.begleitsymptome.join(', ') : 'Sin concomitantes destacados'}\n• Mente (Estado anímico): ${m.gemuet || 'Equilibrado'}\n• Complejo sintomático: ${m.ursaechlicher_zusammenhang || 'Complejo sintomático unificado'}`;
    }
    if (lang === 'fr') {
      return `Synthèse classique selon Samuel Hahnemann (Organon §§ 83–104) :\n• Causa (Déclencheur / Début) : ${m.causa || 'Aucune cause spécifique identifiée'}\n• Localisation & Rayonnement : ${m.lokalisierung || 'Systémique'}\n• Sensation (Qualité) : ${m.empfindung || 'Non spécifiée'}\n• Modalités (Amélioration / Aggravation) : ${m.modalitaeten || 'Aucune modalité spécifique'}\n• Concomitants : ${Array.isArray(m.begleitsymptome) && m.begleitsymptome.length > 0 ? m.begleitsymptome.join(', ') : 'Aucun concomitant notable'}\n• Mental (État d\'esprit) : ${m.gemuet || 'Équilibré'}\n• Complexe de symptômes : ${m.ursaechlicher_zusammenhang || 'Complexe de symptômes unifié'}`;
    }
    if (lang === 'it') {
      return `Sintesi classica secondo Samuel Hahnemann (Organon §§ 83–104):\n• Causa (Fattore scatenante / Inizio): ${m.causa || 'Nessuna causa specifica identificata'}\n• Localizzazione e Irradiazione: ${m.lokalisierung || 'Sistemica'}\n• Sensazione (Qualità): ${m.empfindung || 'Non specificata'}\n• Modalità (Miglioramento / Aggravamento): ${m.modalitaeten || 'Nessuna modalità specifica'}\n• Sintomi concomitanti: ${Array.isArray(m.begleitsymptome) && m.begleitsymptome.length > 0 ? m.begleitsymptome.join(', ') : 'Nessun concomitante di rilievo'}\n• Mente (Stato d\'animo): ${m.gemuet || 'Equilibrato'}\n• Complesso sintomatico: ${m.ursaechlicher_zusammenhang || 'Complesso sintomatico unificato'}`;
    }
    if (lang === 'el') {
      return `Κλασική Σύνθεση κατά Samuel Hahnemann (Όργανον §§ 83–104):\n• Causa (Έναυσμα / Έναρξη): ${m.causa || 'Δεν προσδιορίστηκε συγκεκριμένο έναυσμα'}\n• Εντόπιση & Αντανάκλαση: ${m.lokalisierung || 'Συστηματική'}\n• Αίσθηση (Ποιότητα): ${m.empfindung || 'Μη επακριβώς προσδιορισμένη'}\n• Τροποποιητικοί παράγοντες (Βελτίωση / Επιδείνωση): ${m.modalitaeten || 'Χωρίς συγκεκριμένους τροποποιητικούς παράγοντες'}\n• Συνοδά συμπτώματα: ${Array.isArray(m.begleitsymptome) && m.begleitsymptome.length > 0 ? m.begleitsymptome.join(', ') : 'Χωρίς αξιοσημείωτα συνοδά'}\n• Ψυχική διάθεση: ${m.gemuet || 'Ισόρροπη'}\n• Σύμπλεγμα συμπτωμάτων: ${m.ursaechlicher_zusammenhang || 'Ενιαίο σύμπλεγμα συμπτωμάτων'}`;
    }
    if (lang === 'ru') {
      return `Классический синтез по Самуэлю Ганеману (Органон §§ 83–104):\n• Causa (Триггер / Начало): ${m.causa || 'Специфический триггер не выявлен'}\n• Локализация и иррадиация: ${m.lokalisierung || 'Системная'}\n• Ощущение (Качество): ${m.empfindung || 'Не уточнено'}\n• Модальности (Улучшение / Ухудшение): ${m.modalitaeten || 'Без специфических модальностей'}\n• Сопутствующие симптомы: ${Array.isArray(m.begleitsymptome) && m.begleitsymptome.length > 0 ? m.begleitsymptome.join(', ') : 'Без выраженных сопутствующих'}\n• Душевное состояние: ${m.gemuet || 'Уравновешенное'}\n• Симптомокомплекс: ${m.ursaechlicher_zusammenhang || 'Единый симптомокомплекс'}`;
    }
    return `Klassische Synthese nach Samuel Hahnemann (Organon §§ 83–104):\n• Causa (Auslöser / Beginn): ${m.causa || 'Keine spezifische Causa ermittelt'}\n• Lokalisation & Strahlungsoptionen: ${m.lokalisierung || 'Systemisch'}\n• Sensation (Qualität): ${m.empfindung || 'Nicht näher spezifiziert'}\n• Modalitäten (Besserung / Verschlimmerung): ${m.modalitaeten || 'Keine spezifischen Modalitäten'}\n• Begleitsymptome: ${Array.isArray(m.begleitsymptome) && m.begleitsymptome.length > 0 ? m.begleitsymptome.join(', ') : 'Keine auffälligen Concomitants'}\n• Gemüt (Seelischer Zustand): ${m.gemuet || 'Ausgeglichen'}\n• Symptomkomplex: ${m.ursaechlicher_zusammenhang || 'Einheitlicher Symptomkomplex'}`;
  };

  const getLocalizedClarifyingQuestions = (m: any, lang: string): any[] => {
    const list: any[] = [];
    if (lang === 'en') {
      if (!m.gemuet || m.gemuet === "Noch nicht genannt") {
        list.push({
          id: "q_gemuet",
          frage: "How is the emotional / mental state during the symptoms?",
          grund: "Central Hahnemannian core pillar for precise differentiation of the remedy",
          kategorie: "gemuet",
          optionen: [
            "Irritable, angry, wants absolute quiet (Bryonia / Nux vomica)",
            "Anxious motor restlessness with fear (Aconitum / Arsenicum)",
            "Apathetic, drowsy, indifferent (Gelsemium / Phosphorus)",
            "Weeping, desires consolation and company (Pulsatilla)",
            "Balanced, no noticeable mental change"
          ]
        });
      }
      list.push({
        id: "q_modalitaet",
        frage: "How does the pain respond to firm bandaging or firm pressure versus motion?",
        grund: "Differentiates firm pressure relief (Silicea, Bryonia) from touch/jar sensitive remedies (Belladonna)",
        kategorie: "modalitaeten",
        optionen: [
          "Firm pressure and bandaging relieve noticeably",
          "Slightest motion and jarring worsen",
          "Relief from gentle continuous motion in fresh air",
          "Neither pressure nor motion affects the pain"
        ]
      });
      list.push({
        id: "q_begleit",
        frage: "How do thirst and temperature preferences behave during the condition?",
        grund: "Important general symptom according to Bönninghausen to secure the simile",
        kategorie: "begleitsymptome",
        optionen: [
          "Great unquenchable thirst for large amounts of cold water",
          "Complete thirstlessness despite heat/fever",
          "Desire for warm drinks / warm wrapping",
          "Aversion to fresh air and cold"
        ]
      });
    } else if (lang === 'es') {
      if (!m.gemuet || m.gemuet === "Noch nicht genannt") {
        list.push({
          id: "q_gemuet",
          frage: "¿Cómo es el estado de ánimo o disposición mental durante los síntomas?",
          grund: "Pilar central de Hahnemann para la diferenciación exacta del remedio",
          kategorie: "gemuet",
          optionen: [
            "Irritable, colérico, desea calma absoluta (Bryonia / Nux vomica)",
            "Inquietud motora ansiosa con temor (Aconitum / Arsenicum)",
            "Apático, somnoliento, indiferente (Gelsemium / Phosphorus)",
            "Lloroso, busca consuelo y compañía (Pulsatilla)",
            "Equilibrado, sin cambios anímicos relevantes"
          ]
        });
      }
      list.push({
        id: "q_modalitaet",
        frage: "¿Cómo reacciona el dolor a un vendaje firme o presión fuerte frente al movimiento?",
        grund: "Diferencia la mejoría por presión firme (Silicea, Bryonia) de remedios sensibles a la sacudida (Belladonna)",
        kategorie: "modalitaeten",
        optionen: [
          "La presión firme y el vendaje alivian notablemente",
          "El menor movimiento o sacudida empeoran",
          "Alivio con movimiento suave al aire libre",
          "Ni la presión ni el movimiento modifican el dolor"
        ]
      });
      list.push({
        id: "q_begleit",
        frage: "¿Cómo se comportan la sed y el deseo de temperatura durante el estado?",
        grund: "Síntoma general clave según Bönninghausen para asegurar el simillimum",
        kategorie: "begleitsymptome",
        optionen: [
          "Gran sed insaciable de grandes cantidades de agua fría",
          "Ausencia total de sed a pesar de fiebre/calor",
          "Deseo de bebidas calientes / abrigo cálido",
          "Aversión al aire libre y al frío"
        ]
      });
    } else if (lang === 'fr') {
      if (!m.gemuet || m.gemuet === "Noch nicht genannt") {
        list.push({
          id: "q_gemuet",
          frage: "Quel est l'état d'esprit / l'état psychique pendant les troubles ?",
          grund: "Pilier fondamental hahnemannien pour différencier précisément le remède",
          kategorie: "gemuet",
          optionen: [
            "Irritable, colérique, veut le calme absolu (Bryonia / Nux vomica)",
            "Agitation motrice anxieuse avec peur (Aconitum / Arsenicum)",
            "Apathique, somnolent, indifférent (Gelsemium / Phosphorus)",
            "Pleurant, demande réconfort et compagnie (Pulsatilla)",
            "Équilibré, aucun changement psychique notable"
          ]
        });
      }
      list.push({
        id: "q_modalitaet",
        frage: "Comment la douleur réagit-elle à un bandage serré ou une forte pression par rapport au mouvement ?",
        grund: "Différencie le soulagement par forte pression (Silicea, Bryonia) des remèdes hypersensibles (Belladonna)",
        kategorie: "modalitaeten",
        optionen: [
          "Pression ferme et bandage soulagent nettement",
          "Le moindre mouvement et la moindre secousse aggravent",
          "Soulagement par un mouvement doux à l'air frais",
          "Ni la pression ni le mouvement ne modifient la douleur"
        ]
      });
      list.push({
        id: "q_begleit",
        frage: "Comment se comportent la soif et le besoin de chaleur pendant cet état ?",
        grund: "Symptôme général essentiel selon Bönninghausen pour étayer le remède",
        kategorie: "begleitsymptome",
        optionen: [
          "Grande soif inextinguible de grandes quantités d'eau froide",
          "Absence totale de soif malgré la chaleur/fièvre",
          "Désir de boissons chaudes / d'enveloppement chaud",
          "Aversion pour l'air frais et le froid"
        ]
      });
    } else if (lang === 'it') {
      if (!m.gemuet || m.gemuet === "Noch nicht genannt") {
        list.push({
          id: "q_gemuet",
          frage: "Qual è lo stato d'animo / la disposizione psichica durante i disturbi?",
          grund: "Pilastro cardine hahnemanniano per la precisa differenziazione del rimedio",
          kategorie: "gemuet",
          optionen: [
            "Irritabile, collerico, vuole quiete assoluta (Bryonia / Nux vomica)",
            "Irrequietezza motoria ansiosa con paura (Aconitum / Arsenicum)",
            "Apatico, assonnato, indifferente (Gelsemium / Phosphorus)",
            "Piangente, cerca conforto e compagnia (Pulsatilla)",
            "Equilibrato, nessun cambiamento evidente"
          ]
        });
      }
      list.push({
        id: "q_modalitaet",
        frage: "Come risponde il dolore a una fasciatura stretta o forte pressione rispetto al movimento?",
        grund: "Differenzia il miglioramento da forte pressione (Silicea, Bryonia) dai rimedi ipersensibili (Belladonna)",
        kategorie: "modalitaeten",
        optionen: [
          "Pressione decisa e fasciatura migliorano notevolmente",
          "Il minimo movimento o scuotimento peggiora",
          "Miglioramento con movimento dolce all'aria aperta",
          "Né pressione né movimento modificano il dolore"
        ]
      });
      list.push({
        id: "q_begleit",
        frage: "Come si comportano sete e preferenze termiche durante lo stato attuale?",
        grund: "Sintomo generale fondamentale secondo Bönninghausen per confermare il simile",
        kategorie: "begleitsymptome",
        optionen: [
          "Grande sete insaziabile di abbondante acqua fredda",
          "Assenza totale di sete nonostante calore/febbre",
          "Desiderio di bevande calde / avvolgimento caldo",
          "Avversione per aria fresca e freddo"
        ]
      });
    } else if (lang === 'el') {
      if (!m.gemuet || m.gemuet === "Noch nicht genannt") {
        list.push({
          id: "q_gemuet",
          frage: "Ποια είναι η ψυχική διάθεση κατά τη διάρκεια των ενοχλημάτων;",
          grund: "Κεντρικός πυλώνας του Χάνεμαν για την ακριβή διαφοροποίηση του φαρμάκου",
          kategorie: "gemuet",
          optionen: [
            "Ευερέθιστος, οργίλος, ζητά απόλυτη ησυχία (Bryonia / Nux vomica)",
            "Αγχώδης κινητική ανησυχία με φόβο (Aconitum / Arsenicum)",
            "Απαθής, υπνηλέος, αδιάφορος (Gelsemium / Phosphorus)",
            "Κλαψιάρης, αναζητά παρηγοριά και συντροφιά (Pulsatilla)",
            "Ισόρροπος, χωρίς ουσιαστική αλλαγή διάθεσης"
          ]
        });
      }
      list.push({
        id: "q_modalitaet",
        frage: "Πώς ανταποκρίνεται ο πόνος στη σταθερή επίδεση ή πίεση έναντι της κίνησης;",
        grund: "Διαφοροποιεί τη βελτίωση με πίεση (Silicea, Bryonia) από τα ευαίσθητα φάρμακα (Belladonna)",
        kategorie: "modalitaeten",
        optionen: [
          "Η σταθερή πίεση και η επίδεση βελτιώνουν αισθητά",
          "Η παραμικρή κίνηση επιδεινώνει",
          "Βελτίωση με ήπια συνεχή κίνηση στον καθαρό αέρα",
          "Ούτε η πίεση ούτε η κίνηση μεταβάλλουν τον πόνο"
        ]
      });
      list.push({
        id: "q_begleit",
        frage: "Πώς συμπεριφέρονται η δίψα και οι θερμοκρασιακές προτιμήσεις κατά τη διάρκεια της κατάστασης;",
        grund: "Σημαντικό γενικό σύμπτωμα κατά Bönninghausen για την επιβεβαίωση του ομοίου",
        kategorie: "begleitsymptome",
        optionen: [
          "Μεγάλη άσβεστη δίψα για μεγάλες ποσότητες κρύου νερού",
          "Πλήρης αδυναμία δίψας παρά τη ζέστη/πυρετό",
          "Επιθυμία για ζεστά ροφήματα / ζεστό τύλιγμα",
          "Απέχθεια προς τον καθαρό αέρα και το κρύο"
        ]
      });
    } else if (lang === 'ru') {
      if (!m.gemuet || m.gemuet === "Noch nicht genannt") {
        list.push({
          id: "q_gemuet",
          frage: "Каково душевное / эмоциональное состояние во время симптомов?",
          grund: "Центральный ганемановский столп для точной дифференциации лекарственного средства",
          kategorie: "gemuet",
          optionen: [
            "Раздражительный, сердитый, требует полного покоя (Bryonia / Nux vomica)",
            "Тревожное двигательное беспокойство со страхом (Aconitum / Arsenicum)",
            "Апатичный, сонный, безразличный (Gelsemium / Phosphorus)",
            "Плаксивый, ищет утешения и сочувствия (Pulsatilla)",
            "Спокойный, без заметных изменений настроения"
          ]
        });
      }
      list.push({
        id: "q_modalitaet",
        frage: "Как боль реагирует на тугую повязку или сильное давление по сравнению с движением?",
        grund: "Дифференцирует облегчение от давления (Silicea, Bryonia) от чувствительных средств (Belladonna)",
        kategorie: "modalitaeten",
        optionen: [
          "Сильное давление и повязка заметно облегчают",
          "Малейшее движение и сотрясение ухудшают",
          "Облегчение от мягкого движения на свежем воздухе",
          "Ни давление, ни движение не меняют боль"
        ]
      });
      list.push({
        id: "q_begleit",
        frage: "Как проявляются жажда и температурные предпочтения во время недомогания?",
        grund: "Важный общий симптом по Беннингхаузену для подтверждения подобия",
        kategorie: "begleitsymptome",
        optionen: [
          "Сильная неутолимая жажда большого количества холодной воды",
          "Полное отсутствие жажды несмотря на жар/лихорадку",
          "Желание теплых напитков / укутывания в тепло",
          "Отвращение к свежему воздуху и холоду"
        ]
      });
    } else {
      if (!m.gemuet || m.gemuet === "Noch nicht genannt") {
        list.push({
          id: "q_gemuet",
          frage: "Wie ist die seelische Verfassung / das Gemüt während der Beschwerden?",
          grund: "Zentrale Hahnemannsche Leitsäule zur exakten Differenzierung des Arzneimittels",
          kategorie: "gemuet",
          optionen: [
            "Reizbar, zornig, will absolute Ruhe (Bryonia / Nux vomica)",
            "Ängstliche motorische Unruhe mit Furcht (Aconitum / Arsenicum)",
            "Apathisch, schläfrig, gleichgültig (Gelsemium / Phosphor)",
            "Weinend, verlangt nach Trost und Gesellschaft (Pulsatilla)",
            "Ausgeglichen, keine wesentliche Gemütsveränderung"
          ]
        });
      }
      list.push({
        id: "q_modalitaet",
        frage: "Wie reagieren die Schmerzen auf feste Bandagierung oder starken Druck versus Bewegung?",
        grund: "Differenziert feste Druckbesserung (Silicea, Bryonia) von druck- und erschütterungsempfindlichen Mitteln (Belladonna)",
        kategorie: "modalitaeten",
        optionen: [
          "Fester Druck und Bandagierung bessern deutlich",
          "Geringste Bewegung und Erschütterung verschlimmern",
          "Besserung durch sanfte, anhaltende Bewegung",
          "Weder Druck noch Bewegung verändern die Schmerzen"
        ]
      });
      list.push({
        id: "q_begleit",
        frage: "Wie verhält sich das Durst- und Temperaturverlangen während des Zustands?",
        grund: "Wichtiges Generalsymptom nach Bönninghausen zur Absicherung des Simile",
        kategorie: "begleitsymptome",
        optionen: [
          "Großer Durst auf große Mengen kaltes Wasser",
          "Völlige Durstlosigkeit trotz Hitze/Fieber",
          "Verlangen nach warmen Getränken / Einhüllung",
          "Abneigung gegen frische Luft und Kälte"
        ]
      });
    }
    return list;
  };

  app.post("/api/hahnemann-analysis", async (req, res) => {
    try {
      const { 
        text, 
        currentMatrix, 
        conversationHistory = [], 
        language = "de", 
        forceComplete = false,
        caseType = "akut" // "akut" (§ 99) oder "chronisch" (§§ 83–98)
      } = req.body;
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "text is required" });
      }

      const langNames: Record<string, string> = {
        de: "German (Deutsch)",
        en: "English",
        el: "Greek (Ελληνικά)",
        es: "Spanish (Español)",
        fr: "French (Français)",
        it: "Italian (Italiano)",
        ru: "Russian (Русский)"
      };
      const targetLanguageName = langNames[language] || "German (Deutsch)";

      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        return res.status(503).json({ error: "GEMINI_API_KEY is not configured" });
      }

      const ai = new GoogleGenAI({ apiKey });
      const currentStepCount = conversationHistory.length + 1;
      const hasCausa = Boolean(currentMatrix?.causa && currentMatrix.causa !== "Noch nicht genannt" && currentMatrix.causa.trim().length > 0);
      const hasLokalisierung = Boolean(currentMatrix?.lokalisierung && currentMatrix.lokalisierung !== "Noch nicht genannt" && currentMatrix.lokalisierung.trim().length > 0);
      const hasEmpfindung = Boolean(currentMatrix?.empfindung && currentMatrix.empfindung !== "Noch nicht genannt" && currentMatrix.empfindung.trim().length > 0);
      const hasModalitaeten = Boolean(currentMatrix?.modalitaeten && currentMatrix.modalitaeten !== "Noch nicht genannt" && currentMatrix.modalitaeten.trim().length > 0);
      const hasBegleitsymptome = Boolean(Array.isArray(currentMatrix?.begleitsymptome) && currentMatrix.begleitsymptome.length > 0);
      const hasGemuet = Boolean(currentMatrix?.gemuet && currentMatrix.gemuet !== "Noch nicht genannt" && currentMatrix.gemuet.trim().length > 0);

      const all6PillarsFilled = hasCausa && hasLokalisierung && hasEmpfindung && hasModalitaeten && hasBegleitsymptome && hasGemuet;
      
      // Loop protection: avoid endless question loops while ensuring all 6 pillars are asked
      const maxStepsReached = conversationHistory.length >= 7;
      const mustComplete = forceComplete || all6PillarsFilled || (maxStepsReached && hasGemuet && hasModalitaeten && hasEmpfindung && hasCausa);

      const prompt = `
Du bist die zentrale Logik-Engine für eine professionelle homöopathische Anamnese streng nach den Prinzipien von Samuel Hahnemann und den Paragraphen 83 bis 104 des Organon der Heilkunst.

### LEITLINIEN AUS DEM ORGANON DER HEILKUNST (§§ 83–104):
- § 83: Vorurteilslose Beobachtung und treue Aufnahme des Krankheitsbildes ohne Spekulationen.
- § 84: Der Patient schildert seine Beschwerden; die Begleiter berichten. Der Arzt hört aufmerksam zu, ohne zu unterbrechen.
- §§ 85–90: Gezieltes Nachfragen zur Präzisierung. Jedes Einzelsymptom wird isoliert abgefragt. Niemals Suggestivfragen stellen, die dem Patienten die Antwort in den Mund legen.
- §§ 91–93: Unterscheidung chronische vs. akute Krankheiten. Bei chronischen Leiden: Erforschung früherer allopathischer Behandlungen, Arzneiwirkungen, Unterdrückungen und der Krankheitsgeschichte.
- § 94: Untersuchung von Lebensweise, Diät, Gemütszustand, häuslichen Umständen und Genesungshindernissen.
- §§ 95–98: Chronische Krankheiten: Beachtung kleiner, scheinbar unbedeutender Eigenheiten des Patienten.
- § 99: Akute Krankheiten: Erfragung des unmittelbaren Anlasses/Auslösers (Causa), des Beginns und des bisherigen akuten Verlaufs.
- §§ 100–102: Zusammenhängende / epidemische Erkrankungen: Erfassung des Gesamtbildes durch Verknüpfung der Symptome.
- §§ 103–104: Vollständiges Fixieren des Krankheitsbildes (Totalität der Symptome als Fundament des Simile).

### STRIKTE ANWEISUNG: BERÜCKSICHTIGUNG DES KONKRETEN PATIENTENSYMPTOMS & EXTRAKTION
1. Analysiere ZUERST die aktuelle Benutzereingabe ("${text.replace(/"/g, '\\"')}") sowie die bestehende Matrix.
2. Wenn der Patient in seiner Eingabe bereits ein Symptom (z.B. Kopfschmerzen, Halsschmerzen, Husten, Magenschmerzen), eine Lokalisation, eine Empfindung (z.B. klopfend, pulsierend, stechend, brennend), einen Auslöser/Causa (z.B. kalter Wind, Zugluft, Durchnässung, Schreck, Ärger) oder Modalitäten genannt hat:
   - Extrahiere diese Fakten SOFORT in die entsprechenden Felder von "wichtige_symptom_fragmente"!
   - Frage NIEMALS nach einer Säule, die der Patient bereits genannt hat oder die in der bestehenden Matrix bereits vorhanden ist.
3. Die nächste Frage ("naechste_frage") MUSS das konkrete Symptom des Patienten IMMER namentlich aufgreifen (z. B. "Zu Ihren Kopfschmerzen: ...", "Bezüglich Ihrer Halsschmerzen: ...", in der Zielsprache).
   - Es ist STRENG VERBOTEN, eine unpersönliche, abstrakte Allgemeinfrage wie "Woher kommen die Symptome?" oder "Gab es einen Auslöser?" ohne Bezug zum konkreten Symptom zu stellen.
   - Frage immer gezielt nach der nächsten TATSÄCHLICH NOCH FEHLENDEN Säule bezogen auf dieses konkrete Symptom!

### STRIKTE UNTERSCHEIDUNG: AKUT VS. CHRONISCH:
Aktueller Fall-Typ: "${caseType === 'chronisch' ? 'CHRONISCHER FALL (§§ 83–98 Organon)' : 'AKUTER FALL (§ 99 Organon)'}"
${caseType === 'chronisch' ? `
- Bei chronischen Krankheiten erforschst du umfassend die gesamte Historie inklusive früherer Behandlungen, allopathischer Medikamente, Unterdrückungen und Lebensweise.
- Frage nach dem langfristigen Verlauf, Beginn vor Monaten/Jahren und früheren Krankheitsereignissen.
` : `
- Bei akuten Beschwerden erfragst du den unmittelbaren Auslöser (Causa: Kälte, Zugluft, Durchnässung, Schreck, Zorn, Überanstrengung, Speisen etc.) und die aktuellen akuten Symptome samt raschem/stetigem Beginn, falls noch nicht geschildert.
`}

### URSÄCHLICHER ZUSAMMENHANG BEI MEHREREN BESCHWERDEN:
Bei der Aufnahme mehrerer Beschwerden (z. B. Fieber und Kopfschmerzen, Husten und Halsschmerzen) prüfst du IMMER zuerst, ob ein ursächlicher Zusammenhang besteht. Hinterfrage, ob beide durch denselben Auslöser/Infekt hervorgerufen wurden, um sie als zusammenhängenden Komplex zu erfassen.

### HOMÖOPATHISCHE STRUKTUR FÜR JEDES SYMPTOM (Bestehender Stand vor aktueller Eingabe):
1. Causa (Auslöser oder Beginn): ${hasCausa ? "Erfasst: " + currentMatrix.causa : "Falls in Eingabe genannt -> extrahieren, sonst erfragen"}
2. Lokalisation (Ort und Strahlungsoptionen / Ausstrahlung): ${hasLokalisierung ? "Erfasst: " + currentMatrix.lokalisierung : "Falls in Eingabe genannt -> extrahieren, sonst erfragen"}
3. Sensation (Qualität der Beschwerde / Schmerzcharakter): ${hasEmpfindung ? "Erfasst: " + currentMatrix.empfindung : "Falls in Eingabe genannt -> extrahieren, sonst erfragen"}
4. Modalitäten (Verschlechterung oder Besserung durch Wärme, Kälte, Ruhe, Bewegung, Druck, Tageszeit): ${hasModalitaeten ? "Erfasst: " + currentMatrix.modalitaeten : "Falls in Eingabe genannt -> extrahieren, sonst erfragen"}
5. Begleitsymptome und das Gemüt (Concomitants wie Durst, Schweiß, Temperaturverlangen UND psychischer Zustand / Gemütsverfassung wie Unruhe, Reizbarkeit, Furcht, Apathie): ${hasBegleitsymptome && hasGemuet ? "Erfasst: Begleit=" + currentMatrix.begleitsymptome.join(", ") + " | Gemüt=" + currentMatrix.gemuet : "Falls in Eingabe genannt -> extrahieren, sonst erfragen"}

### VERMEIDUNG HALLUZINIERTER SYMPTOME & MINIMAL-EINGABEN:
- Erfasse jeden Patienten absolut individuell und vermeide halluzinierte Symptome! Nimm nur auf, was der Patient explizit geäußert hat. Füge keine hypothetischen Symptome hinzu, die nicht genannt wurden.
- WENN DER PATIENT NUR EIN EINZELNES WORT ODER KURZES SYMPTOM EINGIBT (z. B. "Fieber", "Kopfschmerzen", "Halsschmerzen", "Bauchschmerzen"):
  * Trage in "wichtige_symptom_fragmente" NUR die Lokalisation ein (z. B. "Fieber" bzw. "Kopfschmerzen").
  * Setze "causa", "empfindung", "modalitaeten" und "gemuet" zwingend auf null und "begleitsymptome" auf []!
  * Erfinde KEINESFALLS Auslöser (wie Meerwasser, Sonnenhitze, Kälte) oder Modalitäten (wie Besserung durch Wärme), wenn diese vom Patienten nicht genannt wurden!
  * Frage in "naechste_frage" nach der ersten tatsächlich noch fehlenden Säule (z. B. Causa / Auslöser).

### VORDEFINIERTE ANKLICKBARE OPTIONEN:
Für die Fragen generierst du im Pop-up stets 4 bis 6 vordefinierte, treffende homöopathische anklickbare Optionen passend zum individuellen Symptom des Patienten. (Der Anwender erhält im Frontend dazu stets ein verbindliches Freitextfeld).

### BEENDIGUNG ODER WEITERE FRAGE:
Soll jetzt abgeschlossen werden? ${mustComplete ? "JA (Abschluss der Organon-Anamnese)" : "NEIN (nächste Frage stellen)"}.
${mustComplete ? `
-> ABSCHLUSS-MODUS:
- "analyse_status": "completed"
- "naechste_frage": ""
- "auswahl_optionen": []
- "end_analyse_zusammenfassung": Hochpräzise Zusammenfassung für den Therapeuten streng nach Hahnemann & Bönninghausen (Causa/Auslöser, Lokalisation & Strahlung, Sensation, Modalitäten, Begleitsymptome & Gemüt, ursächlicher Zusammenhang/Symptomkomplex, führendes Simile).
- "aktuelle_mittel_differenzierung": 3 bis 5 passendste lateinische Arzneimittel.
- "sich_ergebende_fragen": Falls entscheidende Nuancen zwischen den Top-Mitteln verbleiben, GENAU 1 BIS MAXIMAL 2 gezielte Kontrollfragen.
` : `
-> LAUFENDE ERHEBUNG (Schritt ${currentStepCount}):
- "analyse_status": "in_progress"
- Frage gezielt nach der nächsten tatsächlich fehlenden Säule bezogen auf das konkrete Symptom des Patienten.
- "naechste_frage": Genau EINE präzise Einzelfrage, die das Symptom des Patienten ausdrücklich nennt.
- "auswahl_optionen": 4 bis 6 treffende homöopathische Antwortoptionen zum Anklicken.
`}

### AUSGABE-FORMAT (Strikte JSON-Struktur):
Antworte AUSSCHLIESSLICH mit validem JSON in genau diesem Format (ohne Markdown, ohne Text davor oder danach):
{
  "analyse_status": "${mustComplete ? "completed" : "in_progress"}",
  "wichtige_symptom_fragmente": {
    "causa": null,
    "lokalisierung": null,
    "empfindung": null,
    "modalitaeten": null,
    "begleitsymptome": [],
    "gemuet": null,
    "strahlungsoptionen": null,
    "ursaechlicher_zusammenhang": null,
    "fruehere_behandlungen_und_historie": null
  },
  "falltyp": "${caseType}",
  "mehrere_symptome_erkannt": false,
  "symptomkomplex_bestaetigt": false,
  "ignorierte_daten": [],
  "kontroll_und_nachfrage_logik": "Begründung nach Organon §§ 83-104",
  "naechste_frage": "${mustComplete ? "" : "Hier steht genau eine gezielte Einzelfrage zur fehlenden Säule"}",
  "auswahl_optionen": ${mustComplete ? "[]" : '["Option 1", "Option 2", "Option 3", "Option 4"]'},
  "auswahl_typ": "multiple",
  "aktuelle_mittel_differenzierung": ["Mittel 1", "Mittel 2", "Mittel 3"],
  "end_analyse_zusammenfassung": ${mustComplete ? '"Zusammenfassung für den Therapeuten: ..."' : "null"},
  "sich_ergebende_fragen": ${mustComplete ? `[
    {
      "id": "q1",
      "frage": "Differenzierende Frage zwischen den führenden Mitteln",
      "grund": "Klärung der Leitsymptome nach Organon",
      "kategorie": "modalitaeten",
      "optionen": ["Option A", "Option B", "Weder noch"]
    }
  ]` : "[]"}
}

Bestehende Matrix (bisherige Fakten):
${JSON.stringify(currentMatrix || {}, null, 2)}

Bisheriger Verlauf:
${JSON.stringify(conversationHistory || [], null, 2)}

Aktuelle Benutzereingabe:
"${text.replace(/"/g, '\\"')}"

SPRACHE: Alle Fragen, Optionen und Zusammenfassungen in ${targetLanguageName} formulieren. Arzneimittelnamen stets in offiziellem Latein (z. B. Aconitum napellus, Belladonna, Bryonia alba).
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      const usage = (response as any).usageMetadata || {};
      recordTokenUsage({
        therapistId: req.body?.therapistId,
        therapistName: req.body?.therapistName,
        therapistEmail: req.body?.therapistEmail,
        endpoint: "/api/hahnemann-analysis",
        actionName: `Hahnemann Organon §§ 83-104 Anamnese (${caseType})`,
        model: "gemini-3.8-flash",
        promptTokens: usage.promptTokenCount || Math.ceil(prompt.length / 4),
        candidatesTokens: usage.candidatesTokenCount || Math.ceil((response.text || "").length / 4),
      });

      const rawParsed = JSON.parse(response.text || "{}");

      // Robust fallback safeguard: enforce completion if steps reached or forceComplete was passed
      if (mustComplete) {
        rawParsed.analyse_status = "completed";
        rawParsed.naechste_frage = "";
        rawParsed.auswahl_optionen = [];
        if (!rawParsed.end_analyse_zusammenfassung) {
          const m = rawParsed.wichtige_symptom_fragmente || currentMatrix || {};
          rawParsed.end_analyse_zusammenfassung = getLocalizedOrganonSummary(m, language);
        }
      }

      // Ensure 2 to 3 clarifying questions exist when completed (never empty, strictly in moderation)
      if (rawParsed.analyse_status === "completed") {
        const m = rawParsed.wichtige_symptom_fragmente || currentMatrix || {};
        if (!Array.isArray(rawParsed.sich_ergebende_fragen) || rawParsed.sich_ergebende_fragen.length === 0) {
          rawParsed.sich_ergebende_fragen = getLocalizedClarifyingQuestions(m, language).slice(0, 3);
        } else if (rawParsed.sich_ergebende_fragen.length > 3) {
          // Strictly keep in moderation (max 3)
          rawParsed.sich_ergebende_fragen = rawParsed.sich_ergebende_fragen.slice(0, 3);
        }
      }

      res.json({ result: rawParsed });
    } catch (error) {
      console.error("Hahnemann Analysis Error:", error);
      res.status(500).json({ error: "Failed to perform Hahnemann analysis." });
    }
  });

  app.post("/api/check-medical-relevance", async (req, res) => {
    try {
      const { text, language = "de" } = req.body;
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.json({ isRelevant: false, reason: "empty_text" });
      }

      const trimmedText = text.trim();

      const apiKey = getGeminiApiKey();
      // If no API key or in case of offline fallback, evaluate quickly
      if (!apiKey) {
        return res.json({ isRelevant: true, reason: "no_api_key_passthrough" });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Du bist ein strenger medizinischer Relevanzfilter für eine professionelle Anwendung zur Erfassung von Informationen für eine medizinische bzw. homöopathische Anamnese und Befunddokumentation.

AUFGABE:
Prüfe die folgende gesprochene/transkribierte Benutzeraussage im gesamten Sinnzusammenhang:
"${trimmedText.replace(/"/g, '\\"')}"

KRITERIEN:
1. AKZEPTIEREN ("isRelevant": true):
Die Aussage enthält gesundheitliche, medizinische, psychosomatische, therapeutische oder befundrelevante Informationen.
Dazu gehören u.a.:
- Symptome, Beschwerden, Schmerzen, Empfindungen, Krankheitsgefühl, Einschränkungen
- Vorerkrankungen, Operationen, Allergien, Unverträglichkeiten, Familienanamnese
- Medikamente, Dosierungen, Einnahmeintervalle, Nahrungsergänzungsmittel, Hausmittel
- Vitalparameter, Blutdruck, Puls, Laborwerte, körperliche Untersuchungsbefunde
- Modalitäten (Besserung/Verschlimmerung durch Wärme, Kälte, Bewegung, Ruhe, Tageszeit, Wetter, Berührung etc.)
- Begleitsymptome, Schlaf, Appetit, Durst, Verdauung, Gemütszustände, Stressreaktionen
- Homöopathische Leitsymptome, Charakteristika, Wesenszüge oder Auslöser von Beschwerden
- Konkrete Aussagen zu Behandlungsgründen oder Krankheitsverläufen

2. ABLEHNEN ("isRelevant": false):
Die Aussage hat KEINEN inhaltlichen Bezug zu Gesundheit, Krankheit, Beschwerden, Befunden oder Anamnese.
Dazu gehören u.a.:
- Reiner Begrüßungs- oder Höflichkeits-Smalltalk ohne Beschwerden (z. B. "Hallo wie geht es dir", "Guten Morgen", "Schönen Tag")
- Technische Kommentare oder Tests (z. B. "Test eins zwei drei", "Funktioniert das Mikrofon", "Hörst du mich", "Knopf drücken")
- Alltägliche Belanglosigkeiten ohne Gesundheitsbezug (z. B. "Ich gehe jetzt einkaufen", "Das Wetter ist heute sonnig", "Was kostet ein Auto", "Wie spät ist es", "Erzähl mir einen Witz")
- Kauderwelsch, zusammenhanglose Füllphrasen oder Störlaute ohne Sinn

Beurteile immer den GESAMTEN Sinnzusammenhang, nicht isolierte Wörter.

Antworte AUSSCHLIESSLICH im JSON-Format:
{
  "isRelevant": true,
  "reason": "kurze Begründung"
}
oder
{
  "isRelevant": false,
  "reason": "kurze Begründung"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      const usage = (response as any).usageMetadata || {};
      recordTokenUsage({
        therapistId: req.body?.therapistId,
        therapistName: req.body?.therapistName,
        therapistEmail: req.body?.therapistEmail,
        endpoint: "/api/check-medical-relevance",
        actionName: "Medizinischer Relevanz-Check",
        model: "gemini-3.8-flash",
        promptTokens: usage.promptTokenCount || Math.ceil(prompt.length / 4),
        candidatesTokens: usage.candidatesTokenCount || Math.ceil((response.text || "").length / 4),
      });

      const parsed = JSON.parse(response.text || '{"isRelevant": true}');
      res.json({
        isRelevant: Boolean(parsed.isRelevant),
        reason: parsed.reason || ""
      });
    } catch (error) {
      console.error("Gemini Medical Relevance Filter Error:", error);
      // Fallback: If Gemini error occurs, do a basic check
      const trimmed = (req.body?.text || '').trim().toLowerCase();
      const nonMedicalPatterns = [
        /^test(\s+1|\s+2|\s+3|\s+eins|\s+zwei|\s+drei)?$/i,
        /^(hallo|hi|guten tag|guten morgen|servus|moin|ciao)(\s+(wie gehts|wie geht es dir))?$/i,
        /^(geht das|funktioniert das|h[öo]rst du mich|kannst du mich h[öo]ren|mikrofon test)$/i,
        /^(1\s*2\s*3|eins\s*zwei\s*drei|one\s*two\s*three)$/i
      ];
      const isObviouslyNonMedical = nonMedicalPatterns.some(p => p.test(trimmed));
      res.json({
        isRelevant: !isObviouslyNonMedical,
        reason: isObviouslyNonMedical ? "heuristic_non_medical" : "fallback_accepted"
      });
    }
  });

  // Helper for extracting JSON from AI response (handles markdown fences or raw json)
  function extractJsonFromText(text: string): any {
    if (!text) return null;
    let clean = text.trim();
    const jsonMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      clean = jsonMatch[1].trim();
    }
    try {
      return JSON.parse(clean);
    } catch {
      const firstBracket = clean.indexOf('[');
      const lastBracket = clean.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        try {
          return JSON.parse(clean.substring(firstBracket, lastBracket + 1));
        } catch {}
      }
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
          return JSON.parse(clean.substring(firstBrace, lastBrace + 1));
        } catch {}
      }
      return null;
    }
  }

  // -----------------------------------------------------------------------------------------
  // 3-Stufen Pharmazeutischer Assistent Workflow:
  // Schritt 1 (Datenbank prüfen): search_database(q)
  // Schritt 2 (Externe Behördensuche): search_health_authority(q) mit BfArM, EMA, EOF & Fachinformation
  // Schritt 3 (Automatisch Abspeichern): save_to_database(results)
  // -----------------------------------------------------------------------------------------
  app.get("/api/medications/search", async (req, res) => {
    try {
      const q = (req.query.q as string || '').trim();
      const lang = (req.query.lang as string || 'de').trim();
      if (!q || q.length < 1) {
        return res.json({ results: [], fromDatabase: false, totalInDb: getDatabaseCount() });
      }

      const apiKey = getGeminiApiKey();
      const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
      const force = req.query.force === '1' || req.query.force === 'true';

      const outcome = await run3StepMedicationSearch(q, ai, extractJsonFromText, force, lang);
      res.json(outcome);
    } catch (error) {
      console.error("[MedicationAssistant] API Search Error:", error);
      // Fail-safe: Try local database search even if exception occurred
      try {
        const fallback = search_database(req.query.q as string || '');
        return res.json({
          results: fallback.matches,
          fromDatabase: true,
          stepExecuted: "database_match",
          totalInDb: getDatabaseCount()
        });
      } catch {
        res.status(500).json({ error: "Search failed", results: [] });
      }
    }
  });

  function getBaseMedName(name: string): string {
    if (!name) return 'text';
    return name.toLowerCase()
      .replace(/\b\d+(\s*,\s*\d+)?\s*(mg|g|µg|ug|ml|ie)\b/gi, '')
      .replace(/\b(al|ratiopharm|1a pharma|heumann|hexal|stada|pfizer|bayer|novartis|teva)\b/gi, '')
      .replace(/[®™]/g, '')
      .trim();
  }

  // Dedicated endpoint for full pharmaceutical profile with 3-step flow
  app.get("/api/medications/details", async (req, res) => {
    try {
      const name = (req.query.name as string || '').trim();
      const lang = (req.query.lang as string || 'de').trim();
      if (!name || name.length < 1) return res.status(400).json({ error: "Missing name" });

      const apiKey = getGeminiApiKey();
      const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

      const outcome = await run3StepMedicationDetails(name, ai, extractJsonFromText, lang);

      // If requested language is not German and details exist, check if translation is cached or translate live
      if (outcome && outcome.details && lang && lang !== 'de') {
        const directKey = `${name.toLowerCase().trim()}_${lang}`;
        const baseKey = `${getBaseMedName(name)}_${lang}`;
        const cache = getMedicationTranslations();
        const cached = cache[directKey] || cache[baseKey];

        if (cached) {
          if (typeof cached === 'object' && cached !== null) {
            outcome.details = { ...outcome.details, ...(cached as Record<string, any>) } as any;
          } else if (typeof cached === 'string') {
            outcome.details.monographText = cached;
          }
        } else if (ai) {
          try {
            const langNames: Record<string, string> = {
              de: "German (Deutsch)",
              en: "English",
              el: "Greek (Ελληνικά)",
              es: "Spanish (Español)",
              fr: "French (Français)",
              it: "Italian (Italiano)",
              ru: "Russian (Русский)"
            };
            const targetLanguageName = langNames[lang] || "English";

            const toTranslate = {
              activeSubstance: outcome.details.activeSubstance || '',
              category: outcome.details.category || '',
              recommendedIntake: outcome.details.recommendedIntake || '',
              sideEffectsByFrequency: outcome.details.sideEffectsByFrequency || null,
              sideEffects: outcome.details.sideEffects || [],
              interactions: outcome.details.interactions || [],
              contraindications: outcome.details.contraindications || null,
              warnings: outcome.details.warnings || '',
              monographText: outcome.details.monographText || ''
            };

            const prompt = `You are a licensed clinical and pharmaceutical translator.
Translate the following medication clinical profile accurately into ${targetLanguageName}.
CRITICAL INSTRUCTIONS:
1. Translate active substance name, category, side effects, interactions, contraindications, warnings, and the 5-section monograph into ${targetLanguageName}.
2. Retain the exact JSON structure.
3. Return ONLY a valid JSON object matching the input keys.

Input JSON:
${JSON.stringify(toTranslate, null, 2)}`;

            const trRes = await ai.models.generateContent({
              model: "gemini-flash-latest",
              contents: prompt
            });
            const trText = trRes.text ? trRes.text.trim() : "";
            const parsedTr = extractJsonFromText(trText);

            if (parsedTr && typeof parsedTr === 'object' && (parsedTr.monographText || parsedTr.sideEffects)) {
              saveMedicationTranslation(directKey, parsedTr);
              saveMedicationTranslation(baseKey, parsedTr);
              outcome.details = { ...outcome.details, ...parsedTr };
            } else if (trText && trText.length > 50) {
              saveMedicationTranslation(directKey, trText);
              saveMedicationTranslation(baseKey, trText);
              outcome.details.monographText = trText;
            }
          } catch (trErr) {
            console.warn("[MedicationDetails] Live translation error:", trErr);
          }
        }
      }

      res.json(outcome);
    } catch (error) {
      console.error("[MedicationAssistant] API Details Error:", error);
      try {
        const fallback = search_database(req.query.name as string || '');
        return res.json({
          details: fallback.bestMatch || null,
          fromDatabase: Boolean(fallback.bestMatch),
          stepExecuted: "database_match"
        });
      } catch {
        res.status(500).json({ error: "Details lookup failed", details: null });
      }
    }
  });

  // Dedicated translation endpoint for full clinical monograph into any app language
  app.post("/api/medications/translate", async (req, res) => {
    try {
      const { text, targetLang = "de", medName } = req.body;
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: "text is required" });
      }

      if (targetLang === "de") {
        return res.json({ translatedText: text, targetLang: "de", cached: true });
      }

      const directKey = `${(medName || 'text').toLowerCase().trim()}_${targetLang}`;
      const baseKey = `${getBaseMedName(medName || 'text')}_${targetLang}`;
      const cache = getMedicationTranslations();
      if (cache[directKey] || cache[baseKey]) {
        return res.json({ translatedText: cache[directKey] || cache[baseKey], targetLang, cached: true });
      }

      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        return res.status(503).json({ error: "GEMINI_API_KEY is not configured" });
      }

      const langNames: Record<string, string> = {
        de: "German (Deutsch)",
        en: "English",
        el: "Greek (Ελληνικά)",
        es: "Spanish (Español)",
        fr: "French (Français)",
        it: "Italian (Italiano)",
        ru: "Russian (Русский)"
      };
      const targetLanguageName = langNames[targetLang] || "English";

      const ai = new GoogleGenAI({ apiKey });
      const isComparison = req.body.type === 'comparison' || medName?.startsWith('comparison_');

      const prompt = isComparison
        ? `You are a certified senior clinical pharmacologist and medical translator.
Translate the following evidence-based clinical pharmacology and drug-interaction comparison report into ${targetLanguageName}.

CRITICAL REQUIREMENTS:
1. Preserve the exact markdown structure, section headers (### ⚠️ ..., ### 1. ..., ### 2. ..., ### 3. ...), and markdown tables.
2. Maintain strict GitHub Flavored Markdown (GFM) table syntax: each row must begin and end with '|'. DO NOT output broken delimiter rows like "| :--- | :--- |" in body text.
3. Accurately translate clinical terminology, drug risk classifications, triage categories, organ systems, and diagnostic checklist questions into ${targetLanguageName}.
4. Output ONLY the clean translated markdown in ${targetLanguageName} without markdown code fences, greetings, or conversational remarks.

Clinical report to translate:
${text}`
        : `You are a licensed medical and pharmaceutical translator for clinical staff.
Translate the following official medication monograph into ${targetLanguageName}.

CRITICAL REQUIREMENTS:
1. Maintain the exact 5-section structure and emoji headers:
   📝 1. [Active substance and ingredients]
   💊 2. [Dosage & administration]
   ⚠️ 3. [Side effects]
   🚫 4. [Contraindications]
   ❌ 5. [Dangerous drug interactions]
2. Preserve all numbers, dosages, units, and brand names.
3. Translate all clinical warnings, side effect frequencies (very common, common, uncommon, rare, very rare), and contraindications accurately and completely.
4. Output ONLY the translated monograph in ${targetLanguageName} without markdown code blocks, conversational comments, or explanations.

Monograph text to translate:
${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt
      });

      const translatedText = response.text ? response.text.trim() : "";
      if (translatedText && translatedText.length > 50) {
        saveMedicationTranslation(directKey, translatedText);
        saveMedicationTranslation(baseKey, translatedText);

        recordTokenUsage({
          endpoint: '/api/medications/translate',
          actionName: `Medikamenten-Monographie Übersetzung (${targetLang.toUpperCase()})`,
          model: 'gemini-flash-latest',
          promptTokens: response.usageMetadata?.promptTokenCount || 400,
          candidatesTokens: response.usageMetadata?.candidatesTokenCount || 600
        });

        return res.json({ translatedText, targetLang, cached: false });
      }

      res.status(500).json({ error: "Empty translation result" });
    } catch (err) {
      console.error("[MedicationTranslation] Error:", err);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  // Endpoint to inspect pharmaceutical database stats
  app.get("/api/medications/database", (req, res) => {
    try {
      const count = getDatabaseCount();
      res.json({
        totalCount: count,
        source: "BfArM / EMA / EOF & verifizierte Praxisdatenbank",
        status: "ready"
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to read database stats" });
    }
  });

  // Clinical Pharmacology Comparison & Multi-Medication Risk Analysis API
  app.post("/api/medications/clinical-comparison", async (req, res) => {
    try {
      const { patientCase, lifestyle, language } = req.body;
      const apiKey = getGeminiApiKey();

      if (!apiKey) {
        return res.status(503).json({ error: "No API key configured" });
      }

      const meds = patientCase?.medikamenteList || [];
      const ai = new GoogleGenAI({ apiKey });

      const targetLang = (language as string) || 'de';
      const langNames: Record<string, string> = {
        de: "German (Deutsch)",
        en: "English",
        el: "Greek (Ελληνικά)",
        es: "Spanish (Español)",
        fr: "French (Français)",
        it: "Italian (Italiano)",
        ru: "Russian (Русский)"
      };
      const targetLanguageName = langNames[targetLang] || "German (Deutsch)";

      const isSmoker = Boolean(lifestyle?.isSmoker || lifestyle?.smokingStatus === 'smoker');
      const hasAlcohol = Boolean(lifestyle?.alcoholDaily || lifestyle?.alcoholFrequency === 'daily' || (lifestyle?.alcoholFrequency && lifestyle?.alcoholFrequency !== 'never'));

      const prompt = `
Du bist ein führender klinischer Pharmakologe und international anerkannter Experte für Arzneimittelsicherheit. Deine Aufgabe ist es, komplexe Patientenprofile, bestehend aus Mehrfachmedikation (inkl. Dosis), Patientendaten (Alter, Geschlecht, Gewicht, Größe, BMI), Schwangerschaftsstatus (inkl. genauer Woche/Monat) und Lebensstilfaktoren (Alkohol ja/nein, Rauchen ja/nein), auf kombinierte Risiken zu analysieren.

SPRACHANFORDERUNG (STRIKT & VERPFLICHTEND):
Verfasse die gesamte klinische Analyse und alle Textabschnitte, Überschriften, Tabellenköpfe und Empfehlungen VOLLSTÄNDIG in der Sprache: ${targetLanguageName}.
Verwende die authentische, exakte medizinisch-pharmakologische Fachterminologie in dieser Sprache (${targetLanguageName}).

Befolge für eine fehlerfreie, professionelle und evidenzbasierte Auswertung strikt folgende medizinisch-fachliche Vorgaben:

1. KEINE ISOLIERTE BETRACHTUNG: Analysiere die kumulative Gesamtwirkung aller verordneten Medikamente und patientenspezifischen Faktoren als Gesamtsynergie im Körper.
2. ALKOHOL & RAUCHEN (BINÄRE PARAMETER & INTERAKTIONSFOKUS):
   - Alkohol und Rauchen werden AUSSCHLIESSLICH binär erfasst (Ja oder Nein). Gib NIEMALS Milligramm-Angaben (mg/Tag) oder Zigarettenmengen aus.
   - Weise generell NUR DANN auf Gefahren durch Alkohol oder Rauchen hin, wenn diese in direktem Zusammenhang mit den eingenommenen Medikamenten stehen (Wechselwirkungen, Wirkungsverstärkung oder -minderung) ODER bei Schwangeren.
   - Bei Schwangeren weise mit erhöhter Priorität auf die gravierenden Gefahren hin (teratogene Risiken, FASD, fetale Schädigungen, intrauterine Wachstumsretardierung).
   - Falls keine direkte Wechselwirkung mit den Medikamenten vorliegt und keine Schwangerschaft besteht, stelle klar, dass keine direkte pharmakologische Interaktion mit der aktuellen Medikation vorliegt.
3. ÜBERGEWICHT & KÖRPERBAU (PHARMAKOKINETIK & DOSIERUNGSRELEVANZ):
   - Berücksichtige den Faktor Übergewicht/Körperbau NUR DANN, wenn er einen direkten Einfluss auf die Pharmakokinetik oder die Dosierung der ausgewählten Medikamente hat.
   - Erkenne extreme Unterschiede im Körperbau (z. B. 50 kg / 160 cm im Vergleich zu 120 kg / 190 cm): Lipophile Wirkstoffe (vergrößertes Verteilungsvolumen, verlängerte Halbwertszeit bei Adipositas), hydrophile Wirkstoffe (Gefahr toxischer Überdosierung bei Dosierung nach Gesamtkörpergewicht statt Idealgewicht) oder DOACs (Dosisreduktion bei ≤ 60 kg), und weise professionell darauf hin.
4. TRIMESTRALE SPEZIFITÄT: Bei Schwangerschaft schlüssle das exakte Risiko für den spezifischen Schwangerschaftsmonat (bzw. das Trimenon) sowohl für die Mutter als auch embryotoxikologisch für den Fötus auf.
5. ABSOLUTES HALLUZINATIONSVERBOT: Du darfst nur medizinisch und wissenschaftlich gesicherte Interaktionen nennen.
6. SAUBERE TABELLENFORMATIERUNG (GFM): Verwende saubere, geschlossene Markdown-Tabellen.

PATIENTENDATEN & PROFIL:
- Patient/in: ${patientCase?.patientName || 'Anonym'}
- Alter: ${patientCase?.geburtsdatum ? patientCase.geburtsdatum : 'nicht angegeben'}
- Geschlecht: ${patientCase?.geschlecht || 'weiblich'}
- Körpergewicht: ${lifestyle?.bodyWeightKg || patientCase?.befundDetails?.gewicht || 70} kg
- Körpergröße: ${lifestyle?.bodyHeightCm || patientCase?.patientHeightCm || patientCase?.befundDetails?.groesse || 170} cm
- Body-Mass-Index (BMI): ${lifestyle?.bmi ? `${lifestyle.bmi} kg/m²` : 'Standard'}
- Schwangerschaft: ${lifestyle?.isPregnant ? `Ja, ${lifestyle.pregnancyMonth || patientCase?.pregnancyMonth || 1}. Schwangerschaftsmonat` : 'Nein / nicht schwanger'}
- Rauchen: ${isSmoker ? 'Ja (Raucher)' : 'Nein (Nichtraucher)'}
- Alkoholkonsum: ${hasAlcohol ? 'Ja (Alkoholkonsum angegeben)' : 'Nein (Kein Alkoholkonsum)'}

VERORDNETE MEDIKAMENTE:
${JSON.stringify(meds, null, 2)}

Generiere den Output EXAKT in folgender Struktur in der Zielsprache (${targetLanguageName}):

### ⚠️ [WICHTIGER MEDIZINISCHER WARNHINWEIS / IMPORTANT MEDICAL NOTICE]
(Verfasse den Hinweis in ${targetLanguageName}, dass diese Analyse der Risiko-Früherkennung dient und keine ärztliche Konsultation ersetzt.)

### 1. [KLINISCHE DRINGLICHKEIT (Triage) / CLINICAL TRIAGE]
Gib eine klare, ganzheitliche Einstufung des Gesamtrisikos an.
WICHTIG: Die Beurteilung MUSS zwingend ALLE vorhandenen Daten (alle verordneten Medikamente mit Dosierung, Konstitution/BMI, Schwangerschaftsmonat/-trimenon und Lebensstilfaktoren wie Alkohol und Rauchen) gleichzeitig berücksichtigen und würdigen. Beziehe dich NIEMALS isoliert nur auf einen Einzelfaktor, sondern stelle die kumulative Gesamtsituation dar.
Verwende am Anfang der Beurteilung genau eines der folgenden Schlüsselwörter:
- [KRITISCH / AKUTE LEBENSGEFAHR] (oder in ${targetLanguageName}: [CRITICAL] / [ΚΡΙΣΙΜΟ] etc.): (Multidimensionale Gesamtwürdigung)
ODER
- [HOCH] (oder in ${targetLanguageName}: [HIGH] / [ΥΨΗΛΟ] etc.): (Multidimensionale Gesamtwürdigung)
ODER
- [GERING / ÜBERWACHUNG] (oder in ${targetLanguageName}: [LOW] / [ΧΑΜΗΛΟ] etc.): (Multidimensionale Gesamtwürdigung)

### 2. [INTEGRATIVE RISIKO-MATRIX / RISK MATRIX]
Erstelle eine saubere, vollständige Markdown-Tabelle im GFM-Format. Jede Zeile MUSS mit | beginnen und mit | enden.
Spalten (in ${targetLanguageName} übersetzt):
| Analysierte Konstellation | Biologischer Wirkmechanismus | Spezifisches Risiko für den Patienten | Spezifisches Risiko für den Fötus (Schwangerschaft) | Priorisierte Überwachungs-Parameter |
| :--- | :--- | :--- | :--- | :--- |

Zeilen:
| **[Medikament A] + [Medikament B]** | Direkte Kreuzreaktion | Mütterliche/Patienten-Gefahr | Fötale Auswirkung | Notwendige Kontrollen |
| **Synergie mit Schwangerschaft** | Pathophysiologie im spezifischen Monat/Trimester | Risiken Komplikationen | Embryotoxizität | Kontrolluntersuchungen |
| **Kombination + Lebensstil** | Toxische Verstärkung | Beschleunigung von Organschäden | Akute Schädigung | Verhaltensanweisung |

### 3. [DIAGNOSTISCHER LEITFADEN FÜR DEN ARZTBESUCH / CLINICAL GUIDELINE]
Checkliste für den Patienten:
- Konkrete Fragen an den behandelnden Arzt
- Dringende Labor-/Untersuchungs-Anforderungen
- Alarmsymptome, bei denen unverzüglich der Notruf gewählt werden muss
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const markdownContent = response.text || '';
      if (!markdownContent) {
        return res.status(500).json({ error: "Empty response from clinical pharmacology model" });
      }

      const upper = markdownContent.toUpperCase();
      let triageLevel: 'critical' | 'high' | 'low' = 'low';
      let triageLabel = '[GERING / ÜBERWACHUNG]';

      if (
        upper.includes('KRITISCH') ||
        upper.includes('CRITICAL') ||
        upper.includes('ΚΡΙΣΙΜ') ||
        upper.includes('CRÍTICO') ||
        upper.includes('CRITIQUE') ||
        upper.includes('КРИТИЧЕСК')
      ) {
        triageLevel = 'critical';
        triageLabel = '[KRITISCH / AKUTE LEBENSGEFAHR]';
      } else if (
        upper.includes('HOCH') ||
        upper.includes('HIGH') ||
        upper.includes('ΥΨΗΛ') ||
        upper.includes('ALTO') ||
        upper.includes('ÉLEVÉ') ||
        upper.includes('ELEVE') ||
        upper.includes('ВЫСОК')
      ) {
        triageLevel = 'high';
        triageLabel = '[HOCH]';
      }

      recordTokenUsage({
        endpoint: '/api/medications/clinical-comparison',
        actionName: `Klinische Pharmakologie & Mehrfachmedikations-Vergleich (${targetLang.toUpperCase()})`,
        model: 'gemini-2.5-flash',
        promptTokens: response.usageMetadata?.promptTokenCount || 600,
        candidatesTokens: response.usageMetadata?.candidatesTokenCount || 900
      });

      return res.json({
        analyzedAt: new Date().toISOString(),
        triageLevel,
        triageLabel,
        markdownContent,
        medicationsSummary: meds.map((m: any) => `${m.name} (${m.dosierung || 'Standard'})`),
        patientProfileSummary: {
          gender: patientCase?.geschlecht,
          isPregnant: lifestyle?.isPregnant,
          pregnancyMonth: lifestyle?.pregnancyMonth,
          alcoholPureMgPerDay: lifestyle?.alcoholPureMgPerDay,
        }
      });
    } catch (err: any) {
      console.error("[ClinicalComparison] Error:", err?.message || err);
      res.status(500).json({ error: "Clinical comparison failed", details: err?.message });
    }
  });

  // Admin Credentials & Config Persistence API
  const DEFAULT_ADMIN = {
    email: process.env.ADMIN_EMAIL || 'p.stogian@yahoo.com',
    password: process.env.ADMIN_PASSWORD || 'Othonospet@19071963',
    resetEmailDestination: process.env.ADMIN_RESET_EMAIL || process.env.ADMIN_EMAIL || 'p.stogian@yahoo.com',
  };

  const DEFAULT_EMAIL_SETTINGS = {
    sendMethod: process.env.MAIL_SEND_METHOD || 'api',
    apiToken: process.env.MAILBOX_API_TOKEN || 'ca5694e04833ec07a5a65dbe06af56952c3e1fb04cc66e546b50fc5c84464aaf',
    mailboxId: process.env.MAILBOX_ID || 'ACfb7e2a4063af9612b30d0a193ade',
    smtpHost: process.env.SMTP_HOST || 'smtp.hostinger.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
    smtpSecure: process.env.SMTP_SECURE !== 'false',
    smtpUser: process.env.SMTP_USER || process.env.EMAIL_USER || 'therapie@homeopilot360.com',
    smtpPassword: process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || 'Othonospet@19071963',
    fromEmail: process.env.FROM_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER || 'therapie@homeopilot360.com',
    fromName: process.env.FROM_NAME || 'HomeoPilot 360',
    imapHost: process.env.IMAP_HOST || 'imap.hostinger.com',
    imapPort: parseInt(process.env.IMAP_PORT || '993', 10),
    imapSecure: process.env.IMAP_SECURE !== 'false',
    popHost: process.env.POP_HOST || 'pop.hostinger.com',
    popPort: parseInt(process.env.POP_PORT || '995', 10),
    popSecure: process.env.POP_SECURE !== 'false',
  };

  app.get("/api/admin/credentials", (req, res) => {
    try {
      ensureDataDir();
      if (fs.existsSync(ADMIN_CONFIG_FILE)) {
        const content = fs.readFileSync(ADMIN_CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        return res.json({
          email: parsed.email || DEFAULT_ADMIN.email,
          password: parsed.password || DEFAULT_ADMIN.password,
          resetEmailDestination: parsed.resetEmailDestination || DEFAULT_ADMIN.resetEmailDestination,
          updatedAt: parsed.updatedAt,
        });
      }
      res.json(DEFAULT_ADMIN);
    } catch (err) {
      console.error("Error reading admin credentials:", err);
      res.json(DEFAULT_ADMIN);
    }
  });

  app.post("/api/admin/credentials", (req, res) => {
    try {
      ensureDataDir();
      let current = { ...DEFAULT_ADMIN };
      if (fs.existsSync(ADMIN_CONFIG_FILE)) {
        try {
          current = JSON.parse(fs.readFileSync(ADMIN_CONFIG_FILE, 'utf-8'));
        } catch {
          // ignore error
        }
      }

      const updates = req.body || {};
      const updated = {
        email: updates.email?.trim() || current.email,
        password: updates.password !== undefined && updates.password !== null && updates.password !== '' ? updates.password : current.password,
        resetEmailDestination: updates.resetEmailDestination?.trim() || current.resetEmailDestination,
        updatedAt: new Date().toISOString(),
      };

      fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
      res.json(updated);
    } catch (err) {
      console.error("Error saving admin credentials:", err);
      res.status(500).json({ error: "Failed to save admin credentials" });
    }
  });

  app.post("/api/admin/credentials/reset", (req, res) => {
    try {
      ensureDataDir();
      fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(DEFAULT_ADMIN, null, 2), 'utf-8');
      res.json(DEFAULT_ADMIN);
    } catch (err) {
      console.error("Error resetting admin credentials:", err);
      res.status(500).json({ error: "Failed to reset admin credentials" });
    }
  });

  app.get("/api/site/config", (req, res) => {
    try {
      ensureDataDir();
      if (fs.existsSync(SITE_CONFIG_FILE)) {
        const content = fs.readFileSync(SITE_CONFIG_FILE, 'utf-8');
        return res.json(JSON.parse(content));
      }
      res.json({});
    } catch (err) {
      res.json({});
    }
  });

  app.post("/api/site/config", (req, res) => {
    try {
      ensureDataDir();
      let current = {};
      if (fs.existsSync(SITE_CONFIG_FILE)) {
        try {
          current = JSON.parse(fs.readFileSync(SITE_CONFIG_FILE, 'utf-8'));
        } catch {
          // ignore
        }
      }
      const updated = { ...current, ...(req.body || {}) };
      fs.writeFileSync(SITE_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed to save site config" });
    }
  });

  // Email & SMTP Configuration API
  app.get("/api/email/config", (req, res) => {
    try {
      ensureDataDir();
      if (fs.existsSync(EMAIL_CONFIG_FILE)) {
        const content = fs.readFileSync(EMAIL_CONFIG_FILE, 'utf-8');
        return res.json(JSON.parse(content));
      }
      res.json(DEFAULT_EMAIL_SETTINGS);
    } catch (err) {
      console.error("Error reading email config:", err);
      res.json(DEFAULT_EMAIL_SETTINGS);
    }
  });

  app.post("/api/email/config", (req, res) => {
    try {
      ensureDataDir();
      let current = { ...DEFAULT_EMAIL_SETTINGS };
      if (fs.existsSync(EMAIL_CONFIG_FILE)) {
        try {
          current = JSON.parse(fs.readFileSync(EMAIL_CONFIG_FILE, 'utf-8'));
        } catch {
          // ignore
        }
      }
      const updated = {
        ...current,
        ...(req.body || {}),
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(EMAIL_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
      res.json(updated);
    } catch (err) {
      console.error("Error saving email config:", err);
      res.status(500).json({ error: "Failed to save email config" });
    }
  });

  app.post("/api/email/config/reset", (req, res) => {
    try {
      ensureDataDir();
      fs.writeFileSync(EMAIL_CONFIG_FILE, JSON.stringify(DEFAULT_EMAIL_SETTINGS, null, 2), 'utf-8');
      res.json(DEFAULT_EMAIL_SETTINGS);
    } catch (err) {
      console.error("Error resetting email config:", err);
      res.status(500).json({ error: "Failed to reset email config" });
    }
  });

  // Token Billing & Usage Monitoring API
  app.get("/api/admin/tokens/summary", (req, res) => {
    try {
      const logs = getStoredTokenLogs();
      const rates = getTokenRates();

      let totalPromptTokens = 0;
      let totalCandidatesTokens = 0;
      let totalCachedTokens = 0;
      let totalTokens = 0;
      let totalCostEur = 0;
      const totalRequests = logs.length;

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const allBalances = getStoredBalances();
      const allPayments = getPaymentLogs();

      const therapistMap: Record<string, {
        therapistId: string;
        therapistName: string;
        therapistEmail: string;
        praxisName: string;
        tarifLabel: string;
        requestCount: number;
        promptTokens: number;
        candidatesTokens: number;
        cachedTokens: number;
        totalTokens: number;
        totalCostEur: number;
        totalCustomerCostEur: number;
        customerCostEur: number;
        marginEur: number;
        lastUsedAt: string;
        currentMonthTokens: number;
        currentMonthCostEur: number;
      }> = {};

      // Seed lookup map
      for (const [id, info] of Object.entries(THERAPIST_LOOKUP)) {
        therapistMap[id] = {
          therapistId: id,
          therapistName: info.name,
          therapistEmail: info.email,
          praxisName: info.praxis,
          tarifLabel: info.tarif,
          requestCount: 0,
          promptTokens: 0,
          candidatesTokens: 0,
          cachedTokens: 0,
          totalTokens: 0,
          totalCostEur: 0,
          totalCustomerCostEur: 0,
          customerCostEur: 0,
          marginEur: 0,
          lastUsedAt: '',
          currentMonthTokens: 0,
          currentMonthCostEur: 0,
        };
      }

      for (const log of logs) {
        totalPromptTokens += log.promptTokens || 0;
        totalCandidatesTokens += log.candidatesTokens || 0;
        totalCachedTokens += log.cachedTokens || 0;
        totalTokens += log.totalTokens || 0;
        totalCostEur += log.costEur || 0;

        const thId = log.therapistId || 'th-101';
        if (!therapistMap[thId]) {
          therapistMap[thId] = {
            therapistId: thId,
            therapistName: log.therapistName || ('Therapeut ' + thId),
            therapistEmail: log.therapistEmail || '',
            praxisName: '',
            tarifLabel: 'Standard-Tarif',
            requestCount: 0,
            promptTokens: 0,
            candidatesTokens: 0,
            cachedTokens: 0,
            totalTokens: 0,
            totalCostEur: 0,
            totalCustomerCostEur: 0,
            customerCostEur: 0,
            marginEur: 0,
            lastUsedAt: '',
            currentMonthTokens: 0,
            currentMonthCostEur: 0,
          };
        }

        const entry = therapistMap[thId];
        entry.requestCount += 1;
        entry.promptTokens += log.promptTokens || 0;
        entry.candidatesTokens += log.candidatesTokens || 0;
        entry.cachedTokens = (entry.cachedTokens || 0) + (log.cachedTokens || 0);
        entry.totalTokens += log.totalTokens || 0;
        entry.totalCostEur += log.costEur || 0;

        // Customer cost tracking
        const logCustCost = Number((log as any).customerCostEur || 0);
        entry.totalCustomerCostEur += logCustCost;
        entry.customerCostEur = entry.totalCustomerCostEur;

        const logDateStr = log.timestamp || '';
        if (logDateStr.startsWith(currentMonth)) {
          entry.currentMonthTokens += log.totalTokens || 0;
          entry.currentMonthCostEur += logCustCost;
        }

        if (!entry.lastUsedAt || new Date(log.timestamp) > new Date(entry.lastUsedAt)) {
          entry.lastUsedAt = log.timestamp;
        }
      }

      const byTherapist = Object.values(therapistMap).map(t => {
        const balRecord = allBalances[t.therapistId] || getTherapistBalanceRecord(t.therapistId);
        
        // Sum deposits for this month
        const currentMonthDeposited = allPayments
          .filter(p => p.therapistId === t.therapistId && (p.month === currentMonth || (p.createdAt && p.createdAt.startsWith(currentMonth))))
          .reduce((sum, p) => sum + (p.amountEur || 0), 0);

        const marginEur = Math.round((t.totalCustomerCostEur - t.totalCostEur) * 10000) / 10000;

        return {
          ...t,
          totalCostEur: Math.round(t.totalCostEur * 100000) / 100000,
          totalCustomerCostEur: Math.round(t.totalCustomerCostEur * 10000) / 10000,
          customerCostEur: Math.round(t.totalCustomerCostEur * 10000) / 10000,
          marginEur,
          currentMonthCostEur: Math.round(t.currentMonthCostEur * 10000) / 10000,
          balanceEur: Math.round(balRecord.balanceEur * 100) / 100,
          totalDepositedEur: Math.round(balRecord.totalDepositedEur * 100) / 100,
          currentMonthDepositedEur: Math.round(currentMonthDeposited * 100) / 100,
          lowBalanceThreshold: balRecord.lowBalanceThreshold || 5.00,
          isLowBalance: balRecord.balanceEur <= (balRecord.lowBalanceThreshold || 5.00),
          lastDepositAt: balRecord.lastDepositAt,
        };
      }).sort((a, b) => b.totalTokens - a.totalTokens);

      res.json({
        totalPromptTokens,
        totalCandidatesTokens,
        totalCachedTokens,
        totalTokens,
        totalCostEur: Math.round(totalCostEur * 100000) / 100000,
        totalRequests,
        byTherapist,
        rates,
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error computing token summary:", err);
      res.status(500).json({ error: "Failed to compute token summary" });
    }
  });

  app.get("/api/admin/tokens/logs", (req, res) => {
    try {
      const logs = getStoredTokenLogs();
      const therapistId = req.query.therapistId as string | undefined;
      const limit = parseInt((req.query.limit as string) || '200', 10);

      let filtered = logs;
      if (therapistId && therapistId !== 'all') {
        filtered = filtered.filter(l => l.therapistId === therapistId);
      }

      res.json({ logs: filtered.slice(0, limit), total: filtered.length });
    } catch (err) {
      console.error("Error fetching token logs:", err);
      res.status(500).json({ error: "Failed to fetch token logs" });
    }
  });

  app.get("/api/admin/tokens/rates", (req, res) => {
    res.json({ rates: getTokenRates() });
  });

  app.post("/api/admin/tokens/rates", (req, res) => {
    try {
      const current = getTokenRates();
      const updated = {
        ...current,
        ...(req.body || {})
      };
      ensureDataDir();
      fs.writeFileSync(TOKEN_RATES_FILE, JSON.stringify(updated, null, 2), 'utf-8');
      res.json({ success: true, rates: updated });
    } catch (err) {
      console.error("Error saving token rates:", err);
      res.status(500).json({ error: "Failed to save token rates" });
    }
  });

  app.post("/api/admin/tokens/reset", (req, res) => {
    try {
      ensureDataDir();
      fs.writeFileSync(TOKEN_USAGE_FILE, JSON.stringify([], null, 2), 'utf-8');
      res.json({ success: true, message: "Token logs reset" });
    } catch (err) {
      console.error("Error resetting token logs:", err);
      res.status(500).json({ error: "Failed to reset token logs" });
    }
  });

  // =============================================================
  // STRIPE & BILLING API ROUTES
  // =============================================================

  // 1. Get Admin Stripe Config (Masked)
  app.get(["/api/admin/stripe/config", "/api/admin/stripe/config/"], (req, res) => {
    try {
      const config = getRawStripeConfig();
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol || 'http';
      const webhookUrl = `${protocol}://${host}/api/billing/webhook`;

      res.json({
        mode: config.mode,
        publishableKey: config.publishableKey,
        secretKeyMasked: maskKey(config.secretKey),
        secretKeyConfigured: Boolean(config.secretKey),
        webhookSecretMasked: maskKey(config.webhookSecret),
        webhookSecretConfigured: Boolean(config.webhookSecret),
        isConfigured: Boolean(config.publishableKey && config.secretKey),
        webhookUrl,
        updatedAt: config.updatedAt
      });
    } catch (err) {
      console.error("Error fetching stripe config:", err);
      res.status(500).json({ error: "Failed to fetch stripe config" });
    }
  });

  // 2. Save Admin Stripe Config
  app.post(["/api/admin/stripe/config", "/api/admin/stripe/config/"], (req, res) => {
    try {
      const { mode, publishableKey, secretKey, webhookSecret } = req.body;
      const updates: any = {};
      if (mode) updates.mode = mode;
      if (publishableKey !== undefined) updates.publishableKey = publishableKey;
      if (secretKey !== undefined && !secretKey.includes('••••')) {
        updates.secretKey = secretKey;
      }
      if (webhookSecret !== undefined && !webhookSecret.includes('••••')) {
        updates.webhookSecret = webhookSecret;
      }

      const saved = saveStripeConfig(updates);
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol || 'http';
      const webhookUrl = `${protocol}://${host}/api/billing/webhook`;

      res.json({
        success: true,
        mode: saved.mode,
        publishableKey: saved.publishableKey,
        secretKeyMasked: maskKey(saved.secretKey),
        secretKeyConfigured: Boolean(saved.secretKey),
        webhookSecretMasked: maskKey(saved.webhookSecret),
        webhookSecretConfigured: Boolean(saved.webhookSecret),
        isConfigured: Boolean(saved.publishableKey && saved.secretKey),
        webhookUrl,
        updatedAt: saved.updatedAt
      });
    } catch (err) {
      console.error("Error saving stripe config:", err);
      res.status(500).json({ error: "Failed to save stripe config" });
    }
  });

  // 3. Test Stripe Connection
  app.post(["/api/admin/stripe/test", "/api/admin/stripe/test/"], async (req, res) => {
    try {
      const client = getStripeClient();
      if (!client) {
        return res.status(400).json({
          success: false,
          error: "Kein Stripe Secret Key (sk_...) hinterlegt. Bitte tragen Sie diesen zuerst ein."
        });
      }

      const balance = await client.balance.retrieve();
      res.json({
        success: true,
        message: "Verbindung zu Stripe erfolgreich hergestellt! API-Schlüssel ist aktiv.",
        livemode: balance.livemode,
        currency: balance.available?.[0]?.currency?.toUpperCase() || 'EUR'
      });
    } catch (err: any) {
      console.error("Stripe test connection failed:", err);
      res.status(400).json({
        success: false,
        error: err.message || "Verbindung fehlgeschlagen. Bitte überprüfen Sie den Secret Key."
      });
    }
  });

  // 4. Get Billing Payments Log
  app.get(["/api/admin/billing/payments", "/api/admin/billing/payments/"], (req, res) => {
    try {
      const therapistId = req.query.therapistId as string | undefined;
      const payments = getPaymentLogs(therapistId);
      res.json({ payments });
    } catch (err) {
      console.error("Error fetching payments:", err);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // 5. Create Stripe Checkout Session (for initial booking or top-up)
  app.post(["/api/billing/create-checkout-session", "/api/billing/create-checkout-session/", "/billing/create-checkout-session"], async (req, res) => {
    try {
      const {
        therapistId,
        therapistName,
        therapistEmail,
        amountEur,
        type = 'manual_reload',
        successUrl,
        cancelUrl
      } = req.body;

      const amount = Math.max(1, Number(amountEur) || 20);
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol || 'http';
      const origin = `${protocol}://${host}`;

      const client = getStripeClient();
      if (client) {
        try {
          const session = await client.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
              price_data: {
                currency: 'eur',
                product_data: {
                  name: `HomöoPraxis Token-Guthaben (+${amount.toFixed(2)} €)`,
                  description: `Token-Aufladung für Therapeut: ${therapistName || therapistId}`,
                },
                unit_amount: Math.round(amount * 100),
              },
              quantity: 1,
            }],
            mode: 'payment',
            customer_email: therapistEmail || undefined,
            client_reference_id: therapistId,
            metadata: {
              therapistId: therapistId || '',
              therapistName: therapistName || '',
              amountEur: amount.toString(),
              type: type || 'manual_reload',
              targetTariffId: req.body.targetTariffId || ''
            },
            success_url: successUrl || `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}&therapistId=${therapistId}`,
            cancel_url: cancelUrl || `${origin}/?payment=cancelled&therapistId=${therapistId}`,
          });

          return res.json({
            sessionId: session.id,
            url: session.url,
            mode: 'stripe'
          });
        } catch (stripeErr: any) {
          console.error("Stripe checkout error:", stripeErr);
          return res.status(500).json({ error: stripeErr.message || 'Stripe Checkout konnte nicht gestartet werden' });
        }
      }

      // Safe Sandbox Fallback (if no Stripe keys entered yet)
      const mockSessionId = 'cs_sandbox_' + Date.now();
      let returnUrl = successUrl || `${origin}/?payment=success&session_id=${mockSessionId}&therapistId=${therapistId}`;
      if (returnUrl.includes('{CHECKOUT_SESSION_ID}')) {
        returnUrl = returnUrl.replace('{CHECKOUT_SESSION_ID}', mockSessionId);
      } else if (!returnUrl.includes('session_id=')) {
        returnUrl += (returnUrl.includes('?') ? '&' : '?') + `session_id=${mockSessionId}`;
      }
      if (!returnUrl.includes('amount=')) {
        returnUrl += `&amount=${amount}`;
      }
      if (!returnUrl.includes('sandbox=')) {
        returnUrl += `&sandbox=true`;
      }

      return res.json({
        sessionId: mockSessionId,
        url: returnUrl,
        mode: 'sandbox',
        amountEur: amount,
        message: 'Sandbox-Modus: Weiterleitung zur Bestätigung.'
      });
    } catch (err: any) {
      console.error("Error creating checkout session:", err);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // 5b. Verify Session and Credit Balance only upon Stripe Confirmation
  app.get(["/api/billing/verify-session", "/api/billing/verify-session/"], async (req, res) => {
    try {
      const sessionId = (req.query.sessionId as string) || '';
      const therapistIdParam = (req.query.therapistId as string) || '';

      if (!sessionId) {
        return res.status(400).json({ success: false, error: 'Session ID missing' });
      }

      // Check if this session was already credited
      const existingPayments = getPaymentLogs(therapistIdParam || undefined);
      const alreadyCredited = existingPayments.find(p => p.stripeSessionId === sessionId);
      if (alreadyCredited) {
        return res.json({
          success: true,
          status: 'already_credited',
          credited: true,
          amountEur: alreadyCredited.amountEur,
          therapistId: alreadyCredited.therapistId
        });
      }

      const client = getStripeClient();
      const config = getRawStripeConfig();

      // Real Stripe session verification
      if (client && config.secretKey && !sessionId.startsWith('cs_sandbox_') && !sessionId.startsWith('cs_offline_')) {
        try {
          const session = await client.checkout.sessions.retrieve(sessionId);
          if (session && session.payment_status === 'paid') {
            const therapistId = session.metadata?.therapistId || session.client_reference_id || therapistIdParam;
            const amountEur = session.metadata?.amountEur 
              ? parseFloat(session.metadata.amountEur) 
              : ((session.amount_total || 0) / 100);
            const typeRaw = session.metadata?.type || 'manual_reload';
            const validTypes = ['initial_deposit', 'manual_reload', 'auto_reload', 'package_purchase'] as const;
            const type = validTypes.includes(typeRaw as any) ? (typeRaw as typeof validTypes[number]) : 'manual_reload';
            const targetTariffId = session.metadata?.targetTariffId;

            if (therapistId && amountEur > 0) {
              creditDepositToBalance({
                therapistId,
                therapistName: session.metadata?.therapistName,
                therapistEmail: session.customer_details?.email || session.customer_email || undefined,
                amountEur,
                type,
                stripeSessionId: session.id,
                stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
                note: `Stripe Verified: +${amountEur.toFixed(2)} €`
              });
            }

            return res.json({
              success: true,
              status: 'paid',
              credited: true,
              amountEur,
              therapistId,
              targetTariffId,
              type
            });
          } else {
            return res.status(400).json({
              success: false,
              status: session?.payment_status || 'unpaid',
              error: 'Zahlung noch nicht bestätigt oder fehlgeschlagen.'
            });
          }
        } catch (stripeErr: any) {
          console.error("Error retrieving Stripe session:", stripeErr);
          return res.status(400).json({ success: false, error: stripeErr.message });
        }
      }

      // Sandbox verification
      if (sessionId.startsWith('cs_sandbox_') || sessionId.startsWith('cs_offline_')) {
        const therapistId = therapistIdParam || 'th-101';
        const amountEur = parseFloat((req.query.amount as string) || '20') || 20;

        creditDepositToBalance({
          therapistId,
          amountEur,
          type: 'manual_reload',
          stripeSessionId: sessionId,
          note: `Sandbox-Zahlung bestätigt: +${amountEur.toFixed(2)} €`
        });

        return res.json({
          success: true,
          status: 'paid',
          credited: true,
          amountEur,
          therapistId,
          type: 'manual_reload'
        });
      }

      res.status(400).json({ success: false, error: 'Unbekannte Session' });
    } catch (err: any) {
      console.error("Error in verify-session:", err);
      res.status(500).json({ success: false, error: err.message || 'Verification failed' });
    }
  });

  // 6. Stripe Webhook Endpoint (Credits Balance in Real-Time)
  app.post(["/api/billing/webhook", "/api/billing/webhook/", "/billing/webhook"], (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      const config = getRawStripeConfig();
      let event: any = null;
      const client = getStripeClient();

      if (client && config.webhookSecret && sig && (req as any).rawBody) {
        try {
          event = client.webhooks.constructEvent((req as any).rawBody, sig as string, config.webhookSecret);
        } catch (err: any) {
          console.warn('[Stripe Webhook] Signature verification failed:', err.message);
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }
      } else {
        event = req.body;
      }

      if (event && event.type === 'checkout.session.completed') {
        const session = event.data?.object || {};
        const therapistId = session.metadata?.therapistId || session.client_reference_id;
        const amountEur = session.metadata?.amountEur
          ? parseFloat(session.metadata.amountEur)
          : ((session.amount_total || 0) / 100);
        const type = session.metadata?.type || 'manual_reload';

        if (therapistId && amountEur > 0) {
          creditDepositToBalance({
            therapistId,
            therapistName: session.metadata?.therapistName,
            therapistEmail: session.customer_details?.email || session.customer_email,
            amountEur,
            type,
            stripeSessionId: session.id,
            stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
            note: 'Stripe Webhook: checkout.session.completed'
          });
          console.log(`[Stripe Webhook] Auto-credited ${amountEur} EUR to ${therapistId}`);
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Error handling Stripe webhook:", err);
      res.status(500).json({ error: "Webhook handling failed" });
    }
  });

  // 7. Get Therapist Billing & Balance Status
  app.get(["/api/therapist/billing/:therapistId", "/api/therapist/billing/:therapistId/", "/therapist/billing/:therapistId"], (req, res) => {
    try {
      const { therapistId } = req.params;
      const balRecord = getTherapistBalanceRecord(therapistId);
      const payments = getPaymentLogs(therapistId);

      res.json({
        therapistId,
        balanceEur: balRecord.balanceEur,
        totalDepositedEur: balRecord.totalDepositedEur,
        lowBalanceThreshold: balRecord.lowBalanceThreshold,
        isLowBalance: balRecord.balanceEur <= balRecord.lowBalanceThreshold,
        autoReloadEnabled: balRecord.autoReloadEnabled,
        autoReloadAmount: balRecord.autoReloadAmount,
        lastDepositAt: balRecord.lastDepositAt,
        recentPayments: payments.slice(0, 10)
      });
    } catch (err) {
      console.error("Error fetching therapist billing:", err);
      res.status(500).json({ error: "Failed to fetch therapist billing" });
    }
  });

  // 8. Direct Top-Up (Immediate balance recharge)
  app.post(["/api/therapist/billing/top-up", "/api/therapist/billing/top-up/", "/therapist/billing/top-up"], (req, res) => {
    try {
      const { therapistId, therapistName, therapistEmail, amountEur, type = 'manual_reload', note } = req.body;
      const amount = Math.max(1, Number(amountEur) || 20);

      const updated = creditDepositToBalance({
        therapistId: therapistId || 'th-101',
        therapistName,
        therapistEmail,
        amountEur: amount,
        type,
        note: note || `Guthaben-Aufladung (+${amount.toFixed(2)} €)`
      });

      res.json({ success: true, balance: updated });
    } catch (err) {
      console.error("Error topping up balance:", err);
      res.status(500).json({ error: "Failed to top up balance" });
    }
  });

  // 9. Update Therapist Billing Settings (Threshold & Auto-reload)
  app.post(["/api/therapist/billing/settings", "/api/therapist/billing/settings/", "/therapist/billing/settings"], (req, res) => {
    try {
      const { therapistId, lowBalanceThreshold, autoReloadEnabled, autoReloadAmount } = req.body;
      const updated = updateTherapistBalanceConfig(therapistId, {
        lowBalanceThreshold,
        autoReloadEnabled,
        autoReloadAmount
      });

      res.json({ success: true, balance: updated });
    } catch (err) {
      console.error("Error updating therapist billing settings:", err);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // 10. Admin Manually Adjust Therapist Balance
  app.post(["/api/admin/billing/balance/adjust", "/api/admin/billing/balance/adjust/"], (req, res) => {
    try {
      const { therapistId, amountEur, note } = req.body;
      const num = Number(amountEur);
      if (isNaN(num)) {
        return res.status(400).json({ success: false, error: "Ungültiger Betrag" });
      }
      let updated;
      if (num >= 0) {
        const updated = creditDepositToBalance({
          therapistId,
          amountEur: num,
          type: 'manual_reload',
          note: note || `Admin-Anpassung: +${num.toFixed(2)} €`
        });
        res.json({ success: true, balance: updated.balanceEur });
      } else {
        const updated = deductUsageFromBalance(therapistId, Math.abs(num));
        res.json({ success: true, balance: updated.newBalanceEur });
      }
    } catch (err) {
      console.error("Error adjusting therapist balance:", err);
      res.status(500).json({ success: false, error: "Fehler beim Anpassen des Guthabens" });
    }
  });

  // Email Send API (with Attachment & Full Template Support)
  app.post("/api/email/send", async (req, res) => {
    try {
      const {
        sendMethod,
        apiToken,
        mailboxId,
        smtpHost,
        smtpPort,
        smtpSecure,
        smtpUser,
        smtpPassword,
        fromEmail,
        fromName,
        to,
        toEmail,
        subject,
        text,
        html,
        attachments = [],
      } = req.body || {};

      const targetTo = to || toEmail;
      if (!targetTo) {
        return res.status(400).json({ success: false, error: "Kein Empfänger angegeben." });
      }

      // Load stored email config as default base
      let config = { ...DEFAULT_EMAIL_SETTINGS };
      ensureDataDir();
      if (fs.existsSync(EMAIL_CONFIG_FILE)) {
        try {
          config = JSON.parse(fs.readFileSync(EMAIL_CONFIG_FILE, 'utf-8'));
        } catch {}
      }

      const effectiveSendMethod = sendMethod || config.sendMethod || 'api';
      const effectiveApiToken = (apiToken || config.apiToken || 'ca5694e04833ec07a5a65dbe06af56952c3e1fb04cc66e546b50fc5c84464aaf').trim();
      const effectiveMailboxId = (mailboxId || config.mailboxId || '').trim();
      const effectiveFromEmail = fromEmail || config.fromEmail || config.smtpUser || 'therapie@homeopilot360.com';
      const effectiveFromName = fromName || config.fromName || 'HomeoPilot 360';
      const toArray = Array.isArray(targetTo) ? targetTo : [targetTo];

      // 1. Hostinger Mail API Method
      if (effectiveSendMethod === 'api' || (!config.smtpPassword && effectiveApiToken)) {
        if (!effectiveApiToken) {
          return res.status(400).json({ success: false, error: "Hostinger Mail API Token fehlt." });
        }

        let resolvedMailboxId = effectiveMailboxId;
        if (!resolvedMailboxId) {
          try {
            const meRes = await fetch('https://api.mail.hostinger.com/api/v1/me', {
              headers: { 'Authorization': `Bearer ${effectiveApiToken}` },
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              resolvedMailboxId = meData?.data?.mailboxes?.[0]?.resourceId || 'ACfb7e2a4063af9612b30d0a193ade';
            } else {
              resolvedMailboxId = 'ACfb7e2a4063af9612b30d0a193ade';
            }
          } catch {
            resolvedMailboxId = 'ACfb7e2a4063af9612b30d0a193ade';
          }
        }

        const payload: any = {
          to: toArray.map((e: string) => e.trim()),
          displayName: effectiveFromName,
          subject: subject || 'HomeoPilot 360',
          text: text || (html ? html.replace(/<[^>]*>?/gm, '') : ''),
          html: html || `<p>${text || ''}</p>`,
        };

        if (attachments && attachments.length > 0) {
          payload.attachments = attachments.map((att: any) => ({
            filename: att.filename,
            content: att.content,
            contentType: att.contentType || 'application/pdf',
          }));
        }

        const sendRes = await fetch(`https://api.mail.hostinger.com/api/v1/mailboxes/${resolvedMailboxId}/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${effectiveApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (sendRes.status === 204 || sendRes.status === 200 || sendRes.status === 201) {
          return res.json({ success: true, message: 'E-Mail erfolgreich versendet.' });
        } else {
          const sendErr = await sendRes.text();
          return res.status(400).json({ success: false, error: `Hostinger Versandfehler (${sendRes.status}): ${sendErr}` });
        }
      }

      // 2. SMTP Method
      const host = smtpHost || config.smtpHost;
      const port = Number(smtpPort || config.smtpPort || 465);
      const secure = smtpSecure !== undefined ? Boolean(smtpSecure) : Boolean(config.smtpSecure);
      const user = smtpUser || config.smtpUser;
      const pass = smtpPassword || config.smtpPassword;

      const transporter = nodemailer.createTransport({
        host: host.trim(),
        port,
        secure,
        auth: { user: user.trim(), pass: pass || '' },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
      });

      const mailOptions: any = {
        from: `"${effectiveFromName}" <${effectiveFromEmail}>`,
        to: toArray.join(', '),
        subject: subject || 'HomeoPilot 360',
        text: text || (html ? html.replace(/<[^>]*>?/gm, '') : ''),
        html: html || `<p>${text || ''}</p>`,
      };

      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments.map((att: any) => ({
          filename: att.filename,
          content: Buffer.from(att.content, 'base64'),
          contentType: att.contentType || 'application/pdf',
        }));
      }

      const info = await transporter.sendMail(mailOptions);
      return res.json({ success: true, message: 'E-Mail erfolgreich per SMTP versendet.', messageId: info.messageId });
    } catch (error: any) {
      console.error("Email Send Error:", error);
      return res.status(500).json({ success: false, error: error?.message || 'E-Mail-Versand fehlgeschlagen.' });
    }
  });

  // Email Test API (Hostinger API + SMTP)
  app.post("/api/email/test", async (req, res) => {
    try {
      const {
        sendMethod = 'api',
        apiToken = 'ca5694e04833ec07a5a65dbe06af56952c3e1fb04cc66e546b50fc5c84464aaf',
        mailboxId = '',
        smtpHost = 'smtp.hostinger.com',
        smtpPort = 465,
        smtpSecure = true,
        smtpUser = 'therapie@homeopilot360.com',
        smtpPassword = '',
        fromEmail = 'therapie@homeopilot360.com',
        fromName = 'HomeoPilot 360',
        toEmail = '',
        subject,
        text,
        html,
        attachments = [],
      } = req.body || {};

      // 1. Hostinger Mail API Method
      if (sendMethod === 'api' || (!smtpPassword && apiToken)) {
        const token = (apiToken || '').trim();
        if (!token) {
          return res.status(400).json({
            success: false,
            error: "Hostinger Mail API Token fehlt.",
          });
        }

        // Verify token via /api/v1/me
        const meRes = await fetch('https://api.mail.hostinger.com/api/v1/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!meRes.ok) {
          const errText = await meRes.text();
          return res.status(400).json({
            success: false,
            error: `Hostinger API Fehler (${meRes.status}): ${errText}`,
          });
        }

        const meData = await meRes.json();
        const primaryMailbox = meData?.data?.mailboxes?.[0];
        const resolvedMailboxId = mailboxId || primaryMailbox?.resourceId || 'ACfb7e2a4063af9612b30d0a193ade';

        let emailSent = false;
        if (toEmail && toEmail.includes('@')) {
          const payload: any = {
            to: [toEmail.trim()],
            displayName: fromName || 'HomeoPilot 360',
            subject: subject || 'HomeoPilot 360 - Hostinger API Test-Mail',
            text: text || `Herzlichen Glückwunsch!\n\nDer E-Mail-Versand über die Hostinger Mail API funktioniert einwandfrei.\n\nPostfach: ${primaryMailbox?.address || fromEmail}\nEmpfänger: ${toEmail}`,
            html: html || `
              <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; color: #1e293b;">
                <h2 style="color: #0d9488; margin-top: 0;">Hostinger API Verbindungstest erfolgreich</h2>
                <p style="font-size: 14px; line-height: 1.6;">Herzlichen Glückwunsch! Der E-Mail-Versand über die <strong>Hostinger Mail API</strong> für <strong>HomeoPilot 360</strong> wurde erfolgreich verifiziert und ist einsatzbereit.</p>
                <div style="background: #f8fafc; padding: 16px; border-radius: 8px; font-size: 13px; color: #334155; margin: 16px 0; border: 1px solid #e2e8f0;">
                  <p style="margin: 4px 0;"><strong>Postfach:</strong> ${primaryMailbox?.address || fromEmail}</p>
                  <p style="margin: 4px 0;"><strong>Mailbox-ID:</strong> ${resolvedMailboxId}</p>
                  <p style="margin: 4px 0;"><strong>Empfänger:</strong> ${toEmail}</p>
                  <p style="margin: 4px 0;"><strong>Versandart:</strong> Hostinger REST Mail API</p>
                </div>
                <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">HomeoPilot 360 &copy; ${new Date().getFullYear()} – Naturheilpraxis &amp; Homöopathie Plattform</p>
              </div>
            `,
          };

          if (attachments && attachments.length > 0) {
            payload.attachments = attachments.map((att: any) => ({
              filename: att.filename,
              content: att.content,
              contentType: att.contentType || 'application/pdf',
            }));
          }

          const sendRes = await fetch(`https://api.mail.hostinger.com/api/v1/mailboxes/${resolvedMailboxId}/send`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (sendRes.status === 204 || sendRes.status === 200 || sendRes.status === 201) {
            emailSent = true;
          } else {
            const sendErr = await sendRes.text();
            return res.status(400).json({
              success: false,
              error: `Hostinger Versandfehler (${sendRes.status}): ${sendErr}`,
            });
          }
        }

        return res.json({
          success: true,
          message: emailSent
            ? `Hostinger Mail API Test-E-Mail erfolgreich an ${toEmail} gesendet.`
            : `Hostinger Mail API Verbindung erfolgreich verifiziert (${primaryMailbox?.address || fromEmail})!`,
          emailSent,
          mailbox: primaryMailbox,
        });
      }

      // 2. SMTP Method Fallback
      if (!smtpHost || !smtpPort || !smtpUser) {
        return res.status(400).json({
          success: false,
          error: "Bitte geben Sie mindestens SMTP-Server, Port und Benutzername an.",
        });
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost.trim(),
        port: Number(smtpPort),
        secure: Boolean(smtpSecure),
        auth: {
          user: smtpUser.trim(),
          pass: smtpPassword || '',
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 10000,
      });

      // Verify SMTP transport connection
      await transporter.verify();

      let emailSent = false;
      let messageId: string | undefined = undefined;

      if (toEmail && toEmail.includes('@')) {
        const mailOptions: any = {
          from: `"${fromName || 'HomeoPilot 360'}" <${fromEmail || smtpUser}>`,
          to: toEmail.trim(),
          subject: subject || 'HomeoPilot 360 - SMTP Verbindungstest erfolgreich',
          text: text || `Herzlichen Glückwunsch!\n\nDie E-Mail- und SMTP-Einstellungen für HomeoPilot 360 funktionieren einwandfrei.\n\nServer: ${smtpHost}\nPort: ${smtpPort}\nBenutzername: ${smtpUser}\nAbsender: ${fromEmail || smtpUser}`,
          html: html || `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; color: #1e293b;">
              <h2 style="color: #0d9488; margin-top: 0;">SMTP Verbindungstest erfolgreich</h2>
              <p style="font-size: 14px; line-height: 1.6;">Herzlichen Glückwunsch! Die E-Mail- und SMTP-Einstellungen für <strong>HomeoPilot 360</strong> wurden erfolgreich verifiziert und sind einsatzbereit.</p>
              <div style="background: #f8fafc; padding: 16px; border-radius: 8px; font-size: 13px; color: #334155; margin: 16px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 4px 0;"><strong>SMTP-Server:</strong> ${smtpHost}</p>
                <p style="margin: 4px 0;"><strong>Port:</strong> ${smtpPort} (${smtpSecure ? 'SSL/TLS' : 'STARTTLS/None'})</p>
                <p style="margin: 4px 0;"><strong>Benutzername:</strong> ${smtpUser}</p>
                <p style="margin: 4px 0;"><strong>Absender:</strong> ${fromEmail || smtpUser}</p>
              </div>
              <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">HomeoPilot 360 &copy; ${new Date().getFullYear()} – Naturheilpraxis &amp; Homöopathie Plattform</p>
            </div>
          `,
        };

        if (attachments && attachments.length > 0) {
          mailOptions.attachments = attachments.map((att: any) => ({
            filename: att.filename,
            content: Buffer.from(att.content, 'base64'),
            contentType: att.contentType || 'application/pdf',
          }));
        }

        const info = await transporter.sendMail(mailOptions);
        emailSent = true;
        messageId = info.messageId;
      }

      res.json({
        success: true,
        message: emailSent
          ? `SMTP-Verbindung erfolgreich verifiziert und Test-E-Mail an ${toEmail} versendet.`
          : `SMTP-Verbindung zu ${smtpHost}:${smtpPort} erfolgreich verifiziert!`,
        emailSent,
        messageId,
      });
    } catch (error: any) {
      console.error("Email Test Error:", error);
      res.status(400).json({
        success: false,
        error: error?.message || 'E-Mail-Verbindung fehlgeschlagen. Bitte Zugangsdaten prüfen.',
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
