import { LanguageCode } from '../types';

// In-memory cache for translated monographs
const translationCache = new Map<string, string>();

// Local storage key for persistent client cache
const CLIENT_TRANSLATION_STORAGE_KEY = 'homoeo_med_translations_v1';

function getStoredCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CLIENT_TRANSLATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToStoredCache(key: string, value: string) {
  try {
    const cache = getStoredCache();
    cache[key] = value;
    localStorage.setItem(CLIENT_TRANSLATION_STORAGE_KEY, JSON.stringify(cache));
  } catch {}
}

export interface SectionHeaders {
  introTemplate: (name: string, active: string) => string;
  sec1: string;
  sec2: string;
  sec3: string;
  sec4: string;
  sec5: string;
  belongsToGroup: string;
  mainActive: string;
  dosageForms: string;
  excipients: string;
  dosagePrinciple: (name: string, active: string) => string;
  availableDosages: string;
  intakeRecommendation: string;
  elderlyWarning: string;
  frequencyVeryCommon: string;
  frequencyCommon: string;
  frequencyUncommon: string;
  frequencyRare: string;
  frequencyVeryRare: string;
  commonSideEffects: string;
  specialRisks: string;
  contraindicationsIntro: (name: string) => string;
  absoluteContraindications: string;
  relativeContraindications: string;
  officialContraindications: string;
  noContraindications: string;
  interactionsIntro: (name: string) => string;
  observeConcomitant: string;
  avoidAlcohol: string;
  noInteractions: string;
}

