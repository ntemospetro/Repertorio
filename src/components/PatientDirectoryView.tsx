import React, { useState, useMemo } from 'react';
import { Therapist, PatientCase, FollowUpEntry, InitialPrescription } from '../types';
import { 
  getPatientCases, 
  savePatientCase, 
  addFollowUpToCase, 
  updateFollowUpInCase, 
  deleteFollowUpFromCase, 
  updateInitialPrescriptionInCase, 
  updatePatientStammdatenAcrossCases 
} from '../services/storage';
import { useTranslation } from '../i18n/LanguageContext';
import { VoiceInputButton } from './VoiceInputButton';
import { StammdatenModal } from './StammdatenModal';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { 
  Users, 
  Search, 
  Calendar, 
  Clock, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle2, 
  Pill, 
  Stethoscope, 
  Sparkles, 
  Mail, 
  Phone, 
  ArrowUpRight, 
  X, 
  BarChart3, 
  Award,
  ShieldCheck
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

const TREND_STYLE_MAP: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  'Deutlich besser': { bg: 'bg-emerald-50 text-emerald-800', border: 'border-emerald-200', text: 'text-emerald-700', icon: TrendingUp },
  'Leicht gebessert': { bg: 'bg-teal-50 text-teal-800', border: 'border-teal-200', text: 'text-teal-700', icon: TrendingUp },
  'Unverändert': { bg: 'bg-slate-100 text-slate-700', border: 'border-slate-200', text: 'text-slate-600', icon: Minus },
  'Erstverschlimmerung': { bg: 'bg-amber-50 text-amber-800', border: 'border-amber-200', text: 'text-amber-700', icon: Activity },
  'Leicht verschlechtert': { bg: 'bg-orange-50 text-orange-800', border: 'border-orange-200', text: 'text-orange-700', icon: TrendingDown },
  'Deutlich schlechter': { bg: 'bg-rose-50 text-rose-800', border: 'border-rose-200', text: 'text-rose-700', icon: TrendingDown },
};

const TREND_KEY_MAP: Record<string, any> = {
  'Deutlich besser': 'trendMuchBetter',
  'Leicht gebessert': 'trendSlightlyBetter',
  'Unverändert': 'trendUnchanged',
  'Erstverschlimmerung': 'trendInitialWorsening',
  'Leicht verschlechtert': 'trendSlightlyWorse',
  'Deutlich schlechter': 'trendMuchWorse',
};

const TREND_OPTIONS: { id: string; key: any }[] = [
  { id: 'Deutlich besser', key: 'trendMuchBetter' },
  { id: 'Leicht gebessert', key: 'trendSlightlyBetter' },
  { id: 'Unverändert', key: 'trendUnchanged' },
  { id: 'Erstverschlimmerung', key: 'trendInitialWorsening' },
  { id: 'Leicht verschlechtert', key: 'trendSlightlyWorse' },
  { id: 'Deutlich schlechter', key: 'trendMuchWorse' },
];

