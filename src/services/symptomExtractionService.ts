/**
 * Symptom Extraction Service
 * 
 * Accurately extracts and categorizes clinical symptoms, causes (Causa),
 * modalities, sensations, and mind symptoms from patient narratives or spoken text.
 */

export interface RecognizedSymptom {
  id: string;
  label: string;
  category: 'leit' | 'causa' | 'lokalisation' | 'empfindung' | 'modalitaet' | 'begleit' | 'gemuet';
  categoryLabel: string;
  iconName?: string;
}

export function extractRecognizedSymptoms(text: string, language: string = 'de'): RecognizedSymptom[] {
  if (!text || !text.trim()) {
    return [];
  }

  const normalized = text.toLowerCase();
  const symptoms: RecognizedSymptom[] = [];
  const addedKeys = new Set<string>();

  const add = (id: string, label: string, category: RecognizedSymptom['category'], categoryLabel: string) => {
    if (!addedKeys.has(id)) {
      addedKeys.add(id);
      symptoms.push({ id, label, category, categoryLabel });
    }
  };

  // 1. LEITSYMPTOME / HAUPTBESCHWERDEN
  if (normalized.includes('fieber') || normalized.includes('hohe temperatur') || normalized.includes('fever') || normalized.includes('fièvre') || normalized.includes('febbre') || normalized.includes('fiebre')) {
    add('sym_fieber', 'Fieber & Erhöhte Temperatur', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('kopfschmerz') || normalized.includes('migräne') || normalized.includes('kopfweh') || normalized.includes('headache') || normalized.includes('maux de tête')) {
    add('sym_kopfschmerz', 'Kopfschmerzen / Migräne', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('husten') || normalized.includes('cough') || normalized.includes('toux') || normalized.includes('tosse')) {
    add('sym_husten', 'Husten & Bronchialreiz', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('hals') && (normalized.includes('schmerz') || normalized.includes('weh') || normalized.includes('brennen') || normalized.includes('kratzen'))) {
    add('sym_halsschmerz', 'Halsschmerzen / Schluckbeschwerden', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('schnupfen') || normalized.includes('rhinitis') || normalized.includes('laufende nase') || normalized.includes('verstopfte nase')) {
    add('sym_schnupfen', 'Schnupfen & Rhinitis', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('bauch') && (normalized.includes('schmerz') || normalized.includes('krampf') || normalized.includes('weh'))) {
    add('sym_bauchschmerz', 'Bauchschmerzen / Krämpfe', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('magen') && (normalized.includes('schmerz') || normalized.includes('druck') || normalized.includes('brennen'))) {
    add('sym_magenschmerz', 'Magenschmerzen / Gastritis', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('übelkeit') || normalized.includes('uebelkeit') || normalized.includes('nausea') || normalized.includes('erbrechen')) {
    add('sym_uebelkeit', 'Übelkeit & Brechreiz', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('durchfall') || normalized.includes('diarrhoe') || normalized.includes('diarrhea')) {
    add('sym_durchfall', 'Durchfall (Diarrhoe)', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('blase') || normalized.includes('harnweg') || normalized.includes('wasserlassen') || normalized.includes('brennen beim pinkeln')) {
    add('sym_cystitis', 'Harnwegsbeschwerden / Brennen', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('ohr') && (normalized.includes('schmerz') || normalized.includes('weh') || normalized.includes('stechen'))) {
    add('sym_ohrenschmerz', 'Ohrenschmerzen (Otitis)', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('rücken') || normalized.includes('lumbago') || normalized.includes('hexenschuss') || normalized.includes('kreuzschmerz')) {
    add('sym_ruecken', 'Rückenschmerzen / Hexenschuss', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('schwindel') || normalized.includes('vertigo') || normalized.includes('dizziness')) {
    add('sym_schwindel', 'Schwindel (Vertigo)', 'leit', 'Leitsymptom');
  }
  if (
    normalized.includes('popo') ||
    normalized.includes('after') ||
    normalized.includes('hämorrhoid') ||
    normalized.includes('haemorrhoid') ||
    normalized.includes('gesäß') ||
    normalized.includes('gesaess') ||
    normalized.includes('anal') ||
    normalized.includes('rektal') ||
    normalized.includes('rectal') ||
    normalized.includes('hemorroid')
  ) {
    add('sym_anal_haemorrhoid', 'Anal- & Gesäßschmerzen / Hämorrhoiden', 'leit', 'Leitsymptom');
  }

  // 2. CAUSA (Auslöser & Ursachen)
  if (normalized.includes('schwimmbad') || normalized.includes('pool') || normalized.includes('geschwommen') || normalized.includes('schwimmen') || normalized.includes('baden')) {
    add('causa_schwimmbad', 'Auslöser: Schwimmbad / Baden', 'causa', 'Causa');
  }
  if (normalized.includes('nass') || normalized.includes('durchnässt') || normalized.includes('durchnässung') || normalized.includes('nasse haare') || normalized.includes('nasse füße') || normalized.includes('regen')) {
    add('causa_naesse', 'Auslöser: Nässe / Durchnässung', 'causa', 'Causa');
  }
  if (normalized.includes('kalt') && (normalized.includes('luft') || normalized.includes('brise') || normalized.includes('briesel') || normalized.includes('wind') || normalized.includes('zugluft'))) {
    add('causa_kaltluft', 'Auslöser: Kalte Zugluft / kalter Wind', 'causa', 'Causa');
  }
  if (normalized.includes('kälte') || normalized.includes('unterkühlt') || normalized.includes('frieren') || normalized.includes('unterkühlung')) {
    add('causa_unterkuehlung', 'Auslöser: Kälteeinwirkung / Unterkühlung', 'causa', 'Causa');
  }
  if (normalized.includes('sonne') || normalized.includes('hitze') || normalized.includes('überhitzung') || normalized.includes('sonnenstich')) {
    add('causa_hitze', 'Auslöser: Hitze / Sonneneinwirkung', 'causa', 'Causa');
  }
  if (normalized.includes('schreck') || normalized.includes('angst') || normalized.includes('panik') || normalized.includes('schock')) {
    add('causa_schreck', 'Auslöser: Schreck / Akute Furcht', 'causa', 'Causa');
  }
  if (normalized.includes('ärger') || normalized.includes('aerger') || normalized.includes('zorn') || normalized.includes('kränkung') || normalized.includes('streit')) {
    add('causa_aerger', 'Auslöser: Ärger / Entrüstung / Zorn', 'causa', 'Causa');
  }
  if (normalized.includes('überanstrengung') || normalized.includes('schwer getragen') || normalized.includes('sport') || normalized.includes('verhoben')) {
    add('causa_ueberanstrengung', 'Auslöser: Körperliche Überanstrengung', 'causa', 'Causa');
  }
  if (normalized.includes('verdorben') || normalized.includes('eis') || normalized.includes('fettiges essen') || normalized.includes('falsche ernährung')) {
    add('causa_diaet', 'Auslöser: Diätfehler / Verdorbenes', 'causa', 'Causa');
  }

  // 3. MODALITÄTEN (Besser / Schlechter)
  if (normalized.includes('aufstehen') || normalized.includes('aufstehe') || normalized.includes('aufrichten') || normalized.includes('erheben') || normalized.includes('rising')) {
    add('mod_worse_rising', 'Modalität: Verschlimmert beim Aufstehen / Aufrichten', 'modalitaet', 'Modalität');
  }
  if (normalized.includes('schlechter durch kälte') || (normalized.includes('kalt') && normalized.includes('schlimmer')) || normalized.includes('briesel luft')) {
    add('mod_worse_cold', 'Modalität: Verschlimmert durch kalte Luft / Wind', 'modalitaet', 'Modalität');
  }
  if (normalized.includes('besser durch wärme') || normalized.includes('warmes einhüllen') || normalized.includes('wärmflasche') || normalized.includes('besser wärme')) {
    add('mod_better_warmth', 'Modalität: Gebessert durch Wärme & Einhüllen', 'modalitaet', 'Modalität');
  }
  if (normalized.includes('besser durch frische luft') || normalized.includes('besser draußen') || normalized.includes('frische luft')) {
    add('mod_better_fresh_air', 'Modalität: Gebessert durch frische kühle Luft', 'modalitaet', 'Modalität');
  }
  if (normalized.includes('schlechter bei bewegung') || normalized.includes('geringste bewegung') || normalized.includes('besser durch ruhe')) {
    add('mod_rest_better', 'Modalität: Gebessert durch absolute Ruhe (Verschlimmert bei Bewegung)', 'modalitaet', 'Modalität');
  }
  if (normalized.includes('besser durch bewegung') || normalized.includes('umhergehen') || normalized.includes('fortgesetzte bewegung')) {
    add('mod_motion_better', 'Modalität: Gebessert durch fortgesetzte Bewegung', 'modalitaet', 'Modalität');
  }

  // 4. SENSATIONEN & EMPFINDUNGEN
  if (normalized.includes('stechend') || normalized.includes('stechen') || normalized.includes('nadeln')) {
    add('empf_stechen', 'Empfindung: Stechender Schmerz', 'empfindung', 'Empfindung');
  }
  if (normalized.includes('brennend') || normalized.includes('brennen') || normalized.includes('glühend')) {
    add('empf_brennen', 'Empfindung: Brennender Schmerz', 'empfindung', 'Empfindung');
  }
  if (normalized.includes('pulsierend') || normalized.includes('pochend') || normalized.includes('klopfend')) {
    add('empf_pulsieren', 'Empfindung: Klopfend / Pulsierend', 'empfindung', 'Empfindung');
  }
  if (normalized.includes('zerschlagen') || normalized.includes('wie verprügelt') || normalized.includes('muskelkater')) {
    add('empf_zerschlagen', 'Empfindung: Wie zerschlagen / wund', 'empfindung', 'Empfindung');
  }

  // 5. BEGLEITSYMPTOME & ALLGEMEINES
  if (normalized.includes('durstlos') || normalized.includes('kein durst') || normalized.includes('durstmangel')) {
    add('begleit_durstlos', 'Begleitsymptom: Durstlosigkeit', 'begleit', 'Begleitsymptom');
  } else if (normalized.includes('großer durst') || normalized.includes('viel durst') || normalized.includes('durstig') || normalized.includes('durst auf kaltes')) {
    add('begleit_durst', 'Begleitsymptom: Starker Durst', 'begleit', 'Begleitsymptom');
  }

  if (normalized.includes('schüttelfrost') || normalized.includes('frösteln') || normalized.includes('kälteschauer')) {
    add('begleit_frost', 'Begleitsymptom: Frösteln / Schüttelfrost', 'begleit', 'Begleitsymptom');
  }
  if (normalized.includes('schweiß') || normalized.includes('schwitzen') || normalized.includes('schweiss')) {
    add('begleit_schweiss', 'Begleitsymptom: Schweißneigung', 'begleit', 'Begleitsymptom');
  }
  if (normalized.includes('rotes gesicht') || normalized.includes('heißer kopf') || normalized.includes('glühendes gesicht')) {
    add('begleit_rotes_gesicht', 'Begleitsymptom: Rotes, heißes Gesicht', 'begleit', 'Begleitsymptom');
  }

  // 6. GEMÜT & PSYCHE
  if (normalized.includes('unruhe') || normalized.includes('unruhig') || normalized.includes('wälzen') || normalized.includes('panisch')) {
    add('gemuet_unruhe', 'Gemüt: Ängstliche Unruhe', 'gemuet', 'Gemüt');
  }
  if (normalized.includes('reizbar') || normalized.includes('wütend') || normalized.includes('schimpfen') || normalized.includes('unleidlich')) {
    add('gemuet_reizbar', 'Gemüt: Ausgeprägte Reizbarkeit', 'gemuet', 'Gemüt');
  }
  if (normalized.includes('weinerlich') || normalized.includes('getröstet') || normalized.includes('trost')) {
    add('gemuet_weinerlich', 'Gemüt: Weinerlich / Trostbedürftig', 'gemuet', 'Gemüt');
  }
  if (normalized.includes('apathisch') || normalized.includes('teilnahmslos') || normalized.includes('schläfrig')) {
    add('gemuet_apathisch', 'Gemüt: Apathie / Schwäche', 'gemuet', 'Gemüt');
  }

  // FALLBACK: If nothing was matched by heuristics but text has meaningful words,
  // extract sentences/segments as detected symptom items
  if (symptoms.length === 0 && text.trim().length >= 3) {
    const rawSegments = text
      .split(/[,;\n•]+|\s+und\s+|\s+sowie\s+/i)
      .map(s => s.trim())
      .filter(s => s.length >= 3 && !/^(ich|habe|bin|da|dann|auch|ein|eine|der|die|das)$/i.test(s));

    rawSegments.slice(0, 4).forEach((seg, idx) => {
      const clean = seg.charAt(0).toUpperCase() + seg.slice(1);
      add(`sym_raw_${idx}`, clean, 'leit', 'Symptom');
    });
  }

  return symptoms;
}