export const MONOGRAPH_SECTIONS_I18N: Record<LanguageCode, SectionHeaders> = {
  de: {
    introTemplate: (name, active) =>
      `Hier ist die komplette Übersicht zu ${name} (${active}) mit allen wichtigen Informationen zu Inhaltsstoffen, Dosierung, Nebenwirkungen, Kontraindikationen und Wechselwirkungen, übersichtlich für dich zusammengefasst.`,
    sec1: '📝 1. Wirkstoff und Inhaltsstoffe',
    sec2: '💊 2. Dosierung & Anwendung',
    sec3: '⚠️ 3. Nebenwirkungen',
    sec4: '🚫 4. Kontraindikationen (Gegenanzeigen)',
    sec5: '❌ 5. Gefährliche Wechselwirkungen',
    belongsToGroup: 'gehört zur Wirkstoffgruppe:',
    mainActive: 'Hauptwirkstoff:',
    dosageForms: 'Darreichungsformen:',
    excipients: 'Hilfsstoffe sind der jeweiligen herstellerspezifischen Packungsbeilage zu entnehmen.',
    dosagePrinciple: (name, active) =>
      `Die Dosierung von ${name} (${active}) wird von der behandelnden Ärztin oder dem Arzt streng individuell festgelegt. Es gilt der Grundsatz, das Medikament so niedrig dosiert und so kurz bzw. indikationsgerecht wie möglich anzuwenden, um Risiken zu minimieren.`,
    availableDosages: 'Verfügbare Dosierungsstärken:',
    intakeRecommendation: 'Einnahmeempfehlung:',
    elderlyWarning:
      'Ältere oder geschwächte Patienten: Bei älteren Personen oder Personen mit eingeschränkter Organfunktion (insb. Leber/Niere) ist eine engmaschige Dosisanpassung nach ärztlicher Rücksprache essenziell.',
    frequencyVeryCommon: 'Sehr häufig (≥ 1/10):',
    frequencyCommon: 'Häufig (≥ 1/100 bis < 1/10):',
    frequencyUncommon: 'Gelegentlich (≥ 1/1.000 bis < 1/100):',
    frequencyRare: 'Selten (≥ 1/10.000 bis < 1/1.000):',
    frequencyVeryRare: 'Sehr selten (< 1/10.000):',
    commonSideEffects: 'Häufige Begleiterscheinungen:',
    specialRisks: 'Besondere Risiken & Warnhinweise:',
    contraindicationsIntro: (name) =>
      `Unter bestimmten gesundheitlichen Bedingungen darf ${name} entweder gar nicht oder nur nach strenger ärztlicher Nutzen-Risiko-Abwägung angewendet werden.`,
    absoluteContraindications: 'Absolute Gegenanzeigen (Anwendung ausgeschlossen):',
    relativeContraindications: 'Relative Gegenanzeigen (Besondere Vorsicht erforderlich):',
    officialContraindications: 'Behördliche Gegenanzeigen & Vorsichtsmaßnahmen:',
    noContraindications: 'Keine gesonderten behördlichen Gegenanzeigen in den Daten hinterlegt.',
    interactionsIntro: (name) =>
      `Die Kombination von ${name} mit bestimmten anderen Substanzen kann die Wirkung unvorhersehbar verändern oder unerwünschte Reaktionen hervorrufen.`,
    observeConcomitant: 'Wechselwirkungen mit Begleitmedikation beachten.',
    avoidAlcohol: 'Alkohol meiden.',
    noInteractions: 'Keine spezifischen Wechselwirkungen in den behördlichen Daten hinterlegt.'
  },
  el: {
    introTemplate: (name, active) =>
      `Εδώ είναι η πλήρης επίσημη επισκόπηση για το ${name} (${active}) με όλες τις σημαντικές πληροφορίες σχετικά με τα συστατικά, τη δοσολογία, τις ανεπιθύμητες ενέργειες, τις αντενδείξεις και τις αλληλεπιδράσεις, συγκεντρωμένες συνοπτικά για εσάς.`,
    sec1: '📝 1. Δραστική ουσία και συστατικά',
    sec2: '💊 2. Δοσολογία & Χορήγηση',
    sec3: '⚠️ 3. Ανεπιθύμητες ενέργειες (Παρενέργειες)',
    sec4: '🚫 4. Αντενδείξεις',
    sec5: '❌ 5. Επικίνδυνες αλληλεπιδράσεις',
    belongsToGroup: 'ανήκει στην κατηγορία δραστικών ουσιών:',
    mainActive: 'Κύρια δραστική ουσία:',
    dosageForms: 'Μορφές χορήγησης:',
    excipients: 'Τα έκδοχα αναφέρονται στο αντίστοιχο φύλλο οδηγιών χρήσης του κατασκευαστή.',
    dosagePrinciple: (name, active) =>
      `Η δοσολογία του ${name} (${active}) καθορίζεται αυστηρά εξατομικευμένα από τον θεράποντα ιατρό. Ισχύει η βασική αρχή της χορήγησης της χαμηλότερης δυνατής αποτελεσματικής δόσης για το συντομότερο απαραίτητο διάστημα προς ελαχιστοποίηση των κινδύνων.`,
    availableDosages: 'Διαθέσιμες περιεκτικότητες δόσης:',
    intakeRecommendation: 'Σύσταση λήψης:',
    elderlyWarning:
      'Ηλικιωμένοι ή εξασθενημένοι ασθενείς: Σε ηλικιωμένους ή άτομα με μειωμένη ηπατική ή νεφρική λειτουργία, είναι απαραίτητη η στενή προσαρμογή της δόσης κατόπιν ιατρικής συνεννόησης.',
    frequencyVeryCommon: 'Πολύ συχνές (≥ 1/10):',
    frequencyCommon: 'Συχνές (≥ 1/100 έως < 1/10):',
    frequencyUncommon: 'Όχι συχνές (≥ 1/1.000 έως < 1/100):',
    frequencyRare: 'Σπάνιες (≥ 1/10.000 έως < 1/1.000):',
    frequencyVeryRare: 'Πολύ σπάνιες (< 1/10.000):',
    commonSideEffects: 'Συχνές εκδηλώσεις:',
    specialRisks: 'Ειδικοί κίνδυνοι & προειδοποιήσεις:',
    contraindicationsIntro: (name) =>
      `Υπό ορισμένες καταστάσεις υγείας, το ${name} είτε δεν επιτρέπεται να χρησιμοποιηθεί καθόλου είτε μόνο μετά από αυστηρή ιατρική εκτίμηση οφέλους-κινδύνου.`,
    absoluteContraindications: 'Απόλυτες αντενδείξεις (αποκλείεται η χρήση):',
    relativeContraindications: 'Σχετικές αντενδείξεις (απαιτείται ιδιαίτερη προσοχή):',
    officialContraindications: 'Επίσημες αντενδείξεις & μέτρα προφύλαξης:',
    noContraindications: 'Δεν υπάρχουν ειδικές επίσημες αντενδείξεις καταγεγραμμένες στα συνοπτικά δεδομένα.',
    interactionsIntro: (name) =>
      `Ο συνδυασμός του ${name} με ορισμένες άλλες ουσίες μπορεί να μεταβάλει απρόβλεπτα τη δράση ή να προκαλέσει ανεπιθύμητες αντιδράσεις.`,
    observeConcomitant: 'Προσοχή στις αλληλεπιδράσεις με τη συγχορηγούμενη φαρμακευτική αγωγή.',
    avoidAlcohol: 'Αποφύγετε την ταυτόχρονη κατανάλωση αλκοόλ.',
    noInteractions: 'Δεν έχουν καταχωρηθεί συγκεκριμένες αλληλεπιδράσεις στα επίσημα συνοπτικά στοιχεία.'
  },
  en: {
    introTemplate: (name, active) =>
      `Here is the complete official overview for ${name} (${active}) with all key information on ingredients, dosage, side effects, contraindications, and interactions, clearly summarized for you.`,
    sec1: '📝 1. Active Substance and Ingredients',
    sec2: '💊 2. Dosage & Administration',
    sec3: '⚠️ 3. Side Effects',
    sec4: '🚫 4. Contraindications',
    sec5: '❌ 5. Dangerous Interactions',
    belongsToGroup: 'belongs to the active substance group:',
    mainActive: 'Main active substance:',
    dosageForms: 'Dosage forms:',
    excipients: 'Excipients are listed in the respective manufacturer package leaflet.',
    dosagePrinciple: (name, active) =>
      `The dosage of ${name} (${active}) is determined strictly on an individual basis by the attending physician. The guiding rule is to administer the lowest effective dose for the shortest possible duration to minimize risks.`,
    availableDosages: 'Available dosage strengths:',
    intakeRecommendation: 'Administration recommendation:',
    elderlyWarning:
      'Elderly or debilitated patients: In elderly individuals or patients with impaired liver/kidney function, close dose adjustment following medical consultation is essential.',
    frequencyVeryCommon: 'Very common (≥ 1/10):',
    frequencyCommon: 'Common (≥ 1/100 to < 1/10):',
    frequencyUncommon: 'Uncommon (≥ 1/1,000 to < 1/100):',
    frequencyRare: 'Rare (≥ 1/10,000 to < 1/1,000):',
    frequencyVeryRare: 'Very rare (< 1/10,000):',
    commonSideEffects: 'Common side effects:',
    specialRisks: 'Special risks & warnings:',
    contraindicationsIntro: (name) =>
      `Under certain medical conditions, ${name} must either not be used at all or only after strict medical risk-benefit assessment.`,
    absoluteContraindications: 'Absolute contraindications (use excluded):',
    relativeContraindications: 'Relative contraindications (special caution required):',
    officialContraindications: 'Official contraindications & precautions:',
    noContraindications: 'No specific contraindications recorded in the summary dataset.',
    interactionsIntro: (name) =>
      `Combining ${name} with certain other substances may unpredictably alter efficacy or cause adverse reactions.`,
    observeConcomitant: 'Pay close attention to interactions with concomitant medications.',
    avoidAlcohol: 'Avoid alcohol.',
    noInteractions: 'No specific interactions recorded in the official dataset.'
  },
  es: {
    introTemplate: (name, active) =>
      `Aquí está el resumen oficial completo de ${name} (${active}) con toda la información clave sobre principios activos, posología, efectos adversos, contraindicaciones e interacciones, resumido para usted.`,
    sec1: '📝 1. Principio activo e ingredientes',
    sec2: '💊 2. Posología y forma de administración',
    sec3: '⚠️ 3. Efectos adversos',
    sec4: '🚫 4. Contraindicaciones',
    sec5: '❌ 5. Interacciones peligrosas',
    belongsToGroup: 'pertenece al grupo de principios activos:',
    mainActive: 'Principio activo principal:',
    dosageForms: 'Formas farmacéuticas:',
    excipients: 'Los excipientes se indican en el prospecto del fabricante respectivo.',
    dosagePrinciple: (name, active) =>
      `La dosificación de ${name} (${active}) la determina de forma estrictamente individual el médico tratante. Se aplica el principio de utilizar la dosis más baja y durante el menor tiempo posible para reducir riesgos.`,
    availableDosages: 'Concentraciones disponibles:',
    intakeRecommendation: 'Recomendación de toma:',
    elderlyWarning:
      'Pacientes de edad avanzada o debilitados: En personas mayores o con función hepática/renal comprometida, es indispensable un ajuste minucioso de la dosis tras consulta médica.',
    frequencyVeryCommon: 'Muy frecuentes (≥ 1/10):',
    frequencyCommon: 'Frecuentes (≥ 1/100 a < 1/10):',
    frequencyUncommon: 'Poco frecuentes (≥ 1/1.000 a < 1/100):',
    frequencyRare: 'Raras (≥ 1/10.000 a < 1/1.000):',
    frequencyVeryRare: 'Muy raras (< 1/10.000):',
    commonSideEffects: 'Efectos secundarios comunes:',
    specialRisks: 'Riesgos especiales y advertencias:',
    contraindicationsIntro: (name) =>
      `Bajo ciertas condiciones médicas, ${name} no debe utilizarse o solo tras una rigurosa evaluación médica del balance beneficio-riesgo.`,
    absoluteContraindications: 'Contraindicaciones absolutas (uso excluido):',
    relativeContraindications: 'Contraindicaciones relativas (se requiere precaución especial):',
    officialContraindications: 'Contraindicaciones y precauciones oficiales:',
    noContraindications: 'No hay contraindicaciones específicas en los datos resumidos.',
    interactionsIntro: (name) =>
      `La combinación de ${name} con ciertas sustancias puede alterar imprevisiblemente su efecto o causar reacciones adversas.`,
    observeConcomitant: 'Tenga en cuenta las interacciones con la medicación concomitante.',
    avoidAlcohol: 'Evite el consumo de alcohol.',
    noInteractions: 'No hay interacciones específicas registradas en los datos oficiales.'
  },
  fr: {
    introTemplate: (name, active) =>
      `Voici la vue d'ensemble officielle complète de ${name} (${active}) avec toutes les informations clés sur les composants, la posologie, les effets indésirables, les contre-indications et les interactions.`,
    sec1: '📝 1. Principe actif et composants',
    sec2: "💊 2. Posologie et mode d'administration",
    sec3: '⚠️ 3. Effets indésirables',
    sec4: '🚫 4. Contre-indications',
    sec5: '❌ 5. Interactions dangereuses',
    belongsToGroup: 'appartient à la classe pharmacologique :',
    mainActive: 'Principe actif principal :',
    dosageForms: "Formes d'administration :",
    excipients: 'Les excipients figurent dans la notice spécifique du fabricant.',
    dosagePrinciple: (name, active) =>
      `La posologie de ${name} (${active}) est fixée de manière strictement individuelle par le médecin traitant. Le principe est d'utiliser la dose la plus faible possible pendant la durée la plus courte pour minimiser les risques.`,
    availableDosages: 'Dosages disponibles :',
    intakeRecommendation: 'Recommandation de prise :',
    elderlyWarning:
      'Patients âgés ou affaiblis : Chez les personnes âgées ou souffrant de troubles hépatiques/rénaux, un ajustement posologique étroit après avis médical est essentiel.',
    frequencyVeryCommon: 'Très fréquent (≥ 1/10) :',
    frequencyCommon: 'Fréquent (≥ 1/100 à < 1/10) :',
    frequencyUncommon: 'Peu fréquent (≥ 1/1 000 à < 1/100) :',
    frequencyRare: 'Rare (≥ 1/10 000 à < 1/1 000) :',
    frequencyVeryRare: 'Très rare (< 1/10 000) :',
    commonSideEffects: 'Manifestations fréquentes :',
    specialRisks: 'Risques particuliers et mises en garde :',
    contraindicationsIntro: (name) =>
      `Dans certaines conditions cliniques, ${name} ne doit pas être utilisé ou seulement après une stricte évaluation médicale du rapport bénéfice/risque.`,
    absoluteContraindications: 'Contre-indications absolues (utilisation exclue) :',
    relativeContraindications: 'Contre-indications relatives (prudence particulière requise) :',
    officialContraindications: 'Contre-indications et précautions officielles :',
    noContraindications: 'Aucune contre-indication particulière enregistrée.',
    interactionsIntro: (name) =>
      `L'association de ${name} avec certaines autres substances peut modifier l'effet de façon imprévisible ou provoquer des réactions indésirables.`,
    observeConcomitant: 'Surveiller les interactions avec les traitements concomitants.',
    avoidAlcohol: "Éviter l'alcool.",
    noInteractions: 'Aucune interaction spécifique répertoriée dans les données officielles.'
  },
  it: {
    introTemplate: (name, active) =>
      `Ecco la panoramica ufficiale completa di ${name} (${active}) con tutte le informazioni essenziali su principi attivi, posologia, effetti indesiderati, controindicazioni e interazioni.`,
    sec1: '📝 1. Principio attivo e ingredienti',
    sec2: "💊 2. Posologia e modalità d'uso",
    sec3: '⚠️ 3. Effetti indesiderati',
    sec4: '🚫 4. Controindicazioni',
    sec5: '❌ 5. Interazioni pericolose',
    belongsToGroup: 'appartiene alla classe terapeutica:',
    mainActive: 'Principio attivo principale:',
    dosageForms: 'Forme farmaceutiche:',
    excipients: 'Gli eccipienti sono indicati nel relativo foglio illustrativo del produttore.',
    dosagePrinciple: (name, active) =>
      `Il dosaggio di ${name} (${active}) viene stabilito in modo strettamente individuale dal medico curante. Si applica la regola di utilizzare la dose minima efficace per la durata più breve possibile.`,
    availableDosages: 'Dosaggi disponibili:',
    intakeRecommendation: 'Modalità di assunzione:',
    elderlyWarning:
      'Pazienti anziani o debilitati: Negli anziani o in pazienti con ridotta funzionalità epatica o renale, è essenziale un attento aggiustamento della dose dopo consulto medico.',
    frequencyVeryCommon: 'Molto comune (≥ 1/10):',
    frequencyCommon: 'Comune (da ≥ 1/100 a < 1/10):',
    frequencyUncommon: 'Non comune (da ≥ 1/1.000 a < 1/100):',
    frequencyRare: 'Raro (da ≥ 1/10.000 a < 1/1.000):',
    frequencyVeryRare: 'Molto raro (< 1/10.000):',
    commonSideEffects: 'Effetti collaterali comuni:',
    specialRisks: 'Rischi particolari e avvertenze:',
    contraindicationsIntro: (name) =>
      `In determinate condizioni di salute, ${name} non deve essere utilizzato affatto o solo dopo una rigorosa valutazione medica del rapporto rischio-beneficio.`,
    absoluteContraindications: 'Controindicazioni assolute (uso escluso):',
    relativeContraindications: 'Contreindicazioni relative (richiesta particolare cautela):',
    officialContraindications: 'Controindicazioni e precauzioni ufficiali:',
    noContraindications: 'Nessuna controindicazione specifica annotata.',
    interactionsIntro: (name) =>
      `L'associazione di ${name} con determinate altre sostanze può alterare in modo imprevedibile l'efficacia o provocare reazioni avverse.`,
    observeConcomitant: 'Prestare attenzione alle interazioni con farmaci concomitanti.',
    avoidAlcohol: "Evitare l'alcol.",
    noInteractions: 'Nessuna interazione specifica riportata nei dati ufficiali.'
  },
  ru: {
    introTemplate: (name, active) =>
      `Вот полный официальный обзор препарата ${name} (${active}) со всей ключевой информацией о составе, дозировке, побочных эффектах, противопоказаниях и взаимодействиях, наглядно обобщенной для вас.`,
    sec1: '📝 1. Действующее вещество и состав',
    sec2: '💊 2. Дозировка и способ применения',
    sec3: '⚠️ 3. Побочные действия',
    sec4: '🚫 4. Противопоказания',
    sec5: '❌ 5. Опасные взаимодействия',
    belongsToGroup: 'относится к фармакологической группе:',
    mainActive: 'Основное действующее вещество:',
    dosageForms: 'Лекарственные формы:',
    excipients: 'Вспомогательные вещества указаны в инструкции производителя.',
    dosagePrinciple: (name, active) =>
      `Дозировка ${name} (${active}) определяется строго индивидуально лечащим врачом. Применяется принцип назначения минимальной эффективной дозы на кратчайший срок для снижения рисков.`,
    availableDosages: 'Доступные дозировки:',
    intakeRecommendation: 'Рекомендации по приему:',
    elderlyWarning:
      'Пожилые или ослабленные пациенты: У пожилых пациентов или лиц с нарушением функции печени/почек необходима тщательная коррекция дозы после консультации с врачом.',
    frequencyVeryCommon: 'Очень часто (≥ 1/10):',
    frequencyCommon: 'Часто (≥ 1/100 до < 1/10):',
    frequencyUncommon: 'Нечасто (≥ 1/1.000 до < 1/100):',
    frequencyRare: 'Редко (≥ 1/10.000 до < 1/1.000):',
    frequencyVeryRare: 'Очень редко (< 1/10.000):',
    commonSideEffects: 'Частые побочные явления:',
    specialRisks: 'Особые риски и предостережения:',
    contraindicationsIntro: (name) =>
      `При определенных состояниях здоровья ${name} либо не должен применяться вовсе, либо только после строгой врачебной оценки пользы и риска.`,
    absoluteContraindications: 'Абсолютные противопоказания (применение исключено):',
    relativeContraindications: 'Относительные противопоказания (требуется особая осторожность):',
    officialContraindications: 'Официальные противопоказания и меры предосторожности:',
    noContraindications: 'В кратких официальных данных особых противопоказаний не указано.',
    interactionsIntro: (name) =>
      `Сочетание ${name} с определенными другими веществами может непредсказуемо изменить действие или вызвать нежелательные реакции.`,
    observeConcomitant: 'Учитывать взаимодействия с сопутствующими лекарственными средствами.',
    avoidAlcohol: 'Избегать употребления алкоголя.',
    noInteractions: 'Специфических взаимодействий в официальных данных не указано.'
  }
};

