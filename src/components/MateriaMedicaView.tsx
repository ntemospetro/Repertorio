import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Mic, 
  MicOff, 
  Sparkles, 
  Pill, 
  CheckCircle2, 
  Clock, 
  X, 
  Copy, 
  RotateCcw, 
  Tag, 
  ChevronRight, 
  Info, 
  Flame, 
  Snowflake, 
  HeartHandshake,
  ArrowLeft
} from 'lucide-react';
import { 
  getLocalizedRemedies, 
  getLocalizedPresets, 
  LocalizedRemedy 
} from '../data/materiaMedicaData';
import { matchSymptomsToRemedies, SymptomMatchResult } from '../services/quickSymptomMatcher';
import { useTranslation } from '../i18n/LanguageContext';
import { isSpeechRecognitionSupported, startSpeechRecognition, SpeechRecognitionSession } from '../services/speechService';

// Comprehensive mapping of homeopathic abbreviations and common synonyms to database keys
const REMEDY_ALIAS_MAP: Record<string, string> = {
  'rhus tox': 'rhus',
  'rhus toxicodendron': 'rhus',
  'aconitum': 'aconitum',
  'acon': 'aconitum',
  'belladonna': 'belladonna',
  'china': 'cinchona',
  'calc carb': 'calcarea carbonica',
  'calc. carb': 'calcarea carbonica',
  'calc fluor': 'calcarea fluorica',
  'calc phos': 'calcarea phosphorica',
  'calcarea carb': 'calcarea carbonica',
  'nat mur': 'natrium muriaticum',
  'natrum mur': 'natrium muriaticum',
  'natrium muriaticum': 'natrium muriaticum',
  'hepar sulfuris': 'hepar',
  'hepar sulph': 'hepar',
  'kali carb': 'kali carbonicum',
  'kali bich': 'kali bichromicum',
  'mag phos': 'magnesium phosphoricum',
  'carbo veg': 'carbo vegetabilis',
  'ant tart': 'antimonium tartaricum',
  'ant crud': 'antimonium crudum',
  'mercurius': 'mercurius',
  'phos ac': 'phosphoricum',
  'phosphoricum acidum': 'phosphoricum',
  'nitricum acidum': 'nitricum',
  'fluoricum': 'fluoricum',
  'fluoricum acidum': 'fluoricum',
  'lithium carb': 'lithium',
  'ferrum met': 'ferrum metallicum',
  'zincum met': 'zincum metallicum',
  'plumbum met': 'plumbum metallicum',
  'bryonia': 'bryonia',
  'apis': 'apis',
  'arnica': 'arnica',
  'hypericum': 'hypericum',
  'chamomilla': 'chamomilla',
  'ignatia': 'ignatia',
  'gelsemium': 'gelsemium',
  'thuja': 'thuja',
  'lachesis': 'lachesis',
  'pulsatilla': 'pulsatilla',
  'arsenicum': 'arsenicum',
  'lycopodium': 'lycopodium',
  'sepia': 'sepia',
  'silicea': 'silicea',
  'nux vomica': 'nux'
};

/**
 * Resolves a differential diagnosis string (e.g., "Rhus tox (better on motion)")
 * to a LocalizedRemedy in the active database.
 */
