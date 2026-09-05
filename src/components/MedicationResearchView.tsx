import React, { useState, useEffect, useMemo } from 'react';
import { 
  Pill, 
  Search, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  Globe, 
  Layers, 
  Plus, 
  User, 
  Info, 
  ShieldCheck, 
  ChevronRight,
  ExternalLink,
  Sparkles,
  Loader2,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';
import { PatientCase } from '../types';
import { TranslationKey } from '../i18n/translations';
import { useTranslation } from '../i18n/LanguageContext';
import { MedicationMonographView } from './MedicationMonographView';
import { 
  searchMedications, 
  fetchMedicationDetails, 
  formatMedicationMonograph,
  MedicationSuggestion 
} from '../services/medicationDatabase';
import { 
  localizeStructuredMedication, 
  fetchLocalizedStructuredMedication, 
  LocalizedStructuredData 
} from '../services/medicationLocalization';
import { savePatientCase } from '../services/storage';

interface MedicationResearchViewProps {
  currentCase: Partial<PatientCase>;
  allCases?: PatientCase[];
  onSelectCase?: (caseId: string) => void;
  onOpenMedicationsModal?: () => void;
  onUpdateCase?: (updatedCase: Partial<PatientCase>) => void;
}

export const MedicationResearchView: React.FC<MedicationResearchViewProps> = ({
  currentCase,
  allCases = [],
  onSelectCase,
  onOpenMedicationsModal,
  onUpdateCase,
}) => {
  const { t, language } = useTranslation();

  // Search query for research in database
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MedicationSuggestion[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Selected medication for detailed view (either from current patient list or search result)
  const patientMeds = currentCase.medikamenteList || [];
  const [selectedMedIndex, setSelectedMedIndex] = useState<number>(0);
  const [researchedMedDetail, setResearchedMedDetail] = useState<MedicationSuggestion | null>(null);
  const [viewMode, setViewMode] = useState<'structured' | 'fluid'>('structured');
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Perform search in medical database
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchMedications(trimmed, false, language);
        setSearchResults(results);
        setHasSearched(true);
      } catch (e) {
        console.warn('Error during medication research search:', e);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, language]);

  // Determine active medication item to display
  const activePatientMed = patientMeds.length > 0 && selectedMedIndex >= 0 && selectedMedIndex < patientMeds.length
    ? patientMeds[selectedMedIndex]
    : null;

  // If a searched med is actively selected, it overrides activePatientMed
  const activeDisplayItem = researchedMedDetail || (activePatientMed ? {
    name: activePatientMed.name,
    category: activePatientMed.kategorie,
    activeSubstance: activePatientMed.wirkstoff,
    packageSizes: activePatientMed.packungsgroessen,
    dosages: activePatientMed.dosierung ? [activePatientMed.dosierung] : [],
    recommendedIntake: activePatientMed.einnahmeart,
    sideEffectsByFrequency: activePatientMed.nebenwirkungenGegliedert,
    sideEffects: activePatientMed.nebenwirkungen,
    interactions: activePatientMed.wechselwirkungen,
    contraindications: activePatientMed.kontraindikationen,
    warnings: activePatientMed.risiken,
    monographText: activePatientMed.monographText,
    authoritySource: activePatientMed.authoritySource || 'Geprüfte Fachinformation (BfArM / EMA / Rote Liste)',
    fromDatabase: true,
  } as MedicationSuggestion : null);

  // When active item lacks full structured details or monographText, auto-fetch in background
  useEffect(() => {
    if (!activeDisplayItem?.name) return;

    // Check if we need to fetch deeper monograph text
    if (!activeDisplayItem.monographText) {
      setIsLoadingDetail(true);
      fetchMedicationDetails(activeDisplayItem.name, language)
        .then((detail) => {
          if (detail) {
            if (researchedMedDetail && researchedMedDetail.name === activeDisplayItem.name) {
              setResearchedMedDetail(detail);
            } else if (activePatientMed && activePatientMed.name === detail.name) {
              // Update current case with enriched data
              const updatedList = patientMeds.map((m, idx) => {
                if (idx === selectedMedIndex) {
                  return {
                    ...m,
                    wirkstoff: detail.activeSubstance || m.wirkstoff,
                    kategorie: detail.category || m.kategorie,
                    packungsgroessen: detail.packageSizes || m.packungsgroessen,
                    nebenwirkungenGegliedert: detail.sideEffectsByFrequency || m.nebenwirkungenGegliedert,
                    nebenwirkungen: detail.sideEffects || m.nebenwirkungen,
                    wechselwirkungen: detail.interactions || m.wechselwirkungen,
                    kontraindikationen: detail.contraindications || m.kontraindikationen,
                    risiken: detail.warnings || m.risiken,
                    monographText: detail.monographText || formatMedicationMonograph(detail, language as any),
                    authoritySource: detail.authoritySource || m.authoritySource
                  };
                }
                return m;
              });
              const updatedCase = {
                ...currentCase,
                medikamenteList: updatedList
              };
              if (currentCase.id) {
                savePatientCase(updatedCase as PatientCase);
              }
              if (onUpdateCase) onUpdateCase(updatedCase);
            }
          }
        })
        .finally(() => {
          setIsLoadingDetail(false);
        });
    }
  }, [activeDisplayItem?.name, language]);

  // Localized version of the active item for compact structured view
  const [localizedDisplayItem, setLocalizedDisplayItem] = useState<LocalizedStructuredData | null>(null);
  const [isTranslatingStructured, setIsTranslatingStructured] = useState<boolean>(false);

  // Loading progress bar state
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [isFinishingLoad, setIsFinishingLoad] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isLoadingDetail) {
      setLoadProgress(8);
      setIsFinishingLoad(false);
      interval = setInterval(() => {
        setLoadProgress(prev => {
          if (prev < 40) return prev + Math.floor(Math.random() * 6 + 4);
          if (prev < 75) return prev + Math.floor(Math.random() * 4 + 2);
          if (prev < 94) return prev + Math.floor(Math.random() * 2 + 1);
          return 94; // Pause at 94% until loaded
        });
      }, 120);
    } else if (loadProgress > 0) {
      // Completed! Shoot to 100% and finish smoothly
      setLoadProgress(100);
      setIsFinishingLoad(true);
      const timer = setTimeout(() => {
        setIsFinishingLoad(false);
        setLoadProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoadingDetail]);

  useEffect(() => {
    if (!activeDisplayItem) {
      setLocalizedDisplayItem(null);
      setIsTranslatingStructured(false);
      return;
    }

    if (language === 'de') {
      setLocalizedDisplayItem(activeDisplayItem as any);
      setIsTranslatingStructured(false);
      return;
    }

    // Step 1: Immediate local dictionary translation
    const immediate = localizeStructuredMedication(activeDisplayItem as any, language);
    setLocalizedDisplayItem(immediate);

    // Step 2: Full asynchronous translation from AI / server
    let isCancelled = false;
    setIsTranslatingStructured(true);
    fetchLocalizedStructuredMedication(activeDisplayItem as any, language)
      .then((translated) => {
        if (!isCancelled && translated) {
          setLocalizedDisplayItem(translated);
        }
      })
      .catch((err) => {
        console.warn('[MedicationResearchView] Error localizing structured item:', err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsTranslatingStructured(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeDisplayItem?.name, language]);

  const displayItem = (language === 'de' ? activeDisplayItem : (localizedDisplayItem || activeDisplayItem)) as (MedicationSuggestion | LocalizedStructuredData | null);

  // Add a searched medication directly to the active patient's case
  const handleAddSearchedMedToPatient = async (med: MedicationSuggestion) => {
    let detail = med;
    if (!med.monographText) {
      const fetched = await fetchMedicationDetails(med.name, language);
      if (fetched) detail = fetched;
    }

    const newMedItem = {
      name: detail.name,
      dosierung: (detail.dosages && detail.dosages[0]) || (detail.defaultDosages && detail.defaultDosages[0]) || 'Standard',
      einnahmeart: '',
      wirkstoff: detail.activeSubstance,
      kategorie: detail.category,
      packungsgroessen: detail.packageSizes,
      nebenwirkungenGegliedert: detail.sideEffectsByFrequency,
      nebenwirkungen: detail.sideEffects,
      wechselwirkungen: detail.interactions,
      kontraindikationen: detail.contraindications,
      risiken: detail.warnings,
      monographText: detail.monographText || formatMedicationMonograph(detail, language as any),
      authoritySource: detail.authoritySource || 'Geprüfte Fachinformation (BfArM / EMA / Rote Liste)',
      datenbankQuelle: 'datenbank' as const
    };

    const updatedList = [...patientMeds, newMedItem];
    const updatedCase = {
      ...currentCase,
      nimmtMedikamente: true,
      medikamenteList: updatedList
    };

    if (currentCase.id) {
      savePatientCase(updatedCase as PatientCase);
    }
    if (onUpdateCase) onUpdateCase(updatedCase);
    setSelectedMedIndex(updatedList.length - 1);
    setResearchedMedDetail(null);
    setSearchQuery('');
    showToast(`${t('medAddedSuccess' as TranslationKey) || 'Medikament hinzugefügt'}: ${detail.name}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 bg-teal-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-teal-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/70">
                <Pill className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {t('medPageTitle' as TranslationKey) || 'Medikamente & Arzneimittelrecherche'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 max-w-3xl">
              {t('medPageSubtitle' as TranslationKey) || 'Vollständige klinische Monographien, Wechselwirkungen, Nebenwirkungen und Fachdaten der aktuellen Patientenmedikation.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Active Patient Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-slate-500 font-medium">{t('medCurrentPatientBadge' as TranslationKey) || 'Patient'}:</span>
              <span className="font-bold text-slate-900">
                {currentCase.patientName || t('unnamedPatient' as TranslationKey) || 'Unbenannt'}
              </span>
            </div>

            {/* Quick Button to Enter / Edit Medications in Modal */}
            {onOpenMedicationsModal && (
              <button
                type="button"
                onClick={onOpenMedicationsModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('medAddOrEditMeds' as TranslationKey) || 'Medikamente erfassen / bearbeiten'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Search Bar for direct database research */}
        <div className="mt-3.5 relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('medSearchFreePlaceholder' as TranslationKey) || "Medikament in Fachdatenbank recherchieren (z.B. Ibuprofen, Ramipril, Aspirin)..."}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all shadow-2xs"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-teal-600 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            )}
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: Patient Med List & Search Results (38% width) */}
        <div className="w-full md:w-[380px] lg:w-[420px] bg-white border-r border-slate-200 flex flex-col overflow-hidden shrink-0">
          {/* If there are search results, show them on top */}
          {hasSearched && (
            <div className="border-b border-slate-200 bg-teal-50/40 p-3 max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t('medSearchResultsCount' as TranslationKey, { count: searchResults.length })}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[10px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  {t('btnClose' as TranslationKey) || 'Schließen'}
                </button>
              </div>

              {searchResults.length === 0 ? (
                <p className="text-xs text-slate-500 py-2 text-center">
                  {t('medNoSearchResultFound' as TranslationKey) || 'Kein passendes Präparat in der Fachdatenbank gefunden.'}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {searchResults.map((res, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-teal-200/80 bg-white hover:border-teal-400 transition-all flex items-start justify-between gap-2 shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setResearchedMedDetail(res);
                        }}
                        className="text-left flex-1 cursor-pointer"
                      >
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{res.name}</span>
                          {res.fromDatabase && (
                            <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-teal-100 text-teal-800">
                              DB
                            </span>
                          )}
                        </div>
                        {res.activeSubstance && (
                          <div className="text-[10px] text-teal-700 font-medium">
                            {res.activeSubstance}
                          </div>
                        )}
                        {res.category && (
                          <div className="text-[10px] text-slate-500 truncate">
                            {res.category}
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        title={t('medAddResearchedToPatient' as TranslationKey) || 'Zur Patientenmedikation hinzufügen'}
                        onClick={() => handleAddSearchedMedToPatient(res)}
                        className="px-2 py-1 bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-800 rounded text-[10px] font-bold border border-teal-200 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{t('medAddBtn' as TranslationKey) || 'Hinzufügen'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Patient Case Selector Header if multiple cases exist */}
          {allCases.length > 1 && onSelectCase && (
            <div className="p-3 border-b border-slate-100 bg-slate-50/70">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t('medPatientCaseSelector' as TranslationKey) || 'Patient / Fall wechseln'}
              </label>
              <select
                value={currentCase.id}
                onChange={(e) => onSelectCase(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              >
                {allCases.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.patientName || t('medCaseWithoutName' as TranslationKey) || 'Fall ohne Namen'}
                    {' — '}
                    {t('medCaseMedsCount' as TranslationKey, { count: c.medikamenteList?.length || 0 })}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Patient Medication List Header */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Pill className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('medPatientCurrentList' as TranslationKey) || 'Erfasste Medikation'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                {patientMeds.length}
              </span>
            </h2>

            {onOpenMedicationsModal && (
              <button
                type="button"
                onClick={onOpenMedicationsModal}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{t('medNewBtn' as TranslationKey) || 'Neu'}</span>
              </button>
            )}
          </div>

          {/* List of Medications */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {patientMeds.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Pill className="w-6 h-6" />
                </div>
                <h3 className="text-xs font-bold text-slate-800 mb-1">
                  {t('medNoMedsRecorded' as TranslationKey) || 'Keine Medikamente hinterlegt'}
                </h3>
                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                  {t('medNoMedsRecordedDesc' as TranslationKey) || 'Erfassen Sie Medikamente schnell über das Eingabefenster oder recherchieren Sie beliebige Präparate direkt im Suchfeld.'}
                </p>
                {onOpenMedicationsModal && (
                  <button
                    type="button"
                    onClick={onOpenMedicationsModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('medAddOrEditMeds' as TranslationKey) || 'Medikamente erfassen'}</span>
                  </button>
                )}
              </div>
            ) : (
              patientMeds.map((m, idx) => {
                const isSelected = !researchedMedDetail && selectedMedIndex === idx;
                const hasInteractions = !!(m.wechselwirkungen?.length || m.risiken);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setResearchedMedDetail(null);
                      setSelectedMedIndex(idx);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/70 border-teal-500 shadow-2xs ring-2 ring-teal-500/10'
                        : 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 truncate">
                          <span>{m.name}</span>
                          {hasInteractions && (
                            <span title={t('medInteractionsRecordedTooltip' as TranslationKey) || 'Interaktionen/Risiken erfasst'}>
                              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        {m.wirkstoff && (
                          <div className="text-[10px] text-teal-700 font-medium truncate">
                            {m.wirkstoff}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-600">
                          {m.dosierung && (
                            <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                              {m.dosierung}
                            </span>
                          )}
                          {m.einnahmeart && (
                            <span className="font-medium text-slate-600 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {m.einnahmeart}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className={`w-4 h-4 shrink-0 mt-1 transition-transform ${isSelected ? 'text-teal-700 translate-x-0.5' : 'text-slate-300'}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Monograph & Authority Research (62% width) */}
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
          {activeDisplayItem ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Detail Header */}
              <div className="bg-white border-b border-slate-200 p-4 shrink-0 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                        {displayItem?.name || activeDisplayItem.name}
                      </h2>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{t('medStrictAuthorityBadge' as TranslationKey) || 'Geprüfte Fachinformation'}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
                      {displayItem?.activeSubstance && (
                        <span>
                          <strong className="text-slate-800">{t('medActiveSubstanceLabel' as TranslationKey) || 'Wirkstoff'}:</strong> {displayItem.activeSubstance}
                        </span>
                      )}
                      {displayItem?.category && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>
                            <strong className="text-slate-800">{t('medCategoryLabel' as TranslationKey) || 'Kategorie'}:</strong> {displayItem.category}
                          </span>
                        </>
                      )}
                      {isTranslatingStructured && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 ml-1">
                          <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
                          <span>{t('medMonographTranslating' as TranslationKey) || 'Fachinformation wird übersetzt...'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* View Mode Toggle: Kompaktansicht vs. Fließtext-Monographie */}
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setViewMode('structured')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        viewMode === 'structured'
                          ? 'bg-white text-teal-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{t('medViewModeStructured' as TranslationKey) || 'Kompaktansicht'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('fluid')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        viewMode === 'fluid'
                          ? 'bg-white text-teal-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{t('medViewModeFluid' as TranslationKey) || 'Fließtext-Monographie'}</span>
                    </button>
                  </div>
                </div>

                {/* If researched item is currently displayed, offer one-click add to patient */}
                {researchedMedDetail && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-teal-800 font-medium">
                      {t('medResearchedNotYetAddedNote' as TranslationKey) || 'Dieses recherchierte Präparat ist noch nicht der Patientenakte hinzugefügt.'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddSearchedMedToPatient(researchedMedDetail)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('medAddResearchedToPatient' as TranslationKey) || 'Zur Patientenmedikation hinzufügen'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto p-5">
                {(isLoadingDetail && !activeDisplayItem.monographText) || isFinishingLoad ? (
                  <div className="py-12 px-4 flex flex-col items-center justify-center">
                    <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-center animate-in fade-in-50 duration-200">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto mb-4 text-teal-600 shadow-2xs">
                        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                      </div>

                      <h4 className="text-sm font-bold text-slate-800 mb-1 truncate px-2">
                        {activeDisplayItem?.name}
                      </h4>

                      <p className="text-xs font-medium text-slate-600 min-h-[34px] flex items-center justify-center px-2 mb-4 transition-all duration-300">
                        {loadProgress >= 90
                          ? (t('medDataCollectedAssembling' as TranslationKey) || 'Alle Daten gesammelt, werden nun zusammengestellt...')
                          : (t('medLoadingProgress' as TranslationKey) || 'Fachinformation wird geladen & analysiert...')}
                      </p>

                      {/* Ladebalken */}
                      <div className="space-y-1.5">
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-200 ease-out"
                            style={{ width: `${Math.min(100, Math.max(loadProgress, 8))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-0.5">
                          <span>{Math.min(100, Math.round(loadProgress))}%</span>
                          <span className="text-[10px] text-slate-500 font-sans">
                            {loadProgress >= 90 ? '✓ ' + (t('medStatusOnline' as TranslationKey) || 'online') : '...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : viewMode === 'fluid' ? (
                  <MedicationMonographView
                    monographText={displayItem?.monographText || activeDisplayItem.monographText || formatMedicationMonograph(activeDisplayItem, language as any)}
                    medName={activeDisplayItem.name}
                    activeSubstance={displayItem?.activeSubstance || activeDisplayItem.activeSubstance}
                    authoritySource={activeDisplayItem.authoritySource}
                    t={t}
                  />
                ) : (
                  /* Professional Structured Compact View */
                  <div className="space-y-4 max-w-4xl">
                    {/* Authority notice */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100/80 px-3 py-2 rounded-lg border border-slate-200">
                      <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>
                        {t('medNoHallucinationNotice' as TranslationKey) || 'Strikte behördliche Datenbasis: Es werden keine Daten erfunden oder abgeleitet.'}
                      </span>
                    </div>

                    {/* Section 1: Dosierung, Darreichung & Packungsgrößen */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <Pill className="w-4 h-4 text-teal-600" />
                        <span>{t('medDosageAndPackagesTitle' as TranslationKey) || 'Dosierung & Packungsgrößen'}</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {activePatientMed && (
                          <div className="p-2.5 rounded-lg bg-teal-50/50 border border-teal-100">
                            <span className="font-bold block text-teal-900 mb-0.5">
                              {t('medCurrentPrescriptionForPatient' as TranslationKey) || 'Aktuelle Verordnung für diesen Patienten'}:
                            </span>
                            <div className="text-slate-800">
                              <strong>{t('medDosageLabel' as TranslationKey) || 'Dosierung'}:</strong> {activePatientMed.dosierung || (t('medNotSpecified' as TranslationKey) || 'Nicht angegeben')}
                            </div>
                            <div className="text-slate-800">
                              <strong>{t('medFrequencyLabel' as TranslationKey) || 'Häufigkeit'}:</strong> {activePatientMed.einnahmeart || (t('medNotSpecified' as TranslationKey) || 'Nicht angegeben')}
                            </div>
                          </div>
                        )}

                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="font-bold block text-slate-900 mb-0.5">
                            {t('medAvailableStrengths' as TranslationKey) || 'Verfügbare Stärken'}:
                          </span>
                          <div className="text-slate-700">
                            {Array.isArray(displayItem?.dosages) && displayItem.dosages.length > 0
                              ? displayItem.dosages.join(', ')
                              : Array.isArray(activeDisplayItem.dosages) && activeDisplayItem.dosages.length > 0
                              ? activeDisplayItem.dosages.join(', ')
                              : (activeDisplayItem.defaultDosages?.join(', ') || (t('medStandardDosageNotice' as TranslationKey) || 'Standarddosierung laut Fachinformation'))}
                          </div>
                        </div>

                        {Array.isArray(displayItem?.packageSizes) && displayItem.packageSizes.length > 0 ? (
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 sm:col-span-2">
                            <span className="font-bold block text-slate-900 mb-0.5">
                              {t('medPackageSizesLabel' as TranslationKey) || 'Packungsgrößen (N1, N2, N3)'}:
                            </span>
                            <div className="text-slate-700">
                              {displayItem.packageSizes.join(' • ')}
                            </div>
                          </div>
                        ) : Array.isArray(activeDisplayItem.packageSizes) && activeDisplayItem.packageSizes.length > 0 && (
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 sm:col-span-2">
                            <span className="font-bold block text-slate-900 mb-0.5">
                              {t('medPackageSizesLabel' as TranslationKey) || 'Packungsgrößen (N1, N2, N3)'}:
                            </span>
                            <div className="text-slate-700">
                              {activeDisplayItem.packageSizes.join(' • ')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section 2: Nebenwirkungen gegliedert nach Häufigkeit */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>{t('medSideEffects' as TranslationKey) || 'Unerwünschte Wirkungen (Nebenwirkungen)'}</span>
                      </h3>

                      {displayItem?.sideEffectsByFrequency && (
                        (displayItem.sideEffectsByFrequency.veryCommon && displayItem.sideEffectsByFrequency.veryCommon.length > 0) ||
                        (displayItem.sideEffectsByFrequency.common && displayItem.sideEffectsByFrequency.common.length > 0) ||
                        (displayItem.sideEffectsByFrequency.uncommon && displayItem.sideEffectsByFrequency.uncommon.length > 0) ||
                        (displayItem.sideEffectsByFrequency.rare && displayItem.sideEffectsByFrequency.rare.length > 0) ||
                        (displayItem.sideEffectsByFrequency.veryRare && displayItem.sideEffectsByFrequency.veryRare.length > 0)
                      ) ? (
                        <div className="space-y-2">
                          {displayItem.sideEffectsByFrequency.veryCommon && displayItem.sideEffectsByFrequency.veryCommon.length > 0 && (
                            <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/80 text-xs">
                              <span className="font-bold text-amber-950 block mb-0.5">
                                {t('medFreqVeryCommon' as TranslationKey) || 'Sehr häufig (≥ 1/10)'}:
                              </span>
                              <div className="text-slate-800 leading-relaxed">
                                {displayItem.sideEffectsByFrequency.veryCommon.join(', ')}
                              </div>
                            </div>
                          )}

                          {displayItem.sideEffectsByFrequency.common && displayItem.sideEffectsByFrequency.common.length > 0 && (
                            <div className="p-2.5 rounded-lg bg-amber-50/30 border border-amber-200/60 text-xs">
                              <span className="font-bold text-amber-900 block mb-0.5">
                                {t('medFreqCommon' as TranslationKey) || 'Häufig (≥ 1/100 bis < 1/10)'}:
                              </span>
                              <div className="text-slate-800 leading-relaxed">
                                {displayItem.sideEffectsByFrequency.common.join(', ')}
                              </div>
                            </div>
                          )}

                          {displayItem.sideEffectsByFrequency.uncommon && displayItem.sideEffectsByFrequency.uncommon.length > 0 && (
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                              <span className="font-bold text-slate-800 block mb-0.5">
                                {t('medFreqUncommon' as TranslationKey) || 'Gelegentlich (≥ 1/1.000 bis < 1/100)'}:
                              </span>
                              <div className="text-slate-700 leading-relaxed">
                                {displayItem.sideEffectsByFrequency.uncommon.join(', ')}
                              </div>
                            </div>
                          )}

                          {displayItem.sideEffectsByFrequency.rare && displayItem.sideEffectsByFrequency.rare.length > 0 && (
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                              <span className="font-bold text-slate-800 block mb-0.5">
                                {t('medFreqRare' as TranslationKey) || 'Selten (≥ 1/10.000 bis < 1/1.000)'}:
                              </span>
                              <div className="text-slate-700 leading-relaxed">
                                {displayItem.sideEffectsByFrequency.rare.join(', ')}
                              </div>
                            </div>
                          )}

                          {displayItem.sideEffectsByFrequency.veryRare && displayItem.sideEffectsByFrequency.veryRare.length > 0 && (
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                              <span className="font-bold text-slate-800 block mb-0.5">
                                {t('medFreqVeryRare' as TranslationKey) || 'Sehr selten (< 1/10.000)'}:
                              </span>
                              <div className="text-slate-700 leading-relaxed">
                                {displayItem.sideEffectsByFrequency.veryRare.join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : displayItem?.sideEffects && displayItem.sideEffects.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-xs text-slate-800 pl-1 leading-relaxed">
                          {displayItem.sideEffects.map((se, sIdx) => (
                            <li key={sIdx}>{se}</li>
                          ))}
                        </ul>
                      ) : activeDisplayItem.sideEffectsByFrequency ? (
                        <div className="space-y-2">
                          {activeDisplayItem.sideEffectsByFrequency.veryCommon && activeDisplayItem.sideEffectsByFrequency.veryCommon.length > 0 && (
                            <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/80 text-xs">
                              <span className="font-bold text-amber-950 block mb-0.5">
                                {t('medFreqVeryCommon' as TranslationKey) || 'Sehr häufig (≥ 1/10)'}:
                              </span>
                              <div className="text-slate-800 leading-relaxed">
                                {activeDisplayItem.sideEffectsByFrequency.veryCommon.join(', ')}
                              </div>
                            </div>
                          )}
                          {activeDisplayItem.sideEffectsByFrequency.common && activeDisplayItem.sideEffectsByFrequency.common.length > 0 && (
                            <div className="p-2.5 rounded-lg bg-amber-50/30 border border-amber-200/60 text-xs">
                              <span className="font-bold text-amber-900 block mb-0.5">
                                {t('medFreqCommon' as TranslationKey) || 'Häufig (≥ 1/100 bis < 1/10)'}:
                              </span>
                              <div className="text-slate-800 leading-relaxed">
                                {activeDisplayItem.sideEffectsByFrequency.common.join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          {t('medNoSpecificSideEffects' as TranslationKey) || 'Keine spezifischen Nebenwirkungen in der behördlichen Kurzinformation aufgeführt.'}
                        </p>
                      )}
                    </div>

                    {/* Section 3: Wechselwirkungen & Gefahren */}
                    {((displayItem?.interactions && displayItem.interactions.length > 0) || (activeDisplayItem.interactions && activeDisplayItem.interactions.length > 0)) && (
                      <div className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-2xs space-y-3">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-rose-900 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                          <span>{t('medInteractions' as TranslationKey) || 'Relevante Wechselwirkungen (Interaktionen)'}</span>
                        </h3>
                        <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-800 pl-1 leading-relaxed">
                          {((displayItem?.interactions && displayItem.interactions.length > 0) ? displayItem.interactions : activeDisplayItem.interactions || []).map((inter, iIdx) => (
                            <li key={iIdx} className="leading-relaxed">{inter}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Section 4: Kontraindikationen & Warnungen */}
                    {(displayItem?.contraindications || displayItem?.warnings || activeDisplayItem.contraindications || activeDisplayItem.warnings) && (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                          <span>{t('medWarnings' as TranslationKey) || 'Kontraindikationen & Warnhinweise'}</span>
                        </h3>

                        {/* Absolute Contraindications */}
                        {(() => {
                          const cItem = displayItem?.contraindications || activeDisplayItem.contraindications;
                          if (cItem && typeof cItem === 'object' && cItem.absolute && cItem.absolute.length > 0) {
                            return (
                              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-950">
                                <span className="font-bold block mb-1">
                                  {t('medAbsoluteContraindicationsLabel' as TranslationKey) || 'Absolute Gegenanzeigen (Anwendung ausgeschlossen)'}:
                                </span>
                                <ul className="list-disc list-inside space-y-0.5 text-slate-800">
                                  {cItem.absolute.map((c, cIdx) => (
                                    <li key={cIdx}>{c}</li>
                                  ))}
                                </ul>
                              </div>
                            );
                          }
                          if (typeof cItem === 'string' && cItem.trim()) {
                            return (
                              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-950">
                                <span className="font-bold block mb-1">
                                  {t('medAbsoluteContraindicationsLabel' as TranslationKey) || 'Absolute Gegenanzeigen (Anwendung ausgeschlossen)'}:
                                </span>
                                <div className="text-slate-800 leading-relaxed">{cItem}</div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Relative Contraindications */}
                        {(() => {
                          const cItem = displayItem?.contraindications || activeDisplayItem.contraindications;
                          if (cItem && typeof cItem === 'object' && cItem.relative && cItem.relative.length > 0) {
                            return (
                              <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-xs text-amber-950">
                                <span className="font-bold block mb-1">
                                  {t('medRelativeContraindicationsLabel' as TranslationKey) || 'Relative Gegenanzeigen (Besondere Vorsicht erforderlich)'}:
                                </span>
                                <ul className="list-disc list-inside space-y-0.5 text-slate-800">
                                  {cItem.relative.map((c, cIdx) => (
                                    <li key={cIdx}>{c}</li>
                                  ))}
                                </ul>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Warnings */}
                        {(displayItem?.warnings || activeDisplayItem.warnings) && (
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed">
                            <span className="font-bold block mb-0.5 text-slate-900">
                              {t('medOfficialWarningsLabel' as TranslationKey) || 'Behördliche Warnhinweise'}:
                            </span>
                            {displayItem?.warnings || activeDisplayItem.warnings}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 mb-1">
                {t('medDetailAnalysis' as TranslationKey) || 'Fachinformation & Klinische Monographie'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                {t('medSelectMedPrompt' as TranslationKey) || 'Wählen Sie links ein Medikament aus der Liste oder recherchieren Sie ein beliebiges Präparat im Suchfeld.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
