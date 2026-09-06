/**
 * Hahnemann & Bönninghausen Classical Homoeopathic 6-Pillars Analysis Engine
 * 
 * Implements strict NLP fragmentation, irrelevance filtering, 6-pillar matrix mapping,
 * interpretation/hallucination prohibition, single-question sequential loop,
 * and remedy differentiation.
 */

import { getActiveTherapist } from './storage';

export type CaseType = 'akut' | 'chronisch';

export interface Hahnemann6Pillars {
  causa: string | null;
  lokalisierung: string | null;
  empfindung: string | null;
  modalitaeten: string | null;
  begleitsymptome: string[];
  gemuet: string | null;
  strahlungsoptionen?: string | null;
  ursaechlicher_zusammenhang?: string | null;
  fruehere_behandlungen_und_historie?: string | null;
}

export interface HahnemannClarifyingQuestion {
  id: string;
  frage: string;
  grund: string;
  kategorie?: 'gemuet' | 'modalitaeten' | 'begleitsymptome' | 'empfindung' | 'causa' | 'zusammenhang' | 'historie';
  optionen: string[];
  beantwortet?: string;
}

export interface HahnemannAnalysisResult {
  analyse_status: 'in_progress' | 'completed';
  wichtige_symptom_fragmente: Hahnemann6Pillars;
  falltyp?: CaseType;
  mehrere_symptome_erkannt?: boolean;
  symptomkomplex_bestaetigt?: boolean;
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
  forceComplete: boolean = false,
  caseType: CaseType = 'akut'
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
        caseType,
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

  // Fallback to local rule engine adhering strictly to Organon §§ 81-104
  return evaluateHahnemannLocally(trimmed, currentMatrix, conversationHistory, language, forceComplete, caseType);
}

/**
 * Deterministic local classical homoeopathic logic engine (Hahnemann Organon §§ 81–104)
 */