// Common medical terms dictionary for instantaneous, zero-delay rendering in any language
const CLINICAL_PHRASES: Record<string, Record<LanguageCode, string>> = {
  // Lorazepam / Tavor specific terms
  'Benzodiazepin (Anxiolytikum / Beruhigungsmittel)': {
    de: 'Benzodiazepin (Anxiolytikum / Beruhigungsmittel)',
    el: 'Βενζοδιαζεπίνη (Αγχολυτικό / Ηρεμιστικό)',
    en: 'Benzodiazepine (Anxiolytic / Sedative)',
    es: 'Benzodiazepina (Ansiolítico / Sedante)',
    fr: 'Benzodiazépine (Anxiolytique / Sédatif)',
    it: 'Benzodiazepina (Ansiolitico / Sedativo)',
    ru: 'Бензодиазепин (Анксиолитик / Седативное средство)'
  },
  'Tabletten, Schmelztabletten (Tavor Expidet), Injektionslösung': {
    de: 'Tabletten, Schmelztabletten (Tavor Expidet), Injektionslösung',
    el: 'Δισκία, διαλυόμενα δισκία (Tavor Expidet), ενέσιμο διάλυμα',
    en: 'Tablets, orally disintegrating tablets (Tavor Expidet), injectable solution',
    es: 'Comprimidos, comprimidos bucodispersables (Tavor Expidet), solución inyectable',
    fr: 'Comprimés, comprimés orodispersibles (Tavor Expidet), solution injectable',
    it: 'Compresse, compresse orodispersibili (Tavor Expidet), soluzione iniettabile',
    ru: 'Таблетки, диспергируемые таблетки (Тавор Экспидет), раствор для инъекций'
  },
  'Streng individuell nach ärztlicher Verordnung; so niedrig dosiert und kurz wie möglich': {
    de: 'Streng individuell nach ärztlicher Verordnung; so niedrig dosiert und kurz wie möglich',
    el: 'Αυστηρά εξατομικευμένα σύμφωνα με την ιατρική συνταγή, στη χαμηλότερη δυνατή δόση και για όσο το δυνατόν μικρότερο χρονικό διάστημα',
    en: 'Strictly individualized according to medical prescription; lowest dose and shortest duration possible',
    es: 'Estrictamente individualizado según prescripción médica; a la dosis más baja y duración más corta posible',
    fr: 'Strictement individualisé selon la prescription médicale ; à la dose la plus faible et la durée la plus courte possible',
    it: 'Strettamente individualizzato secondo prescrizione medica; al dosaggio più basso e per il minor tempo possibile',
    ru: 'Строго индивидуально по назначению врача; в минимальной дозе и на кратчайший срок'
  },
  'Müdigkeit, Schläfrigkeit, Benommenheit, verlangsamtes Reaktionsvermögen, Muskelschwäche, Gangunsicherheit (erhöhtes Sturzrisiko), Müdigkeitsgefühle am Folgetag, Anterograde Amnesie (Erinnerungslücken)': {
    de: 'Müdigkeit, Schläfrigkeit, Benommenheit, verlangsamtes Reaktionsvermögen, Muskelschwäche, Gangunsicherheit (erhöhtes Sturzrisiko), Müdigkeitsgefühle am Folgetag, Anterograde Amnesie (Erinnerungslücken)',
    el: 'Κόπωση, υπνηλία, ζάλη/θόλωση, επιβράδυνση αντανακλαστικών, μυϊκή αδυναμία, αστάθεια βάδισης (αυξημένος κίνδυνος πτώσης), αίσθημα κόπωσης την επόμενη ημέρα, προσθιόδρομη αμνησία (κενά μνήμης)',
    en: 'Fatigue, somnolence, drowsiness, slowed reaction time, muscle weakness, gait unsteadiness (increased fall risk), next-day fatigue, anterograde amnesia (memory lapses)',
    es: 'Fatiga, somnolencia, mareo/aturdimiento, reflejos lentos, debilidad muscular, inestabilidad en la marcha (mayor riesgo de caídas), fatiga al día siguiente, amnesia anterógrada',
    fr: 'Fatigue, somnolence, étourdissements, ralentissement des réflexes, faiblesse musculaire, démarche instable (risque accru de chutes), somnolence résiduelle, amnésie antérograde',
    it: 'Stanchezza, sonnolenza, stordimento, riflessi rallentati, debolezza muscolare, andatura instabile (aumentato rischio di cadute), sonnolenza al risveglio, amnesia anterograda',
    ru: 'Усталость, сонливость, головокружение, замедление реакций, мышечная слабость, неустойчивость походки (риск падений), седация на следующий день, антероградная амнезия'
  },
  'Paradoxe Reaktionen (Unruhe, Reizbarkeit, Aggressivität), Absetzerscheinungen bei abruptem Absetzen': {
    de: 'Paradoxe Reaktionen (Unruhe, Reizbarkeit, Aggressivität), Absetzerscheinungen bei abruptem Absetzen',
    el: 'Παράδοξες αντιδράσεις (ανησυχία, ευερεθιστότητα, επιθετικότητα), συμπτώματα στέρησης σε περίπτωση απότομης διακοπής',
    en: 'Paradoxical reactions (restlessness, irritability, aggressiveness), withdrawal symptoms upon abrupt discontinuation',
    es: 'Reacciones paradójicas (inquietud, irritabilidad, agresividad), síntomas de abstinencia ante la interrupción brusca',
    fr: 'Réactions paradoxales (agitation, irritabilité, agressivité), syndrome de sevrage en cas d’arrêt brutal',
    it: 'Reazioni paradosse (irrequietezza, irritabilità, aggressività), sintomi da astinenza in caso di interruzione brusca',
    ru: 'Парадоксальные реакции (беспокойство, раздражительность, агрессивность), синдром отмены при резком прекращении приема'
  },
  'Gefahr von Abhängigkeit und Toleranzentwicklung bereits nach wenigen Wochen. Nicht plötzlich absetzen, sondern ausschleichend reduzieren. Fahrtüchtigkeit und das Bedienen von Maschinen werden erheblich beeinträchtigt.': {
    de: 'Gefahr von Abhängigkeit und Toleranzentwicklung bereits nach wenigen Wochen. Nicht plötzlich absetzen, sondern ausschleichend reduzieren. Fahrtüchtigkeit und das Bedienen von Maschinen werden erheblich beeinträchtigt.',
    el: 'Κίνδυνος εξάρτησης και ανάπτυξης ανοχής ήδη μετά από λίγες εβδομάδες. Μην διακόπτετε απότομα, αλλά με σταδιακή μείωση (tapering). Η ικανότητα οδήγησης και χειρισμού μηχανημάτων επηρεάζεται σημαντικά.',
    en: 'Risk of physical and psychological dependence and tolerance development even after a few weeks. Do not stop abruptly; taper off gradually. Ability to drive or operate machinery is significantly impaired.',
    es: 'Riesgo de dependencia y tolerancia ya tras pocas semanas. No suspender bruscamente, sino de forma gradual. La capacidad para conducir y utilizar maquinaria se ve gravemente afectada.',
    fr: "Risque de dépendance et de tolérance dès quelques semaines d'utilisation. Ne pas arrêter brusquement, procéder par réduction progressive. L'aptitude à conduire et à utiliser des machines est fortement altérée.",
    it: 'Rischio di dipendenza e tolleranza già dopo poche settimane. Non interrompere bruscamente, ma ridurre gradualmente. La capacità di guidare e usare macchinari è significativamente compromessa.',
    ru: 'Риск зависимости и развития толерантности уже через несколько недель. Не отменять резко, снижать дозу постепенно. Способность управлять автомобилем и механизмами существенно нарушается.'
  },
  'Myasthenia gravis, schwere Ateminsuffizienz, Schlafapnoe-Syndrom, schwere Leberinsuffizienz, Überempfindlichkeit gegen Benzodiazepine, akute Vergiftung mit Alkohol oder ZNS-Dämpfern': {
    de: 'Myasthenia gravis, schwere Ateminsuffizienz, Schlafapnoe-Syndrom, schwere Leberinsuffizienz, Überempfindlichkeit gegen Benzodiazepine, akute Vergiftung mit Alkohol oder ZNS-Dämpfern',
    el: 'Βαριά μυασθένεια (Myasthenia gravis), σοβαρή αναπνευστική ανεπάρκεια, σύνδρομο υπνικής άπνοιας, σοβαρή ηπατική ανεπάρκεια, υπερευαισθησία στις βενζοδιαζεπίνες, οξεία δηλητηρίαση από αλκοόλ ή κατασταλτικά του ΚΝΣ',
    en: 'Myasthenia gravis, severe respiratory failure, sleep apnea syndrome, severe hepatic impairment, hypersensitivity to benzodiazepines, acute poisoning with alcohol or CNS depressants',
    es: 'Miastenia gravis, insuficiencia respiratoria grave, síndrome de apnea del sueño, insuficiencia hepática grave, hipersensibilidad a las benzodiazepinas, intoxicación aguda por alcohol o depresores del SNC',
    fr: 'Myasthénie grave, insuffisance respiratoire sévère, syndrome d’apnée du sommeil, insuffisance hépatique sévère, hypersensibilité aux benzodiazépines, intoxication aiguë par l’alcool ou sédatifs du SNC',
    it: 'Miastenia gravis, grave insufficienza respiratoria, sindrome delle apnee notturne, grave insufficienza epatica, ipersensibilità alle benzodiazepine, intossicazione acuta da alcol o depressori del SNC',
    ru: 'Миастения гравис, тяжелая дыхательная недостаточность, синдром апноэ во сне, тяжелая печеночная недостаточность, гиперчувствительность к бензодиазепинам, острая интоксикация алкоголем или депрессантами ЦНΣ'
  },
  'Gleichzeitige Anwendung von Opioiden: Erheblich erhöhtes Risiko für schwere Sedierung, Atemdepression, Koma und Tod': {
    de: 'Gleichzeitige Anwendung von Opioiden: Erheblich erhöhtes Risiko für schwere Sedierung, Atemdepression, Koma und Tod',
    el: 'Ταυτόχρονη χρήση οπιοειδών: Σημαντικά αυξημένος κίνδυνος βαθιάς καταστολής, αναπνευστικής καταστολής, κώματος και θανάτου',
    en: 'Concomitant use of opioids: Significantly increased risk of severe sedation, respiratory depression, coma, and death',
    es: 'Uso concomitante de opioides: Riesgo significativamente mayor de sedación profunda, depresión respiratoria, coma y muerte',
    fr: 'Utilisation concomitante d’opioïdes : Risque considérablement accru de sédation profonde, dépression respiratoire, coma et décès',
    it: 'Uso concomitante di oppioidi: Rischio notevolmente aumentato di grave sedazione, depressione respiratoria, coma e morte',
    ru: 'Одновременное применение с опиоидами: Значительно повышенный риск глубокой седации, угнетения дыхания, комы и летального исхода'
  },
  'Alkohol: Verstärkt die sedierende Wirkung unvorhersehbar und gefährlich; absolutes Alkoholverbot während der Therapie': {
    de: 'Alkohol: Verstärkt die sedierende Wirkung unvorhersehbar und gefährlich; absolutes Alkoholverbot während der Therapie',
    el: 'Αλκοόλ: Ενισχύει την κατασταλτική δράση απρόβλεπτα και επικίνδυνα. Απόλυτη αποφυγή αλκοόλ κατά τη διάρκεια της θεραπείας',
    en: 'Alcohol: Potentiates sedative effects unpredictably and dangerously; complete alcohol avoidance required during therapy',
    es: 'Alcohol: Potencia el efecto sedante de forma imprevisible y peligrosa; prohibición absoluta de alcohol durante el tratamiento',
    fr: 'Alcool : Majore l’effet sédatif de façon imprévisible et dangereuse ; abstention totale d’alcool recommandée pendant le traitement',
    it: 'Alcol: Potenzia l’effetto sedativo in modo imprevedibile e pericoloso; divieto assoluto di alcolici durante la terapia',
    ru: 'Алкоголь: Непредсказуемо и опасно усиливает седативный эффект; категорический запрет алкоголя во время терапии'
  },
  'Andere ZNS-dämpfende Arzneimittel (Antipsychotika, Antidepressiva, Sedativa, Schlafmittel): Gegenseitige Wirkungsverstärkung': {
    de: 'Andere ZNS-dämpfende Arzneimittel (Antipsychotika, Antidepressiva, Sedativa, Schlafmittel): Gegenseitige Wirkungsverstärkung',
    el: 'Άλλα κατασταλτικά φάρμακα του ΚΝΣ (αντιψυχωσικά, αντικαταθλιπτικά, υπνωτικά, ηρεμιστικά): Αμοιβαία ενίσχυση της δράσης',
    en: 'Other CNS depressant drugs (antipsychotics, antidepressants, sedatives, hypnotics): Mutual potentiation of effects',
    es: 'Otros fármacos depresores del SNC (antipsicóticos, antidepresivos, sedantes, hipnóticos): Potenciación mutua del efecto',
    fr: 'Autres médicaments dépresseurs du SNC (antipsychotiques, antidépresseurs, sédatifs, hypnotiques) : Majoration réciproque des effets',
    it: 'Altri farmaci deprimenti il SNC (antipsicotici, antidepressivi, sedativi, ipnotici): Potenziamento reciproco dell’effetto',
    ru: 'Другие средства, угнетающие ЦНС (нейролептики, антидепрессанты, седативные, снотворные): Взаимное усиление действия'
  }
};

