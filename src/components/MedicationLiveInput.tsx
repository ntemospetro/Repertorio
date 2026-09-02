import React, { useState, useEffect, useRef } from 'react';
import { searchMedications, fetchMedicationDetails, MedicationSuggestion, COMMON_MEDICATIONS_DB } from '../services/medicationDatabase';
import { Pill, Search, Globe, ChevronDown, ChevronUp, AlertTriangle, ShieldAlert, Sparkles, Loader2, Trash2, X } from 'lucide-react';
import { TranslationKey } from '../i18n/translations';

export interface MedicationData {
  name: string;
  dosierung: string;
  einnahmeart: string;
  grund?: string;
  wirkstoff?: string;
  kategorie?: string;
  nebenwirkungen?: string[];
  wechselwirkungen?: string[];
  risiken?: string;
}

interface MedicationLiveInputProps {
  index: number;
  med: MedicationData;
  onChange: (updated: MedicationData) => void;
  onRemove: () => void;
  t: (key: TranslationKey | any) => string;
}

export const MedicationLiveInput: React.FC<MedicationLiveInputProps> = ({
  index,
  med,
  onChange,
  onRemove,
  t
}) => {
  const [query, setQuery] = useState(med.name || '');
  const [suggestions, setSuggestions] = useState<MedicationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<MedicationSuggestion | null>(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Sync internal query with prop if updated externally
  useEffect(() => {
    setQuery(med.name || '');
    if (!med.name || med.name.trim() === '') {
      setSelectedSuggestion(null);
      setIsDetailsExpanded(false);
      setSuggestions([]);
      setIsOpen(false);
      setIsSearching(false);
      setIsLoadingDetails(false);
    }
  }, [med.name]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When medication name is present but details are missing, fetch them in background
  useEffect(() => {
    if (med.name && med.name.trim().length >= 2 && !med.nebenwirkungen && !med.wechselwirkungen) {
      let isMounted = true;
      fetchMedicationDetails(med.name).then(details => {
        if (isMounted && details) {
          setSelectedSuggestion(details);
          onChange({
            ...med,
            wirkstoff: med.wirkstoff || details.activeSubstance,
            kategorie: med.kategorie || details.category,
            nebenwirkungen: med.nebenwirkungen || details.sideEffects,
            wechselwirkungen: med.wechselwirkungen || details.interactions,
            risiken: med.risiken || details.warnings,
          });
        }
      });
      return () => { isMounted = false; };
    }
  }, [med.name]);

  const executeSearch = async (val: string) => {
    if (!val || val.trim().length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchMedications(val);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (val: string) => {
    setQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim().length >= 1) {
      onChange({ ...med, name: val });
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        executeSearch(val);
      }, 250);
    } else {
      setSelectedSuggestion(null);
      setIsDetailsExpanded(false);
      setSuggestions([]);
      setIsOpen(false);
      setIsSearching(false);
      setIsLoadingDetails(false);
      onChange({
        ...med,
        name: '',
        wirkstoff: undefined,
        kategorie: undefined,
        nebenwirkungen: undefined,
        wechselwirkungen: undefined,
        risiken: undefined,
      });
    }
  };

  const handleSelectMedication = async (suggestion: MedicationSuggestion) => {
    setQuery(suggestion.name);
    setSelectedSuggestion(suggestion);
    setIsOpen(false);

    // Auto-select first dosage if not set yet
    const newDosage = med.dosierung || (suggestion.defaultDosages && suggestion.defaultDosages.length > 0 ? suggestion.defaultDosages[0] : '');
    const newIntake = med.einnahmeart || suggestion.recommendedIntake || '';

    // If suggestion already has side effects / interactions, apply immediately
    if (suggestion.sideEffects && suggestion.sideEffects.length > 0) {
      onChange({
        ...med,
        name: suggestion.name,
        dosierung: newDosage,
        einnahmeart: newIntake,
        wirkstoff: suggestion.activeSubstance || '',
        kategorie: suggestion.category || '',
        nebenwirkungen: suggestion.sideEffects || [],
        wechselwirkungen: suggestion.interactions || [],
        risiken: suggestion.warnings || '',
      });
      setIsDetailsExpanded(true);
    } else {
      // Fetch full details online
      setIsLoadingDetails(true);
      onChange({
        ...med,
        name: suggestion.name,
        dosierung: newDosage,
        einnahmeart: newIntake,
        wirkstoff: suggestion.activeSubstance || '',
        kategorie: suggestion.category || '',
      });

      try {
        const fullDetails = await fetchMedicationDetails(suggestion.name);
        if (fullDetails) {
          setSelectedSuggestion(fullDetails);
          onChange({
            ...med,
            name: suggestion.name,
            dosierung: newDosage,
            einnahmeart: newIntake || fullDetails.recommendedIntake || '',
            wirkstoff: fullDetails.activeSubstance || suggestion.activeSubstance || '',
            kategorie: fullDetails.category || suggestion.category || '',
            nebenwirkungen: fullDetails.sideEffects || [],
            wechselwirkungen: fullDetails.interactions || [],
            risiken: fullDetails.warnings || '',
          });
          setIsDetailsExpanded(true);
        }
      } finally {
        setIsLoadingDetails(false);
      }
    }
  };

  // Find matching suggestion from DB if valid name exists
  const hasValidName = Boolean(med.name && med.name.trim().length > 0);
  const currentDbMatch = hasValidName
    ? (selectedSuggestion || COMMON_MEDICATIONS_DB.find(
        m => m.name.toLowerCase() === (med.name || '').trim().toLowerCase()
      ))
    : null;

  const activeSubstance = hasValidName ? (med.wirkstoff || currentDbMatch?.activeSubstance) : undefined;
  const category = hasValidName ? (med.kategorie || currentDbMatch?.category) : undefined;
  const sideEffects = hasValidName ? (med.nebenwirkungen || currentDbMatch?.sideEffects || []) : [];
  const interactions = hasValidName ? (med.wechselwirkungen || currentDbMatch?.interactions || []) : [];
  const warnings = hasValidName ? (med.risiken || currentDbMatch?.warnings) : undefined;
  const hasResearchData = hasValidName && Boolean(activeSubstance || (sideEffects && sideEffects.length > 0) || (interactions && interactions.length > 0) || warnings);

  return (
    <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3 relative group transition-all duration-200 hover:border-teal-300">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[11px] font-bold">
            {index + 1}
          </span>
          <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
            <span>{t('medication' as TranslationKey) || 'Medikament'}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-teal-50 text-[10px] font-semibold text-teal-700 border border-teal-200/60">
            <Globe className="w-2.5 h-2.5" />
            <span>{t('medLiveSearchInternetBadge' as TranslationKey) || 'Live-Recherche'}</span>
          </span>
        </div>
        <button
          type="button"
          id={`btn-delete-medication-${index}`}
          onClick={onRemove}
          title={t('deleteMedication' as TranslationKey) || 'Medikament löschen'}
          className="flex items-center gap-1 text-slate-400 hover:text-rose-600 text-xs font-semibold px-2 py-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{t('deleteMedication' as TranslationKey) || 'Medikament löschen'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
        {/* Name with Live Search */}
        <div className="sm:col-span-5 relative" ref={containerRef}>
          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center justify-between">
            <span>{t('medication' as TranslationKey) || 'Medikament'}</span>
            {isSearching && (
              <span className="text-[10px] font-normal text-teal-600 flex items-center gap-1 lowercase">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                <span>online...</span>
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder={t('medLiveSearchPlaceholder' as TranslationKey) || "z.B. Ibuprofen, Paracetamol..."}
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => {
                if (query.trim().length >= 1) {
                  executeSearch(query);
                }
              }}
              className="w-full pl-8 pr-12 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-shadow"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {query.trim().length > 0 && (
                <button
                  type="button"
                  id={`btn-clear-med-query-${index}`}
                  onClick={() => handleInputChange('')}
                  title={t('clearBtn' as TranslationKey) || 'Eingabe löschen'}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-slate-300" />
              )}
            </div>
          </div>

          {/* Suggestions Dropdown */}
          {isOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white rounded-lg border border-slate-200 shadow-xl max-h-60 overflow-y-auto py-1 animate-in fade-in-50 duration-100">
              <div className="px-3 py-1 bg-teal-50/70 border-b border-teal-100 flex items-center justify-between text-[10px] text-teal-800 font-semibold">
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-teal-600" />
                  <span>{t('medLiveSearchInternetBadge' as TranslationKey) || 'Internet-Recherche'}</span>
                </span>
                <span>{suggestions.length} {t('recommendationsCountBadge' as TranslationKey) || 'Treffer'}</span>
              </div>
              {suggestions.map((s, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => handleSelectMedication(s)}
                  className="w-full text-left px-3 py-2 hover:bg-teal-50/80 transition-colors flex items-center justify-between text-xs border-b border-slate-50 last:border-none cursor-pointer"
                >
                  <div className="pr-2">
                    <span className="font-bold text-slate-900 block">{s.name}</span>
                    {s.activeSubstance && s.activeSubstance !== s.name && (
                      <span className="text-[10px] text-slate-500 block">
                        {t('medActiveSubstance' as TranslationKey) || 'Wirkstoff'}: {s.activeSubstance}
                      </span>
                    )}
                    {s.category && (
                      <span className="text-[10px] text-teal-700 block font-medium">{s.category}</span>
                    )}
                  </div>
                  {s.defaultDosages && s.defaultDosages.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold shrink-0">
                      {s.defaultDosages[0]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dosage with quick dosage selection badges */}
        <div className="sm:col-span-3">
          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
            {t('dosage' as TranslationKey) || 'Dosierung'}
          </label>
          <input
            type="text"
            placeholder="z.B. 400 mg"
            value={med.dosierung || ''}
            onChange={(e) => onChange({ ...med, dosierung: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-shadow"
          />

          {/* Quick Dosage Badges */}
          {currentDbMatch && currentDbMatch.defaultDosages && currentDbMatch.defaultDosages.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {currentDbMatch.defaultDosages.map((d, dIdx) => (
                <button
                  key={dIdx}
                  type="button"
                  onClick={() => onChange({ ...med, dosierung: d })}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                    med.dosierung === d
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Intake Method */}
        <div className="sm:col-span-4">
          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
            {t('intake' as TranslationKey) || 'Einnahmeart / Häufigkeit'}
          </label>
          <input
            type="text"
            placeholder="z.B. 1-2x täglich, bei Bedarf"
            value={med.einnahmeart || ''}
            onChange={(e) => onChange({ ...med, einnahmeart: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-shadow"
          />

          <div className="flex flex-wrap gap-1 mt-1.5">
            {['1x täglich', '2x täglich', 'Bei Bedarf', 'Morgens nüchtern'].map((freq, fIdx) => (
              <button
                key={fIdx}
                type="button"
                onClick={() => onChange({ ...med, einnahmeart: freq })}
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  med.einnahmeart === freq
                    ? 'bg-teal-100 text-teal-900 border border-teal-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Internet Research Toggle & Profile Bar */}
      {(hasResearchData || isLoadingDetails || (hasValidName && med.name)) && (
        <div className="pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsDetailsExpanded(prev => !prev)}
            className="w-full flex items-center justify-between text-left py-1.5 px-2.5 rounded-lg bg-teal-50/50 hover:bg-teal-50 border border-teal-100/80 text-teal-900 text-xs font-semibold transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-teal-600" />
              <span>
                {isDetailsExpanded 
                  ? (t('medHideDetails' as TranslationKey) || 'Recherche einklappen')
                  : (t('medViewDetails' as TranslationKey) || 'Internet-Recherche anzeigen (Wirkstoff, Neben- & Wechselwirkungen)')
                }
              </span>
              {isLoadingDetails && (
                <Loader2 className="w-3 h-3 text-teal-600 animate-spin ml-1" />
              )}
            </div>
            {isDetailsExpanded ? (
              <ChevronUp className="w-4 h-4 text-teal-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-teal-600" />
            )}
          </button>

          {/* Expanded Research Details */}
          {isDetailsExpanded && (
            <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50 border border-teal-200/70 space-y-3 animate-in fade-in duration-150">
              {/* Active Substance & Category Header */}
              {(activeSubstance || category) && (
                <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200/70">
                  {activeSubstance && (
                    <span className="text-xs text-slate-700">
                      <strong className="text-slate-900 font-bold">{t('medActiveSubstance' as TranslationKey) || 'Wirkstoff'}:</strong> {activeSubstance}
                    </span>
                  )}
                  {category && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold">
                      {category}
                    </span>
                  )}
                </div>
              )}

              {/* Side Effects */}
              {sideEffects && sideEffects.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t('medSideEffects' as TranslationKey) || 'Bekannte Nebenwirkungen'}:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-700 pl-1">
                    {sideEffects.map((effect, effIdx) => (
                      <li key={effIdx} className="leading-relaxed">{effect}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Interactions */}
              {interactions && interactions.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>{t('medInteractions' as TranslationKey) || 'Relevante Wechselwirkungen (Interaktionen)'}:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-slate-700 pl-1">
                    {interactions.map((inter, intIdx) => (
                      <li key={intIdx} className="leading-relaxed">{inter}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings & Contraindications */}
              {warnings && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200/80 text-xs text-rose-900 leading-relaxed">
                  <span className="font-bold block mb-0.5">{t('medWarnings' as TranslationKey) || 'Wichtige Warnhinweise & Kontraindikationen'}:</span>
                  {warnings}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

