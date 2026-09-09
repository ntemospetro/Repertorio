import React, { useState, useMemo } from 'react';
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
    { id: 'sym-1', text: '', weight: 2 },
  ]);

  // Filter mode: strict intersection vs weighted
  const [strictOnly, setStrictOnly] = useState<boolean>(false);

  // Filter by classical authors (All, Hahnemann, Kent, Hering, Boericke)
  const [selectedAuthor, setSelectedAuthor] = useState<ClassicalAuthorFilterKey>('all');

  // Selected remedy for Materia Medica monograph modal
  const [selectedRemedy, setSelectedRemedy] = useState<LocalizedRemedy | null>(null);

  // All remedies for monograph navigation
  const allRemedies = useMemo(() => getLocalizedRemedies(language), [language]);

  // Compute live repertorisation using Boericke & Kent engine
  const rawResults = useMemo(() => {
    return performBoerickeRepertorisation(symptoms, language, strictOnly);
  }, [symptoms, language, strictOnly]);

  // Authors filter definition
  const authors = [
    { key: 'all' as ClassicalAuthorFilterKey, label: t('filterAuthorAll') },
    { key: 'hahnemann' as ClassicalAuthorFilterKey, label: t('filterAuthorHahnemann') },
    { key: 'kent' as ClassicalAuthorFilterKey, label: t('filterAuthorKent') },
    { key: 'hering' as ClassicalAuthorFilterKey, label: t('filterAuthorHering') },
    { key: 'boericke' as ClassicalAuthorFilterKey, label: t('filterAuthorBoericke') }
  ];

  // Filter results by selected author
  const results = useMemo(() => {
    if (selectedAuthor === 'all') return rawResults;
    return rawResults.filter(res => matchesAuthorFilter(res.remedy.id, selectedAuthor));
  }, [rawResults, selectedAuthor]);

  // Individual symptom coverage counts
  const symptomHitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sym of symptoms) {
      if (!sym.text || sym.text.trim().length === 0) {
        counts[sym.id] = 0;
        continue;
      }
      const singleRes = performBoerickeRepertorisation([sym], language, false);
      counts[sym.id] = singleRes.length;
    }
    return counts;
  }, [symptoms, language]);

  const handleAddSymptom = () => {
    const nextId = `sym-${Date.now()}`;
    setSymptoms(prev => [
      ...prev,
      { id: nextId, text: '', weight: 2 }
    ]);
  };

  const handleUpdateSymptom = (id: string, updates: Partial<RepertoriumSymptomInput>) => {
    setSymptoms(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleRemoveSymptom = (id: string) => {
    if (symptoms.length <= 1) {
      setSymptoms([{ id: `sym-${Date.now()}`, text: '', weight: 2 }]);
      return;
    }
    setSymptoms(prev => prev.filter(s => s.id !== id));
  };

  const handleReset = () => {
    setSymptoms([
      { id: `sym-${Date.now()}-1`, text: '', weight: 2 },
    ]);
  };

  const hasAnyEnteredSymptom = useMemo(() => {
    return symptoms.some(s => s.text && s.text.trim().length > 0);
  }, [symptoms]);

  const fullMatchCount = results.filter(r => r.isFullMatch).length;

  return (
    <div id="repertorium-view-root" className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
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
                  Boericke & Kent
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {t('repertoriumSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="repertorium-reset-btn"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('repertoriumReset')}</span>
            </button>
            {onGoToMateriaMedica && (
              <button
                type="button"
                id="repertorium-to-materiamedica-btn"
                onClick={onGoToMateriaMedica}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t('tabMateriaMedica')}</span>
              </button>
            )}
          </div>
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

                    {/* Weight Grade Buttons (1 to 4 Stars) & Coverage Pill */}
                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateSymptom(symptom.id, { weight: 4 })}
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded cursor-pointer transition-colors ${
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
                          onClick={() => handleUpdateSymptom(symptom.id, { weight: 3 })}
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded cursor-pointer transition-colors ${
                            symptom.weight === 3
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                          title={t('repertoriumWeightGrade3')}
                        >
                          ★★★ 3
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSymptom(symptom.id, { weight: 2 })}
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded cursor-pointer transition-colors ${
                            symptom.weight === 2
                              ? 'bg-teal-100 text-teal-900 border border-teal-300 font-bold'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                          title={t('repertoriumWeightGrade2')}
                        >
                          ★★ 2
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSymptom(symptom.id, { weight: 1 })}
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded cursor-pointer transition-colors ${
                            symptom.weight === 1
                              ? 'bg-slate-200 text-slate-800 border border-slate-300 font-bold'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                          title={t('repertoriumWeightGrade1')}
                        >
                          ★ 1
                        </button>
                      </div>

                      {symptom.text.trim().length > 0 && (
                        <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                          {hitsCount} {t('repertoriumMatchesCount')}
                        </span>
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
              className="mt-4 w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-teal-300/80 hover:border-teal-500 bg-teal-50/40 hover:bg-teal-50 text-teal-800 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t('repertoriumAddSymptom')}</span>
            </button>

            {/* Strict Intersection Toggle */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="repertorium-strict-toggle"
                  checked={strictOnly}
                  onChange={(e) => setStrictOnly(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800">
                    {t('repertoriumFilterAllCovered')}
                  </span>
                  <p className="text-slate-500 mt-0.5">
                    {t('repertoriumStrictDesc')}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Clinical Boericke Guidance Card */}
          <div className="bg-gradient-to-br from-teal-50/80 to-slate-50 rounded-2xl border border-teal-200/70 p-4 text-xs text-slate-600 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-teal-900">
              <Award className="w-4 h-4 text-teal-700" />
              <span>{t('repertoriumBoerickeNotice')}</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {t('repertoriumBoerickeGuidance')}
            </p>
          </div>
        </div>

        {/* Right Column: Narrowed Results List (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Results Summary Bar & Classical Authors Filter */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
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

            {/* Classical Authors Filter */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                <span>{t('filterAuthorLabel')}:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {authors.map((auth) => (
                  <button
                    key={auth.key}
                    type="button"
                    onClick={() => setSelectedAuthor(auth.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedAuthor === auth.key
                        ? 'bg-teal-700 text-white shadow-2xs ring-1 ring-teal-800'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    {auth.label}
                  </button>
                ))}
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

                      <div className="flex items-center gap-2 shrink-0">
                        {onSelectRemedyForCase && (
                          <button
                            type="button"
                            onClick={() => onSelectRemedyForCase(res.remedy.latinName, 'C30')}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
                          >
                            In Fall übernehmen
                          </button>
                        )}
                        <button
                          type="button"
                          id={`repertorium-open-monograph-${res.remedy.id}`}
                          onClick={() => setSelectedRemedy(res.remedy)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 transition-colors cursor-pointer shadow-2xs"
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
