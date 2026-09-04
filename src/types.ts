export type UserRole = 'therapist' | 'admin' | 'guest';

export type TariffType = 'free_trial' | 'pro_unlimited' | string;

export type TariffBillingPeriod = 'free' | 'one_time' | 'monthly' | 'yearly';

export interface PackagePlan {
  id: string;
  name: string;
  price: number; // in EUR e.g. 0, 29, 49, 149
  currency: string; // e.g. '€'
  billingPeriod: TariffBillingPeriod;
  maxAnalyses: number; // e.g. 3, 10, 50, or 999999 for unlimited
  isUnlimited: boolean;
  description?: string;
  features?: string[];
  badge?: string; // e.g. 'Test-Phase', 'Beliebt', 'Praxis-Tipp', 'Flatrate'
  isDefault?: boolean;
  isActive: boolean;
  createdAt: string;
}

export type LanguageCode = 'de' | 'en' | 'fr' | 'el' | 'it' | 'ru' | 'es';

export interface LanguageOption {
  code: LanguageCode;
  label: string; // German name e.g. "Deutsch"
  nativeName: string; // Native name e.g. "Ελληνικά"
  englishName: string; // English name
  flag: string; // Flag emoji
}

export interface ContactHistoryItem {
  value: string;
  changedAt: string;
  note?: string;
}

export interface AdminCredentials {
  email: string;
  password: string;
  resetEmailDestination: string;
  updatedAt?: string;
}

export interface Therapist {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  password?: string;
  telefon: string;
  adresse: string;
  land: string;
  tarif: TariffType;
  tarifId?: string; // ID of the assigned PackagePlan
  tarifLabel: string;
  tarifPrice?: number;
  tarifPeriod?: TariffBillingPeriod;
  isUnlimited?: boolean;
  usedAnalyses: number;
  maxAnalyses: number; // default 3 for free_trial
  registeredAt: string; // ISO date string
  status: 'active' | 'limit_reached' | 'locked' | 'upgraded';
  praxisName?: string;
  notes?: string;
  preferredLanguage?: LanguageCode;
  previousEmails?: ContactHistoryItem[];
  previousPhones?: ContactHistoryItem[];
  previousPraxisNames?: ContactHistoryItem[];
  previousAddresses?: ContactHistoryItem[];
  previousNames?: ContactHistoryItem[];
}

export interface PatientChild {
  id: string;
  name: string;
  age?: number;
  gender?: 'weiblich' | 'männlich' | 'divers';
}

export type QuestionType = 'scale' | 'choice' | 'multi_choice' | 'text';

export interface AnamnesisQuestion {
  id: string;
  complaintName?: string; // which complaint this question belongs to when multiple are detected
  complaintIndex?: number;
  category?: string; // e.g. 'Zeitverlauf & Beginn', 'Lokalisation & Ausstrahlung', 'Schmerzcharakter', 'Intensität & Skala', 'Episoden & Rhythmus', 'Begleitsymptome', 'Modalitäten'
  question: string;
  type: QuestionType;
  options?: string[]; // for choice or multi_choice
  scaleMin?: number; // 1
  scaleMax?: number; // 4
  scaleLabels?: { [key: number]: string }; // 1: 'Normal/Leicht', 2: 'Mäßig', 3: 'Stark', 4: 'Extrem'
  answerText?: string;
  answerScaleCurrent?: number; // 1 to 4 (scale currently/normally)
  answerScaleWorst?: number; // 1 to 4 (scale worst case)
  answerChoice?: string;
  answerMultiChoice?: string[];
  helpText?: string;
}

export interface PatientCase {
  id: string;
  therapistId: string;
  patientName: string;
  patientAge?: number;
  patientBirthDate?: string;
  patientGender?: 'weiblich' | 'männlich' | 'divers';
  patientWeightKg?: number;
  patientMaritalStatus?: 'ledig' | 'verheiratet' | 'in Partnerschaft' | 'geschieden' | 'getrennt lebend' | 'verwitwet' | 'sonstiges' | string;
  patientEmail?: string;
  patientPhone?: string;
  anamneseDatum: string;
  
  // Stammdaten Erweiterungen
  patientHeightCm?: number;
  isPregnant?: boolean;
  pregnancyMonth?: number;
  hasChildren?: boolean;
  childrenCount?: number;
  childrenList?: PatientChild[];
  customStammdaten?: { id: string; name: string; value: string }[];
  
  // Anamnese
  hauptbeschwerde: string;
  spontanbericht: string;
  
