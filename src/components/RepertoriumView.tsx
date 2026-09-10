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
  Award,
  Sparkles,
  MapPin,
  Activity,
  Sliders,
  Copy,
  AlertCircle,
  FilterX,
  Scissors,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useTranslation, useLanguage } from '../i18n/LanguageContext';
import { LocalizedRemedy, getLocalizedRemedies } from '../data/materiaMedicaData';
import { RemedyMonographModal } from './RemedyMonographModal';
import { FunnelStageRemediesModal } from './FunnelStageRemediesModal';
import { 
  findGuidedAnamnesisTopic, 
  GuidedAnamnesisTopic 
} from '../data/guidedAnamnesisQuestions';
import { 
  RepertoriumSymptomInput, 
  SymptomWeightGrade, 
  performBoerickeRepertorisation,
  performSubtractiveFunnelCascade,
  BoerickeRepertorisationResult,
  SubtractiveCascadeReport,
  SubtractiveCascadeStep 
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

  // Track unlocked pillar stage for each symptom (0: Chief only, 1: Location, 2: Sensation, 3: Modalities, 4: Concomitants)
  const [unlockedPillars, setUnlockedPillars] = useState<Record<string, number>>({});

  const getSymptomLevel = (sym: RepertoriumSymptomInput) => {
    const manual = unlockedPillars[sym.id] ?? 0;
    const contentLevel = sym.concomitants?.trim() ? 4 :
      sym.modalities?.trim() ? 3 :
      sym.sensation?.trim() ? 2 :
      sym.location?.trim() ? 1 : 0;
    return Math.max(manual, contentLevel);
  };

  const handleUpdatePillar = (
    id: string,
    field: 'chiefComplaint' | 'location' | 'sensation' | 'modalities' | 'concomitants',
    value: string
  ) => {
    setSymptoms(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: value };
      // Compose canonical symptom text according to Bönninghausen & Kent
      const parts: string[] = [];
      if (updated.chiefComplaint?.trim()) parts.push(updated.chiefComplaint.trim());
      if (updated.location?.trim()) parts.push(updated.location.trim());
      if (updated.sensation?.trim()) parts.push(updated.sensation.trim());
      if (updated.modalities?.trim()) parts.push(updated.modalities.trim());
      if (updated.concomitants?.trim()) parts.push(updated.concomitants.trim());
      
      const newText = parts.length > 0 ? parts.join(', ') : '';
      return {
        ...updated,
        text: newText
      };
    }));
  };

  // Debounced symptoms state so typing into inputs is instantaneous and silky-smooth
  const [debouncedSymptoms, setDebouncedSymptoms] = useState<RepertoriumSymptomInput[]>(symptoms);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSymptoms(symptoms);
    }, 250);
    return () => clearTimeout(handler);
  }, [symptoms]);

  // Filter mode: strict intersection by default (ONLY display remedies matching ALL conditions simultaneously)
  const [strictOnly, setStrictOnly] = useState<boolean>(true);

  // Funnel collapsible state: always closed by default
  const [isFunnelOpen, setIsFunnelOpen] = useState<boolean>(false);

  // Selected stage for full-screen paginated modal
  const [selectedFunnelStep, setSelectedFunnelStep] = useState<SubtractiveCascadeStep | null>(null);

  // Filter by classical authors (All, Hahnemann, Kent, Hering, Boericke)
  const [selectedAuthor, setSelectedAuthor] = useState<ClassicalAuthorFilterKey>('all');

  // Selected remedy for Materia Medica monograph modal
  const [selectedRemedy, setSelectedRemedy] = useState<LocalizedRemedy | null>(null);

  // Copied state for individual remedy 4-pillar report
  const [copiedReportId, setCopiedReportId] = useState<string | null>(null);

  const copyPillarReport = (res: BoerickeRepertorisationResult) => {
    const lines: string[] = [
      `- Name des Mittels: ${res.remedy.latinName} (${res.remedy.commonName})`,
      `- Echte Deckung: ${res.allPillarsCovered ? t('repertoriumFullPillarsQualified') : t('repertoriumPillarsPartialQualified', { covered: res.coveredPillarsCount, total: res.totalPillarsCount })}`,
      `- Mathematischer Score: ${res.totalScore}`,
      `- Buchbelege & Zitate für diesen Fall:`,
    ];

    res.hits.forEach((hit) => {
      hit.pillarProofs.forEach((proof) => {
        const heading = 
          proof.pillarKey === 'chiefComplaint' ? t('repertoriumChiefAndLocHeading') :
          proof.pillarKey === 'location' ? t('repertoriumChiefAndLocHeading') :
          proof.pillarKey === 'sensation' ? t('repertoriumPillar2ReportHeading') :
          proof.pillarKey === 'modalities' ? t('repertoriumPillar3ReportHeading') :
          t('repertoriumPillar4ReportHeading');

        if (proof.matched) {
          lines.push(`  * ${heading}: ${t('repertoriumCitationLabel')}: "${proof.quote}" (${proof.author}, ${proof.work}, ${proof.chapter})`);
        } else {
          lines.push(`  * ${heading}: ${t('repertoriumNoProofInSources')} [${proof.queryText}]`);
        }
      });
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedReportId(res.remedy.id);
    setTimeout(() => setCopiedReportId(null), 2500);
  };

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

  // Compute subtractive funnel cascade for primary structured symptom
  const funnelReport: SubtractiveCascadeReport = useMemo(() => {
    const primarySymptom = debouncedSymptoms.find(s => 
      Boolean(s.chiefComplaint?.trim() || s.text?.trim())
    );
    if (!primarySymptom) {
      return {
        isConfigured: false,
        steps: [],
        abortStepNumber: null,
        abortMessage: null,
        survivingRemedies: []
      };
    }
    return performSubtractiveFunnelCascade(primarySymptom, language, selectedAuthor);
  }, [debouncedSymptoms, language, selectedAuthor]);

  const handleAddSymptom = () => {
    const nextId = `sym-${Date.now()}`;
    setSymptoms(prev => [
      ...prev,
      { id: nextId, text: '', weight: null }
    ]);
    setUnlockedPillars(prev => ({ ...prev, [nextId]: 0 }));
  };

  const handleUpdateSymptom = (id: string, updates: Partial<RepertoriumSymptomInput>) => {
    setSymptoms(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleRemoveSymptom = (id: string) => {
    if (symptoms.length <= 1) {
      setSymptoms([{ id: `sym-${Date.now()}`, text: '', weight: null }]);
      setUnlockedPillars({});
      return;
    }
    setSymptoms(prev => prev.filter(s => s.id !== id));
  };

  const handleReset = () => {
    setSymptoms([
      { id: `sym-${Date.now()}-1`, text: '', weight: null },
    ]);
    setUnlockedPillars({});
    setStrictOnly(true);
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 w-full">
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

            {/* 4 Pillars Case-Taking Standards Notice */}
            <div className="mb-4 p-3 bg-gradient-to-r from-teal-50/70 via-slate-50 to-emerald-50/40 rounded-xl border border-teal-200/70">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-900 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                <span>{t('repertoriumEngineGuideTitle')}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {t('repertoriumEngineGuideDesc')}
              </p>
            </div>

            {/* Symptoms List */}
            <div className="space-y-3">
              {symptoms.map((symptom, index) => {
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
                          {symptom.chiefComplaint?.trim() || t('repertoriumPillarChiefComplaint')}
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

                    {/* Sequential Four Pillars Inputs */}
                    {(() => {
                      const level = getSymptomLevel(symptom);
                      const hasChief = !!(symptom.chiefComplaint?.trim());
                      const hasLoc = !!(symptom.location?.trim());
                      const hasSens = !!(symptom.sensation?.trim());
                      const hasMod = !!(symptom.modalities?.trim());
                      const hasConcom = !!(symptom.concomitants?.trim());

                      return (
                        <div className="p-3.5 bg-gradient-to-br from-teal-50/60 via-slate-50 to-emerald-50/40 rounded-xl border border-teal-200/80 space-y-3 shadow-2xs">
                          {/* Step 0: Hauptbeschwerde (Kernphänomen) */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-teal-700" />
                                <span>{t('repertoriumPillarChiefComplaint')}</span>
                              </span>
                              {hasChief && (
                                <span className="text-[10px] text-teal-700 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-teal-600" />
                                </span>
                              )}
                            </label>
                            <input
                              type="text"
                              id={`repertorium-symptom-${symptom.id}-chief`}
                              value={symptom.chiefComplaint || ''}
                              onChange={(e) => handleUpdatePillar(symptom.id, 'chiefComplaint', e.target.value)}
                              placeholder={t('repertoriumPillarChiefPlaceholder')}
                              className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs font-medium"
                            />
                          </div>

                          {/* Dynamic Guided Anamnesis Dropdown Questions for Pillars 1-4 */}
                          {(() => {
                            const topic = findGuidedAnamnesisTopic(symptom.chiefComplaint || symptom.text || '');
                            if (!topic) return null;

                            return (
                              <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200/90 space-y-3 mt-2 shadow-2xs">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center shrink-0">
                                      <HelpCircle className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <span className="text-[11px] font-bold text-teal-950 block">
                                        {t('repertoriumGuidedAssistantTitle')}
                                      </span>
                                      <span className="text-[10px] text-teal-700 block">
                                        {t('repertoriumGuidedAssistantSubtitle')}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300 shrink-0">
                                    {topic.chiefComplaint[language] || topic.chiefComplaint.de}
                                  </span>
                                </div>

                                <div className="space-y-2.5 pt-1 border-t border-teal-200/60">
                                  {/* Pillar 1 Dropdown (Wo & Wie?) */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                                      <span className="flex items-center gap-1.5 text-sky-800">
                                        <MapPin className="w-3 h-3 text-sky-600" />
                                        <span>{topic.pillar1.title[language] || topic.pillar1.title.de}</span>
                                      </span>
                                      <span className="text-[10px] text-slate-500 italic">
                                        {topic.pillar1.question[language] || topic.pillar1.question.de}
                                      </span>
                                    </div>
                                    <div className="relative">
                                      <select
                                        id={`repertorium-guided-${symptom.id}-p1`}
                                        className="w-full appearance-none px-3 py-2 pr-8 text-xs bg-white text-slate-900 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none shadow-2xs font-medium cursor-pointer transition-colors"
                                        value={
                                          topic.pillar1.options.find(opt => opt.pillarValue === symptom.location)?.id || ''
                                        }
                                        onChange={(e) => {
                                          const selected = topic.pillar1.options.find(opt => opt.id === e.target.value);
                                          handleUpdatePillar(symptom.id, 'location', selected ? selected.pillarValue : '');
                                        }}
                                      >
                                        <option value="">{t('repertoriumGuidedSelectPlaceholder')}</option>
                                        {topic.pillar1.options.map(opt => (
                                          <option key={opt.id} value={opt.id}>
                                            {opt.label[language] || opt.label.de} {opt.remediesHint}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                                    </div>
                                  </div>

                                  {/* Pillar 2 Dropdown (Besser / Schlechter?) */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                                      <span className="flex items-center gap-1.5 text-emerald-800">
                                        <Sliders className="w-3 h-3 text-emerald-600" />
                                        <span>{topic.pillar2.title[language] || topic.pillar2.title.de}</span>
                                      </span>
                                      <span className="text-[10px] text-slate-500 italic">
                                        {topic.pillar2.question[language] || topic.pillar2.question.de}
                                      </span>
                                    </div>
                                    <div className="relative">
                                      <select
                                        id={`repertorium-guided-${symptom.id}-p2`}
                                        className="w-full appearance-none px-3 py-2 pr-8 text-xs bg-white text-slate-900 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none shadow-2xs font-medium cursor-pointer transition-colors"
                                        value={
                                          topic.pillar2.options.find(opt => opt.pillarValue === symptom.modalities)?.id || ''
                                        }
                                        onChange={(e) => {
                                          const selected = topic.pillar2.options.find(opt => opt.id === e.target.value);
                                          handleUpdatePillar(symptom.id, 'modalities', selected ? selected.pillarValue : '');
                                        }}
                                      >
                                        <option value="">{t('repertoriumGuidedSelectPlaceholder')}</option>
                                        {topic.pillar2.options.map(opt => (
                                          <option key={opt.id} value={opt.id}>
                                            {opt.label[language] || opt.label.de} {opt.remediesHint}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                                    </div>
                                  </div>

                                  {/* Pillar 3 Dropdown (Begleitsymptome?) */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                                      <span className="flex items-center gap-1.5 text-purple-800">
                                        <Award className="w-3 h-3 text-purple-600" />
                                        <span>{topic.pillar3.title[language] || topic.pillar3.title.de}</span>
                                      </span>
                                      <span className="text-[10px] text-slate-500 italic">
                                        {topic.pillar3.question[language] || topic.pillar3.question.de}
                                      </span>
                                    </div>
                                    <div className="relative">
                                      <select
                                        id={`repertorium-guided-${symptom.id}-p3`}
                                        className="w-full appearance-none px-3 py-2 pr-8 text-xs bg-white text-slate-900 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none shadow-2xs font-medium cursor-pointer transition-colors"
                                        value={
                                          topic.pillar3.options.find(opt => opt.pillarValue === symptom.concomitants)?.id || ''
                                        }
                                        onChange={(e) => {
                                          const selected = topic.pillar3.options.find(opt => opt.id === e.target.value);
                                          handleUpdatePillar(symptom.id, 'concomitants', selected ? selected.pillarValue : '');
                                        }}
                                      >
                                        <option value="">{t('repertoriumGuidedSelectPlaceholder')}</option>
                                        {topic.pillar3.options.map(opt => (
                                          <option key={opt.id} value={opt.id}>
                                            {opt.label[language] || opt.label.de} {opt.remediesHint}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                                    </div>
                                  </div>

                                  {/* Pillar 4 Dropdown (Gemüt / Geist?) */}
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                                      <span className="flex items-center gap-1.5 text-amber-800">
                                        <Flame className="w-3 h-3 text-amber-600" />
                                        <span>{topic.pillar4.title[language] || topic.pillar4.title.de}</span>
                                      </span>
                                      <span className="text-[10px] text-slate-500 italic">
                                        {topic.pillar4.question[language] || topic.pillar4.question.de}
                                      </span>
                                    </div>
                                    <div className="relative">
                                      <select
                                        id={`repertorium-guided-${symptom.id}-p4`}
                                        className="w-full appearance-none px-3 py-2 pr-8 text-xs bg-white text-slate-900 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none shadow-2xs font-medium cursor-pointer transition-colors"
                                        value={
                                          topic.pillar4.options.find(opt => opt.pillarValue === symptom.sensation)?.id || ''
                                        }
                                        onChange={(e) => {
                                          const selected = topic.pillar4.options.find(opt => opt.id === e.target.value);
                                          handleUpdatePillar(symptom.id, 'sensation', selected ? selected.pillarValue : '');
                                        }}
                                      >
                                        <option value="">{t('repertoriumGuidedSelectPlaceholder')}</option>
                                        {topic.pillar4.options.map(opt => (
                                          <option key={opt.id} value={opt.id}>
                                            {opt.label[language] || opt.label.de} {opt.remediesHint}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Step 1: Säule 1: Lokalisation & Ausstrahlung */}
                          {level >= 1 && (
                            <div className="space-y-1 pt-1 border-t border-teal-100/80 animate-in fade-in duration-200">
                              <label className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-sky-700" />
                                  <span>{t('repertoriumPillar1Loc')}</span>
                                </span>
                                {hasLoc && (
                                  <span className="text-[10px] text-sky-700 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-sky-600" />
                                  </span>
                                )}
                              </label>
                              <input
                                type="text"
                                id={`repertorium-symptom-${symptom.id}-loc`}
                                value={symptom.location || ''}
                                onChange={(e) => handleUpdatePillar(symptom.id, 'location', e.target.value)}
                                placeholder={t('repertoriumPillar1Placeholder')}
                                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs font-medium"
                              />
                            </div>
                          )}

                          {/* Step 2: Säule 2: Empfindung & Schmerzcharakter */}
                          {level >= 2 && (
                            <div className="space-y-1 pt-1 border-t border-teal-100/80 animate-in fade-in duration-200">
                              <label className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Flame className="w-3.5 h-3.5 text-amber-700" />
                                  <span>{t('repertoriumPillar2Sens')}</span>
                                </span>
                                {hasSens && (
                                  <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-amber-600" />
                                  </span>
                                )}
                              </label>
                              <input
                                type="text"
                                id={`repertorium-symptom-${symptom.id}-sens`}
                                value={symptom.sensation || ''}
                                onChange={(e) => handleUpdatePillar(symptom.id, 'sensation', e.target.value)}
                                placeholder={t('repertoriumPillar2Placeholder')}
                                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs font-medium"
                              />
                            </div>
                          )}

                          {/* Step 3: Säule 3: Modalitäten (< Verschlimmerung / > Besserung) */}
                          {level >= 3 && (
                            <div className="space-y-1 pt-1 border-t border-teal-100/80 animate-in fade-in duration-200">
                              <label className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>{t('repertoriumPillar3Mod')}</span>
                                </span>
                                {hasMod && (
                                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  </span>
                                )}
                              </label>
                              <input
                                type="text"
                                id={`repertorium-symptom-${symptom.id}-mod`}
                                value={symptom.modalities || ''}
                                onChange={(e) => handleUpdatePillar(symptom.id, 'modalities', e.target.value)}
                                placeholder={t('repertoriumPillar3Placeholder')}
                                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs font-medium"
                              />
                            </div>
                          )}

                          {/* Step 4: Säule 4: Begleitsymptome (Concomitants) & Causa */}
                          {level >= 4 && (
                            <div className="space-y-1 pt-1 border-t border-teal-100/80 animate-in fade-in duration-200">
                              <label className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Award className="w-3.5 h-3.5 text-purple-700" />
                                  <span>{t('repertoriumPillar4Concom')}</span>
                                </span>
                                {hasConcom && (
                                  <span className="text-[10px] text-purple-700 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-purple-600" />
                                  </span>
                                )}
                              </label>
                              <input
                                type="text"
                                id={`repertorium-symptom-${symptom.id}-concom`}
                                value={symptom.concomitants || ''}
                                onChange={(e) => handleUpdatePillar(symptom.id, 'concomitants', e.target.value)}
                                placeholder={t('repertoriumPillar4Placeholder')}
                                className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs font-medium"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>

            {/* Dynamic Action Button: Next Pillar OR Add Symptom */}
            {(() => {
              const activeSymptom = symptoms[symptoms.length - 1];
              if (!activeSymptom) return null;

              const activeLevel = getSymptomLevel(activeSymptom);
              const hasChief = !!activeSymptom.chiefComplaint?.trim();
              const hasLoc = !!activeSymptom.location?.trim();
              const hasSens = !!activeSymptom.sensation?.trim();
              const hasMod = !!activeSymptom.modalities?.trim();

              if (activeLevel === 0 && hasChief) {
                return (
                  <button
                    type="button"
                    id="repertorium-next-pillar-btn"
                    onClick={() => {
                      setUnlockedPillars(prev => ({ ...prev, [activeSymptom.id]: 1 }));
                      setTimeout(() => document.getElementById(`repertorium-symptom-${activeSymptom.id}-loc`)?.focus(), 50);
                    }}
                    className="mt-4 w-full py-3 px-4 rounded-xl border border-sky-300 hover:border-sky-500 bg-gradient-to-r from-sky-50 via-teal-50 to-emerald-50 hover:from-sky-100 hover:to-emerald-100 text-sky-950 text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <MapPin className="w-4 h-4 text-sky-700" />
                    <span>+ {t('repertoriumPillar1Loc')}</span>
                  </button>
                );
              }

              if (activeLevel === 1 && hasLoc) {
                return (
                  <button
                    type="button"
                    id="repertorium-next-pillar-btn"
                    onClick={() => {
                      setUnlockedPillars(prev => ({ ...prev, [activeSymptom.id]: 2 }));
                      setTimeout(() => document.getElementById(`repertorium-symptom-${activeSymptom.id}-sens`)?.focus(), 50);
                    }}
                    className="mt-4 w-full py-3 px-4 rounded-xl border border-amber-300 hover:border-amber-500 bg-gradient-to-r from-amber-50 via-orange-50 to-teal-50 hover:from-amber-100 hover:to-teal-100 text-amber-950 text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Flame className="w-4 h-4 text-amber-700" />
                    <span>+ {t('repertoriumPillar2Sens')}</span>
                  </button>
                );
              }

              if (activeLevel === 2 && hasSens) {
                return (
                  <button
                    type="button"
                    id="repertorium-next-pillar-btn"
                    onClick={() => {
                      setUnlockedPillars(prev => ({ ...prev, [activeSymptom.id]: 3 }));
                      setTimeout(() => document.getElementById(`repertorium-symptom-${activeSymptom.id}-mod`)?.focus(), 50);
                    }}
                    className="mt-4 w-full py-3 px-4 rounded-xl border border-emerald-300 hover:border-emerald-500 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-950 text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Sliders className="w-4 h-4 text-emerald-700" />
                    <span>+ {t('repertoriumPillar3Mod')}</span>
                  </button>
                );
              }

              if (activeLevel === 3 && hasMod) {
                return (
                  <button
                    type="button"
                    id="repertorium-next-pillar-btn"
                    onClick={() => {
                      setUnlockedPillars(prev => ({ ...prev, [activeSymptom.id]: 4 }));
                      setTimeout(() => document.getElementById(`repertorium-symptom-${activeSymptom.id}-concom`)?.focus(), 50);
                    }}
                    className="mt-4 w-full py-3 px-4 rounded-xl border border-purple-300 hover:border-purple-500 bg-gradient-to-r from-purple-50 via-teal-50 to-emerald-50 hover:from-purple-100 hover:to-emerald-100 text-purple-950 text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <Award className="w-4 h-4 text-purple-700" />
                    <span>+ {t('repertoriumPillar4Concom')}</span>
                  </button>
                );
              }

              return (
                <button
                  type="button"
                  id="repertorium-add-symptom-btn"
                  onClick={handleAddSymptom}
                  className="mt-4 w-full py-3 px-4 rounded-xl border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50 text-teal-900 text-xs md:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('repertoriumAddSymptom')}</span>
                </button>
              );
            })()}

            {/* Secondary option to add another symptom before finishing all 4 pillars if at least one chief complaint is entered */}
            {symptoms.length > 0 && symptoms.some(s => s.chiefComplaint?.trim()) && getSymptomLevel(symptoms[symptoms.length - 1]) < 4 && (
              <div className="mt-2.5 text-center">
                <button
                  type="button"
                  onClick={handleAddSymptom}
                  className="text-xs text-teal-700 hover:text-teal-900 font-medium underline cursor-pointer"
                >
                  + {t('repertoriumAddSymptom')}
                </button>
              </div>
            )}
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

          {/* Subtractive Funnel Filter Visualization (Permanente Reduktion nach Stufen) - Aufklappbar, default geschlossen */}
          {hasAnyEnteredSymptom && funnelReport.isConfigured && funnelReport.steps.length > 0 && (
            <div 
              id="repertorium-subtractive-funnel-card"
              className="bg-white rounded-2xl border border-teal-200/90 shadow-xs overflow-hidden transition-all"
            >
              {/* Collapsible Header Accordion Toggle */}
              <button
                type="button"
                id="repertorium-funnel-collapse-toggle"
                onClick={() => setIsFunnelOpen(prev => !prev)}
                className="w-full text-left p-4 md:p-5 flex items-center justify-between gap-3 hover:bg-teal-50/40 transition-colors cursor-pointer"
                aria-expanded={isFunnelOpen}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 shadow-2xs">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs md:text-sm font-bold text-slate-900">
                        {t('repertoriumFunnelTitle')}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300">
                        {t('repertoriumFunnelActiveBadge')}
                      </span>
                      {funnelReport.survivingRemedies.length > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {funnelReport.survivingRemedies.length} {t('repertoriumRemediesUnit')}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {t('repertoriumFunnelSubtitle')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-teal-700 hidden sm:inline">
                    {isFunnelOpen ? t('repertoriumFunnelToggleClose') : t('repertoriumFunnelToggleOpen')}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-700">
                    {isFunnelOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </button>

              {/* Collapsible Content Area */}
              {isFunnelOpen && (
                <div className="px-4 pb-4 md:px-5 md:pb-5 space-y-3.5 border-t border-slate-100 pt-3.5 animate-in fade-in duration-200">
                  <div className="text-[11px] text-slate-500 bg-teal-50/60 border border-teal-100/90 rounded-xl px-3 py-2 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>
                      {t('repertoriumFunnelClickStageHint', { count: funnelReport.steps[0]?.countAfter || 0 })}
                    </span>
                  </div>

                  {/* Cascade Stages Flow - Clickable for Fullscreen Modal */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {funnelReport.steps.map((step) => {
                      const eliminated = step.countBefore - step.countAfter;
                      return (
                        <button
                          type="button"
                          key={step.stepNumber}
                          id={`repertorium-funnel-step-btn-${step.stepNumber}`}
                          onClick={() => setSelectedFunnelStep(step)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer group hover:shadow-sm ${
                            step.isAborted
                              ? 'bg-rose-50/70 hover:bg-rose-50 border-rose-300 text-rose-900'
                              : 'bg-slate-50/80 hover:bg-teal-50/50 border-slate-200 hover:border-teal-300 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                step.isAborted 
                                  ? 'bg-rose-200 text-rose-800' 
                                  : 'bg-teal-700 text-white'
                              }`}>
                                {step.stepNumber}
                              </span>
                              <span className="text-xs font-bold group-hover:text-teal-900 transition-colors">
                                {step.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              {eliminated > 0 && (
                                <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-md">
                                  {t('repertoriumFunnelEliminatedCount', { count: eliminated })}
                                </span>
                              )}
                              <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 ${
                                step.countAfter > 0 
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                                  : 'bg-rose-100 text-rose-900 border border-rose-300'
                              }`}>
                                <span>{t('repertoriumFunnelRemediesCount', { count: step.countAfter })}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-transform" />
                              </span>
                            </div>
                          </div>

                          <div className="mt-1.5 pl-7 text-[11px] flex items-center justify-between text-slate-600">
                            <span>
                              <span className="font-semibold text-slate-500">Kriterium: </span>
                              <span className="italic font-medium text-slate-800">„{step.inputCriterion}“</span>
                            </span>
                            <span className="text-[10px] text-teal-700 font-semibold group-hover:underline">
                              Liste anzeigen →
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Abort Banner */}
                  {funnelReport.abortStepNumber !== null && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 flex items-start gap-2.5 text-rose-900">
                      <FilterX className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <div className="font-bold">{t('repertoriumFunnelAbortHeading')}</div>
                        <div className="font-medium mt-0.5">{funnelReport.abortMessage}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
                {strictOnly ? t('repertoriumNoFullPillarMatch') : t('repertoriumNoMatches')}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
                {strictOnly 
                  ? t('repertoriumNoFullPillarMatch')
                  : t('repertoriumEmptyStateDesc')}
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
                            res.allPillarsCovered
                              ? 'bg-teal-700 text-white' 
                              : res.coveragePercentage >= 66 
                              ? 'bg-teal-100 text-teal-900 border border-teal-200' 
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {t('repertoriumExactPillarCoverage')}: {res.allPillarsCovered ? t('repertoriumFullPillarsQualified') : t('repertoriumPillarsPartialQualified', { covered: res.coveredPillarsCount, total: res.totalPillarsCount })}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-600 font-semibold">
                          {t('repertoriumMathematicalScore')}: {res.totalScore} Pkt
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

                    {/* 4-Säulen-Buchbelege & Zitate für diesen Fall */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                          <span>{t('repertoriumSourceCitationsTitle')}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyPillarReport(res)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-md border border-teal-200 transition-colors cursor-pointer"
                          title={t('repertoriumCopyCaseReport')}
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedReportId === res.remedy.id ? t('repertoriumReportCopied') : t('repertoriumCopyCaseReport')}</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {res.hits.map((hit, hIdx) => (
                          <div key={hIdx} className="space-y-1.5 bg-slate-50/90 rounded-xl p-3 border border-slate-200/80">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 flex-wrap gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-teal-700">S{hit.symptomIndex}:</span>
                                <span>{hit.symptomText}</span>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                hit.allPillarsSatisfied 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}>
                                {hit.allPillarsSatisfied 
                                  ? t('repertoriumFullPillarsQualified') 
                                  : t('repertoriumPillarsPartialQualified', { covered: hit.coveredPillarsCount, total: hit.totalPillarsDefined })}
                              </span>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              {hit.pillarProofs.map((proof, pIdx) => {
                                const heading = 
                                  proof.pillarKey === 'chiefComplaint' ? t('repertoriumChiefAndLocHeading') :
                                  proof.pillarKey === 'location' ? t('repertoriumChiefAndLocHeading') :
                                  proof.pillarKey === 'sensation' ? t('repertoriumPillar2ReportHeading') :
                                  proof.pillarKey === 'modalities' ? t('repertoriumPillar3ReportHeading') :
                                  t('repertoriumPillar4ReportHeading');

                                return (
                                  <div 
                                    key={pIdx}
                                    className={`text-xs p-2 rounded-lg border flex flex-col gap-0.5 ${
                                      proof.matched 
                                        ? 'bg-white border-slate-200 text-slate-800 shadow-2xs' 
                                        : 'bg-rose-50/60 border-rose-200 text-rose-800'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <span className="font-semibold text-slate-900 text-[11px] flex items-center gap-1">
                                        {proof.matched ? (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        ) : (
                                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                        )}
                                        {heading}
                                      </span>
                                      {proof.matched && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                                          {'★'.repeat(proof.grade)} (Grad {proof.grade})
                                        </span>
                                      )}
                                    </div>

                                    {proof.matched ? (
                                      <div className="pl-4.5 text-[11px] text-slate-700 mt-0.5">
                                        <span className="text-slate-500 font-medium">{t('repertoriumCitationLabel')}: </span>
                                        <span className="font-serif italic font-medium text-slate-900">"{proof.quote}"</span>
                                        <span className="text-slate-500 ml-1.5 text-[10px]">
                                          ({proof.author}, {proof.work}, {proof.chapter})
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="pl-4.5 text-[11px] text-rose-700 italic">
                                        {t('repertoriumNoProofInSources')} [{proof.queryText}]
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
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

      {/* Full-Screen Paginated Funnel Stage Remedies Modal */}
      {selectedFunnelStep && (
        <FunnelStageRemediesModal
          isOpen={Boolean(selectedFunnelStep)}
          step={selectedFunnelStep}
          allRemedies={allRemedies}
          onClose={() => setSelectedFunnelStep(null)}
          onOpenMonograph={(remedy) => {
            setSelectedRemedy(remedy);
          }}
          onSelectRemedyForCase={onSelectRemedyForCase}
        />
      )}
    </div>
  );
};
