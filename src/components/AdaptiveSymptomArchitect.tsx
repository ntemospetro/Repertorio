import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  MapPin, 
  Flame, 
  Sliders, 
  Award, 
  Clock, 
  Quote, 
  Sparkles, 
  Trash2, 
  MessageSquare, 
  RotateCcw, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  Edit3,
  Activity,
  Zap,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Mic,
  MicOff,
  HelpCircle,
  Check
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageCode } from '../types';
import { RepertoriumSymptomInput } from '../services/boerickeRepertoryService';
import { analyzeChiefComplaint } from '../services/chiefComplaintAnalysisService';
import { startSpeechRecognition, SpeechRecognitionSession } from '../services/speechService';
import { 
  extractCuesFromInitialComplaint, 
  buildSynthesizedSymptomText,
  analyzeAnamnesisInformationNeeds
} from '../services/adaptiveAnamnesisEngine';
import { AdaptiveAnamnesisWizardModal } from './AdaptiveAnamnesisWizardModal';

interface AdaptiveSymptomArchitectProps {
  symptom: RepertoriumSymptomInput;
  onChange: (updated: RepertoriumSymptomInput) => void;
  onRemove?: () => void;
  index: number;
  isSingle: boolean;
  language: LanguageCode;
}

export const AdaptiveSymptomArchitect: React.FC<AdaptiveSymptomArchitectProps> = ({
  symptom,
  onChange,
  onRemove,
  index,
  isSingle,
  language
}) => {
  const { t } = useTranslation();

  // Starting open complaint input (Was führt Sie heute zu mir?)
  const [initialInput, setInitialInput] = useState('');
  const [selectedPrimaryComplaint, setSelectedPrimaryComplaint] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const speechSessionRef = useRef<SpeechRecognitionSession | null>(null);

  useEffect(() => {
    return () => {
      speechSessionRef.current?.stop();
    };
  }, []);

  const toggleSpeechRecognition = () => {
    if (isRecording) {
      speechSessionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      setIsRecording(true);
      speechSessionRef.current = startSpeechRecognition({
        language,
        continuous: true,
        interimResults: true,
        onResult: (transcript) => {
          if (transcript?.trim()) {
            setInitialInput(transcript);
          }
        },
        onError: (err) => {
          console.warn('Speech recognition error:', err);
          setIsRecording(false);
        },
        onEnd: () => {
          setIsRecording(false);
        }
      });
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
    }
  };

  const multiAnalysis = useMemo(() => {
    return analyzeChiefComplaint(initialInput, language);
  }, [initialInput, language]);

  const chiefAnalysis = useMemo(() => {
    const activeText = selectedPrimaryComplaint || initialInput;
    const res = analyzeChiefComplaint(activeText, language);
    return {
      ...res,
      detectedComplaints: multiAnalysis.detectedComplaints,
      hasMultipleComplaints: multiAnalysis.hasMultipleComplaints
    };
  }, [initialInput, selectedPrimaryComplaint, language, multiAnalysis]);

  // Direct manual pillar edit toggle
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  // Guided Step-by-Step Wizard Modal state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);

  const handleOpenWizard = (step = 0) => {
    setWizardStep(step);
    setIsWizardOpen(true);
  };

  // Determine if initial complaint has been captured
  const isStarted = Boolean(symptom.chiefComplaint?.trim() || symptom.chiefQuote?.trim());

  // Start Anamnesis with open chief complaint: save complaint & immediately open popup at Step 1 (WO)
  const handleStartAnamnesis = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = initialInput.trim();
    if (!text) return;

    const chosenPrimary = selectedPrimaryComplaint || text;
    const cues = extractCuesFromInitialComplaint(chosenPrimary);

    let initialConcomitants = cues.concomitants || symptom.concomitants || '';
    if (selectedPrimaryComplaint && chiefAnalysis.hasMultipleComplaints) {
      const others = chiefAnalysis.detectedComplaints
        .filter(c => c.toLowerCase() !== selectedPrimaryComplaint.toLowerCase())
        .join(', ');
      if (others) {
        initialConcomitants = initialConcomitants ? `${initialConcomitants}, ${others}` : others;
      }
    }

    const updated: RepertoriumSymptomInput = {
      ...symptom,
      chiefComplaint: chosenPrimary,
      chiefQuote: text,
      location: cues.location || symptom.location || '',
      sensation: cues.sensation || symptom.sensation || '',
      modalities: cues.modalities || symptom.modalities || '',
      concomitants: initialConcomitants,
      causaEvent: cues.causaEvent || symptom.causaEvent || '',
      causaTemporal: cues.causaTemporal || symptom.causaTemporal || '',
      causaEffect: cues.causaEvent ? 'worse' : symptom.causaEffect || '',
      anamnesisDialogueSteps: [
        {
          id: `step-0-${Date.now()}`,
          timestamp: Date.now(),
          question: t('anamnesisOpeningQuestion'),
          answer: text,
          pillar: 'chiefComplaint',
          depthLevel: 1
        }
      ]
    };

    updated.text = buildSynthesizedSymptomText(updated);
    onChange(updated);
    setInitialInput('');
    setSelectedPrimaryComplaint(null);

    // Immediately open wizard popup for the pillars
    handleOpenWizard(1);
  };

  // Reset entire anamnesis
  const handleResetAnamnesis = () => {
    if (window.confirm(t('anamnesisResetConfirm'))) {
      const resetSymptom: RepertoriumSymptomInput = {
        id: symptom.id,
        text: '',
        weight: symptom.weight || null,
        chiefComplaint: '',
        location: '',
        sensation: '',
        modalities: '',
        concomitants: '',
        chiefQuote: '',
        locationQuote: '',
        sensationQuote: '',
        modalitiesQuote: '',
        concomitantsQuote: '',
        causaEvent: '',
        causaTemporal: '',
        causaEffect: '',
        causaQuote: '',
        causaInterpretation: '',
        anamnesisDialogueSteps: []
      };
      onChange(resetSymptom);
      setInitialInput('');
    }
  };

  // Direct manual field update
  const handleDirectFieldUpdate = (field: keyof RepertoriumSymptomInput, value: any) => {
    const updated = { ...symptom, [field]: value };
    updated.text = buildSynthesizedSymptomText(updated);
    onChange(updated);
  };

  if (!isStarted) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
              {index + 1}
            </div>
            <span className="text-xs font-bold text-slate-800">
              {t('repertoriumPillarChiefComplaint')}
            </span>
          </div>

          {!isSingle && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
              title={t('repertoriumRemoveSymptom')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="p-3 bg-white rounded-xl border border-teal-200/90 shadow-2xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>{t('repertoriumPillarChiefComplaint')}</span>
          </div>
          <form onSubmit={handleStartAnamnesis} className="space-y-2">
            <div className="relative flex items-center">
              <input
                type="text"
                id={`initial-complaint-input-${symptom.id}`}
                value={initialInput}
                onChange={(e) => setInitialInput(e.target.value)}
                placeholder={t('repertoriumSymptomPlaceholder')}
                className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50/70 rounded-lg border border-slate-200 focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400 outline-none transition-all font-medium shadow-2xs"
              />
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`absolute right-1.5 p-1.5 rounded-md transition-colors cursor-pointer ${
                  isRecording 
                    ? 'bg-rose-500 text-white animate-pulse' 
                    : 'text-slate-400 hover:text-teal-700 hover:bg-slate-100'
                }`}
                title={isRecording ? t('chiefComplaintListening') : t('chiefComplaintVoiceBtn')}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Live voice listening state */}
            {isRecording && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold animate-pulse px-1">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span>{t('chiefComplaintListening')}</span>
              </div>
            )}

            {/* Multiple Complaints Disambiguation / Clarification Card */}
            {initialInput.trim() && chiefAnalysis.hasMultipleComplaints && chiefAnalysis.detectedComplaints.length > 1 && (
              <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-300 space-y-2 text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{t('chiefComplaintMultipleDetectedTitle')}</span>
                </div>
                <p className="text-[11px] text-amber-950 font-medium leading-relaxed">
                  {t('chiefComplaintMultipleDetectedPrompt')}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {chiefAnalysis.detectedComplaints.map((complaint, idx) => {
                    const isSelected = selectedPrimaryComplaint === complaint;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPrimaryComplaint(complaint)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-semibold border transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-700 ring-1 ring-amber-400'
                            : 'bg-white text-slate-800 border-amber-200 hover:bg-amber-100 hover:border-amber-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                        <span>{complaint}</span>
                        {isSelected && (
                          <span className="text-[9px] bg-amber-700/70 px-1 py-0.5 rounded text-amber-100">
                            {t('chiefComplaintSelectPrimaryBadge')}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setSelectedPrimaryComplaint(null)}
                    className={`px-2 py-1 text-xs rounded-lg font-medium border transition-colors cursor-pointer ${
                      selectedPrimaryComplaint === null
                        ? 'bg-slate-700 text-white border-slate-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{t('chiefComplaintKeepCombinedOption')}</span>
                  </button>
                </div>
                {selectedPrimaryComplaint && (
                  <p className="text-[10px] text-amber-900 font-medium pt-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>{t('chiefComplaintOtherAsConcomitants')}</span>
                  </p>
                )}
              </div>
            )}

            {/* Real-time domain verification */}
            {initialInput.trim() && (
              <div className="space-y-2 pt-1">
                {chiefAnalysis.isRecognized && chiefAnalysis.organDomain && (
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950 font-medium">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{t('chiefComplaintVerified')}: <strong className="text-emerald-800">{chiefAnalysis.organDomain}</strong></span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-teal-200" />
                    <span>{t('anamnesisStartBtn')}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Adaptive Deepening Anamnesis Modal */}
        <AdaptiveAnamnesisWizardModal
          isOpen={isWizardOpen}
          initialStep={wizardStep}
          symptom={symptom}
          language={language}
          onSave={(updated) => onChange(updated)}
          onClose={() => setIsWizardOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-600/60 border border-teal-400/40 flex items-center justify-center font-bold text-xs shadow-inner">
            {index + 1}
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-wide uppercase text-teal-200 block">
              {t('repertoriumStepNumber')} {index + 1}
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-[220px] sm:max-w-md">
              {symptom.chiefComplaint || symptom.text || t('repertoriumSymptomPlaceholder')}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenWizard(1)}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20 shadow-2xs"
            title={t('anamnesisEditInWizard')}
          >
            <Edit3 className="w-3.5 h-3.5 text-teal-200" />
            <span>{t('anamnesisEditInWizard')}</span>
          </button>

          {isStarted && (
            <button
              type="button"
              onClick={handleResetAnamnesis}
              className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={t('anamnesisResetBtn')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {!isSingle && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded-lg text-teal-200 hover:text-rose-300 hover:bg-white/10 transition-colors cursor-pointer"
              title={t('repertoriumRemoveSymptom')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Dynamic 4-Pillar Information Model Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-700" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    {t('anamnesisModelTitle')}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {t('repertoriumClearAuditNotice')}
                </span>
              </div>

              {/* Chief complaint banner */}
              <div className="p-3 bg-amber-50/60 border border-amber-200/90 rounded-xl flex items-start gap-2.5 shadow-2xs">
                <Quote className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider">
                      {t('repertoriumPillarChiefComplaint')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200">
                        {t('repertoriumStatusConfirmed')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenWizard(0)}
                        className="text-slate-400 hover:text-teal-700 p-1 rounded-md transition-colors cursor-pointer"
                        title={t('anamnesisEditInWizard')}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-800 italic mt-0.5">
                    &bdquo;{symptom.chiefQuote || symptom.chiefComplaint}&ldquo;
                  </p>
                </div>
              </div>

              {/* DYNAMISCHE BEDARFSANALYSE DER PATIENTENANGABEN */}
              {(() => {
                const needsAnalysis = analyzeAnamnesisInformationNeeds(symptom, language);
                if (needsAnalysis.missingNeeds.length > 0) {
                  return (
                    <div className="p-3.5 bg-gradient-to-r from-teal-950 via-slate-900 to-teal-900 text-white rounded-xl border border-teal-500/40 shadow-xs space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300">
                          <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                          <span>{t('anamnesisNeedsTitle')}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                          {needsAnalysis.missingNeeds.length} {t('anamnesisNeedsMissingTitle')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 italic leading-snug">
                        &bdquo;{needsAnalysis.nextRecommendedQuestionText}&ldquo;
                      </p>
                      {needsAnalysis.highestPriorityNeed && (
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-teal-800/60 flex-wrap">
                          <span className="text-[10.5px] text-teal-200/90 font-medium">
                            {needsAnalysis.highestPriorityNeed.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const targetPillar = needsAnalysis.highestPriorityNeed!.pillar;
                              const targetStep = 
                                targetPillar === 'location' ? 1 :
                                targetPillar === 'sensation' ? 2 :
                                targetPillar === 'modalities' ? 3 : 4;
                              handleOpenWizard(targetStep);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                          >
                            <span>{t('anamnesisNeedsAdoptQuestionBtn')}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <div className="p-2.5 bg-emerald-50/90 border border-emerald-200 text-emerald-950 rounded-xl flex items-center justify-between gap-2 text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{t('repertoriumAllPillarsAuditNotice')}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                      {t('repertoriumStatusComplete')}
                    </span>
                  </div>
                );
              })()}

              {/* DIE 4 SÄULEN DER HOMÖOPATHIE: 1. WO, 2. WAS, 3. WANN/WODURCH, 4. WAS NOCH */}
              <div className="space-y-3">
                
                {/* 1. Säule 1 – WO? (Lokalisation & Seitigkeit) */}
                <div className="p-3.5 rounded-xl border border-sky-200/90 bg-gradient-to-br from-sky-50/50 via-white to-sky-50/30 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-600" />
                      {t('anamnesisStepPillarWO')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {symptom.location?.trim() ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {t('repertoriumStatusConfirmed')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium italic">
                          {t('anamnesisPillarEmptyNotice')}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenWizard(1)}
                        className="text-slate-400 hover:text-sky-700 p-1 rounded-md transition-colors cursor-pointer"
                        title={t('anamnesisEditInWizard')}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {symptom.location?.trim() ? (
                    <div className="text-xs text-slate-800 font-semibold bg-white/95 p-2.5 rounded-lg border border-sky-100/90 shadow-2xs">
                      {symptom.location}
                      {symptom.locationQuote && (
                        <span className="block text-[11px] text-amber-800 italic font-normal mt-1">
                          &bdquo;{symptom.locationQuote}&ldquo;
                        </span>
                      )}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setExpandedPillar(expandedPillar === 'loc' ? null : 'loc')}
                    className="text-[10.5px] font-medium text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer pt-0.5"
                  >
                    <span>{expandedPillar === 'loc' ? t('geniusClose') : t('symptomCustomInputPlaceholder')}</span>
                    {expandedPillar === 'loc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {expandedPillar === 'loc' && (
                    <div className="pt-1.5 space-y-1">
                      <input
                        type="text"
                        value={symptom.location || ''}
                        onChange={(e) => handleDirectFieldUpdate('location', e.target.value)}
                        placeholder={t('repertoriumPillar1Placeholder')}
                        className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-sky-300 text-slate-900 outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  )}
                </div>

                {/* 2. Säule 2 – WAS? (Empfindung & Schmerzcharakter) */}
                <div className="p-3.5 rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-600" />
                      {t('anamnesisStepPillarWAS')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {symptom.sensation?.trim() ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {t('repertoriumStatusConfirmed')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium italic">
                          {t('anamnesisPillarEmptyNotice')}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenWizard(2)}
                        className="text-slate-400 hover:text-amber-700 p-1 rounded-md transition-colors cursor-pointer"
                        title={t('anamnesisEditInWizard')}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {symptom.sensation?.trim() ? (
                    <div className="text-xs text-slate-800 font-semibold bg-white/95 p-2.5 rounded-lg border border-amber-100/90 shadow-2xs">
                      {symptom.sensation}
                      {symptom.sensationQuote && (
                        <span className="block text-[11px] text-amber-800 italic font-normal mt-1">
                          &bdquo;{symptom.sensationQuote}&ldquo;
                        </span>
                      )}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setExpandedPillar(expandedPillar === 'sens' ? null : 'sens')}
                    className="text-[10.5px] font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer pt-0.5"
                  >
                    <span>{expandedPillar === 'sens' ? t('geniusClose') : t('symptomCustomInputPlaceholder')}</span>
                    {expandedPillar === 'sens' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {expandedPillar === 'sens' && (
                    <div className="pt-1.5 space-y-1">
                      <input
                        type="text"
                        value={symptom.sensation || ''}
                        onChange={(e) => handleDirectFieldUpdate('sensation', e.target.value)}
                        placeholder={t('repertoriumPillar2Placeholder')}
                        className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-amber-300 text-slate-900 outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  )}
                </div>

                {/* 3. Säule 3 – WANN / WODURCH? (Modalitäten & Causa) */}
                <div className="p-3.5 rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                      {t('anamnesisStepPillarWANN')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {(symptom.modalities?.trim() || symptom.causaEvent?.trim()) ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {t('repertoriumStatusConfirmed')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium italic">
                          {t('anamnesisPillarEmptyNotice')}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenWizard(3)}
                        className="text-slate-400 hover:text-emerald-700 p-1 rounded-md transition-colors cursor-pointer"
                        title={t('anamnesisEditInWizard')}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Modalities Content */}
                  {symptom.modalities?.trim() ? (
                    <div className="text-xs text-slate-800 font-semibold bg-white/95 p-2.5 rounded-lg border border-emerald-100/90 shadow-2xs">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-900 block">{t('symptomModalitiesLabel')}:</span>
                        <span>{symptom.modalities}</span>
                      </div>
                      {symptom.modalitiesQuote && (
                        <span className="block text-[11px] text-amber-800 italic font-normal mt-1">
                          &bdquo;{symptom.modalitiesQuote}&ldquo;
                        </span>
                      )}
                    </div>
                  ) : null}

                  {/* Causa & Auslöser Content within Pillar 3 */}
                  {symptom.causaEvent?.trim() ? (
                    <div className="text-xs text-slate-700 bg-white/95 p-2.5 rounded-lg border border-indigo-100/90 space-y-1 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-semibold text-indigo-900">{t('symptomCausaEventLabel')}:</span>
                        <span className="font-medium text-slate-900">{symptom.causaEvent}</span>
                      </div>
                      {symptom.causaQuote && (
                        <div className="text-[11px] text-amber-800 italic">
                          &bdquo;{symptom.causaQuote}&ldquo;
                        </div>
                      )}
                      {symptom.causaTemporal && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-600">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          <span className="font-medium">{t('symptomCausaTemporalLabel')}:</span>
                          <span>{symptom.causaTemporal}</span>
                        </div>
                      )}
                      {symptom.causaEffect && (
                        <div className="text-[11px] font-medium pt-0.5">
                          <span className="text-slate-600">{t('symptomCausaEffectLabel')}: </span>
                          <span className={symptom.causaEffect === 'worse' ? 'text-rose-700 font-bold' : symptom.causaEffect === 'better' ? 'text-emerald-700 font-bold' : 'text-slate-700'}>
                            {symptom.causaEffect === 'worse' ? t('repertoriumCausaEffectWorse') : symptom.causaEffect === 'better' ? t('repertoriumCausaEffectBetter') : t('repertoriumCausaEffectUnchanged')}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setExpandedPillar(expandedPillar === 'mod' ? null : 'mod')}
                    className="text-[10.5px] font-medium text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer pt-0.5"
                  >
                    <span>{expandedPillar === 'mod' ? t('geniusClose') : t('symptomCustomInputPlaceholder')}</span>
                    {expandedPillar === 'mod' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {expandedPillar === 'mod' && (
                    <div className="pt-1.5 space-y-2">
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-700 block mb-1">{t('symptomModalitiesLabel')}</label>
                        <input
                          type="text"
                          value={symptom.modalities || ''}
                          onChange={(e) => handleDirectFieldUpdate('modalities', e.target.value)}
                          placeholder={t('repertoriumPillar3Placeholder')}
                          className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-emerald-300 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-700 block mb-1">{t('symptomCausaEventLabel')} ({t('anamnesisStepPillarCAUSA')})</label>
                        <input
                          type="text"
                          value={symptom.causaEvent || ''}
                          onChange={(e) => handleDirectFieldUpdate('causaEvent', e.target.value)}
                          placeholder={t('symptomCausaEventPlaceholder')}
                          className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-indigo-300 text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Säule 4 – WAS NOCH? (Begleitsymptome & Gemüt) */}
                <div className="p-3.5 rounded-xl border border-purple-200/90 bg-gradient-to-br from-purple-50/50 via-white to-purple-50/30 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-purple-600" />
                      {t('anamnesisStepPillarWASNOCH')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {symptom.concomitants?.trim() ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {t('repertoriumStatusConfirmed')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium italic">
                          {t('anamnesisPillarEmptyNotice')}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenWizard(4)}
                        className="text-slate-400 hover:text-purple-700 p-1 rounded-md transition-colors cursor-pointer"
                        title={t('anamnesisEditInWizard')}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {symptom.concomitants?.trim() ? (
                    <div className="text-xs text-slate-800 font-semibold bg-white/95 p-2.5 rounded-lg border border-purple-100/90 shadow-2xs">
                      {symptom.concomitants}
                      {symptom.concomitantsQuote && (
                        <span className="block text-[11px] text-amber-800 italic font-normal mt-1">
                          &bdquo;{symptom.concomitantsQuote}&ldquo;
                        </span>
                      )}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setExpandedPillar(expandedPillar === 'concom' ? null : 'concom')}
                    className="text-[10.5px] font-medium text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer pt-0.5"
                  >
                    <span>{expandedPillar === 'concom' ? t('geniusClose') : t('symptomCustomInputPlaceholder')}</span>
                    {expandedPillar === 'concom' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {expandedPillar === 'concom' && (
                    <div className="pt-1.5 space-y-1">
                      <input
                        type="text"
                        value={symptom.concomitants || ''}
                        onChange={(e) => handleDirectFieldUpdate('concomitants', e.target.value)}
                        placeholder={t('repertoriumPillar4Placeholder')}
                        className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-purple-300 text-slate-900 outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  )}
                </div>

              </div>
            </div>
      </div>

      {/* GUIDED ANAMNESIS STEP-BY-STEP MODAL */}
      <AdaptiveAnamnesisWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        symptom={symptom}
        onSave={(updated) => onChange(updated)}
        language={language}
        initialStep={wizardStep}
      />
    </div>
  );
};
