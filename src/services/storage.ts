import { Therapist, PatientCase, PackagePlan, LanguageCode, AdminCredentials, SiteConfig, EmailConfig, NameChangeRequest, FollowUpEntry, InitialPrescription } from '../types';
import { DEFAULT_TERMS, DEFAULT_TERMS_BY_LANG, getDefaultTermsForLanguage, TermsAndConditions } from '../data/defaultTerms';

export const DEFAULT_ADMIN_CREDENTIALS: AdminCredentials = {
  email: 'p.stogian@yahoo.com',
  password: 'Othonospet@19071963',
  resetEmailDestination: 'p.stogian@yahoo.com',
};

export const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  smtpHost: 'smtp.hostinger.com',
  smtpPort: 465,
  smtpSecure: true,
  smtpUser: 'therapie@homeopilto360.com',
  smtpPassword: 'Othonospet@19071963',
  fromEmail: 'therapie@homeopilto360.com',
  fromName: 'HomeoPilot 360',
  imapHost: 'imap.hostinger.com',
  imapPort: 993,
  imapSecure: true,
  popHost: 'pop.hostinger.com',
  popPort: 995,
  popSecure: true,
};

const STORAGE_KEYS = {
  THERAPISTS: 'homoeo_saas_therapists_v1',
  ACTIVE_THERAPIST: 'homoeo_saas_active_therapist_id_v1',
  CASES: 'homoeo_saas_cases_v1',
  ADMIN_LOGGED_IN: 'homoeo_saas_admin_auth_v1',
  ADMIN_CREDENTIALS: 'homoeo_saas_admin_credentials_v1',
  PACKAGES: 'homoeo_saas_packages_v1',
  TERMS: 'homoeo_saas_terms_v1',
  SITE_CONFIG: 'homoeo_saas_site_config_v1',
  EMAIL_CONFIG: 'homoeo_saas_email_config_v1',
  REG_TRIAL: 'homoeo_saas_reg_trial_v1',
  NAME_CHANGE_REQUESTS: 'homoeo_name_change_requests',
};

// Registration Trial Management
import { RegistrationTrialConfig, RegistrationTrialTranslations } from '../types';

export const DEFAULT_REG_TRIAL: RegistrationTrialTranslations = {
  de: { badge: 'Kostenloser Test-Tarif', priceDisplay: '0,00 €', description: 'Testen Sie alle Funktionen für bis zu 3 Vollanalysen. Keine Kreditkarte erforderlich.', features: ['3 Vollanalysen & Repertorisation', 'Anamnese & strukturierte Befunde', 'Automatische Sperre nach 3 Analysen'] },
  en: { badge: 'Free Trial', priceDisplay: '€0.00', description: 'Test all features for up to 3 full analyses. No credit card required.', features: ['3 Full Analyses & Repertorization', 'Anamnesis & Structured Findings', 'Automatic lock after 3 analyses'] },
  fr: { badge: 'Essai Gratuit', priceDisplay: '0,00 €', description: 'Testez toutes les fonctionnalités jusqu\'à 3 analyses complètes. Sans carte de crédit.', features: ['3 analyses complètes et répertorisation', 'Anamnèse et résultats structurés', 'Verrouillage automatique après 3 analyses'] },
  el: { badge: 'Δωρεάν Δοκιμή', priceDisplay: '0,00 €', description: 'Δοκιμάστε όλες τις λειτουργίες για έως και 3 πλήρεις αναλύσεις. Δεν απαιτείται πιστωτική κάρτα.', features: ['3 Πλήρεις αναλύσεις & Ρεπερτόριο', 'Αναμνηστικό & Δομημένα Ευρήματα', 'Αυτόματο κλείδωμα μετά από 3 αναλύσεις'] },
  it: { badge: 'Prova Gratuita', priceDisplay: '0,00 €', description: 'Prova tutte le funzionalità fino a 3 analisi complete. Nessuna carta di credito richiesta.', features: ['3 analisi complete e repertorizzazione', 'Anamnesi e risultati strutturati', 'Blocco automatico dopo 3 analisi'] },
  ru: { badge: 'Бесплатная Пробная Версия', priceDisplay: '0,00 €', description: 'Тестируйте все функции до 3 полных анализов. Кредитная карта не требуется.', features: ['3 полных анализа и реперторизация', 'Анамнез и структурированные выводы', 'Автоматическая блокировка после 3 анализов'] },
  es: { badge: 'Prueba Gratuita', priceDisplay: '0,00 €', description: 'Pruebe todas las funciones para hasta 3 análisis completos. No se requiere tarjeta de crédito.', features: ['3 análisis completos y repertorización', 'Anamnesis y hallazgos estructurados', 'Bloqueo automático después de 3 análisis'] }
};

export function getRegistrationTrialTranslations(): RegistrationTrialTranslations {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REG_TRIAL);
    if (!raw) return DEFAULT_REG_TRIAL;
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_REG_TRIAL;
  }
}

export function saveRegistrationTrialTranslations(translations: RegistrationTrialTranslations): void {
  localStorage.setItem(STORAGE_KEYS.REG_TRIAL, JSON.stringify(translations));
  window.dispatchEvent(new Event('homoeo_reg_trial_updated'));
}

export function getLocalizedRegistrationTrial(lang: LanguageCode): RegistrationTrialConfig {
  const translations = getRegistrationTrialTranslations();
  return translations[lang] || translations['de'];
}

// Site Config Management
export function getSiteConfig(): SiteConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SITE_CONFIG);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function syncSiteConfigFromServer(): Promise<SiteConfig> {
  try {
    const res = await fetch('/api/site/config');
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        const current = getSiteConfig();
        const merged = { ...current, ...data };
        localStorage.setItem(STORAGE_KEYS.SITE_CONFIG, JSON.stringify(merged));
        window.dispatchEvent(new Event('homoeo_site_config_changed'));
        return merged;
      }
    }
  } catch {
    // Ignore network failure, use local
  }
  return getSiteConfig();
}

export function saveSiteConfig(updates: Partial<SiteConfig>): SiteConfig {
  const current = getSiteConfig();
  const updated = { ...current, ...updates };
  localStorage.setItem(STORAGE_KEYS.SITE_CONFIG, JSON.stringify(updated));
  window.dispatchEvent(new Event('homoeo_site_config_changed'));

  // Sync to server
  fetch('/api/site/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  }).catch((err) => console.warn('Failed to save site config to server', err));

  return updated;
}

// Admin Credentials Management
export function getAdminCredentials(): AdminCredentials {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_CREDENTIALS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_CREDENTIALS, JSON.stringify(DEFAULT_ADMIN_CREDENTIALS));
      return DEFAULT_ADMIN_CREDENTIALS;
    }
    const parsed = JSON.parse(raw);
    return {
      email: parsed.email || DEFAULT_ADMIN_CREDENTIALS.email,
      password: parsed.password || DEFAULT_ADMIN_CREDENTIALS.password,
      resetEmailDestination: parsed.resetEmailDestination || DEFAULT_ADMIN_CREDENTIALS.resetEmailDestination,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return DEFAULT_ADMIN_CREDENTIALS;
  }
}