function resolveDifferentialRemedy(diffStr: string, remedies: LocalizedRemedy[]): LocalizedRemedy | null {
  if (!diffStr) return null;
  // 1. Strip notes in parentheses or brackets
  let raw = diffStr.replace(/\s*\([^)]*\)/g, '').replace(/\s*\[[^\]]*\]/g, '').trim();
  if (!raw) raw = diffStr.trim();
  raw = raw.replace(/[.,:;!?-]+$/, '').trim();
  const clean = raw.toLowerCase();

  // 2. Direct exact match on latinName or id
  let found = remedies.find(r => 
    r.latinName.toLowerCase() === clean || 
    r.id === clean.replace(/\s+/g, '-') ||
    r.id === clean.replace(/\s+/g, '_')
  );
  if (found) return found;

  // 3. Known aliases check
  for (const [alias, target] of Object.entries(REMEDY_ALIAS_MAP)) {
    if (clean === alias || clean.startsWith(alias) || alias.startsWith(clean)) {
      found = remedies.find(r => 
        r.latinName.toLowerCase().includes(target) || 
        r.id.includes(target)
      );
      if (found) return found;
    }
  }

  // 4. Starts with match
  found = remedies.find(r => r.latinName.toLowerCase().startsWith(clean));
  if (found) return found;

  // 5. First word match
  const firstWord = clean.split(/\s+/)[0];
  if (firstWord && firstWord.length >= 3) {
    found = remedies.find(r => {
      const entryFirstWord = r.latinName.toLowerCase().split(/\s+/)[0];
      return entryFirstWord === firstWord || r.id.startsWith(firstWord);
    });
    if (found) return found;
  }

  // 6. Contains match
  found = remedies.find(r => r.latinName.toLowerCase().includes(clean));
  if (found) return found;

  // 7. Common name / search keywords match
  found = remedies.find(r => 
    r.commonName.toLowerCase() === clean ||
    r.commonName.toLowerCase().includes(clean) ||
    (r.searchKeywords && r.searchKeywords.some(k => k.toLowerCase() === clean || k.toLowerCase().includes(clean)))
  );
  return found || null;
}

interface MateriaMedicaViewProps {
  onSelectRemedyForCase?: (remedyName: string, potency: string) => void;
}