  // Dynamisch generierte Fragen zur Hauptbeschwerde
  anamnesisQuestions?: AnamnesisQuestion[];
  
  // Befund & Modalitäten
  modalitaetenBesser: string;
  modalitaetenSchlechter: string;
  gemuetPsyche: string;
  koerperAllgemein: string; // Schlaf, Appetit, Durst, Temperatur
  lokalsymptome: string;
  bisherigeMittel: string;
  extendedAnamnesis?: Record<string, any>;
  befundGewuenscht?: boolean;
  befundText?: string;
  befundDetails?: {
    gesamtbeurteilung?: string;
    blutdruck?: string;
    puls?: string;
    temperatur?: string;
    spo2?: string;
    gewicht?: string;
    allgemeinzustand?: string;
    herzLunge?: string;
    abdomen?: string;
    hautSchleimhaeute?: string;
    neurologisch?: string;
    weitereBefunde?: string;
    customFelder?: { id: string; name: string; value: string }[];
  };
  nimmtMedikamente?: boolean;
  medikamenteList?: { 
    name: string; 
    dosierung: string; 
    einnahmeart: string;
    grund?: string;
    wirkstoff?: string;
    kategorie?: string;
    nebenwirkungen?: string[];
    wechselwirkungen?: string[];
    risiken?: string;
  }[];
  
  // Analyse-Ergebnis
  analyzedAt?: string;
  remedySuggestions?: {
    name: string;
    potency: string;
    score: number;
    keyIndicators: string[];
    description: string;
  }[];
  analysisNotes?: string;
  clinicalAnalysis?: FullClinicalAnalysis;

  // Therapieempfehlungen & Verordnung (Schritt 8 / Empfehlungen)
  therapyRecommendations?: TherapyRecommendations;

  // Erste Medikation & Verlaufskontrollen
  initialPrescription?: InitialPrescription;
  followUps?: FollowUpEntry[];
}

export interface TherapyRemedyItem {
  id: string;
  name: string;
  potency: string; // e.g. "C30", "C200", "LM VI", "D12"
  tagesdosis: string; // e.g. "1 bis 2 Gaben à 3–5 Globuli"
  haeufigkeit: string; // e.g. "1- bis 2-mal täglich"
  anwendungsdauer: string; // e.g. "3 bis maximal 5 Tage"
  zeitraum: string; // e.g. "Akut- und Initialphase"
  therapistNotes?: string; // Textfeld für Anmerkungen / Einnahmehinweise des Therapeuten
  isSelected: boolean;
  isCustom?: boolean;
  score?: number;
  grade?: string;
}

export interface TherapyRecommendations {
  doctorConsultationRequired: boolean;
  doctorConsultationUrgency: 'Notfall' | 'Dringend' | 'Empfohlen' | 'Optional' | 'Keine' | string;
  doctorConsultationSpecialty: string;
  doctorConsultationReason: string;
  doctorConsultationNotes: string;
  remedies: TherapyRemedyItem[];
  generalTherapyNotes?: string;
  updatedAt?: string;
}

export interface InitialPrescription {
  remedy: string;
  potency?: string;
  dosage?: string;
  recommendations: string;
  prescribedAt?: string;
}

export interface FollowUpEntry {
  id: string;
  createdAt: string; // ISO datetime
  dateDisplay?: string; // e.g. "Montag, 10. August 2026, 21:37 Uhr"
  trend: 'Deutlich besser' | 'Leicht gebessert' | 'Unverändert' | 'Erstverschlimmerung' | 'Leicht verschlechtert' | 'Deutlich schlechter' | string;
  intensityPrevious: number; // 1 to 4
  intensityCurrent: number; // 1 to 4
  befindenVerlauf: string; // "Keine Beschwerden mehr. Hat aber Ausschlag."
  remedyRecommendations: string; // Folgeempfehlungen / Verordnung
  notes?: string;
}

export interface RedFlagItem {
  text: string;
  severity: 'WARNUNG' | 'HINWEIS' | 'AKUT';
  status?: 'vorhanden' | 'nicht vorhanden' | 'nicht angegeben';
  abklaerung?: string;
}

export interface DifferentialDiagnosisItem {
  id?: string;
  title: string;
  pro: string[];
  contra: string[];
  offeneFragen: string[];
  diagnostik?: string;
}

export interface MedicationAnalysisDetail {
  name: string;
  wirkstoff?: string;
  dosierung?: string;
  einnahme?: string;
  wirkung?: string;
  nebenwirkungen: string[];
  zusammenhaenge: string[];
  wechselwirkungen?: string[];
  risiken?: string;
  uebergebrauchBeurteilung?: string;
}