export async function syncAdminCredentialsFromServer(): Promise<AdminCredentials> {
  try {
    const res = await fetch('/api/admin/credentials');
    if (res.ok) {
      const data = await res.json();
      if (data && data.password) {
        const serverCreds: AdminCredentials = {
          email: data.email || DEFAULT_ADMIN_CREDENTIALS.email,
          password: data.password || DEFAULT_ADMIN_CREDENTIALS.password,
          resetEmailDestination: data.resetEmailDestination || DEFAULT_ADMIN_CREDENTIALS.resetEmailDestination,
          updatedAt: data.updatedAt,
        };
        localStorage.setItem(STORAGE_KEYS.ADMIN_CREDENTIALS, JSON.stringify(serverCreds));
        window.dispatchEvent(new Event('homoeo_admin_credentials_changed'));
        window.dispatchEvent(new Event('homoeo_storage_updated'));
        return serverCreds;
      }
    }
  } catch {
    // Ignore network error in offline mode
  }
  return getAdminCredentials();
}

// Auto-trigger sync on module load in browser
if (typeof window !== 'undefined') {
  syncAdminCredentialsFromServer();
  syncSiteConfigFromServer();
  syncEmailConfigFromServer();
}

// Email Config Management
export function getEmailConfig(): EmailConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EMAIL_CONFIG);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EMAIL_CONFIG, JSON.stringify(DEFAULT_EMAIL_CONFIG));
      return DEFAULT_EMAIL_CONFIG;
    }
    const parsed = JSON.parse(raw);
    return {
      smtpHost: parsed.smtpHost || DEFAULT_EMAIL_CONFIG.smtpHost,
      smtpPort: typeof parsed.smtpPort === 'number' ? parsed.smtpPort : DEFAULT_EMAIL_CONFIG.smtpPort,
      smtpSecure: parsed.smtpSecure !== undefined ? Boolean(parsed.smtpSecure) : DEFAULT_EMAIL_CONFIG.smtpSecure,
      smtpUser: parsed.smtpUser || DEFAULT_EMAIL_CONFIG.smtpUser,
      smtpPassword: parsed.smtpPassword !== undefined ? parsed.smtpPassword : DEFAULT_EMAIL_CONFIG.smtpPassword,
      fromEmail: parsed.fromEmail || parsed.smtpUser || DEFAULT_EMAIL_CONFIG.fromEmail,
      fromName: parsed.fromName || DEFAULT_EMAIL_CONFIG.fromName,
      imapHost: parsed.imapHost || DEFAULT_EMAIL_CONFIG.imapHost,
      imapPort: typeof parsed.imapPort === 'number' ? parsed.imapPort : DEFAULT_EMAIL_CONFIG.imapPort,
      imapSecure: parsed.imapSecure !== undefined ? Boolean(parsed.imapSecure) : DEFAULT_EMAIL_CONFIG.imapSecure,
      popHost: parsed.popHost || DEFAULT_EMAIL_CONFIG.popHost,
      popPort: typeof parsed.popPort === 'number' ? parsed.popPort : DEFAULT_EMAIL_CONFIG.popPort,
      popSecure: parsed.popSecure !== undefined ? Boolean(parsed.popSecure) : DEFAULT_EMAIL_CONFIG.popSecure,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return DEFAULT_EMAIL_CONFIG;
  }
}

export async function syncEmailConfigFromServer(): Promise<EmailConfig> {
  try {
    const res = await fetch('/api/email/config');
    if (res.ok) {
      const data = await res.json();
      if (data && data.smtpHost) {
        const current = getEmailConfig();
        const merged: EmailConfig = {
          ...current,
          ...data,
        };
        localStorage.setItem(STORAGE_KEYS.EMAIL_CONFIG, JSON.stringify(merged));
        window.dispatchEvent(new Event('homoeo_email_config_changed'));
        return merged;
      }
    }
  } catch {
    // Ignore network failure, use local
  }
  return getEmailConfig();
}

export function saveEmailConfig(updates: Partial<EmailConfig>): EmailConfig {
  const current = getEmailConfig();
  const updated: EmailConfig = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.EMAIL_CONFIG, JSON.stringify(updated));
  window.dispatchEvent(new Event('homoeo_email_config_changed'));

  // Sync to server
  fetch('/api/email/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  }).catch((err) => console.warn('Failed to save email config to server', err));

  return updated;
}

export function resetEmailConfig(): EmailConfig {
  localStorage.setItem(STORAGE_KEYS.EMAIL_CONFIG, JSON.stringify(DEFAULT_EMAIL_CONFIG));
  window.dispatchEvent(new Event('homoeo_email_config_changed'));

  // Sync to server
  fetch('/api/email/config/reset', {
    method: 'POST',
  }).catch((err) => console.warn('Failed to reset email config on server', err));

  return DEFAULT_EMAIL_CONFIG;
}

export function saveAdminCredentials(updates: Partial<AdminCredentials>): AdminCredentials {
  const current = getAdminCredentials();
  const updated: AdminCredentials = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.ADMIN_CREDENTIALS, JSON.stringify(updated));
  window.dispatchEvent(new Event('homoeo_admin_credentials_changed'));
  window.dispatchEvent(new Event('homoeo_storage_updated'));

  // Sync to server
  fetch('/api/admin/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  }).catch((err) => console.warn('Failed to save admin credentials to server', err));

  return updated;
}

export function resetAdminCredentials(): AdminCredentials {
  localStorage.setItem(STORAGE_KEYS.ADMIN_CREDENTIALS, JSON.stringify(DEFAULT_ADMIN_CREDENTIALS));
  window.dispatchEvent(new Event('homoeo_admin_credentials_changed'));
  window.dispatchEvent(new Event('homoeo_storage_updated'));

  // Sync to server
  fetch('/api/admin/credentials/reset', {
    method: 'POST',
  }).catch((err) => console.warn('Failed to reset admin credentials on server', err));

  return DEFAULT_ADMIN_CREDENTIALS;
}

// Backward compatibility export proxy
export const ADMIN_CREDENTIALS = new Proxy(DEFAULT_ADMIN_CREDENTIALS, {
  get(target, prop: keyof AdminCredentials) {
    const current = getAdminCredentials();
    return current[prop] !== undefined ? current[prop] : target[prop];
  }
});

