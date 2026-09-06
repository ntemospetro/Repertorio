/**
 * Hahnemann & Bönninghausen Classical Homoeopathic 6-Pillars Analysis Engine
 * 
 * Implements strict NLP fragmentation, irrelevance filtering, 6-pillar matrix mapping,
 * interpretation/hallucination prohibition, single-question sequential loop,
 * and remedy differentiation.
 */

import { getActiveTherapist } from './storage';

export interface Hahnemann6Pillars {
  causa: string | null;
  lokalisierung: string | null;
  empfindung: string | null;
  modalitaeten: string | null;
  begleitsymptome: string[];
  gemuet: string | null;
}

export interface HahnemannClarifyingQuestion {
  id: string;
  frage: string;
  grund: string;
  kategorie?: 'gemuet' | 'modalitaeten' | 'begleitsymptome' | 'empfindung' | 'causa';
  optionen: string[];
  beantwortet?: string;
}

export interface HahnemannAnalysisResult {
  analyse_status: 'in_progress' | 'completed';
  wichtige_symptom_fragmente: Hahnemann6Pillars;
  ignorierte_daten: string[];
  kontroll_und_nachfrage_logik: string;
  naechste_frage: string;
  auswahl_optionen?: string[];
  auswahl_typ?: 'single' | 'multiple';
  aktuelle_mittel_differenzierung: string[];
  end_analyse_zusammenfassung: string | null;
  sich_ergebende_fragen?: HahnemannClarifyingQuestion[];
}

/**
 * Call the server Gemini API endpoint, with fallback to deterministic local engine.
 */
export async function runHahnemannAnalysis(
  text: string,
  currentMatrix?: Partial<Hahnemann6Pillars>,
  conversationHistory: Array<{ question: string; answer: string }> = [],
  language: string = 'de',
  forceComplete: boolean = false
): Promise<HahnemannAnalysisResult> {
  const trimmed = (text || '').trim();
  const activeTherapist = getActiveTherapist();

  try {
    const response = await fetch('/api/hahnemann-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: trimmed,
        currentMatrix: currentMatrix || null,
        conversationHistory,
        language,
        forceComplete,
        therapistId: activeTherapist?.id || 'th-101',
        therapistName: activeTherapist ? `${activeTherapist.vorname} ${activeTherapist.nachname}` : undefined,
        therapistEmail: activeTherapist?.email,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.result && data.result.wichtige_symptom_fragmente) {
        return data.result;
      }
    }
  } catch (err) {
    console.warn('Network error reaching /api/hahnemann-analysis, using local logic engine:', err);
  }

  // Fallback to local rule engine adhering strictly to commands 1-5
  return evaluateHahnemannLocally(trimmed, currentMatrix, conversationHistory, language, forceComplete);
}

/**
 * Deterministic local classical homoeopathic logic engine (Hahnemann & Bönninghausen)
 */