function formatLocalizedDateTime(dateObj: Date, language: string): string {
  try {
    return dateObj.toLocaleDateString(language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateObj.toISOString();
  }
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

export const PatientDirectoryView: React.FC<PatientDirectoryViewProps> = ({
  therapist,
  onOpenCaseInWorkspace,
  onNewCaseForPatient,
}) => {
  const { t, language } = useTranslation();
  const [cases, setCases] = useState<PatientCase[]>(() => getPatientCases(therapist.id));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientKey, setSelectedPatientKey] = useState<string | null>(null);
  const [activeCaseTabId, setActiveCaseTabId] = useState<string | null>(null);
  
  // Patient / Customer Selection Modal
  const [isSelectPatientModalOpen, setIsSelectPatientModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // Modals & Editors
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [editingFollowUpId, setEditingFollowUpId] = useState<string | null>(null);
  const [isEditInitialPrescriptionOpen, setIsEditInitialPrescriptionOpen] = useState(false);
  const [isEditStammdatenOpen, setIsEditStammdatenOpen] = useState(false);

  // Follow-Up Form State
  const [fuDateDisplay, setFuDateDisplay] = useState('');
  const [fuTrend, setFuTrend] = useState<string>('Deutlich besser');
  const [fuIntensityPrev, setFuIntensityPrev] = useState<number>(3);
  const [fuIntensityCurr, setFuIntensityCurr] = useState<number>(1);
  const [fuBefinden, setFuBefinden] = useState('');
  const [fuRecommendations, setFuRecommendations] = useState('');
  const [fuNotes, setFuNotes] = useState('');

  // Initial Prescription Form State
  const [prescRemedy, setPrescRemedy] = useState('');
  const [prescPotency, setPrescPotency] = useState('');
  const [prescDosage, setPrescDosage] = useState('');
  const [prescRecommendations, setPrescRecommendations] = useState('');

  // Stammdaten Editor State
  const [editStamm, setEditStamm] = useState<Partial<PatientCase>>({});

  const refreshData = () => {
    const updated = getPatientCases(therapist.id);
    setCases(updated);
  };

  // Helper to translate trend
  const getTranslatedTrend = (trendStr: string) => {
    const key = TREND_KEY_MAP[trendStr];
    return key ? t(key as any) : trendStr;
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

  // Filter patients based on search and selection state (no patient data exposed before user interaction)
  const filteredPatients = useMemo(() => {
    const hasSearch = searchQuery.trim().length > 0;
    
    // If no search is entered and no patient is selected, keep list empty for privacy
    if (!hasSearch && !selectedPatientKey) {
      return [];
    }

    // If a patient is selected and no search term is entered, show ONLY the selected patient
    if (!hasSearch) {
      const selected = groupedPatients.find(p => p.key === selectedPatientKey);
      return selected ? [selected] : [];
    }

    const q = searchQuery.toLowerCase().trim();
    return groupedPatients.filter(p => {
      if (p.name.toLowerCase().includes(q)) return true;
      if (p.primaryCase.patientEmail?.toLowerCase().includes(q)) return true;
      if (p.primaryCase.patientPhone?.toLowerCase().includes(q)) return true;
      return p.cases.some(c => 
        (c.hauptbeschwerde && c.hauptbeschwerde.toLowerCase().includes(q)) ||
        (c.spontanbericht && c.spontanbericht.toLowerCase().includes(q)) ||
        (c.remedySuggestions && c.remedySuggestions.some(r => r.name.toLowerCase().includes(q)))
      );
    });
  }, [groupedPatients, searchQuery, selectedPatientKey]);

  // Active patient based purely on explicit user selection (no data pre-loaded)
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

  // Open Follow-up modal for creation
  const handleOpenNewFollowUp = () => {
    if (!activeCase) return;
    setEditingFollowUpId(null);
    setFuDateDisplay(formatLocalizedDateTime(new Date(), language));
    setFuTrend('Deutlich besser');
    
    const lastIntensity = activeCase.followUps && activeCase.followUps.length > 0
      ? (activeCase.followUps[0].intensityCurrent ?? 3)
      : 3;
    
    setFuIntensityPrev(Math.min(4, Math.max(1, lastIntensity)));
    setFuIntensityCurr(Math.min(4, Math.max(1, lastIntensity > 1 ? lastIntensity - 1 : 1)));
    setFuBefinden('');
    setFuRecommendations('');
    setFuNotes('');
    setIsFollowUpModalOpen(true);
  };

  // Open Follow-up modal for editing
  const handleOpenEditFollowUp = (fu: FollowUpEntry) => {
    setEditingFollowUpId(fu.id);
    setFuDateDisplay(fu.dateDisplay || formatLocalizedDateTime(new Date(fu.createdAt), language));
    setFuTrend(fu.trend || 'Deutlich besser');
    setFuIntensityPrev(Math.min(4, Math.max(1, fu.intensityPrevious ?? 3)));
    setFuIntensityCurr(Math.min(4, Math.max(1, fu.intensityCurrent ?? 1)));
    setFuBefinden(fu.befindenVerlauf || '');
    setFuRecommendations(fu.remedyRecommendations || '');
    setFuNotes(fu.notes || '');
    setIsFollowUpModalOpen(true);
  };

  // Save Follow-up
  const handleSaveFollowUp = () => {
    if (!activeCase) return;

    if (editingFollowUpId) {
      updateFollowUpInCase(activeCase.id, editingFollowUpId, {
        dateDisplay: fuDateDisplay,
        trend: fuTrend,
        intensityPrevious: fuIntensityPrev,
        intensityCurrent: fuIntensityCurr,
        befindenVerlauf: fuBefinden,
        remedyRecommendations: fuRecommendations,
        notes: fuNotes,
      });
    } else {
      addFollowUpToCase(activeCase.id, {
        dateDisplay: fuDateDisplay,
        trend: fuTrend,
        intensityPrevious: fuIntensityPrev,
        intensityCurrent: fuIntensityCurr,
        befindenVerlauf: fuBefinden,
        remedyRecommendations: fuRecommendations,
        notes: fuNotes,
      });
    }

    setIsFollowUpModalOpen(false);
    refreshData();
  };

  // Delete Follow-up
  const handleDeleteFollowUp = (fuId: string) => {
    if (!activeCase) return;
    const confirmMsg = t('deleteFollowUpConfirm') || 'Möchten Sie diese Verlaufskontrolle wirklich löschen?';
    if (window.confirm(confirmMsg)) {
      deleteFollowUpFromCase(activeCase.id, fuId);
      refreshData();
    }
  };

  // Open Initial Prescription Modal
  const handleOpenEditPrescription = () => {
    if (!activeCase) return;
    const existing = activeCase.initialPrescription;
    const topRemedy = activeCase.remedySuggestions && activeCase.remedySuggestions.length > 0 
      ? activeCase.remedySuggestions[0] 
      : null;

    setPrescRemedy(existing?.remedy || topRemedy?.name || '');
    setPrescPotency(existing?.potency || topRemedy?.potency || 'C200');
    setPrescDosage(existing?.dosage || '3 Globuli einmalig');
    setPrescRecommendations(
      existing?.recommendations || 
      `${t('initialPrescriptionNotice')}\n3 Globuli nüchtern auf der Zunge zergehen lassen.`
    );
    setIsEditInitialPrescriptionOpen(true);
  };

  // Save Initial Prescription
  const handleSavePrescription = () => {
    if (!activeCase) return;
    updateInitialPrescriptionInCase(activeCase.id, {
      remedy: prescRemedy,
      potency: prescPotency,
      dosage: prescDosage,
      recommendations: prescRecommendations,
      prescribedAt: activeCase.initialPrescription?.prescribedAt || new Date().toISOString(),
    });
    setIsEditInitialPrescriptionOpen(false);
    refreshData();
  };

  // Open Stammdaten Editor Modal
  const handleOpenEditStammdaten = () => {
    if (!activePatient) return;
    setEditStamm({
      patientName: activePatient.primaryCase.patientName,
      patientAge: activePatient.primaryCase.patientAge,
      patientBirthDate: activePatient.primaryCase.patientBirthDate,
      patientGender: activePatient.primaryCase.patientGender,
      patientHeightCm: activePatient.primaryCase.patientHeightCm,
      patientWeightKg: activePatient.primaryCase.patientWeightKg,
      patientMaritalStatus: activePatient.primaryCase.patientMaritalStatus,
      patientEmail: activePatient.primaryCase.patientEmail,
      patientPhone: activePatient.primaryCase.patientPhone,
      hasChildren: activePatient.primaryCase.hasChildren,
      childrenCount: activePatient.primaryCase.childrenCount,
      childrenList: activePatient.primaryCase.childrenList,
      customStammdaten: activePatient.primaryCase.customStammdaten,
    });
    setIsEditStammdatenOpen(true);
  };

  // Save Stammdaten across all cases of this patient
  const handleSaveStammdaten = () => {
    if (!activePatient) return;
    if (!editStamm.patientName?.trim()) {
      alert(t('noMasterDataMsg'));
      return;
    }
    updatePatientStammdatenAcrossCases(therapist.id, activePatient.name, editStamm);
    setIsEditStammdatenOpen(false);
    refreshData();
  };

  // Chart Data preparation
  const chartData = useMemo(() => {
    if (!activeCase) return [];

    const list: { name: string; date: string; intensity: number; trend: string; isInitial?: boolean }[] = [];

    const initialDate = activeCase.anamneseDatum 
      ? new Date(activeCase.anamneseDatum).toLocaleDateString(language, { day: '2-digit', month: '2-digit' })
      : t('initialAdmissionLabel');
    
    const reversedFUs = activeCase.followUps ? [...activeCase.followUps].reverse() : [];
    const startIntensity = reversedFUs.length > 0 
      ? Math.min(4, Math.max(1, reversedFUs[0].intensityPrevious ?? 4)) 
      : 4;

    list.push({
      name: t('initialAdmissionLabel'),
      date: initialDate,
      intensity: startIntensity,
      trend: t('baselineFinding'),
      isInitial: true,
    });

    reversedFUs.forEach((fu, idx) => {
      const dateStr = fu.createdAt 
        ? new Date(fu.createdAt).toLocaleDateString(language, { day: '2-digit', month: '2-digit' })
        : `${t('controlFollowUpLabel').replace('{num}', (idx + 1).toString())}`;
      
      list.push({
        name: t('controlFollowUpLabel').replace('{num}', (idx + 1).toString()),
        date: dateStr,
        intensity: Math.min(4, Math.max(1, fu.intensityCurrent ?? 1)),
        trend: getTranslatedTrend(fu.trend || 'Deutlich besser'),
      });
    });

    return list;
  }, [activeCase, language, t]);

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
              <span className="block text-xs font-bold text-slate-800">{activePatient ? groupedPatients.length : 0}</span>
              <span className="block text-[10px] text-slate-400 font-medium">{t('patientsCountLabel')}</span>
            </div>
            <div className="bg-teal-50 border border-teal-200/60 px-3.5 py-1.5 rounded-xl text-center">
              <span className="block text-xs font-bold text-teal-800">{activePatient ? cases.length : 0}</span>
              <span className="block text-[10px] text-teal-600 font-medium">{t('casesTotalLabel')}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onNewCaseForPatient) {
                onNewCaseForPatient('', {});
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{t('btnNewPatientAdmission')}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CUSTOMER / PATIENT LIST WITH SEARCH & SCROLL */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPatientPlaceholder')}
                className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition-all h-9"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                <VoiceInputButton
                  value={searchQuery}
                  onChange={(val) => setSearchQuery(val)}
                  size="xs"
                  mode="append"
                />
              </div>
            </div>

            {/* List Header */}
            <div className="flex items-center justify-between px-1 py-1.5 mb-2 border-b border-slate-100 text-xs font-bold text-slate-700">
              <span>{t('patientsListHeader')} ({filteredPatients.length})</span>
              <button
                type="button"
                onClick={() => {
                  setModalSearchQuery('');
                  setIsSelectPatientModalOpen(true);
                }}
                className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                title={t('btnOpenPatientSelectionModal')}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{t('btnOpenPatientSelectionModal')}</span>
              </button>
            </div>

            {/* Scrollable Patient List */}
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredPatients.length === 0 ? (
                !searchQuery.trim() && !selectedPatientKey ? (
                  <div className="text-center py-10 px-4 text-slate-400 text-xs bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-teal-600/70" />
                    <p className="font-semibold text-slate-700">{t('noPatientDataLoadedTitle')}</p>
                    <p className="text-[11px] mt-1 text-slate-400 max-w-[230px] mx-auto leading-relaxed">{t('noPatientDataLoadedSub')}</p>
                  </div>
                ) : (
                  <div className="text-center py-10 px-4 text-slate-400 text-xs">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">{t('noPatientsFound')}</p>
                    <p className="text-[11px] mt-1 text-slate-400">{t('noPatientsFoundSub')}</p>
                  </div>
                )
              ) : (
                filteredPatients.map((p) => {
                  const isSelected = activePatient?.key === p.key;
                  const initials = p.name
                    .split(' ')
                    .filter(Boolean)
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  const caseCount = p.cases.length;

                  return (
                    <div
                      key={p.key}
                      onClick={() => {
                        setSelectedPatientKey(p.key);
                        setActiveCaseTabId(p.cases[0].id);
                      }}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col gap-2 ${
                        isSelected
                          ? 'bg-teal-50/80 border-teal-300 ring-1 ring-teal-200/50 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      {/* Patient Top Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {initials || 'P'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              {p.primaryCase.patientAge && <span>{p.primaryCase.patientAge} {t('yearsOld')}</span>}
                              {p.primaryCase.patientGender && <span>• {getGenderLabel(p.primaryCase.patientGender)}</span>}
                              {p.primaryCase.patientMaritalStatus && <span>• {getMaritalStatusLabel(p.primaryCase.patientMaritalStatus)}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Cases Badge */}
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 ${
                          isSelected ? 'bg-teal-200/70 text-teal-900' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {caseCount} {caseCount === 1 ? t('caseSingle') : t('casePlural')}
                        </span>
                      </div>

                      {/* Contact & Last Visit Snippet */}
                      <div className="pt-1.5 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-2 truncate">
                          {p.primaryCase.patientPhone && (
                            <span className="flex items-center gap-1 truncate text-slate-600">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{p.primaryCase.patientPhone}</span>
                            </span>
                          )}
                          {!p.primaryCase.patientPhone && p.primaryCase.patientEmail && (
                            <span className="flex items-center gap-1 truncate text-slate-600">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{p.primaryCase.patientEmail}</span>
                            </span>
                          )}
                        </div>

                        {/* Total Follow Ups indicator */}
                        {p.totalFollowUps > 0 ? (
                          <span className="text-teal-700 font-medium shrink-0 flex items-center gap-1">
                            <Activity className="w-3 h-3 text-teal-600" />
                            {p.totalFollowUps} {p.totalFollowUps === 1 ? t('followUpSingle') : t('followUpPlural')}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">{t('noFollowUpsYet')}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CASES OF ACTIVE PATIENT LIST (UNDER PATIENT LIST) */}
          {activePatient && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>{t('casesOfPatient').replace('{count}', activePatient.cases.length.toString())}</span>
                </h3>
                {activePatient.cases.length > 10 && (
                  <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                    {t('moreThan10Cases')}
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                {activePatient.cases.map((c, idx) => {
                  const isTabActive = activeCase?.id === c.id;
                  const dateFormatted = c.anamneseDatum 
                    ? new Date(c.anamneseDatum).toLocaleDateString(language) 
                    : t('unknownDate');

                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveCaseTabId(c.id)}
                      className={`w-full p-2.5 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        isTabActive
                          ? 'bg-teal-50/90 border-teal-400 text-teal-950 font-bold ring-1 ring-teal-200 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          {isTabActive && <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />}
                          <span>{t('caseAdmission').replace('{num}', (activePatient.cases.length - idx).toString())}</span>
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal shrink-0">
                          {t('admissionOn').replace('{date}', dateFormatted)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 line-clamp-2">
                        {c.hauptbeschwerde || t('noChiefComplaint')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETAILED PATIENT RECORD */}
        <div className="lg:col-span-8 space-y-6">
          {!activePatient || !activeCase ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-14 text-center shadow-xs flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 mb-4 shadow-2xs">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 font-serif mb-2">
                {t('noPatientSelectedTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                {t('noPatientSelectedSub')}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (onNewCaseForPatient) {
                      onNewCaseForPatient('', {});
                    }
                  }}
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
          ) : (
            <>
              {/* 1. PATIENT HEADER & STAMMDATEN CARD */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                      {activePatient.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
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

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatientKey(null);
                        setActiveCaseTabId(null);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title={t('unselectPatientBtn')}
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t('unselectPatientBtn')}</span>
                    </button>

                    <button
                      onClick={handleOpenEditStammdaten}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t('editMasterData')}</span>
                    </button>

                    <button
                      onClick={() => onOpenCaseInWorkspace(activeCase)}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <span>{t('openInCaseDoc')}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Structured Stammdaten Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-4 text-xs">
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

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2 sm:col-span-2">
                    <span className="block text-[10px] text-slate-400 font-medium">{t('contactData')}</span>
                    <div className="flex items-center gap-3 font-semibold text-slate-800 mt-0.5 truncate">
                      {activePatient.primaryCase.patientPhone && (
                        <a href={`tel:${activePatient.primaryCase.patientPhone}`} className="hover:text-teal-700 flex items-center gap-1 truncate">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{activePatient.primaryCase.patientPhone}</span>
                        </a>
                      )}
                      {activePatient.primaryCase.patientEmail && (
                        <a href={`mailto:${activePatient.primaryCase.patientEmail}`} className="hover:text-teal-700 flex items-center gap-1 truncate">
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
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2 sm:col-span-2">
                      <span className="block text-[10px] text-slate-400 font-medium">{t('extraFields')}</span>
                      <div className="flex flex-wrap gap-2 mt-0.5">
                        {activePatient.primaryCase.customStammdaten.map((cs) => (
                          <span key={cs.id} className="inline-block bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            <strong className="text-slate-600">{cs.name}:</strong> {cs.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. CASE SHORT REPORT */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wide">{t('shortEvaluationReport')}</span>
                    <h3 className="text-base font-bold text-slate-900">
                      {activeCase.hauptbeschwerde || t('firstAdmission')}
                    </h3>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <div>{t('admissionDate')} <strong>{activeCase.anamneseDatum ? new Date(activeCase.anamneseDatum).toLocaleDateString(language) : '—'}</strong></div>
                    {activeCase.analyzedAt && (
                      <span className="inline-flex items-center gap-1 text-teal-600 text-[11px] font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> {t('fullyAnalyzed')}
                      </span>
                    )}
                  </div>
                </div>

                {/* 4-Box Clinical Assessment Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Box A: Recommended Homeopathic Remedies */}
                  <div className="p-3.5 rounded-xl border border-teal-100 bg-teal-50/50">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-900 mb-1.5">
                      <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{t('recommendedHomeoRemedies')}</span>
                    </div>
                    {activeCase.remedySuggestions && activeCase.remedySuggestions.length > 0 ? (
                      <div className="space-y-1.5 text-xs text-slate-800">
                        {activeCase.remedySuggestions.slice(0, 2).map((r, i) => (
                          <div key={i} className="bg-white p-2 rounded-lg border border-teal-100 flex items-center justify-between">
                            <div>
                              <strong className="text-teal-950">{r.name}</strong>
                              <span className="text-teal-700 ml-1.5 font-medium">({r.potency})</span>
                            </div>
                            <span className="text-[11px] bg-teal-100/70 text-teal-900 px-2 py-0.5 rounded font-bold">
                              {t('matchPercent').replace('{score}', r.score.toString())}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">{t('noRepertorisationYet')}</p>
                    )}
                  </div>

                  {/* Box B: Doctor Recommendation / Diff Diagnosis */}
                  <div className={`p-3.5 rounded-xl border ${
                    activeCase.clinicalAnalysis?.arztfallEntscheidung?.status === 'Ja'
                      ? 'border-amber-200 bg-amber-50/50'
                      : 'border-slate-200 bg-slate-50/60'
                  }`}>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1.5">
                      <Stethoscope className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>{t('doctorRecAndDiff')}</span>
                    </div>
                    <div className="text-xs text-slate-700 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">{t('medicalClarification')}</span>
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          activeCase.clinicalAnalysis?.arztfallEntscheidung?.status === 'Ja'
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {activeCase.clinicalAnalysis?.arztfallEntscheidung?.status || t('routineClarification')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {activeCase.clinicalAnalysis?.arztfallEntscheidung?.begruendung || 
                         activeCase.clinicalAnalysis?.redFlags?.gesamtbewertung || 
                         t('noRedFlagsReported')}
                      </p>
                    </div>
                  </div>

                  {/* Box C: Taken Medications */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1.5">
                      <Pill className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{t('takenMedications')}</span>
                    </div>
                    {activeCase.medikamenteList && activeCase.medikamenteList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {activeCase.medikamenteList.map((m, idx) => (
                          <span key={idx} className="bg-white px-2 py-1 rounded border border-slate-200 text-slate-800 text-[11px]">
                            <strong>{m.name}</strong> ({m.dosierung || 'o.A.'})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">{t('noChronicMeds')}</p>
                    )}
                  </div>

                  {/* Box D: Modalities & Key Symptoms */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1.5">
                      <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{t('modalitiesAndKeySymptoms')}</span>
                    </div>
                    <div className="text-xs text-slate-700 space-y-0.5">
                      {activeCase.modalitaetenBesser && (
                        <p className="truncate"><strong className="text-emerald-700">{t('betterPrefix')}</strong> {activeCase.modalitaetenBesser}</p>
                      )}
                      {activeCase.modalitaetenSchlechter && (
                        <p className="truncate"><strong className="text-rose-700">{t('worsePrefix')}</strong> {activeCase.modalitaetenSchlechter}</p>
                      )}
                      {!activeCase.modalitaetenBesser && !activeCase.modalitaetenSchlechter && (
                        <p className="text-xs text-slate-500 italic">{t('noModalities')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. PERMANENT INITIAL PRESCRIPTION */}
              <div className="bg-white rounded-2xl border-2 border-teal-600/30 p-5 shadow-xs relative overflow-hidden bg-gradient-to-r from-teal-50/40 via-white to-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-teal-700" />
                      <h3 className="font-bold text-slate-900 text-sm">
                        {t('firstMedicationAndRecs')}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      {t('initialPrescriptionNotice')}
                    </p>
                  </div>

                  <button
                    onClick={handleOpenEditPrescription}
                    className="px-3 py-1.5 rounded-xl bg-white border border-teal-300 hover:bg-teal-50 text-teal-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-teal-700" />
                    <span>{t('editSection')}</span>
                  </button>
                </div>

                {/* Prescription Details Card */}
                <div className="mt-4 bg-white p-4 rounded-xl border border-teal-200/80 shadow-2xs space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">{t('prescribedRemedy')}</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {activeCase.initialPrescription?.remedy || t('noInitialPrescriptionYet')}
                      </span>
                      {activeCase.initialPrescription?.potency && (
                        <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-900 font-bold text-[11px]">
                          {activeCase.initialPrescription.potency}
                        </span>
                      )}
                    </div>
                    {activeCase.initialPrescription?.dosage && (
                      <span className="text-slate-600 font-medium">
                        {t('dosageLabel')} <strong>{activeCase.initialPrescription.dosage}</strong>
                      </span>
                    )}
                  </div>

                  {activeCase.initialPrescription?.recommendations && (
                    <div className="pt-1">
                      <span className="text-[11px] font-bold text-slate-500 block mb-1">{t('recsAndIntakeNotes')}</span>
                      <p className="text-slate-800 whitespace-pre-line leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {activeCase.initialPrescription.recommendations}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. INTERACTIVE INTENSITY PROGRESSION CHART */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-teal-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{t('symptomProgressionChart')}</h3>
                      <p className="text-xs text-slate-500">{t('visualTrendCurve')}</p>
                    </div>
                  </div>

                  {chartData.length > 1 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        {t('trendSignificantImprovement')
                          .replace('{prev}', chartData[0].intensity.toString())
                          .replace('{curr}', chartData[chartData.length - 1].intensity.toString())}
                      </span>
                    </div>
                  )}
                </div>

                {chartData.length > 0 ? (
                  <div className="w-full h-56 pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 11, fill: '#64748b' }} 
                          tickLine={false} 
                        />
                        <YAxis 
                          domain={[1, 4]} 
                          ticks={[1, 2, 3, 4]} 
                          tick={{ fontSize: 11, fill: '#64748b' }} 
                          tickLine={false} 
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-lg space-y-1">
                                  <div className="font-bold text-teal-300">{data.name} ({data.date})</div>
                                  <div>{t('painIntensity')} <strong>{t('intensityGrade').replace('{grade}', data.intensity.toString())} (1–4)</strong></div>
                                  <div className="text-slate-300">{t('trendLabel')} {data.trend}</div>
                                </div>
                              );
                            }
                            return null;
                          }} 
                        />
                        <Bar dataKey="intensity" radius={[6, 6, 0, 0]} maxBarSize={45}>
                          {chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.intensity >= 4 ? '#f43f5e' : entry.intensity >= 3 ? '#ea580c' : entry.intensity >= 2 ? '#f59e0b' : '#0d9488'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-xs text-slate-400">
                    {t('noChartPoints')}
                  </div>
                )}
              </div>

              {/* 6. FOLLOW-UP ENTRIES LIST */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {t('followUpsCount').replace('{count}', (activeCase.followUps?.length || 0).toString())}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {t('followUpsSubtitle')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenNewFollowUp}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('addFollowUp')}</span>
                  </button>
                </div>

                {/* List of Follow-up Cards */}
                {(!activeCase.followUps || activeCase.followUps.length === 0) ? (
                  <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold text-slate-700">{t('noFollowUpsRecorded')}</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {t('noFollowUpsRecordedSub')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeCase.followUps.map((fu) => {
                      const trendStyle = TREND_STYLE_MAP[fu.trend] || TREND_STYLE_MAP['Deutlich besser'];
                      const TrendIcon = trendStyle.icon;
                      const translatedTrend = getTranslatedTrend(fu.trend);

                      return (
                        <div
                          key={fu.id}
                          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-3"
                        >
                          {/* Card Top: Date & Action buttons */}
                          <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-100">
                            <div>
                              <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                                <span>{fu.dateDisplay || formatLocalizedDateTime(new Date(fu.createdAt), language)}</span>
                              </div>
                            </div>

                            {/* Actions: Edit & Delete */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEditFollowUp(fu)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Edit3 className="w-3 h-3 text-slate-500" />
                                <span>{t('editSection')}</span>
                              </button>

                              <button
                                onClick={() => handleDeleteFollowUp(fu.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                title={t('deleteFollowUpConfirm')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Trend & Intensity Badges Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {/* Trend */}
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 font-medium">{t('trendLabel')}</span>
                              <span className={`px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 text-[11px] border ${trendStyle.bg} ${trendStyle.border}`}>
                                <TrendIcon className="w-3.5 h-3.5" />
                                <span>{translatedTrend}</span>
                              </span>
                            </div>

                            {/* Intensity Vorher -> Jetzt */}
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 font-medium">{t('symptomProgressionChart')}:</span>
                              <div className="flex items-center gap-1.5 font-bold">
                                <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px]">
                                  {t('intensityGrade').replace('{grade}', (fu.intensityPrevious ?? 0).toString())}
                                </span>
                                <span className="text-slate-400">➔</span>
                                <span className="bg-teal-100 text-teal-900 px-2 py-0.5 rounded text-[11px]">
                                  {t('intensityGrade').replace('{grade}', (fu.intensityCurrent ?? 0).toString())}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Verlauf & Befinden */}
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1">
                            <span className="font-bold text-slate-700 block text-[11px]">{t('fuProgressAndConditionLabel')}:</span>
                            <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                              {fu.befindenVerlauf || '—'}
                            </p>
                          </div>

                          {/* Empfehlungen / Folgemedikation */}
                          {fu.remedyRecommendations && (
                            <div className="bg-teal-50/50 p-3 rounded-lg border border-teal-100 text-xs space-y-1">
                              <span className="font-bold text-teal-950 block text-[11px] flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-teal-600" />
                                {t('fuNewRecsLabel')}:
                              </span>
                              <p className="text-teal-900 leading-relaxed whitespace-pre-line">
                                {fu.remedyRecommendations}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL 1: FOLLOW-UP CREATION & EDITING MODAL */}
      {isFollowUpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingFollowUpId ? t('editFollowUpModalTitle') : t('newFollowUpModalTitle')}
                </h3>
              </div>
              <button
                onClick={() => setIsFollowUpModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Datum & Uhrzeit */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('fuDateTimeLabel')}</label>
                <input
                  type="text"
                  value={fuDateDisplay}
                  onChange={(e) => setFuDateDisplay(e.target.value)}
                  placeholder={t('fuDateTimePlaceholder')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-teal-600"
                />
              </div>

              {/* Trend Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('fuTrendLabel')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TREND_OPTIONS.map((tr) => (
                    <button
                      key={tr.id}
                      type="button"
                      onClick={() => setFuTrend(tr.id)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer text-center transition-all ${
                        fuTrend === tr.id
                          ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t(tr.key as any)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensität (1-4): Vorher & Jetzt */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('fuIntensityBeforeLabel')} <strong>{t('intensityGrade').replace('{grade}', fuIntensityPrev.toString())}</strong>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="1"
                    value={fuIntensityPrev}
                    onChange={(e) => setFuIntensityPrev(parseInt(e.target.value, 10))}
                    className="w-full accent-slate-700 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{t('intensityNone')}</span>
                    <span>{t('intensityExtreme')}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t('fuIntensityNowLabel')} <strong className="text-teal-700">{t('intensityGrade').replace('{grade}', fuIntensityCurr.toString())}</strong>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="1"
                    value={fuIntensityCurr}
                    onChange={(e) => setFuIntensityCurr(parseInt(e.target.value, 10))}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{t('intensityNone')}</span>
                    <span>{t('intensityExtreme')}</span>
                  </div>
                </div>
              </div>

              {/* Verlauf & Befinden */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">{t('fuProgressAndConditionLabel')}</label>
                  <VoiceInputButton
                    value={fuBefinden}
                    onChange={(val) => setFuBefinden(val)}
                    mode="append"
                    size="xs"
                  />
                </div>
                <textarea
                  rows={3}
                  value={fuBefinden}
                  onChange={(e) => setFuBefinden(e.target.value)}
                  placeholder={t('fuProgressAndConditionPlaceholder')}
                  className="w-full p-3 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-teal-600 leading-relaxed text-xs"
                />
              </div>

              {/* Empfehlungen / Folgemedikation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">{t('fuNewRecsLabel')}</label>
                  <VoiceInputButton
                    value={fuRecommendations}
                    onChange={(val) => setFuRecommendations(val)}
                    mode="append"
                    size="xs"
                  />
                </div>
                <textarea
                  rows={2}
                  value={fuRecommendations}
                  onChange={(e) => setFuRecommendations(e.target.value)}
                  placeholder={t('fuNewRecsPlaceholder')}
                  className="w-full p-3 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-teal-600 leading-relaxed text-xs"
                />
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFollowUpModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                {t('cancelBtn')}
              </button>
              <button
                type="button"
                onClick={handleSaveFollowUp}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                {t('saveFollowUpBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT INITIAL PRESCRIPTION MODAL */}
      {isEditInitialPrescriptionOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-teal-700" />
                <h3 className="font-bold text-slate-900 text-base">
                  {t('editInitialPrescriptionTitle')}
                </h3>
              </div>
              <button
                onClick={() => setIsEditInitialPrescriptionOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {t('initialPrescriptionNotice')}
            </p>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('homeoRemedyLabel')}</label>
                  <input
                    type="text"
                    value={prescRemedy}
                    onChange={(e) => setPrescRemedy(e.target.value)}
                    placeholder="z.B. Nux vomica"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('potencyLabel')}</label>
                  <input
                    type="text"
                    value={prescPotency}
                    onChange={(e) => setPrescPotency(e.target.value)}
                    placeholder={t('potencyPlaceholder')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('dosageAndAdminLabel')}</label>
                <input
                  type="text"
                  value={prescDosage}
                  onChange={(e) => setPrescDosage(e.target.value)}
                  placeholder={t('dosageAndAdminPlaceholder')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">{t('recsAndPrescriptionTextLabel')}</label>
                  <VoiceInputButton
                    value={prescRecommendations}
                    onChange={(val) => setPrescRecommendations(val)}
                    mode="append"
                    size="xs"
                  />
                </div>
                <textarea
                  rows={4}
                  value={prescRecommendations}
                  onChange={(e) => setPrescRecommendations(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-teal-600 leading-relaxed text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditInitialPrescriptionOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                {t('cancelBtn')}
              </button>
              <button
                type="button"
                onClick={handleSavePrescription}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                {t('saveInitialPrescriptionBtn')}
              </button>
            </div>
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
    </div>
  );
};
