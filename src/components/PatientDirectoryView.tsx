import React, { useState, useMemo } from 'react';
import { Therapist, PatientCase, FollowUpEntry } from '../types';
import { 
  getPatientCases, 
  savePatientCase, 
  updatePatientStammdatenAcrossCases,
  getRecentlyEditedPatientNames
} from '../services/storage';
import { useTranslation } from '../i18n/LanguageContext';
import { VoiceInputButton } from './VoiceInputButton';
import { StammdatenModal } from './StammdatenModal';
import { 
  Users, 
  Search, 
  FileText, 
  Plus, 
  Edit3, 
  Activity, 
  CheckCircle2, 
  Mail, 
  Phone, 
  ArrowRight, 
  X, 
  ShieldCheck,
  Calendar,
  Sparkles,
  Pill,
  Clock
} from 'lucide-react';

interface PatientDirectoryViewProps {
  therapist: Therapist;
  onOpenCaseInWorkspace: (patientCase: PatientCase) => void;
  onNewCaseForPatient?: (patientName: string, stammdatenDefaults?: Partial<PatientCase>) => void;
}

interface GroupedPatient {
  key: string;
  name: string;
  cases: PatientCase[];
  primaryCase: PatientCase;
  totalFollowUps: number;
  latestFollowUp?: FollowUpEntry;
}

// Helper to split full name into first and last name cleanly
function parsePatientName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: '—', lastName: '—' };
  const trimmed = fullName.trim();
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(s => s.trim());
    return { lastName: parts[0] || '—', firstName: parts.slice(1).join(' ') || '—' };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '—' };
  }
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, parts.length - 1).join(' ');
  return { firstName, lastName };
}