export const INITIAL_PACKAGE_PLANS: PackagePlan[] = [
  {
    id: 'free_trial',
    name: 'Kostenloser Test-Tarif',
    price: 0,
    currency: '€',
    billingPeriod: 'free',
    maxAnalyses: 3,
    isUnlimited: false,
    badge: 'Test-Phase',
    description: '3 vollständige Erst- und Folgeanalysen inklusive Repertorisation nach Hahnemann.',
    features: [
      '3 Vollanalysen & Repertorisationen',
      'Anamnese- & Befunddokumentation',
      'Automatische Sperre nach 3 Analysen',
    ],
    isDefault: true,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'starter_10',
    name: 'Starter-Paket (10 Analysen)',
    price: 29,
    currency: '€',
    billingPeriod: 'one_time',
    maxAnalyses: 10,
    isUnlimited: false,
    badge: 'Einsteiger',
    description: '10 vollständige Fallanalysen ohne monatliche Bindung oder automatische Verlängerung.',
    features: [
      '10 Vollanalysen & Mittel-Vorschläge',
      'Unbegrenzte Speicherdauer der Fälle',
      'Export als PDF & Fallbericht',
    ],
    isDefault: false,
    isActive: true,
    createdAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'praxis_50',
    name: 'Praxis-Paket (50 Analysen / Monat)',
    price: 69,
    currency: '€',
    billingPeriod: 'monthly',
    maxAnalyses: 50,
    isUnlimited: false,
    badge: 'Beliebt',
    description: '50 Analysen pro Monat – ideal für etablierte homöopathische Einzelpraxen.',
    features: [
      '50 Analysen jeden Monat inklusive',
      'Prioritäre Repertorisation & Materia Medica',
      'Patienten-Schnellsuche & Sprachnotizen',
    ],
    isDefault: false,
    isActive: true,
    createdAt: '2025-01-15T00:00:00Z',
  },
  {
    id: 'pro_unlimited',
    name: 'Pro Unbegrenzt (Praxis-Flatrate)',
    price: 149,
    currency: '€',
    billingPeriod: 'monthly',
    maxAnalyses: 999999,
    isUnlimited: true,
    badge: 'Flatrate',
    description: 'Unbegrenzte Analysen & Repertorisationen für Großpraxen, Kliniken und Vielnutzer.',
    features: [
      'Unbegrenzte Analysen & Falldokumentationen',
      'Höchste Priorität bei KI-Repertorisation',
      'Vollständige Sprachsteuerung aller Felder',
      'Persönlicher Praxis-Support',
    ],
    isDefault: false,
    isActive: true,
    createdAt: '2025-01-20T00:00:00Z',
  },
];

const INITIAL_THERAPISTS: Therapist[] = [
  {
    id: 'th-101',
    vorname: 'Katharina',
    nachname: 'Lindemann',
    email: 'k.lindemann@naturheilpraxis-berlin.de',
    password: 'homoeo2025!',
    telefon: '+49 30 8472910',
    adresse: 'Schönhauser Allee 45, 10435 Berlin',
    land: 'Deutschland',
    tarif: 'free_trial',
    tarifId: 'free_trial',
    tarifLabel: 'Kostenloser Test-Tarif',
    tarifPrice: 0,
    tarifPeriod: 'free',
    isUnlimited: false,
    usedAnalyses: 1,
    maxAnalyses: 3,
    registeredAt: '2025-02-14T09:30:00Z',
    status: 'active',
    praxisName: 'Naturheilpraxis Lindemann',
    previousEmails: [
      { value: 'k.lindemann.praxis@web.de', changedAt: '2025-02-15T10:00:00Z', note: 'Frühere Registrierungs-Mail' }
    ],
    previousPhones: [
      { value: '+49 30 12345678', changedAt: '2025-02-15T10:00:00Z', note: 'Frühere Festnetznummer' }
    ]
  },
  {
    id: 'th-102',
    vorname: 'Dr. med. Markus',
    nachname: 'Vogel',
    email: 'praxis@dr-vogel-muenchen.de',
    password: 'homoeo2025!',
    telefon: '+49 89 2394812',
    adresse: 'Maximilianstraße 12, 80539 München',
    land: 'Deutschland',
    tarif: 'free_trial',
    tarifId: 'free_trial',
    tarifLabel: 'Kostenloser Test-Tarif',
    tarifPrice: 0,
    tarifPeriod: 'free',
    isUnlimited: false,
    usedAnalyses: 3,
    maxAnalyses: 3,
    registeredAt: '2025-02-18T14:15:00Z',
    status: 'limit_reached',
    praxisName: 'Ganzheitliche Medizin Vogel',
  },
  {
    id: 'th-103',
    vorname: 'Sophie',
    nachname: 'Brunner',
    email: 'sophie.brunner@homoeopathie-zuerich.ch',
    password: 'homoeo2025!',
    telefon: '+41 44 280 19 40',
    adresse: 'Bahnhofstrasse 88, 8001 Zürich',
    land: 'Schweiz',
    tarif: 'pro_unlimited',
    tarifId: 'pro_unlimited',
    tarifLabel: 'Pro Unbegrenzt (Praxis-Flatrate)',
    tarifPrice: 149,
    tarifPeriod: 'monthly',
    isUnlimited: true,
    usedAnalyses: 14,
    maxAnalyses: 999999,
    registeredAt: '2025-02-22T11:00:00Z',
    status: 'upgraded',
    praxisName: 'Klassische Homöopathie Zürich',
  },
];

