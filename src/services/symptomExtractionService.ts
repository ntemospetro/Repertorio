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

  // 1. LEITSYMPTOME / HAUPTBESCHWERDEN & ORGANBEZÜGE
  if (normalized.includes('fieber') || normalized.includes('hohe temperatur') || normalized.includes('fever') || normalized.includes('fièvre') || normalized.includes('febbre') || normalized.includes('fiebre')) {
    add('sym_fieber', 'Fieber & Erhöhte Temperatur', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('kopfschmerz') || normalized.includes('migräne') || normalized.includes('kopfweh') || normalized.includes('headache') || normalized.includes('maux de tête') || normalized.includes('stirnkopfschmerz')) {
    add('sym_kopfschmerz', 'Kopfschmerzen / Migräne', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('husten') || normalized.includes('cough') || normalized.includes('toux') || normalized.includes('tosse') || normalized.includes('bronch') || normalized.includes('kitzelhusten')) {
    add('sym_husten', 'Husten & Bronchialreiz', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('hals') && (normalized.includes('schmerz') || normalized.includes('weh') || normalized.includes('brennen') || normalized.includes('kratzen') || normalized.includes('rot') || normalized.includes('eng'))) {
    add('sym_halsschmerz', 'Halsschmerzen / Entzündung', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('schluck') || normalized.includes('schluckbeschwerd') || normalized.includes('schlucken schmerzhaft') || normalized.includes('swallow')) {
    add('sym_schlucken', 'Schluckbeschwerden & Rachenenge', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('schnupfen') || normalized.includes('rhinitis') || normalized.includes('laufende nase') || normalized.includes('verstopfte nase') || normalized.includes('niesanfall') || normalized.includes('niesen')) {
    add('sym_schnupfen', 'Schnupfen & Rhinitis (Nasensekret)', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('heiser') || normalized.includes('heiserkeit') || normalized.includes('stimme weg') || normalized.includes('kehlkopf') || normalized.includes('laryngitis')) {
    add('sym_heiserkeit', 'Heiserkeit & Kehlkopfaffektion', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('atemnot') || normalized.includes('kurzatmig') || normalized.includes('dyspnoe') || normalized.includes('asthma') || normalized.includes('beklemmung brust')) {
    add('sym_atemnot', 'Atemnot & Brustbeklemmung', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('bauch') && (normalized.includes('schmerz') || normalized.includes('krampf') || normalized.includes('weh') || normalized.includes('kolik') || normalized.includes('druck'))) {
    add('sym_bauchschmerz', 'Bauchschmerzen / Koliken', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('magen') && (normalized.includes('schmerz') || normalized.includes('druck') || normalized.includes('brennen') || normalized.includes('krampf') || normalized.includes('sodbrennen'))) {
    add('sym_magenschmerz', 'Magenschmerzen / Sodbrennen', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('blähung') || normalized.includes('meteorismus') || normalized.includes('blähbauch') || normalized.includes('aufgetrieben')) {
    add('sym_blaehung', 'Blähbauch & Meteorismus', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('übelkeit') || normalized.includes('uebelkeit') || normalized.includes('nausea') || normalized.includes('erbrechen') || normalized.includes('erbrochen') || normalized.includes('würgen')) {
    add('sym_uebelkeit', 'Übelkeit & Erbrechen', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('durchfall') || normalized.includes('diarrhoe') || normalized.includes('diarrhea') || normalized.includes('wässriger stuhl')) {
    add('sym_durchfall', 'Durchfall (Diarrhoe)', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('verstopfung') || normalized.includes('obstipation') || normalized.includes('harter stuhl') || normalized.includes('träger darm')) {
    add('sym_obstipation', 'Verstopfung (Obstipation)', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('blase') || normalized.includes('harnweg') || normalized.includes('wasserlassen') || normalized.includes('brennen beim pinkeln') || normalized.includes('drang') || normalized.includes('zystitis')) {
    add('sym_cystitis', 'Harnwegsbeschwerden & Dysurie', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('ohr') && (normalized.includes('schmerz') || normalized.includes('weh') || normalized.includes('stechen') || normalized.includes('otitis') || normalized.includes('druck'))) {
    add('sym_ohrenschmerz', 'Ohrenschmerzen (Otitis)', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('auge') && (normalized.includes('brennen') || normalized.includes('rötung') || normalized.includes('tränen') || normalized.includes('lichtscheu') || normalized.includes('bindehaut'))) {
    add('sym_augen', 'Augenbeschwerden / Bindehautreizung', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('rücken') || normalized.includes('lumbago') || normalized.includes('hexenschuss') || normalized.includes('kreuzschmerz') || normalized.includes('wirbelsäule')) {
    add('sym_ruecken', 'Rückenschmerzen / Lumbago', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('nacken') || normalized.includes('steifer nacken') || normalized.includes('schulter-nacken') || normalized.includes('halswirbel')) {
    add('sym_nacken', 'Nackenbeschwerden & Verspannung', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('gelenk') || normalized.includes('knie') || normalized.includes('schulter') || normalized.includes('hüfte') || normalized.includes('arthritis') || normalized.includes('rheuma') || normalized.includes('arthrose')) {
    add('sym_gelenke', 'Gelenkbeschwerden & Rheuma', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('schwindel') || normalized.includes('vertigo') || normalized.includes('dizziness') || normalized.includes('drehschwindel') || normalized.includes('schwankschwindel')) {
    add('sym_schwindel', 'Schwindel (Vertigo)', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('müdigkeit') || normalized.includes('erschöpfung') || normalized.includes('matt') || normalized.includes('mattigkeit') || normalized.includes('kraftlos') || normalized.includes('abgeschlagen') || normalized.includes('fatigue')) {
    add('sym_erschoepfung', 'Schwäche & Erschöpfung / Mattigkeit', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('schlafstörung') || normalized.includes('schlaflos') || normalized.includes('einschlafen') || normalized.includes('durchschlafen') || normalized.includes('erwacht um 3') || normalized.includes('schlafmangel')) {
    add('sym_schlaf', 'Schlafstörung & Unruhiger Schlaf', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('haut') && (normalized.includes('ausschlag') || normalized.includes('juckreiz') || normalized.includes('ekzem') || normalized.includes('trocken') || normalized.includes('rötung') || normalized.includes('bläschen'))) {
    add('sym_haut', 'Hautausschlag & Juckreiz', 'leit', 'Leitsymptom');
  }
  if (normalized.includes('zahn') && (normalized.includes('schmerz') || normalized.includes('weh') || normalized.includes('empfindlich') || normalized.includes('zahnfleisch'))) {
    add('sym_zahn', 'Zahnschmerzen & Zahnfleischreiz', 'leit', 'Leitsymptom');
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
  if (normalized.includes('nass') || normalized.includes('durchnässt') || normalized.includes('durchnässung') || normalized.includes('nasse haare') || normalized.includes('nasse füße') || normalized.includes('regen') || normalized.includes('feuchtigkeit')) {
    add('causa_naesse', 'Auslöser: Nässe / Durchnässung', 'causa', 'Causa');
  }
  if (normalized.includes('kalt') && (normalized.includes('luft') || normalized.includes('brise') || normalized.includes('briesel') || normalized.includes('wind') || normalized.includes('zugluft'))) {
    add('causa_kaltluft', 'Auslöser: Kalte Zugluft / kalter Wind', 'causa', 'Causa');
  }
  if (normalized.includes('kälte') || normalized.includes('unterkühlt') || normalized.includes('frieren') || normalized.includes('unterkühlung') || normalized.includes('frost')) {
    add('causa_unterkuehlung', 'Auslöser: Kälteeinwirkung / Unterkühlung', 'causa', 'Causa');
  }
  if (normalized.includes('sonne') || normalized.includes('hitze') || normalized.includes('überhitzung') || normalized.includes('sonnenstich')) {
    add('causa_hitze', 'Auslöser: Hitze / Sonneneinwirkung', 'causa', 'Causa');
  }
  if (normalized.includes('schreck') || normalized.includes('angst') || normalized.includes('panik') || normalized.includes('schock') || normalized.includes('trauma') || normalized.includes('unfall') || normalized.includes('sturz')) {
    add('causa_schreck', 'Auslöser: Schreck / Trauma / Schock', 'causa', 'Causa');
  }
  if (normalized.includes('ärger') || normalized.includes('aerger') || normalized.includes('zorn') || normalized.includes('kränkung') || normalized.includes('streit') || normalized.includes('kummer') || normalized.includes('trauer')) {
    add('causa_aerger', 'Auslöser: Ärger / Kränkung / Gemütserregung', 'causa', 'Causa');
  }
  if (normalized.includes('überanstrengung') || normalized.includes('schwer getragen') || normalized.includes('sport') || normalized.includes('verhoben') || normalized.includes('überarbeitung')) {
    add('causa_ueberanstrengung', 'Auslöser: Körperliche Überanstrengung', 'causa', 'Causa');
  }
  if (normalized.includes('verdorben') || normalized.includes('eis') || normalized.includes('fettiges essen') || normalized.includes('falsche ernährung') || normalized.includes('alkohol') || normalized.includes('kaffee')) {
    add('causa_diaet', 'Auslöser: Diätfehler / Genussmittel', 'causa', 'Causa');
  }

  // 3. MODALITÄTEN (Besser / Schlechter)
  if (normalized.includes('aufstehen') || normalized.includes('aufstehe') || normalized.includes('aufrichten') || normalized.includes('erheben') || normalized.includes('rising')) {
    add('mod_worse_rising', 'Modalität: Verschlimmert beim Aufstehen / Aufrichten', 'modalitaet', 'Modalität');
  }
  if (normalized.includes('schlechter durch kälte') || (normalized.includes('kalt') && normalized.includes('schlimmer')) || normalized.includes('briesel luft') || normalized.includes('kälteempfindlich') || normalized.includes('zugluftempfindlich')) {
    add('mod_worse_cold', 'Modalität: Verschlimmert durch kalte Luft / Kälte', 'modalitaet', 'Modalität');
  }
  if (normalized.includes('besser durch wärme') || normalized.includes('warmes einhüllen') || normalized.includes('wärmflasche') || normalized.includes('besser wärme') || normalized.includes('warme anwendungen')) {
    add('mod_better_warmth', 'Modalität: Gebessert durch Wärme & Einhüllen', 'modalitaet', 'Modalität');
  }
  if (normalized.includes('besser durch frische luft') || normalized.includes('besser draußen') || normalized.includes('frische luft') || normalized.includes('verlangen nach frischer luft')) {
    add('mod_better_fresh_air', 'Modalität: Gebessert durch kühle Frischluft', 'modalitaet', 'Modalität');
  }
  if (normalized.includes('schlechter bei bewegung') || normalized.includes('geringste bewegung') || normalized.includes('besser durch ruhe') || normalized.includes('jede bewegung verschlimmert')) {
    add('mod_rest_better', 'Modalität: Gebessert durch Ruhe (< geringste Bewegung)', 'modalitaet', 'Modalität');
  }
  if (normalized.includes('besser durch bewegung') || normalized.includes('umhergehen') || normalized.includes('fortgesetzte bewegung') || normalized.includes('sanfte bewegung')) {
    add('mod_motion_better', 'Modalität: Gebessert durch sanfte / fortgesetzte Bewegung', 'modalitaet', 'Modalität');
  }
  if (normalized.includes('besser durch druck') || normalized.includes('feste bandagierung') || normalized.includes('drauflegen')) {
    add('mod_better_pressure', 'Modalität: Gebessert durch harten Druck', 'modalitaet', 'Modalität');
  }
  if (normalized.includes('schlimmer nachts') || normalized.includes('verschlimmerung nachts') || normalized.includes('abends schlimmer')) {
    add('mod_worse_night', 'Modalität: Verschlimmert abends / nachts', 'modalitaet', 'Modalität');
  }

  // 4. SENSATIONEN & EMPFINDUNGEN
  if (normalized.includes('stechend') || normalized.includes('stechen') || normalized.includes('nadeln') || normalized.includes('splitter')) {
    add('empf_stechen', 'Empfindung: Stechender Schmerz', 'empfindung', 'Empfindung');
  }
  if (normalized.includes('brennend') || normalized.includes('brennen') || normalized.includes('glühend') || normalized.includes('wie feuer')) {
    add('empf_brennen', 'Empfindung: Brennender Schmerz', 'empfindung', 'Empfindung');
  }
  if (normalized.includes('pulsierend') || normalized.includes('pochend') || normalized.includes('klopfend') || normalized.includes('hämmernd')) {
    add('empf_pulsieren', 'Empfindung: Klopfend / Pulsierend', 'empfindung', 'Empfindung');
  }
  if (normalized.includes('zerschlagen') || normalized.includes('wie verprügelt') || normalized.includes('muskelkater') || normalized.includes('wie wund')) {
    add('empf_zerschlagen', 'Empfindung: Wie zerschlagen / wund', 'empfindung', 'Empfindung');
  }
  if (normalized.includes('krampfartig') || normalized.includes('zusammenziehend') || normalized.includes('wie eingeschnürt') || normalized.includes('kolikartig')) {
    add('empf_krampf', 'Empfindung: Krampfartig / Zusammenschnürend', 'empfindung', 'Empfindung');
  }
  if (normalized.includes('taub') || normalized.includes('kribbeln') || normalized.includes('pelzig') || normalized.includes('ameisenlaufen')) {
    add('empf_taub', 'Empfindung: Kribbeln / Pelzigkeit / Taubheit', 'empfindung', 'Empfindung');
  }

  // 5. BEGLEITSYMPTOME & ALLGEMEINES
  if (normalized.includes('durstlos') || normalized.includes('kein durst') || normalized.includes('durstmangel')) {
    add('begleit_durstlos', 'Begleitsymptom: Durstlosigkeit', 'begleit', 'Begleitsymptom');
  } else if (normalized.includes('großer durst') || normalized.includes('viel durst') || normalized.includes('durstig') || normalized.includes('durst auf kaltes')) {
    add('begleit_durst', 'Begleitsymptom: Starker Durst', 'begleit', 'Begleitsymptom');
  }

  if (normalized.includes('schüttelfrost') || normalized.includes('frösteln') || normalized.includes('kälteschauer') || normalized.includes('frostig') || normalized.includes('mangel an lebenswärme')) {
    add('begleit_frost', 'Begleitsymptom: Frösteln & Frostigkeit', 'begleit', 'Begleitsymptom');
  }
  if (normalized.includes('schweiß') || normalized.includes('schwitzen') || normalized.includes('schweiss') || normalized.includes('nachtschweiß')) {
    add('begleit_schweiss', 'Begleitsymptom: Schweißneigung', 'begleit', 'Begleitsymptom');
  }
  if (normalized.includes('rotes gesicht') || normalized.includes('heißer kopf') || normalized.includes('glühendes gesicht') || normalized.includes('roter kopf')) {
    add('begleit_rotes_gesicht', 'Begleitsymptom: Rotes, heißes Gesicht', 'begleit', 'Begleitsymptom');
  }

  // 6. GEMÜT & PSYCHE
  if (normalized.includes('unruhe') || normalized.includes('unruhig') || normalized.includes('wälzen') || normalized.includes('panisch') || normalized.includes('todesangst')) {
    add('gemuet_unruhe', 'Gemüt: Ängstliche Unruhe', 'gemuet', 'Gemüt');
  }
  if (normalized.includes('reizbar') || normalized.includes('wütend') || normalized.includes('schimpfen') || normalized.includes('unleidlich') || normalized.includes('ärgerlich')) {
    add('gemuet_reizbar', 'Gemüt: Ausgeprägte Reizbarkeit', 'gemuet', 'Gemüt');
  }
  if (normalized.includes('weinerlich') || normalized.includes('getröstet') || normalized.includes('trost') || normalized.includes('anhänglich')) {
    add('gemuet_weinerlich', 'Gemüt: Weinerlich / Trostbedürftig', 'gemuet', 'Gemüt');
  }
  if (normalized.includes('apathisch') || normalized.includes('teilnahmslos') || normalized.includes('schläfrig') || normalized.includes('stumpf')) {
    add('gemuet_apathisch', 'Gemüt: Apathie / Schwäche', 'gemuet', 'Gemüt');
  }

  // 7. DYNAMISCHE MULTI-SYMPTOM-SEGMENTIERUNG:
  // Trenne den Text an Satz- und Aufzählungszeichen (Komma, Semikolon, Punkt, Zeilenumbruch, Aufzählungspunkte, "und", "sowie", "zudem", "dazu")
  // Erfasse auch individuell geschilderte Symptome, die nicht durch obige Schlüsselwörter abgedeckt sind.
  const rawSegments = text
    .split(/[,;\n•\/\-–]+|\s+und\s+|\s+sowie\s+|\s+zudem\s+|\s+dazu\s+|\s+auch\s+/i)
    .map(s => s.trim())
    .filter(s => {
      if (s.length < 3) return false;
      const clean = s.toLowerCase();
      // Filter filler words
      if (/^(ich|habe|bin|da|dann|ein|eine|eines|einer|der|die|das|dem|den|des|sehr|stark|etwas|patient|berichtet|klagt|seit|gestern|heute)$/i.test(clean)) {
        return false;
      }
      // Check if this segment was already largely covered by an existing extracted symptom label
      const alreadyCaptured = symptoms.some(sym => {
        const symLow = sym.label.toLowerCase();
        return symLow.includes(clean) || clean.includes(symLow.slice(0, Math.min(symLow.length, 12)));
      });
      return !alreadyCaptured;
    });

  // Add up to 6 custom extracted segments so no patient complaint is lost
  rawSegments.slice(0, 6).forEach((seg, idx) => {
    const clean = seg.charAt(0).toUpperCase() + seg.slice(1);
    // Categorize segment heuristically
    const segLow = seg.toLowerCase();
    let cat: RecognizedSymptom['category'] = 'leit';
    let catLabel = 'Leitsymptom';

    if (segLow.includes('besser') || segLow.includes('schlechter') || segLow.includes('durch') || segLow.includes('bei ')) {
      cat = 'modalitaet';
      catLabel = 'Modalität';
    } else if (segLow.includes('nach ') || segLow.includes('infolge') || segLow.includes('auslöser') || segLow.includes('wegen')) {
      cat = 'causa';
      catLabel = 'Causa';
    } else if (segLow.includes('wie ') || segLow.includes('gefühl') || segLow.includes('schmerz')) {
      cat = 'empfindung';
      catLabel = 'Empfindung';
    } else if (symptoms.length > 0) {
      cat = 'begleit';
      catLabel = 'Begleitsymptom';
    }

    add(`sym_dyn_${idx}_${seg.slice(0, 10).replace(/[^a-zA-Z0-9]/g, '')}`, clean, cat, catLabel);
  });

  return symptoms;
}