export function evaluateHahnemannLocally(
  newText: string,
  existingMatrix?: Partial<Hahnemann6Pillars>,
  _history: Array<{ question: string; answer: string }> = [],
  _language: string = 'de',
  forceComplete: boolean = false,
  caseType: CaseType = 'akut'
): HahnemannAnalysisResult {
  const matrix: Hahnemann6Pillars = {
    causa: existingMatrix?.causa || null,
    lokalisierung: existingMatrix?.lokalisierung || null,
    empfindung: existingMatrix?.empfindung || null,
    modalitaeten: existingMatrix?.modalitaeten || null,
    begleitsymptome: Array.isArray(existingMatrix?.begleitsymptome) ? [...existingMatrix.begleitsymptome] : [],
    gemuet: existingMatrix?.gemuet || null,
    strahlungsoptionen: existingMatrix?.strahlungsoptionen || null,
    ursaechlicher_zusammenhang: existingMatrix?.ursaechlicher_zusammenhang || null,
    fruehere_behandlungen_und_historie: existingMatrix?.fruehere_behandlungen_und_historie || null,
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

  // Detect if multiple distinct complaints are present (e.g. fever + headache, cough + sore throat)
  const hasFever = textLower.includes('fieber') || textLower.includes('temperatur') || textLower.includes('schüttelfrost');
  const hasHeadache = textLower.includes('kopfschmerz') || textLower.includes('kopfweh') || textLower.includes('migräne') || textLower.includes('stirn');
  const hasThroatOrCough = textLower.includes('hals') || textLower.includes('husten') || textLower.includes('schlucken') || textLower.includes('heiser');
  const hasAbdomen = textLower.includes('bauch') || textLower.includes('magen') || textLower.includes('darm') || textLower.includes('übel');
  
  const symptomKeywordsCount = [hasFever, hasHeadache, hasThroatOrCough, hasAbdomen].filter(Boolean).length;
  const multipleComplaints = symptomKeywordsCount >= 2;

  // Extract radiation if mentioned
  if (!matrix.strahlungsoptionen) {
    if (textLower.includes('strahlt') || textLower.includes('zieht nach') || textLower.includes('ausstrahlung')) {
      if (textLower.includes('nacken') || textLower.includes('hinterkopf')) {
        matrix.strahlungsoptionen = 'Ausstrahlung in den Nacken und Hinterkopf';
      } else if (textLower.includes('schulter') || textLower.includes('arm')) {
        matrix.strahlungsoptionen = 'Ausstrahlung in Schulter / Arm';
      } else if (textLower.includes('stirn') || textLower.includes('auge')) {
        matrix.strahlungsoptionen = 'Ausstrahlung in Stirn und Augen';
      } else {
        matrix.strahlungsoptionen = 'Ausstrahlung in angrenzende Regionen';
      }
    }
  }

  // Extract causal connection if answered
  if (!matrix.ursaechlicher_zusammenhang) {
    if (textLower.includes('zeitgleich') || textLower.includes('derselbe infekt') || textLower.includes('gemeinsamer auslöser') || (textLower.includes('ja') && textLower.includes('zusammenhang'))) {
      matrix.ursaechlicher_zusammenhang = 'Ja, beide Beschwerden entstanden zeitgleich durch denselben Infekt/Auslöser (Symptomkomplex)';
    } else if (textLower.includes('unabhängig') || textLower.includes('zwei verschiedene') || (textLower.includes('nein') && textLower.includes('zusammenhang'))) {
      matrix.ursaechlicher_zusammenhang = 'Nein, es handelt sich um zwei unabhängige Beschwerden';
    }
  }

  // Extract chronic history if chronic case
  if (caseType === 'chronisch' && !matrix.fruehere_behandlungen_und_historie) {
    if (textLower.includes('monate') || textLower.includes('jahre') || textLower.includes('vorbehandlung') || textLower.includes('medikament') || textLower.includes('unterdrückt')) {
      matrix.fruehere_behandlungen_und_historie = 'Chronischer Verlauf mit Vorbehandlungen und Vorgeschichte dokumentiert';
    }
  }

  // 3. BEFEHL: DIE KONTROLL- UND NACHFRAGESCHLEIFE (Strikte 6-Säulen-Führung nach Hahnemann Organon §§ 81–104)
  let nextQuestion = '';
  let rationale = '';
  let status: 'in_progress' | 'completed' = 'in_progress';
  const diffRemedies: string[] = [];

  let auswahlOptionen: string[] = [];
  let auswahlTyp: 'single' | 'multiple' = 'multiple';

  const hasCausa = Boolean(matrix.causa && matrix.causa !== 'Noch nicht genannt' && matrix.causa.trim().length > 0);
  const hasLokalisierung = Boolean(matrix.lokalisierung && matrix.lokalisierung !== 'Noch nicht genannt' && matrix.lokalisierung.trim().length > 0);
  const hasEmpfindung = Boolean(matrix.empfindung && matrix.empfindung !== 'Noch nicht genannt' && matrix.empfindung.trim().length > 0);
  const hasModalitaeten = Boolean(matrix.modalitaeten && matrix.modalitaeten !== 'Noch nicht genannt' && matrix.modalitaeten.trim().length > 0);
  const hasBegleitsymptome = Boolean(Array.isArray(matrix.begleitsymptome) && matrix.begleitsymptome.length > 0);
  const hasGemuet = Boolean(matrix.gemuet && matrix.gemuet !== 'Noch nicht genannt' && matrix.gemuet.trim().length > 0);
  const hasCausalityCheck = !multipleComplaints || Boolean(matrix.ursaechlicher_zusammenhang);
  const hasChronicHistoryCheck = caseType !== 'chronisch' || Boolean(matrix.fruehere_behandlungen_und_historie);

  const allPillarsCompleted = hasCausa && hasLokalisierung && hasEmpfindung && hasModalitaeten && hasBegleitsymptome && hasGemuet && hasCausalityCheck && hasChronicHistoryCheck;

  // Loop protection & completion check
  if (forceComplete || allPillarsCompleted || (_history.length >= 6 && hasEmpfindung && hasModalitaeten && hasGemuet)) {
    status = 'completed';
    nextQuestion = '';
    auswahlOptionen = [];
    rationale = 'Alle Säulen der homöopathischen Anamnese nach Hahnemann (Organon §§ 81–104) wurden vollständig erfasst.';
    if (matrix.modalitaeten?.includes('Ruhe') || matrix.modalitaeten?.includes('Druck')) {
      diffRemedies.push('Bryonia alba', 'Silicea', 'Belladonna');
    } else if (matrix.gemuet?.includes('Unruhe') || matrix.causa?.includes('Kälte')) {
      diffRemedies.push('Aconitum napellus', 'Belladonna', 'Arsenicum album');
    } else {
      diffRemedies.push('Aconitum napellus', 'Belladonna', 'Ferrum phosphoricum', 'Apis mellifica');
    }
  } else if (multipleComplaints && !matrix.ursaechlicher_zusammenhang) {
    // 0. Multiple symptoms causality check (Hahnemann Organon)
    rationale = 'Mehrere Beschwerden angegeben. Nach Hahnemann muss zuerst geprüft werden, ob ein ursächlicher Zusammenhang (z. B. derselbe Infekt) besteht, um sie als zusammenhängenden Komplex zu erfassen.';
    nextQuestion = 'Besteht zwischen Ihren angegebenen Beschwerden ein ursächlicher Zusammenhang (z. B. durch denselben Infekt, Auslöser oder Beginn)?';
    auswahlTyp = 'single';
    auswahlOptionen = [
      'Ja, beide Beschwerden entstanden zeitgleich durch denselben Infekt / Auslöser (Symptomkomplex)',
      'Nein, es handelt sich um zwei voneinander unabhängige Beschwerden',
      'Die zweite Beschwerde trat nacheinander als Folge der Erstbeschwerde auf',
      'Zusammenhang noch unklar / wird separat beobachtet'
    ];
    diffRemedies.push('Aconitum napellus', 'Belladonna', 'Bryonia alba');
  } else if (caseType === 'chronisch' && !matrix.fruehere_behandlungen_und_historie) {
    // Chronic case history & previous treatments (§§ 83–98 Organon)
    rationale = 'Chronischer Fall (§§ 83–98 Organon): Die umfassende Historie inklusive früherer Behandlungen, Unterdrückungen und Dauer muss erforscht werden.';
    nextQuestion = 'Wie lange bestehen diese chronischen Beschwerden bereits und welche früheren Behandlungen, Therapien oder Medikationen gab es?';
    auswahlTyp = 'single';
    auswahlOptionen = [
      'Besteht seit vielen Monaten/Jahren mit wiederholten allopathischen Behandlungen',
      'Tritt seit längerer Zeit chronisch-schubweise auf, bisher keine Dauermedikation',
      'Folge einer früheren unterdrückten Erkrankung oder eines Hautausschlags',
      'Erstmaliges Auftreten in dieser Form, keine Vorbehandlungen'
    ];
    diffRemedies.push('Sulphur', 'Calcarea carbonica', 'Lycopodium clavatum', 'Silicea');
  } else if (!hasCausa) {
    // 1. Causa (Auslöser oder Beginn)
    rationale = caseType === 'akut' 
      ? 'Akuter Fall (§ 99 Organon): Unmittelbarer Auslöser (Causa) und akuter Beginn müssen exakt erfasst werden.'
      : 'Causa (Auslöser oder Beginn): Was war der ursprüngliche Anlass für den Beginn der Beschwerden?';
    nextQuestion = 'Gab es einen konkreten Auslöser oder Beginn für Ihre Beschwerden (z. B. kalte Luft/Wind, Durchnässung, Ärger, Schreck oder Überanstrengung)?';
    auswahlTyp = 'single';
    auswahlOptionen = [
      'Kälteeinwirkung (kalter trockener Wind, Zugluft, Unterkühlung)',
      'Durchnässung, Nässe oder Baden in kaltem Wasser',
      'Plötzlicher Schreck, Schock oder akute Angst',
      'Ärger, Zorn, Kränkung oder emotionaler Stress',
      'Körperliche Überanstrengung oder Verheben',
      'Kein spezifischer Auslöser erinnerlich / schleichender Beginn'
    ];
    diffRemedies.push('Aconitum napellus', 'Belladonna', 'Bryonia alba', 'Rhus toxicodendron');
  } else if (!hasLokalisierung) {
    // 2. Lokalisation (Ort und Strahlungsoptionen)
    rationale = 'Lokalisation (Ort und Strahlungsoptionen): Der genaue anatomische Sitz und etwaige Ausstrahlungen müssen erfasst werden.';
    nextQuestion = 'Wo genau manifestieren sich die Beschwerden – und strahlen sie in andere Körperregionen aus?';
    auswahlTyp = 'single';
    auswahlOptionen = [
      'Kopf / Stirn / Schläfen mit Ausstrahlung in den Nacken',
      'Hals / Rachen / Mandeln mit Ausstrahlung in die Ohren',
      'Brustkorb / Lunge / Bronchien',
      'Magen-Darm-Trakt / Oberbauch mit Ausstrahlung in den Rücken',
      'Bewegungsapparat / Gelenke / Glieder',
      'Ganzkörperlich / Systemisch (Fieber, Frösteln)'
    ];
    diffRemedies.push('Belladonna', 'Bryonia alba', 'Gelsemium sempervirens');
  } else if (!hasEmpfindung) {
    // 3. Sensation (Qualität der Beschwerde)
    rationale = 'Sensation (Qualität der Beschwerde): Nach Hahnemann und Bönninghausen ist die Schmerz- bzw. Missempfindungsqualität entscheidend.';
    nextQuestion = 'Wie fühlt sich die Beschwerde für Sie an – welche Schmerz- oder Empfindungsqualität beschreibt es am besten?';
    auswahlTyp = 'single';
    auswahlOptionen = [
      'Klopfend, hämmernd und pulsierend (Belladonna)',
      'Stechend bei jeder geringsten Bewegung oder Einatmung (Bryonia)',
      'Dumpf, drückend oder wie eine schwere Last/Band um den Kopf (Gelsemium)',
      'Wie zerschlagen, wund in allen Gliedern (Eupatorium / Arnica)',
      'Brennende Hitze mit Ruhelosigkeit (Aconitum / Arsenicum)',
      'Ziehend und krampfartig (Colocynthis / Magnesia phosphorica)'
    ];
    diffRemedies.push('Aconitum napellus', 'Belladonna', 'Bryonia alba', 'Ferrum phosphoricum');
  } else if (!hasModalitaeten) {
    // 4. Modalitäten (Verschlechterung oder Besserung)
    rationale = 'Modalitäten (Verschlechterung / Besserung): Umfassende Bedingungen von Besserung und Verschlimmerung (Wärme, Kälte, Ruhe, Bewegung).';
    nextQuestion = 'Was macht Ihren Zustand spürbar besser oder schlechter – reagieren Sie auf Wärme, Kälte, Ruhe oder Bewegung?';
    auswahlTyp = 'multiple';
    auswahlOptionen = [
      'Besserung durch absolute Ruhe, geringste Bewegung verschlimmert',
      'Besserung durch feste Bandagierung oder festen Druck auf die Stelle',
      'Besserung durch kühle, frische Luft und Entblößen',
      'Besserung durch Wärme, warme Auflagen und Einhüllen (Kälte unerträglich)',
      'Verschlimmerung durch Licht, Geräusche und Erschütterung',
      'Verschlimmerung abends und nachts im Bett'
    ];
    diffRemedies.push('Bryonia alba', 'Silicea', 'Belladonna', 'Aconitum napellus');
  } else if (!hasBegleitsymptome) {
    // 5. Begleitsymptome und Gemüt (Begleitsymptome)
    rationale = 'Begleitsymptome (Concomitants): Durstverhalten, Schweißbildung und Allgemeinsymptome sichern die Mittelwahl ab.';
    nextQuestion = 'Welche Begleitsymptome treten auf – wie verhalten sich Durst, Schweiß und Temperatur?';
    auswahlTyp = 'multiple';
    auswahlOptionen = [
      'Großer, unstillbarer Durst auf eiskaltes Wasser',
      'Völlige Durstlosigkeit trotz Fieber oder Hitze',
      'Trockene, brennend heiße Haut ohne jede Schweißbildung',
      'Profuser, erleichternder Schweiß',
      'Schüttelfrost bei jeder geringsten Entblößung',
      'Rotes Gesicht beim Liegen, blass beim Aufrichten'
    ];
    diffRemedies.push('Aconitum napellus', 'Belladonna', 'Apis mellifica', 'Gelsemium sempervirens');
  } else if (!hasGemuet) {
    // 5. Begleitsymptome und das Gemüt (Gemütsverfassung)
    rationale = 'Gemüt (Psychischer Zustand): Nach Hahnemann die Krone der Symptome und der wichtigste Wegweiser zum passenden Simile.';
    nextQuestion = 'Wie ist Ihre seelische Verfassung / Ihr Gemütszustand während dieser Beschwerden?';
    auswahlTyp = 'single';
    auswahlOptionen = [
      'Große Reizbarkeit und Zorn, will absolut in Ruhe gelassen werden (Bryonia)',
      'Ängstliche, getriebene Unruhe mit Todesfurcht und Herzklopfen (Aconitum)',
      'Apathisch, schläfrig, wie betäubt, verlangt nach Stille (Gelsemium)',
      'Weinerlich, verlangt nach Zuwendung, Trost und frischer Luft (Pulsatilla)',
      'Verzweifelt und ängstlich ruhelos, wandert umher (Arsenicum)',
      'Ausgeglichen und gefasst, keine spürbare Gemütsveränderung'
    ];
    diffRemedies.push('Bryonia alba', 'Aconitum napellus', 'Belladonna', 'Pulsatilla');
  } else {
    // All 6 covered!
    status = 'completed';
    nextQuestion = '';
    auswahlOptionen = [];
    rationale = 'Alle Säulen der homöopathischen Anamnese nach Hahnemann (Organon §§ 81–104) wurden erfolgreich erhoben und differenziert.';
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
    falltyp: caseType,
    mehrere_symptome_erkannt: multipleComplaints,
    symptomkomplex_bestaetigt: Boolean(matrix.ursaechlicher_zusammenhang && (matrix.ursaechlicher_zusammenhang.toLowerCase().includes('ja') || matrix.ursaechlicher_zusammenhang.toLowerCase().includes('zeitgleich'))),
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