const INITIAL_CASES: PatientCase[] = [
  {
    id: 'case-1',
    therapistId: 'th-101',
    patientName: 'Anna Maria Keller',
    patientAge: 42,
    patientBirthDate: '1983-05-14',
    patientGender: 'weiblich',
    patientHeightCm: 168,
    patientWeightKg: 64,
    patientMaritalStatus: 'verheiratet',
    patientEmail: 'anna.keller@beispiel.de',
    patientPhone: '+49 171 4455667',
    isPregnant: false,
    hasChildren: true,
    childrenCount: 2,
    childrenList: [
      { id: 'c1', name: 'Felix', age: 12, gender: 'männlich' },
      { id: 'c2', name: 'Sophie', age: 8, gender: 'weiblich' },
    ],
    customStammdaten: [
      { id: 'cs-1', name: 'Beruf', value: 'Architektin' },
      { id: 'cs-2', name: 'Hausarzt', value: 'Dr. med. Weber, Berlin' },
      { id: 'cs-3', name: 'Krankenkasse', value: 'TK Techniker Krankenkasse' },
    ],
    anamneseDatum: '2026-08-01',
    hauptbeschwerde: 'Chronische Migräne mit Sehstörungen (Flimmerskotom) rechtsseitig.',
    spontanbericht: 'Schmerzen beginnen am Hinterkopf, ziehen über den Scheitel ins rechte Auge. Häufig nach Stress oder Wetterumschwung (Föhn).',
    modalitaetenBesser: 'Dunkles, ruhiges Zimmer, Druck auf die Schläfe, kalte Umschläge.',
    modalitaetenSchlechter: 'Licht, Lärm, Bücken, Bewegung, Vormittags ab 10:00 Uhr.',
    gemuetPsyche: 'Sehr pflichtbewusst, perfektionistisch, Neigung zur Reizbarkeit bei Schmerzen. Weint nicht gerne vor anderen.',
    koerperAllgemein: 'Verlangen nach salzigen Speisen, starker Durst auf kaltes Wasser, Schlaflosigkeit vor Mitternacht.',
    lokalsymptome: 'Pulsierender, klopfender Schmerz in der rechten Schläfe.',
    bisherigeMittel: 'Triptane (schlechte Verträglichkeit), Ibuprofen 600.',
    nimmtMedikamente: true,
    medikamenteList: [
      { name: 'Ibuprofen 600', dosierung: '1x tgl. bei Bedarf', einnahmeart: 'oral' },
      { name: 'Magnesium 400', dosierung: '1x morgens', einnahmeart: 'oral' },
    ],
    analyzedAt: '2026-08-01T10:15:00Z',
    remedySuggestions: [
      {
        name: 'Natrium muriaticum',
        potency: 'C200',
        score: 94,
        keyIndicators: ['Rechtsseitige Migräne', 'Salzverlangen', 'Verschlimmerung durch Trost', 'Lichtscheu'],
        description: 'Klassisches Mittel für periodische Kopfschmerzen mit Flimmern und starker Stresssensitivität.',
      },
      {
        name: 'Belladonna',
        potency: 'C30',
        score: 82,
        keyIndicators: ['Pulsierender Schmerz', 'Rechte Seite', 'Lichtempfindlichkeit'],
        description: 'Akutmittel bei plötzlich einschießenden, klopfenden Gefäßschmerzen.',
      },
    ],
    clinicalAnalysis: {
      redFlags: {
        warnings: [],
        gesamtbewertung: 'Keine akuten Alarmsymptome. Typischer Verlauf einer chronischen Migräne mit Aura.',
        empfohleneFachrichtung: 'Neurologie (Routine-Kontrolle)',
        dringlichkeit: 'Kein akuter Warnhinweis anhand der vorliegenden Angaben',
      },
      differentialdiagnostik: {
        dringlichkeitHeader: 'Differenzialdiagnostische Abgrenzung',
        items: [
          {
            title: 'Migräne mit Aura vs. Spannungskopfschmerz',
            pro: ['Halbseitig pulsierend', 'Flimmerskotom', 'Lichtscheu'],
            contra: ['Keine dauerhafte Nackensteifigkeit'],
            offeneFragen: ['Häufigkeit der Episoden pro Monat'],
            diagnostik: 'Neurologische Verlaufskontrolle',
          },
        ],
      },
      arztfallEntscheidung: {
        status: 'Nein',
        begruendung: 'Klassische Anamnese einer bereits fachärztlich bekannten Migräne ohne neuartige Red Flags.',
      },
      medikamente: {
        zusammenfassung: 'Bedarfsmedikation mit Ibuprofen bei Schmerzspitzen.',
        details: [
          {
            name: 'Ibuprofen 600',
            wirkstoff: 'Ibuprofen',
            dosierung: 'Bei Bedarf',
            nebenwirkungen: ['Magenreizung möglich'],
            zusammenhaenge: ['Sollte bei homöopathischer Begleitung möglichst reduziert werden'],
          },
        ],
      },
      homoeopathie: {
        summary: 'Natrium muriaticum C200 als tiefgreifendes Konstitutionsmittel indiziert.',
        mittel: [
          {
            name: 'Natrium muriaticum',
            dosierungPotenz: 'C200 einmalig',
            rangBegruendung: 'Exzellente Passung zu Modalitäten (besser Ruhe/Dunkelheit, schlechter 10 Uhr, Verlangen nach Salz).',
            passungSymptome: ['Rechtsseitige Migräne', 'Flimmerskotom', 'Salzhunger'],
            modalitaeten: ['Besser Druck & Kälte', 'Schlechter Licht & Lärm'],
            einnahmehinweis: '3 Globuli einmalig nüchtern auf der Zunge zergehen lassen. 3 Wochen Reaktionsbeobachtung.',
          },
        ],
      },
      gesamtAuswertung: {
        medizinischeEinschaetzung: 'Stabile chronische Migräne ohne akute Gefahrenzeichen.',
        dringlichkeit: 'Routinebehandlung',
        medikamentenBewertung: 'Vertretbar, Schmerzmittelgebrauch im Auge behalten.',
        redFlags: 'Keine vorhanden',
        homoeopathie: 'Natrium muriaticum C200 verordnet.',
        naechsteSchritte: ['Erste Verordnung einnehmen', 'Verlaufskontrolle nach 10 Tagen', 'Schmerztagebuch führen'],
      },
    },
    initialPrescription: {
      remedy: 'Natrium muriaticum',
      potency: 'C200',
      dosage: '3 Globuli einmalig',
      recommendations: 'Verordnung nach der Erstanamnese — bleibt dauerhaft erhalten und wird von Verlaufskontrollen nicht überschrieben.\n3 Globuli sublingual morgens nüchtern. Keine Pfefferminze oder starken ätherischen Öle während der Wirkung.',
      prescribedAt: '2026-08-01T11:00:00Z',
    },
    followUps: [
      {
        id: 'fu-1',
        createdAt: '2026-08-10T21:37:00Z',
        dateDisplay: 'Montag, 10. August 2026, 21:37 Uhr',
        trend: 'Deutlich besser',
        intensityPrevious: 4,
        intensityCurrent: 1,
        befindenVerlauf: 'Keine Migräneanfälle mehr aufgetreten! Fühlt sich deutlich vitaler und gelassener. Vor 3 Tagen trat ein leichter Hautausschlag an den Schläfen auf (mögliche Hering\'sche Hautreaktion).',
        remedyRecommendations: 'Abwarten (keine weitere Gabe solange Besserung anhält). Hautausschlag beobachten, nicht unterdrücken.',
        notes: 'Typische Reaktion nach Gabe von Natrium muriaticum.',
      },
      {
        id: 'fu-2',
        createdAt: '2026-08-24T14:15:00Z',
        dateDisplay: 'Montag, 24. August 2026, 14:15 Uhr',
        trend: 'Deutlich besser',
        intensityPrevious: 2,
        intensityCurrent: 1,
        befindenVerlauf: 'Vollständig beschwerdefrei, auch trotz beruflicher Belastung und Wetterumschwung. Der Hautausschlag ist restlos verschwunden. Patientin ist hochzufrieden.',
        remedyRecommendations: 'Therapieabschluss. Bei erneutem Wiederauftreten Vorstellung zur Kontrollanalyse.',
        notes: 'Sehr erfreulicher Heilungsverlauf.',
      },
    ],
  },
  {
    id: 'case-2',
    therapistId: 'th-101',
    patientName: 'Anna Maria Keller',
    patientAge: 42,
    patientBirthDate: '1983-05-14',
    patientGender: 'weiblich',
    patientHeightCm: 168,
    patientWeightKg: 64,
    patientMaritalStatus: 'verheiratet',
    patientEmail: 'anna.keller@beispiel.de',
    patientPhone: '+49 171 4455667',
    isPregnant: false,
    hasChildren: true,
    childrenCount: 2,
    anamneseDatum: '2026-08-18',
    hauptbeschwerde: 'Akute Lumbalgie (Hexenschuss) nach schwerem Heben im Garten.',
    spontanbericht: 'Stechender Schmerz in der Lendenwirbelsäule beim ersten Aufstehen und Bücken. Besser nach einigen Schritten Bewegung.',
    modalitaetenBesser: 'Fortgesetzte sanfte Bewegung, lokale Wärme, harter Untergrund.',
    modalitaetenSchlechter: 'Erste Bewegung nach Ruhe, nasskaltes Wetter, langes Sitzen.',
    gemuetPsyche: 'Ungeduldig wegen Bewegungseinschränkung.',
    koerperAllgemein: 'Leichte Steifigkeit morgens.',
    lokalsymptome: 'Druckschmerz paraspinal L4/L5.',
    bisherigeMittel: 'Wärmepflaster.',
    analyzedAt: '2026-08-18T16:00:00Z',
    remedySuggestions: [
      {
        name: 'Rhus toxicodendron',
        potency: 'C30',
        score: 91,
        keyIndicators: ['Besser durch fortgesetzte Bewegung', 'Schlechter bei Beginn', 'Verschlimmerung durch Nässe'],
        description: 'Hauptmittel bei Verhebetraumata und Steifigkeit des Bewegungsapparats.',
      },
    ],
    initialPrescription: {
      remedy: 'Rhus toxicodendron',
      potency: 'C30',
      dosage: '3 Globuli 2x täglich für 3 Tage',
      recommendations: 'Verordnung nach der Erstanamnese — bleibt dauerhaft erhalten und wird von Verlaufskontrollen nicht überschrieben.\nIn Wasser auflösen oder direkt sublingual einnehmen.',
      prescribedAt: '2026-08-18T16:30:00Z',
    },
    followUps: [
      {
        id: 'fu-201',
        createdAt: '2026-08-22T10:00:00Z',
        dateDisplay: 'Freitag, 22. August 2026, 10:00 Uhr',
        trend: 'Deutlich besser',
        intensityPrevious: 4,
        intensityCurrent: 1,
        befindenVerlauf: 'LWS wieder frei beweglich. Nur noch minimales Ziehen bei extremem Bücken.',
        remedyRecommendations: 'Mittel absetzen, normale Bewegung fortführen.',
      },
    ],
  },
  {
    id: 'case-3',
    therapistId: 'th-101',
    patientName: 'Michael Berger',
    patientAge: 48,
    patientBirthDate: '1978-03-22',
    patientGender: 'männlich',
    patientHeightCm: 178,
    patientWeightKg: 82,
    patientMaritalStatus: 'verheiratet',
    patientEmail: 'm.berger@consulting.de',
    patientPhone: '+49 160 9988776',
    isPregnant: false,
    hasChildren: true,
    childrenCount: 1,
    childrenList: [
      { id: 'c3', name: 'Leon', age: 16, gender: 'männlich' },
    ],
    customStammdaten: [
      { id: 'cs-4', name: 'Beruf', value: 'Unternehmensberater (60h-Woche)' },
      { id: 'cs-5', name: 'Hausarzt', value: 'Praxis Dr. Schmidt, Berlin' },
    ],
    anamneseDatum: '2026-08-05',
    hauptbeschwerde: 'Krampfartige Magenschmerzen, Sodbrennen und chronische Schlafstörungen.',
    spontanbericht: 'Sehr hohe berufliche Arbeitsbelastung. Wacht jede Nacht um 03:00 Uhr auf und wälzt Probleme. Morgens erschöpft.',
    modalitaetenBesser: 'Wärmflasche auf dem Bauch, feuchte Umschläge, kurzer Mittagsschlaf.',
    modalitaetenSchlechter: 'Morgens beim Aufstehen, Kälte, Kaffee, scharfes Essen, Stress & Ärger.',
    gemuetPsyche: 'Cholerisch, ungeduldig, schnell gereizt bei Verzögerungen, überaus leistungsorientiert.',
    koerperAllgemein: 'Fröstelig, ständiges Verlangen nach Kaffee und Aufputschmitteln, Völlegefühl.',
    lokalsymptome: 'Druckgefühl im Oberbauch 1 Stunde nach Mahlzeiten, krampfartige Obstipation.',
    bisherigeMittel: 'Pantoprazol 20mg.',
    nimmtMedikamente: true,
    medikamenteList: [
      { name: 'Pantoprazol 20mg', dosierung: '1x morgens nüchtern', einnahmeart: 'oral' },
    ],
    analyzedAt: '2026-08-05T15:00:00Z',
    remedySuggestions: [
      {
        name: 'Nux vomica',
        potency: 'C200',
        score: 96,
        keyIndicators: ['Krämpfe nach Stress', 'Erwachen 3 Uhr', 'Gereiztheit', 'Genussmittelüberdruss'],
        description: 'Klassisches Hauptmittel für gestresste, überarbeitete Personen mit Magen-Darm-Beschwerden.',
      },
    ],
    initialPrescription: {
      remedy: 'Nux vomica',
      potency: 'C200',
      dosage: '3 Globuli einmalig',
      recommendations: 'Verordnung nach der Erstanamnese — bleibt dauerhaft erhalten und wird von Verlaufskontrollen nicht überschrieben.\nEinmalige Einnahme abends vor dem Schlafen. Kaffeekonsum nach Möglichkeit reduzieren.',
      prescribedAt: '2026-08-05T15:30:00Z',
    },
    followUps: [
      {
        id: 'fu-301',
        createdAt: '2026-08-20T18:30:00Z',
        dateDisplay: 'Donnerstag, 20. August 2026, 18:30 Uhr',
        trend: 'Leicht gebessert',
        intensityPrevious: 4,
        intensityCurrent: 2,
        befindenVerlauf: 'Schläft deutlich ruhiger, wacht erst gegen 06:00 Uhr auf. Magendrücken nur noch an Tagen mit extremen Meetings. Stimmung ist ausgeglichener.',
        remedyRecommendations: 'Nux vomica C30 bei akutem Wiederauftreten von Stresskrämpfen bereitstellen (max 1x wöchentlich).',
      },
    ],
  },
  {
    id: 'case-4',
    therapistId: 'th-101',
    patientName: 'Lukas Schneider',
    patientAge: 29,
    patientBirthDate: '1997-09-11',
    patientGender: 'männlich',
    patientHeightCm: 182,
    patientWeightKg: 78,
    patientMaritalStatus: 'ledig',
    patientEmail: 'l.schneider@mail.com',
    patientPhone: '+49 152 3344556',
    isPregnant: false,
    hasChildren: false,
    anamneseDatum: '2026-08-28',
    hauptbeschwerde: 'Plötzlich einschießendes hohes Fieber (39.5°C) mit pochenden Kopfschmerzen.',
    spontanbericht: 'Nach kaltem Ostwind plötzlich erkrankt. Gesicht hochrot und heiß, Hände/Füße eher kühl.',
    modalitaetenBesser: 'Absolute Ruhe im Bett, aufrechte Position.',
    modalitaetenSchlechter: 'Geringste Erschütterung, helles Licht, Zugluft, Berührung.',
    gemuetPsyche: 'Verwirrt bei Fieber, schreckhaft, unruhig im Halbschlaf.',
    koerperAllgemein: 'Trockene Hitze, kaum Schweiß, kein Durst trotz hohem Fieber.',
    lokalsymptome: 'Pochende Halsschlagadern, hochroter Rachenring.',
    bisherigeMittel: 'Paracetamol 500mg vor 2 Stunden.',
    analyzedAt: '2026-08-28T18:00:00Z',
    remedySuggestions: [
      {
        name: 'Belladonna',
        potency: 'C30',
        score: 95,
        keyIndicators: ['Plötzlicher Beginn', 'Hochrotes Gesicht', 'Pochende Schmerzen', 'Kein Durst bei Hitze'],
        description: 'Hauptakutmittel bei plötzlichem Beginn mit starker Gefäßüberfüllung und Hitze.',
      },
    ],
    initialPrescription: {
      remedy: 'Belladonna',
      potency: 'C30',
      dosage: '3 Globuli alle 3 Stunden (bis zu 3x)',
      recommendations: 'Verordnung nach der Erstanamnese — bleibt dauerhaft erhalten und wird von Verlaufskontrollen nicht überschrieben.\nBei Schweißausbruch oder Besserung sofort absetzen.',
      prescribedAt: '2026-08-28T18:30:00Z',
    },
  },
];