// Helper to format the relative/absolute last edit timestamp with full i18n
function formatLastActivity(timestamp: number, language: string, t: (key: any) => string): string {
  if (!timestamp || timestamp <= 0) return '';
  const now = Date.now();
  const diffMs = now - timestamp;
  if (diffMs < 0) return '';
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 2) return t('justNow');
  if (diffMinutes < 60) return `${diffMinutes} ${t('minutesAgo')}`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ${t('hoursAgo')}`;

  try {
    return new Date(timestamp).toLocaleDateString(language, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return new Date(timestamp).toISOString().split('T')[0];
  }
}

export const PatientDirectoryView: React.FC<PatientDirectoryViewProps> = ({
  therapist,
  onOpenCaseInWorkspace,
  onNewCaseForPatient,
}) => {
  const { t, language } = useTranslation();
  const [cases, setCases] = useState<PatientCase[]>(() => getPatientCases(therapist.id));
  const [recentEditsRev, setRecentEditsRev] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientKey, setSelectedPatientKey] = useState<string | null>(null);
  const [activeCaseTabId, setActiveCaseTabId] = useState<string | null>(null);
  
  // Patient / Customer Selection Modal
  const [isSelectPatientModalOpen, setIsSelectPatientModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // Modals & Editors
  const [isEditStammdatenOpen, setIsEditStammdatenOpen] = useState(false);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

  const refreshData = () => {
    const updated = getPatientCases(therapist.id);
    setCases(updated);
  };

  React.useEffect(() => {
    const handleCasesUpdated = () => {
      refreshData();
    };
    const handlePatientEdited = () => {
      setRecentEditsRev(r => r + 1);
    };
    window.addEventListener('homoeo_cases_updated', handleCasesUpdated);
    window.addEventListener('homoeo_patient_edited', handlePatientEdited);
    return () => {
      window.removeEventListener('homoeo_cases_updated', handleCasesUpdated);
      window.removeEventListener('homoeo_patient_edited', handlePatientEdited);
    };
  }, [therapist.id]);

  const handleSaveNewPatient = (data: Partial<PatientCase>) => {
    const newCaseId = 'case-' + Date.now();
    const isFemale = (data.patientGender || 'weiblich') === 'weiblich';
    const created = savePatientCase({
      therapistId: therapist.id,
      patientName: data.patientName?.trim() || '',
      patientBirthDate: data.patientBirthDate || '',
      patientAge: data.patientAge,
      patientGender: data.patientGender || 'weiblich',
      patientHeightCm: data.patientHeightCm,
      patientWeightKg: data.patientWeightKg,
      patientMaritalStatus: data.patientMaritalStatus || '',
      anamneseDatum: data.anamneseDatum || new Date().toISOString().split('T')[0],
      patientEmail: data.patientEmail || '',
      patientPhone: data.patientPhone || '',
      isPregnant: isFemale ? !!data.isPregnant : false,
      pregnancyMonth: isFemale && data.isPregnant ? data.pregnancyMonth : undefined,
      hasChildren: !!data.hasChildren,
      childrenCount: data.hasChildren ? (data.childrenList?.length || 0) : 0,
      childrenList: data.hasChildren ? (data.childrenList ? [...data.childrenList] : []) : [],
      customStammdaten: data.customStammdaten ? [...data.customStammdaten] : [],
      hauptbeschwerde: '',
      anamnesisQuestions: [],
      spontanbericht: '',
      modalitaetenBesser: '',
      modalitaetenSchlechter: '',
      gemuetPsyche: '',
      koerperAllgemein: '',
      lokalsymptome: '',
      bisherigeMittel: '',
      id: newCaseId,
    });
    setIsNewPatientModalOpen(false);
    refreshData();
    if (data.patientName) {
      setSelectedPatientKey(data.patientName.trim().toLowerCase());
      setActiveCaseTabId(created.id || newCaseId);
    }
  };

  const getGenderLabel = (gender?: string) => {
    if (!gender) return '—';
    switch (gender) {
      case 'weiblich': return t('genderFemale');
      case 'männlich': return t('genderMale');
      case 'divers': return t('genderOther');
      default: return gender;
    }
  };

  const getMaritalStatusLabel = (status?: string) => {
    if (!status) return '';
    switch (status) {
      case 'ledig': return t('maritalSingle');
      case 'verheiratet': return t('maritalMarried');
      case 'in Partnerschaft': return t('maritalPartnership');
      case 'geschieden': return t('maritalDivorced');
      case 'getrennt lebend': return t('maritalSeparated');
      case 'verwitwet': return t('maritalWidowed');
      case 'sonstiges': return t('maritalOther');
      default: return status;
    }
  };

  // Group cases by patient identity (case-insensitive name)
  const groupedPatients = useMemo<GroupedPatient[]>(() => {
    const map = new Map<string, PatientCase[]>();

    cases.forEach(c => {
      const cleanName = (c.patientName || t('patientNameLabel') || 'Patient').trim();
      const key = cleanName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(c);
    });

    const result: GroupedPatient[] = [];
    map.forEach((patientCases, key) => {
      const sortedCases = [...patientCases].sort((a, b) => {
        const da = new Date(a.anamneseDatum || a.analyzedAt || 0).getTime();
        const db = new Date(b.anamneseDatum || b.analyzedAt || 0).getTime();
        return db - da;
      });

      const primaryCase = sortedCases[0];
      const allFollowUps = sortedCases.flatMap(c => c.followUps || []);
      const totalFollowUps = allFollowUps.length;

      const sortedFollowUps = [...allFollowUps].sort((a, b) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      result.push({
        key,
        name: primaryCase.patientName || t('patientNameLabel') || 'Patient',
        cases: sortedCases,
        primaryCase,
        totalFollowUps,
        latestFollowUp: sortedFollowUps[0],
      });
    });

    return result.sort((a, b) => a.name.localeCompare(b.name, language));
  }, [cases, language, t]);

  // Filter patients based on search
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedPatients;
    }
    const q = searchQuery.toLowerCase().trim();
    return groupedPatients.filter(p => {
      const { firstName, lastName } = parsePatientName(p.name);
      if (p.name.toLowerCase().includes(q)) return true;
      if (firstName.toLowerCase().includes(q)) return true;
      if (lastName.toLowerCase().includes(q)) return true;
      if (p.primaryCase.patientEmail?.toLowerCase().includes(q)) return true;
      if (p.primaryCase.patientPhone?.toLowerCase().includes(q)) return true;
      if (p.primaryCase.patientBirthDate?.toLowerCase().includes(q)) return true;
      return p.cases.some(c => 
        (c.hauptbeschwerde && c.hauptbeschwerde.toLowerCase().includes(q)) ||
        (c.spontanbericht && c.spontanbericht.toLowerCase().includes(q)) ||
        (c.remedySuggestions && c.remedySuggestions.some(r => r.name.toLowerCase().includes(q)))
      );
    });
  }, [groupedPatients, searchQuery]);

  // Active patient based purely on explicit user selection
  const activePatient = useMemo(() => {
    if (!selectedPatientKey) return null;
    return groupedPatients.find(p => p.key === selectedPatientKey) || null;
  }, [groupedPatients, selectedPatientKey]);

  // Filter patients for the popup modal
  const modalFilteredPatients = useMemo(() => {
    if (!modalSearchQuery.trim()) return groupedPatients;
    const q = modalSearchQuery.toLowerCase().trim();
    return groupedPatients.filter(p => {
      const { firstName, lastName } = parsePatientName(p.name);
      if (p.name.toLowerCase().includes(q)) return true;
      if (firstName.toLowerCase().includes(q)) return true;
      if (lastName.toLowerCase().includes(q)) return true;
      if (p.primaryCase.patientBirthDate?.toLowerCase().includes(q)) return true;
      if (p.primaryCase.patientPhone?.toLowerCase().includes(q)) return true;
      if (p.primaryCase.patientEmail?.toLowerCase().includes(q)) return true;
      return p.cases.some(c => 
        (c.hauptbeschwerde && c.hauptbeschwerde.toLowerCase().includes(q)) ||
        (c.spontanbericht && c.spontanbericht.toLowerCase().includes(q))
      );
    });
  }, [groupedPatients, modalSearchQuery]);

  // Active selected case within the active patient
  const activeCase = useMemo(() => {
    if (!activePatient || activePatient.cases.length === 0) return null;
    if (activeCaseTabId) {
      const found = activePatient.cases.find(c => c.id === activeCaseTabId);
      if (found) return found;
    }
    return activePatient.cases[0];
  }, [activePatient, activeCaseTabId]);

  // Helper to compute patient's last edited/consulted timestamp
  const getPatientLastActivityTimestamp = (patient: GroupedPatient): number => {
    let latest = 0;
    
    // Check recorded edit timestamps in storage
    const recentList = getRecentlyEditedPatientNames();
    const found = recentList.find(r => r.name.toLowerCase() === patient.name.toLowerCase());
    if (found && found.timestamp > latest) {
      latest = found.timestamp;
    }

    // Check case timestamps
    for (const c of patient.cases) {
      if (c.updatedAt) {
        const time = new Date(c.updatedAt).getTime();
        if (!isNaN(time) && time > latest) latest = time;
      }
      if (c.analyzedAt) {
        const time = new Date(c.analyzedAt).getTime();
        if (!isNaN(time) && time > latest) latest = time;
      }
      if (c.therapyRecommendations?.updatedAt) {
        const time = new Date(c.therapyRecommendations.updatedAt).getTime();
        if (!isNaN(time) && time > latest) latest = time;
      }
      if (c.initialPrescription?.prescribedAt) {
        const time = new Date(c.initialPrescription.prescribedAt).getTime();
        if (!isNaN(time) && time > latest) latest = time;
      }
      if (c.followUps && c.followUps.length > 0) {
        for (const fu of c.followUps) {
          if (fu.createdAt) {
            const time = new Date(fu.createdAt).getTime();
            if (!isNaN(time) && time > latest) latest = time;
          }
        }
      }
      if (c.anamneseDatum) {
        const time = new Date(c.anamneseDatum).getTime();
        if (!isNaN(time) && time > latest) latest = time;
      }
    }
    return latest;
  };

  // 3 Most recently edited patients
  const recentEditedPatients = useMemo(() => {
    if (groupedPatients.length === 0) return [];
    
    const enriched = groupedPatients.map(p => {
      const timestamp = getPatientLastActivityTimestamp(p);
      return {
        ...p,
        lastActivityTimestamp: timestamp,
        lastActivityFormatted: formatLastActivity(timestamp, language, t)
      };
    });

    enriched.sort((a, b) => {
      if (b.lastActivityTimestamp !== a.lastActivityTimestamp) {
        return b.lastActivityTimestamp - a.lastActivityTimestamp;
      }
      return a.name.localeCompare(b.name, language);
    });

    return enriched.slice(0, 3);
  }, [groupedPatients, recentEditsRev, language, t]);

  // Open Stammdaten Editor Modal
  const handleOpenEditStammdaten = () => {
    if (!activePatient) return;
    setIsEditStammdatenOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-serif">{t('patientDirectoryTitle')}</h1>
              <p className="text-xs text-slate-500">
                {t('patientDirectorySubtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Actions & Stats */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-center">
              <span className="block text-xs font-bold text-slate-800">{groupedPatients.length}</span>
              <span className="block text-[10px] text-slate-400 font-medium">{t('patientsCountLabel')}</span>
            </div>
            <div className="bg-teal-50 border border-teal-200/60 px-3.5 py-1.5 rounded-xl text-center">
              <span className="block text-xs font-bold text-teal-800">{cases.length}</span>
              <span className="block text-[10px] text-teal-600 font-medium">{t('casesTotalLabel')}</span>
            </div>
          </div>

          <button
            type="button"
            id="btn-new-patient-directory-header"
            onClick={() => setIsNewPatientModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{t('btnNewPatientAdmission')}</span>
          </button>
        </div>
      </div>

      {/* 1. TOP SEARCH & QUICK CUSTOMER SWITCHER BAR (FULL WIDTH) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input with Voice */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPatientPlaceholder')}
              className="w-full pl-10 pr-20 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <VoiceInputButton
                value={searchQuery}
                onChange={(val) => setSearchQuery(val)}
                size="xs"
                mode="append"
              />
            </div>
          </div>

          {/* Quick Actions: Patientenauswahl & Auswahl aufheben */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setModalSearchQuery('');
                setIsSelectPatientModalOpen(true);
              }}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('btnOpenPatientSelectionModal')}</span>
            </button>

            {activePatient && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPatientKey(null);
                  setSearchQuery('');
                }}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
                title={t('unselectPatientBtn')}
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('switchPatient')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Search Suggestions Dropdown (when searching) */}
        {searchQuery.trim().length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>{t('patientsListHeader')} ({filteredPatients.length})</span>
              <span className="text-slate-400 font-normal text-[10px]">{t('clickOpensFileBadge')}</span>
            </div>

            {filteredPatients.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <Users className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                <p className="font-medium text-slate-600">{t('noPatientsFound')}</p>
                <p className="text-[11px] text-slate-400">{t('noPatientsFoundSub')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {filteredPatients.slice(0, 9).map((p) => {
                  const initials = p.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
                  const isCurActive = activePatient?.key === p.key;

                  return (
                    <div
                      key={p.key}
                      onClick={() => {
                        setSelectedPatientKey(p.key);
                        setSearchQuery('');
                      }}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                        isCurActive
                          ? 'bg-teal-50 border-teal-300 ring-1 ring-teal-200'
                          : 'bg-slate-50/70 border-slate-200 hover:border-teal-400 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {initials || 'P'}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-slate-900 text-xs truncate flex items-center gap-1">
                            <span>{p.name}</span>
                            {isCurActive && <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {p.primaryCase.patientAge ? `${p.primaryCase.patientAge} ${t('yearsOld')}` : ''}
                            {p.primaryCase.patientPhone ? ` • ${p.primaryCase.patientPhone}` : ''}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 shrink-0">
                        {p.cases.length} {p.cases.length === 1 ? t('caseSingle') : t('casePlural')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. MAIN PATIENT WORKSPACE (FULL WIDTH) */}
      {!activePatient ? (
        <div className="space-y-6">
          {/* Prompt card when no patient is active */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 mb-4 mx-auto shadow-2xs">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 font-serif mb-2">
              {t('selectPatientPrompt')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
              {t('selectPatientPromptSub')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                id="btn-new-patient-directory-empty"
                onClick={() => setIsNewPatientModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('btnNewPatientAdmission')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalSearchQuery('');
                  setIsSelectPatientModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <Users className="w-4 h-4 text-teal-600" />
                <span>{t('btnOpenPatientSelectionModal')}</span>
              </button>
            </div>
          </div>

          {/* Quick Picker: 3 most recently edited customers */}
          {recentEditedPatients.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>{t('recentEditedPatientsHeader')} ({recentEditedPatients.length})</span>
                </h4>

                <div className="flex items-center gap-3">
                  {groupedPatients.length > 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        setModalSearchQuery('');
                        setIsSelectPatientModalOpen(true);
                      }}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>{t('viewAllPatientsLink', { count: groupedPatients.length })}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span className="text-[11px] text-slate-400">{t('clickOpensFileBadge')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentEditedPatients.map((p) => {
                  const initials = p.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
                  const caseCount = p.cases.length;

                  return (
                    <div
                      key={p.key}
                      onClick={() => {
                        setSelectedPatientKey(p.key);
                        setSearchQuery('');
                      }}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-teal-400 hover:shadow-md transition-all cursor-pointer space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-teal-600 group-hover:bg-teal-700 text-white font-bold text-sm flex items-center justify-center shrink-0 transition-colors shadow-xs">
                            {initials || 'P'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors truncate">
                              {p.name}
                            </h4>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {p.primaryCase.patientAge && <span>{p.primaryCase.patientAge} {t('yearsOld')}</span>}
                              {p.primaryCase.patientGender && <span>• {getGenderLabel(p.primaryCase.patientGender)}</span>}
                            </div>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/60 shrink-0">
                          {caseCount} {caseCount === 1 ? t('caseSingle') : t('casePlural')}
                        </span>
                      </div>

                      {p.lastActivityFormatted && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                          <Clock className="w-3 h-3 text-teal-600 shrink-0" />
                          <span className="truncate">
                            {t('lastEdited')}: <strong className="font-semibold text-slate-700">{p.lastActivityFormatted}</strong>
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate">
                          {p.primaryCase.patientPhone || p.primaryCase.patientEmail || t('noContactData')}
                        </span>
                        <span className="text-teal-700 font-semibold flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
                          <span>{t('patientRecord')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. CUSTOMER / PATIENT HEADER & STAMMDATEN CARD (FULL WIDTH) */}
          <div className="w-full bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                  {activePatient.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'P'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900 font-serif">{activePatient.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                      {activePatient.cases.length === 1 
                        ? t('registeredCaseSingle') 
                        : t('registeredCases').replace('{count}', activePatient.cases.length.toString())}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('patientRecord')} • {t('lastConsultation')}: {activePatient.primaryCase.anamneseDatum ? new Date(activePatient.primaryCase.anamneseDatum).toLocaleDateString(language) : t('unknownDate')}
                  </p>
                </div>
              </div>

              {/* Actions: Stammdaten bearbeiten & Auswahl aufheben */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatientKey(null);
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title={t('unselectPatientBtn')}
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('switchPatient')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenEditStammdaten}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t('editMasterData')}</span>
                </button>
              </div>
            </div>

            {/* Structured Stammdaten Grid (Full Width) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-4 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 font-medium">{t('birthdateAndAge')}</span>
                <span className="font-semibold text-slate-800">
                  {activePatient.primaryCase.patientBirthDate || '—'} 
                  {activePatient.primaryCase.patientAge ? ` (${activePatient.primaryCase.patientAge} ${t('yearsOld')})` : ''}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 font-medium">{t('genderAndStatus')}</span>
                <span className="font-semibold text-slate-800">
                  {getGenderLabel(activePatient.primaryCase.patientGender)}
                  {activePatient.primaryCase.patientMaritalStatus ? ` • ${getMaritalStatusLabel(activePatient.primaryCase.patientMaritalStatus)}` : ''}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 font-medium">{t('heightAndWeight')}</span>
                <span className="font-semibold text-slate-800">
                  {activePatient.primaryCase.patientHeightCm ? `${activePatient.primaryCase.patientHeightCm} cm` : '—'} 
                  {activePatient.primaryCase.patientWeightKg ? ` / ${activePatient.primaryCase.patientWeightKg} kg` : ''}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="block text-[10px] text-slate-400 font-medium">{t('hasChildren')}</span>
                <span className="font-semibold text-slate-800">
                  {activePatient.primaryCase.hasChildren 
                    ? t('childrenCountLabel').replace('{count}', (activePatient.primaryCase.childrenCount || activePatient.primaryCase.childrenList?.length || 1).toString()) 
                    : t('noChildren')}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                <span className="block text-[10px] text-slate-400 font-medium">{t('contactData')}</span>
                <div className="flex flex-col gap-0.5 font-semibold text-slate-800 mt-0.5 truncate">
                  {activePatient.primaryCase.patientPhone && (
                    <a href={`tel:${activePatient.primaryCase.patientPhone}`} className="hover:text-teal-700 flex items-center gap-1 truncate text-[11px]">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{activePatient.primaryCase.patientPhone}</span>
                    </a>
                  )}
                  {activePatient.primaryCase.patientEmail && (
                    <a href={`mailto:${activePatient.primaryCase.patientEmail}`} className="hover:text-teal-700 flex items-center gap-1 truncate text-[11px]">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{activePatient.primaryCase.patientEmail}</span>
                    </a>
                  )}
                  {!activePatient.primaryCase.patientPhone && !activePatient.primaryCase.patientEmail && (
                    <span className="text-slate-400">{t('noContactData')}</span>
                  )}
                </div>
              </div>

              {/* Custom Stammdaten / Extra Fields */}
              {activePatient.primaryCase.customStammdaten && activePatient.primaryCase.customStammdaten.length > 0 && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2 sm:col-span-3 lg:col-span-5">
                  <span className="block text-[10px] text-slate-400 font-medium">{t('extraFields')}</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {activePatient.primaryCase.customStammdaten.map((cs) => (
                      <span key={cs.id} className="inline-block bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                        <strong className="text-slate-600">{cs.name}:</strong> {cs.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. CASES UNDER CUSTOMER (FULL WIDTH WITH RICH DETAILS & REPERTORISATION BUTTON) */}
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {t('casesOfPatient').replace('{count}', activePatient.cases.length.toString())}
                </h3>
              </div>

              {onNewCaseForPatient && (
                <button
                  type="button"
                  onClick={() => onNewCaseForPatient(activePatient.name, activePatient.primaryCase)}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('btnNewPatientAdmission')}</span>
                </button>
              )}
            </div>

            {activePatient.cases.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-700">{t('noCasesForPatient')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activePatient.cases.map((c, idx) => {
                  const caseNum = activePatient.cases.length - idx;
                  const dateFormatted = c.anamneseDatum 
                    ? new Date(c.anamneseDatum).toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' })
                    : t('unknownDate');

                  const hasModalities = !!(c.modalitaetenBesser?.trim() || c.modalitaetenSchlechter?.trim());
                  const hasNotes = !!(c.spontanbericht?.trim() || c.gemuetPsyche?.trim() || c.lokalsymptome?.trim() || c.koerperAllgemein?.trim());
                  const hasMedications = !!(c.medikamenteList && c.medikamenteList.length > 0) || !!c.bisherigeMittel?.trim();
                  const hasRemedies = !!(c.remedySuggestions && c.remedySuggestions.length > 0);

                  return (
                    <div
                      key={c.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
                    >
                      {/* Case Card Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="px-3 py-1 rounded-xl bg-teal-50 text-teal-900 border border-teal-200/80 font-bold text-xs">
                            {t('caseAdmission').replace('{num}', caseNum.toString())}
                          </span>
                          
                          <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{t('admissionOn').replace('{date}', dateFormatted)}</span>
                          </span>

                          {hasRemedies && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{t('fullyAnalyzed')}</span>
                            </span>
                          )}

                          {c.followUps && c.followUps.length > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium flex items-center gap-1">
                              <Activity className="w-3 h-3 text-teal-600" />
                              <span>{c.followUps.length} {c.followUps.length === 1 ? t('followUpSingle') : t('followUpPlural')}</span>
                            </span>
                          )}
                        </div>

                        {/* Button: Repertorisation with Arrow Right BEFORE the word */}
                        <button
                          type="button"
                          onClick={() => onOpenCaseInWorkspace(c)}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs shrink-0 self-start sm:self-auto"
                        >
                          <ArrowRight className="w-4 h-4" />
                          <span>{t('repertorisationBtn')}</span>
                        </button>
                      </div>

                      {/* Case Details Body */}
                      <div className="space-y-3 text-xs">
                        {/* Hauptbeschwerde */}
                        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-teal-600" />
                            <span>{t('caseChiefComplaint')}</span>
                          </span>
                          <p className="text-slate-900 text-sm font-medium leading-relaxed">
                            {c.hauptbeschwerde || t('noChiefComplaint')}
                          </p>
                        </div>

                        {/* Modalities, Symptoms & Medications Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {/* Modalitäten */}
                          {hasModalities && (
                            <div className="p-3 rounded-xl border border-slate-100 bg-white space-y-1.5 shadow-2xs">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                {t('caseModalities')}
                              </span>
                              {c.modalitaetenBesser && (
                                <div className="text-slate-700 text-[11px]">
                                  <strong className="text-emerald-700">{t('betterPrefix')}</strong> {c.modalitaetenBesser}
                                </div>
                              )}
                              {c.modalitaetenSchlechter && (
                                <div className="text-slate-700 text-[11px]">
                                  <strong className="text-rose-700">{t('worsePrefix')}</strong> {c.modalitaetenSchlechter}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Spontanbericht & Symptomnotizen */}
                          {hasNotes && (
                            <div className="p-3 rounded-xl border border-slate-100 bg-white space-y-1 shadow-2xs">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                {t('caseNotes')}
                              </span>
                              {c.spontanbericht && (
                                <p className="text-slate-700 text-[11px] line-clamp-3 leading-relaxed">
                                  {c.spontanbericht}
                                </p>
                              )}
                              {c.gemuetPsyche && !c.spontanbericht && (
                                <p className="text-slate-700 text-[11px] line-clamp-3 leading-relaxed">
                                  {c.gemuetPsyche}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Medikation & Bisherige Mittel */}
                          {hasMedications && (
                            <div className="p-3 rounded-xl border border-slate-100 bg-white space-y-1.5 shadow-2xs">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                                <Pill className="w-3 h-3 text-teal-600" />
                                <span>{t('caseMedications')}</span>
                              </span>
                              {c.medikamenteList && c.medikamenteList.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {c.medikamenteList.map((m, mIdx) => (
                                    <span key={mIdx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-medium">
                                      {m.name}{m.dosierung ? ` (${m.dosierung})` : ''}
                                    </span>
                                  ))}
                                </div>
                              ) : c.bisherigeMittel ? (
                                <p className="text-slate-700 text-[11px] line-clamp-2">
                                  {c.bisherigeMittel}
                                </p>
                              ) : null}
                            </div>
                          )}
                        </div>

                        {/* Top-Mittel / Repertorisations-Empfehlungen */}
                        {hasRemedies && (
                          <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-950">
                              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                              <span>{t('caseTopRemedies')}:</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {c.remedySuggestions?.slice(0, 4).map((r, rIdx) => (
                                <span
                                  key={rIdx}
                                  className="px-2.5 py-0.5 rounded-lg bg-white border border-teal-200 text-teal-900 font-bold text-xs shadow-2xs"
                                >
                                  {r.name} <span className="text-teal-600 font-normal">({r.score}%)</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT STAMMDATEN MODAL */}
      {activePatient && (
        <StammdatenModal
          isOpen={isEditStammdatenOpen}
          onClose={() => setIsEditStammdatenOpen(false)}
          initialData={activePatient.primaryCase}
          onSave={(data) => {
            updatePatientStammdatenAcrossCases(therapist.id, activePatient.name, data);
            setIsEditStammdatenOpen(false);
            refreshData();
          }}
        />
      )}

      {/* 5. PATIENT / CUSTOMER SELECTION POPUP MODAL */}
      {isSelectPatientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-50/50 to-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-serif">
                    {t('patientSelectionModalTitle')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('patientSelectionModalSubtitle')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectPatientModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder={t('searchCustomerModalPlaceholder')}
                  autoFocus
                  className="w-full pl-10 pr-20 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {modalSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setModalSearchQuery('')}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <VoiceInputButton
                    value={modalSearchQuery}
                    onChange={(val) => setModalSearchQuery(val)}
                    size="xs"
                    mode="append"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400">
                <span>{modalFilteredPatients.length} {t('patientsCountLabel')}</span>
                <span>{t('clickOpensFileBadge')}</span>
              </div>
            </div>

            {/* Patients Table */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {modalFilteredPatients.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-700 text-sm">{t('noPatientsFound')}</p>
                  <p className="text-xs text-slate-400 mt-1">{t('noPatientsFoundSub')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4">{t('colLastName')}</th>
                        <th className="py-3 px-4">{t('colFirstName')}</th>
                        <th className="py-3 px-4">{t('colBirthDate')}</th>
                        <th className="py-3 px-4">{t('colPhone')}</th>
                        <th className="py-3 px-3 text-center">{t('colCasesCount')}</th>
                        <th className="py-3 px-4 text-right">{t('colAction')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {modalFilteredPatients.map((p) => {
                        const { firstName, lastName } = parsePatientName(p.name);
                        const isSelected = activePatient?.key === p.key;

                        return (
                          <tr
                            key={p.key}
                            onClick={() => {
                              setSelectedPatientKey(p.key);
                              setActiveCaseTabId(p.cases[0].id);
                              setIsSelectPatientModalOpen(false);
                            }}
                            className={`cursor-pointer transition-colors group ${
                              isSelected 
                                ? 'bg-teal-50/80 font-medium' 
                                : 'hover:bg-teal-50/40'
                            }`}
                          >
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {lastName}
                            </td>
                            <td className="py-3 px-4 text-slate-800">
                              {firstName}
                            </td>
                            <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                              {p.primaryCase.patientBirthDate ? (
                                <span>
                                  {p.primaryCase.patientBirthDate}
                                  {p.primaryCase.patientAge ? ` (${p.primaryCase.patientAge} ${t('yearsOld')})` : ''}
                                </span>
                              ) : p.primaryCase.patientAge ? (
                                <span>{p.primaryCase.patientAge} {t('yearsOld')}</span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                              {p.primaryCase.patientPhone ? (
                                <span className="flex items-center gap-1.5">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{p.primaryCase.patientPhone}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                                {p.cases.length}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPatientKey(p.key);
                                  setActiveCaseTabId(p.cases[0].id);
                                  setIsSelectPatientModalOpen(false);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-teal-600 group-hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{t('btnSelectAndTransfer')}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                {modalFilteredPatients.length} {t('patientsListHeader')}
              </span>
              <button
                type="button"
                onClick={() => setIsSelectPatientModalOpen(false)}
                className="px-4 py-1.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer transition-colors"
              >
                {t('cancelBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PATIENT MODAL */}
      <StammdatenModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        initialData={{
          id: '',
          therapistId: therapist.id,
          patientName: '',
          patientGender: 'weiblich',
          anamneseDatum: new Date().toISOString().split('T')[0],
          hauptbeschwerde: '',
          spontanbericht: '',
          modalitaetenBesser: '',
          modalitaetenSchlechter: '',
          gemuetPsyche: '',
          koerperAllgemein: '',
          lokalsymptome: '',
          bisherigeMittel: '',
        }}
        onSave={handleSaveNewPatient}
      />
    </div>
  );
};
