import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.post("/api/analyze", async (req, res) => {
    try {
      const { caseData, language = "de" } = req.body;

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
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
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

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: "GEMINI_API_KEY is not configured" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
Du bist das logische Hintergrund-Modul (Backend-Engine) einer bestehenden Homöopathie-App. Deine Aufgabe ist es, den eingegebenen Patienten-Freitext (via Sprache oder Text) präzise zu analysieren und ein lückenloses, homöopathisches Ausschlussverfahren (Repertorisation) im Hintergrund zu berechnen.

WICHTIG: Du darfst nichts erfinden oder annehmen. Wenn der Text des Benutzers unvollständig ist und wichtige Variablen fehlen, musst du diese als "Unbekannt (Bitte erfragen)" markieren und im Feld "diagnose_fragen_fuer_therapeut" gezielt nach den fehlenden Informationen fragen. 

Du darfst kein UI-Layout, kein HTML und keine visuellen Formatierungen generieren. Dein Ergebnis muss als reines, strukturiertes Daten-Objekt ausgegeben werden, damit das bestehende Design der App nicht verändert oder gestört wird. Die App nutzt deine Daten, um das vorhandene Layout zu befüllen und die vollständige Baumstruktur in einem separaten Popup-Fenster anzuzeigen.

Befolge bei JEDER Eingabe exakt diesen 5-Schritte-Algorithmus:

1. SCHRITT: SYMPTOM-EXTRAKTION (Tokenisierung)
Analysiere den Text und ordne die Wörter ausnahmslos in diese vier Variablen ein. Wenn eine Information im Text nicht genannt wird, schreibe strikt "Unbekannt (Bitte erfragen)":
- [Leitsymptom] = Was genau ist die körperliche Hauptbeschwerde?
- [Causa] = Was war der Auslöser/die Ursache (Wetter, Emotion, Unfall, Genussmittel)?
- [Modalitäten] = Was verschlimmert (>) oder verbessert (<) den Zustand (Kälte, Wärme, Tageszeit, Bewegung)?
- [Begleitsymptome] = Welche zusätzlichen Symptome oder Gemütszustände liegen vor?

2. SCHRITT: PRIMÄR-FILTER (Arznei-Pool)
Suche in deiner homöopathischen Datenbank nach allen Arzneimitteln, die eine hohe Wertigkeit für die Kombination aus [Leitsymptom] und [Causa] besitzen. Dies ist dein "Start-Pool".

3. SCHRITT: BINÄRE DIFFERENZIERUNG (Der Entscheidungsbaum)
Erstelle einen logischen Ja/Nein-Entscheidungsbaum, um die Mittel aus dem Start-Pool systematisch voneinander abzugrenzen. Nutze dafür die [Modalitäten] und [Begleitsymptome]. Jede Verzweigung MUSS auf einer klaren, homöopathisch verankerten Differenzierungsfrage basieren. Wenn die Daten fehlen, bleibt der Baum auf dieser Ebene unvollständig.

4. SCHRITT: LÜCKENLOSER ABSCHLUSS (Keine Sackgassen)
Der Baum darf KEINE offenen Enden ("Anderes") haben. Wenn alle Daten vorhanden sind und die Hauptmittel durch ein "NEIN" ausgeschlossen werden, musst du den Pfad so lange mit klassischen homöopathischen "Auffang-Mitteln" (z.B. Ferrum Phos, Thuja, Pulsatilla) weiterführen, bis JEDER Pfad am Ende bei einer exakten Arznei ankommt. Wenn Daten fehlen, stoppt der Pfad bei "Unvollständig (Warte auf Eingabe)".

5. SCHRITT: DIE STRUKTURIERTE AUSGABE FÜR DIE APP-SCHNITTSTELLE
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
    "begruendung": "Kurze Begründung, warum das Mittel passt ODER Erklärung, welche Kern-Informationen noch benötigt werden"
  },
  "diagnose_fragen_fuer_therapeut": {
    "frage_1": "Gezielte Frage nach der fehlenden Modalität oder dem Schmerzcharakter",
    "frage_2": "Gezielte Frage nach dem fehlenden Begleitsymptom oder Gemütszustand"
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

  app.post("/api/check-medical-relevance", async (req, res) => {
    try {
      const { text, language = "de" } = req.body;
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.json({ isRelevant: false, reason: "empty_text" });
      }

      const trimmedText = text.trim();

      // If no API key or in case of offline fallback, evaluate quickly
      if (!process.env.GEMINI_API_KEY) {
        return res.json({ isRelevant: true, reason: "no_api_key_passthrough" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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

  const medicationSearchCache = new Map<string, any>();
  const medicationDetailsCache = new Map<string, any>();

  // Full internet live search for medications with all dosages, side effects, interactions
  app.get("/api/medications/search", async (req, res) => {
    try {
      const q = (req.query.q as string || '').trim();
      if (!q || q.length < 1) return res.json({ results: [] });

      const cacheKey = q.toLowerCase();
      if (medicationSearchCache.has(cacheKey)) {
        return res.json({ results: medicationSearchCache.get(cacheKey) });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.json({ results: [] });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Führe eine vollständige Live-Suche im Internet nach existierenden realen Medikamenten und Präparaten durch, die zur Suchanfrage "${q}" passen (Handelsnamen in Deutschland/Österreich/Schweiz/international, Generika, Wirkstoffe, Fertigarzneimittel).
Ermittle für bis zu 5 gefundene Medikamente aus dem Internet:
- name: Offizieller Handelsname / Präparatename
- activeSubstance: Wirkstoff (INN)
- category: Indikationsgruppe / Wirkstoffklasse
- dosages: Typische, reale Dosierungsstärken (Array von Strings, z.B. ["200 mg", "400 mg", "600 mg"])
- commonForms: Darreichungsformen (Array von Strings, z.B. ["Filmtablette", "Kapsel", "Tropfen"])
- recommendedIntake: Typische Einnahmeart und Einnahmehinweise (z.B. "1-2x täglich mit Wasser nach den Mahlzeiten")
- sideEffects: Vollständige Liste aller wichtigen und häufigen Nebenwirkungen (Array von kurzen Strings)
- interactions: Vollständige Liste aller relevanten Wechselwirkungen mit anderen Medikamenten, Nahrungsmitteln oder Alkohol (Array von kurzen Strings)
- warnings: Kontraindikationen und wichtige Warnhinweise

Antworte AUSSCHLIESSLICH mit einem validen JSON-Array:
[
  {
    "name": "Medikament Name",
    "activeSubstance": "Wirkstoff",
    "category": "Wirkstoffgruppe",
    "dosages": ["..."],
    "commonForms": ["..."],
    "recommendedIntake": "...",
    "sideEffects": ["..."],
    "interactions": ["..."],
    "warnings": "..."
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const parsed = extractJsonFromText(response.text || '');
      const results = Array.isArray(parsed) ? parsed : [];
      medicationSearchCache.set(cacheKey, results);

      // Pre-populate details cache
      results.forEach((item: any) => {
        if (item && item.name) {
          medicationDetailsCache.set(item.name.toLowerCase(), item);
        }
      });

      res.json({ results });
    } catch (error) {
      console.error("Gemini Medications Search Error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Dedicated endpoint for full internet profile of any specific medication name
  app.get("/api/medications/details", async (req, res) => {
    try {
      const name = (req.query.name as string || '').trim();
      if (!name || name.length < 1) return res.status(400).json({ error: "Missing name" });

      const cacheKey = name.toLowerCase();
      if (medicationDetailsCache.has(cacheKey)) {
        return res.json({ details: medicationDetailsCache.get(cacheKey) });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.json({ details: null });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Führe eine vollständige und gründliche Live-Suche im Internet nach dem Medikament bzw. Wirkstoff "${name}" durch.
Recherchiere alle medizinischen und pharmazeutischen Fakten aus verlässlichen Quellen:
- name: Name des Medikaments / Präparats
- activeSubstance: Wirkstoff (INN)
- category: Wirkstoffgruppe / therapeutische Kategorie
- dosages: Reale Standard- und Einzeldosierungen (Array von Strings, z.B. ["20 mg", "40 mg"])
- commonForms: Darreichungsformen (Array von Strings)
- recommendedIntake: Einnahmeempfehlung / Häufigkeit (z.B. "1x täglich morgens nüchtern mit Wasser")
- sideEffects: Vollständige Liste aller relevanten und häufigen Nebenwirkungen (Array von Strings)
- interactions: Vollständige Liste aller bekannten und kritischen Wechselwirkungen (Array von Strings, z.B. mit NSAR, Antikoagulanzien, Alkohol, etc.)
- warnings: Wichtige Gegenanzeigen, Kontraindikationen und Risikogruppen

Antworte AUSSCHLIESSLICH als valides JSON-Objekt:
{
  "name": "${name}",
  "activeSubstance": "...",
  "category": "...",
  "dosages": ["..."],
  "commonForms": ["..."],
  "recommendedIntake": "...",
  "sideEffects": ["..."],
  "interactions": ["..."],
  "warnings": "..."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const parsed = extractJsonFromText(response.text || '');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        medicationDetailsCache.set(cacheKey, parsed);
        return res.json({ details: parsed });
      }

      res.json({ details: null });
    } catch (error) {
      console.error("Gemini Medications Details Error:", error);
      res.status(500).json({ error: "Details lookup failed" });
    }
  });

  // Admin Credentials & Config Persistence API
  const DATA_DIR = path.join(process.cwd(), 'data');
  const ADMIN_CONFIG_FILE = path.join(DATA_DIR, 'admin_config.json');
  const SITE_CONFIG_FILE = path.join(DATA_DIR, 'site_config.json');
  const EMAIL_CONFIG_FILE = path.join(DATA_DIR, 'email_config.json');

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
    smtpUser: process.env.SMTP_USER || 'therapie@homeopilot360.com',
    smtpPassword: process.env.SMTP_PASSWORD || 'Othonospet@19071963',
    fromEmail: process.env.FROM_EMAIL || 'therapie@homeopilot360.com',
    fromName: process.env.FROM_NAME || 'HomeoPilot 360',
    imapHost: process.env.IMAP_HOST || 'imap.hostinger.com',
    imapPort: parseInt(process.env.IMAP_PORT || '993', 10),
    imapSecure: process.env.IMAP_SECURE !== 'false',
    popHost: process.env.POP_HOST || 'pop.hostinger.com',
    popPort: parseInt(process.env.POP_PORT || '995', 10),
    popSecure: process.env.POP_SECURE !== 'false',
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