// Packages & Tariffs
export function getPackagePlans(): PackagePlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PACKAGES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(INITIAL_PACKAGE_PLANS));
      return INITIAL_PACKAGE_PLANS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PACKAGE_PLANS;
  }
}

export function savePackagePlans(plans: PackagePlan[]): void {
  localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(plans));
  window.dispatchEvent(new Event('homoeo_packages_updated'));
}

export function createPackagePlan(data: Omit<PackagePlan, 'id' | 'createdAt'>): PackagePlan {
  const current = getPackagePlans();
  const newPlan: PackagePlan = {
    ...data,
    id: 'pkg-' + Date.now(),
    createdAt: new Date().toISOString(),
  };

  // If set as default, unset others
  let updatedList = current;
  if (newPlan.isDefault) {
    updatedList = updatedList.map(p => ({ ...p, isDefault: false }));
  }

  const updated = [...updatedList, newPlan];
  savePackagePlans(updated);
  return newPlan;
}

export function updatePackagePlan(id: string, updates: Partial<PackagePlan>): PackagePlan | null {
  const current = getPackagePlans();
  const index = current.findIndex(p => p.id === id);
  if (index === -1) return null;

  let updatedList = [...current];
  if (updates.isDefault) {
    updatedList = updatedList.map(p => ({ ...p, isDefault: false }));
  }

  const updatedItem: PackagePlan = {
    ...updatedList[index],
    ...updates,
  };

  updatedList[index] = updatedItem;
  savePackagePlans(updatedList);
  return updatedItem;
}