/**
 * Parses and translates a German monograph into the target language.
 * Performs fast, deterministic localization of headers, intros, frequency categories,
 * clinical phrasing, and labels, ensuring an instant, native UI experience.
 */
export function localizeMonograph(rawMonograph: string, targetLang: LanguageCode): string {
  if (!rawMonograph || !rawMonograph.trim()) return '';
  if (targetLang === 'de') return rawMonograph;

  const h = MONOGRAPH_SECTIONS_I18N[targetLang] || MONOGRAPH_SECTIONS_I18N.en;
  const lines = rawMonograph.split('\n');

  // Extract drug name and active substance from intro or first lines
  let extractedName = '';
  let extractedActive = '';

  const firstLine = lines[0]?.trim() || '';
  const matchIntro = firstLine.match(/Übersicht zu\s+([^(]+)\s*\(([^)]+)\)/i) ||
                     firstLine.match(/overview for\s+([^(]+)\s*\(([^)]+)\)/i) ||
                     firstLine.match(/επισκόπηση για το\s+([^(]+)\s*\(([^)]+)\)/i);

  if (matchIntro) {
    extractedName = matchIntro[1].trim();
    extractedActive = matchIntro[2].trim();
  }

  const translatedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      translatedLines.push('');
      continue;
    }

    // 0. Intro Line
    if (
      i === 0 ||
      trimmed.startsWith('Hier ist die komplette Übersicht') ||
      trimmed.startsWith('Here is the complete') ||
      trimmed.startsWith('Εδώ είναι η πλήρης') ||
      trimmed.startsWith('Aquí está el resumen') ||
      trimmed.startsWith('Voici la vue') ||
      trimmed.startsWith('Ecco la panoramica') ||
      trimmed.startsWith('Вот полный обзор')
    ) {
      const name = extractedName || 'dem Präparat';
      const active = extractedActive || name;
      translatedLines.push(h.introTemplate(name, active));
      continue;
    }

    // 1. Section Headers
    if (trimmed.startsWith('📝') || trimmed.includes('1. Wirkstoff') || trimmed.includes('1. Active') || trimmed.includes('1. Δραστική')) {
      translatedLines.push(h.sec1);
      continue;
    }
    if (trimmed.startsWith('💊') || trimmed.includes('2. Dosierung') || trimmed.includes('2. Dosage') || trimmed.includes('2. Δοσολογία')) {
      translatedLines.push(h.sec2);
      continue;
    }
    if (trimmed.startsWith('⚠️') || trimmed.includes('3. Nebenwirkungen') || trimmed.includes('3. Side Effects') || trimmed.includes('3. Ανεπιθύμητες')) {
      translatedLines.push(h.sec3);
      continue;
    }
    if (trimmed.startsWith('🚫') || trimmed.includes('4. Kontraindikationen') || trimmed.includes('4. Contraindications') || trimmed.includes('4. Αντενδείξεις')) {
      translatedLines.push(h.sec4);
      continue;
    }
    if (trimmed.startsWith('❌') || trimmed.includes('5. Gefährliche') || trimmed.includes('5. Dangerous') || trimmed.includes('5. Επικίνδυνες')) {
      translatedLines.push(h.sec5);
      continue;
    }

    // Check direct clinical dictionary matches
    let processedLine = trimmed;
    for (const [germanKey, translations] of Object.entries(CLINICAL_PHRASES)) {
      if (processedLine.includes(germanKey)) {
        const replacement = translations[targetLang] || translations.en;
        processedLine = processedLine.replace(germanKey, replacement);
      }
    }

    // 2. Specific Line Transformations & Label Replacements
    // Belongs to drug group
    if (processedLine.includes('gehört zur Wirkstoffgruppe:') || processedLine.includes('gehört zur Gruppe:')) {
      processedLine = processedLine
        .replace('gehört zur Wirkstoffgruppe:', h.belongsToGroup)
        .replace('gehört zur Gruppe:', h.belongsToGroup);
    }

    if (processedLine.startsWith('Hauptwirkstoff:')) {
      processedLine = processedLine.replace('Hauptwirkstoff:', h.mainActive);
    }

    if (processedLine.startsWith('Darreichungsformen:')) {
      processedLine = processedLine
        .replace('Darreichungsformen:', h.dosageForms)
        .replace('Hilfsstoffe sind der jeweiligen herstellerspezifischen Packungsbeilage zu entnehmen.', h.excipients);
    }

    // Dosage principle
    if (processedLine.includes('wird von der behandelnden Ärztin oder dem Arzt streng individuell festgelegt')) {
      const name = extractedName || 'dem Präparat';
      const active = extractedActive || name;
      processedLine = h.dosagePrinciple(name, active);
    }

    if (processedLine.startsWith('Verfügbare Dosierungsstärken:')) {
      processedLine = processedLine.replace('Verfügbare Dosierungsstärken:', h.availableDosages);
    }

    if (processedLine.startsWith('Einnahmeempfehlung:')) {
      processedLine = processedLine.replace('Einnahmeempfehlung:', h.intakeRecommendation);
    }

    if (processedLine.includes('Ältere oder geschwächte Patienten:')) {
      processedLine = h.elderlyWarning;
    }

    // Frequency Categories
    if (processedLine.startsWith('Sehr häufig (≥ 1/10):')) {
      processedLine = processedLine.replace('Sehr häufig (≥ 1/10):', h.frequencyVeryCommon);
    } else if (processedLine.startsWith('Häufig (≥ 1/100 bis < 1/10):')) {
      processedLine = processedLine.replace('Häufig (≥ 1/100 bis < 1/10):', h.frequencyCommon);
    } else if (processedLine.startsWith('Gelegentlich (≥ 1/1.000 bis < 1/100):')) {
      processedLine = processedLine.replace('Gelegentlich (≥ 1/1.000 bis < 1/100):', h.frequencyUncommon);
    } else if (processedLine.startsWith('Selten (≥ 1/10.000 bis < 1/1.000):')) {
      processedLine = processedLine.replace('Selten (≥ 1/10.000 bis < 1/1.000):', h.frequencyRare);
    } else if (processedLine.startsWith('Sehr selten (< 1/10.000):')) {
      processedLine = processedLine.replace('Sehr selten (< 1/10.000):', h.frequencyVeryRare);
    } else if (processedLine.startsWith('Häufige Begleiterscheinungen:')) {
      processedLine = processedLine.replace('Häufige Begleiterscheinungen:', h.commonSideEffects);
    }

    if (processedLine.startsWith('Besondere Risiken & Warnhinweise:') || processedLine.startsWith('Besondere Risiken:')) {
      processedLine = processedLine
        .replace('Besondere Risiken & Warnhinweise:', h.specialRisks)
        .replace('Besondere Risiken:', h.specialRisks);
    }

    // Contraindications Section
    if (processedLine.includes('Unter bestimmten gesundheitlichen Bedingungen darf')) {
      const name = extractedName || 'dem Präparat';
      processedLine = h.contraindicationsIntro(name);
    }

    if (processedLine.startsWith('Absolute Gegenanzeigen (Anwendung ausgeschlossen):')) {
      processedLine = processedLine.replace('Absolute Gegenanzeigen (Anwendung ausgeschlossen):', h.absoluteContraindications);
    }

    if (processedLine.startsWith('Relative Gegenanzeigen (Besondere Vorsicht erforderlich):')) {
      processedLine = processedLine.replace('Relative Gegenanzeigen (Besondere Vorsicht erforderlich):', h.relativeContraindications);
    }

    if (processedLine.startsWith('Behördliche Gegenanzeigen & Vorsichtsmaßnahmen:')) {
      processedLine = processedLine.replace('Behördliche Gegenanzeigen & Vorsichtsmaßnahmen:', h.officialContraindications);
    }

    // Interactions Section
    if (processedLine.includes('Die Kombination von') && processedLine.includes('mit bestimmten anderen Substanzen')) {
      const name = extractedName || 'dem Präparat';
      processedLine = h.interactionsIntro(name);
    }

    if (processedLine.includes('Wechselwirkungen mit Begleitmedikation beachten.')) {
      processedLine = processedLine.replace('Wechselwirkungen mit Begleitmedikation beachten.', h.observeConcomitant);
    }

    if (processedLine.includes('Alkohol meiden.')) {
      processedLine = processedLine.replace('Alkohol meiden.', h.avoidAlcohol);
    }

    translatedLines.push(processedLine);
  }

  return translatedLines.join('\n');
}