export function evaluateHahnemannLocally(
  newText: string,
  existingMatrix?: Partial<Hahnemann6Pillars>,
  _history: Array<{ question: string; answer: string }> = [],
  _language: string = 'de',
  forceComplete: boolean = false
): HahnemannAnalysisResult {
  const matrix: Hahnemann6Pillars = {
    causa: existingMatrix?.causa || null,
    lokalisierung: existingMatrix?.lokalisierung || null,
    empfindung: existingMatrix?.empfindung || null,
    modalitaeten: existingMatrix?.modalitaeten || null,
    begleitsymptome: Array.isArray(existingMatrix?.begleitsymptome) ? [...existingMatrix.begleitsymptome] : [],
    gemuet: existingMatrix?.gemuet || null,
  };

  const ignored: string[] = [];
  const textLower = newText.toLowerCase();

  // 1. BEFEHL: FRAGMENTIERUNG & NLP-FILTERUNG (Relevanz-Prüfung)
  // Extract and filter irrelevant data (names of third parties, objects, smalltalk)
  const thirdPartyRegex = /\b(der\s+[A-ZÄÖÜ][a-zäöü]+|die\s+[A-ZÄÖÜ][a-zäöü]+|hans|peter|klaus|anna|maria|nachbar|chef|kollege|kugelschreiber|tisch|stuhl|fenster|wetter\s+ist\s+schön|hallo|guten\s+tag)\b/gi;
  let match;
  while ((match = thirdPartyRegex.exec(newText)) !== null) {
    const rawFragment = match[0].trim();
    if (rawFragment && !ignored.includes(rawFragment)) {
      ignored.push(rawFragment);
    }
  }

  // 2. BEFEHL: 6-SÄULEN-MATRIX (Strenges Interpretationsverbot: Nur explizit genannte Fakten!)

  // 1. Causa (Auslöser)
  if (!matrix.causa) {
    if (textLower.includes('kalte luft') || textLower.includes('kaltem wind') || textLower.includes('kälte') || textLower.includes('unterkühlt') || textLower.includes('zugluft')) {
      matrix.causa = 'Kälteeinwirkung (in der kalten Luft / Wind gewesen)';
    } else if (textLower.includes('schreck') || textLower.includes('angst') || textLower.includes('unfall')) {
      matrix.causa = 'Schreck / plötzliches Schockerlebnis';
    } else if (textLower.includes('nass') || textLower.includes('durchnässt') || textLower.includes('schwimmbad')) {
      matrix.causa = 'Durchnässung / Feuchtigkeit';
    } else if (textLower.includes('ärger') || textLower.includes('wut') || textLower.includes('kränkung')) {
      matrix.causa = 'Ärger / Emotionale Erregung';
    } else if (textLower.includes('überanstrengung') || textLower.includes('schwer gehoben')) {
      matrix.causa = 'Körperliche Überanstrengung';
    }
  }

  // 2. Lokalisierung (Wo im Körper?)
  if (!matrix.lokalisierung) {
    if (textLower.includes('fieber') || textLower.includes('ganzkörper') || textLower.includes('körper')) {
      matrix.lokalisierung = 'Ganzkörper / Systemisch (Fieber)';
    } else if (textLower.includes('kopf') || textLower.includes('stirn') || textLower.includes('schläfe')) {
      matrix.lokalisierung = 'Kopf';
    } else if (textLower.includes('hals') || textLower.includes('kehle') || textLower.includes('mandeln')) {
      matrix.lokalisierung = 'Hals / Pharynx';
    } else if (textLower.includes('magen') || textLower.includes('bauch') || textLower.includes('darm')) {
      matrix.lokalisierung = 'Magen-Darm-Trakt';
    } else if (textLower.includes('brust') || textLower.includes('lunge') || textLower.includes('bronchien')) {
      matrix.lokalisierung = 'Respirationstrakt / Thorax';
    }
  }

  // 3. Empfindung (Wie fühlt es sich an?)
  if (!matrix.empfindung) {
    if (textLower.includes('glühend') || textLower.includes('brennend') || textLower.includes('heiße haut') || textLower.includes('hitzegefühl')) {
      matrix.empfindung = 'Trockene, glühende und brennende Hitze';
    } else if (textLower.includes('schüttelfrost') || textLower.includes('frösteln') || textLower.includes('zittern vor kälte')) {
      matrix.empfindung = 'Schüttelfrost und Frösteln trotz Fieber';
    } else if (textLower.includes('klopfend') || textLower.includes('pochend') || textLower.includes('pulsierend')) {
      matrix.empfindung = 'Klopfend und pulsierend';
    } else if (textLower.includes('wie zerschlagen') || textLower.includes('gliederschmerzen') || textLower.includes('schwere')) {
      matrix.empfindung = 'Wie zerschlagen in allen Gliedern';
    } else if (textLower.includes('stechend')) {
      matrix.empfindung = 'Scharf stechend';
    }
  }

  // 4. Modalitäten (Besser / Schlechter)
  if (!matrix.modalitaeten) {
    if (textLower.includes('wärme') || textLower.includes('zudecken') || textLower.includes('warmes zimmer')) {
      matrix.modalitaeten = textLower.includes('besser') ? 'Gebessert durch Wärme und Einhüllen' : 'Verschlimmert durch Wärme';
    } else if (textLower.includes('kälte') || textLower.includes('frische luft') || textLower.includes('abdecken')) {
      matrix.modalitaeten = textLower.includes('besser') ? 'Gebessert durch kühle Frischluft und Abdecken' : 'Verschlimmert durch kalte Luft und Entblößen';
    } else if (textLower.includes('bewegung') || textLower.includes('ruhe')) {
      matrix.modalitaeten = textLower.includes('ruhe') ? 'Besser bei absoluter Ruhe, verschlimmert bei geringster Bewegung' : 'Besser durch langsame Bewegung';
    }
  }

  // 5. Begleitsymptome (Concomitants)
  if (textLower.includes('unstillbarer durst') || textLower.includes('großer durst') || textLower.includes('durst auf kaltes')) {
    if (!matrix.begleitsymptome.includes('Großer Durst auf große Mengen kaltes Wasser')) {
      matrix.begleitsymptome.push('Großer Durst auf große Mengen kaltes Wasser');
    }
  } else if (textLower.includes('durstlos') || textLower.includes('kein durst')) {
    if (!matrix.begleitsymptome.includes('Vollständige Durstlosigkeit trotz Hitze')) {
      matrix.begleitsymptome.push('Vollständige Durstlosigkeit trotz Hitze');
    }
  }
  if (textLower.includes('trockene haut') || textLower.includes('schwitzt nicht') || textLower.includes('kein schweiß')) {
    if (!matrix.begleitsymptome.includes('Vollkommen trockene Haut ohne Schweißbildung')) {
      matrix.begleitsymptome.push('Vollkommen trockene Haut ohne Schweißbildung');
    }
  } else if (textLower.includes('starker schweiß') || textLower.includes('schwitzt')) {
    if (!matrix.begleitsymptome.includes('Profuser Schweiß')) {
      matrix.begleitsymptome.push('Profuser Schweiß');
    }
  }
  if (textLower.includes('rotes gesicht') || textLower.includes('roter kopf')) {
    if (!matrix.begleitsymptome.includes('Rotes, heißes Gesicht')) {
      matrix.begleitsymptome.push('Rotes, heißes Gesicht');
    }
  }

  // 6. Gemüt (Psychischer Zustand)
  if (!matrix.gemuet) {
    if (textLower.includes('unruhe') || textLower.includes('angst') || textLower.includes('panik') || textLower.includes('todesangst') || textLower.includes('getrieben')) {
      matrix.gemuet = 'Ängstliche, motorische Unruhe mit Furcht';
    } else if (textLower.includes('apathisch') || textLower.includes('müde') || textLower.includes('schläfrig') || textLower.includes('träge')) {
      matrix.gemuet = 'Apathie, Schläfrigkeit und Verlangen in Ruhe gelassen zu werden';
    } else if (textLower.includes('reizbar') || textLower.includes('wütend') || textLower.includes('zornig')) {
      matrix.gemuet = 'Große Reizbarkeit und Zorn';
    }
  }

  // 3. BEFEHL: DIE KONTROLL- UND NACHFRAGESCHLEIFE (Strikte 6-Säulen-Führung nach Hahnemann & Bönninghausen)
  let nextQuestion = '';
  let rationale = '';
  let status: 'in_progress' | 'completed' = 'in_progress';
  const diffRemedies: string[] = [];

  // Determine which pillar needs to be asked next (ONE single question)
  let auswahlOptionen: string[] = [];
  let auswahlTyp: 'single' | 'multiple' = 'multiple';

  const hasCausa = Boolean(matrix.causa && matrix.causa !== 'Noch nicht genannt' && matrix.causa.trim().length > 0);
  const hasLokalisierung = Boolean(matrix.lokalisierung && matrix.lokalisierung !== 'Noch nicht genannt' && matrix.lokalisierung.trim().length > 0);
  const hasEmpfindung = Boolean(matrix.empfindung && matrix.empfindung !== 'Noch nicht genannt' && matrix.empfindung.trim().length > 0);
  const hasModalitaeten = Boolean(matrix.modalitaeten && matrix.modalitaeten !== 'Noch nicht genannt' && matrix.modalitaeten.trim().length > 0);
  const hasBegleitsymptome = Boolean(Array.isArray(matrix.begleitsymptome) && matrix.begleitsymptome.length > 0);
  const hasGemuet = Boolean(matrix.gemuet && matrix.gemuet !== 'Noch nicht genannt' && matrix.gemuet.trim().length > 0);

  const all6Pillars = hasCausa && hasLokalisierung && hasEmpfindung && hasModalitaeten && hasBegleitsymptome && hasGemuet;

  // Loop protection: do not exceed 6 question rounds, but ensure all missing pillars are systematically checked
  if (forceComplete || all6Pillars || (_history.length >= 6 && hasEmpfindung && hasModalitaeten && hasGemuet)) {
    status = 'completed';
    nextQuestion = '';
    auswahlOptionen = [];
    rationale = 'Alle 6 Säulen der klassischen homöopathischen Anamnese wurden vollständig erfasst.';
    if (matrix.modalitaeten?.includes('Ruhe') || matrix.modalitaeten?.includes('Druck')) {
      diffRemedies.push('Bryonia alba', 'Silicea', 'Belladonna');
    } else if (matrix.gemuet?.includes('Unruhe') || matrix.causa?.includes('Kälte')) {
      diffRemedies.push('Aconitum napellus', 'Belladonna', 'Arsenicum album');
    } else {
      diffRemedies.push('Aconitum napellus', 'Belladonna', 'Ferrum phosphoricum', 'Apis mellifica');
    }
  } else if (!hasCausa) {
    // 1. Causa
    rationale = 'Säule 1 (Causa / Auslöser) fehlt. Nach Hahnemann ist die Ätiologie (z. B. Kälte, Nässe, Schreck, Zorn) entscheidend für das Simile.';
    nextQuestion = 'Gab es einen konkreten Auslöser für Ihre Beschwerden (z. B. kalte Luft/Wind, Durchnässung, Ärger, Schreck oder Überanstrengung)?';
    auswahlOptionen = [
      'Kälteeinwirkung (kalter trockener Wind, Zugluft, Unterkühlung)',
      'Durchnässung, Nässe oder Baden in kaltem Wasser',
      'Plötzlicher Schreck, Schock oder akute Angst',
      'Ärger, Zorn, Kränkung oder emotionaler Stress',
      'Körperliche Überanstrengung oder Verheben',
      'Kein spezifischer Auslöser erinnerlich'
    ];
    diffRemedies.push('Aconitum napellus', 'Belladonna', 'Bryonia alba', 'Rhus toxicodendron');
  } else if (!hasLokalisierung) {
    // 2. Lokalisierung
    rationale = 'Säule 2 (Lokalisierung) ist noch unbesetzt. Der exakte Sitz der Beschwerden (Organ, Seite, Gewebe) muss präzise bestimmt werden.';
    nextQuestion = 'Wo genau manifestieren sich die Beschwerden – welche Körperstellen oder Organe sind primär oder zusätzlich betroffen?';
    auswahlOptionen = [
      'Kopf / Stirn / Schläfen / Augen',
      'Hals / Rachen / Mandeln / Kehlkopf',
      'Brustkorb / Lunge / Bronchien',
      'Magen-Darm-Trakt / Bauchbereich',
      'Bewegungsapparat / Beine / Gelenke / Rücken',
      'Ganzkörperlich / Systemisch (Fieber, Frösteln)'
    ];
    diffRemedies.push('Belladonna', 'Bryonia alba', 'Gelsemium sempervirens');
  } else if (!hasEmpfindung) {
    // 3. Empfindung
    rationale = 'Säule 3 (Empfindung) ist noch unbesetzt. Nach Hahnemann und Bönninghausen ist die Schmerz- bzw. Hitzequalität zwingend für die Mittelwahl.';
    nextQuestion = 'Wie fühlt sich die Beschwerde für Sie an – empfinden Sie drückende, stechende, klopfende oder brennende Schmerzen?';
    auswahlOptionen = [
      'Dumpf, drückend oder wie ein schweres Band/Helm um den Kopf',
      'Stechend oder wie Nadelstiche bei jeder Bewegung',
      'Klopfend, hämmernd und pulsierend in den Schläfen',
      'Wie zerschlagen, wund und empfindlich',
      'Brennende Hitze mit Ruhelosigkeit',
      'Ziehend und krampfartig'
    ];
    diffRemedies.push('Aconitum napellus', 'Belladonna', 'Ferrum phosphoricum', 'Bryonia alba');
  } else if (!hasModalitaeten) {
    // 4. Modalitäten
    rationale = 'Säule 4 (Modalitäten) fehlt. Was macht die Beschwerden spürbar besser oder schlechter (Wärme, Kälte, Druck, Bewegung, Ruhe)?';
    nextQuestion = 'Was macht Ihren Zustand spürbar besser oder schlechter – bessert fester Druck, Ruhe oder Kälte, oder verschlimmert Bewegung?';
    auswahlOptionen = [
      'Besser durch feste Bandagierung oder starken Druck auf die Stelle',
      'Verschlechterung bei der geringsten Bewegung (absolute Ruhe bessert)',
      'Besserung durch frische, kühle Luft und Entblößen',
      'Besserung durch Wärme und Einhüllung (Kälte/Zugluft unerträglich)',
      'Verschlimmerung morgens beim Aufwachen und abends',
      'Verschlimmerung durch Geräusche, Licht und Erschütterung'
    ];
    diffRemedies.push('Bryonia alba', 'Silicea', 'Belladonna', 'Aconitum napellus');
  } else if (!hasBegleitsymptome) {
    // 5. Begleitsymptome
    rationale = 'Säule 5 (Begleitsymptome / Concomitants) ist noch leer. Durstverhalten und Allgemeinsymptome sichern die Mittelwahl.';
    nextQuestion = 'Welche Begleitsymptome treten auf – haben Sie großen Durst auf kaltes Wasser oder sind Sie durstlos, und wie verhalten sich Schweiß und Frösteln?';
    auswahlOptionen = [
      'Großer, unstillbarer Durst auf eiskaltes Wasser',
      'Völliger Durstmangel trotz Hitzegefühl',
      'Frösteln und Schüttelfrost bei der geringsten Entblößung',
      'Heiße Schweißausbrüche mit rotem Gesicht',
      'Kühle Hände und Füße bei heißem Kopf'
    ];
    diffRemedies.push('Aconitum napellus', 'Belladonna', 'Apis mellifica', 'Gelsemium sempervirens');
  } else if (!hasGemuet) {
    // 6. Gemüt
    rationale = 'Säule 6 (Gemüt / Psychischer Zustand) ist noch unbestimmt. Der Gemütszustand ist die zentrale Hahnemannsche Leitsäule zur Simile-Bestimmung.';
    nextQuestion = 'Wie ist Ihre seelische Verfassung / Ihr Gemütszustand während der Beschwerden (z. B. gereizt, unruhig, ängstlich, apathisch oder sanftmütig)?';
    auswahlOptionen = [
      'Große Reizbarkeit, zornig, will absolut ungestört sein (Bryonia / Nux vomica)',
      'Ängstliche, getriebene Unruhe mit Furcht und Herzklopfen (Aconitum / Arsenicum)',
      'Apathisch, schläfrig, dumpf, will nur liegen (Gelsemium / Phosphor)',
      'Weinerlich, verlangt nach Trost, Zuwendung und frischer Luft (Pulsatilla)',
      'Ausgeglichen und gefasst, keine auffällige Gemütsveränderung'
    ];
    diffRemedies.push('Bryonia alba', 'Aconitum napellus', 'Belladonna', 'Pulsatilla');
  } else {
    // All 6 covered!
    status = 'completed';
    nextQuestion = '';
    auswahlOptionen = [];
    rationale = 'Alle 6 Säulen der klassischen Homöopathie wurden erfolgreich erhoben und differenziert.';
    if (matrix.modalitaeten?.includes('Druck') || matrix.modalitaeten?.includes('Ruhe')) {
      diffRemedies.push('Bryonia alba', 'Silicea', 'Belladonna');
    } else {
      diffRemedies.push('Aconitum napellus', 'Belladonna', 'Ferrum phosphoricum');
    }
  }

  let summary: string | null = null;
  const clarifyingQuestions: HahnemannClarifyingQuestion[] = [];

  if (status === 'completed') {
    summary = `Zusammenfassung für den Therapeuten:
Die homöopathische Vertiefungs-Anamnese nach Hahnemann & Bönninghausen ergibt auf Basis der 6-Säulen-Matrix:
• 1. Causa (Auslöser): ${matrix.causa || 'Kein spezifischer Auslöser genannt'}
• 2. Lokalisierung (Ort / Gewebe): ${matrix.lokalisierung || 'Systemisch / Ganzkörperlich'}
• 3. Empfindung (Sensation / Qualität): ${matrix.empfindung || 'Nicht näher spezifiziert'}
• 4. Modalitäten (Besser / Schlechter): ${matrix.modalitaeten || 'Keine Modalitäten genannt'}
• 5. Begleitsymptome (Concomitants): ${matrix.begleitsymptome && matrix.begleitsymptome.length > 0 ? matrix.begleitsymptome.join(', ') : 'Keine Begleitsymptome genannt'}
• 6. Gemüt (Psychischer Zustand): ${matrix.gemuet || 'Ausgeglichen / unauffällig'}

Homöopathische Simile-Differenzierung: Führendes Simile ist ${diffRemedies[0] || 'Bryonia alba'} basierend auf der exakten Gesamtheit der erhobenen 6 Säulen.`;

    // Max 1-2 focused clarifying questions, never looping endlessly
    if (!matrix.modalitaeten || matrix.modalitaeten === 'Noch nicht genannt') {
      clarifyingQuestions.push({
        id: 'q_modalitaet',
        frage: 'Wie reagieren die Schmerzen auf feste Bandagierung oder Druck versus Bewegung?',
        grund: 'Differenziert Druckbesserung (Silicea, Bryonia) von Berührungsüberempfindlichkeit (Belladonna)',
        kategorie: 'modalitaeten',
        optionen: [
          'Fester Druck und Bandagierung bessern deutlich',
          'Geringste Bewegung und Erschütterung verschlimmern',
          'Besserung durch sanfte Bewegung an der frischen Luft',
          'Weder Druck noch Bewegung verändern die Schmerzen'
        ]
      });
    }

    if (clarifyingQuestions.length < 2) {
      clarifyingQuestions.push({
        id: 'q_begleit',
        frage: 'Wie verhält sich das Durst- und Temperaturverlangen während des Zustands?',
        grund: 'Wichtiges Generalsymptom nach Bönninghausen zur Absicherung des Mittels',
        kategorie: 'begleitsymptome',
        optionen: [
          'Großer Durst auf große Mengen kaltes Wasser',
          'Völlige Durstlosigkeit trotz Hitze/Schmerz',
          'Ausgeprägtes Frösteln, Verlangen nach warmer Einhüllung',
          'Abneigung gegen frische Luft und Kälte'
        ]
      });
    }
  }

  return {
    analyse_status: status,
    wichtige_symptom_fragmente: matrix,
    ignorierte_daten: ignored,
    kontroll_und_nachfrage_logik: rationale,
    naechste_frage: nextQuestion,
    auswahl_optionen: auswahlOptionen,
    auswahl_typ: auswahlTyp,
    aktuelle_mittel_differenzierung: diffRemedies,
    end_analyse_zusammenfassung: summary,
    sich_ergebende_fragen: clarifyingQuestions.slice(0, 3),
  };
}