export function deletePackagePlan(id: string): boolean {
  const current = getPackagePlans();
  if (current.length <= 1) {
    return false; // Prevent deleting the last remaining package
  }
  const filtered = current.filter(p => p.id !== id);
  // If deleted was default, make the first one default
  if (filtered.length > 0 && !filtered.some(p => p.isDefault)) {
    filtered[0].isDefault = true;
  }
  savePackagePlans(filtered);
  return true;
}

export function assignPackageToTherapist(therapistId: string, packageId: string, resetUsage: boolean = false): Therapist | null {
  const packages = getPackagePlans();
  const targetPlan = packages.find(p => p.id === packageId) || INITIAL_PACKAGE_PLANS[0];
  
  const currentTherapists = getTherapists();
  const therapist = currentTherapists.find(t => t.id === therapistId);
  if (!therapist) return null;

  const maxAnalyses = targetPlan.isUnlimited ? 999999 : targetPlan.maxAnalyses;
  const usedAnalyses = resetUsage ? 0 : therapist.usedAnalyses;
  
  let newStatus: 'active' | 'limit_reached' | 'upgraded' = 'active';
  if (targetPlan.isUnlimited) {
    newStatus = 'upgraded';
  } else if (usedAnalyses >= maxAnalyses) {
    newStatus = 'limit_reached';
  }

  return updateTherapist(therapistId, {
    tarif: targetPlan.id,
    tarifId: targetPlan.id,
    tarifLabel: targetPlan.name,
    tarifPrice: targetPlan.price,
    tarifPeriod: targetPlan.billingPeriod,
    isUnlimited: targetPlan.isUnlimited,
    maxAnalyses,
    usedAnalyses,
    status: newStatus,
  });
}

export function getTherapists(): Therapist[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THERAPISTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.THERAPISTS, JSON.stringify(INITIAL_THERAPISTS));
      return INITIAL_THERAPISTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_THERAPISTS;
  }
}

export function saveTherapists(therapists: Therapist[]): void {
  localStorage.setItem(STORAGE_KEYS.THERAPISTS, JSON.stringify(therapists));
  window.dispatchEvent(new Event('homoeo_storage_updated'));
}

export function createTherapist(data: Omit<Therapist, 'id' | 'tarif' | 'tarifLabel' | 'usedAnalyses' | 'maxAnalyses' | 'registeredAt' | 'status'> & { initialPackageId?: string }): Therapist {
  const current = getTherapists();
  const packages = getPackagePlans();
  const initialPlan = (data.initialPackageId && packages.find(p => p.id === data.initialPackageId)) || 
                      packages.find(p => p.isDefault) || 
                      INITIAL_PACKAGE_PLANS[0];

  const maxAnalyses = initialPlan.isUnlimited ? 999999 : initialPlan.maxAnalyses;
  const isPro = initialPlan.isUnlimited;

  const newTherapist: Therapist = {
    vorname: data.vorname,
    nachname: data.nachname,
    praxisName: data.praxisName,
    email: data.email,
    password: data.password || 'homoeo2025!',
    telefon: data.telefon,
    adresse: data.adresse,
    land: data.land,
    preferredLanguage: data.preferredLanguage,
    notes: data.notes,
    id: 'th-' + Date.now(),
    tarif: initialPlan.id,
    tarifId: initialPlan.id,
    tarifLabel: initialPlan.name,
    tarifPrice: initialPlan.price,
    tarifPeriod: initialPlan.billingPeriod,
    isUnlimited: initialPlan.isUnlimited,
    usedAnalyses: 0,
    maxAnalyses,
    registeredAt: new Date().toISOString(),
    status: isPro ? 'upgraded' : 'active',
  };
  
  const updated = [newTherapist, ...current];
  saveTherapists(updated);
  setActiveTherapistId(newTherapist.id);
  return newTherapist;
}

