import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LocalizedRemedy, 
  getLocalizedRemedies 
} from '../data/materiaMedicaData';
import { 
  matchSymptomsToRemedies, 
  SymptomMatchResult,
  performDifferentialDiagnosis,
  DifferentialDiagnosisResult
} from '../services/quickSymptomMatcher';
import { 
  isSpeechRecognitionSupported, 
  startSpeechRecognition, 
  SpeechRecognitionSession,
  mergeWithOverlap,
  deduplicateRepeatedPhrases
} from '../services/speechService';
import { AcuteClarificationModal } from './AcuteClarificationModal';
import { AcuteVariableModal, AcuteVariableType } from './AcuteVariableModal';
import { 
  formatClinicalVariableForDisplay, 
  enrichClinicalText 
} from '../utils/clinicalVariableFormatter';
import { AcuteAnswers } from '../services/acuteClarificationService';
import { RemedyMonographModal } from './RemedyMonographModal';
import { useTranslation, useLanguage } from '../i18n/LanguageContext';
import { HomeopathicExpertResult } from '../types';
import { analyzeAcuteCaseWithAIOrFallback } from '../services/homeopathicExpertEngine';
import { getRemedyClassicalAuthors } from '../data/classicalAuthorsMap';
import { 
  Mic, 
  MicOff, 
  Clock, 
  Sparkles, 
  RotateCcw, 
  Info, 
  ShieldAlert, 
  SlidersHorizontal, 
  ChevronRight, 
  Pill, 
  CheckCircle2, 
  BookOpen, 
  Copy, 
  Ban, 
  Eye, 
  EyeOff,
  ArrowRight,
  Plus,
  HelpCircle,
  Stethoscope,
  Lock,
  Edit3,
  AlertTriangle,
  Snowflake,
  Flame
} from 'lucide-react';

interface AcuteIntakeViewProps {
  onSelectRemedyForCase?: (remedyName: string, potency: string) => void;
  onGoToMateriaMedica?: () => void;
}