export const MateriaMedicaView: React.FC<MateriaMedicaViewProps> = () => {
  const { t, language } = useTranslation();
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'lexicon' | 'quickIntake'>(() => {
    try {
      const saved = localStorage.getItem('homoeo_mm_tab') || sessionStorage.getItem('homoeo_mm_tab');
      if (saved === 'lexicon' || saved === 'quickIntake') {
        return saved;
      }
    } catch (e) {}
    return 'lexicon';
  });

  useEffect(() => {
    try {
      localStorage.setItem('homoeo_mm_tab', activeTab);
      sessionStorage.setItem('homoeo_mm_tab', activeTab);
    } catch (e) {}
  }, [activeTab]);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLetter, setSelectedLetter] = useState<string>('all');
  const [selectedRemedyForModal, setSelectedRemedyForModal] = useState<LocalizedRemedy | null>(null);
  const [modalHistory, setModalHistory] = useState<LocalizedRemedy[]>([]);

  // Quick Intake & Voice State
  const [symptomText, setSymptomText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecondsLeft, setRecordSecondsLeft] = useState(30);
  const [recommendations, setRecommendations] = useState<SymptomMatchResult[]>([]);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionSession | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const recordingBaseTextRef = useRef<string>('');
  const modalBodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  // Fetch localized remedies based on active language
  const localizedRemedies = useMemo(() => {
    return getLocalizedRemedies(language);
  }, [language]);

  // Fetch localized quick presets
  const localizedPresets = useMemo(() => {
    return getLocalizedPresets(language);
  }, [language]);

  // Update recommendations whenever symptom text or language changes
  useEffect(() => {
    if (symptomText.trim().length >= 3) {
      const results = matchSymptomsToRemedies(symptomText, language);
      setRecommendations(results);
    } else {
      setRecommendations([]);
    }
  }, [symptomText, language]);

  // Keep open modal in sync with language change
  useEffect(() => {
    if (selectedRemedyForModal) {
      const updated = localizedRemedies.find((r) => r.id === selectedRemedyForModal.id);
      if (updated) {
        setSelectedRemedyForModal(updated);
      }
    }
  }, [language, localizedRemedies]);

  // Clean up speech and timers on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Voice recording handler (Max 30s)
  const startVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording();
      return;
    }

    setRecordSecondsLeft(30);
    setIsRecording(true);
    recordingBaseTextRef.current = symptomText;

    try {
      const session = startSpeechRecognition({
        language: language as any,
        continuous: true,
        interimResults: true,
        onResult: (transcript) => {
          const base = recordingBaseTextRef.current.trim();
          const trimmed = transcript.trim();
          if (!base || !trimmed) {
            setSymptomText(trimmed);
          } else if (base.toLowerCase().endsWith(trimmed.toLowerCase())) {
            setSymptomText(base);
          } else {
            setSymptomText(`${base} ${trimmed}`);
          }
        },
        onError: (err) => {
          console.warn('Speech recognition notice:', err);
        },
        onEnd: () => {
          // handled
        }
      });

      recognitionRef.current = session;

      // Start 30s countdown timer
      const interval = window.setInterval(() => {
        setRecordSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            stopVoiceRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      timerIntervalRef.current = interval;
    } catch (e) {
      console.error('Error starting speech recognition:', e);
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);
  };

  const handleClearSymptomText = () => {
    stopVoiceRecording();
    setSymptomText('');
    setRecommendations([]);
    setRecordSecondsLeft(30);
  };

  const handleOpenRemedyModal = (remedy: LocalizedRemedy) => {
    setModalHistory([]);
    setSelectedRemedyForModal(remedy);
    setTimeout(() => {
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTop = 0;
      }
    }, 10);
  };

  const handleSelectDifferentialRemedy = (diffStr: string) => {
    const matched = resolveDifferentialRemedy(diffStr, localizedRemedies);
    if (matched) {
      if (selectedRemedyForModal) {
        setModalHistory(prev => [...prev, selectedRemedyForModal]);
      }
      setSelectedRemedyForModal(matched);
      setTimeout(() => {
        if (modalBodyRef.current) {
          modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    } else {
      // If not directly in standard 126 DB, fallback to searching in Lexicon
      const raw = diffStr.replace(/\s*\([^)]*\)/g, '').trim();
      setSearchQuery(raw);
      setSelectedRemedyForModal(null);
      setActiveTab('lexicon');
    }
  };

  const handleBackModal = () => {
    if (modalHistory.length === 0) return;
    const previous = modalHistory[modalHistory.length - 1];
    setModalHistory(prev => prev.slice(0, -1));
    setSelectedRemedyForModal(previous);
    setTimeout(() => {
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleApplyPreset = (preset: string) => {
    setSymptomText((prev) => {
      if (!prev) return preset;
      return prev.trim() + ', ' + preset;
    });
  };

  const handleCopyRecommendation = (item: SymptomMatchResult) => {
    const text = `${item.remedy.latinName} (${item.remedy.commonName})\n${t('matchScoreLabel')}: ${item.matchScore}%\n${t('rationaleHeader')}: ${item.clinicalRationale}\n${t('materiaDosageLabel')}: ${item.remedy.potenciesAndDosage}`;
    navigator.clipboard.writeText(text);
    setCopySuccess(item.remedy.id);
    setTimeout(() => setCopySuccess(null), 2500);
  };

  // Filter Remedies for Lexicon
  const filteredRemedies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return localizedRemedies.filter((remedy) => {
      // Search filter across Latin name, localized common name, essence, indications, keynotes and search keywords
      const matchesSearch =
        !q ||
        remedy.latinName.toLowerCase().includes(q) ||
        remedy.commonName.toLowerCase().includes(q) ||
        remedy.essence.toLowerCase().includes(q) ||
        remedy.mainIndications.some((ind) => ind.toLowerCase().includes(q)) ||
        remedy.keynotes.some((kn) => kn.toLowerCase().includes(q)) ||
        remedy.searchKeywords.some((kw) => kw.toLowerCase().includes(q));

      // Category filter
      const matchesCategory = selectedCategory === 'all' || remedy.categoryKey === selectedCategory;

      // Alphabet filter by Latin name first letter
      const firstLetter = remedy.latinName[0].toUpperCase();
      const matchesLetter = selectedLetter === 'all' || firstLetter === selectedLetter;

      return matchesSearch && matchesCategory && matchesLetter;
    });
  }, [localizedRemedies, searchQuery, selectedCategory, selectedLetter]);

  const uniqueLetters = useMemo(() => {
    return Array.from(new Set(localizedRemedies.map((r) => r.latinName[0].toUpperCase()))).sort();
  }, [localizedRemedies]);

  const categories = [
    { key: 'all', label: t('filterAll') },
    { key: 'plant', label: t('filterPlant') },
    { key: 'mineral', label: t('filterMineral') },
    { key: 'animal', label: t('filterAnimal') }
  ];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-100/80 shadow-2xs">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {t('materiaMedicaTitle')}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  {t('materiaMedicaSubtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex flex-col lg:flex-row items-stretch sm:items-start lg:items-center gap-2 w-full lg:w-auto shrink-0">
            {/* Akutaufnahme (auf Responsive oben / über Arzneimittel-Lexikon) */}
            <button
              id="btn-materia-tab-quickintake"
              type="button"
              onClick={() => setActiveTab('quickIntake')}
              className={`order-1 lg:order-2 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs ${
                activeTab === 'quickIntake'
                  ? 'bg-teal-800 hover:bg-teal-900 text-white ring-2 ring-teal-500/30'
                  : 'bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white'
              }`}
            >
              <Mic className="w-4 h-4 text-white shrink-0" />
              <span className="whitespace-nowrap">{t('tabQuickIntake')}</span>
              {recommendations.length > 0 && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-teal-950/40 text-teal-100 font-bold border border-teal-400/30 shrink-0">
                  {recommendations.length} {t('recommendationsCountBadge')}
                </span>
              )}
            </button>

            {/* Arzneimittel-Lexikon (auf Responsive darunter / auf Desktop links) */}
            <button
              id="btn-materia-tab-lexicon"
              type="button"
              onClick={() => setActiveTab('lexicon')}
              className={`order-2 lg:order-1 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'lexicon'
                  ? 'bg-slate-100 text-slate-900 border border-slate-300 shadow-2xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4 text-teal-700 shrink-0" />
              <span className="whitespace-nowrap">{t('tabLexicon')}</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-medium shrink-0">
                {localizedRemedies.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: MATERIA MEDICA LEXICON */}
      {activeTab === 'lexicon' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Search, Filter & Alphabet Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('materiaSearchPlaceholder')}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="grid grid-cols-2 gap-2 w-full lg:w-auto lg:flex lg:items-center lg:gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`flex items-center justify-center text-center px-3 py-2 lg:py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat.key
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Alphabet Quick Jump */}
            <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-slate-100 pb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1.5 shrink-0">
                {t('indexAlphabet')}:
              </span>
              <button
                type="button"
                onClick={() => setSelectedLetter('all')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer shrink-0 transition-colors ${
                  selectedLetter === 'all' ? 'bg-teal-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t('filterAll')}
              </button>
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => {
                const hasRemedies = uniqueLetters.includes(l);
                const isSelected = selectedLetter === l;
                return (
                  <button
                    key={l}
                    type="button"
                    disabled={!hasRemedies}
                    onClick={() => setSelectedLetter(l)}
                    className={`w-6 h-6 rounded text-xs font-semibold shrink-0 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-2xs cursor-pointer'
                        : hasRemedies
                        ? 'text-slate-700 hover:bg-teal-50 hover:text-teal-700 cursor-pointer font-medium'
                        : 'text-slate-300 cursor-not-allowed opacity-40'
                    }`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              {t('showingRemediesCount')}: <strong className="text-slate-800">{filteredRemedies.length}</strong> /{' '}
              {localizedRemedies.length}
            </span>
            {(searchQuery || selectedCategory !== 'all' || selectedLetter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedLetter('all');
                }}
                className="text-teal-700 hover:text-teal-900 font-semibold cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                {t('resetFilters')}
              </button>
            )}
          </div>

          {/* Remedies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRemedies.map((remedy) => (
              <div
                key={remedy.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-teal-300"
              >
                <div className="space-y-3.5">
                  {/* Latin Name as Headline + Localized Name Subtitle */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors font-serif">
                        {remedy.latinName}
                      </h3>
                      <div className="text-xs font-medium text-teal-800 mt-0.5">
                        {remedy.commonName}
                      </div>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                        remedy.categoryKey === 'plant'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : remedy.categoryKey === 'mineral'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200/60'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}
                    >
                      {remedy.category}
                    </span>
                  </div>

                  {/* Localized Essence */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {remedy.essence}
                  </p>

                  {/* Localized Keynotes */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      <span>{t('remedyKeynotesTitle')}</span>
                    </div>
                    <div className="space-y-1">
                      {remedy.keynotes.slice(0, 2).map((kn, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{kn}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Localized Modalities */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100/60 text-[11px] text-emerald-900">
                      <span className="font-bold flex items-center gap-1 text-emerald-800">
                        <Snowflake className="w-2.5 h-2.5" /> {t('remedyBetter')}:
                      </span>
                      <p className="truncate mt-0.5">{remedy.modalitiesBetter[0]}</p>
                    </div>
                    <div className="bg-rose-50/70 p-2 rounded-lg border border-rose-100/60 text-[11px] text-rose-900">
                      <span className="font-bold flex items-center gap-1 text-rose-800">
                        <Flame className="w-2.5 h-2.5" /> {t('remedyWorse')}:
                      </span>
                      <p className="truncate mt-0.5">{remedy.modalitiesWorse[0]}</p>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium truncate max-w-[150px]">
                    {remedy.potenciesAndDosage.split('.')[0]}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenRemedyModal(remedy)}
                    className="flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 group-hover:translate-x-0.5 transition-all cursor-pointer"
                  >
                    <span>{t('viewMonograph')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredRemedies.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">{t('noRemediesFoundTitle')}</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {t('noRemediesFoundDesc')}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedLetter('all');
                }}
                className="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 cursor-pointer"
              >
                {t('showAllRemediesBtn')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SCHNELLAUFNAHME & VOICE 30s */}
      {activeTab === 'quickIntake' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* Left Column: Recording & Input Area */}
          <div className="lg:col-span-6 space-y-5">
            {/* 30s Recording Hub */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isRecording ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-teal-50 text-teal-700'}`}>
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {t('quickIntakeTitle')}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {t('quickIntakeSubtitle')}
                    </p>
                  </div>
                </div>

                {/* 30s Timer Display */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                  isRecording 
                    ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse' 
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>00:{recordSecondsLeft < 10 ? `0${recordSecondsLeft}` : recordSecondsLeft}</span>
                </div>
              </div>

              {/* Progress Bar for 30 Seconds */}
              {isRecording && (
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full transition-all duration-1000 ease-linear rounded-full"
                      style={{ width: `${((30 - recordSecondsLeft) / 30) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>{t('voiceRecordingStatus')}</span>
                    <span>{t('voiceMaxSeconds')}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  disabled={!isSpeechSupported}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-xs cursor-pointer ${
                    isRecording
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                      : 'bg-teal-700 hover:bg-teal-800 text-white'
                  } ${!isSpeechSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>{t('voiceStopBtn')} ({recordSecondsLeft}s)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>{t('voiceStartBtn')}</span>
                    </>
                  )}
                </button>

                {symptomText && (
                  <button
                    type="button"
                    onClick={handleClearSymptomText}
                    className="px-3.5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                    title={t('clearBtn')}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t('clearBtn')}</span>
                  </button>
                )}
              </div>

              {!isSpeechSupported && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    {t('speechNotSupportedMsg')}
                  </span>
                </div>
              )}

              {/* Symptom Input Textarea */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-slate-700">
                  {t('recordedSymptomsLabel')}:
                </label>
                <textarea
                  rows={4}
                  value={symptomText}
                  onChange={(e) => setSymptomText(e.target.value)}
                  placeholder={t('recordedSymptomsPlaceholder')}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
                />
              </div>

              {/* Fast Presets / Symptom Chips in selected language */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t('quickPresetsTitle')}:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {localizedPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 text-xs font-medium transition-colors cursor-pointer border border-slate-200/80"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Instant Remedy Recommendations */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    {t('materiaRecsTitle')}
                  </h2>
                </div>
                {recommendations.length > 0 && (
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                    {recommendations.length} {t('recommendationsMatchesFound')}
                  </span>
                )}
              </div>

              {recommendations.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                    <Pill className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {t('readyForAnalysisTitle')}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {t('readyForAnalysisDesc')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div
                      key={rec.remedy.id}
                      className={`p-4 rounded-xl border transition-all ${
                        index === 0
                          ? 'bg-gradient-to-br from-teal-50/70 to-emerald-50/40 border-teal-200 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Top Header with Latin name as primary */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-700 text-white">
                              #{index + 1}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 font-serif">
                              {rec.remedy.latinName}
                            </h3>
                          </div>
                          <div className="text-xs font-medium text-teal-800 mt-0.5">
                            {rec.remedy.commonName}
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                            <Sparkles className="w-3 h-3" />
                            {rec.matchScore}%
                          </span>
                        </div>
                      </div>

                      {/* Clinical Rationale in active language */}
                      <div className="mt-2.5 p-2.5 rounded-lg bg-white/80 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                        <div className="font-semibold text-teal-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>{t('rationaleHeader')}:</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          {rec.clinicalRationale}
                        </p>
                      </div>

                      {/* Dosage Guidance */}
                      <div className="mt-2 text-[11px] text-slate-500">
                        <strong className="text-slate-700">{t('materiaDosageLabel')}:</strong> {rec.remedy.potenciesAndDosage}
                      </div>

                      {/* Action Bar */}
                      <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenRemedyModal(rec.remedy)}
                          className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{t('viewInLexicon')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyRecommendation(rec)}
                          className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copySuccess === rec.remedy.id ? t('copiedBtn') : t('copyBtn')}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAILED REMEDY MONOGRAPH MODAL */}
      {selectedRemedyForModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
            {/* Modal Header: Latin Name as Headline + Localized name subtitle + Navigation Back */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between gap-4 shrink-0">
              <div className="space-y-1.5 flex-1 min-w-0">
                {modalHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBackModal}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white text-xs font-semibold mb-1 transition-colors cursor-pointer border border-slate-700 shadow-2xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{t('btnBackToPreviousRemedy', { remedy: modalHistory[modalHistory.length - 1].latinName })}</span>
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {selectedRemedyForModal.category}
                  </span>
                  <span className="text-xs text-slate-400">{t('remedyRepositoryBadge')}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-serif truncate">
                  {selectedRemedyForModal.latinName}
                </h2>
                <p className="text-sm font-medium text-teal-300 truncate">
                  {selectedRemedyForModal.commonName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedRemedyForModal(null);
                  setModalHistory([]);
                }}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div 
              ref={modalBodyRef}
              className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-sm"
            >
              {/* 1. Herkunft & Rohstoff */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <Info className="w-4 h-4 text-teal-600" />
                  <span>{t('secOriginTitle')}:</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                  {selectedRemedyForModal.origin}
                </p>
              </div>

              {/* 2. Wesenskern & Charakteristik */}
              <div className="space-y-2 bg-teal-50/60 p-4 rounded-xl border border-teal-100">
                <div className="flex items-center gap-2 text-teal-950 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>{t('secEssenceTitle')}:</span>
                </div>
                <p className="text-slate-800 leading-relaxed text-xs sm:text-sm font-medium">
                  {selectedRemedyForModal.essence}
                </p>
              </div>

              {/* 3. Haupt-Anwendungsgebiete */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <Pill className="w-4 h-4 text-teal-600" />
                  <span>{t('secIndicationsTitle')}:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedRemedyForModal.mainIndications.map((ind, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span className="font-medium text-slate-800">{ind}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Leitsymptome nach Samuel Hahnemann */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>{t('secKeynotesTitle')}:</span>
                </div>
                <ul className="space-y-1.5 list-disc list-inside bg-amber-50/40 p-4 rounded-xl border border-amber-100 text-xs sm:text-sm text-slate-800">
                  {selectedRemedyForModal.keynotes.map((kn, idx) => (
                    <li key={idx} className="leading-relaxed">
                      <span className="font-semibold text-slate-900">{kn}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 5. Gemüt & Psyche */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <HeartHandshake className="w-4 h-4 text-indigo-600" />
                  <span>{t('secMindTitle')}:</span>
                </div>
                <p className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100 text-xs sm:text-sm text-slate-800 leading-relaxed">
                  {selectedRemedyForModal.mindEmotional}
                </p>
              </div>

              {/* 6. Modalitäten */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                    <Snowflake className="w-4 h-4 text-emerald-700" />
                    <span>{t('secModalitiesBetterTitle')}:</span>
                  </div>
                  <ul className="space-y-1 text-xs text-emerald-950">
                    {selectedRemedyForModal.modalitiesBetter.map((mb, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="font-bold text-emerald-700">•</span>
                        <span>{mb}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 bg-rose-50/60 p-4 rounded-xl border border-rose-100">
                  <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs uppercase tracking-wider">
                    <Flame className="w-4 h-4 text-rose-700" />
                    <span>{t('secModalitiesWorseTitle')}:</span>
                  </div>
                  <ul className="space-y-1 text-xs text-rose-950">
                    {selectedRemedyForModal.modalitiesWorse.map((mw, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="font-bold text-rose-700">•</span>
                        <span>{mw}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 7. Dosierung & Potenzen */}
              <div className="space-y-2 bg-slate-900 text-white p-4 rounded-xl">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
                  <Tag className="w-4 h-4" />
                  <span>{t('secDosageTitle')}:</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {selectedRemedyForModal.potenciesAndDosage}
                </p>
                {selectedRemedyForModal.defaultTagesdosis && (
                  <div className="text-xs text-teal-300 pt-1">
                    {t('secDefaultDailyDose')}: {selectedRemedyForModal.defaultTagesdosis}
                  </div>
                )}
              </div>

              {/* 8. Verwandte Mittel & Differenzialdiagnose (ANKLICKBAR mit Direkt-Navigation) */}
              {selectedRemedyForModal.differentialRemedies.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>{t('secDifferentialTitle')}:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedRemedyForModal.differentialRemedies.map((diff, idx) => {
                      const matched = resolveDifferentialRemedy(diff, localizedRemedies);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectDifferentialRemedy(diff)}
                          title={matched ? t('clickToOpenRemedy', { remedy: matched.latinName }) : diff}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer group shadow-2xs hover:shadow-xs ${
                            matched
                              ? 'bg-teal-50/80 hover:bg-teal-600 hover:text-white text-teal-900 border-teal-200/90 hover:border-teal-600'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Pill className={`w-3.5 h-3.5 ${matched ? 'text-teal-600 group-hover:text-white' : 'text-slate-400'} shrink-0`} />
                          <span className="font-semibold">{diff}</span>
                          <ChevronRight className={`w-3.5 h-3.5 ${matched ? 'text-teal-500 group-hover:text-white group-hover:translate-x-0.5' : 'text-slate-300'} transition-transform shrink-0`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {modalHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBackModal}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t('btnBackToPreviousRemedy', { remedy: modalHistory[modalHistory.length - 1].latinName })}</span>
                  </button>
                )}
                <span className="text-xs text-slate-500 hidden sm:inline">
                  {t('monographHeader')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRemedyForModal(null);
                  setModalHistory([]);
                }}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                {t('closeBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
