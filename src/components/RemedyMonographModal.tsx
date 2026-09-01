import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Info, 
  Sparkles, 
  Pill, 
  CheckCircle2, 
  HeartHandshake, 
  Snowflake, 
  Flame, 
  Tag, 
  ChevronRight, 
  ArrowLeft,
  BookOpen
} from 'lucide-react';
import { LocalizedRemedy } from '../data/materiaMedicaData';
import { useTranslation } from '../i18n/LanguageContext';

// Comprehensive mapping of homeopathic abbreviations and common synonyms to database keys
export const REMEDY_ALIAS_MAP: Record<string, string> = {
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

export function resolveDifferentialRemedy(diffStr: string, remedies: LocalizedRemedy[]): LocalizedRemedy | null {
  if (!diffStr || !remedies || remedies.length === 0) return null;
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

interface RemedyMonographModalProps {
  isOpen: boolean;
  onClose: () => void;
  remedy: LocalizedRemedy | null;
  allRemedies?: LocalizedRemedy[];
}

export const RemedyMonographModal: React.FC<RemedyMonographModalProps> = ({
  isOpen,
  onClose,
  remedy,
  allRemedies = []
}) => {
  const { t } = useTranslation();
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const [activeRemedy, setActiveRemedy] = useState<LocalizedRemedy | null>(remedy);
  const [modalHistory, setModalHistory] = useState<LocalizedRemedy[]>([]);

  useEffect(() => {
    setActiveRemedy(remedy);
    setModalHistory([]);
  }, [remedy, isOpen]);

  if (!isOpen || !activeRemedy) return null;

  const handleSelectDifferentialRemedy = (diffStr: string) => {
    if (allRemedies.length > 0) {
      const matched = resolveDifferentialRemedy(diffStr, allRemedies);
      if (matched) {
        if (activeRemedy) {
          setModalHistory(prev => [...prev, activeRemedy]);
        }
        setActiveRemedy(matched);
        setTimeout(() => {
          if (modalBodyRef.current) {
            modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 50);
      }
    }
  };

  const handleBackModal = () => {
    if (modalHistory.length > 0) {
      const prev = modalHistory[modalHistory.length - 1];
      setModalHistory(old => old.slice(0, -1));
      setActiveRemedy(prev);
      setTimeout(() => {
        if (modalBodyRef.current) {
          modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-800 text-teal-200 uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {t('remedyRepositoryBadge')}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 uppercase tracking-wider">
                {activeRemedy.category}
              </span>
              {activeRemedy.isPolychrest && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-900/60 text-amber-200 border border-amber-500/40">
                  Polychrest
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {activeRemedy.latinName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
              {activeRemedy.commonName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title={t('closeBtn')}
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
              {activeRemedy.origin}
            </p>
          </div>

          {/* 2. Wesenskern & Charakteristik */}
          <div className="space-y-2 bg-teal-50/60 p-4 rounded-xl border border-teal-100">
            <div className="flex items-center gap-2 text-teal-950 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>{t('secEssenceTitle')}:</span>
            </div>
            <p className="text-slate-800 leading-relaxed text-xs sm:text-sm font-medium">
              {activeRemedy.essence}
            </p>
          </div>

          {/* 3. Haupt-Anwendungsgebiete */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Pill className="w-4 h-4 text-teal-600" />
              <span>{t('secIndicationsTitle')}:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeRemedy.mainIndications.map((ind, idx) => (
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
              {activeRemedy.keynotes.map((kn, idx) => (
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
              {activeRemedy.mindEmotional}
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
                {activeRemedy.modalitiesBetter.map((mb, idx) => (
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
                {activeRemedy.modalitiesWorse.map((mw, idx) => (
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
              {activeRemedy.potenciesAndDosage}
            </p>
            {activeRemedy.defaultTagesdosis && (
              <div className="text-xs text-teal-300 pt-1">
                {t('secDefaultDailyDose')}: {activeRemedy.defaultTagesdosis}
              </div>
            )}
          </div>

          {/* 8. Verwandte Mittel & Differenzialdiagnose */}
          {activeRemedy.differentialRemedies && activeRemedy.differentialRemedies.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>{t('secDifferentialTitle')}:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeRemedy.differentialRemedies.map((diff, idx) => {
                  const matched = allRemedies.length > 0 ? resolveDifferentialRemedy(diff, allRemedies) : null;
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
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            {t('closeBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};
