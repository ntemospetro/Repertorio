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
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
        {/* Header Bar */}
        <div className="bg-teal-900 text-white px-4 py-3 flex items-center justify-between border-b border-teal-950">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs shadow-inner">
              {index + 1}
            </div>
            <div>
              <span className="text-[10.5px] font-bold tracking-wider uppercase text-teal-200/90 block leading-tight">
                {t('repertoriumStepNumber')} {index + 1}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-[220px] sm:max-w-md">
                {symptom.chiefComplaint || symptom.text || t('repertoriumSymptomPlaceholder')}
              </h4>
            </div>
          </div>

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

        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>{t('repertoriumPillarChiefComplaint')}</span>
          </div>
          <form onSubmit={handleStartAnamnesis} className="space-y-3">
            <div className="flex flex-row gap-2.5 items-stretch">
              <div className="relative flex-1">
                <textarea
                  id={`initial-complaint-input-${symptom.id}`}
                  rows={3}
                  value={initialInput}
                  onChange={(e) => setInitialInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleStartAnamnesis();
                    }
                  }}
                  placeholder={t('repertoriumSymptomPlaceholder')}
                  className="w-full h-full min-h-[85px] p-3 text-xs bg-slate-50/70 rounded-xl border border-slate-200 focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400 outline-none transition-all font-medium resize-none shadow-2xs"
                />
              </div>
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`w-24 sm:w-28 shrink-0 rounded-xl text-white flex flex-col items-center justify-center gap-1.5 p-2.5 transition-all shadow-xs cursor-pointer min-h-[85px] border ${
                  isRecording 
                    ? 'bg-rose-600 hover:bg-rose-700 animate-pulse border-rose-700' 
                    : 'bg-teal-700 hover:bg-teal-800 border-teal-800'
                }`}
                title={isRecording ? t('chiefComplaintListening') : t('chiefComplaintVoiceBtn')}
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white shadow-inner">
                  {isRecording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                </div>
                <span className="text-[11px] font-semibold text-white tracking-wide text-center leading-tight">
                  {isRecording ? t('voiceStopBtn') : t('voiceRecordCardLabel')}
                </span>
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
              <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200 space-y-2 text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 text-teal-950 font-bold">
                  <HelpCircle className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  <span>{t('chiefComplaintMultipleDetectedTitle')}</span>
                </div>
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
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
                            ? 'bg-teal-700 text-white border-teal-800 ring-1 ring-teal-600'
                            : 'bg-white text-slate-800 border-teal-200 hover:bg-teal-50 hover:border-teal-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                        <span>{complaint}</span>
                        {isSelected && (
                          <span className="text-[9px] bg-teal-800 px-1 py-0.5 rounded text-teal-100">
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
                  <p className="text-[10px] text-teal-900 font-medium pt-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-600 shrink-0" />
                    <span>{t('chiefComplaintOtherAsConcomitants')}</span>
                  </p>
                )}
              </div>
            )}

            {/* Real-time domain verification */}
            {initialInput.trim() && (
              <div className="space-y-2 pt-1">
                {chiefAnalysis.isRecognized && chiefAnalysis.organDomain && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-950 font-medium">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{t('chiefComplaintVerified')}: <strong className="text-emerald-800">{chiefAnalysis.organDomain}</strong></span>
                    </div>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="submit"
                    className="w-full relative overflow-hidden py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-all border border-teal-800 bg-teal-700 hover:bg-teal-800 text-white cursor-pointer group"
                  >
                    <Sparkles className="w-4 h-4 text-teal-200 group-hover:scale-110 transition-transform shrink-0" />
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
      {/* Header Bar: Restrained, elegant header matching the clean design */}
      <div className="bg-teal-900 text-white px-4 py-3 flex items-center justify-between border-b border-teal-950">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs shadow-inner">
            {index + 1}
          </div>
          <div>
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-teal-200/90 block leading-tight">
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
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20 shadow-2xs"
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
        <div className="space-y-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-700" />
              <span className="text-xs font-bold text-slate-800 tracking-wide">
                {t('anamnesisModelTitle')}
              </span>
            </div>
            <span className="text-[11px] font-medium text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/80">
              {t('repertoriumClearAuditNotice')}
            </span>
          </div>

          {/* Chief complaint banner */}
          <div className="p-3 bg-teal-50/50 border border-teal-200/80 rounded-xl flex items-start gap-2.5">
            <Quote className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-teal-950 uppercase tracking-wider">
                  {t('repertoriumPillarChiefComplaint')}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-full border border-teal-200/80">
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
                <div className="p-3.5 bg-teal-50/50 text-slate-800 rounded-xl border border-teal-200/80 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                      <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                      <span>{t('anamnesisNeedsTitle')}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100/80 text-teal-900 border border-teal-200">
                      {needsAnalysis.missingNeeds.length} {t('anamnesisNeedsMissingTitle')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 italic leading-snug">
                    &bdquo;{needsAnalysis.nextRecommendedQuestionText}&ldquo;
                  </p>
                  {needsAnalysis.highestPriorityNeed && (
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-teal-200/60 flex-wrap">
                      <span className="text-[11px] text-teal-800 font-medium">
                        {needsAnalysis.highestPriorityNeed.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const targetPillar = needsAnalysis.highestPriorityNeed!.pillar;
                          const targetStep = 
                            targetPillar === 'location' ? 1 :
                            targetPillar === 'sensation' ? 2 :
                            targetPillar === 'modalities' ? 4 : 6;
                          handleOpenWizard(targetStep);
                        }}
                        className="px-3 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-xs border border-teal-800"
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
              <div className="p-2.5 bg-teal-50/60 border border-teal-200/80 text-teal-950 rounded-xl flex items-center justify-between gap-2 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>{t('repertoriumAllPillarsAuditNotice')}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200">
                  {t('repertoriumStatusComplete')}
                </span>
              </div>
            );
          })()}

          {/* DIE 4 SÄULEN DER HOMÖOPATHIE: 1. WO, 2. WAS, 3. WANN/WODURCH, 4. WAS NOCH */}
          <div className="space-y-3">
            
            {/* 1. Säule 1 – WO? (Lokalisation & Seitigkeit) */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-700" />
                  {t('anamnesisStepPillarWO')}
                </span>
                <div className="flex items-center gap-1.5">
                  {symptom.location?.trim() ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80">
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
                    className="text-slate-400 hover:text-teal-700 p-1 rounded-md transition-colors cursor-pointer"
                    title={t('anamnesisEditInWizard')}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {symptom.location?.trim() ? (
                <div className="text-xs text-slate-800 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  {symptom.location}
                  {symptom.locationQuote && (
                    <span className="block text-[11px] text-teal-900 italic font-normal mt-1">
                      &bdquo;{symptom.locationQuote}&ldquo;
                    </span>
                  )}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setExpandedPillar(expandedPillar === 'loc' ? null : 'loc')}
                className="text-[10.5px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer pt-0.5"
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
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-300 text-slate-900 outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              )}
            </div>

            {/* 2. Säule 2 – WAS? (Empfindung & Schmerzcharakter) */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-teal-700" />
                  {t('anamnesisStepPillarWAS')}
                </span>
                <div className="flex items-center gap-1.5">
                  {symptom.sensation?.trim() ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80">
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
                    className="text-slate-400 hover:text-teal-700 p-1 rounded-md transition-colors cursor-pointer"
                    title={t('anamnesisEditInWizard')}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {symptom.sensation?.trim() ? (
                <div className="text-xs text-slate-800 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  {symptom.sensation}
                  {symptom.sensationQuote && (
                    <span className="block text-[11px] text-teal-900 italic font-normal mt-1">
                      &bdquo;{symptom.sensationQuote}&ldquo;
                    </span>
                  )}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setExpandedPillar(expandedPillar === 'sens' ? null : 'sens')}
                className="text-[10.5px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer pt-0.5"
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
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-300 text-slate-900 outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              )}
            </div>

            {/* 3. Säule 3 – WANN / WODURCH? (Modalitäten & Causa) */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-teal-700" />
                  {t('anamnesisStepPillarWANN')}
                </span>
                <div className="flex items-center gap-1.5">
                  {(symptom.modalities?.trim() || symptom.causaEvent?.trim()) ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80">
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
                    className="text-slate-400 hover:text-teal-700 p-1 rounded-md transition-colors cursor-pointer"
                    title={t('anamnesisEditInWizard')}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Modalities Content */}
              {symptom.modalities?.trim() ? (
                <div className="text-xs text-slate-800 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <div>
                    <span className="text-[11px] font-bold text-slate-900 block">{t('symptomModalitiesLabel')}:</span>
                    <span>{symptom.modalities}</span>
                  </div>
                  {symptom.modalitiesQuote && (
                    <span className="block text-[11px] text-teal-900 italic font-normal mt-1">
                      &bdquo;{symptom.modalitiesQuote}&ldquo;
                    </span>
                  )}
                </div>
              ) : null}

              {/* Causa & Auslöser Content within Pillar 3 */}
              {symptom.causaEvent?.trim() ? (
                <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span className="font-semibold text-slate-900">{t('symptomCausaEventLabel')}:</span>
                    <span className="font-medium text-slate-800">{symptom.causaEvent}</span>
                  </div>
                  {symptom.causaQuote && (
                    <div className="text-[11px] text-teal-900 italic">
                      &bdquo;{symptom.causaQuote}&ldquo;
                    </div>
                  )}
                  {symptom.causaTemporal && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span className="font-medium">{t('symptomCausaTemporalLabel')}:</span>
                      <span>{symptom.causaTemporal}</span>
                    </div>
                  )}
                  {symptom.causaEffect && (
                    <div className="text-[11px] font-medium pt-0.5">
                      <span className="text-slate-600">{t('symptomCausaEffectLabel')}: </span>
                      <span className={symptom.causaEffect === 'worse' ? 'text-rose-700 font-bold' : symptom.causaEffect === 'better' ? 'text-teal-700 font-bold' : 'text-slate-700'}>
                        {symptom.causaEffect === 'worse' ? t('repertoriumCausaEffectWorse') : symptom.causaEffect === 'better' ? t('repertoriumCausaEffectBetter') : t('repertoriumCausaEffectUnchanged')}
                      </span>
                    </div>
                  )}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setExpandedPillar(expandedPillar === 'mod' ? null : 'mod')}
                className="text-[10.5px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer pt-0.5"
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
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-300 text-slate-900 outline-none focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-bold text-slate-700 block mb-1">{t('symptomCausaEventLabel')} ({t('anamnesisStepPillarCAUSA')})</label>
                    <input
                      type="text"
                      value={symptom.causaEvent || ''}
                      onChange={(e) => handleDirectFieldUpdate('causaEvent', e.target.value)}
                      placeholder={t('symptomCausaEventPlaceholder')}
                      className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-300 text-slate-900 outline-none focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Säule 4 – WAS NOCH? (Begleitsymptome & Gemüt) */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-teal-700" />
                  {t('anamnesisStepPillarWASNOCH')}
                </span>
                <div className="flex items-center gap-1.5">
                  {symptom.concomitants?.trim() ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80">
                      {t('repertoriumStatusConfirmed')}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium italic">
                      {t('anamnesisPillarEmptyNotice')}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenWizard(6)}
                    className="text-slate-400 hover:text-teal-700 p-1 rounded-md transition-colors cursor-pointer"
                    title={t('anamnesisEditInWizard')}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {symptom.concomitants?.trim() ? (
                <div className="text-xs text-slate-800 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  {symptom.concomitants}
                  {symptom.concomitantsQuote && (
                    <span className="block text-[11px] text-teal-900 italic font-normal mt-1">
                      &bdquo;{symptom.concomitantsQuote}&ldquo;
                    </span>
                  )}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setExpandedPillar(expandedPillar === 'concom' ? null : 'concom')}
                className="text-[10.5px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer pt-0.5"
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
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-300 text-slate-900 outline-none focus:ring-1 focus:ring-teal-600"
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