export interface HomeoRemedyRecommendation {
  name: string;
  score?: number;
  passungSymptome: string[];
  modalitaeten: string[];
  contraNichtPassend?: string[];
  fehlendeInfos?: string[];
  rangBegruendung: string;
  dosierungPotenz: string;
  potenz?: string;
  tagesdosis?: string;
  haeufigkeit?: string;
  anwendungsdauer?: string;
  zeitraum?: string;
  einnahmehinweis?: string;
}

export interface FullClinicalAnalysis {
  symptomatik?: {
    leitsymptome: string[];
    begleitsymptome: string[];
    modalitaetenBesser: string[];
    modalitaetenSchlechter: string[];
    zeitverlauf: string[];
    psychischVegetativ: string[];
  };
  redFlags: {
    warnings: RedFlagItem[];
    gesamtbewertung: string;
    empfohleneFachrichtung: string;
    dringlichkeit?: 'Sofortige medizinische Abklärung erforderlich' | 'Zeitnahe ärztliche Abklärung sinnvoll' | 'Kein akuter Warnhinweis anhand der vorliegenden Angaben' | string;
  };
  differentialdiagnostik: {
    dringlichkeitHeader?: string;
    items: DifferentialDiagnosisItem[];
  };
  arztfallEntscheidung?: {
    status: 'Ja' | 'Nein' | 'Nicht sicher beurteilbar';
    begruendung: string;
  };
  medikamente: {
    zusammenfassung: string;
    warnhinweis?: string;
    details: MedicationAnalysisDetail[];
    ibuprofenSpezifisch?: {
      dosierungEinnahme: string;
      wirkung: string;
      risiken: string[];
      uebergebrauch: string;
    };
  };
  fehlendeInformationen?: string[];
  homoeopathie: {
    summary?: string;
    symptomHierarchie?: {
      leitsymptome: string[];
      allgemeinsymptome: string[];
      gemuetsymptome: string[];
      lokalsymptome: string[];
      modalitaeten: string[];
      begleitsymptome: string[];
    };
    mittel: HomeoRemedyRecommendation[];
    trennung?: {
      medizinisch: string[];
      komplementaer: string[];
      homoeopathisch: string[];
    };
  };
  gesamtAuswertung?: {
    medizinischeEinschaetzung: string;
    dringlichkeit: string;
    medikamentenBewertung: string;
    redFlags: string;
    homoeopathie: string;
    naechsteSchritte: string[];
  };
}

export type ActiveView = 'landing' | 'register' | 'therapist' | 'admin';

export interface SiteConfig {
  logoUrl?: string;
  faviconUrl?: string;
}

export interface EmailConfig {
  sendMethod?: 'api' | 'smtp';
  apiToken?: string;
  mailboxId?: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword?: string;
  fromEmail: string;
  fromName?: string;
  imapHost?: string;
  imapPort?: number;
  imapSecure?: boolean;
  popHost?: string;
  popPort?: number;
  popSecure?: boolean;
  updatedAt?: string;
}

export interface RegistrationTrialConfig {
  badge: string;
  priceDisplay: string;
  description: string;
  features: string[];
}

export type RegistrationTrialTranslations = Record<LanguageCode, RegistrationTrialConfig>;


export interface NameChangeRequest {
  id: string;
  therapistId: string;
  therapistEmail: string;
  oldVorname: string;
  oldNachname: string;
  requestedVorname: string;
  requestedNachname: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
}

export interface TermsPdfArchiveItem {
  id: string;
  versionGroup: string;
  version: string;
  title: string;
  lastUpdated: string;
  language: LanguageCode;
  createdAt: string;
  content: string;
  wordCount: number;
  sectionCount: number;
  pdfFilename?: string;
}

// ============================================================================
// HOMOEOPATHIC EXPERT 5-STEP REPERTORISATION & DECISION TREE TYPES
// ============================================================================

export interface BackendExtraktion {
  hauptbeschwerde: string; // [Leitsymptom]
  causa: string;           // [Causa] oder "Unbekannt (Bitte erfragen)"
  modalitaeten: string;    // [Modalitäten] oder "Unbekannt (Bitte erfragen)"
  begleitsymptome: string; // [Begleitsymptome] oder "Unbekannt (Bitte erfragen)"
}

export interface BackendAppLayoutDaten {
  optimales_simile: string; // Name des Hauptmittels oder "Fehlende Daten für Empfehlung"
  begruendung: string;      // Begründung oder Erklärung fehlender Daten
}