export const AcuteIntakeView: React.FC<AcuteIntakeViewProps> = ({
  onSelectRemedyForCase,
  onGoToMateriaMedica,
}) => {
  const { t } = useTranslation();
  const { language } = useLanguage();

  // Quick Intake & Voice State
  const [symptomText, setSymptomText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecondsLeft, setRecordSecondsLeft] = useState(15);
  const [recommendations, setRecommendations] = useState<SymptomMatchResult[]>([]);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [acuteAnswers, setAcuteAnswers] = useState<AcuteAnswers>({});
  const [diffResult, setDiffResult] = useState<DifferentialDiagnosisResult | null>(null);
  const [showExcludedInView, setShowExcludedInView] = useState<boolean>(false);

  // Classical Homeopathic Expert State
  const [expertResult, setExpertResult] = useState<HomeopathicExpertResult | null>(null);
  const [isCalculatingExpert, setIsCalculatingExpert] = useState(false);

  // 4-Box Variable State & Overrides
  const [variableOverrides, setVariableOverrides] = useState<{
    hauptbeschwerde?: string;
    causa?: string;
    modalitaeten?: string;
    begleitsymptome?: string;
  }>({});
  const [editingVariable, setEditingVariable] = useState<AcuteVariableType | null>(null);

  // Gating State: Differential analysis completed and answers applied
  const [isClarificationApplied, setIsClarificationApplied] = useState<boolean>(false);

  // Modal State
  const [selectedRemedyForModal, setSelectedRemedyForModal] = useState<LocalizedRemedy | null>(null);
  const [modalHistory, setModalHistory] = useState<LocalizedRemedy[]>([]);

  const recognitionRef = useRef<SpeechRecognitionSession | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const recordingBaseTextRef = useRef<string>('');
  const lastSpokenTranscriptRef = useRef<string>('');
  const isFinalizingRef = useRef<boolean>(false);

  useEffect(() => {
    setIsSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  // Fetch localized remedies based on active language
  const localizedRemedies = useMemo(() => {
    return getLocalizedRemedies(language);
  }, [language]);

  // Displayed remedies: ONLY when clarification has been applied via the differential analysis modal (Bild 2)
  const displayedRemedies = useMemo(() => {
    if (!isClarificationApplied) {
      return [];
    }
    if (recommendations.length > 0) {
      return recommendations.map((rec, index) => ({
        remedy: rec.remedy,
        rec,
        isRecommended: true,
        index,
      }));
    }
    return [];
  }, [isClarificationApplied, recommendations]);

  // Helper: check if a variable string is missing, empty, or unknown
  const isVarMissing = (val: string | undefined | null): boolean => {
    if (!val) return true;
    const trimmed = val.trim();
    if (trimmed === '' || trimmed === '—' || trimmed === '-') return true;
    const lower = trimmed.toLowerCase();
    return (
      lower.includes('unbekannt') ||
      lower.includes('erfragen') ||
      lower.includes('unknown') ||
      lower.includes('inquire') ||
      lower.includes('desconocido') ||
      lower.includes('consultar') ||
      lower.includes('inconnu') ||
      lower.includes('demander') ||
      lower.includes('sconosciuto') ||
      lower.includes('chiedere') ||
      lower.includes('άγνωστο') ||
      lower.includes('ρωτήστε') ||
      lower.includes('неизвестно') ||
      lower.includes('уточнить')
    );
  };

  // Resolve the 4 variables from user manual overrides OR 5-step expert engine extractions
  const activeHauptbeschwerde = useMemo(() => {
    if (variableOverrides.hauptbeschwerde) return variableOverrides.hauptbeschwerde;
    if (expertResult?.extraktion?.hauptbeschwerde) return expertResult.extraktion.hauptbeschwerde;
    if (symptomText.trim().length >= 3) return symptomText.trim();
    return '';
  }, [variableOverrides.hauptbeschwerde, expertResult, symptomText]);

  const activeCausa = useMemo(() => {
    if (variableOverrides.causa) return variableOverrides.causa;
    if (expertResult?.extraktion?.causa) return expertResult.extraktion.causa;
    return '';
  }, [variableOverrides.causa, expertResult]);

  const activeModalitaeten = useMemo(() => {
    if (variableOverrides.modalitaeten) return variableOverrides.modalitaeten;
    if (expertResult?.extraktion?.modalitaeten) return expertResult.extraktion.modalitaeten;
    return '';
  }, [variableOverrides.modalitaeten, expertResult]);

  const activeBegleitsymptome = useMemo(() => {
    if (variableOverrides.begleitsymptome) return variableOverrides.begleitsymptome;
    if (expertResult?.extraktion?.begleitsymptome) return expertResult.extraktion.begleitsymptome;
    return '';
  }, [variableOverrides.begleitsymptome, expertResult]);

  // Count how many of the 4 variables are present and known
  const completedVariablesCount = useMemo(() => {
    let count = 0;
    if (!isVarMissing(activeHauptbeschwerde)) count++;
    if (!isVarMissing(activeCausa)) count++;
    if (!isVarMissing(activeModalitaeten)) count++;
    if (!isVarMissing(activeBegleitsymptome)) count++;
    return count;
  }, [activeHauptbeschwerde, activeCausa, activeModalitaeten, activeBegleitsymptome]);

  const isAllFourComplete = completedVariablesCount === 4;

  // Build a comprehensive case narrative incorporating all 4 variables
  const comprehensiveCaseText = useMemo(() => {
    const parts: string[] = [];
    if (symptomText.trim()) parts.push(symptomText.trim());
    if (variableOverrides.causa && !symptomText.includes(variableOverrides.causa)) {
      parts.push(`${t('step1Causa')}: ${variableOverrides.causa}`);
    }
    if (variableOverrides.modalitaeten && !symptomText.includes(variableOverrides.modalitaeten)) {
      parts.push(`${t('step1Modalities')}: ${variableOverrides.modalitaeten}`);
    }
    if (variableOverrides.begleitsymptome && !symptomText.includes(variableOverrides.begleitsymptome)) {
      parts.push(`${t('step1Concomitants')}: ${variableOverrides.begleitsymptome}`);
    }
    return parts.join('\n');
  }, [symptomText, variableOverrides, t]);

  // Handle saving a variable from the AcuteVariableModal
  const handleSaveVariable = (varKey: AcuteVariableType, newValue: string) => {
    const trimmed = newValue.trim();
    // Ensure the saved variable is clinically enriched in the active language
    const enrichedValue = enrichClinicalText(varKey, trimmed, language);
    const finalVal = enrichedValue || trimmed;

    setVariableOverrides((prev) => ({
      ...prev,
      [varKey]: finalVal
    }));

    // Reset clarification applied because the case facts were modified
    setIsClarificationApplied(false);

    // Enrich symptom text with the new information so that AI and matchers have the full narrative
    setSymptomText((prev) => {
      const label = 
        varKey === 'hauptbeschwerde' ? t('step1ChiefComplaint') :
        varKey === 'causa' ? t('step1Causa') :
        varKey === 'modalitaeten' ? t('step1Modalities') :
        t('step1Concomitants');

      if (!prev.toLowerCase().includes(finalVal.toLowerCase())) {
        if (!prev.trim()) {
          return finalVal;
        }
        return `${prev.trim()}\n${label}: ${finalVal}`;
      }
      return prev;
    });
  };

  // Update recommendations & differential diagnosis whenever case text, acute answers, or language changes
  useEffect(() => {
    const query = comprehensiveCaseText || symptomText;
    if (query.trim().length >= 3) {
      const results = matchSymptomsToRemedies(query, language, acuteAnswers);
      setRecommendations(results);
      const diff = performDifferentialDiagnosis(query, language, acuteAnswers);
      setDiffResult(diff);
    } else {
      setRecommendations([]);
      setDiffResult(null);
    }
  }, [comprehensiveCaseText, symptomText, acuteAnswers, language]);

  // Execute 5-Step Homoeopathic Algorithm & Decision Tree
  useEffect(() => {
    let isCancelled = false;
    const query = comprehensiveCaseText || symptomText;
    if (query.trim().length >= 3) {
      setIsCalculatingExpert(true);
      const timer = setTimeout(async () => {
        try {
          const result = await analyzeAcuteCaseWithAIOrFallback(query, language);
          if (!isCancelled) {
            setExpertResult(result);
          }
        } catch (err) {
          console.error('5-step analysis error:', err);
        } finally {
          if (!isCancelled) {
            setIsCalculatingExpert(false);
          }
        }
      }, 350);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    } else {
      setExpertResult(null);
      setIsCalculatingExpert(false);
    }
  }, [comprehensiveCaseText, symptomText, language]);

  // Keep open modal in sync with language change
  useEffect(() => {
    if (selectedRemedyForModal) {
      const updated = localizedRemedies.find((r) => r.id === selectedRemedyForModal.id);
      if (updated) {
        setSelectedRemedyForModal(updated);
      }
    }
  }, [language, localizedRemedies]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Handle Speech Recording (15s Max for Acute Focus)
  const startVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording();
      return;
    }

    if (!isSpeechSupported) return;

    recordingBaseTextRef.current = symptomText;
    lastSpokenTranscriptRef.current = '';
    isFinalizingRef.current = false;
    setRecordSecondsLeft(15);
    setIsRecording(true);

    const session = startSpeechRecognition({
      language: language as any,
      continuous: true,
      interimResults: true,
      onResult: (transcript) => {
        if (isFinalizingRef.current) return;
        const trimmed = transcript.trim();
        if (!trimmed) return;
        lastSpokenTranscriptRef.current = trimmed;

        const base = recordingBaseTextRef.current;
        if (!base) {
          setSymptomText(deduplicateRepeatedPhrases(trimmed));
        } else {
          setSymptomText(mergeWithOverlap(base, trimmed));
        }
      },
      onError: (err) => {
        console.warn('Speech recognition notice:', err);
      },
      onEnd: () => {
        if (!isFinalizingRef.current && isRecording) {
          stopVoiceRecording();
        }
      },
    });

    recognitionRef.current = session;

    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = window.setInterval(() => {
      setRecordSecondsLeft((prev) => {
        if (prev <= 1) {
          stopVoiceRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopVoiceRecording = () => {
    isFinalizingRef.current = true;
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const handleClearSymptomText = () => {
    setSymptomText('');
    setVariableOverrides({});
    setRecommendations([]);
    setDiffResult(null);
    setAcuteAnswers({});
    setExpertResult(null);
    setIsClarificationApplied(false);
  };

  const handleCopyRecommendation = (rec: SymptomMatchResult) => {
    const textToCopy = `${rec.remedy.latinName} (${rec.remedy.commonName})\n${t('rationaleHeader')}: ${rec.clinicalRationale}\n${t('materiaDosageLabel')}: ${rec.remedy.potenciesAndDosage}`;
    navigator.clipboard.writeText(textToCopy);
    setCopySuccess(rec.remedy.id);
    setTimeout(() => {
      setCopySuccess(null);
    }, 2000);
  };

  const handleOpenRemedyModal = (remedy: LocalizedRemedy) => {
    setModalHistory([]);
    setSelectedRemedyForModal(remedy);
  };

  const handleNavigateToRemedy = (targetRemedy: LocalizedRemedy) => {
    if (selectedRemedyForModal) {
      setModalHistory((prev) => [...prev, selectedRemedyForModal]);
    }
    setSelectedRemedyForModal(targetRemedy);
  };

  const handleBackModal = () => {
    if (modalHistory.length > 0) {
      const prev = modalHistory[modalHistory.length - 1];
      setModalHistory((history) => history.slice(0, history.length - 1));
      setSelectedRemedyForModal(prev);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl border border-teal-100/80 shadow-2xs">
                <Mic className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {t('tabQuickIntake')}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  {t('quickIntakePageSubtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Optional Direct Navigation to Materia Medica */}
          {onGoToMateriaMedica && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onGoToMateriaMedica}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-teal-300 bg-white hover:bg-teal-50/50 text-slate-700 hover:text-teal-900 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span>{t('btnGoToMateriaMedica')}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left Column Input / Voice, Right Column 4-Variable Extraction (Equal Height & Even Horizontal Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch animate-in fade-in duration-200">
        {/* Left Column: Recording & Input Area */}
        <div className="flex flex-col h-full">
          {/* 15s Recording Hub */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full space-y-4 relative overflow-hidden">
            <div className="space-y-4">
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

                {/* 15s Timer Display */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                  isRecording 
                    ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse' 
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>00:{recordSecondsLeft < 10 ? `0${recordSecondsLeft}` : recordSecondsLeft}</span>
                </div>
              </div>

              {/* Progress Bar for 15 Seconds */}
              {isRecording && (
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full transition-all duration-1000 ease-linear rounded-full"
                      style={{ width: `${((15 - recordSecondsLeft) / 15) * 100}%` }}
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
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>
                    {t('speechNotSupportedMsg')}
                  </span>
                </div>
              )}

              {/* Symptom Input Textarea - expands flexibly */}
              <div className="space-y-1.5 flex flex-col flex-1">
                <label className="block text-xs font-bold text-slate-700">
                  {t('recordedSymptomsLabel')}:
                </label>
                <textarea
                  rows={5}
                  value={symptomText}
                  onChange={(e) => {
                    setSymptomText(e.target.value);
                    setIsClarificationApplied(false);
                  }}
                  placeholder={t('recordedSymptomsPlaceholder')}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none flex-1 min-h-[140px]"
                />
              </div>
            </div>

            {/* Disclaimer: Not a case documentation */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700 mt-auto">
              <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span className="leading-snug">
                {t('acuteQuestionsDisclaimer')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: 4-Box Classical Analysis & Differential Diagnosis Trigger */}
        <div className="flex flex-col h-full">
          {/* 4-Box Classical Extraction Card */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full space-y-4">
            <div className="space-y-4">
              {/* Header Badge */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-700 text-white shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-900 block">
                      {t('acuteExpertAlgoBadge')}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {t('acuteExpertSub')}
                    </span>
                  </div>
                </div>
                <div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                    isAllFourComplete
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {isAllFourComplete ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>
                      {completedVariablesCount}/4 {isAllFourComplete ? t('allParamsCompleteLabel') : t('treeStatusIncompleteBadge')}
                    </span>
                  </span>
                </div>
              </div>

              {/* Step 1: Extrahierte Fall-Analyse - 4 Boxes */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-800 text-[10px] flex items-center justify-center font-bold">1</span>
                    <span>{t('step1Title')}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {t('variableClickToEdit')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Box 1: Hauptbeschwerde (Leitsymptom) */}
                  <div
                    onClick={() => setEditingVariable('hauptbeschwerde')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs group flex flex-col justify-between min-h-[90px] ${
                      isVarMissing(activeHauptbeschwerde)
                        ? 'bg-slate-50/90 border-2 border-slate-300 hover:border-teal-500/70 hover:bg-slate-100/80 text-slate-800'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          isVarMissing(activeHauptbeschwerde) ? 'text-slate-600' : 'text-slate-500'
                        }`}>
                          {t('step1ChiefComplaint')}
                        </span>
                        {isVarMissing(activeHauptbeschwerde) ? (
                          <Mic className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                        ) : (
                          <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </div>
                      <div className={`text-xs ${
                        isVarMissing(activeHauptbeschwerde) ? 'text-slate-500 italic font-medium' : 'text-slate-900 font-bold'
                      }`}>
                        {formatClinicalVariableForDisplay(activeHauptbeschwerde, 'hauptbeschwerde', language) || '—'}
                      </div>
                    </div>
                    {isVarMissing(activeHauptbeschwerde) && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-900 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-md">
                          <Plus className="w-3 h-3 text-teal-700" />
                          {t('variableMissingBadge')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Box 2: Auslöser (Causa) */}
                  <div
                    onClick={() => setEditingVariable('causa')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs group flex flex-col justify-between min-h-[90px] ${
                      isVarMissing(activeCausa)
                        ? 'bg-slate-50/90 border-2 border-slate-300 hover:border-teal-500/70 hover:bg-slate-100/80 text-slate-800'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          isVarMissing(activeCausa) ? 'text-slate-600' : 'text-slate-500'
                        }`}>
                          {t('step1Causa')}
                        </span>
                        {isVarMissing(activeCausa) ? (
                          <Mic className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                        ) : (
                          <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </div>
                      <div className={`text-xs ${
                        isVarMissing(activeCausa) ? 'text-slate-500 italic font-medium' : 'text-slate-900 font-bold'
                      }`}>
                        {formatClinicalVariableForDisplay(activeCausa, 'causa', language) || '—'}
                      </div>
                    </div>
                    {isVarMissing(activeCausa) && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-900 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-md">
                          <Plus className="w-3 h-3 text-teal-700" />
                          {t('variableMissingBadge')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Box 3: Modalitäten */}
                  <div
                    onClick={() => setEditingVariable('modalitaeten')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs group flex flex-col justify-between min-h-[90px] ${
                      isVarMissing(activeModalitaeten)
                        ? 'bg-slate-50/90 border-2 border-slate-300 hover:border-teal-500/70 hover:bg-slate-100/80 text-slate-800'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          isVarMissing(activeModalitaeten) ? 'text-slate-600' : 'text-slate-500'
                        }`}>
                          {t('step1Modalities')}
                        </span>
                        {isVarMissing(activeModalitaeten) ? (
                          <Mic className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                        ) : (
                          <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </div>
                      <div className={`text-xs ${
                        isVarMissing(activeModalitaeten) ? 'text-slate-500 italic font-medium' : 'text-slate-900 font-bold'
                      }`}>
                        {formatClinicalVariableForDisplay(activeModalitaeten, 'modalitaeten', language) || '—'}
                      </div>
                    </div>
                    {isVarMissing(activeModalitaeten) && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-900 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-md">
                          <Plus className="w-3 h-3 text-teal-700" />
                          {t('variableMissingBadge')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Box 4: Begleitsymptome & Gemüt */}
                  <div
                    onClick={() => setEditingVariable('begleitsymptome')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs group flex flex-col justify-between min-h-[90px] ${
                      isVarMissing(activeBegleitsymptome)
                        ? 'bg-slate-50/90 border-2 border-slate-300 hover:border-teal-500/70 hover:bg-slate-100/80 text-slate-800'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          isVarMissing(activeBegleitsymptome) ? 'text-slate-600' : 'text-slate-500'
                        }`}>
                          {t('step1Concomitants')}
                        </span>
                        {isVarMissing(activeBegleitsymptome) ? (
                          <Mic className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                        ) : (
                          <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </div>
                      <div className={`text-xs ${
                        isVarMissing(activeBegleitsymptome) ? 'text-slate-500 italic font-medium' : 'text-slate-900 font-bold'
                      }`}>
                        {formatClinicalVariableForDisplay(activeBegleitsymptome, 'begleitsymptome', language) || '—'}
                      </div>
                    </div>
                    {isVarMissing(activeBegleitsymptome) && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-900 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-md">
                          <Plus className="w-3 h-3 text-teal-700" />
                          {t('variableMissingBadge')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Differential Diagnosis Action Area */}
            <div className="mt-auto pt-2">
              <button
                type="button"
                onClick={() => setShowClarificationModal(true)}
                disabled={!symptomText.trim() && !activeHauptbeschwerde.trim()}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer ${
                  isClarificationApplied
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                    : isAllFourComplete
                    ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
                    : (symptomText.trim().length >= 3 || activeHauptbeschwerde.trim().length >= 3)
                    ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>{t('startDiffDiagnosisNow')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Remedies Grid (DRUNTER wie auf Bild 1) - ONLY rendered when isClarificationApplied === true and displayedRemedies.length > 0 */}
      {isClarificationApplied && displayedRemedies.length > 0 && (
        <div className="space-y-4 pt-2 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {t('evaluatedRemediesSectionTitle')}
                </h2>
                <p className="text-xs text-slate-500">
                  {t('evaluatedRemediesSectionDesc')}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200/80 px-3 py-1 rounded-full">
              {displayedRemedies.length} {t('recommendationsMatchesFound')}
            </span>
          </div>

        {/* 3-Column Responsive Cards Grid matching Bild 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedRemedies.map(({ remedy, rec, isRecommended, index }) => {
            const authorsInfo = getRemedyClassicalAuthors(remedy.id);
            const hasAnyAuthors = authorsInfo.hahnemann || authorsInfo.kent || authorsInfo.hering;

            return (
              <div
                key={remedy.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${
                  isRecommended && index === 0
                    ? 'border-teal-500 ring-2 ring-teal-500/25 bg-gradient-to-b from-teal-50/20 to-white hover:border-teal-600'
                    : 'border-slate-200/90 hover:border-teal-300'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Top Line: Latin Name + Category Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          index === 0 ? 'bg-teal-700 text-white' : 'bg-slate-700 text-white'
                        }`}>
                          #{index + 1}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors font-serif">
                          {remedy.latinName}
                        </h3>
                        {isRecommended && index === 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-700 text-white shadow-2xs tracking-wide">
                            <Sparkles className="w-3 h-3 text-teal-200" />
                            {t('step4RecommendedLabel')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-medium text-teal-800">
                        {remedy.commonName}
                      </div>
                      {hasAnyAuthors && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {authorsInfo.hahnemann && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60" title="Samuel Hahnemann">
                              Hahnemann
                            </span>
                          )}
                          {authorsInfo.kent && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200/60" title="James Tyler Kent">
                              Kent
                            </span>
                          )}
                          {authorsInfo.hering && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200/60" title="Constantine Hering">
                              Hering
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                          remedy.categoryKey === 'plant'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : remedy.categoryKey === 'mineral'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200/60'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        }`}
                      >
                        {remedy.category}
                      </span>
                      {rec && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                          <Sparkles className="w-3 h-3" />
                          {rec.matchScore}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* If Recommended Match, show Simile Status Badge for alternatives */}
                  {rec && index > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {t('diffDiagAlternative')}
                      </span>
                    </div>
                  )}

                  {/* Localized Essence */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {remedy.essence}
                  </p>

                  {/* Clinical Rationale (Prominently highlighted for recommended simile) */}
                  {(rec?.clinicalRationale || (index === 0 && expertResult?.recommendedSimile?.rationale)) && (
                    <div className={`p-3 rounded-xl text-xs space-y-1.5 ${
                      index === 0
                        ? 'bg-teal-50/90 border-2 border-teal-300/80 text-teal-950 shadow-2xs'
                        : 'bg-slate-50 border border-slate-200/80 text-slate-700'
                    }`}>
                      <div className="font-bold flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 text-teal-900">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="uppercase tracking-wider">
                            {index === 0 ? t('step4RationaleLabel') : t('rationaleHeader')}:
                          </span>
                        </div>
                        {index === 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-700 text-white">
                            {t('diffDiagPrimarySimile')}
                          </span>
                        )}
                      </div>
                      <p className="leading-relaxed text-[11px] text-slate-700">
                        {index === 0 && expertResult?.recommendedSimile?.rationale
                          ? expertResult.recommendedSimile.rationale
                          : rec?.clinicalRationale}
                      </p>
                    </div>
                  )}

                  {/* Keynotes */}
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

                  {/* Modalities (Besser / Schlechter) */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100/60 text-[11px] text-emerald-900">
                      <span className="font-bold flex items-center gap-1 text-emerald-800">
                        <Snowflake className="w-2.5 h-2.5" /> {t('remedyBetter')}:
                      </span>
                      <p className="truncate mt-0.5">{remedy.modalitiesBetter[0] || '—'}</p>
                    </div>
                    <div className="bg-rose-50/70 p-2 rounded-lg border border-rose-100/60 text-[11px] text-rose-900">
                      <span className="font-bold flex items-center gap-1 text-rose-800">
                        <Flame className="w-2.5 h-2.5" /> {t('remedyWorse')}:
                      </span>
                      <p className="truncate mt-0.5">{remedy.modalitiesWorse[0] || '—'}</p>
                    </div>
                  </div>

                  {/* Differential Note (Distinction to primary) */}
                  {rec?.differentialNote && (
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-0.5">
                      <span className="font-semibold text-slate-900 text-[11px] block">
                        {t('diffDiagDistinctionToPrimary')}:
                      </span>
                      <p className="text-slate-600 line-clamp-2 leading-relaxed text-[11px]">
                        {rec.differentialNote}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Action Bar */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 font-medium truncate max-w-[130px]">
                    {remedy.potenciesAndDosage.split('.')[0]}
                  </span>

                  <div className="flex items-center gap-2">
                    {onSelectRemedyForCase && (
                      <button
                        type="button"
                        onClick={() => {
                          const defaultPotency = remedy.potenciesAndDosage.match(/[CDLM]\s*\d+/i)?.[0] || 'C30';
                          onSelectRemedyForCase(remedy.latinName, defaultPotency);
                        }}
                        className="text-xs font-semibold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-md border border-teal-200 flex items-center gap-1 transition-colors cursor-pointer"
                        title={t('btnApplyToCase')}
                      >
                        <Plus className="w-3 h-3 text-teal-600" />
                        <span className="hidden sm:inline">{t('btnApplyToCase')}</span>
                      </button>
                    )}

                    {rec && (
                      <button
                        type="button"
                        onClick={() => handleCopyRecommendation(rec)}
                        className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                        title={t('copyBtn')}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}

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
              </div>
            );
          })}
        </div>

        {/* Differential Excluded Remedies Section */}
        {diffResult && diffResult.excludedRemedies.length > 0 && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold text-slate-800">
                  {t('diffDiagExcludedTitle')} ({diffResult.excludedRemedies.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowExcludedInView((prev) => !prev)}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                {showExcludedInView ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    <span>{t('diffDiagHideExcluded')}</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>{t('diffDiagViewExcluded', { count: diffResult.excludedRemedies.length })}</span>
                  </>
                )}
              </button>
            </div>
            {showExcludedInView && (
              <div className="pt-2 border-t border-slate-200 space-y-1.5 animate-in fade-in duration-100">
                {diffResult.excludedRemedies.map((ex) => (
                  <div
                    key={ex.remedy.id}
                    className="text-xs bg-white border border-rose-100 rounded-lg p-2 flex items-start gap-2 text-rose-950"
                  >
                    <Ban className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold line-through text-slate-600">
                        {ex.remedy.latinName}
                      </span>
                      <p className="text-[11px] text-rose-800 mt-0.5">
                        {ex.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* When clarification has been applied but no remedy candidates matched */}
      {isClarificationApplied && displayedRemedies.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
          <div className="text-sm font-bold text-slate-800">
            {t('noRemediesFoundTitle')}
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {t('noRemediesFoundDesc')}
          </p>
        </div>
      )}

      {/* DETAILED REMEDY MONOGRAPH MODAL */}
      <RemedyMonographModal
        isOpen={Boolean(selectedRemedyForModal)}
        remedy={selectedRemedyForModal}
        onClose={() => {
          setSelectedRemedyForModal(null);
          setModalHistory([]);
        }}
        allRemedies={localizedRemedies}
        modalHistory={modalHistory}
        onBackModal={handleBackModal}
        onNavigateToRemedy={handleNavigateToRemedy}
        onSelectRemedyForCase={onSelectRemedyForCase}
      />

      {/* Logical Acute Clarification Questions Popup */}
      <AcuteClarificationModal
        isOpen={showClarificationModal}
        onClose={() => setShowClarificationModal(false)}
        symptomText={comprehensiveCaseText || symptomText || activeHauptbeschwerde || ''}
        initialAnswers={acuteAnswers}
        onApplyAnswers={(answers) => {
          setAcuteAnswers(answers);
          setIsClarificationApplied(true);
        }}
      />

      {/* Acute Variable Editing Modal (per Voice or Text) */}
      {editingVariable && (
        <AcuteVariableModal
          isOpen={Boolean(editingVariable)}
          variableKey={editingVariable}
          currentValue={
            editingVariable === 'hauptbeschwerde' ? activeHauptbeschwerde :
            editingVariable === 'causa' ? activeCausa :
            editingVariable === 'modalitaeten' ? activeModalitaeten :
            editingVariable === 'begleitsymptome' ? activeBegleitsymptome : ''
          }
          onClose={() => setEditingVariable(null)}
          onSave={(varKey, val) => handleSaveVariable(varKey, val)}
        />
      )}
    </div>
  );
};