export function updateTherapist(id: string, updates: Partial<Therapist>): Therapist | null {
  const current = getTherapists();
  const index = current.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  const oldItem = current[index];
  
  // Track previous email if changed and valid
  let updatedPreviousEmails = updates.previousEmails ? [...updates.previousEmails] : (oldItem.previousEmails ? [...oldItem.previousEmails] : []);
  if (updates.email && updates.email.trim().toLowerCase() !== oldItem.email.trim().toLowerCase()) {
    const alreadyLogged = updatedPreviousEmails.some(e => e.value.toLowerCase() === oldItem.email.toLowerCase());
    if (!alreadyLogged && oldItem.email.trim()) {
      updatedPreviousEmails = [
        ...updatedPreviousEmails,
        { value: oldItem.email.trim(), changedAt: new Date().toISOString() }
      ];
    }
  }

  // Track previous phone if changed and valid
  let updatedPreviousPhones = updates.previousPhones ? [...updates.previousPhones] : (oldItem.previousPhones ? [...oldItem.previousPhones] : []);
  if (updates.telefon && updates.telefon.trim() !== oldItem.telefon.trim()) {
    const alreadyLogged = updatedPreviousPhones.some(p => p.value.trim() === oldItem.telefon.trim());
    if (!alreadyLogged && oldItem.telefon.trim()) {
      updatedPreviousPhones = [
        ...updatedPreviousPhones,
        { value: oldItem.telefon.trim(), changedAt: new Date().toISOString() }
      ];
    }
  }

  const updatedItem: Therapist = {
    ...oldItem,
    ...updates,
    previousEmails: updatedPreviousEmails,
    previousPhones: updatedPreviousPhones,
  };
  
  const isUnlimited = updatedItem.isUnlimited || updatedItem.tarif === 'pro_unlimited' || updatedItem.maxAnalyses >= 900000;

  if (isUnlimited) {
    updatedItem.status = 'upgraded';
  } else if (updatedItem.usedAnalyses >= updatedItem.maxAnalyses) {
    updatedItem.status = 'limit_reached';
  } else if (updatedItem.usedAnalyses < updatedItem.maxAnalyses && updatedItem.status === 'limit_reached') {
    updatedItem.status = 'active';
  }

  current[index] = updatedItem;
  saveTherapists(current);
  return updatedItem;
}

export function deleteTherapist(id: string): void {
  const current = getTherapists().filter(t => t.id !== id);
  saveTherapists(current);
  
  const activeId = getActiveTherapistId();
  if (activeId === id) {
    if (current.length > 0) {
      setActiveTherapistId(current[0].id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_THERAPIST);
    }
  }
}

export function getActiveTherapistId(): string | null {
  const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_THERAPIST);
  if (stored) return stored;
  return null;
}

export function setActiveTherapistId(id: string): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_THERAPIST, id);
  window.dispatchEvent(new Event('homoeo_active_therapist_changed'));
}

export function getActiveTherapist(): Therapist | null {
  const id = getActiveTherapistId();
  if (!id) return null;
  const list = getTherapists();
  return list.find(t => t.id === id) || null;
}

export function authenticateTherapist(email: string, password: string): {
  success: boolean;
  therapist?: Therapist;
  error?: 'not_found' | 'invalid_password' | 'missing_fields';
} {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: 'missing_fields' };
  }

  const therapists = getTherapists();
  const therapist = therapists.find(t => t.email.trim().toLowerCase() === cleanEmail);

  if (!therapist) {
    return { success: false, error: 'not_found' };
  }

  const expectedPassword = therapist.password || 'homoeo2025!';
  if (therapist.password && therapist.password === cleanPassword) {
    setActiveTherapistId(therapist.id);
    return { success: true, therapist };
  } else if (!therapist.password && cleanPassword === 'homoeo2025!') {
    setActiveTherapistId(therapist.id);
    return { success: true, therapist };
  }

  return { success: false, error: 'invalid_password' };
}

export function incrementAnalysesUsed(therapistId: string): { success: boolean; remaining: number; therapist: Therapist | null } {
  const current = getTherapists();
  const index = current.findIndex(t => t.id === therapistId);
  if (index === -1) return { success: false, remaining: 0, therapist: null };
  
  const therapist = current[index];
  const isUnlimited = therapist.isUnlimited || therapist.tarif === 'pro_unlimited' || therapist.maxAnalyses >= 900000;
  
  // If not unlimited and already reached max
  if (!isUnlimited && therapist.usedAnalyses >= therapist.maxAnalyses) {
    return {
      success: false,
      remaining: 0,
      therapist,
    };
  }
  
  const newCount = therapist.usedAnalyses + 1;
  const newStatus = (!isUnlimited && newCount >= therapist.maxAnalyses) ? 'limit_reached' : (isUnlimited ? 'upgraded' : 'active');
  
  const updated: Therapist = {
    ...therapist,
    usedAnalyses: newCount,
    status: newStatus,
  };
  
  current[index] = updated;
  saveTherapists(current);
  
  const remaining = isUnlimited ? 999999 : Math.max(0, updated.maxAnalyses - updated.usedAnalyses);
  return { success: true, remaining, therapist: updated };
}

export function resetTherapistQuota(therapistId: string): Therapist | null {
  return updateTherapist(therapistId, {
    usedAnalyses: 0,
    status: 'active',
  });
}

export function upgradeTherapistToPro(therapistId: string): Therapist | null {
  return assignPackageToTherapist(therapistId, 'pro_unlimited', false);
}

// Cases
export function getPatientCases(therapistId?: string): PatientCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CASES);
    let list: PatientCase[] = raw ? JSON.parse(raw) : INITIAL_CASES;
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(INITIAL_CASES));
    }
    if (therapistId) {
      list = list.filter(c => c.therapistId === therapistId);
    }
    return list;
  } catch {
    return INITIAL_CASES;
  }
}

export function savePatientCase(caseData: Omit<PatientCase, 'id'> & { id?: string }): PatientCase {
  const all = getPatientCases();
  const id = caseData.id || 'case-' + Date.now();
  const newOrUpdated: PatientCase = {
    ...caseData,
    id,
  };
  
  const existingIdx = all.findIndex(c => c.id === id);
  if (existingIdx >= 0) {
    all[existingIdx] = newOrUpdated;
  } else {
    all.unshift(newOrUpdated);
  }
  
  localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(all));
  window.dispatchEvent(new Event('homoeo_cases_updated'));
  return newOrUpdated;
}

export function deletePatientCase(caseId: string): void {
  const all = getPatientCases().filter(c => c.id !== caseId);
  localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(all));
  window.dispatchEvent(new Event('homoeo_cases_updated'));
}

export function addFollowUpToCase(caseId: string, followUpData: Omit<FollowUpEntry, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): FollowUpEntry | null {
  const all = getPatientCases();
  const caseIdx = all.findIndex(c => c.id === caseId);
  if (caseIdx === -1) return null;

  const newEntry: FollowUpEntry = {
    ...followUpData,
    id: followUpData.id || 'fu-' + Date.now(),
    createdAt: followUpData.createdAt || new Date().toISOString(),
  };

  const existingFollowUps = all[caseIdx].followUps || [];
  all[caseIdx] = {
    ...all[caseIdx],
    followUps: [newEntry, ...existingFollowUps],
  };

  localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(all));
  window.dispatchEvent(new Event('homoeo_cases_updated'));
  return newEntry;
}