export interface BackendDiagnoseFragen {
  frage_1: string; // Gezielte Frage nach fehlender Modalität / Schmerzcharakter
  frage_2: string; // Gezielte Frage nach fehlendem Begleitsymptom / Gemütszustand
}

export interface BackendBaumstrukturPfad {
  bedingung: string;
  folge_frage: string;
  ergebnis_ja: string;
  ergebnis_nein: string;
}

export interface BackendBaumstrukturPopupDaten {
  start_knoten: string;
  haupt_differenzierungs_frage: string;
  pfad_ja: BackendBaumstrukturPfad;
  pfad_nein: BackendBaumstrukturPfad;
}

export interface HomeopathicExpertBackendOutput {
  extraktion: BackendExtraktion;
  app_layout_daten: BackendAppLayoutDaten;
  diagnose_fragen_fuer_therapeut: BackendDiagnoseFragen;
  baumstruktur_popup_daten: BackendBaumstrukturPopupDaten;
}

export interface HomeopathicExtractedAnalysis {
  hauptbeschwerde: string; // [Leitsymptom] Körperliche Hauptbeschwerde
  causa: string;           // [Causa] Auslöser/Ursache (Wetter, Emotion, Unfall, etc.)
  modalitaeten: string;    // [Modalitäten] Was verschlimmert (>) oder bessert (<)
  begleitsymptome: string; // [Begleitsymptome] Begleitsymptome & Gemütszustände
}

export interface DecisionTreeNodeRemedy {
  name: string;
  commonName?: string;
  latinName?: string;
  rationale: string;
}

export interface DecisionTreeSecondaryQuestion {
  question: string;
  option1Label: string;
  option1Remedy: DecisionTreeNodeRemedy;
  option2Label: string;
  option2Remedy: DecisionTreeNodeRemedy;
}

export interface DecisionTreeBranch {
  id: string;
  branchLabel: string;      // z.B. "[ VERDAUUNG / MAGEN ]"
  subQuestion: string;      // z.B. "Heißhunger auf Süßes? Blähbauch um 16-20 Uhr?"
  yesRemedy: DecisionTreeNodeRemedy;  // z.B. [LYCOPODIUM]
  noRemedy: DecisionTreeNodeRemedy;   // Lückenlos: Auffang-Mittel, z.B. [NUX VOMICA]
  secondaryQuestion?: DecisionTreeSecondaryQuestion;
}

export interface HomeopathicDecisionTree {
  header: string;           // z.B. "[ RECHTSEITIGE MIGRÄNE & VERSCHLIMMERUNG ~20 UHR ]"
  rootQuestion: string;     // z.B. "Gibt es begleitende Organ- oder Verdauungssymptome?"
  branches: DecisionTreeBranch[];
  textFlowchart: string;    // ASCII Flussdiagramm
}

export interface HomeopathicExpertResult {
  // Pure 5-step backend structured output
  extraktion: BackendExtraktion;
  app_layout_daten: BackendAppLayoutDaten;
  diagnose_fragen_fuer_therapeut: BackendDiagnoseFragen;
  baumstruktur_popup_daten: BackendBaumstrukturPopupDaten;

  // Normalized / compatibility fields
  extractedAnalysis: HomeopathicExtractedAnalysis;
  startPool?: string[];
  decisionTree: HomeopathicDecisionTree;
  diagnosticQuestions: string[];
  recommendedSimile: {
    remedyName: string;
    rationale: string;
  };
  formattedMarkdown?: string;
}

export interface TokenUsageRecord {
  id: string;
  timestamp: string;
  therapistId: string;
  therapistName?: string;
  therapistEmail?: string;
  endpoint: string;
  actionName: string;
  model: string;
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  costEur: number;
}

export interface TherapistTokenSummary {
  therapistId: string;
  therapistName: string;
  therapistEmail: string;
  praxisName?: string;
  tarifLabel?: string;
  requestCount: number;
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  totalCostEur: number;
  lastUsedAt: string;
}

export interface TokenPricingRates {
  inputPerMillionEur: number;
  outputPerMillionEur: number;
  currency: string;
}

export interface TokenBillingSummary {
  totalPromptTokens: number;
  totalCandidatesTokens: number;
  totalTokens: number;
  totalCostEur: number;
  totalRequests: number;
  byTherapist: TherapistTokenSummary[];
  rates: TokenPricingRates;
  lastUpdated: string;
}
