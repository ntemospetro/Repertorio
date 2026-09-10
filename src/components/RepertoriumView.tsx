import React, { useState, useMemo, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  BookOpen, 
  Filter, 
  RotateCcw, 
  CheckCircle2, 
  ChevronRight, 
  Flame, 
  Info,
  SlidersHorizontal,
  Award
} from 'lucide-react';
import { useTranslation, useLanguage } from '../i18n/LanguageContext';
import { LocalizedRemedy, getLocalizedRemedies } from '../data/materiaMedicaData';
import { RemedyMonographModal } from './RemedyMonographModal';
import { 
  RepertoriumSymptomInput, 
  SymptomWeightGrade, 
  performBoerickeRepertorisation,
  BoerickeRepertorisationResult 
} from '../services/boerickeRepertoryService';
import { 
  getRemedyClassicalAuthors, 
  matchesAuthorFilter, 
  ClassicalAuthorFilterKey 
} from '../data/classicalAuthorsMap';
import { Therapist } from '../types';

interface RepertoriumViewProps {
  therapist?: Therapist;
  onSelectRemedyForCase?: (remedyName: string, potency: string) => void;
  onGoToMateriaMedica?: () => void;
}

export const RepertoriumView: React.FC<RepertoriumViewProps> = ({
  onSelectRemedyForCase,
  onGoToMateriaMedica
}) => {
  const { t } = useTranslation();
  const { language } = useLanguage();

  // Symptoms list for repertorisation
  const [symptoms, setSymptoms] = useState<RepertoriumSymptomInput[]>([
    { id: 'sym-1', text: '', weight: null },
  ]);

  // Debounced symptoms state so typing into inputs is instantaneous and silky-smooth
  const [debouncedSymptoms, setDebouncedSymptoms] = useState<RepertoriumSymptomInput[]>(symptoms);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSymptoms(symptoms);
    }, 250);
    return () => clearTimeout(handler);
  }, [symptoms]);

  // Filter mode: strict intersection vs weighted (Default: false, per user request)
  const [strictOnly, setStrictOnly] = useState<boolean>(false);

  // Filter by classical authors (All, Hahnemann, Kent, Hering, Boericke)
  const [selectedAuthor, setSelectedAuthor] = useState<ClassicalAuthorFilterKey>('all');

  // Selected remedy for Materia Medica monograph modal
  const [selectedRemedy, setSelectedRemedy] = useState<LocalizedRemedy | null>(null);

  // All remedies for monograph navigation
  const allRemedies = useMemo(() => getLocalizedRemedies(language), [language]);

  // Authors filter definition
  const authors = [
    { key: 'all' as ClassicalAuthorFilterKey, label: t('filterAuthorAll') },
    { key: 'hahnemann' as ClassicalAuthorFilterKey, label: t('filterAuthorHahnemann') },
    { key: 'kent' as ClassicalAuthorFilterKey, label: t('filterAuthorKent') },
    { key: 'hering' as ClassicalAuthorFilterKey, label: t('filterAuthorHering') },
    { key: 'boericke' as ClassicalAuthorFilterKey, label: t('filterAuthorBoericke') },
    { key: 'boger' as ClassicalAuthorFilterKey, label: t('filterAuthorBoger' as any) || 'Boger' }
  ];

  // Compute live repertorisation using Classical Repertory Engine (Hahnemann, Kent, Hering, Boericke)
  const results = useMemo(() => {
    return performBoerickeRepertorisation(debouncedSymptoms, language, strictOnly, selectedAuthor);
  }, [debouncedSymptoms, language, strictOnly, selectedAuthor]);

  // Individual symptom coverage counts
  const symptomHitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sym of debouncedSymptoms) {
      if (!sym.text || sym.text.trim().length === 0) {
        counts[sym.id] = 0;
        continue;
      }
      const singleRes = performBoerickeRepertorisation([sym], language, false, selectedAuthor);
      counts[sym.id] = singleRes.length;
    }
    return counts;
  }, [debouncedSymptoms, language, selectedAuthor]);

  const handleAddSymptom = () => {
    const nextId = `sym-${Date.now()}`;
    setSymptoms(prev => [
      ...prev,
      { id: nextId, text: '', weight: null }
    ]);
  };

  const handleUpdateSymptom = (id: string, updates: Partial<RepertoriumSymptomInput>) => {
    setSymptoms(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleRemoveSymptom = (id: string) => {
    if (symptoms.length <= 1) {
      setSymptoms([{ id: `sym-${Date.now()}`, text: '', weight: null }]);
      return;
    }
    setSymptoms(prev => prev.filter(s => s.id !== id));
  };

  const handleReset = () => {
    setSymptoms([
      { id: `sym-${Date.now()}-1`, text: '', weight: null },
    ]);
  };

  const hasAnyEnteredSymptom = useMemo(() => {
    return symptoms.some(s => s.text && s.text.trim().length > 0);
  }, [symptoms]);

  const fullMatchCount = results.filter(r => r.isFullMatch).length;

  return (
    <div id="repertorium-view-root" className="w-full space-y-6">
      {/* Header Banner */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 shadow-2xs">
              <Layers className="w-6 h-6 text-teal-700" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  {t('repertoriumTitle')}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                  {selectedAuthor === 'all' 
                    ? 'Hahnemann • Kent • Hering • Boericke' 
                    : authors.find(a => a.key === selectedAuthor)?.label}
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-600 mt-1">
                {t('repertoriumSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              id="repertorium-reset-btn"
              onClick={handleReset}
              className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('repertoriumReset')}</span>
            </button>
            {onGoToMateriaMedica && (
              <button
                type="button"
                id="repertorium-to-materiamedica-btn"
                onClick={onGoToMateriaMedica}
                className="flex-1 sm:flex-none justify-center inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer shadow-2xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                <span>{t('tabMateriaMedica')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Classical Authors Selector Bar (Responsive Grid for Mobile, Tablet & Desktop) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 md:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-700" />
            <span className="text-xs md:text-sm font-bold text-slate-900">
              {t('filterAuthorLabel')}
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              — {selectedAuthor === 'all' 
                ? t('repertoriumScopeAll') 
                : `${t('repertoriumScopeAuthor')} ${authors.find(a => a.key === selectedAuthor)?.label}`}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium sm:hidden">
            {selectedAuthor === 'all' 
              ? t('repertoriumScopeAll') 
              : `${t('repertoriumScopeAuthor')} ${authors.find(a => a.key === selectedAuthor)?.label}`}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 w-full">
          {authors.map((auth) => (
            <button
              key={auth.key}
              type="button"
              id={`repertorium-filter-author-${auth.key}`}
              onClick={() => setSelectedAuthor(auth.key)}
              className={`py-2 px-2 md:py-2.5 md:px-3 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer text-center truncate shadow-2xs ${
                selectedAuthor === auth.key
                  ? 'bg-teal-700 text-white font-bold shadow-xs ring-1 ring-teal-800'
                  : 'bg-slate-100 hover:bg-slate-200/90 text-slate-700 border border-slate-200/80'
              }`}
            >
              {auth.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left = Symptoms Input, Right = Repertory Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Symptom Input (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>{t('repertoriumSymptomsHeading')}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('repertoriumBoerickeGuidance')}
                </p>
              </div>
              {hasAnyEnteredSymptom && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200/80 rounded-full">
                  {symptoms.filter(s => s.text.trim().length > 0).length} {t('repertoriumStepNumber')}
                </span>
              )}
            </div>

            {/* Symptoms List */}
            <div className="space-y-3">
              {symptoms.map((symptom, index) => {
                const hitsCount = symptomHitCounts[symptom.id] ?? 0;
                return (
                  <div 
                    key={symptom.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-teal-300 transition-colors space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-teal-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          {t('repertoriumStepNumber')} #{index + 1}
                        </span>
                      </div>

                      {symptoms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSymptom(symptom.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                          title={t('repertoriumRemoveSymptom')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Symptom Input Field */}
                    <input
                      type="text"
                      id={`repertorium-symptom-input-${index + 1}`}
                      value={symptom.text}
                      onChange={(e) => handleUpdateSymptom(symptom.id, { text: e.target.value })}
                      placeholder={t('repertoriumSymptomPlaceholder')}
                      className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs"
                    />

                    {/* Weight Grade Buttons (1 to 4 Stars) - Positioned ABOVE coverage info */}
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-600">
                          {t('repertoriumWeightHeading')}
                        </span>
                        {symptom.weight && (
                          <button
                            type="button"
                            onClick={() => handleUpdateSymptom(symptom.id, { weight: null })}
                            className="text-[11px] text-teal-700 hover:text-teal-900 font-medium underline cursor-pointer"
                          >
                            {t('repertoriumClearWeight')}
                          </button>
                        )}
                      </div>

                      {/* 4 Ratings Buttons Grid across full width */}
                      <div className="grid grid-cols-4 gap-1.5 w-full">
                        <button
                          type="button"
                          onClick={() => handleUpdateSymptom(symptom.id, { weight: symptom.weight === 4 ? null : 4 })}
                          className={`py-2 px-1 text-xs font-semibold rounded-lg cursor-pointer transition-all text-center ${
                            symptom.weight === 4
                              ? 'bg-purple-100 text-purple-950 border border-purple-400 font-bold shadow-2xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                          title={t('repertoriumWeightGrade4')}
                        >
                          ★★★★ 4
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSymptom(symptom.id, { weight: symptom.weight === 3 ? null : 3 })}
                          className={`py-2 px-1 text-xs font-semibold rounded-lg cursor-pointer transition-all text-center ${
                            symptom.weight === 3
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold shadow-2xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                          title={t('repertoriumWeightGrade3')}
                        >
                          ★★★ 3
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSymptom(symptom.id, { weight: symptom.weight === 2 ? null : 2 })}
                          className={`py-2 px-1 text-xs font-semibold rounded-lg cursor-pointer transition-all text-center ${
                            symptom.weight === 2
                              ? 'bg-teal-100 text-teal-900 border border-teal-300 font-bold shadow-2xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                          title={t('repertoriumWeightGrade2')}
                        >
                          ★★ 2
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSymptom(symptom.id, { weight: symptom.weight === 1 ? null : 1 })}
                          className={`py-2 px-1 text-xs font-semibold rounded-lg cursor-pointer transition-all text-center ${
                            symptom.weight === 1
                              ? 'bg-slate-200 text-slate-900 border border-slate-300 font-bold shadow-2xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                          title={t('repertoriumWeightGrade1')}
                        >
                          ★ 1
                        </button>
                      </div>

                      {/* Coverage Pill - Positioned UNDERNEATH the ratings */}
                      {symptom.text.trim().length > 0 && (
                        <div className="pt-1">
                          <div className="w-full text-xs font-medium text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between shadow-2xs">
                            <span className="text-slate-500">{t('repertoriumMatchesLabel')}</span>
                            <span className="font-bold text-teal-800">
                              {hitsCount} {t('repertoriumMatchesCount')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Symptom Button */}
            <button
              type="button"
              id="repertorium-add-symptom-btn"
              onClick={handleAddSymptom}
              className="mt-4 w-full py-3 px-4 rounded-xl border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50 text-teal-900 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t('repertoriumAddSymptom')}</span>
            </button>
          </div>

          {/* Classical Authors Guidance Card */}
          <div className="bg-gradient-to-br from-teal-50/80 to-slate-50 rounded-2xl border border-teal-200/70 p-4 text-xs text-slate-600 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-teal-900">
              <Award className="w-4 h-4 text-teal-700" />
              <span>
                {selectedAuthor === 'all' 
                  ? t('repertoriumBoerickeNotice') 
                  : `${t('repertoriumScopeAuthor')} ${authors.find(a => a.key === selectedAuthor)?.label}`}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {t('repertoriumBoerickeGuidance')}
            </p>
          </div>
        </div>

        {/* Right Column: Narrowed Results List (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Strict Intersection Toggle Card: Positioned directly above the found remedies on the right */}
          <div
            id="repertorium-strict-filter-card"
            className={`rounded-2xl border transition-all p-4 shadow-xs ${
              strictOnly
                ? 'bg-gradient-to-r from-teal-50/90 to-emerald-50/60 border-teal-300/90 ring-1 ring-teal-200/50'
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <label className="flex items-start justify-between gap-3 cursor-pointer select-none">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="repertorium-strict-toggle"
                  checked={strictOnly}
                  onChange={(e) => setStrictOnly(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    {t('repertoriumFilterAllCovered')}
                  </span>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    {t('repertoriumStrictDesc')}
                  </p>
                </div>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 transition-colors ${
                  strictOnly
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {strictOnly ? t('repertoriumFullCoverage') : t('filterAuthorAll')}
              </span>
            </label>
          </div>

          {/* Results Summary Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-xs">
                  <span className="text-slate-500">{t('repertoriumFoundRemedies')}: </span>
                  <span className="font-bold text-slate-900 text-sm">{hasAnyEnteredSymptom ? results.length : 0}</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="text-xs">
                  <span className="text-emerald-700 font-semibold">{t('repertoriumFullCoverage')}: </span>
                  <span className="font-bold text-emerald-800 text-sm">{hasAnyEnteredSymptom ? fullMatchCount : 0} {t('repertoriumRemediesUnit')}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('repertoriumSortLabel')}</span>
              </div>
            </div>
          </div>

          {/* Results List */}
          {!hasAnyEnteredSymptom ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
              <Layers className="w-10 h-10 text-teal-600/70 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800 mb-1">
                {t('repertoriumEmptyStateTitle')}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
                {t('repertoriumEmptyStateDesc')}
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
              <Info className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800 mb-1">
                {t('repertoriumNoMatches')}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
                {t('repertoriumNoMatches')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((res, index) => {
                const isTopSimile = index === 0 && res.isFullMatch;
                return (
                  <div
                    key={res.remedy.id}
                    id={`repertorium-remedy-card-${res.remedy.id}`}
                    className={`bg-white rounded-2xl border transition-all p-5 shadow-xs hover:shadow-md ${
                      isTopSimile 
                        ? 'border-teal-400 ring-2 ring-teal-500/10' 
                        : res.isFullMatch 
                        ? 'border-emerald-200' 
                        : 'border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                            isTopSimile
                              ? 'bg-teal-700 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            #{index + 1}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 tracking-tight">
                            {res.remedy.latinName}
                          </h3>
                          <span className="text-xs text-slate-500">
                            ({res.remedy.commonName})
                          </span>
                          {res.remedy.isPolychrest && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Polychrest
                            </span>
                          )}
                          {res.isFullMatch && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>{t('repertoriumFullCoverage')}</span>
                            </span>
                          )}
                        </div>

                        {/* Classical Author Badges for this remedy */}
                        {(() => {
                          const authorsInfo = getRemedyClassicalAuthors(res.remedy.id);
                          const hasAny = authorsInfo.hahnemann || authorsInfo.kent || authorsInfo.hering || authorsInfo.boericke;
                          if (!hasAny) return null;
                          return (
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {authorsInfo.hahnemann && (
                                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200/60" title="Samuel Hahnemann">
                                  Hahnemann
                                </span>
                              )}
                              {authorsInfo.kent && (
                                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-800 border border-indigo-200/60" title="James Tyler Kent">
                                  Kent
                                </span>
                              )}
                              {authorsInfo.hering && (
                                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 border border-teal-200/60" title="Constantine Hering">
                                  Hering
                                </span>
                              )}
                              {authorsInfo.boericke && (
                                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60" title="William Boericke">
                                  Boericke
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        <p className="text-xs text-slate-600 line-clamp-1 italic">
                          {res.remedy.essence || res.remedy.origin}
                        </p>
                      </div>

                      {/* Coverage Metric & Score */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shadow-2xs ${
                            res.coveragePercentage === 100 
                              ? 'bg-teal-700 text-white' 
                              : res.coveragePercentage >= 66 
                              ? 'bg-teal-100 text-teal-900 border border-teal-200' 
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {res.coveragePercentage}% {t('repertoriumCoverage')}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {res.totalScore} {t('repertoriumScore')} ({res.coveredSymptomsCount}/{res.totalSymptomsCount})
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all ${
                          res.coveragePercentage === 100 
                            ? 'bg-teal-600' 
                            : res.coveragePercentage >= 66 
                            ? 'bg-emerald-500' 
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${res.coveragePercentage}%` }}
                      />
                    </div>

                    {/* Matched Boericke Excerpts */}
                    <div className="mt-3.5 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <span>{t('repertoriumBoerickeMatch')}:</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {res.hits.map((hit, hIdx) => (
                          <div 
                            key={hIdx}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-start gap-2 text-slate-700"
                          >
                            <span className="font-bold text-teal-700 shrink-0 mt-0.5">
                              S{hit.symptomIndex}:
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-slate-900">{hit.symptomText}</span>
                              <span className="text-slate-400 mx-1.5">→</span>
                              <span className="text-slate-600 italic">{hit.matchedBoerickeExcerpt}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span 
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                  hit.remedyGrade === 4
                                    ? 'bg-purple-100 text-purple-950 border-purple-300'
                                    : hit.remedyGrade === 3
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : hit.remedyGrade === 2
                                    ? 'bg-teal-100 text-teal-900 border-teal-300'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                                title={hit.remedyGrade === 4 ? t('repertoriumGrade4Badge') : `${t('repertoriumCoverage')}: Grad ${hit.remedyGrade}`}
                              >
                                {'★'.repeat(hit.remedyGrade)} (Grad {hit.remedyGrade})
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                                +{hit.points} Pkt
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Actions: Open Monograph & Optional Verordnen */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        {res.remedy.modalitiesBetter && res.remedy.modalitiesBetter.length > 0 && (
                          <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 truncate max-w-xs">
                            &gt; {res.remedy.modalitiesBetter[0]}
                          </span>
                        )}
                        {res.remedy.modalitiesWorse && res.remedy.modalitiesWorse.length > 0 && (
                          <span className="text-[11px] text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60 truncate max-w-xs">
                            &lt; {res.remedy.modalitiesWorse[0]}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {onSelectRemedyForCase && (
                          <button
                            type="button"
                            onClick={() => onSelectRemedyForCase(res.remedy.latinName, 'C30')}
                            className="flex-1 sm:flex-none justify-center px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer shadow-2xs"
                          >
                            {t('repertoriumApplyToCase')}
                          </button>
                        )}
                        <button
                          type="button"
                          id={`repertorium-open-monograph-${res.remedy.id}`}
                          onClick={() => setSelectedRemedy(res.remedy)}
                          className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 transition-colors cursor-pointer shadow-2xs"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{t('repertoriumOpenMonograph')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Monograph Detail Modal */}
      {selectedRemedy && (
        <RemedyMonographModal
          isOpen={Boolean(selectedRemedy)}
          remedy={selectedRemedy}
          onClose={() => setSelectedRemedy(null)}
          allRemedies={allRemedies}
          onSelectRemedyForCase={(remName, pot) => {
            if (onSelectRemedyForCase) {
              onSelectRemedyForCase(remName, pot);
            }
            setSelectedRemedy(null);
          }}
        />
      )}
    </div>
  );
};