export function updateFollowUpInCase(caseId: string, followUpId: string, updates: Partial<FollowUpEntry>): FollowUpEntry | null {
  const all = getPatientCases();
  const caseIdx = all.findIndex(c => c.id === caseId);
  if (caseIdx === -1) return null;

  const currentCase = all[caseIdx];
  const followUps = currentCase.followUps || [];
  const fuIdx = followUps.findIndex(f => f.id === followUpId);
  if (fuIdx === -1) return null;

  const updatedEntry: FollowUpEntry = {
    ...followUps[fuIdx],
    ...updates,
  };

  const updatedFollowUps = [...followUps];
  updatedFollowUps[fuIdx] = updatedEntry;

  all[caseIdx] = {
    ...currentCase,
    followUps: updatedFollowUps,
  };

  localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(all));
  window.dispatchEvent(new Event('homoeo_cases_updated'));
  return updatedEntry;
}

export function deleteFollowUpFromCase(caseId: string, followUpId: string): boolean {
  const all = getPatientCases();
  const caseIdx = all.findIndex(c => c.id === caseId);
  if (caseIdx === -1) return false;

  const currentCase = all[caseIdx];
  const followUps = currentCase.followUps || [];
  const filtered = followUps.filter(f => f.id !== followUpId);

  all[caseIdx] = {
    ...currentCase,
    followUps: filtered,
  };

  localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(all));
  window.dispatchEvent(new Event('homoeo_cases_updated'));
  return true;
}

export function updateInitialPrescriptionInCase(caseId: string, prescription: InitialPrescription): boolean {
  const all = getPatientCases();
  const caseIdx = all.findIndex(c => c.id === caseId);
  if (caseIdx === -1) return false;

  all[caseIdx] = {
    ...all[caseIdx],
    initialPrescription: {
      ...prescription,
      prescribedAt: prescription.prescribedAt || new Date().toISOString(),
    },
  };

  localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(all));
  window.dispatchEvent(new Event('homoeo_cases_updated'));
  return true;
}

export function updatePatientStammdatenAcrossCases(therapistId: string, patientName: string, updates: Partial<PatientCase>): void {
  const all = getPatientCases();
  let modified = false;

  const updatedAll = all.map(c => {
    if (c.therapistId === therapistId && c.patientName.trim().toLowerCase() === patientName.trim().toLowerCase()) {
      modified = true;
      return {
        ...c,
        ...updates,
      };
    }
    return c;
  });

  if (modified) {
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(updatedAll));
    window.dispatchEvent(new Event('homoeo_cases_updated'));
  }
}

// Admin Auth State
export function isAdminLoggedIn(): boolean {
  return localStorage.getItem(STORAGE_KEYS.ADMIN_LOGGED_IN) === 'true';
}

export function setAdminLoggedIn(loggedIn: boolean): void {
  if (loggedIn) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_LOGGED_IN, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_LOGGED_IN);
  }
  window.dispatchEvent(new Event('homoeo_admin_auth_changed'));
}

export function resetAllToSampleData(): void {
  localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(INITIAL_PACKAGE_PLANS));
  localStorage.setItem(STORAGE_KEYS.THERAPISTS, JSON.stringify(INITIAL_THERAPISTS));
  localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(INITIAL_CASES));
  localStorage.setItem(STORAGE_KEYS.TERMS, JSON.stringify(DEFAULT_TERMS));
  localStorage.setItem(STORAGE_KEYS.ACTIVE_THERAPIST, INITIAL_THERAPISTS[0].id);
  localStorage.setItem(STORAGE_KEYS.ADMIN_CREDENTIALS, JSON.stringify(DEFAULT_ADMIN_CREDENTIALS));
  window.dispatchEvent(new Event('homoeo_packages_updated'));
  window.dispatchEvent(new Event('homoeo_storage_updated'));
  window.dispatchEvent(new Event('homoeo_active_therapist_changed'));
  window.dispatchEvent(new Event('homoeo_cases_updated'));
  window.dispatchEvent(new Event('homoeo_terms_updated'));
  window.dispatchEvent(new Event('homoeo_admin_credentials_changed'));
}

// Terms & Conditions (AGB)
export function getTermsAndConditions(lang: LanguageCode = 'de'): TermsAndConditions {
  try {
    const key = `${STORAGE_KEYS.TERMS}_${lang}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
    // Backward compatibility for German stored in base key
    if (lang === 'de') {
      const baseRaw = localStorage.getItem(STORAGE_KEYS.TERMS);
      if (baseRaw) return JSON.parse(baseRaw);
    }
    return getDefaultTermsForLanguage(lang);
  } catch {
    return getDefaultTermsForLanguage(lang);
  }
}

export function saveTermsAndConditions(terms: TermsAndConditions, lang: LanguageCode = 'de'): void {
  const key = `${STORAGE_KEYS.TERMS}_${lang}`;
  localStorage.setItem(key, JSON.stringify(terms));
  if (lang === 'de') {
    localStorage.setItem(STORAGE_KEYS.TERMS, JSON.stringify(terms));
  }
  window.dispatchEvent(new Event('homoeo_terms_updated'));
}

export function resetTermsAndConditionsToDefault(lang: LanguageCode = 'de'): TermsAndConditions {
  const defaultVal = getDefaultTermsForLanguage(lang);
  const key = `${STORAGE_KEYS.TERMS}_${lang}`;
  localStorage.setItem(key, JSON.stringify(defaultVal));
  if (lang === 'de') {
    localStorage.setItem(STORAGE_KEYS.TERMS, JSON.stringify(defaultVal));
  }
  window.dispatchEvent(new Event('homoeo_terms_updated'));
  return defaultVal;
}

// Name Change Requests
export function getNameChangeRequests(): NameChangeRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NAME_CHANGE_REQUESTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveNameChangeRequests(requests: NameChangeRequest[]): void {
  localStorage.setItem(STORAGE_KEYS.NAME_CHANGE_REQUESTS, JSON.stringify(requests));
  window.dispatchEvent(new Event('homoeo_name_change_requests_updated'));
}

export function addNameChangeRequest(requestData: Omit<NameChangeRequest, 'id' | 'status' | 'createdAt'>): void {
  const current = getNameChangeRequests();
  const newReq: NameChangeRequest = {
    ...requestData,
    id: 'ncr-' + Date.now(),
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  saveNameChangeRequests([...current, newReq]);
}

export function updateNameChangeRequestStatus(id: string, status: 'approved' | 'rejected'): void {
  const current = getNameChangeRequests();
  const index = current.findIndex(r => r.id === id);
  if (index !== -1) {
    const req = current[index];
    req.status = status;
    req.resolvedAt = new Date().toISOString();
    
    if (status === 'approved') {
      // update therapist
      const therapists = getTherapists();
      const tIndex = therapists.findIndex(t => t.id === req.therapistId);
      if (tIndex !== -1) {
        const therapist = therapists[tIndex];
        const oldNameStr = `${therapist.vorname} ${therapist.nachname}`;
        
        therapist.vorname = req.requestedVorname;
        therapist.nachname = req.requestedNachname;
        
        if (!therapist.previousNames) therapist.previousNames = [];
        therapist.previousNames.push({
          value: oldNameStr,
          changedAt: new Date().toISOString()
        });
        
        saveTherapists(therapists);
      }
    }
    
    saveNameChangeRequests(current);
  }
}