/**
 * Requests high-fidelity AI translation for a monograph via the backend endpoint,
 * falling back seamlessly to deterministic localization if network or AI is unavailable.
 */
export async function fetchTranslatedMonograph(
  medName: string,
  rawMonograph: string,
  targetLang: LanguageCode
): Promise<string> {
  if (!rawMonograph || !rawMonograph.trim()) return '';
  if (targetLang === 'de') return rawMonograph;

  const cacheKey = `${medName.toLowerCase().trim()}_${targetLang}`;

  // 1. Check in-memory map
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // 2. Check local client persistent storage
  const stored = getStoredCache();
  if (stored[cacheKey]) {
    translationCache.set(cacheKey, stored[cacheKey]);
    return stored[cacheKey];
  }

  // 3. Request server-side AI translation
  try {
    const res = await fetch('/api/medications/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: rawMonograph,
        targetLang,
        medName
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.translatedText && typeof data.translatedText === 'string' && data.translatedText.trim().length > 50) {
        const fullTranslation = data.translatedText.trim();
        translationCache.set(cacheKey, fullTranslation);
        saveToStoredCache(cacheKey, fullTranslation);
        return fullTranslation;
      }
    }
  } catch (err) {
    console.warn('[MedicationLocalization] Translation API error:', err);
  }

  // 4. Instant deterministic localization fallback
  const localizedFallback = localizeMonograph(rawMonograph, targetLang);
  translationCache.set(cacheKey, localizedFallback);
  saveToStoredCache(cacheKey, localizedFallback);
  return localizedFallback;
}
